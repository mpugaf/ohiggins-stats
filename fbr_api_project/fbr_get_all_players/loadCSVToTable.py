import pandas as pd
import mysql.connector
from mysql.connector import Error
import os
import glob
from datetime import datetime

def create_connection():
    """Crear conexión a MySQL"""
    try:
        connection = mysql.connector.connect(
            host='192.168.100.16',
            database='MP_DATA_DEV',
            user='mpuga',          # 🔧 CAMBIAR
            password='123qweasd',     # 🔧 CAMBIAR
            charset='utf8mb4',
            collation='utf8mb4_general_ci'  # Evita error de collation
        )
        return connection
    except Error as e:
        print(f"❌ Error conectando a MySQL: {e}")
        return None

def get_latest_csv():
    """Obtener el CSV más reciente de la carpeta"""
    folder_path = "chilean_first_division_players"
    pattern = os.path.join(folder_path, "*.csv")
    csv_files = glob.glob(pattern)
    
    if not csv_files:
        print(f"❌ No se encontraron archivos CSV en {folder_path}")
        return None
    
    # Ordenar por fecha de modificación, más reciente primero
    latest_file = max(csv_files, key=os.path.getmtime)
    print(f"📁 Archivo más reciente: {latest_file}")
    return latest_file

def create_table(connection):
    """Crear/reemplazar tabla para importar datos"""
    drop_table = "DROP TABLE IF EXISTS `CHILEAN_PLAYERS_IMPORT`"
    
    create_table_query = """
    CREATE TABLE `CHILEAN_PLAYERS_IMPORT` (
        `id` INT AUTO_INCREMENT PRIMARY KEY,
        `altura_cm` DECIMAL(5,2) NULL,
        `ciudad_nacimiento` VARCHAR(100),
        `edad_roster` INT NULL,
        `fecha_nacimiento` DATE NULL,
        `league_name` VARCHAR(100),
        `nacionalidad_codigo` VARCHAR(10),
        `nombre_completo` VARCHAR(150),
        `nombre_roster` VARCHAR(150),
        `pais_nacimiento` VARCHAR(100),
        `partidos_jugados` INT NULL,
        `partidos_titular` INT NULL,
        `peso_kg` DECIMAL(5,2) NULL,
        `pie_dominante` VARCHAR(20),
        `player_id_fbr` VARCHAR(20),
        `posicion_roster` VARCHAR(20),
        `posiciones_detalladas` VARCHAR(100),
        `salario` VARCHAR(100),
        `season` INT NULL,
        `team_id_fbr` VARCHAR(20),
        `team_name` VARCHAR(100),
        `url_foto` TEXT,
        `fecha_importacion` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
    """
    
    cursor = connection.cursor()
    cursor.execute(drop_table)
    cursor.execute(create_table_query)
    connection.commit()
    print("✅ Tabla CHILEAN_PLAYERS_IMPORT creada")

def clean_data(df):
    """Limpiar y preparar datos del DataFrame"""
    # Reemplazar valores vacíos y NaN
    df = df.fillna('')
    
    # Limpiar campos numéricos - convertir strings vacíos a None
    numeric_fields = ['altura_cm', 'edad_roster', 'partidos_jugados', 
                     'partidos_titular', 'peso_kg', 'season']
    
    for field in numeric_fields:
        if field in df.columns:
            df[field] = df[field].replace('', None)
            df[field] = pd.to_numeric(df[field], errors='coerce')
    
    # Limpiar fechas
    if 'fecha_nacimiento' in df.columns:
        df['fecha_nacimiento'] = pd.to_datetime(df['fecha_nacimiento'], errors='coerce').dt.date
    
    # Limpiar strings - reemplazar None con string vacío
    string_fields = ['ciudad_nacimiento', 'league_name', 'nacionalidad_codigo',
                    'nombre_completo', 'nombre_roster', 'pais_nacimiento',
                    'pie_dominante', 'player_id_fbr', 'posicion_roster',
                    'posiciones_detalladas', 'salario', 'team_id_fbr',
                    'team_name', 'url_foto']
    
    for field in string_fields:
        if field in df.columns:
            df[field] = df[field].fillna('').astype(str)
    
    return df

def load_csv_to_mysql(csv_file_path, connection):
    """Cargar CSV a MySQL"""
    try:
        print(f"📖 Leyendo archivo: {csv_file_path}")
        df = pd.read_csv(csv_file_path)
        
        print(f"📊 Filas: {len(df)}, Columnas: {len(df.columns)}")
        
        # Limpiar datos
        df = clean_data(df)
        
        # Preparar inserción por lotes
        columns = list(df.columns)
        placeholders = ', '.join(['%s'] * len(columns))
        insert_query = f"INSERT INTO CHILEAN_PLAYERS_IMPORT ({', '.join(columns)}) VALUES ({placeholders})"
        
        cursor = connection.cursor()
        
        # Convertir DataFrame a lista de tuplas
        data_tuples = [tuple(x if pd.notna(x) else None for x in row) for row in df.values]
        
        # Inserción por lotes (más rápida)
        cursor.executemany(insert_query, data_tuples)
        connection.commit()
        
        print(f"✅ {len(data_tuples)} registros insertados correctamente")
        
    except Error as e:
        print(f"❌ Error MySQL: {e}")
        connection.rollback()
    except Exception as e:
        print(f"❌ Error general: {e}")

def verify_import(connection):
    """Verificar la importación"""
    cursor = connection.cursor()
    
    cursor.execute("SELECT COUNT(*) FROM CHILEAN_PLAYERS_IMPORT")
    total = cursor.fetchone()[0]
    
    cursor.execute("""
        SELECT nombre_completo, team_name, posicion_roster, nacionalidad_codigo 
        FROM CHILEAN_PLAYERS_IMPORT 
        LIMIT 5
    """)
    
    sample = cursor.fetchall()
    
    print(f"\n📈 Total importado: {total} registros")
    print("📋 Muestra:")
    for row in sample:
        print(f"   {row[0]} | {row[1]} | {row[2]} | {row[3]}")

def main():
    """Función principal simplificada"""
    print("🚀 CARGA AUTOMÁTICA DE CSV MÁS RECIENTE")
    print("=" * 45)
    
    # Obtener archivo más reciente
    csv_file = get_latest_csv()
    if not csv_file:
        return
    
    # Conectar y procesar
    connection = create_connection()
    if not connection:
        return
    
    try:
        create_table(connection)
        load_csv_to_mysql(csv_file, connection)
        verify_import(connection)
        print("\n🎉 PROCESO COMPLETADO")
        
    except Exception as e:
        print(f"❌ Error: {e}")
    
    finally:
        connection.close()

if __name__ == "__main__":
    main()

# INSTALACIÓN: pip install pandas mysql-connector-python