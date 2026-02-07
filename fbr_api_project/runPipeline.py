#!/usr/bin/env python3
"""
Orquestador principal para el pipeline de datos de O'Higgins FC
Ejecuta todo el proceso desde la configuración de la base de datos hasta la carga de jugadores
"""

import os
import sys
import logging
import argparse
from datetime import datetime

# Importar módulos locales
try:
    from setupDatabase import DatabaseSetup
    from dataPipelineJugadores import DatabaseConnection, PlayerDataPipeline
except ImportError as e:
    print(f"❌ Error importando módulos: {e}")
    print("❗ Asegúrate de que todos los archivos están en la misma carpeta")
    sys.exit(1)

# Configuración de logging
def setup_logging():
    """Configura el sistema de logging"""
    log_format = '%(asctime)s - %(levelname)s - %(message)s'
    
    # Crear directorio de logs si no existe
    os.makedirs('logs', exist_ok=True)
    
    # Configurar logging
    logging.basicConfig(
        level=logging.INFO,
        format=log_format,
        handlers=[
            logging.FileHandler(f'logs/pipeline_{datetime.now().strftime("%Y%m%d_%H%M%S")}.log'),
            logging.StreamHandler(sys.stdout)
        ]
    )
    
    return logging.getLogger(__name__)

class PipelineOrchestrator:
    """Orquestador principal del pipeline de datos"""
    
    def __init__(self, db_config):
        self.db_config = db_config
        self.logger = logging.getLogger(__name__)
    
    def check_prerequisites(self, csv_file):
        """Verifica que todos los prerrequisitos estén cumplidos"""
        self.logger.info("🔍 Verificando prerrequisitos...")
        
        # Verificar archivo CSV
        if not os.path.exists(csv_file):
            self.logger.error(f"❌ Archivo CSV no encontrado: {csv_file}")
            return False
        
        self.logger.info(f"✅ Archivo CSV encontrado: {csv_file}")
        
        # Verificar dependencias de Python
        try:
            import pandas as pd
            import mysql.connector
            self.logger.info("✅ Dependencias de Python verificadas")
        except ImportError as e:
            self.logger.error(f"❌ Dependencia faltante: {e}")
            self.logger.error("❗ Instala las dependencias con: pip install pandas mysql-connector-python")
            return False
        
        return True
    
    def setup_database(self, force_recreate=False):
        """Configura la base de datos"""
        self.logger.info("🏗️  Configurando base de datos...")
        
        setup = DatabaseSetup(
            host=self.db_config['host'],
            user=self.db_config['user'],
            password=self.db_config['password'],
            port=self.db_config['port']
        )
        
        try:
            # Llamar al método correcto que existe en DatabaseSetup
            success = setup.setup_complete_database()
            return success
        except Exception as e:
            self.logger.error(f"❌ Error configurando base de datos: {e}")
            return False
        finally:
            setup.disconnect()
    
    def run_player_pipeline(self, csv_file):
        """Ejecuta el pipeline de carga de jugadores"""
        self.logger.info("👨‍💼 Ejecutando pipeline de jugadores...")
        
        # Crear conexión a la base de datos
        db = DatabaseConnection(**self.db_config)
        
        try:
            # Conectar
            if not db.connect():
                self.logger.error("❌ No se pudo conectar a la base de datos")
                return False
            
            # Crear y ejecutar pipeline
            pipeline = PlayerDataPipeline(db)
            success = pipeline.run_pipeline(csv_file)
            
            return success
            
        except Exception as e:
            self.logger.error(f"❌ Error en pipeline de jugadores: {e}")
            return False
        finally:
            db.disconnect()
    
    def validate_results(self):
        """Valida los resultados de la carga"""
        self.logger.info("✅ Validando resultados...")
        
        db = DatabaseConnection(**self.db_config)
        
        try:
            if not db.connect():
                return False
            
            # Consultas de validación
            validations = [
                ("Jugadores cargados", "SELECT COUNT(*) FROM DIM_JUGADOR"),
                ("Países cargados", "SELECT COUNT(*) FROM DIM_PAIS"),
                ("Posiciones disponibles", "SELECT COUNT(*) FROM DIM_POSICION"),
                ("Relaciones jugador-país", "SELECT COUNT(*) FROM DIM_JUGADOR_PAIS"),
                ("Relaciones jugador-posición", "SELECT COUNT(*) FROM DIM_JUGADOR_POSICION"),
            ]
            
            self.logger.info("📊 RESUMEN DE DATOS CARGADOS:")
            for description, query in validations:
                try:
                    result = db.execute_query(query, fetch=True)
                    count = result[0][0] if result else 0
                    self.logger.info(f"   {description}: {count}")
                except Exception as e:
                    self.logger.error(f"   ❌ Error en {description}: {e}")
            
            # Verificar integridad referencial
            integrity_check = """
                SELECT j.NOMBRE_COMPLETO, j.PLAYER_ID_FBR
                FROM DIM_JUGADOR j
                LEFT JOIN DIM_JUGADOR_PAIS jp ON j.PLAYER_ID_FBR = jp.PLAYER_ID_FBR
                WHERE jp.PLAYER_ID_FBR IS NULL
                LIMIT 5
            """
            
            orphaned = db.execute_query(integrity_check, fetch=True)
            if orphaned:
                self.logger.warning(f"⚠️ {len(orphaned)} jugadores sin relación de país")
            else:
                self.logger.info("✅ Integridad referencial verificada")
            
            return True
            
        except Exception as e:
            self.logger.error(f"❌ Error validando resultados: {e}")
            return False
        finally:
            db.disconnect()
    
    def run_complete_pipeline(self, csv_file, setup_db=True, validate=True):
        """Ejecuta el pipeline completo"""
        start_time = datetime.now()
        
        self.logger.info("🚀 INICIANDO PIPELINE COMPLETO DE O'HIGGINS FC")
        self.logger.info("=" * 60)
        
        try:
            # 1. Verificar prerrequisitos
            if not self.check_prerequisites(csv_file):
                return False
            
            # 2. Configurar base de datos (opcional)
            if setup_db:
                if not self.setup_database():
                    self.logger.error("❌ Falló la configuración de la base de datos")
                    return False
            
            # 3. Ejecutar pipeline de jugadores
            if not self.run_player_pipeline(csv_file):
                self.logger.error("❌ Falló el pipeline de jugadores")
                return False
            
            # 4. Validar resultados (opcional)
            if validate:
                if not self.validate_results():
                    self.logger.warning("⚠️ Problemas en la validación")
            
            # 5. Mostrar resumen final
            end_time = datetime.now()
            duration = end_time - start_time
            
            self.logger.info("🎉 PIPELINE COMPLETADO EXITOSAMENTE")
            self.logger.info(f"⏱️  Tiempo total: {duration}")
            self.logger.info("=" * 60)
            
            return True
            
        except Exception as e:
            self.logger.error(f"❌ Error crítico en pipeline: {e}")
            return False

def get_db_config():
    """Obtiene la configuración de la base de datos"""
    config = {
        'host': os.getenv('DB_HOST', '192.168.100.16'),
        'database': os.getenv('DB_NAME', 'OHIGGINS_STATS_DB'),
        'user': os.getenv('DB_USER', 'mpuga'),
        'password': os.getenv('DB_PASSWORD', '123qweasd'),
        'port': int(os.getenv('DB_PORT', 3306))
    }
    
    # Si no hay contraseña en variables de entorno, solicitarla
    if not config['password']:
        import getpass
        config['password'] = getpass.getpass("Contraseña de MySQL: ")
    
    return config

def main():
    """Función principal"""
    
    # Configurar argumentos de línea de comandos
    parser = argparse.ArgumentParser(
        description='Pipeline de datos para O\'Higgins FC',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Ejemplos de uso:
  python runPipeline.py                                    # Ejecutar pipeline completo
  python runPipeline.py --csv players.csv                 # Especificar archivo CSV
  python runPipeline.py --no-setup                        # Sin configurar BD
  python runPipeline.py --no-validate                     # Sin validación
        """
    )
    
    parser.add_argument(
        '--csv',
        default='team_5049d576_players_20250603_040149.csv',
        help='Archivo CSV con datos de jugadores'
    )
    
    parser.add_argument(
        '--no-setup',
        action='store_true',
        help='No configurar la base de datos (asume que ya existe)'
    )
    
    parser.add_argument(
        '--no-validate',
        action='store_true',
        help='No ejecutar validaciones al final'
    )
    
    parser.add_argument(
        '--config',
        help='Archivo de configuración de base de datos (JSON)'
    )
    
    args = parser.parse_args()
    
    # Configurar logging
    logger = setup_logging()
    
    # Mostrar banner
    print("🏆 PIPELINE DE DATOS - O'HIGGINS FC")
    print("🔄 Sistema de gestión de estadísticas")
    print("=" * 50)
    
    try:
        # Obtener configuración de base de datos
        if args.config:
            import json
            with open(args.config, 'r') as f:
                db_config = json.load(f)
        else:
            db_config = get_db_config()
        
        # Crear orquestador
        orchestrator = PipelineOrchestrator(db_config)
        
        # Ejecutar pipeline
        success = orchestrator.run_complete_pipeline(
            csv_file=args.csv,
            setup_db=not args.no_setup,
            validate=not args.no_validate
        )
        
        if success:
            print("\n🎉 ¡Pipeline ejecutado exitosamente!")
            print("✅ Los datos de jugadores han sido cargados")
            print("📊 Revisa los logs para más detalles")
        else:
            print("\n❌ El pipeline falló")
            print("❗ Revisa los logs para más detalles")
            sys.exit(1)
            
    except KeyboardInterrupt:
        print("\n⚠️ Pipeline interrumpido por el usuario")
        sys.exit(1)
    except Exception as e:
        logger.error(f"❌ Error crítico: {e}")
        print(f"\n❌ Error crítico: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()