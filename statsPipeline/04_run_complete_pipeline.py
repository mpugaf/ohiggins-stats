#!/usr/bin/env python3
"""
Script principal para ejecutar el pipeline completo de datos de jugadores
Incluye configuración, ejecución y validación
"""

import os
import sys
import logging
from datetime import datetime

# Importar los módulos del pipeline
# Los nombres de archivo son: 02_players_data_pipeline.py y 03_validate_pipeline.py
# Pero Python no puede importar archivos que empiecen con números directamente
# Alternativa: importar usando importlib o renombrar archivos

import importlib.util
import sys

def import_module_from_file(module_name, file_path):
    """Importar módulo desde archivo específico"""
    try:
        spec = importlib.util.spec_from_file_location(module_name, file_path)
        if spec is None:
            raise ImportError(f"No se pudo cargar especificación para {file_path}")
        
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
        return module
    except Exception as e:
        raise ImportError(f"Error cargando módulo {module_name} desde {file_path}: {e}")

# Importar PlayersDataPipeline
try:
    pipeline_module = import_module_from_file("players_data_pipeline", "02_players_data_pipeline.py")
    PlayersDataPipeline = pipeline_module.PlayersDataPipeline
    print("✅ PlayersDataPipeline importado correctamente")
except ImportError as e:
    print(f"❌ Error importando PlayersDataPipeline: {e}")
    print("💡 Asegúrate de que el archivo 02_players_data_pipeline.py esté en el mismo directorio")
    sys.exit(1)

# Importar PipelineValidator
try:
    validator_module = import_module_from_file("validate_pipeline", "03_validate_pipeline.py")
    PipelineValidator = validator_module.PipelineValidator
    print("✅ PipelineValidator importado correctamente")
except ImportError as e:
    print(f"❌ Error importando PipelineValidator: {e}")
    print("💡 Asegúrate de que el archivo 03_validate_pipeline.py esté en el mismo directorio")
    sys.exit(1)

# Configurar logging
def setup_logging():
    """Configurar sistema de logging"""
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    log_filename = f"pipeline_execution_{timestamp}.log"
    
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(levelname)s - %(message)s',
        handlers=[
            logging.FileHandler(log_filename),
            logging.StreamHandler(sys.stdout)
        ]
    )
    
    return log_filename

def print_banner():
    """Mostrar banner del pipeline"""
    banner = """
    ╔══════════════════════════════════════════════════════════════╗
    ║                  FOOTBALL DATA PIPELINE                     ║
    ║                  Carga de Datos de Jugadores                ║
    ║                                                              ║
    ║  📊 CSV → 🗄️  Base de Datos → ✅ Validación                 ║
    ╚══════════════════════════════════════════════════════════════╝
    """
    print(banner)

def get_database_config():
    """Obtener configuración de base de datos"""
    print("🔧 CONFIGURACIÓN DE BASE DE DATOS")
    print("-" * 40)
    
    # Configuración por defecto (cambiar según tu entorno)
    default_config = {
        'host': 'localhost',
        'port': 3306,
        'user': 'mpuga',
        'password': '',  # Dejar vacío para solicitar
        'database': 'MP_DATA_DEV',
        'charset': 'utf8mb4',
        'autocommit': False
    }
    
    # Solicitar contraseña si no está configurada
    if not default_config['password']:
        import getpass
        default_config['password'] = getpass.getpass("🔐 Contraseña de MySQL: ")
    
    print(f"🏠 Host: {default_config['host']}")
    print(f"🔌 Puerto: {default_config['port']}")
    print(f"👤 Usuario: {default_config['user']}")
    print(f"🗄️  Base de datos: {default_config['database']}")
    
    return default_config

def find_csv_file():
    """Buscar archivo CSV de jugadores"""
    print("\n🔍 BÚSQUEDA DE ARCHIVO CSV")
    print("-" * 40)
    
    # Buscar archivos CSV con patrón de jugadores
    csv_patterns = [
        'team_5049d576_players_*.csv',
        'team_*_players_*.csv',
        '*players*.csv'
    ]
    
    import glob
    
    for pattern in csv_patterns:
        files = glob.glob(pattern)
        if files:
            # Tomar el archivo más reciente
            latest_file = max(files, key=os.path.getctime)
            print(f"✅ Archivo encontrado: {latest_file}")
            
            # Mostrar información del archivo
            size = os.path.getsize(latest_file)
            modified = datetime.fromtimestamp(os.path.getmtime(latest_file))
            print(f"📏 Tamaño: {size:,} bytes")
            print(f"📅 Modificado: {modified.strftime('%Y-%m-%d %H:%M:%S')}")
            
            return latest_file
    
    # Si no se encuentra, solicitar manualmente
    print("⚠️  No se encontraron archivos CSV automáticamente")
    csv_file = input("📁 Ingresa la ruta del archivo CSV: ").strip()
    
    if not os.path.exists(csv_file):
        print(f"❌ Archivo no encontrado: {csv_file}")
        return None
    
    return csv_file

def verify_prerequisites():
    """Verificar prerequisitos del sistema"""
    print("\n🔍 VERIFICACIÓN DE PREREQUISITOS")
    print("-" * 40)
    
    prerequisites = []
    
    # Verificar librerías Python
    try:
        import pandas
        print(f"✅ pandas {pandas.__version__}")
        prerequisites.append(True)
    except ImportError:
        print("❌ pandas no instalado")
        prerequisites.append(False)
    
    try:
        import mysql.connector
        print(f"✅ mysql-connector-python disponible")
        prerequisites.append(True)
    except ImportError:
        print("❌ mysql-connector-python no instalado")
        prerequisites.append(False)
    
    return all(prerequisites)

def main():
    """Función principal"""
    # Configurar logging
    log_file = setup_logging()
    
    # Mostrar banner
    print_banner()
    
    # Verificar prerequisitos
    if not verify_prerequisites():
        print("\n❌ Faltan prerequisitos. Instala las librerías necesarias:")
        print("   pip install pandas mysql-connector-python")
        sys.exit(1)
    
    try:
        # 1. Obtener configuración de base de datos
        db_config = get_database_config()
        
        # 2. Buscar archivo CSV
        csv_file = find_csv_file()
        if not csv_file:
            print("❌ No se pudo encontrar el archivo CSV")
            sys.exit(1)
        
        # 3. Confirmar ejecución
        print(f"\n🚀 CONFIRMACIÓN DE EJECUCIÓN")
        print("-" * 40)
        print(f"📁 Archivo CSV: {csv_file}")
        print(f"🗄️  Base de datos: {db_config['database']}")
        print(f"📋 Log file: {log_file}")
        
        confirm = input("\n¿Deseas continuar con la carga de datos? (s/N): ").strip().lower()
        if confirm not in ['s', 'si', 'sí', 'y', 'yes']:
            print("❌ Operación cancelada por el usuario")
            sys.exit(0)
        
        # 4. Ejecutar pipeline de datos
        print(f"\n{'='*60}")
        print("🚀 EJECUTANDO PIPELINE DE DATOS")
        print(f"{'='*60}")
        
        pipeline = PlayersDataPipeline(db_config)
        success = pipeline.run_pipeline(csv_file)
        
        if not success:
            print("❌ Pipeline falló durante la ejecución")
            sys.exit(1)
        
        # 5. Ejecutar validación
        print(f"\n{'='*60}")
        print("🧪 EJECUTANDO VALIDACIÓN")
        print(f"{'='*60}")
        
        validator = PipelineValidator(db_config)
        validation_success = validator.run_validation()
        
        # 6. Reporte final
        print(f"\n{'='*60}")
        print("📋 REPORTE FINAL")
        print(f"{'='*60}")
        
        if success and validation_success:
            print("✅ Pipeline ejecutado exitosamente")
            print("✅ Validación completada exitosamente")
            print(f"📄 Log completo en: {log_file}")
            print("\n🎉 ¡Datos de jugadores cargados correctamente!")
        else:
            print("❌ Se encontraron errores durante la ejecución")
            print(f"📄 Revisa el log para más detalles: {log_file}")
            sys.exit(1)
        
    except KeyboardInterrupt:
        print("\n⚠️  Operación interrumpida por el usuario")
        sys.exit(1)
    except Exception as e:
        logging.error(f"❌ Error inesperado: {e}")
        print(f"❌ Error inesperado: {e}")
        print(f"📄 Revisa el log para más detalles: {log_file}")
        sys.exit(1)

if __name__ == "__main__":
    main()