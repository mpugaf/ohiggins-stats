import pandas as pd
import mysql.connector
from mysql.connector import Error
import csv
import logging
from datetime import datetime
import os
import sys

# Configuración de logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('pipeline_jugadores.log'),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

class DatabaseConnection:
    """Clase para manejar la conexión a la base de datos"""
    
    def __init__(self, host, database, user, password, port=3306):
        self.host = host
        self.database = database
        self.user = user
        self.password = password
        self.port = port
        self.connection = None
        self.cursor = None
    
    def connect(self):
        """Establece la conexión a la base de datos"""
        try:
            self.connection = mysql.connector.connect(
                host=self.host,
                database=self.database,
                user=self.user,
                password=self.password,
                port=self.port,
                charset='utf8mb4',
                # collation='utf8mb4_general_ci'
            )
            
            if self.connection.is_connected():
                self.cursor = self.connection.cursor()
                logger.info(f"✅ Conexión exitosa a la base de datos: {self.database}")
                return True
                
        except Error as e:
            logger.error(f"❌ Error al conectar a la base de datos: {e}")
            return False
    
    def disconnect(self):
        """Cierra la conexión a la base de datos"""
        if self.connection and self.connection.is_connected():
            self.cursor.close()
            self.connection.close()
            logger.info("🔌 Conexión a la base de datos cerrada")
    
    def execute_query(self, query, params=None, fetch=False):
        """Ejecuta una consulta SQL"""
        try:
            if params:
                self.cursor.execute(query, params)
            else:
                self.cursor.execute(query)
            
            if fetch:
                return self.cursor.fetchall()
            else:
                self.connection.commit()
                return self.cursor.rowcount
                
        except Error as e:
            logger.error(f"❌ Error ejecutando consulta: {e}")
            logger.error(f"Query: {query}")
            if params:
                logger.error(f"Params: {params}")
            self.connection.rollback()
            raise e

class PlayerDataPipeline:
    """Pipeline para procesar y cargar datos de jugadores"""
    
    def __init__(self, db_connection):
        self.db = db_connection
        self.stats = {
            'players_processed': 0,
            'players_inserted': 0,
            'players_updated': 0,
            'countries_inserted': 0,
            'positions_processed': 0,
            'errors': 0
        }
    
    def load_csv_data(self, csv_file_path):
        """Carga los datos del archivo CSV"""
        try:
            logger.info(f"📂 Cargando datos desde: {csv_file_path}")
            
            # Leer CSV con pandas para mejor manejo de encoding
            df = pd.read_csv(csv_file_path, encoding='utf-8')
            
            # Convertir NaN a None para MySQL
            df = df.where(pd.notna(df), None)
            
            logger.info(f"📊 Datos cargados: {len(df)} registros encontrados")
            logger.info(f"📋 Columnas disponibles: {list(df.columns)}")
            
            return df.to_dict('records')
            
        except Exception as e:
            logger.error(f"❌ Error cargando CSV: {e}")
            raise e
    
    def clean_and_validate_data(self, players_data):
        """Limpia y valida los datos de jugadores"""
        logger.info("🧹 Iniciando limpieza y validación de datos...")
        
        cleaned_players = []
        
        for i, player in enumerate(players_data):
            try:
                # Validar campos obligatorios
                if not player.get('player_id_fbr'):
                    logger.warning(f"⚠️ Registro {i+1}: Sin player_id_fbr, omitiendo...")
                    continue
                
                if not player.get('nombre_completo') and not player.get('nombre_roster'):
                    logger.warning(f"⚠️ Registro {i+1}: Sin nombre, omitiendo...")
                    continue
                
                # Limpiar y normalizar datos
                cleaned_player = {
                    'player_id_fbr': str(player.get('player_id_fbr', '')).strip(),
                    'nombre_completo': self._clean_text(player.get('nombre_completo') or player.get('nombre_roster', '')),
                    'apodo': self._clean_text(player.get('apodo')),
                    'fecha_nacimiento': self._clean_date(player.get('fecha_nacimiento')),
                    'altura_cm': self._clean_decimal(player.get('altura_cm')),
                    'peso_kg': self._clean_decimal(player.get('peso_kg')),
                    'pie_dominante': self._clean_foot(player.get('pie_dominante')),
                    'ciudad_nacimiento': self._clean_text(player.get('ciudad_nacimiento')),
                    'salario': self._clean_text(player.get('salario')),
                    'url_foto': self._clean_text(player.get('url_foto')),
                    'nacionalidad_codigo': self._clean_country_code(player.get('nacionalidad_codigo')),
                    'posicion_roster': self._clean_text(player.get('posicion_roster')),
                    'posiciones_detalladas': self._clean_text(player.get('posiciones_detalladas')),
                    'pais_nacimiento': self._clean_text(player.get('pais_nacimiento'))
                }
                
                cleaned_players.append(cleaned_player)
                
            except Exception as e:
                logger.error(f"❌ Error procesando jugador {i+1}: {e}")
                self.stats['errors'] += 1
        
        logger.info(f"✅ Datos limpiados: {len(cleaned_players)} jugadores válidos")
        return cleaned_players
    
    def _clean_text(self, text):
        """Limpia y normaliza texto"""
        if text is None or pd.isna(text):
            return None
        return str(text).strip().upper() if str(text).strip() else None
    
    def _clean_date(self, date_str):
        """Limpia y valida fechas"""
        if date_str is None or pd.isna(date_str):
            return None
        
        try:
            # Intentar parsear diferentes formatos de fecha
            date_str = str(date_str).strip()
            if date_str and date_str != 'N/A':
                # Formato YYYY-MM-DD
                datetime.strptime(date_str, '%Y-%m-%d')
                return date_str
        except:
            pass
        
        return None
    
    def _clean_decimal(self, value):
        """Limpia y valida valores decimales"""
        if value is None or pd.isna(value):
            return None
        
        try:
            return float(value) if str(value).strip() and str(value) != 'N/A' else None
        except:
            return None
    
    def _clean_foot(self, foot):
        """Normaliza información del pie dominante"""
        if foot is None or pd.isna(foot):
            return None
        
        foot = str(foot).strip().upper()
        if foot in ['LEFT', 'IZQUIERDO', 'L']:
            return 'LEFT'
        elif foot in ['RIGHT', 'DERECHO', 'R']:
            return 'RIGHT'
        elif foot in ['BOTH', 'AMBOS', 'AMBIDIESTRO']:
            return 'BOTH'
        
        return None
    
    def _clean_country_code(self, code):
        """Limpia códigos de país"""
        if code is None or pd.isna(code):
            return None
        
        code = str(code).strip().upper()
        return code if len(code) == 3 else None
    
    def process_countries(self, players_data):
        """Procesa y carga países únicos"""
        logger.info("🌍 Procesando países...")
        
        # Extraer códigos de país únicos
        country_codes = set()
        for player in players_data:
            if player.get('nacionalidad_codigo'):
                country_codes.add(player['nacionalidad_codigo'])
        
        # Insertar países que no existen
        for code in country_codes:
            try:
                # Verificar si el país ya existe
                check_query = "SELECT ID_PAIS FROM DIM_PAIS WHERE CODIGO_FIFA = %s"
                result = self.db.execute_query(check_query, (code,), fetch=True)
                
                if not result:
                    # Insertar nuevo país
                    insert_query = """
                        INSERT INTO DIM_PAIS (CODIGO_FIFA, NOMBRE, CONTINENTE) 
                        VALUES (%s, %s, 'DESCONOCIDO')
                    """
                    self.db.execute_query(insert_query, (code, code))
                    self.stats['countries_inserted'] += 1
                    logger.info(f"🆕 País insertado: {code}")
                
            except Exception as e:
                logger.error(f"❌ Error procesando país {code}: {e}")
                self.stats['errors'] += 1
    
    def process_positions(self, players_data):
        """Procesa posiciones únicas"""
        logger.info("⚽ Procesando posiciones...")
        
        # Extraer posiciones únicas
        positions = set()
        for player in players_data:
            if player.get('posicion_roster'):
                positions.add(player['posicion_roster'])
        
        # Verificar que las posiciones existan
        for pos in positions:
            try:
                check_query = "SELECT ID_POSICION FROM DIM_POSICION WHERE CODIGO_POSICION = %s"
                result = self.db.execute_query(check_query, (pos,), fetch=True)
                
                if not result:
                    logger.warning(f"⚠️ Posición no encontrada en catálogo: {pos}")
                else:
                    self.stats['positions_processed'] += 1
                
            except Exception as e:
                logger.error(f"❌ Error verificando posición {pos}: {e}")
    
    def process_players(self, players_data):
        """Procesa y carga jugadores"""
        logger.info("👨‍💼 Procesando jugadores...")
        
        for player in players_data:
            try:
                self.stats['players_processed'] += 1
                
                # Verificar si el jugador ya existe
                check_query = "SELECT ID_JUGADOR FROM DIM_JUGADOR WHERE PLAYER_ID_FBR = %s"
                existing = self.db.execute_query(check_query, (player['player_id_fbr'],), fetch=True)
                
                if existing:
                    # Actualizar jugador existente
                    self._update_player(player)
                    self.stats['players_updated'] += 1
                else:
                    # Insertar nuevo jugador
                    self._insert_player(player)
                    self.stats['players_inserted'] += 1
                
                # Procesar relaciones del jugador
                self._process_player_relations(player)
                
            except Exception as e:
                logger.error(f"❌ Error procesando jugador {player.get('player_id_fbr', 'UNKNOWN')}: {e}")
                self.stats['errors'] += 1
    
    def _insert_player(self, player):
        """Inserta un nuevo jugador"""
        insert_query = """
            INSERT INTO DIM_JUGADOR (
                PLAYER_ID_FBR, NOMBRE_COMPLETO, APODO, FECHA_NACIMIENTO,
                ALTURA_CM, PESO_KG, PIE_DOMINANTE, CIUDAD_NACIMIENTO,
                SALARIO, URL_FOTO, ACTIVO
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, 1)
        """
        
        params = (
            player['player_id_fbr'],
            player['nombre_completo'],
            player['apodo'],
            player['fecha_nacimiento'],
            player['altura_cm'],
            player['peso_kg'],
            player['pie_dominante'],
            player['ciudad_nacimiento'],
            player['salario'],
            player['url_foto']
        )
        
        self.db.execute_query(insert_query, params)
        logger.info(f"✅ Jugador insertado: {player['nombre_completo']} ({player['player_id_fbr']})")
    
    def _update_player(self, player):
        """Actualiza un jugador existente"""
        update_query = """
            UPDATE DIM_JUGADOR SET
                NOMBRE_COMPLETO = %s, APODO = %s, FECHA_NACIMIENTO = %s,
                ALTURA_CM = %s, PESO_KG = %s, PIE_DOMINANTE = %s,
                CIUDAD_NACIMIENTO = %s, SALARIO = %s, URL_FOTO = %s,
                FECHA_ACTUALIZACION = CURRENT_TIMESTAMP
            WHERE PLAYER_ID_FBR = %s
        """
        
        params = (
            player['nombre_completo'],
            player['apodo'],
            player['fecha_nacimiento'],
            player['altura_cm'],
            player['peso_kg'],
            player['pie_dominante'],
            player['ciudad_nacimiento'],
            player['salario'],
            player['url_foto'],
            player['player_id_fbr']
        )
        
        self.db.execute_query(update_query, params)
        logger.info(f"🔄 Jugador actualizado: {player['nombre_completo']} ({player['player_id_fbr']})")
    
    def _process_player_relations(self, player):
        """Procesa las relaciones del jugador (país y posición)"""
        
        # Relación jugador-país
        if player.get('nacionalidad_codigo'):
            try:
                # Obtener ID del país
                country_query = "SELECT ID_PAIS FROM DIM_PAIS WHERE CODIGO_FIFA = %s"
                country_result = self.db.execute_query(country_query, (player['nacionalidad_codigo'],), fetch=True)
                
                if country_result:
                    country_id = country_result[0][0]
                    
                    # Verificar si la relación ya existe
                    rel_check = """
                        SELECT 1 FROM DIM_JUGADOR_PAIS 
                        WHERE PLAYER_ID_FBR = %s AND ID_PAIS = %s AND TIPO_RELACION = 'NACIONALIDAD'
                    """
                    existing_rel = self.db.execute_query(rel_check, (player['player_id_fbr'], country_id), fetch=True)
                    
                    if not existing_rel:
                        # Insertar relación jugador-país
                        rel_insert = """
                            INSERT INTO DIM_JUGADOR_PAIS (PLAYER_ID_FBR, ID_PAIS, TIPO_RELACION)
                            VALUES (%s, %s, 'NACIONALIDAD')
                        """
                        self.db.execute_query(rel_insert, (player['player_id_fbr'], country_id))
                        
            except Exception as e:
                logger.error(f"❌ Error procesando relación país para {player['player_id_fbr']}: {e}")
        
        # Relación jugador-posición
        if player.get('posicion_roster'):
            try:
                # Obtener ID de la posición
                pos_query = "SELECT ID_POSICION FROM DIM_POSICION WHERE CODIGO_POSICION = %s"
                pos_result = self.db.execute_query(pos_query, (player['posicion_roster'],), fetch=True)
                
                if pos_result:
                    pos_id = pos_result[0][0]
                    
                    # Verificar si la relación ya existe
                    rel_check = """
                        SELECT 1 FROM DIM_JUGADOR_POSICION 
                        WHERE PLAYER_ID_FBR = %s AND ID_POSICION = %s
                    """
                    existing_rel = self.db.execute_query(rel_check, (player['player_id_fbr'], pos_id), fetch=True)
                    
                    if not existing_rel:
                        # Insertar relación jugador-posición
                        rel_insert = """
                            INSERT INTO DIM_JUGADOR_POSICION (PLAYER_ID_FBR, ID_POSICION, ES_POSICION_PRINCIPAL, ORDEN_PREFERENCIA)
                            VALUES (%s, %s, 1, 1)
                        """
                        self.db.execute_query(rel_insert, (player['player_id_fbr'], pos_id))
                        
            except Exception as e:
                logger.error(f"❌ Error procesando relación posición para {player['player_id_fbr']}: {e}")
    
    def run_pipeline(self, csv_file_path):
        """Ejecuta el pipeline completo"""
        logger.info("🚀 Iniciando pipeline de carga de jugadores...")
        
        try:
            # 1. Cargar datos del CSV
            players_data = self.load_csv_data(csv_file_path)
            
            # 2. Limpiar y validar datos
            clean_players = self.clean_and_validate_data(players_data)
            
            if not clean_players:
                logger.error("❌ No hay datos válidos para procesar")
                return False
            
            # 3. Procesar países
            self.process_countries(clean_players)
            
            # 4. Procesar posiciones
            self.process_positions(clean_players)
            
            # 5. Procesar jugadores
            self.process_players(clean_players)
            
            # 6. Mostrar estadísticas finales
            self._show_final_stats()
            
            logger.info("✅ Pipeline completado exitosamente")
            return True
            
        except Exception as e:
            logger.error(f"❌ Error en el pipeline: {e}")
            return False
    
    def _show_final_stats(self):
        """Muestra estadísticas finales del procesamiento"""
        logger.info("📊 ESTADÍSTICAS FINALES:")
        logger.info(f"   👨‍💼 Jugadores procesados: {self.stats['players_processed']}")
        logger.info(f"   ✅ Jugadores insertados: {self.stats['players_inserted']}")
        logger.info(f"   🔄 Jugadores actualizados: {self.stats['players_updated']}")
        logger.info(f"   🌍 Países insertados: {self.stats['countries_inserted']}")
        logger.info(f"   ⚽ Posiciones procesadas: {self.stats['positions_processed']}")
        logger.info(f"   ❌ Errores: {self.stats['errors']}")

def main():
    """Función principal"""
    
    # Configuración de la base de datos
    DB_CONFIG = {
        'host': 'localhost',
        'database': 'OHIGGINS_STATS_DB',
        'user': 'root',  # Cambiar según configuración
        'password': '',  # Cambiar según configuración
        'port': 3306
    }
    
    # Archivo CSV a procesar
    CSV_FILE = 'team_5049d576_players_20250603_040149.csv'
    
    # Verificar que el archivo existe
    if not os.path.exists(CSV_FILE):
        logger.error(f"❌ Archivo CSV no encontrado: {CSV_FILE}")
        return
    
    # Crear conexión a la base de datos
    db = DatabaseConnection(**DB_CONFIG)
    
    try:
        # Conectar a la base de datos
        if not db.connect():
            logger.error("❌ No se pudo establecer conexión con la base de datos")
            return
        
        # Crear y ejecutar pipeline
        pipeline = PlayerDataPipeline(db)
        success = pipeline.run_pipeline(CSV_FILE)
        
        if success:
            logger.info("🎉 Proceso completado exitosamente")
        else:
            logger.error("❌ El proceso falló")
            
    except Exception as e:
        logger.error(f"❌ Error crítico: {e}")
        
    finally:
        # Cerrar conexión
        db.disconnect()

if __name__ == "__main__":
    main()