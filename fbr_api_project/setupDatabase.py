import mysql.connector
from mysql.connector import Error
import logging
import sys
import os

# Configuración de logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('setup_database.log'),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

class DatabaseSetup:
    """Clase para configurar la base de datos desde cero"""
    
    def __init__(self, host, user, password, port=3306):
        self.host = host
        self.user = user
        self.password = password
        self.port = port
        self.connection = None
        self.cursor = None
    
    def connect_without_db(self):
        """Conecta al servidor MySQL sin especificar base de datos"""
        try:
            # Conectar sin especificar collation para evitar problemas de compatibilidad
            self.connection = mysql.connector.connect(
                host=self.host,
                user=self.user,
                password=self.password,
                port=self.port,
                charset='utf8mb4',
                use_unicode=True
                # Removido collation para evitar problemas de compatibilidad
            )
            
            if self.connection.is_connected():
                self.cursor = self.connection.cursor()
                logger.info(f"✅ Conexión exitosa al servidor MySQL: {self.host}")
                return True
                
        except Error as e:
            logger.error(f"❌ Error al conectar al servidor MySQL: {e}")
            return False
    
    def connect_to_db(self, database):
        """Conecta a una base de datos específica"""
        try:
            if self.connection:
                self.disconnect()
            
            self.connection = mysql.connector.connect(
                host=self.host,
                database=database,
                user=self.user,
                password=self.password,
                port=self.port,
                charset='utf8mb4',
                # collation='utf8mb4_general_ci'
            )
            
            if self.connection.is_connected():
                self.cursor = self.connection.cursor()
                logger.info(f"✅ Conexión exitosa a la base de datos: {database}")
                return True
                
        except Error as e:
            logger.error(f"❌ Error al conectar a la base de datos {database}: {e}")
            return False
    
    def disconnect(self):
        """Cierra la conexión"""
        if self.connection and self.connection.is_connected():
            self.cursor.close()
            self.connection.close()
            logger.info("🔌 Conexión cerrada")
    
    def execute_query(self, query, params=None):
        """Ejecuta una consulta SQL"""
        try:
            if params:
                self.cursor.execute(query, params)
            else:
                self.cursor.execute(query)
            
            self.connection.commit()
            return True
            
        except Error as e:
            logger.error(f"❌ Error ejecutando consulta: {e}")
            logger.error(f"Query: {query[:100]}...")
            self.connection.rollback()
            return False
    
    def execute_sql_file(self, sql_content):
        """Ejecuta el contenido de un archivo SQL"""
        try:
            # Dividir por declaraciones (usando punto y coma)
            statements = []
            current_statement = ""
            
            for line in sql_content.split('\n'):
                line = line.strip()
                
                # Ignorar comentarios y líneas vacías
                if line.startswith('--') or line.startswith('/*') or line.startswith('*') or not line:
                    continue
                
                # Ignorar comandos específicos de MySQL
                if line.startswith('/*!') or line.startswith('SET ') or line.startswith('START TRANSACTION') or line == 'COMMIT;':
                    continue
                
                current_statement += line + " "
                
                # Si la línea termina con punto y coma, es el final de una declaración
                if line.endswith(';'):
                    statements.append(current_statement.strip())
                    current_statement = ""
            
            # Ejecutar cada declaración
            for i, statement in enumerate(statements):
                if statement and len(statement) > 5:  # Ignorar declaraciones muy cortas
                    logger.info(f"📝 Ejecutando declaración {i+1}/{len(statements)}")
                    if not self.execute_query(statement):
                        logger.error(f"❌ Error en declaración {i+1}")
                        return False
            
            logger.info("✅ Archivo SQL ejecutado exitosamente")
            return True
            
        except Exception as e:
            logger.error(f"❌ Error procesando archivo SQL: {e}")
            return False
    
    def create_database_if_not_exists(self, database_name):
        """Crea la base de datos si no existe"""
        try:
            # Crear sin collation específico para evitar problemas de compatibilidad
            query = f"CREATE DATABASE IF NOT EXISTS `{database_name}` DEFAULT CHARACTER SET utf8mb4"
            if self.execute_query(query):
                logger.info(f"✅ Base de datos '{database_name}' creada o ya existe")
                return True
            return False
            
        except Exception as e:
            logger.error(f"❌ Error creando base de datos: {e}")
            return False
    
    def load_sql_file(self, file_path):
        """Carga el contenido de un archivo SQL"""
        try:
            if not os.path.exists(file_path):
                logger.error(f"❌ Archivo SQL no encontrado: {file_path}")
                return None
            
            with open(file_path, 'r', encoding='utf-8') as file:
                content = file.read()
                logger.info(f"📂 Archivo SQL cargado: {file_path}")
                return content
                
        except Exception as e:
            logger.error(f"❌ Error leyendo archivo SQL: {e}")
            return None
    
    def check_database_exists(self, database_name):
        """Verifica si la base de datos existe"""
        try:
            self.cursor.execute("SHOW DATABASES")
            databases = [db[0] for db in self.cursor.fetchall()]
            return database_name in databases
            
        except Exception as e:
            logger.error(f"❌ Error verificando base de datos: {e}")
            return False
    
    def setup_complete_database(self):
        """Configura la base de datos completa - método requerido por runPipeline.py"""
        # Verificar si existe el archivo modeloActualizado.sql
        sql_file = "modeloActualizado.sql"
        
        if os.path.exists(sql_file):
            logger.info(f"📂 Archivo SQL encontrado: {sql_file}")
            return self.setup_with_sql_file(sql_file)
        else:
            logger.warning(f"⚠️ Archivo SQL no encontrado: {sql_file} (No es necesario leer este archivo)")
            return self.setup_minimal_database()
    
    def setup_minimal_database(self):
        """Configura una base de datos mínima sin archivo SQL externo"""
        database_name = "OHIGGINS_STATS_DB"
        
        logger.info("🚀 Iniciando configuración mínima de base de datos...")
        
        try:
            # 1. Conectar al servidor MySQL
            if not self.connect_without_db():
                return False
            
            # 2. Crear base de datos si no existe
            if not self.create_database_if_not_exists(database_name):
                return False
            
            # 3. Conectar a la base de datos específica
            if not self.connect_to_db(database_name):
                return False
            
            logger.info("✅ Base de datos básica creada")
            logger.info("ℹ️ Nota: Las tablas deben existir o ser creadas manualmente")
            return True
            
        except Exception as e:
            logger.error(f"❌ Error en configuración mínima: {e}")
            return False
    
    def connect_to_db(self, database):
        """Conecta a una base de datos específica"""
        try:
            if self.connection:
                self.disconnect()
            
            # Conectar sin especificar collation para evitar problemas de compatibilidad
            self.connection = mysql.connector.connect(
                host=self.host,
                database=database,
                user=self.user,
                password=self.password,
                port=self.port,
                charset='utf8mb4'
                # Removido collation para evitar problemas de compatibilidad
            )
            
            if self.connection.is_connected():
                self.cursor = self.connection.cursor()
                logger.info(f"✅ Conexión exitosa a la base de datos: {database}")
                return True
                
        except Error as e:
            logger.error(f"❌ Error al conectar a la base de datos {database}: {e}")
            return False
    
    def check_tables_exist(self):
        """Verifica si las tablas principales existen"""
        try:
            required_tables = [
                'DIM_JUGADOR', 'DIM_PAIS', 'DIM_POSICION', 
                'DIM_EQUIPO', 'DIM_JUGADOR_PAIS', 'DIM_JUGADOR_POSICION'
            ]
            
            self.cursor.execute("SHOW TABLES")
            existing_tables = [table[0] for table in self.cursor.fetchall()]
            
            missing_tables = [table for table in required_tables if table not in existing_tables]
            
            if missing_tables:
                logger.warning(f"⚠️ Tablas faltantes: {missing_tables}")
                return False
            else:
                logger.info("✅ Todas las tablas requeridas existen")
                return True
                
        except Exception as e:
            logger.error(f"❌ Error verificando tablas: {e}")
            return False
    
    def setup_with_sql_file(self, sql_file_path="modeloActualizado.sql"):
        """Configura la base de datos usando un archivo SQL externo"""
        database_name = "OHIGGINS_STATS_DB"
        
        logger.info("🚀 Iniciando configuración de base de datos con archivo SQL...")
        
        try:
            # 1. Conectar al servidor MySQL
            if not self.connect_without_db():
                return False
            
            # 2. Crear base de datos si no existe
            if not self.create_database_if_not_exists(database_name):
                return False
            
            # 3. Conectar a la base de datos específica
            if not self.connect_to_db(database_name):
                return False
            
            # 4. Verificar si las tablas ya existen
            if self.check_tables_exist():
                logger.info("ℹ️ Las tablas ya existen, omitiendo creación...")
                return True
            
            # 5. Cargar y ejecutar archivo SQL
            logger.info(f"📋 Cargando archivo SQL: {sql_file_path}")
            sql_content = self.load_sql_file(sql_file_path)
            
            if not sql_content:
                logger.error("❌ No se pudo cargar el archivo SQL")
                return False
            
            logger.info("📝 Ejecutando script SQL...")
            if not self.execute_sql_file(sql_content):
                return False
            
            # 6. Verificar que las tablas se crearon correctamente
            if not self.check_tables_exist():
                logger.error("❌ Las tablas no se crearon correctamente")
                return False
            
            logger.info("✅ Base de datos configurada exitosamente")
            return True
            
        except Exception as e:
            logger.error(f"❌ Error en configuración: {e}")
            return False
    
    def setup_minimal_database(self):
        """Configura una base de datos mínima sin archivo SQL externo"""
        database_name = "OHIGGINS_STATS_DB"
        
        logger.info("🚀 Iniciando configuración mínima de base de datos...")
        
        try:
            # 1. Conectar al servidor MySQL
            if not self.connect_without_db():
                return False
            
            # 2. Crear base de datos si no existe
            if not self.create_database_if_not_exists(database_name):
                return False
            
            # 3. Conectar a la base de datos específica
            if not self.connect_to_db(database_name):
                return False
            
            logger.info("✅ Base de datos básica creada")
            logger.info("⚠️ Nota: Ejecute el archivo modeloActualizado.sql manualmente para crear las tablas")
            return True
            
        except Exception as e:
            logger.error(f"❌ Error en configuración mínima: {e}")
            return False
    
    def validate_database_structure(self):
        """Valida la estructura de la base de datos"""
        logger.info("🔍 Validando estructura de la base de datos...")
        
        try:
            # Verificar tablas
            if not self.check_tables_exist():
                return False
            
            # Verificar datos iniciales en tablas de dimensión
            validations = [
                ("DIM_POSICION", "SELECT COUNT(*) FROM DIM_POSICION", "posiciones"),
                ("DIM_PAIS", "SELECT COUNT(*) FROM DIM_PAIS", "países"),
                ("DIM_EQUIPO", "SELECT COUNT(*) FROM DIM_EQUIPO WHERE TEAM_ID_FBR = '5049d576'", "equipo O'Higgins")
            ]
            
            for table, query, description in validations:
                try:
                    self.cursor.execute(query)
                    count = self.cursor.fetchone()[0]
                    if count > 0:
                        logger.info(f"✅ {description}: {count} registros")
                    else:
                        logger.warning(f"⚠️ {description}: Sin datos")
                except Exception as e:
                    logger.error(f"❌ Error validando {description}: {e}")
            
            logger.info("✅ Validación de estructura completada")
            return True
            
        except Exception as e:
            logger.error(f"❌ Error en validación: {e}")
            return False

def main():
    """Función principal para configurar la base de datos"""
    
    # Configuración de conexión
    DB_CONFIG = {
        'host': 'localhost',
        'user': 'root',      # Cambiar según tu configuración
        'password': '',      # Cambiar según tu configuración
        'port': 3306
    }
    
    print("🏗️ CONFIGURADOR DE BASE DE DATOS O'HIGGINS FC")
    print("=" * 50)
    
    # Solicitar credenciales si es necesario
    if not DB_CONFIG['password']:
        import getpass
        DB_CONFIG['password'] = getpass.getpass("Ingresa la contraseña de MySQL: ")
    
    # Crear configurador
    setup = DatabaseSetup(**DB_CONFIG)
    
    try:
        # Verificar si existe el archivo modeloActualizado.sql
        sql_file = "modeloActualizado.sql"
        
        if os.path.exists(sql_file):
            print(f"📂 Archivo SQL encontrado: {sql_file}")
            success = setup.setup_with_sql_file(sql_file)
        else:
            print(f"⚠️ Archivo SQL no encontrado: {sql_file}")
            print("🔧 Configurando base de datos mínima...")
            success = setup.setup_minimal_database()
        
        if success:
            print("\n🎉 ¡Base de datos configurada exitosamente!")
            
            # Validar estructura si se usó archivo SQL
            if os.path.exists(sql_file):
                setup.validate_database_structure()
            
            print("✅ Ahora puedes ejecutar el pipeline de jugadores")
        else:
            print("\n❌ Error configurando la base de datos")
            print("❗ Revisa los logs para más detalles")
            
    except Exception as e:
        logger.error(f"❌ Error crítico: {e}")
        print(f"\n❌ Error crítico: {e}")
        
    finally:
        setup.disconnect()

if __name__ == "__main__":
    main()