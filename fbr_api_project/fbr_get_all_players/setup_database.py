"""
Script para configurar la base de datos con collation compatible
"""

import mysql.connector
from mysql.connector import Error
from database_config import DB_CONFIG

def check_mysql_version():
    """Verifica la versión de MySQL/MariaDB"""
    try:
        # Conexión sin especificar base de datos específica
        connection = mysql.connector.connect(
            host=DB_CONFIG.host,
            port=DB_CONFIG.port,
            user=DB_CONFIG.user,
            password=DB_CONFIG.password
        )
        
        cursor = connection.cursor()
        cursor.execute("SELECT VERSION() as version")
        version = cursor.fetchone()[0]
        
        print(f"🔧 Versión detectada: {version}")
        
        # Detectar si es MariaDB o MySQL y su versión
        is_mariadb = 'MariaDB' in version
        
        if is_mariadb:
            print("📊 Servidor: MariaDB")
            return 'mariadb', version
        else:
            print("📊 Servidor: MySQL")
            # Extraer número de versión
            version_number = version.split()[0]
            major_version = int(version_number.split('.')[0])
            
            if major_version >= 8:
                print("✅ MySQL 8.0+ detectado - soporta utf8mb4_0900_ai_ci")
                return 'mysql8', version
            else:
                print("⚠️  MySQL < 8.0 detectado - usar utf8mb4_general_ci")
                return 'mysql_old', version
        
        cursor.close()
        connection.close()
        
    except Error as e:
        print(f"❌ Error verificando versión: {e}")
        return None, None

def create_database_with_correct_collation():
    """Crea la base de datos con la collation correcta"""
    try:
        # Conexión sin base de datos específica
        connection = mysql.connector.connect(
            host=DB_CONFIG.host,
            port=DB_CONFIG.port,
            user=DB_CONFIG.user,
            password=DB_CONFIG.password
        )
        
        cursor = connection.cursor()
        
        # Verificar versión para elegir collation
        # db_type, version = check_mysql_version()
        
        # if db_type == 'mysql8':
        #     collation = 'utf8mb4_0900_ai_ci'
        # else:
        #     collation = 'utf8mb4_general_ci'
        
        # # Crear base de datos con collation apropiada
        # create_db_query = f"""
        # CREATE DATABASE IF NOT EXISTS `{DB_CONFIG.database}` 
        # DEFAULT CHARACTER SET utf8mb4 
        # COLLATE {collation}
        # """
        
        # print(f"🗄️  Creando base de datos con collation: {collation}")
        # cursor.execute(create_db_query)
        
        # print(f"✅ Base de datos '{DB_CONFIG.database}' creada/verificada")
        
        # # Mostrar información de la base de datos
        # cursor.execute(f"""
        # SELECT DEFAULT_CHARACTER_SET_NAME, DEFAULT_COLLATION_NAME 
        # FROM information_schema.SCHEMATA 
        # WHERE SCHEMA_NAME = '{DB_CONFIG.database}'
        # """)
        
        db_info = cursor.fetchone()
        if db_info:
            charset, collation_actual = db_info
            print(f"📊 Charset: {charset}")
            print(f"📊 Collation: {collation_actual}")
        
        cursor.close()
        connection.close()
        
        return True
        
    except Error as e:
        print(f"❌ Error creando base de datos: {e}")
        return False

def test_connection():
    """Prueba la conexión con la configuración actual"""
    try:
        connection = mysql.connector.connect(
            host=DB_CONFIG.host,
            port=DB_CONFIG.port,
            database=DB_CONFIG.database,
            user=DB_CONFIG.user,
            password=DB_CONFIG.password,
            charset='utf8mb4',
            use_unicode=True
        )
        
        if connection.is_connected():
            cursor = connection.cursor()
            
            # Probar consulta simple
            cursor.execute("SELECT 1 as test")
            result = cursor.fetchone()
            
            if result and result[0] == 1:
                print("✅ Conexión de prueba exitosa")
                return True
            
            cursor.close()
            connection.close()
            
    except Error as e:
        print(f"❌ Error en conexión de prueba: {e}")
        return False

def show_troubleshooting():
    """Muestra guía de resolución de problemas"""
    print("\n" + "="*60)
    print("🔧 GUÍA DE RESOLUCIÓN DE PROBLEMAS")
    print("="*60)
    
    print("\n1️⃣  VERIFICAR CREDENCIALES:")
    print(f"   Host: {DB_CONFIG.host}")
    print(f"   Puerto: {DB_CONFIG.port}")
    print(f"   Usuario: {DB_CONFIG.user}")
    print(f"   Base de datos: {DB_CONFIG.database}")
    print(f"   Contraseña: {'✅ Configurada' if DB_CONFIG.password else '❌ NO configurada'}")
    
    print("\n2️⃣  COMANDOS PARA PROBAR CONEXIÓN MANUAL:")
    print(f"   mysql -h {DB_CONFIG.host} -P {DB_CONFIG.port} -u {DB_CONFIG.user} -p")
    
    print("\n3️⃣  VERIFICAR SERVIDOR MYSQL/MARIADB:")
    print("   # En Ubuntu/Debian:")
    print("   sudo systemctl status mysql")
    print("   sudo systemctl status mariadb")
    print("\n   # En CentOS/RHEL:")
    print("   sudo systemctl status mysqld")
    print("   sudo systemctl status mariadb")
    
    print("\n4️⃣  CONFIGURAR CONTRASEÑA EN database_config.py:")
    print("   DB_CONFIG.password = 'tu_contraseña_aquí'")
    
    print("\n5️⃣  CREAR USUARIO SI NO EXISTE:")
    print(f"   CREATE USER '{DB_CONFIG.user}'@'localhost' IDENTIFIED BY 'tu_contraseña';")
    print(f"   GRANT ALL PRIVILEGES ON {DB_CONFIG.database}.* TO '{DB_CONFIG.user}'@'localhost';")
    print("   FLUSH PRIVILEGES;")

def main():
    """Función principal de configuración"""
    print("🚀 CONFIGURADOR DE BASE DE DATOS")
    print("="*60)
    
    # Paso 1: Verificar versión de MySQL/MariaDB
    print("\n📋 Paso 1: Verificando versión del servidor...")
    db_type, version = check_mysql_version()
    
    if not db_type:
        print("\n❌ No se pudo conectar al servidor MySQL/MariaDB")
        show_troubleshooting()
        return False
    
    # Paso 2: Crear base de datos con collation correcta
    print("\n📋 Paso 2: Configurando base de datos...")
    if not create_database_with_correct_collation():
        print("\n❌ Error configurando base de datos")
        return False
    
    # Paso 3: Probar conexión
    print("\n📋 Paso 3: Probando conexión...")
    if not test_connection():
        print("\n❌ Error en conexión final")
        show_troubleshooting()
        return False
    
    print("\n" + "="*60)
    print("✅ CONFIGURACIÓN COMPLETADA EXITOSAMENTE")
    print("="*60)
    print("\n🎯 Ahora puedes ejecutar:")
    print("   python team_players_importer.py")
    
    return True

if __name__ == "__main__":
    main()