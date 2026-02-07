import mysql.connector
from mysql.connector import Error
import logging
from datetime import datetime

# Configuración de logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('populate_jugador_relations.log'),
        logging.StreamHandler()
    ]
)

class JugadorRelationsPopulator:
    def __init__(self, host, database, user, password, port=3306):
        """Inicializar conexión a la base de datos"""
        self.host = host
        self.database = database
        self.user = user
        self.password = password
        self.port = port
        self.connection = None
    
    def connect(self):
        """Establecer conexión con la base de datos"""
        try:
            self.connection = mysql.connector.connect(
                host=self.host,
                database=self.database,
                user=self.user,
                password=self.password,
                port=self.port,
                charset='utf8mb4',
                collation='utf8mb4_general_ci'
            )
            if self.connection.is_connected():
                logging.info(f"Conexión exitosa a la base de datos {self.database}")
                return True
        except Error as e:
            logging.error(f"Error al conectar a la base de datos: {e}")
            return False
    
    def disconnect(self):
        """Cerrar conexión con la base de datos"""
        if self.connection and self.connection.is_connected():
            self.connection.close()
            logging.info("Conexión cerrada")
    
    def get_pais_id_by_codigo(self, codigo_pais):
        """Obtener ID_PAIS basado en el código de país"""
        try:
            cursor = self.connection.cursor()
            query = "SELECT ID_PAIS FROM DIM_PAIS WHERE CODIGO_FIFA = %s"
            cursor.execute(query, (codigo_pais,))
            result = cursor.fetchone()
            cursor.close()
            return result[0] if result else None
        except Error as e:
            logging.error(f"Error al obtener ID del país {codigo_pais}: {e}")
            return None
    
    def get_posicion_id_by_codigo(self, codigo_posicion):
        """Obtener ID_POSICION basado en el código de posición"""
        try:
            cursor = self.connection.cursor()
            query = "SELECT ID_POSICION FROM DIM_POSICION WHERE CODIGO_POSICION = %s"
            cursor.execute(query, (codigo_posicion,))
            result = cursor.fetchone()
            cursor.close()
            return result[0] if result else None
        except Error as e:
            logging.error(f"Error al obtener ID de la posición {codigo_posicion}: {e}")
            return None
    
    def get_available_positions(self):
        """Obtener todas las posiciones disponibles en DIM_POSICION"""
        try:
            cursor = self.connection.cursor()
            cursor.execute("SELECT CODIGO_POSICION FROM DIM_POSICION")
            results = cursor.fetchall()
            cursor.close()
            return {row[0] for row in results}
        except Error as e:
            logging.error(f"Error al obtener posiciones disponibles: {e}")
            return set()
    
    def exists_jugador_pais(self, player_id_fbr, id_pais):
        """Verificar si ya existe la relación jugador-país"""
        try:
            cursor = self.connection.cursor()
            query = "SELECT COUNT(*) FROM DIM_JUGADOR_PAIS WHERE PLAYER_ID_FBR = %s AND ID_PAIS = %s"
            cursor.execute(query, (player_id_fbr, id_pais))
            result = cursor.fetchone()
            cursor.close()
            return result[0] > 0
        except Error as e:
            logging.error(f"Error al verificar existencia jugador-país: {e}")
            return True
    
    def exists_jugador_posicion(self, player_id_fbr, id_posicion):
        """Verificar si ya existe la relación jugador-posición"""
        try:
            cursor = self.connection.cursor()
            query = "SELECT COUNT(*) FROM DIM_JUGADOR_POSICION WHERE PLAYER_ID_FBR = %s AND ID_POSICION = %s"
            cursor.execute(query, (player_id_fbr, id_posicion))
            result = cursor.fetchone()
            cursor.close()
            return result[0] > 0
        except Error as e:
            logging.error(f"Error al verificar existencia jugador-posición: {e}")
            return True
    
    def insert_jugador_pais(self, player_id_fbr, id_pais):
        """Insertar relación jugador-país"""
        try:
            cursor = self.connection.cursor()
            query = "INSERT INTO DIM_JUGADOR_PAIS (PLAYER_ID_FBR, ID_PAIS) VALUES (%s, %s)"
            cursor.execute(query, (player_id_fbr, id_pais))
            self.connection.commit()
            cursor.close()
            return True
        except Error as e:
            logging.error(f"Error al insertar jugador-país: {e}")
            self.connection.rollback()
            return False
    
    def insert_jugador_posicion(self, player_id_fbr, id_posicion, es_principal=False, orden=None):
        """Insertar relación jugador-posición"""
        try:
            cursor = self.connection.cursor()
            query = """
                INSERT INTO DIM_JUGADOR_POSICION 
                (PLAYER_ID_FBR, ID_POSICION, ES_POSICION_PRINCIPAL, ORDEN_PREFERENCIA)
                VALUES (%s, %s, %s, %s)
            """
            cursor.execute(query, (player_id_fbr, id_posicion, es_principal, orden))
            self.connection.commit()
            cursor.close()
            return True
        except Error as e:
            logging.error(f"Error al insertar jugador-posición: {e}")
            self.connection.rollback()
            return False
    
    def get_players_data(self):
        """Obtener datos de jugadores para procesar relaciones"""
        try:
            cursor = self.connection.cursor()
            query = """
                SELECT DISTINCT
                    cpi.player_id_fbr,
                    cpi.nacionalidad_codigo,
                    cpi.posicion_roster,
                    cpi.posiciones_detalladas,
                    cpi.nombre_completo
                FROM CHILEAN_PLAYERS_IMPORT cpi
                INNER JOIN DIM_JUGADOR dj ON cpi.player_id_fbr = dj.PLAYER_ID_FBR
                WHERE cpi.player_id_fbr IS NOT NULL 
                AND cpi.player_id_fbr != ''
            """
            cursor.execute(query)
            results = cursor.fetchall()
            cursor.close()
            
            logging.info(f"Se encontraron {len(results)} jugadores para procesar")
            return results
        except Error as e:
            logging.error(f"Error al obtener datos de jugadores: {e}")
            return []
    
    def parse_posiciones(self, posicion_roster, posiciones_detalladas, available_positions):
        """Parsear las posiciones de un jugador"""
        posiciones = set()
        
        def clean_and_split(pos_string):
            if not pos_string or pos_string.strip() == '':
                return []
            
            # Reemplazar separadores por comas
            cleaned = pos_string.replace(';', ',').replace('/', ',').replace(' and ', ',').replace(' & ', ',')
            
            # Dividir y limpiar
            positions = []
            for pos in cleaned.split(','):
                pos = pos.strip().upper()
                if pos and pos in available_positions:
                    positions.append(pos)
            return positions
        
        # Procesar ambas fuentes de posiciones
        if posicion_roster:
            posiciones.update(clean_and_split(posicion_roster))
        
        if posiciones_detalladas:
            posiciones.update(clean_and_split(posiciones_detalladas))
        
        return list(posiciones)
    
    def populate_jugador_pais(self):
        """Poblar tabla DIM_JUGADOR_PAIS"""
        logging.info("="*60)
        logging.info("POBLANDO DIM_JUGADOR_PAIS")
        logging.info("="*60)
        
        players_data = self.get_players_data()
        success_count = 0
        error_count = 0
        skipped_count = 0
        
        for player_data in players_data:
            player_id_fbr = player_data[0]
            nacionalidad_codigo = player_data[1]
            nombre_jugador = player_data[4]
            
            if not nacionalidad_codigo or nacionalidad_codigo.strip() == '':
                logging.warning(f"Sin nacionalidad: {nombre_jugador} ({player_id_fbr})")
                skipped_count += 1
                continue
            
            # Obtener ID del país
            id_pais = self.get_pais_id_by_codigo(nacionalidad_codigo.strip().upper())
            
            if not id_pais:
                logging.error(f"País no encontrado {nacionalidad_codigo}: {nombre_jugador}")
                error_count += 1
                continue
            
            # Verificar si ya existe
            if self.exists_jugador_pais(player_id_fbr, id_pais):
                skipped_count += 1
                continue
            
            # Insertar
            if self.insert_jugador_pais(player_id_fbr, id_pais):
                logging.info(f"✅ {nombre_jugador} → {nacionalidad_codigo}")
                success_count += 1
            else:
                logging.error(f"❌ Error: {nombre_jugador} → {nacionalidad_codigo}")
                error_count += 1
        
        logging.info(f"""
RESUMEN DIM_JUGADOR_PAIS:
├─ Insertados: {success_count}
├─ Ya existían: {skipped_count}
├─ Errores: {error_count}
└─ Total: {len(players_data)}
        """)
        
        return success_count, skipped_count, error_count
    
    def populate_jugador_posicion(self):
        """Poblar tabla DIM_JUGADOR_POSICION"""
        logging.info("="*60)
        logging.info("POBLANDO DIM_JUGADOR_POSICION")
        logging.info("="*60)
        
        players_data = self.get_players_data()
        available_positions = self.get_available_positions()
        
        logging.info(f"Posiciones disponibles: {sorted(available_positions)}")
        
        success_count = 0
        error_count = 0
        skipped_count = 0
        
        for player_data in players_data:
            player_id_fbr = player_data[0]
            posicion_roster = player_data[2]
            posiciones_detalladas = player_data[3]
            nombre_jugador = player_data[4]
            
            # Parsear posiciones
            posiciones = self.parse_posiciones(posicion_roster, posiciones_detalladas, available_positions)
            
            if not posiciones:
                logging.warning(f"Sin posiciones válidas: {nombre_jugador}")
                skipped_count += 1
                continue
            
            # Procesar cada posición
            for i, posicion_codigo in enumerate(posiciones):
                id_posicion = self.get_posicion_id_by_codigo(posicion_codigo)
                
                if not id_posicion:
                    logging.error(f"Posición no encontrada {posicion_codigo}: {nombre_jugador}")
                    error_count += 1
                    continue
                
                # Verificar si ya existe
                if self.exists_jugador_posicion(player_id_fbr, id_posicion):
                    skipped_count += 1
                    continue
                
                # Insertar (primera posición = principal)
                es_principal = (i == 0)
                orden_preferencia = i + 1
                
                if self.insert_jugador_posicion(player_id_fbr, id_posicion, es_principal, orden_preferencia):
                    principal_mark = " (Principal)" if es_principal else ""
                    logging.info(f"✅ {nombre_jugador} → {posicion_codigo}{principal_mark}")
                    success_count += 1
                else:
                    logging.error(f"❌ Error: {nombre_jugador} → {posicion_codigo}")
                    error_count += 1
        
        logging.info(f"""
RESUMEN DIM_JUGADOR_POSICION:
├─ Insertados: {success_count}
├─ Ya existían: {skipped_count}
├─ Errores: {error_count}
└─ Total jugadores: {len(players_data)}
        """)
        
        return success_count, skipped_count, error_count
    
    def run_population(self):
        """Ejecutar población de relaciones de jugadores"""
        if not self.connect():
            return False
        
        try:
            start_time = datetime.now()
            
            logging.info("🚀 INICIANDO POBLACIÓN DE RELACIONES DE JUGADORES")
            
            # Poblar nacionalidades
            pais_success, pais_skipped, pais_errors = self.populate_jugador_pais()
            
            # Poblar posiciones
            pos_success, pos_skipped, pos_errors = self.populate_jugador_posicion()
            
            end_time = datetime.now()
            duration = end_time - start_time
            
            logging.info("="*60)
            logging.info("✅ PROCESO COMPLETADO")
            logging.info("="*60)
            logging.info(f"⏱️  Duración: {duration}")
            logging.info(f"""
📊 RESUMEN GENERAL:

DIM_JUGADOR_PAIS (Nacionalidades):
├─ Nuevos registros: {pais_success}
├─ Ya existían: {pais_skipped}
└─ Errores: {pais_errors}

DIM_JUGADOR_POSICION (Posiciones):
├─ Nuevos registros: {pos_success}
├─ Ya existían: {pos_skipped}
└─ Errores: {pos_errors}

🎯 Total insertado: {pais_success + pos_success} relaciones
            """)
            
            return True
            
        except Exception as e:
            logging.error(f"Error durante el proceso: {e}")
            return False
        finally:
            self.disconnect()


def main():
    """Función principal"""
    # Configuración de la base de datos
    DB_CONFIG = {
        'host': '192.168.100.16',
        'database': 'MP_DATA_DEV',
        'user': 'mpuga',
        'password': '123qweasd',
        'port': 3306
    }
    
    print("🔄 ACTUALIZACIÓN DE RELACIONES DE JUGADORES")
    print("="*60)
    print("Este script actualizará:")
    print("├─ DIM_JUGADOR_PAIS (nacionalidades)")
    print("└─ DIM_JUGADOR_POSICION (posiciones)")
    print()
    print("📋 Fuente: CHILEAN_PLAYERS_IMPORT")
    print("🔍 Solo procesa registros nuevos (evita duplicados)")
    print("="*60)
    
    confirm = input("¿Continuar? (s/n): ").lower().strip()
    if confirm != 's':
        print("❌ Proceso cancelado")
        return
    
    # Ejecutar
    populator = JugadorRelationsPopulator(**DB_CONFIG)
    success = populator.run_population()
    
    if success:
        print("\n✅ Proceso completado exitosamente!")
        print("📄 Ver detalles en: populate_jugador_relations.log")
    else:
        print("\n❌ El proceso falló. Revisar logs.")


if __name__ == "__main__":
    main()