import requests
import json
import csv
import time
import os
import mysql.connector
from datetime import datetime
import logging

# Configurar logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def safe_api_request(func, *args, **kwargs):
    """Wrapper para hacer requests seguros con retry logic"""
    max_retries = 3
    base_delay = 7  # Mínimo 7 segundos entre requests
    
    for attempt in range(max_retries):
        try:
            logger.info(f"Haciendo request (intento {attempt + 1}/{max_retries})...")
            result = func(*args, **kwargs)
            
            if result is not None:
                logger.info("Request exitoso")
                # IMPORTANTE: Siempre esperar después de un request exitoso
                logger.info(f"Esperando {base_delay} segundos antes del próximo request...")
                time.sleep(base_delay)
                return result
            else:
                logger.warning(f"Request falló, intento {attempt + 1}")
                
        except requests.exceptions.RequestException as e:
            logger.error(f"Error en request (intento {attempt + 1}): {e}")
            
        except Exception as e:
            logger.error(f"Error inesperado (intento {attempt + 1}): {e}")
        
        # Si no es el último intento, esperar antes de reintentar
        if attempt < max_retries - 1:
            wait_time = base_delay * (attempt + 1)  # Backoff exponencial
            logger.info(f"Esperando {wait_time} segundos antes de reintentar...")
            time.sleep(wait_time)
    
    logger.error(f"Todos los intentos fallaron para el request")
    return None

def get_countries(api_key):
    """Obtiene todos los países disponibles"""
    base_url = "https://fbrapi.com"
    url = f"{base_url}/countries"
    headers = {"X-API-Key": api_key}
    
    def _make_request():
        try:
            logger.info("Obteniendo lista de países...")
            response = requests.get(url, headers=headers, timeout=30)
            
            if response.status_code == 200:
                return response.json()
            elif response.status_code == 500:
                logger.error("Error 500 - Servidor interno. Posible sobrecarga de requests.")
                return None
            else:
                logger.error(f"Error HTTP {response.status_code}: {response.text}")
                return None
        except requests.exceptions.Timeout:
            logger.error("Timeout en request de países")
            return None
        except Exception as e:
            logger.error(f"Error en solicitud de países: {e}")
            return None
    
    return safe_api_request(_make_request)

def get_leagues_by_country(country_code, api_key):
    """Obtiene todas las ligas de un país específico"""
    base_url = "https://fbrapi.com"
    url = f"{base_url}/leagues"
    params = {"country_code": country_code}
    headers = {"X-API-Key": api_key}
    
    def _make_request():
        try:
            logger.info(f"Obteniendo ligas para {country_code}...")
            response = requests.get(url, params=params, headers=headers, timeout=30)
            
            if response.status_code == 200:
                return response.json()
            elif response.status_code == 500:
                logger.error("Error 500 - Servidor interno. Posible sobrecarga de requests.")
                return None
            else:
                logger.error(f"Error HTTP {response.status_code}: {response.text}")
                return None
        except requests.exceptions.Timeout:
            logger.error("Timeout en request de ligas")
            return None
        except Exception as e:
            logger.error(f"Error en solicitud de ligas: {e}")
            return None
    
    return safe_api_request(_make_request)

def get_league_matches(league_id, season_id, api_key):
    """Obtiene todos los partidos de una liga específica para una temporada"""
    base_url = "https://fbrapi.com"
    url = f"{base_url}/matches"
    params = {"league_id": league_id}
    if season_id:
        params["season_id"] = season_id
    headers = {"X-API-Key": api_key}
    
    def _make_request():
        try:
            logger.info(f"Obteniendo partidos básicos para liga {league_id}...")
            if season_id:
                logger.info(f"Temporada: {season_id}")
            response = requests.get(url, params=params, headers=headers, timeout=30)
            
            if response.status_code == 200:
                return response.json()
            elif response.status_code == 500:
                logger.error("Error 500 - Servidor interno. Posible sobrecarga de requests.")
                return None
            else:
                logger.error(f"Error HTTP {response.status_code}: {response.text}")
                return None
        except requests.exceptions.Timeout:
            logger.error("Timeout en request de partidos")
            return None
        except Exception as e:
            logger.error(f"Error en solicitud de partidos: {e}")
            return None
    
    return safe_api_request(_make_request)

def get_team_match_stats(team_id, league_id, season_id, api_key):
    """Obtiene estadísticas detalladas de un equipo para toda la temporada"""
    base_url = "https://fbrapi.com"
    url = f"{base_url}/team-match-stats"
    params = {
        "team_id": team_id,
        "league_id": league_id,
        "season_id": season_id
    }
    headers = {"X-API-Key": api_key}
    
    def _make_request():
        try:
            response = requests.get(url, params=params, headers=headers, timeout=30)
            
            if response.status_code == 200:
                return response.json()
            elif response.status_code == 500:
                logger.error(f"Error 500 obteniendo stats para equipo {team_id}")
                return None
            else:
                logger.error(f"Error {response.status_code} obteniendo stats para equipo {team_id}")
                return None
        except requests.exceptions.Timeout:
            logger.error(f"Timeout obteniendo stats para equipo {team_id}")
            return None
        except Exception as e:
            logger.error(f"Error en solicitud stats para equipo {team_id}: {e}")
            return None
    
    return safe_api_request(_make_request)

def get_match_players(match_id, api_key):
    """Obtiene todos los jugadores citados en un partido específico"""
    base_url = "https://fbrapi.com"
    url = f"{base_url}/all-players-match-stats"
    params = {"match_id": match_id}
    headers = {"X-API-Key": api_key}
    
    def _make_request():
        try:
            response = requests.get(url, params=params, headers=headers, timeout=30)
            
            if response.status_code == 200:
                return response.json()
            elif response.status_code == 500:
                logger.error(f"Error 500 obteniendo jugadores para partido {match_id}")
                return None
            else:
                logger.error(f"Error {response.status_code} obteniendo jugadores para partido {match_id}")
                return None
        except requests.exceptions.Timeout:
            logger.error(f"Timeout obteniendo jugadores para partido {match_id}")
            return None
        except Exception as e:
            logger.error(f"Error en solicitud jugadores para partido {match_id}: {e}")
            return None
    
    return safe_api_request(_make_request)

def create_database_connection():
    """Crea conexión a la base de datos MySQL"""
    try:
        connection = mysql.connector.connect(
            host='192.168.100.16',
            database='MP_DATA_DEV',
            user='mpuga',
            password='123qweasd',
            charset='utf8mb4',
            collation='utf8mb4_unicode_ci'
        )
        logger.info("✅ Conexión a MySQL establecida")
        return connection
    except mysql.connector.Error as e:
        logger.error(f"❌ Error conectando a MySQL: {e}")
        return None

def create_matches_table(cursor):
    """Crea la tabla de partidos si no existe"""
    create_table_query = """
    CREATE TABLE IF NOT EXISTS PARTIDOS_PRIMERA_DIVISION_CHILE (
        ID_PARTIDO VARCHAR(20) PRIMARY KEY,
        ID_LIGA INT,
        NOMBRE_LIGA VARCHAR(100),
        TEMPORADA VARCHAR(10),
        FECHA DATE,
        HORA TIME,
        RONDA VARCHAR(50),
        JORNADA VARCHAR(10),
        ESTADIO VARCHAR(100),
        ASISTENCIA VARCHAR(20),
        ARBITRO VARCHAR(100),
        
        -- Equipos
        EQUIPO_LOCAL VARCHAR(100),
        ID_EQUIPO_LOCAL VARCHAR(20),
        EQUIPO_VISITANTE VARCHAR(100),
        ID_EQUIPO_VISITANTE VARCHAR(20),
        
        -- Resultado básico
        GOLES_LOCAL INT,
        GOLES_VISITANTE INT,
        ESTADO_PARTIDO VARCHAR(20) DEFAULT 'PROGRAMADO',
        
        -- Estadísticas Local
        RESULTADO_LOCAL VARCHAR(5),
        GOLES_LOCAL_DETALLE INT,
        GOLES_EN_CONTRA_LOCAL INT,
        XG_LOCAL DECIMAL(5,2),
        XGA_LOCAL DECIMAL(5,2),
        POSESION_LOCAL DECIMAL(5,2),
        CAPITAN_LOCAL VARCHAR(100),
        FORMACION_LOCAL VARCHAR(20),
        
        -- Portero Local
        TIROS_AL_ARCO_CONTRA_LOCAL INT,
        ATAJADAS_LOCAL INT,
        PORCENTAJE_ATAJADAS_LOCAL DECIMAL(5,2),
        VALLA_INVICTA_LOCAL INT,
        PSXG_LOCAL DECIMAL(5,2),
        PENALES_ENFRENTADOS_LOCAL INT,
        PENALES_ATAJADOS_LOCAL INT,
        
        -- Tiros Local
        TIROS_TOTALES_LOCAL INT,
        TIROS_AL_ARCO_LOCAL INT,
        TIROS_POR_90_LOCAL DECIMAL(5,2),
        TIROS_AL_ARCO_POR_90_LOCAL DECIMAL(5,2),
        
        -- Pases Local
        PASES_COMPLETADOS_LOCAL INT,
        PASES_INTENTADOS_LOCAL INT,
        PORCENTAJE_PASES_LOCAL DECIMAL(5,2),
        PASES_PROGRESIVOS_LOCAL INT,
        
        -- Defensa Local
        TACKLES_LOCAL INT,
        TACKLES_GANADOS_LOCAL INT,
        INTERCEPCIONES_LOCAL INT,
        BLOQUEOS_LOCAL INT,
        DESPEJES_LOCAL INT,
        
        -- Posesión Local
        TOQUES_LOCAL INT,
        REGATES_INTENTADOS_LOCAL INT,
        REGATES_EXITOSOS_LOCAL INT,
        CONDUCCIONES_LOCAL INT,
        
        -- Tarjetas y Faltas Local
        TARJETAS_AMARILLAS_LOCAL INT,
        TARJETAS_ROJAS_LOCAL INT,
        SEGUNDA_AMARILLA_LOCAL INT,
        FALTAS_COMETIDAS_LOCAL INT,
        FALTAS_RECIBIDAS_LOCAL INT,
        FUERA_DE_JUEGO_LOCAL INT,
        PENALES_GANADOS_LOCAL INT,
        PENALES_CONCEDIDOS_LOCAL INT,
        AUTOGOLES_LOCAL INT,
        
        -- Estadísticas Visitante (misma estructura)
        RESULTADO_VISITANTE VARCHAR(5),
        GOLES_VISITANTE_DETALLE INT,
        GOLES_EN_CONTRA_VISITANTE INT,
        XG_VISITANTE DECIMAL(5,2),
        XGA_VISITANTE DECIMAL(5,2),
        POSESION_VISITANTE DECIMAL(5,2),
        CAPITAN_VISITANTE VARCHAR(100),
        FORMACION_VISITANTE VARCHAR(20),
        
        -- Portero Visitante
        TIROS_AL_ARCO_CONTRA_VISITANTE INT,
        ATAJADAS_VISITANTE INT,
        PORCENTAJE_ATAJADAS_VISITANTE DECIMAL(5,2),
        VALLA_INVICTA_VISITANTE INT,
        PSXG_VISITANTE DECIMAL(5,2),
        PENALES_ENFRENTADOS_VISITANTE INT,
        PENALES_ATAJADOS_VISITANTE INT,
        
        -- Tiros Visitante
        TIROS_TOTALES_VISITANTE INT,
        TIROS_AL_ARCO_VISITANTE INT,
        TIROS_POR_90_VISITANTE DECIMAL(5,2),
        TIROS_AL_ARCO_POR_90_VISITANTE DECIMAL(5,2),
        
        -- Pases Visitante
        PASES_COMPLETADOS_VISITANTE INT,
        PASES_INTENTADOS_VISITANTE INT,
        PORCENTAJE_PASES_VISITANTE DECIMAL(5,2),
        PASES_PROGRESIVOS_VISITANTE INT,
        
        -- Defensa Visitante
        TACKLES_VISITANTE INT,
        TACKLES_GANADOS_VISITANTE INT,
        INTERCEPCIONES_VISITANTE INT,
        BLOQUEOS_VISITANTE INT,
        DESPEJES_VISITANTE INT,
        
        -- Posesión Visitante
        TOQUES_VISITANTE INT,
        REGATES_INTENTADOS_VISITANTE INT,
        REGATES_EXITOSOS_VISITANTE INT,
        CONDUCCIONES_VISITANTE INT,
        
        -- Tarjetas y Faltas Visitante
        TARJETAS_AMARILLAS_VISITANTE INT,
        TARJETAS_ROJAS_VISITANTE INT,
        SEGUNDA_AMARILLA_VISITANTE INT,
        FALTAS_COMETIDAS_VISITANTE INT,
        FALTAS_RECIBIDAS_VISITANTE INT,
        FUERA_DE_JUEGO_VISITANTE INT,
        PENALES_GANADOS_VISITANTE INT,
        PENALES_CONCEDIDOS_VISITANTE INT,
        AUTOGOLES_VISITANTE INT,
        
        -- Metadatos
        RUEDA VARCHAR(10) DEFAULT '0',
        HORA_INSERCION TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FECHA_ACTUALIZACION TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CREATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    """
    
    try:
        cursor.execute(create_table_query)
        logger.info("✅ Tabla PARTIDOS_PRIMERA_DIVISION_CHILE creada/verificada")
    except mysql.connector.Error as e:
        logger.error(f"❌ Error creando tabla de partidos: {e}")

def create_match_players_table(cursor):
    """Crea la tabla de jugadores por partido si no existe - SIN CLAVES FORÁNEAS"""
    create_table_query = """
    CREATE TABLE IF NOT EXISTS JUGADORES_POR_PARTIDO_CHILE (
        ID INT AUTO_INCREMENT PRIMARY KEY,
        ID_PARTIDO VARCHAR(20),
        ID_JUGADOR VARCHAR(20),
        NOMBRE_JUGADOR VARCHAR(100),
        NUMERO_CAMISETA VARCHAR(5),
        EDAD INT,
        CODIGO_PAIS VARCHAR(5),
        EQUIPO VARCHAR(100),
        LOCAL_VISITANTE VARCHAR(10),
        
        -- Estadísticas del partido
        TITULAR VARCHAR(5),
        POSICION VARCHAR(20),
        MINUTOS_JUGADOS INT,
        GOLES INT,
        ASISTENCIAS INT,
        TIROS INT,
        TIROS_AL_ARCO INT,
        XG DECIMAL(5,2),
        XG_SIN_PENAL DECIMAL(5,2),
        XA DECIMAL(5,2),
        
        -- Pases
        PASES_COMPLETADOS INT,
        PASES_INTENTADOS INT,
        PORCENTAJE_PASES DECIMAL(5,2),
        PASES_PROGRESIVOS INT,
        
        -- Defensa
        TACKLES INT,
        INTERCEPCIONES INT,
        BLOQUEOS INT,
        
        -- Posesión
        TOQUES INT,
        REGATES_INTENTADOS INT,
        REGATES_EXITOSOS INT,
        
        -- Disciplina
        TARJETAS_AMARILLAS INT,
        TARJETAS_ROJAS INT,
        FALTAS_COMETIDAS INT,
        FALTAS_RECIBIDAS INT,
        FUERA_DE_JUEGO INT,
        PENALES_GANADOS INT,
        PENALES_FALLADOS INT,
        
        -- Metadatos
        RUEDA VARCHAR(10) DEFAULT '0',
        HORA_INSERCION TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FECHA_ACTUALIZACION TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CREATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        INDEX idx_partido (ID_PARTIDO),
        INDEX idx_jugador (ID_JUGADOR),
        INDEX idx_equipo (EQUIPO),
        INDEX idx_hora_insercion (HORA_INSERCION)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    """
    
    try:
        cursor.execute(create_table_query)
        logger.info("✅ Tabla JUGADORES_POR_PARTIDO_CHILE creada/verificada (sin claves foráneas)")
    except mysql.connector.Error as e:
        logger.error(f"❌ Error creando tabla de jugadores: {e}")

def find_chilean_first_division(api_key):
    """Encuentra el ID de la Primera División chilena"""
    logger.info(f"{'='*60}")
    logger.info("BUSCANDO PRIMERA DIVISIÓN CHILENA")
    logger.info(f"{'='*60}")
    
    # Buscar Chile en la lista de países
    countries_data = get_countries(api_key)
    
    if not countries_data:
        logger.error("❌ No se pudieron obtener los países")
        return None
    
    # Buscar Chile
    chile_info = None
    for country in countries_data.get('data', []):
        if country.get('country', '').lower() == 'chile':
            chile_info = country
            break
    
    if not chile_info:
        logger.error("❌ No se encontró Chile en la lista de países")
        return None
    
    logger.info(f"✅ Chile encontrado:")
    logger.info(f"   Código país: {chile_info.get('country_code')}")
    logger.info(f"   Clubes: {chile_info.get('#_clubs')}")
    logger.info(f"   Jugadores: {chile_info.get('#_players')}")
    
    # Obtener ligas de Chile
    leagues_data = get_leagues_by_country(chile_info.get('country_code'), api_key)
    
    if not leagues_data:
        logger.error("❌ No se pudieron obtener las ligas chilenas")
        return None
    
    # Buscar la Primera División (nivel 1)
    first_division = None
    logger.info(f"\n{'='*60}")
    logger.info("LIGAS CHILENAS DISPONIBLES")
    logger.info(f"{'='*60}")
    
    for league_category in leagues_data.get('data', []):
        if league_category.get('league_type') == 'domestic_leagues':
            leagues = league_category.get('leagues', [])
            
            for league in leagues:
                if league.get('gender') == 'M':  # Solo ligas masculinas
                    league_info = {
                        'league_id': league.get('league_id'),
                        'competition_name': league.get('competition_name'),
                        'tier': league.get('tier'),
                        'last_season': league.get('last_season')
                    }
                    
                    logger.info(f"  Liga: {league_info['competition_name']}")
                    logger.info(f"  ID: {league_info['league_id']}")
                    logger.info(f"  Nivel: {league_info['tier']}")
                    logger.info(f"  Última temporada: {league_info['last_season']}")
                    logger.info(f"  {'-'*40}")
                    
                    # Buscar Primera División (tier 1st)
                    if league_info['tier'] == '1st':
                        first_division = league_info
                        logger.info(f"  ✅ PRIMERA DIVISIÓN ENCONTRADA!")
    
    return first_division

def find_team_match_stats(team_id, match_id, team_stats_list):
    """Encuentra las estadísticas de un equipo específico para un partido específico"""
    if not team_stats_list or 'data' not in team_stats_list:
        return None
    
    for match_stats in team_stats_list['data']:
        if match_stats.get('meta_data', {}).get('match_id') == match_id:
            return match_stats
    
    return None

def extract_team_stats(team_stats, prefix):
    """Extrae estadísticas de un equipo con prefijo (home_ o away_)"""
    if not team_stats or 'stats' not in team_stats:
        return {}
    
    stats = team_stats['stats']
    extracted = {}
    
    # Función auxiliar para convertir valores según tipo esperado
    def convert_value(value, data_type='string'):
        """Convierte valores según el tipo de dato esperado en MySQL"""
        if isinstance(value, list):
            if not value:
                return None if data_type in ['integer', 'decimal'] else ''
            return ', '.join(str(v) for v in value)
        
        if value is None:
            return None
        
        if value == '' and data_type in ['integer', 'decimal']:
            return None
        
        if data_type == 'integer':
            try:
                return int(float(value)) if value not in [None, ''] else None
            except (ValueError, TypeError):
                return None
        elif data_type == 'decimal':
            try:
                return float(value) if value not in [None, ''] else None
            except (ValueError, TypeError):
                return None
        
        return value
    
    # Schedule (información general)
    schedule = stats.get('schedule', {})
    extracted.update({
        f'{prefix}_result': convert_value(schedule.get('result'), 'string'),
        f'{prefix}_gls': convert_value(schedule.get('gls'), 'integer'),
        f'{prefix}_gls_ag': convert_value(schedule.get('gls_ag'), 'integer'),
        f'{prefix}_xg': convert_value(schedule.get('xg'), 'decimal'),
        f'{prefix}_xga': convert_value(schedule.get('xga'), 'decimal'),
        f'{prefix}_poss': convert_value(schedule.get('poss'), 'decimal'),
        f'{prefix}_captain': convert_value(schedule.get('captain'), 'string'),
        f'{prefix}_formation': convert_value(schedule.get('formation'), 'string')
    })
    
    # Keeper (estadísticas de portero)
    keeper = stats.get('keeper', {})
    extracted.update({
        f'{prefix}_sot_ag': convert_value(keeper.get('sot_ag'), 'integer'),
        f'{prefix}_saves': convert_value(keeper.get('saves'), 'integer'),
        f'{prefix}_save_pct': convert_value(keeper.get('save_pct'), 'decimal'),
        f'{prefix}_clean_sheets': convert_value(keeper.get('clean_sheets'), 'integer'),
        f'{prefix}_psxg': convert_value(keeper.get('psxg'), 'decimal'),
        f'{prefix}_pk_att': convert_value(keeper.get('pk_att'), 'integer'),
        f'{prefix}_pk_saved': convert_value(keeper.get('pk_saved'), 'integer')
    })
    
    # Shooting (estadísticas de tiro)
    shooting = stats.get('shooting', {})
    extracted.update({
        f'{prefix}_sh': convert_value(shooting.get('sh'), 'integer'),
        f'{prefix}_sot': convert_value(shooting.get('sot'), 'integer'),
        f'{prefix}_sh_per90': convert_value(shooting.get('sh_per90'), 'decimal'),
        f'{prefix}_sot_per90': convert_value(shooting.get('sot_per90'), 'decimal')
    })
    
    # Passing (estadísticas de pase)
    passing = stats.get('passing', {})
    extracted.update({
        f'{prefix}_pass_cmp': convert_value(passing.get('pass_cmp'), 'integer'),
        f'{prefix}_pass_att': convert_value(passing.get('pass_att'), 'integer'),
        f'{prefix}_pct_pass_cmp': convert_value(passing.get('pct_pass_cmp'), 'decimal'),
        f'{prefix}_pass_prog': convert_value(passing.get('pass_prog'), 'integer')
    })
    
    # Defense (estadísticas defensivas)
    defense = stats.get('defense', {})
    extracted.update({
        f'{prefix}_tkl': convert_value(defense.get('tkl'), 'integer'),
        f'{prefix}_tkl_won': convert_value(defense.get('tkl_won'), 'integer'),
        f'{prefix}_int': convert_value(defense.get('int'), 'integer'),
        f'{prefix}_blocks': convert_value(defense.get('blocks'), 'integer'),
        f'{prefix}_clearances': convert_value(defense.get('clearances'), 'integer')
    })
    
    # Possession (estadísticas de posesión)
    possession = stats.get('possession', {})
    extracted.update({
        f'{prefix}_touches': convert_value(possession.get('touches'), 'integer'),
        f'{prefix}_take_on_att': convert_value(possession.get('take_on_att'), 'integer'),
        f'{prefix}_take_on_suc': convert_value(possession.get('take_on_suc'), 'integer'),
        f'{prefix}_carries': convert_value(possession.get('carries'), 'integer')
    })
    
    # Misc (tarjetas, faltas, etc.)
    misc = stats.get('misc', {})
    extracted.update({
        f'{prefix}_yellow_cards': convert_value(misc.get('yellow_cards'), 'integer'),
        f'{prefix}_red_cards': convert_value(misc.get('red_cards'), 'integer'),
        f'{prefix}_second_yellow_cards': convert_value(misc.get('second_yellow_cards'), 'integer'),
        f'{prefix}_fls_com': convert_value(misc.get('fls_com'), 'integer'),
        f'{prefix}_fls_drawn': convert_value(misc.get('fls_drawn'), 'integer'),
        f'{prefix}_offside': convert_value(misc.get('offside'), 'integer'),
        f'{prefix}_pk_won': convert_value(misc.get('pk_won'), 'integer'),
        f'{prefix}_pk_conceded': convert_value(misc.get('pk_conceded'), 'integer'),
        f'{prefix}_og': convert_value(misc.get('og'), 'integer')
    })
    
    return extracted

def determine_match_status(match_data):
    """Determina el estado del partido basado en múltiples criterios"""
    # Criterio 1: Si hay goles registrados en el resultado básico
    if (match_data.get('home_score') is not None and 
        match_data.get('away_score') is not None):
        return 'JUGADO'
    
    # Criterio 2: Si hay resultado en las estadísticas detalladas
    if (match_data.get('home_result') is not None or 
        match_data.get('away_result') is not None):
        return 'JUGADO'
    
    # Criterio 3: Verificar fecha del partido
    match_date = match_data.get('date')
    if match_date:
        try:
            from datetime import datetime, date
            match_datetime = datetime.strptime(match_date, '%Y-%m-%d').date()
            today = date.today()
            
            if match_datetime < today:
                return 'JUGADO'  # Fecha pasada
            elif match_datetime == today:
                return 'EN_CURSO'  # Hoy
            else:
                return 'PROGRAMADO'  # Fecha futura
        except:
            pass
    
    return 'PROGRAMADO'

def process_detailed_matches(matches_data, league_info, api_key):
    """Procesa los partidos con estadísticas detalladas"""
    if not matches_data or 'data' not in matches_data:
        logger.error("❌ No hay datos de partidos para procesar")
        return []
    
    def convert_match_value(value, data_type='string'):
        """Convierte valores según el tipo de dato esperado en MySQL"""
        if isinstance(value, list):
            if not value:
                return None if data_type in ['integer', 'decimal'] else ''
            return ', '.join(str(v) for v in value)
        
        if value is None:
            return None
        
        if value == '' and data_type in ['integer', 'decimal']:
            return None
        
        if data_type == 'integer':
            try:
                return int(float(value)) if value not in [None, ''] else None
            except (ValueError, TypeError):
                return None
        elif data_type == 'decimal':
            try:
                return float(value) if value not in [None, ''] else None
            except (ValueError, TypeError):
                return None
        
        return value
    
    processed_matches = []
    total_matches = len(matches_data['data'])
    
    logger.info(f"\n{'='*60}")
    logger.info(f"PROCESANDO {total_matches} PARTIDOS CON ESTADÍSTICAS DETALLADAS")
    logger.info(f"Liga: {league_info['competition_name']} | Temporada: 2025")
    logger.info(f"{'='*60}")
    
    # Calcular tiempo estimado más conservador
    estimated_minutes = (total_matches * 21 + 60) / 60  # +60 seg buffer
    logger.info("⚠️ Este proceso tomará tiempo debido al límite de 7 segundos entre peticiones")
    logger.info(f"⏱️ Tiempo estimado: {estimated_minutes:.1f} minutos\n")
    
    # Obtener todos los equipos únicos para hacer peticiones por equipo
    teams_stats = {}
    unique_teams = set()
    
    for match in matches_data['data']:
        if match.get('home_team_id'):
            unique_teams.add(match['home_team_id'])
        if match.get('away_team_id'):
            unique_teams.add(match['away_team_id'])
    
    logger.info(f"📊 Obteniendo estadísticas para {len(unique_teams)} equipos...")
    
    # Obtener estadísticas de cada equipo con manejo de errores mejorado
    successful_teams = 0
    for i, team_id in enumerate(unique_teams, 1):
        logger.info(f"[{i}/{len(unique_teams)}] Obteniendo estadísticas del equipo {team_id}...")
        team_stats = get_team_match_stats(team_id, league_info['league_id'], "2025", api_key)
        if team_stats:
            teams_stats[team_id] = team_stats
            successful_teams += 1
            logger.info(f"  ✅ {len(team_stats.get('data', []))} partidos obtenidos")
        else:
            logger.warning(f"  ❌ No se pudieron obtener estadísticas para equipo {team_id}")
    
    logger.info(f"\n📊 Resumen de equipos procesados: {successful_teams}/{len(unique_teams)}")
    
    logger.info(f"\n{'='*60}")
    logger.info("COMBINANDO DATOS DE PARTIDOS CON ESTADÍSTICAS")
    logger.info(f"{'='*60}")
    
    for i, match in enumerate(matches_data['data'], 1):
        logger.info(f"[{i}/{total_matches}] Procesando partido: {match.get('match_id', 'N/A')}")
        
        # Información básica del partido
        match_info = {
            'ID_PARTIDO': convert_match_value(match.get('match_id', ''), 'string'),
            'ID_LIGA': league_info['league_id'],
            'NOMBRE_LIGA': league_info['competition_name'],
            'TEMPORADA': '2025',
            'FECHA': convert_match_value(match.get('date', ''), 'string'),
            'HORA': convert_match_value(match.get('time', ''), 'string'),
            'RONDA': convert_match_value(match.get('round', ''), 'string'),
            'JORNADA': convert_match_value(match.get('wk', ''), 'string'),
            'EQUIPO_LOCAL': convert_match_value(match.get('home', ''), 'string'),
            'ID_EQUIPO_LOCAL': convert_match_value(match.get('home_team_id', ''), 'string'),
            'EQUIPO_VISITANTE': convert_match_value(match.get('away', ''), 'string'),
            'ID_EQUIPO_VISITANTE': convert_match_value(match.get('away_team_id', ''), 'string'),
            'GOLES_LOCAL': convert_match_value(match.get('home_team_score', None), 'integer'),
            'GOLES_VISITANTE': convert_match_value(match.get('away_team_score', None), 'integer'),
            'ESTADIO': convert_match_value(match.get('venue', ''), 'string'),
            'ASISTENCIA': convert_match_value(match.get('attendance', ''), 'string'),
            'ARBITRO': convert_match_value(match.get('referee', ''), 'string'),
            'RUEDA': '1',  # Por defecto primera rueda
            'HORA_INSERCION': 'NOW()'  # Se manejará en el INSERT
        }
        
        # Obtener estadísticas del equipo local
        home_team_id = match.get('home_team_id')
        away_team_id = match.get('away_team_id')
        match_id = match.get('match_id')
        
        if home_team_id in teams_stats and match_id:
            home_stats = find_team_match_stats(home_team_id, match_id, teams_stats[home_team_id])
            if home_stats:
                home_extracted = extract_team_stats(home_stats, 'home')
                # Convertir a nombres de columnas de MySQL
                for key, value in home_extracted.items():
                    mysql_key = key.replace('home_', '').upper()
                    if mysql_key == 'RESULT':
                        match_info['RESULTADO_LOCAL'] = value
                    elif mysql_key == 'GLS':
                        match_info['GOLES_LOCAL_DETALLE'] = value
                    elif mysql_key == 'GLS_AG':
                        match_info['GOLES_EN_CONTRA_LOCAL'] = value
                    elif mysql_key == 'XG':
                        match_info['XG_LOCAL'] = value
                    elif mysql_key == 'XGA':
                        match_info['XGA_LOCAL'] = value
                    elif mysql_key == 'POSS':
                        match_info['POSESION_LOCAL'] = value
                    elif mysql_key == 'CAPTAIN':
                        match_info['CAPITAN_LOCAL'] = value
                    elif mysql_key == 'FORMATION':
                        match_info['FORMACION_LOCAL'] = value
                logger.info(f"  ✅ Estadísticas del equipo local agregadas")
        
        # Obtener estadísticas del equipo visitante
        if away_team_id in teams_stats and match_id:
            away_stats = find_team_match_stats(away_team_id, match_id, teams_stats[away_team_id])
            if away_stats:
                away_extracted = extract_team_stats(away_stats, 'away')
                # Convertir a nombres de columnas de MySQL
                for key, value in away_extracted.items():
                    mysql_key = key.replace('away_', '').upper()
                    if mysql_key == 'RESULT':
                        match_info['RESULTADO_VISITANTE'] = value
                    elif mysql_key == 'GLS':
                        match_info['GOLES_VISITANTE_DETALLE'] = value
                    elif mysql_key == 'GLS_AG':
                        match_info['GOLES_EN_CONTRA_VISITANTE'] = value
                    elif mysql_key == 'XG':
                        match_info['XG_VISITANTE'] = value
                    elif mysql_key == 'XGA':
                        match_info['XGA_VISITANTE'] = value
                    elif mysql_key == 'POSS':
                        match_info['POSESION_VISITANTE'] = value
                    elif mysql_key == 'CAPTAIN':
                        match_info['CAPITAN_VISITANTE'] = value
                    elif mysql_key == 'FORMATION':
                        match_info['FORMACION_VISITANTE'] = value
                logger.info(f"  ✅ Estadísticas del equipo visitante agregadas")
        
        # Determinar estado del partido
        match_info['ESTADO_PARTIDO'] = determine_match_status(match_info)
        
        processed_matches.append(match_info)
    
    return processed_matches

def process_match_players(matches_data, api_key):
    """Procesa los jugadores citados en cada partido"""
    all_players = []
    
    logger.info(f"\n{'='*60}")
    logger.info("OBTENIENDO JUGADORES CITADOS POR PARTIDO")
    logger.info(f"{'='*60}")
    
    def convert_player_value(value, data_type='string'):
        """Convierte valores según el tipo de dato esperado en MySQL"""
        if isinstance(value, list):
            if not value:
                return None if data_type in ['integer', 'decimal'] else ''
            return ', '.join(str(v) for v in value)
        
        if value is None:
            return None
        
        if value == '' and data_type in ['integer', 'decimal']:
            return None
        
        if data_type == 'integer':
            try:
                return int(float(value)) if value not in [None, ''] else None
            except (ValueError, TypeError):
                return None
        elif data_type == 'decimal':
            try:
                return float(value) if value not in [None, ''] else None
            except (ValueError, TypeError):
                return None
        
        return value
    
    successful_matches = 0
    failed_matches = 0
    
    for i, match in enumerate(matches_data, 1):
        match_id = match.get('ID_PARTIDO')
        if not match_id:
            continue
            
        logger.info(f"[{i}/{len(matches_data)}] Obteniendo jugadores para partido {match_id}...")
        
        players_data = get_match_players(match_id, api_key)
        
        if players_data and 'data' in players_data:
            successful_matches += 1
            for team_data in players_data['data']:
                team_name = team_data.get('team_name', '')
                home_away = team_data.get('home_away', '')
                
                for player in team_data.get('players', []):
                    meta_data = player.get('meta_data', {})
                    stats = player.get('stats', {})
                    summary = stats.get('summary', {})
                    misc = stats.get('misc', {})
                    
                    player_info = {
                        'ID_PARTIDO': match_id,
                        'ID_JUGADOR': convert_player_value(meta_data.get('player_id', ''), 'string'),
                        'NOMBRE_JUGADOR': convert_player_value(meta_data.get('player_name', ''), 'string'),
                        'NUMERO_CAMISETA': convert_player_value(meta_data.get('player_number', ''), 'string'),
                        'EDAD': convert_player_value(meta_data.get('age', None), 'integer'),
                        'CODIGO_PAIS': convert_player_value(meta_data.get('player_country_code', ''), 'string'),
                        'EQUIPO': team_name,
                        'LOCAL_VISITANTE': 'LOCAL' if home_away.lower() == 'home' else 'VISITANTE',
                        
                        # Estadísticas del partido
                        'TITULAR': convert_player_value(summary.get('start', ''), 'string'),
                        'POSICION': convert_player_value(summary.get('positions', ''), 'string'),
                        'MINUTOS_JUGADOS': convert_player_value(summary.get('min', None), 'integer'),
                        'GOLES': convert_player_value(summary.get('gls', 0), 'integer'),
                        'ASISTENCIAS': convert_player_value(summary.get('ast', 0), 'integer'),
                        'TIROS': convert_player_value(summary.get('sh', 0), 'integer'),
                        'TIROS_AL_ARCO': convert_player_value(summary.get('sot', 0), 'integer'),
                        'XG': convert_player_value(summary.get('xg', None), 'decimal'),
                        'XG_SIN_PENAL': convert_player_value(summary.get('non_pen_xg', None), 'decimal'),
                        'XA': convert_player_value(summary.get('xag', None), 'decimal'),
                        
                        # Pases
                        'PASES_COMPLETADOS': convert_player_value(summary.get('pass_cmp', 0), 'integer'),
                        'PASES_INTENTADOS': convert_player_value(summary.get('pass_att', 0), 'integer'),
                        'PORCENTAJE_PASES': convert_player_value(summary.get('pct_pass_cmp', None), 'decimal'),
                        'PASES_PROGRESIVOS': convert_player_value(summary.get('pass_prog', 0), 'integer'),
                        
                        # Defensa
                        'TACKLES': convert_player_value(summary.get('tkl', 0), 'integer'),
                        'INTERCEPCIONES': convert_player_value(summary.get('int', 0), 'integer'),
                        'BLOQUEOS': convert_player_value(summary.get('blocks', 0), 'integer'),
                        
                        # Posesión
                        'TOQUES': convert_player_value(summary.get('touches', 0), 'integer'),
                        'REGATES_INTENTADOS': convert_player_value(summary.get('take_on_att', 0), 'integer'),
                        'REGATES_EXITOSOS': convert_player_value(summary.get('take_on_suc', 0), 'integer'),
                        
                        # Disciplina
                        'TARJETAS_AMARILLAS': convert_player_value(summary.get('yellow_cards', 0), 'integer'),
                        'TARJETAS_ROJAS': convert_player_value(summary.get('red_cards', 0), 'integer'),
                        'FALTAS_COMETIDAS': convert_player_value(misc.get('fls_com', 0), 'integer'),
                        'FALTAS_RECIBIDAS': convert_player_value(misc.get('fls_drawn', 0), 'integer'),
                        'FUERA_DE_JUEGO': convert_player_value(misc.get('offside', 0), 'integer'),
                        'PENALES_GANADOS': convert_player_value(misc.get('pk_won', 0), 'integer'),
                        'PENALES_FALLADOS': convert_player_value(
                            (summary.get('pk_att', 0) or 0) - (summary.get('pk_made', 0) or 0), 'integer'
                        ),
                        
                        'RUEDA': '1',  # Por defecto primera rueda
                        'HORA_INSERCION': 'NOW()'  # Se manejará en el INSERT
                    }
                    
                    all_players.append(player_info)
            
            logger.info(f"  ✅ {sum(len(team.get('players', [])) for team in players_data['data'])} jugadores obtenidos")
        else:
            failed_matches += 1
            logger.warning(f"  ❌ No se pudieron obtener jugadores")
    
    logger.info(f"\n📊 Resumen de jugadores procesados:")
    logger.info(f"  ✅ Partidos exitosos: {successful_matches}")
    logger.info(f"  ❌ Partidos fallidos: {failed_matches}")
    logger.info(f"  👥 Total jugadores: {len(all_players)}")
    
    return all_players

def insert_matches_to_mysql(matches_data, connection):
    """Inserta los datos de partidos en MySQL con manejo mejorado de errores"""
    if not matches_data:
        logger.error("❌ No hay datos de partidos para insertar")
        return False
    
    cursor = connection.cursor()
    
    # Crear tabla si no existe
    create_matches_table(cursor)
    
    logger.info(f"\n🔄 Iniciando inserción de {len(matches_data)} partidos...")
    
    # Preparar query de inserción CON HORA_INSERCION
    columns = list(matches_data[0].keys())
    # Remover HORA_INSERCION de las columnas ya que se manejará en el query
    if 'HORA_INSERCION' in columns:
        columns.remove('HORA_INSERCION')
    
    # Crear placeholders para los valores (excepto HORA_INSERCION)
    placeholders = ', '.join(['%s'] * len(columns))
    
    # Query de inserción con ON DUPLICATE KEY UPDATE y HORA_INSERCION = NOW()
    query = f"""
        INSERT INTO PARTIDOS_PRIMERA_DIVISION_CHILE 
        ({', '.join(columns)}, HORA_INSERCION) 
        VALUES ({placeholders}, NOW())
        ON DUPLICATE KEY UPDATE
        {', '.join([f'{col} = VALUES({col})' for col in columns if col != 'ID_PARTIDO'])},
        HORA_INSERCION = NOW()
    """
    
    logger.info(f"📋 Columnas a insertar: {len(columns)} + HORA_INSERCION")
    logger.info(f"📋 Primeras 5 columnas: {columns[:5]}")
    
    try:
        successful_inserts = 0
        failed_inserts = 0
        
        # Insertar registros uno por uno para mejor control de errores
        for i, match in enumerate(matches_data, 1):
            try:
                # Obtener valores excluyendo HORA_INSERCION (se maneja en query)
                values = []
                for col in columns:
                    values.append(match.get(col))
                
                # Debug: mostrar algunos valores para verificar
                if i <= 3:  # Solo para los primeros 3 registros
                    logger.info(f"\n🔍 Debug registro {i}:")
                    logger.info(f"   ID_PARTIDO: {match.get('ID_PARTIDO')}")
                    logger.info(f"   FECHA: {match.get('FECHA')}")
                    logger.info(f"   EQUIPO_LOCAL: {match.get('EQUIPO_LOCAL')}")
                    logger.info(f"   EQUIPO_VISITANTE: {match.get('EQUIPO_VISITANTE')}")
                    logger.info(f"   Valores None en registro: {sum(1 for v in values if v is None)}")
                
                cursor.execute(query, values)
                successful_inserts += 1
                
                if i % 10 == 0:  # Progreso cada 10 registros
                    logger.info(f"✅ Procesados {i}/{len(matches_data)} partidos...")
                    
            except mysql.connector.Error as e:
                failed_inserts += 1
                logger.error(f"❌ Error insertando partido {i} (ID: {match.get('ID_PARTIDO', 'N/A')}): {e}")
                continue
        
        connection.commit()
        
        logger.info(f"\n📊 Resumen de inserción de partidos:")
        logger.info(f"   ✅ Exitosos: {successful_inserts}")
        logger.info(f"   ❌ Fallidos: {failed_inserts}")
        logger.info(f"   📈 Tasa de éxito: {(successful_inserts/len(matches_data)*100):.1f}%")
        
        # Verificar cuántos registros hay en la tabla
        cursor.execute("SELECT COUNT(*) FROM PARTIDOS_PRIMERA_DIVISION_CHILE")
        total_records = cursor.fetchone()[0]
        logger.info(f"   📊 Total registros en tabla: {total_records}")
        
        # Verificar registros insertados en esta ejecución
        cursor.execute("""
            SELECT COUNT(*) FROM PARTIDOS_PRIMERA_DIVISION_CHILE 
            WHERE HORA_INSERCION >= DATE_SUB(NOW(), INTERVAL 1 HOUR)
        """)
        recent_records = cursor.fetchone()[0]
        logger.info(f"   🕐 Registros insertados en la última hora: {recent_records}")
        
        return successful_inserts > 0
        
    except mysql.connector.Error as e:
        logger.error(f"❌ Error general insertando partidos: {e}")
        connection.rollback()
        return False
    finally:
        cursor.close()

def insert_players_to_mysql(players_data, connection):
    """Inserta los datos de jugadores por partido en MySQL con manejo mejorado de errores"""
    if not players_data:
        logger.error("❌ No hay datos de jugadores para insertar")
        return False
    
    cursor = connection.cursor()
    
    # Crear tabla si no existe
    create_match_players_table(cursor)
    
    logger.info(f"\n🔄 Iniciando inserción de {len(players_data)} registros de jugadores...")
    
    # Preparar query de inserción CON HORA_INSERCION
    columns = list(players_data[0].keys())
    # Remover HORA_INSERCION de las columnas ya que se manejará en el query
    if 'HORA_INSERCION' in columns:
        columns.remove('HORA_INSERCION')
    
    # Crear placeholders para los valores (excepto HORA_INSERCION)
    placeholders = ', '.join(['%s'] * len(columns))
    
    # Query de inserción con HORA_INSERCION = NOW()
    query = f"""
        INSERT INTO JUGADORES_POR_PARTIDO_CHILE 
        ({', '.join(columns)}, HORA_INSERCION) 
        VALUES ({placeholders}, NOW())
        ON DUPLICATE KEY UPDATE
        {', '.join([f'{col} = VALUES({col})' for col in columns if col not in ['ID_PARTIDO', 'ID_JUGADOR']])},
        HORA_INSERCION = NOW()
    """
    
    logger.info(f"📋 Columnas de jugadores: {len(columns)} + HORA_INSERCION")
    
    try:
        successful_inserts = 0
        failed_inserts = 0
        
        # Insertar registros uno por uno para mejor control de errores
        for i, player in enumerate(players_data, 1):
            try:
                # Obtener valores excluyendo HORA_INSERCION (se maneja en query)
                values = []
                for col in columns:
                    values.append(player.get(col))
                    
                cursor.execute(query, values)
                successful_inserts += 1
                
                if i % 50 == 0:  # Progreso cada 50 registros
                    logger.info(f"✅ Procesados {i}/{len(players_data)} jugadores...")
                    
            except mysql.connector.Error as e:
                failed_inserts += 1
                logger.error(f"❌ Error insertando jugador {i}: {e}")
                continue
        
        connection.commit()
        
        logger.info(f"\n📊 Resumen de inserción de jugadores:")
        logger.info(f"   ✅ Exitosos: {successful_inserts}")
        logger.info(f"   ❌ Fallidos: {failed_inserts}")
        
        # Verificar cuántos registros hay en la tabla
        cursor.execute("SELECT COUNT(*) FROM JUGADORES_POR_PARTIDO_CHILE")
        total_records = cursor.fetchone()[0]
        logger.info(f"   📊 Total registros en tabla: {total_records}")
        
        # Verificar registros insertados en esta ejecución
        cursor.execute("""
            SELECT COUNT(*) FROM JUGADORES_POR_PARTIDO_CHILE 
            WHERE HORA_INSERCION >= DATE_SUB(NOW(), INTERVAL 1 HOUR)
        """)
        recent_records = cursor.fetchone()[0]
        logger.info(f"   🕐 Registros insertados en la última hora: {recent_records}")
        
        return successful_inserts > 0
        
    except mysql.connector.Error as e:
        logger.error(f"❌ Error general insertando jugadores: {e}")
        connection.rollback()
        return False
    finally:
        cursor.close()

def verify_database_state(connection):
    """Verifica el estado actual de las tablas y datos"""
    cursor = connection.cursor()
    
    logger.info(f"\n{'='*60}")
    logger.info("🔍 VERIFICACIÓN DEL ESTADO DE LA BASE DE DATOS")
    logger.info(f"{'='*60}")
    
    try:
        # Verificar existencia de tablas
        cursor.execute("""
            SELECT TABLE_NAME, TABLE_ROWS 
            FROM information_schema.TABLES 
            WHERE TABLE_SCHEMA = 'MP_DATA_DEV' 
            AND TABLE_NAME IN ('PARTIDOS_PRIMERA_DIVISION_CHILE', 'JUGADORES_POR_PARTIDO_CHILE')
        """)
        
        tables_info = cursor.fetchall()
        
        logger.info("📊 Estado de las tablas:")
        for table_name, row_count in tables_info:
            logger.info(f"   {table_name}: {row_count} registros")
        
        # Verificar registros por hora de inserción
        cursor.execute("""
            SELECT 
                DATE(HORA_INSERCION) as fecha,
                HOUR(HORA_INSERCION) as hora,
                COUNT(*) as cantidad
            FROM PARTIDOS_PRIMERA_DIVISION_CHILE 
            WHERE HORA_INSERCION >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
            GROUP BY DATE(HORA_INSERCION), HOUR(HORA_INSERCION)
            ORDER BY fecha DESC, hora DESC
            LIMIT 10
        """)
        
        recent_matches = cursor.fetchall()
        
        if recent_matches:
            logger.info(f"\n📋 Partidos insertados por hora (últimas 24h):")
            for fecha, hora, cantidad in recent_matches:
                logger.info(f"   {fecha} {hora}:00 - {cantidad} partidos")
        
        # Similar para jugadores
        cursor.execute("""
            SELECT 
                DATE(HORA_INSERCION) as fecha,
                HOUR(HORA_INSERCION) as hora,
                COUNT(*) as cantidad
            FROM JUGADORES_POR_PARTIDO_CHILE 
            WHERE HORA_INSERCION >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
            GROUP BY DATE(HORA_INSERCION), HOUR(HORA_INSERCION)
            ORDER BY fecha DESC, hora DESC
            LIMIT 5
        """)
        
        recent_players = cursor.fetchall()
        
        if recent_players:
            logger.info(f"\n👥 Jugadores insertados por hora (últimas 24h):")
            for fecha, hora, cantidad in recent_players:
                logger.info(f"   {fecha} {hora}:00 - {cantidad} jugadores")
        
    except mysql.connector.Error as e:
        logger.error(f"❌ Error verificando estado de BD: {e}")
    finally:
        cursor.close()

def main():
    # Configuración
    api_key = "AzumZVPR1MlXaroDdCzrE4OT0ezDLMlLDjVCi0Txb0k"
    
    logger.info(f"{'='*60}")
    logger.info("OBTENCIÓN COMPLETA DE DATOS DE PRIMERA DIVISIÓN CHILENA 2025")
    logger.info("CON INSERCIÓN A MYSQL - VERSIÓN MEJORADA CON HORA_INSERCION")
    logger.info(f"{'='*60}")
    
    # Conectar a MySQL
    connection = create_database_connection()
    if not connection:
        logger.error("❌ No se pudo conectar a MySQL. Proceso cancelado.")
        return
    
    try:
        # 1. Encontrar Primera División chilena
        first_division = find_chilean_first_division(api_key)
        
        if not first_division:
            logger.error("❌ No se pudo encontrar la Primera División chilena")
            return
        
        logger.info(f"\n🎯 Primera División encontrada:")
        logger.info(f"   Nombre: {first_division['competition_name']}")
        logger.info(f"   ID: {first_division['league_id']}")
        logger.info(f"   Nivel: {first_division['tier']}")
        
        # 2. Obtener partidos básicos de la temporada 2025
        logger.info(f"\n{'='*60}")
        logger.info("OBTENIENDO PARTIDOS BÁSICOS")
        logger.info(f"{'='*60}")
        
        matches_data = get_league_matches(first_division['league_id'], "2025", api_key)
        
        if not matches_data:
            logger.error("❌ No se pudieron obtener los partidos")
            return
        
        logger.info(f"✅ {len(matches_data.get('data', []))} partidos básicos obtenidos")
        
        # 3. Procesar datos detallados de partidos
        detailed_matches = process_detailed_matches(matches_data, first_division, api_key)
        
        if not detailed_matches:
            logger.error("❌ No se pudieron procesar los partidos detallados")
            return
        
        logger.info(f"\n🔍 VERIFICACIÓN DE DATOS PROCESADOS:")
        logger.info(f"   📊 Total partidos procesados: {len(detailed_matches)}")
        logger.info(f"   📋 Primeros 3 IDs de partido: {[m.get('ID_PARTIDO') for m in detailed_matches[:3]]}")
        
        # 4. Insertar partidos en MySQL
        logger.info(f"\n{'='*60}")
        logger.info("INSERTANDO PARTIDOS EN MYSQL")
        logger.info(f"{'='*60}")
        
        matches_inserted = insert_matches_to_mysql(detailed_matches, connection)
        
        if matches_inserted:
            logger.info("✅ Partidos insertados exitosamente")
        else:
            logger.error("❌ Error insertando partidos - continuando con jugadores...")
        
        # 5. Procesar jugadores por partido
        logger.info(f"\n{'='*60}")
        logger.info("PROCESANDO JUGADORES POR PARTIDO")
        logger.info(f"{'='*60}")
        
        players_data = process_match_players(detailed_matches, api_key)
        
        if not players_data:
            logger.error("❌ No se pudieron obtener datos de jugadores")
        else:
            logger.info(f"✅ {len(players_data)} registros de jugadores procesados")
        
        # 6. Insertar jugadores en MySQL
        if players_data:
            players_inserted = insert_players_to_mysql(players_data, connection)
            if players_inserted:
                logger.info("✅ Jugadores insertados exitosamente")
        
        # 7. Verificar estado final de la base de datos
        verify_database_state(connection)
        
        # 8. Mostrar resumen final
        logger.info(f"\n{'='*60}")
        logger.info("✅ PROCESO COMPLETADO - RESUMEN FINAL")
        logger.info(f"{'='*60}")
        
        # Contar registros finales
        cursor = connection.cursor()
        cursor.execute("SELECT COUNT(*) FROM PARTIDOS_PRIMERA_DIVISION_CHILE")
        final_partidos = cursor.fetchone()[0]
        cursor.execute("SELECT COUNT(*) FROM JUGADORES_POR_PARTIDO_CHILE")
        final_jugadores = cursor.fetchone()[0]
        
        # Contar registros de esta ejecución
        cursor.execute("""
            SELECT COUNT(*) FROM PARTIDOS_PRIMERA_DIVISION_CHILE 
            WHERE HORA_INSERCION >= DATE_SUB(NOW(), INTERVAL 2 HOUR)
        """)
        partidos_esta_ejecucion = cursor.fetchone()[0]
        
        cursor.execute("""
            SELECT COUNT(*) FROM JUGADORES_POR_PARTIDO_CHILE 
            WHERE HORA_INSERCION >= DATE_SUB(NOW(), INTERVAL 2 HOUR)
        """)
        jugadores_esta_ejecucion = cursor.fetchone()[0]
        
        cursor.close()
        
        logger.info(f"📊 ESTADÍSTICAS FINALES:")
        logger.info(f"   🏆 Partidos procesados: {len(detailed_matches)}")
        logger.info(f"   📊 Partidos en BD: {final_partidos}")
        logger.info(f"   🆕 Partidos insertados esta ejecución: {partidos_esta_ejecucion}")
        logger.info(f"   👥 Jugadores procesados: {len(players_data) if players_data else 0}")
        logger.info(f"   📊 Jugadores en BD: {final_jugadores}")
        logger.info(f"   🆕 Jugadores insertados esta ejecución: {jugadores_esta_ejecucion}")
        
        # Estadísticas adicionales
        if detailed_matches:
            jugados = [m for m in detailed_matches if m.get('ESTADO_PARTIDO') == 'JUGADO']
            programados = [m for m in detailed_matches if m.get('ESTADO_PARTIDO') == 'PROGRAMADO']
            
            logger.info(f"\n🏁 Estado de los partidos:")
            logger.info(f"   🟢 Partidos jugados: {len(jugados)}")
            logger.info(f"   🟡 Partidos programados: {len(programados)}")
        
        logger.info(f"\n📋 Tablas MySQL:")
        logger.info(f"   📊 PARTIDOS_PRIMERA_DIVISION_CHILE: {final_partidos} registros")
        logger.info(f"   👥 JUGADORES_POR_PARTIDO_CHILE: {final_jugadores} registros")
        logger.info(f"\n💡 Campo HORA_INSERCION agregado para tracking de duplicados y cargas")
        
    except KeyboardInterrupt:
        logger.warning("\n⚠️ Proceso interrumpido por el usuario")
    except Exception as e:
        logger.error(f"\n❌ Error inesperado: {e}")
        import traceback
        logger.error(f"   📝 Traceback completo:")
        traceback.print_exc()
    finally:
        if connection:
            connection.close()
            logger.info("🔐 Conexión a MySQL cerrada")

if __name__ == "__main__":
    main()