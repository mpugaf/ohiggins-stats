#!/usr/bin/env python3
"""
Data Pipeline para cargar datos de jugadores desde CSV a la base de datos
Basado en el modelo de datos actualizado y el CSV generado por getTeamPlayers.py
"""

import pandas as pd
import mysql.connector
from mysql.connector import Error
import logging
from datetime import datetime
import sys
import os

# Configurar logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('players_pipeline.log'),
        logging.StreamHandler(sys.stdout)
    ]
)

class PlayersDataPipeline:
    def __init__(self, db_config):
        """Inicializar el pipeline con configuración de base de datos"""
        self.db_config = db_config
        self.connection = None
        self.cursor = None
        
    def connect_database(self):
        """Establecer conexión con la base de datos"""
        try:
            self.connection = mysql.connector.connect(**self.db_config)
            self.cursor = self.connection.cursor()
            logging.info("✅ Conexión exitosa a la base de datos")
            return True
        except Error as e:
            logging.error(f"❌ Error conectando a la base de datos: {e}")
            return False
    
    def disconnect_database(self):
        """Cerrar conexión con la base de datos"""
        if self.cursor:
            self.cursor.close()
        if self.connection:
            self.connection.close()
        logging.info("🔌 Conexión cerrada")
    
    def load_csv_data(self, csv_file_path):
        """Cargar datos desde el archivo CSV"""
        try:
            df = pd.read_csv(csv_file_path, encoding='utf-8')
            logging.info(f"✅ CSV cargado: {len(df)} registros encontrados")
            logging.info(f"📊 Columnas: {list(df.columns)}")
            return df
        except Exception as e:
            logging.error(f"❌ Error cargando CSV: {e}")
            return None
    
    def normalize_name(self, name):
        """Normalizar nombres a mayúsculas y limpiar espacios"""
        if pd.isna(name) or name is None:
            return None
        return str(name).strip().upper()
    
    def safe_convert_date(self, date_str):
        """Convertir fecha de forma segura"""
        if pd.isna(date_str) or date_str is None or date_str == '':
            return None
        try:
            # Asumiendo formato YYYY-MM-DD
            return datetime.strptime(str(date_str), '%Y-%m-%d').date()
        except:
            logging.warning(f"⚠️ Fecha inválida: {date_str}")
            return None
    
    def safe_convert_numeric(self, value):
        """Convertir valor numérico de forma segura"""
        if pd.isna(value) or value is None or value == '':
            return None
        try:
            return float(value)
        except:
            return None
    
    def get_or_create_pais(self, codigo_fifa, nombre_completo):
        """Obtener o crear país en DIM_PAIS"""
        if not codigo_fifa:
            return None
            
        try:
            # Buscar país existente
            self.cursor.execute("SELECT ID_PAIS FROM DIM_PAIS WHERE CODIGO_FIFA = %s", (codigo_fifa,))
            result = self.cursor.fetchone()
            
            if result:
                return result[0]
            
            # Crear nuevo país
            insert_query = """
                INSERT INTO DIM_PAIS (NOMBRE, CODIGO_FIFA, NOMBRE_COMPLETO) 
                VALUES (%s, %s, %s)
            """
            self.cursor.execute(insert_query, (codigo_fifa, codigo_fifa, nombre_completo or codigo_fifa))
            self.connection.commit()
            
            pais_id = self.cursor.lastrowid
            logging.info(f"🌍 Nuevo país creado: {codigo_fifa} -> ID: {pais_id}")
            return pais_id
            
        except Error as e:
            logging.error(f"❌ Error con país {codigo_fifa}: {e}")
            return None
    
    def get_or_create_posicion(self, nombre_posicion):
        """Obtener o crear posición en DIM_POSICION"""
        if not nombre_posicion:
            return None
            
        try:
            # Buscar posición existente
            self.cursor.execute("SELECT ID_POSICION FROM DIM_POSICION WHERE NOMBRE = %s", (nombre_posicion,))
            result = self.cursor.fetchone()
            
            if result:
                return result[0]
            
            # Crear nueva posición
            descripcion = f"Posición {nombre_posicion}"
            insert_query = """
                INSERT INTO DIM_POSICION (NOMBRE, DESCRIPCION) 
                VALUES (%s, %s)
            """
            self.cursor.execute(insert_query, (nombre_posicion, descripcion))
            self.connection.commit()
            
            posicion_id = self.cursor.lastrowid
            logging.info(f"⚽ Nueva posición creada: {nombre_posicion} -> ID: {posicion_id}")
            return posicion_id
            
        except Error as e:
            logging.error(f"❌ Error con posición {nombre_posicion}: {e}")
            return None
    
    def insert_or_update_jugador(self, row):
        """Insertar o actualizar jugador en DIM_JUGADOR"""
        try:
            player_id_fbr = row.get('player_id_fbr')
            if not player_id_fbr:
                logging.warning("⚠️ Jugador sin PLAYER_ID_FBR, omitiendo")
                return None
            
            # Preparar datos del jugador
            nombre = self.normalize_name(row.get('nombre_completo') or row.get('nombre_roster'))
            if not nombre:
                logging.warning(f"⚠️ Jugador {player_id_fbr} sin nombre, omitiendo")
                return None
            
            fecha_nacimiento = self.safe_convert_date(row.get('fecha_nacimiento'))
            altura_cm = self.safe_convert_numeric(row.get('altura_cm'))
            peso_kg = self.safe_convert_numeric(row.get('peso_kg'))
            
            # Verificar si el jugador ya existe
            self.cursor.execute("SELECT ID_JUGADOR FROM DIM_JUGADOR WHERE PLAYER_ID_FBR = %s", (player_id_fbr,))
            existing = self.cursor.fetchone()
            
            if existing:
                # Actualizar jugador existente
                jugador_id = existing[0]
                update_query = """
                    UPDATE DIM_JUGADOR SET 
                        NOMBRE = %s,
                        FECHA_NACIMIENTO = %s,
                        ALTURA_CM = %s,
                        PESO_KG = %s,
                        PIE_DOMINANTE = %s,
                        CIUDAD_NACIMIENTO = %s,
                        SALARIO = %s,
                        URL_FOTO = %s
                    WHERE ID_JUGADOR = %s
                """
                self.cursor.execute(update_query, (
                    nombre,
                    fecha_nacimiento,
                    altura_cm,
                    peso_kg,
                    row.get('pie_dominante'),
                    row.get('ciudad_nacimiento'),
                    row.get('salario'),
                    row.get('url_foto'),
                    jugador_id
                ))
                logging.info(f"🔄 Jugador actualizado: {nombre} (ID: {jugador_id})")
            else:
                # Insertar nuevo jugador
                insert_query = """
                    INSERT INTO DIM_JUGADOR 
                    (PLAYER_ID_FBR, NOMBRE, FECHA_NACIMIENTO, ALTURA_CM, PESO_KG, 
                     PIE_DOMINANTE, CIUDAD_NACIMIENTO, SALARIO, URL_FOTO) 
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                """
                self.cursor.execute(insert_query, (
                    player_id_fbr,
                    nombre,
                    fecha_nacimiento,
                    altura_cm,
                    peso_kg,
                    row.get('pie_dominante'),
                    row.get('ciudad_nacimiento'),
                    row.get('salario'),
                    row.get('url_foto')
                ))
                jugador_id = self.cursor.lastrowid
                logging.info(f"➕ Nuevo jugador creado: {nombre} (ID: {jugador_id})")
            
            self.connection.commit()
            return jugador_id
            
        except Error as e:
            logging.error(f"❌ Error procesando jugador {row.get('player_id_fbr', 'UNKNOWN')}: {e}")
            return None
    
    def process_jugador_pais(self, jugador_id, codigo_fifa, nombre_pais):
        """Procesar relación jugador-país"""
        if not jugador_id or not codigo_fifa:
            return
        
        pais_id = self.get_or_create_pais(codigo_fifa, nombre_pais)
        if not pais_id:
            return
        
        try:
            # Verificar si la relación ya existe
            self.cursor.execute(
                "SELECT 1 FROM DIM_JUGADOR_PAIS WHERE ID_JUGADOR = %s AND ID_PAIS = %s", 
                (jugador_id, pais_id)
            )
            
            if not self.cursor.fetchone():
                # Insertar nueva relación
                self.cursor.execute(
                    "INSERT INTO DIM_JUGADOR_PAIS (ID_JUGADOR, ID_PAIS) VALUES (%s, %s)",
                    (jugador_id, pais_id)
                )
                logging.info(f"🌍 Relación jugador-país creada: {jugador_id} -> {codigo_fifa}")
            
            self.connection.commit()
            
        except Error as e:
            logging.error(f"❌ Error en relación jugador-país: {e}")
    
    def process_jugador_posiciones(self, jugador_id, posicion_roster, posiciones_detalladas):
        """Procesar posiciones del jugador"""
        if not jugador_id:
            return
        
        posiciones = set()
        
        # Agregar posición del roster
        if posicion_roster:
            for pos in str(posicion_roster).split(','):
                posiciones.add(pos.strip())
        
        # Agregar posiciones detalladas
        if posiciones_detalladas:
            for pos in str(posiciones_detalladas).split(','):
                posiciones.add(pos.strip())
        
        for i, posicion in enumerate(posiciones):
            if not posicion:
                continue
                
            posicion_id = self.get_or_create_posicion(posicion)
            if not posicion_id:
                continue
            
            try:
                # Verificar si la relación ya existe
                self.cursor.execute(
                    "SELECT 1 FROM DIM_JUGADOR_POSICION WHERE ID_JUGADOR = %s AND ID_POSICION = %s", 
                    (jugador_id, posicion_id)
                )
                
                if not self.cursor.fetchone():
                    # Insertar nueva relación (primera posición como principal)
                    es_principal = 1 if i == 0 else 0
                    es_roster = 1 if posicion in str(posicion_roster) else 0
                    
                    self.cursor.execute(
                        """INSERT INTO DIM_JUGADOR_POSICION 
                           (ID_JUGADOR, ID_POSICION, ES_POSICION_PRINCIPAL, ES_POSICION_ROSTER) 
                           VALUES (%s, %s, %s, %s)""",
                        (jugador_id, posicion_id, es_principal, es_roster)
                    )
                    logging.info(f"⚽ Relación jugador-posición creada: {jugador_id} -> {posicion}")
                
                self.connection.commit()
                
            except Error as e:
                logging.error(f"❌ Error en relación jugador-posición: {e}")
    
    def process_all_players(self, df):
        """Procesar todos los jugadores del DataFrame"""
        total_players = len(df)
        successful = 0
        failed = 0
        
        logging.info(f"🚀 Iniciando procesamiento de {total_players} jugadores")
        
        for index, row in df.iterrows():
            try:
                logging.info(f"📋 Procesando jugador {index + 1}/{total_players}: {row.get('nombre_completo', 'N/A')}")
                
                # 1. Insertar/actualizar jugador
                jugador_id = self.insert_or_update_jugador(row)
                
                if jugador_id:
                    # 2. Procesar relación jugador-país
                    self.process_jugador_pais(
                        jugador_id, 
                        row.get('nacionalidad_codigo'), 
                        row.get('pais_nacimiento')
                    )
                    
                    # 3. Procesar posiciones del jugador
                    self.process_jugador_posiciones(
                        jugador_id,
                        row.get('posicion_roster'),
                        row.get('posiciones_detalladas')
                    )
                    
                    successful += 1
                else:
                    failed += 1
                    
            except Exception as e:
                logging.error(f"❌ Error procesando fila {index}: {e}")
                failed += 1
        
        logging.info(f"✅ Procesamiento completado: {successful} exitosos, {failed} fallidos")
        return successful, failed
    
    def run_pipeline(self, csv_file_path):
        """Ejecutar el pipeline completo"""
        logging.info("🚀 Iniciando Data Pipeline de Jugadores")
        
        try:
            # 1. Conectar a base de datos
            if not self.connect_database():
                return False
            
            # 2. Cargar datos CSV
            df = self.load_csv_data(csv_file_path)
            if df is None:
                return False
            
            # 3. Procesar todos los jugadores
            successful, failed = self.process_all_players(df)
            
            # 4. Mostrar estadísticas finales
            logging.info(f"📊 ESTADÍSTICAS FINALES:")
            logging.info(f"   Total procesados: {len(df)}")
            logging.info(f"   Exitosos: {successful}")
            logging.info(f"   Fallidos: {failed}")
            logging.info(f"   Tasa de éxito: {(successful/len(df)*100):.1f}%")
            
            return True
            
        except Exception as e:
            logging.error(f"❌ Error en pipeline: {e}")
            return False
        finally:
            self.disconnect_database()

def main():
    """Función principal"""
    # Configuración de la base de datos
    # Intentar cargar desde archivo temporal, sino usar configuración por defecto
    try:
        from temp_db_config import DB_CONFIG
        print("✅ Configuración cargada desde archivo temporal")
    except ImportError:
        # Configuración por defecto si no existe archivo temporal
        DB_CONFIG = {
            'host': 'localhost',
            'port': 3306,
            'user': 'mpuga',
            'password': 'tu_password',  # Cambiar por tu contraseña
            'database': 'MP_DATA_DEV',
            'charset': 'utf8mb4',
            'autocommit': False
        }
        print("⚠️ Usando configuración por defecto - actualiza las credenciales")
    
    # Archivo CSV a procesar
    CSV_FILE = 'team_5049d576_players_20250603_040149.csv'
    
    # Buscar archivo CSV si no existe el específico
    if not os.path.exists(CSV_FILE):
        import glob
        csv_files = glob.glob('team_*_players_*.csv') + glob.glob('*players*.csv')
        if csv_files:
            CSV_FILE = max(csv_files, key=os.path.getctime)
            print(f"📁 Usando archivo CSV encontrado: {CSV_FILE}")
        else:
            logging.error(f"❌ Archivo CSV no encontrado: {CSV_FILE}")
            sys.exit(1)
    
    # Crear y ejecutar pipeline
    pipeline = PlayersDataPipeline(DB_CONFIG)
    
    success = pipeline.run_pipeline(CSV_FILE)
    
    if success:
        logging.info("✅ Pipeline ejecutado exitosamente")
        sys.exit(0)
    else:
        logging.error("❌ Pipeline falló")
        sys.exit(1)

if __name__ == "__main__":
    main()