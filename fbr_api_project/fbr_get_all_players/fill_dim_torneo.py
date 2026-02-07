#!/usr/bin/env python3
"""
Script simple para llenar DIM_TORNEO con datos de torneos chilenos
Requiere: pip install mysql-connector-python requests
"""

import requests
import mysql.connector
import time
import logging
from datetime import datetime

# Configuración de logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# =============================================================================
# CONFIGURACIÓN
# =============================================================================

# API Configuration
API_KEY = "AzumZVPR1MlXaroDdCzrE4OT0ezDLMlLDjVCi0Txb0k"
BASE_URL = "https://fbrapi.com"
RATE_LIMIT = 7  # segundos entre peticiones

# Database Configuration - Configuración minimalista para MariaDB
DB_CONFIG = {
    'host': '192.168.100.16',
    'port': 3306,
    'user': 'mpuga',
    'password': '123qweasd',  # ⚠️ CAMBIAR AQUÍ
    'database': 'MP_DATA_DEV'
    # Sin charset ni collation para evitar problemas de compatibilidad
}

# =============================================================================
# FUNCIONES PARA API
# =============================================================================

def call_api(endpoint, params=None):
    """Llama a la API de FBR con rate limiting"""
    url = f"{BASE_URL}{endpoint}"
    headers = {"X-API-Key": API_KEY}
    
    try:
        logger.info(f"API Call: {endpoint}")
        response = requests.get(url, headers=headers, params=params)
        
        if response.status_code == 200:
            time.sleep(RATE_LIMIT)  # Respetar rate limit
            return response.json()
        else:
            logger.error(f"API Error {response.status_code}: {response.text}")
            return None
    except Exception as e:
        logger.error(f"Exception en API: {e}")
        return None

def get_chile_country_code():
    """Busca el código de país de Chile"""
    logger.info("🔍 Buscando código de Chile...")
    
    data = call_api("/countries")
    if not data or 'data' not in data:
        return None
    
    for country in data['data']:
        if country.get('country', '').lower() == 'chile':
            code = country.get('country_code')
            logger.info(f"✅ Chile encontrado: {code}")
            return code
    
    logger.error("❌ Chile no encontrado")
    return None

def get_chilean_leagues():
    """Obtiene ligas chilenas"""
    country_code = get_chile_country_code()
    if not country_code:
        return []
    
    logger.info("🔍 Obteniendo ligas chilenas...")
    data = call_api("/leagues", {"country_code": country_code})
    
    if not data or 'data' not in data:
        return []
    
    leagues = []
    for category in data['data']:
        for league in category.get('leagues', []):
            leagues.append({
                'id': league.get('league_id'),
                'name': league.get('competition_name'),
                'type': category.get('league_type', 'domestic_leagues')
            })
    
    logger.info(f"✅ {len(leagues)} ligas encontradas")
    return leagues

def get_league_seasons(league_id):
    """Obtiene temporadas de una liga"""
    logger.info(f"🔍 Obteniendo temporadas para liga {league_id}...")
    
    data = call_api("/league-seasons", {"league_id": league_id})
    if not data or 'data' not in data:
        return []
    
    # Filtrar solo temporadas 2025
    seasons_2025 = []
    for season in data['data']:
        season_id = season.get('season_id', '')
        if '2025' in str(season_id):
            seasons_2025.append(season_id)
    
    logger.info(f"✅ {len(seasons_2025)} temporadas 2025 encontradas")
    return seasons_2025

# =============================================================================
# FUNCIONES PARA BASE DE DATOS
# =============================================================================

def test_db_connection():
    """Prueba la conexión a MySQL"""
    try:
        logger.info("🔍 Probando conexión MySQL...")
        
        conn = mysql.connector.connect(**DB_CONFIG)
        cursor = conn.cursor()
        
        cursor.execute("SELECT DATABASE()")
        db_name = cursor.fetchone()[0]
        logger.info(f"✅ Conectado a: {db_name}")
        
        cursor.execute("SHOW TABLES LIKE 'DIM_TORNEO'")
        if cursor.fetchone():
            logger.info("✅ Tabla DIM_TORNEO encontrada")
        else:
            logger.error("❌ Tabla DIM_TORNEO no existe")
            return False
        
        conn.close()
        return True
        
    except Exception as e:
        logger.error(f"❌ Error de conexión: {e}")
        return False

def insert_tournament(league_id, nombre, rueda="UNICA", temporada="2025"):
    """Inserta un torneo en DIM_TORNEO"""
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        cursor = conn.cursor()
        
        query = """
        INSERT INTO DIM_TORNEO (LEAGUE_ID_FBR, NOMBRE, PAIS_ORGANIZADOR, RUEDA, TEMPORADA)
        VALUES (%s, %s, %s, %s, %s)
        """
        
        values = (league_id, nombre, 'CHL', rueda, temporada)
        cursor.execute(query, values)
        conn.commit()
        
        logger.info(f"✅ Insertado: {nombre}")
        conn.close()
        return True
        
    except mysql.connector.IntegrityError:
        logger.warning(f"⚠️ Ya existe: {nombre}")
        return False
    except Exception as e:
        logger.error(f"❌ Error insertando {nombre}: {e}")
        return False

# =============================================================================
# LÓGICA PRINCIPAL
# =============================================================================

def determine_rueda(season_id, league_name):
    """Determina la rueda basándose en el ID de temporada"""
    season_lower = str(season_id).lower()
    league_lower = str(league_name).lower()
    
    if 'apertura' in season_lower or 'primera' in season_lower:
        return 'PRIMERA'
    elif 'clausura' in season_lower or 'segunda' in season_lower:
        return 'SEGUNDA'
    elif 'copa' in league_lower or 'cup' in league_lower:
        return 'UNICA'
    else:
        return 'UNICA'

def process_tournaments():
    """Proceso principal para obtener e insertar torneos"""
    logger.info("🚀 Iniciando proceso de torneos...")
    
    # 1. Obtener ligas chilenas
    leagues = get_chilean_leagues()
    if not leagues:
        logger.error("❌ No se encontraron ligas")
        return False
    
    total_inserted = 0
    
    # 2. Procesar cada liga
    for league in leagues:
        league_id = league['id']
        league_name = league['name']
        
        logger.info(f"📋 Procesando: {league_name} (ID: {league_id})")
        
        # 3. Obtener temporadas 2025
        seasons = get_league_seasons(league_id)
        
        # 4. Crear torneos para cada temporada
        for season_id in seasons:
            rueda = determine_rueda(season_id, league_name)
            nombre = f"{league_name} {season_id}"
            
            # Limitar longitud del nombre (máximo 100 caracteres)
            if len(nombre) > 100:
                nombre = nombre[:97] + "..."
            
            # 5. Insertar en base de datos
            if insert_tournament(league_id, nombre, rueda, "2025"):
                total_inserted += 1
    
    logger.info(f"✅ Proceso completado. Torneos insertados: {total_inserted}")
    return total_inserted > 0

def main():
    """Función principal"""
    logger.info("="*80)
    logger.info("🏆 CARGA SIMPLE DE DIM_TORNEO")
    logger.info("="*80)
    logger.info(f"Inicio: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    try:
        # 1. Probar conexión a BD
        if not test_db_connection():
            logger.error("❌ No se pudo conectar a la base de datos")
            return
        
        # 2. Procesar torneos
        success = process_tournaments()
        
        if success:
            logger.info("\n🎉 ¡PROCESO COMPLETADO EXITOSAMENTE!")
        else:
            logger.error("\n💥 PROCESO FALLÓ")
            
    except KeyboardInterrupt:
        logger.warning("\n⚠️ Proceso interrumpido por el usuario")
    except Exception as e:
        logger.error(f"\n❌ Error crítico: {e}")
    finally:
        logger.info(f"Fin: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

if __name__ == "__main__":
    main()

# =============================================================================
# INSTRUCCIONES DE USO:
# 
# 1. Instalar dependencias:
#    pip install mysql-connector-python requests
#
# 2. Configurar contraseña en DB_CONFIG (línea 25)
#
# 3. Ejecutar:
#    python fill_dim_torneo_simple.py
#
# =============================================================================