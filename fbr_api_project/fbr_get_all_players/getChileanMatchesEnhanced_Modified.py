import requests
import json
import csv
import time
import os
import mysql.connector
from datetime import datetime

def get_countries(api_key):
    """Obtiene todos los países disponibles"""
    base_url = "https://fbrapi.com"
    url = f"{base_url}/countries"
    headers = {"X-API-Key": api_key}
    
    try:
        print("Obteniendo lista de países...")
        response = requests.get(url, headers=headers)
        
        if response.status_code == 200:
            return response.json()
        else:
            print(f"Error: {response.status_code}")
            return None
    except Exception as e:
        print(f"Error en la solicitud: {e}")
        return None

def get_leagues_by_country(country_code, api_key):
    """Obtiene todas las ligas de un país específico"""
    base_url = "https://fbrapi.com"
    url = f"{base_url}/leagues"
    params = {"country_code": country_code}
    headers = {"X-API-Key": api_key}
    
    try:
        print(f"Obteniendo ligas para {country_code}...")
        response = requests.get(url, params=params, headers=headers)
        
        if response.status_code == 200:
            return response.json()
        else:
            print(f"Error: {response.status_code}")
            return None
    except Exception as e:
        print(f"Error en la solicitud: {e}")
        return None

def get_league_matches(league_id, season_id, api_key):
    """Obtiene todos los partidos de una liga específica para una temporada"""
    base_url = "https://fbrapi.com"
    url = f"{base_url}/matches"
    params = {"league_id": league_id}
    if season_id:
        params["season_id"] = season_id
    headers = {"X-API-Key": api_key}
    
    try:
        print(f"Obteniendo partidos básicos para liga {league_id}...")
        if season_id:
            print(f"Temporada: {season_id}")
        response = requests.get(url, params=params, headers=headers)
        
        if response.status_code == 200:
            return response.json()
        else:
            print(f"Error: {response.status_code}")
            print(f"Respuesta: {response.text}")
            return None
    except Exception as e:
        print(f"Error en la solicitud: {e}")
        return None

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
    
    try:
        response = requests.get(url, params=params, headers=headers)
        
        if response.status_code == 200:
            return response.json()
        else:
            print(f"Error {response.status_code} obteniendo stats para equipo {team_id}")
            return None
    except Exception as e:
        print(f"Error en solicitud stats para equipo {team_id}: {e}")
        return None

def get_match_players(match_id, api_key):
    """Obtiene todos los jugadores citados en un partido específico"""
    base_url = "https://fbrapi.com"
    url = f"{base_url}/all-players-match-stats"
    params = {"match_id": match_id}
    headers = {"X-API-Key": api_key}
    
    try:
        response = requests.get(url, params=params, headers=headers)
        
        if response.status_code == 200:
            return response.json()
        else:
            print(f"Error {response.status_code} obteniendo jugadores para partido {match_id}")
            return None
    except Exception as e:
        print(f"Error en solicitud jugadores para partido {match_id}: {e}")
        return None

def create_database_connection():
    """Crea conexión a la base de datos MySQL"""
    try:
        # CAMBIAR ESTOS VALORES POR TUS CREDENCIALES DE BASE DE DATOS
        connection = mysql.connector.connect(
            host='192.168.100.16',
            database='MP_DATA_DEV',
            user='mpuga',
            password='123qweasd',
            charset='utf8mb4',
            collation='utf8mb4_unicode_ci'
        )
        print("✅ Conexión a MySQL establecida")
        return connection
    except mysql.connector.Error as e:
        print(f"❌ Error conectando a MySQL: {e}")
        return None

def create_matches_table(cursor):
    """Crea la tabla de partidos si no existe - MODIFICADA CON HORA_INSERCION"""
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
        
        -- NUEVO CAMPO PARA TRACKING DE CARGAS
        HORA_INSERCION TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        -- Metadatos originales
        FECHA_ACTUALIZACION TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CREATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    """
    
    try:
        cursor.execute(create_table_query)
        print("✅ Tabla PARTIDOS_PRIMERA_DIVISION_CHILE creada/verificada con campo HORA_INSERCION")
    except mysql.connector.Error as e:
        print(f"❌ Error creando tabla de partidos: {e}")

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
        
        -- NUEVO CAMPO PARA TRACKING DE CARGAS
        HORA_INSERCION TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        -- Metadatos
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
        print("✅ Tabla JUGADORES_POR_PARTIDO_CHILE creada/verificada con campo HORA_INSERCION")
    except mysql.connector.Error as e:
        print(f"❌ Error creando tabla de jugadores: {e}")

def find_chilean_first_division(api_key):
    """Encuentra el ID de la Primera División chilena"""
    print(f"{'='*60}")
    print("BUSCANDO PRIMERA DIVISIÓN CHILENA")
    print(f"{'='*60}")
    
    # Buscar Chile en la lista de países
    countries_data = get_countries(api_key)
    
    if not countries_data:
        print("❌ No se pudieron obtener los países")
        return None
    
    # Buscar Chile
    chile_info = None
    for country in countries_data.get('data', []):
        if country.get('country', '').lower() == 'chile':
            chile_info = country
            break
    
    if not chile_info:
        print("❌ No se encontró Chile en la lista de países")
        return None
    
    print(f"✅ Chile encontrado:")
    print(f"   Código país: {chile_info.get('country_code')}")
    print(f"   Clubes: {chile_info.get('#_clubs')}")
    print(f"   Jugadores: {chile_info.get('#_players')}")
    
    time.sleep(7)
    
    # Obtener ligas de Chile
    leagues_data = get_leagues_by_country(chile_info.get('country_code'), api_key)
    
    if not leagues_data:
        print("❌ No se pudieron obtener las ligas chilenas")
        return None
    
    # Buscar la Primera División (nivel 1)
    first_division = None
    print(f"\n{'='*60}")
    print("LIGAS CHILENAS DISPONIBLES")
    print(f"{'='*60}")
    
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
                    
                    print(f"  Liga: {league_info['competition_name']}")
                    print(f"  ID: {league_info['league_id']}")
                    print(f"  Nivel: {league_info['tier']}")
                    print(f"  Última temporada: {league_info['last_season']}")
                    print(f"  {'-'*40}")
                    
                    # Buscar Primera División (tier 1st)
                    if league_info['tier'] == '1st':
                        first_division = league_info
                        print(f"  ✅ PRIMERA DIVISIÓN ENCONTRADA!")
    
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
        """
        Convierte valores según el tipo de dato esperado en MySQL
        data_type: 'string', 'integer', 'decimal'
        """
        # Si es una lista, convertir a string separado por comas
        if isinstance(value, list):
            if not value:  # Lista vacía
                return None if data_type in ['integer', 'decimal'] else ''
            return ', '.join(str(v) for v in value)
        
        # Si es None, mantener como None
        if value is None:
            return None
        
        # Si es cadena vacía y esperamos número, convertir a None
        if value == '' and data_type in ['integer', 'decimal']:
            return None
        
        # Para números, intentar conversión
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
        
        # Para strings, mantener como está
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
    """Procesa los partidos con estadísticas detalladas - MODIFICADO CON HORA_INSERCION"""
    if not matches_data or 'data' not in matches_data:
        print("❌ No hay datos de partidos para procesar")
        return []
    
    # Función auxiliar para convertir valores según tipo esperado
    def convert_match_value(value, data_type='string'):
        """
        Convierte valores según el tipo de dato esperado en MySQL
        data_type: 'string', 'integer', 'decimal'
        """
        # Si es una lista, convertir a string separado por comas
        if isinstance(value, list):
            if not value:  # Lista vacía
                return None if data_type in ['integer', 'decimal'] else ''
            return ', '.join(str(v) for v in value)
        
        # Si es None, mantener como None
        if value is None:
            return None
        
        # Si es cadena vacía y esperamos número, convertir a None
        if value == '' and data_type in ['integer', 'decimal']:
            return None
        
        # Para números, intentar conversión
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
        
        # Para strings, mantener como está
        return value
    
    processed_matches = []
    total_matches = len(matches_data['data'])
    
    # OBTENER TIMESTAMP DE CARGA UNA SOLA VEZ AL INICIO
    hora_carga_actual = datetime.now()
    
    print(f"\n{'='*60}")
    print(f"PROCESANDO {total_matches} PARTIDOS CON ESTADÍSTICAS DETALLADAS")
    print(f"Liga: {league_info['competition_name']} | Temporada: 2025")
    print(f"⏰ Hora de carga: {hora_carga_actual.strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"{'='*60}")
    print("⚠️ Este proceso tomará tiempo debido al límite de 7 segundos entre peticiones")
    print(f"⏱️ Tiempo estimado: {total_matches * 21 / 60:.1f} minutos\n")
    
    # Obtener todos los equipos únicos para hacer peticiones por equipo
    teams_stats = {}
    unique_teams = set()
    
    for match in matches_data['data']:
        if match.get('home_team_id'):
            unique_teams.add(match['home_team_id'])
        if match.get('away_team_id'):
            unique_teams.add(match['away_team_id'])
    
    print(f"📊 Obteniendo estadísticas para {len(unique_teams)} equipos...")
    
    # Obtener estadísticas de cada equipo
    for i, team_id in enumerate(unique_teams, 1):
        print(f"[{i}/{len(unique_teams)}] Obteniendo estadísticas del equipo {team_id}...")
        team_stats = get_team_match_stats(team_id, league_info['league_id'], "2025", api_key)
        if team_stats:
            teams_stats[team_id] = team_stats
            print(f"  ✅ {len(team_stats.get('data', []))} partidos obtenidos")
        else:
            print(f"  ❌ No se pudieron obtener estadísticas")
        
        time.sleep(7)  # Respetar límite de frecuencia
    
    print(f"\n{'='*60}")
    print("COMBINANDO DATOS DE PARTIDOS CON ESTADÍSTICAS")
    print(f"{'='*60}")
    
    for i, match in enumerate(matches_data['data'], 1):
        print(f"[{i}/{total_matches}] Procesando partido: {match.get('match_id', 'N/A')}")
        
        # Información básica del partido CON HORA_INSERCION
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
            
            # NUEVO CAMPO: HORA_INSERCION con timestamp de la carga
            'HORA_INSERCION': hora_carga_actual
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
                    # Mapeo de estadísticas adicionales
                    elif mysql_key == 'SOT_AG':
                        match_info['TIROS_AL_ARCO_CONTRA_LOCAL'] = value
                    elif mysql_key == 'SAVES':
                        match_info['ATAJADAS_LOCAL'] = value
                    elif mysql_key == 'SAVE_PCT':
                        match_info['PORCENTAJE_ATAJADAS_LOCAL'] = value
                    elif mysql_key == 'CLEAN_SHEETS':
                        match_info['VALLA_INVICTA_LOCAL'] = value
                    elif mysql_key == 'PSXG':
                        match_info['PSXG_LOCAL'] = value
                    elif mysql_key == 'PK_ATT':
                        match_info['PENALES_ENFRENTADOS_LOCAL'] = value
                    elif mysql_key == 'PK_SAVED':
                        match_info['PENALES_ATAJADOS_LOCAL'] = value
                    elif mysql_key == 'SH':
                        match_info['TIROS_TOTALES_LOCAL'] = value
                    elif mysql_key == 'SOT':
                        match_info['TIROS_AL_ARCO_LOCAL'] = value
                    elif mysql_key == 'SH_PER90':
                        match_info['TIROS_POR_90_LOCAL'] = value
                    elif mysql_key == 'SOT_PER90':
                        match_info['TIROS_AL_ARCO_POR_90_LOCAL'] = value
                    elif mysql_key == 'PASS_CMP':
                        match_info['PASES_COMPLETADOS_LOCAL'] = value
                    elif mysql_key == 'PASS_ATT':
                        match_info['PASES_INTENTADOS_LOCAL'] = value
                    elif mysql_key == 'PCT_PASS_CMP':
                        match_info['PORCENTAJE_PASES_LOCAL'] = value
                    elif mysql_key == 'PASS_PROG':
                        match_info['PASES_PROGRESIVOS_LOCAL'] = value
                    elif mysql_key == 'TKL':
                        match_info['TACKLES_LOCAL'] = value
                    elif mysql_key == 'TKL_WON':
                        match_info['TACKLES_GANADOS_LOCAL'] = value
                    elif mysql_key == 'INT':
                        match_info['INTERCEPCIONES_LOCAL'] = value
                    elif mysql_key == 'BLOCKS':
                        match_info['BLOQUEOS_LOCAL'] = value
                    elif mysql_key == 'CLEARANCES':
                        match_info['DESPEJES_LOCAL'] = value
                    elif mysql_key == 'TOUCHES':
                        match_info['TOQUES_LOCAL'] = value
                    elif mysql_key == 'TAKE_ON_ATT':
                        match_info['REGATES_INTENTADOS_LOCAL'] = value
                    elif mysql_key == 'TAKE_ON_SUC':
                        match_info['REGATES_EXITOSOS_LOCAL'] = value
                    elif mysql_key == 'CARRIES':
                        match_info['CONDUCCIONES_LOCAL'] = value
                    elif mysql_key == 'YELLOW_CARDS':
                        match_info['TARJETAS_AMARILLAS_LOCAL'] = value
                    elif mysql_key == 'RED_CARDS':
                        match_info['TARJETAS_ROJAS_LOCAL'] = value
                    elif mysql_key == 'SECOND_YELLOW_CARDS':
                        match_info['SEGUNDA_AMARILLA_LOCAL'] = value
                    elif mysql_key == 'FLS_COM':
                        match_info['FALTAS_COMETIDAS_LOCAL'] = value
                    elif mysql_key == 'FLS_DRAWN':
                        match_info['FALTAS_RECIBIDAS_LOCAL'] = value
                    elif mysql_key == 'OFFSIDE':
                        match_info['FUERA_DE_JUEGO_LOCAL'] = value
                    elif mysql_key == 'PK_WON':
                        match_info['PENALES_GANADOS_LOCAL'] = value
                    elif mysql_key == 'PK_CONCEDED':
                        match_info['PENALES_CONCEDIDOS_LOCAL'] = value
                    elif mysql_key == 'OG':
                        match_info['AUTOGOLES_LOCAL'] = value
                print(f"  ✅ Estadísticas del equipo local agregadas")
        
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
                    # Mapeo de estadísticas adicionales visitante
                    elif mysql_key == 'SOT_AG':
                        match_info['TIROS_AL_ARCO_CONTRA_VISITANTE'] = value
                    elif mysql_key == 'SAVES':
                        match_info['ATAJADAS_VISITANTE'] = value
                    elif mysql_key == 'SAVE_PCT':
                        match_info['PORCENTAJE_ATAJADAS_VISITANTE'] = value
                    elif mysql_key == 'CLEAN_SHEETS':
                        match_info['VALLA_INVICTA_VISITANTE'] = value
                    elif mysql_key == 'PSXG':
                        match_info['PSXG_VISITANTE'] = value
                    elif mysql_key == 'PK_ATT':
                        match_info['PENALES_ENFRENTADOS_VISITANTE'] = value
                    elif mysql_key == 'PK_SAVED':
                        match_info['PENALES_ATAJADOS_VISITANTE'] = value
                    elif mysql_key == 'SH':
                        match_info['TIROS_TOTALES_VISITANTE'] = value
                    elif mysql_key == 'SOT':
                        match_info['TIROS_AL_ARCO_VISITANTE'] = value
                    elif mysql_key == 'SH_PER90':
                        match_info['TIROS_POR_90_VISITANTE'] = value
                    elif mysql_key == 'SOT_PER90':
                        match_info['TIROS_AL_ARCO_POR_90_VISITANTE'] = value
                    elif mysql_key == 'PASS_CMP':
                        match_info['PASES_COMPLETADOS_VISITANTE'] = value
                    elif mysql_key == 'PASS_ATT':
                        match_info['PASES_INTENTADOS_VISITANTE'] = value
                    elif mysql_key == 'PCT_PASS_CMP':
                        match_info['PORCENTAJE_PASES_VISITANTE'] = value
                    elif mysql_key == 'PASS_PROG':
                        match_info['PASES_PROGRESIVOS_VISITANTE'] = value
                    elif mysql_key == 'TKL':
                        match_info['TACKLES_VISITANTE'] = value
                    elif mysql_key == 'TKL_WON':
                        match_info['TACKLES_GANADOS_VISITANTE'] = value
                    elif mysql_key == 'INT':
                        match_info['INTERCEPCIONES_VISITANTE'] = value
                    elif mysql_key == 'BLOCKS':
                        match_info['BLOQUEOS_VISITANTE'] = value
                    elif mysql_key == 'CLEARANCES':
                        match_info['DESPEJES_VISITANTE'] = value
                    elif mysql_key == 'TOUCHES':
                        match_info['TOQUES_VISITANTE'] = value
                    elif mysql_key == 'TAKE_ON_ATT':
                        match_info['REGATES_INTENTADOS_VISITANTE'] = value
                    elif mysql_key == 'TAKE_ON_SUC':
                        match_info['REGATES_EXITOSOS_VISITANTE'] = value
                    elif mysql_key == 'CARRIES':
                        match_info['CONDUCCIONES_VISITANTE'] = value
                    elif mysql_key == 'YELLOW_CARDS':
                        match_info['TARJETAS_AMARILLAS_VISITANTE'] = value
                    elif mysql_key == 'RED_CARDS':
                        match_info['TARJETAS_ROJAS_VISITANTE'] = value
                    elif mysql_key == 'SECOND_YELLOW_CARDS':
                        match_info['SEGUNDA_AMARILLA_VISITANTE'] = value
                    elif mysql_key == 'FLS_COM':
                        match_info['FALTAS_COMETIDAS_VISITANTE'] = value
                    elif mysql_key == 'FLS_DRAWN':
                        match_info['FALTAS_RECIBIDAS_VISITANTE'] = value
                    elif mysql_key == 'OFFSIDE':
                        match_info['FUERA_DE_JUEGO_VISITANTE'] = value
                    elif mysql_key == 'PK_WON':
                        match_info['PENALES_GANADOS_VISITANTE'] = value
                    elif mysql_key == 'PK_CONCEDED':
                        match_info['PENALES_CONCEDIDOS_VISITANTE'] = value
                    elif mysql_key == 'OG':
                        match_info['AUTOGOLES_VISITANTE'] = value
                print(f"  ✅ Estadísticas del equipo visitante agregadas")
        
        # Determinar estado del partido
        match_info['ESTADO_PARTIDO'] = determine_match_status(match_info)
        
        processed_matches.append(match_info)

    valid_matches = []
    invalid_count = 0
    
    for match in processed_matches:
        if match.get('ID_PARTIDO') and match.get('ID_PARTIDO').strip():
            valid_matches.append(match)
        else:
            invalid_count += 1
            print(f"⚠️ Partido procesado sin ID válido omitido en resultado final")
    
    print(f"\n📊 Validación final de partidos procesados:")
    print(f"   ✅ Partidos válidos: {len(valid_matches)}")
    print(f"   ❌ Partidos sin ID: {invalid_count}")
    
    return valid_matches

def process_match_players(matches_data, api_key):
    """Procesa los jugadores citados en cada partido - MODIFICADO CON HORA_INSERCION"""
    all_players = []
    
    # OBTENER TIMESTAMP DE CARGA UNA SOLA VEZ AL INICIO
    hora_carga_actual = datetime.now()
    
    print(f"\n{'='*60}")
    print("OBTENIENDO JUGADORES CITADOS POR PARTIDO")
    print(f"⏰ Hora de carga: {hora_carga_actual.strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"{'='*60}")
    
    # Función auxiliar para convertir valores según tipo esperado
    def convert_player_value(value, data_type='string'):
        """
        Convierte valores según el tipo de dato esperado en MySQL
        data_type: 'string', 'integer', 'decimal'
        """
        # Si es una lista, convertir a string separado por comas
        if isinstance(value, list):
            if not value:  # Lista vacía
                return None if data_type in ['integer', 'decimal'] else ''
            return ', '.join(str(v) for v in value)
        
        # Si es None, mantener como None
        if value is None:
            return None
        
        # Si es cadena vacía y esperamos número, convertir a None
        if value == '' and data_type in ['integer', 'decimal']:
            return None
        
        # Para números, intentar conversión
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
        
        # Para strings, mantener como está
        return value
    
    for i, match in enumerate(matches_data, 1):
        match_id = match.get('ID_PARTIDO')
        if not match_id:
            continue
            
        print(f"[{i}/{len(matches_data)}] Obteniendo jugadores para partido {match_id}...")
        
        players_data = get_match_players(match_id, api_key)
        
        if players_data and 'data' in players_data:
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
                        
                        # NUEVO CAMPO: HORA_INSERCION con timestamp de la carga
                        'HORA_INSERCION': hora_carga_actual
                    }
                    
                    all_players.append(player_info)
            
            print(f"  ✅ {len(team_data.get('players', []))} jugadores obtenidos")
        else:
            print(f"  ❌ No se pudieron obtener jugadores")
        
        time.sleep(7)  # Respetar límite de frecuencia
    
    return all_players

def insert_matches_to_mysql(matches_data, connection):
    """Inserta los datos de partidos en MySQL con HORA_INSERCION - VERSIÓN MEJORADA"""
    if not matches_data:
        print("❌ No hay datos de partidos para insertar")
        return False

    # VALIDACIÓN: Filtrar registros con ID_PARTIDO None o vacío
    valid_matches = []
    invalid_matches = 0
    
    for match in matches_data:
        if match.get('ID_PARTIDO') and match.get('ID_PARTIDO').strip():
            valid_matches.append(match)
        else:
            invalid_matches += 1
            print(f"⚠️ Partido sin ID válido omitido: {match.get('EQUIPO_LOCAL', 'N/A')} vs {match.get('EQUIPO_VISITANTE', 'N/A')}")
    
    print(f"📊 Validación de datos:")
    print(f"   ✅ Partidos válidos: {len(valid_matches)}")
    print(f"   ❌ Partidos sin ID: {invalid_matches}")
    
    if not valid_matches:
        print("❌ No hay partidos válidos para insertar")
        return False

    cursor = connection.cursor()
    
    # Crear tabla si no existe (ahora con HORA_INSERCION)
    create_matches_table(cursor)
    
    print(f"\n🔄 Iniciando inserción de {len(matches_data)} partidos...")
    print(f"⏰ Hora de carga: {matches_data[0].get('HORA_INSERCION', 'N/A')}")
    
    # Preparar query de inserción
    columns = list(matches_data[0].keys())
    placeholders = ', '.join(['%s'] * len(columns))
    
    # Query de inserción con ON DUPLICATE KEY UPDATE que PRESERVA HORA_INSERCION original
    update_columns = [col for col in columns if col not in ['ID_PARTIDO', 'HORA_INSERCION']]
    
    query = f"""
        INSERT INTO PARTIDOS_PRIMERA_DIVISION_CHILE 
        ({', '.join(columns)}) 
        VALUES ({placeholders})
        ON DUPLICATE KEY UPDATE
        {', '.join([f'{col} = VALUES({col})' for col in update_columns])},
        FECHA_ACTUALIZACION = CURRENT_TIMESTAMP
    """
    
    print(f"📋 Columnas a insertar: {len(columns)}")
    print(f"📋 Incluye HORA_INSERCION: {'HORA_INSERCION' in columns}")
    
    try:
        successful_inserts = 0
        failed_inserts = 0
        duplicate_updates = 0
        
        # Verificar registros existentes antes de insertar
        cursor.execute("SELECT COUNT(*) FROM PARTIDOS_PRIMERA_DIVISION_CHILE")
        initial_count = cursor.fetchone()[0]
        print(f"📊 Registros existentes antes de carga: {initial_count}")
        
        # Insertar registros uno por uno para mejor control de errores
        for i, match in enumerate(valid_matches, 1):
            try:
                values = [match.get(col) for col in columns]
                
                # Debug: mostrar algunos valores para verificar
                if i <= 3:  # Solo para los primeros 3 registros
                    print(f"\n🔍 Debug registro {i}:")
                    print(f"   ID_PARTIDO: {match.get('ID_PARTIDO')}")
                    print(f"   FECHA: {match.get('FECHA')}")
                    print(f"   EQUIPO_LOCAL: {match.get('EQUIPO_LOCAL')}")
                    print(f"   EQUIPO_VISITANTE: {match.get('EQUIPO_VISITANTE')}")
                    print(f"   HORA_INSERCION: {match.get('HORA_INSERCION')}")
                    print(f"   Valores None en registro: {sum(1 for v in values if v is None)}")
                
                # Verificar si el registro ya existe
                cursor.execute("SELECT COUNT(*) FROM PARTIDOS_PRIMERA_DIVISION_CHILE WHERE ID_PARTIDO = %s", 
                              (match.get('ID_PARTIDO'),))
                exists = cursor.fetchone()[0] > 0
                
                cursor.execute(query, values)
                
                if exists:
                    duplicate_updates += 1
                    print(f"🔄 Partido {match.get('ID_PARTIDO')} actualizado (duplicado)")
                else:
                    successful_inserts += 1
                
                if i % 10 == 0:  # Progreso cada 10 registros
                    print(f"✅ Procesados {i}/{len(matches_data)} partidos...")
                    
            except mysql.connector.Error as e:
                failed_inserts += 1
                print(f"❌ Error insertando partido {i} (ID: {match.get('ID_PARTIDO', 'N/A')}): {e}")
                print(f"   Detalle del error: {e.errno} - {e.msg}")
                continue
        
        connection.commit()
        
        # Verificar estado final
        cursor.execute("SELECT COUNT(*) FROM PARTIDOS_PRIMERA_DIVISION_CHILE")
        final_count = cursor.fetchone()[0]
        nuevos_registros = final_count - initial_count
        
        print(f"\n📊 RESUMEN DETALLADO DE INSERCIÓN DE PARTIDOS:")
        print(f"   ✅ Nuevos registros insertados: {successful_inserts}")
        print(f"   🔄 Registros actualizados (duplicados): {duplicate_updates}")
        print(f"   ❌ Fallos en inserción: {failed_inserts}")
        print(f"   📈 Incremento real en BD: {nuevos_registros} registros")
        print(f"   📊 Total registros en tabla: {final_count}")
        print(f"   📈 Tasa de éxito: {((successful_inserts + duplicate_updates)/len(matches_data)*100):.1f}%")
        
        # Verificar registros con la nueva HORA_INSERCION
        hora_carga_esta_ejecucion = matches_data[0].get('HORA_INSERCION')
        if hora_carga_esta_ejecucion:
            cursor.execute("""
                SELECT COUNT(*) FROM PARTIDOS_PRIMERA_DIVISION_CHILE 
                WHERE HORA_INSERCION >= %s
            """, (hora_carga_esta_ejecucion,))
            records_this_load = cursor.fetchone()[0]
            print(f"   🆕 Registros de esta carga: {records_this_load}")
        
        return successful_inserts > 0 or duplicate_updates > 0
        
    except mysql.connector.Error as e:
        print(f"❌ Error general insertando partidos: {e}")
        connection.rollback()
        return False
    finally:
        cursor.close()

def insert_players_to_mysql(players_data, connection):
    """Inserta los datos de jugadores por partido en MySQL con HORA_INSERCION - VERSIÓN MEJORADA"""
    if not players_data:
        print("❌ No hay datos de jugadores para insertar")
        return False
    
    cursor = connection.cursor()
    
    # Crear tabla si no existe (ahora con HORA_INSERCION)
    create_match_players_table(cursor)
    
    print(f"\n🔄 Iniciando inserción de {len(players_data)} registros de jugadores...")
    print(f"⏰ Hora de carga: {players_data[0].get('HORA_INSERCION', 'N/A')}")
    
    # Preparar query de inserción
    columns = list(players_data[0].keys())
    placeholders = ', '.join(['%s'] * len(columns))
    
    # Query de inserción que preserva HORA_INSERCION original en duplicados
    update_columns = [col for col in columns if col not in ['ID_PARTIDO', 'ID_JUGADOR', 'HORA_INSERCION']]
    
    query = f"""
        INSERT INTO JUGADORES_POR_PARTIDO_CHILE 
        ({', '.join(columns)}) 
        VALUES ({placeholders})
        ON DUPLICATE KEY UPDATE
        {', '.join([f'{col} = VALUES({col})' for col in update_columns])},
        FECHA_ACTUALIZACION = CURRENT_TIMESTAMP
    """
    
    print(f"📋 Columnas de jugadores: {len(columns)}")
    print(f"📋 Incluye HORA_INSERCION: {'HORA_INSERCION' in columns}")
    
    try:
        successful_inserts = 0
        failed_inserts = 0
        
        # Verificar registros existentes antes de insertar
        cursor.execute("SELECT COUNT(*) FROM JUGADORES_POR_PARTIDO_CHILE")
        initial_count = cursor.fetchone()[0]
        print(f"📊 Registros existentes antes de carga: {initial_count}")
        
        # Insertar registros uno por uno para mejor control de errores
        for i, player in enumerate(players_data, 1):
            try:
                values = [player.get(col) for col in columns]
                cursor.execute(query, values)
                successful_inserts += 1
                
                if i % 50 == 0:  # Progreso cada 50 registros
                    print(f"✅ Procesados {i}/{len(players_data)} jugadores...")
                    
            except mysql.connector.Error as e:
                failed_inserts += 1
                print(f"❌ Error insertando jugador {i}: {e}")
                continue
        
        connection.commit()
        
        # Verificar estado final
        cursor.execute("SELECT COUNT(*) FROM JUGADORES_POR_PARTIDO_CHILE")
        final_count = cursor.fetchone()[0]
        nuevos_registros = final_count - initial_count
        
        print(f"\n📊 RESUMEN DETALLADO DE INSERCIÓN DE JUGADORES:")
        print(f"   ✅ Registros procesados exitosamente: {successful_inserts}")
        print(f"   ❌ Fallos en inserción: {failed_inserts}")
        print(f"   📈 Incremento real en BD: {nuevos_registros} registros")
        print(f"   📊 Total registros en tabla: {final_count}")
        
        # Verificar registros con la nueva HORA_INSERCION
        hora_carga = players_data[0].get('HORA_INSERCION')
        if hora_carga:
            cursor.execute("""
                SELECT COUNT(*) FROM JUGADORES_POR_PARTIDO_CHILE 
                WHERE HORA_INSERCION >= %s
            """, (hora_carga,))
            records_this_load = cursor.fetchone()[0]
            print(f"   🆕 Registros de esta carga: {records_this_load}")
        
        return successful_inserts > 0
        
    except mysql.connector.Error as e:
        print(f"❌ Error general insertando jugadores: {e}")
        connection.rollback()
        return False
    finally:
        cursor.close()

def verify_load_tracking(connection):
    """Verifica el tracking de cargas usando HORA_INSERCION"""
    cursor = connection.cursor()
    
    print(f"\n{'='*60}")
    print("🔍 VERIFICACIÓN DE TRACKING DE CARGAS")
    print(f"{'='*60}")
    
    try:
        # Verificar cargas únicas en partidos
        cursor.execute("""
            SELECT 
                DATE(HORA_INSERCION) as FECHA_CARGA,
                TIME(HORA_INSERCION) as HORA_CARGA,
                COUNT(*) as REGISTROS_CARGADOS
            FROM PARTIDOS_PRIMERA_DIVISION_CHILE 
            GROUP BY DATE(HORA_INSERCION), TIME(HORA_INSERCION)
            ORDER BY HORA_INSERCION DESC
            LIMIT 10
        """)
        
        cargas_partidos = cursor.fetchall()
        
        print("📊 Historial de cargas - PARTIDOS:")
        print(f"{'FECHA':<12} {'HORA':<10} {'REGISTROS':<10}")
        print("-" * 35)
        for fecha, hora, registros in cargas_partidos:
            # Convertir timedelta a string ANTES del f-string
            fecha_str = str(fecha) if fecha else "N/A"
            hora_str = str(hora) if hora else "N/A"
            registros_str = str(registros)
            print(f"{fecha_str:<12} {hora_str:<10} {registros_str:<10}")
        
        # Verificar cargas únicas en jugadores
        cursor.execute("""
            SELECT 
                DATE(HORA_INSERCION) as FECHA_CARGA,
                TIME(HORA_INSERCION) as HORA_CARGA,
                COUNT(*) as REGISTROS_CARGADOS
            FROM JUGADORES_POR_PARTIDO_CHILE 
            GROUP BY DATE(HORA_INSERCION), TIME(HORA_INSERCION)
            ORDER BY HORA_INSERCION DESC
            LIMIT 10
        """)
        
        cargas_jugadores = cursor.fetchall()
        
        print(f"\n📊 Historial de cargas - JUGADORES:")
        print(f"{'FECHA':<12} {'HORA':<10} {'REGISTROS':<10}")
        print("-" * 35)
        for fecha, hora, registros in cargas_jugadores:
            # Convertir timedelta a string ANTES del f-string
            fecha_str = str(fecha) if fecha else "N/A"
            hora_str = str(hora) if hora else "N/A" 
            registros_str = str(registros)
            print(f"{fecha_str:<12} {hora_str:<10} {registros_str:<10}")
        
        # Verificar posibles duplicados por ID_PARTIDO
        cursor.execute("""
            SELECT ID_PARTIDO, COUNT(*) as VECES_CARGADO
            FROM PARTIDOS_PRIMERA_DIVISION_CHILE 
            GROUP BY ID_PARTIDO 
            HAVING COUNT(*) > 1
            LIMIT 5
        """)
        
        duplicados = cursor.fetchall()
        
        if duplicados:
            print(f"\n⚠️ PARTIDOS DUPLICADOS DETECTADOS:")
            for partido_id, veces in duplicados:
                print(f"   {partido_id}: cargado {veces} veces")
        else:
            print(f"\n✅ No se detectaron partidos duplicados")
        
        # Mostrar estadísticas de la carga más reciente
        cursor.execute("""
            SELECT 
                MAX(HORA_INSERCION) as ULTIMA_CARGA,
                COUNT(*) as PARTIDOS_ULTIMA_CARGA
            FROM PARTIDOS_PRIMERA_DIVISION_CHILE 
            WHERE HORA_INSERCION = (SELECT MAX(HORA_INSERCION) FROM PARTIDOS_PRIMERA_DIVISION_CHILE)
        """)
        
        ultima_carga_info = cursor.fetchone()
        if ultima_carga_info and ultima_carga_info[0]:
            ultima_carga, partidos_ultima = ultima_carga_info
            print(f"\n🆕 ÚLTIMA CARGA:")
            print(f"   Fecha/Hora: {ultima_carga}")
            print(f"   Partidos cargados: {partidos_ultima}")
            
            # Verificar jugadores de la última carga
            cursor.execute("""
                SELECT COUNT(*) FROM JUGADORES_POR_PARTIDO_CHILE 
                WHERE HORA_INSERCION = %s
            """, (ultima_carga,))
            jugadores_ultima = cursor.fetchone()[0]
            print(f"   Jugadores cargados: {jugadores_ultima}")
        
    except mysql.connector.Error as e:
        print(f"❌ Error verificando tracking de cargas: {e}")
    finally:
        cursor.close()

def verify_database_state(connection):
    """Verifica el estado actual de las tablas y datos con información de cargas"""
    cursor = connection.cursor()
    
    print(f"\n{'='*60}")
    print("🔍 VERIFICACIÓN COMPLETA DEL ESTADO DE LA BASE DE DATOS")
    print(f"{'='*60}")
    
    try:
        # Verificar existencia de tablas
        cursor.execute("""
            SELECT TABLE_NAME, TABLE_ROWS 
            FROM information_schema.TABLES 
            WHERE TABLE_SCHEMA = 'MP_DATA_DEV' 
            AND TABLE_NAME IN ('PARTIDOS_PRIMERA_DIVISION_CHILE', 'JUGADORES_POR_PARTIDO_CHILE')
        """)
        
        tables_info = cursor.fetchall()
        
        print("📊 Estado de las tablas:")
        for table_name, row_count in tables_info:
            print(f"   {table_name}: {row_count} registros")
        
        # Verificar si el campo HORA_INSERCION existe
        cursor.execute("""
            SELECT COUNT(*) FROM information_schema.COLUMNS 
            WHERE TABLE_SCHEMA = 'MP_DATA_DEV' 
            AND TABLE_NAME = 'PARTIDOS_PRIMERA_DIVISION_CHILE'
            AND COLUMN_NAME = 'HORA_INSERCION'
        """)
        hora_insercion_exists = cursor.fetchone()[0] > 0
        
        print(f"\n🔍 Campo HORA_INSERCION:")
        print(f"   En tabla PARTIDOS: {'✅ Existe' if hora_insercion_exists else '❌ No existe'}")
        
        if hora_insercion_exists:
            # Mostrar distribución de cargas
            cursor.execute("""
                SELECT 
                    DATE(HORA_INSERCION) as FECHA,
                    COUNT(*) as PARTIDOS_CARGADOS,
                    MIN(HORA_INSERCION) as PRIMERA_CARGA,
                    MAX(HORA_INSERCION) as ULTIMA_CARGA
                FROM PARTIDOS_PRIMERA_DIVISION_CHILE 
                GROUP BY DATE(HORA_INSERCION)
                ORDER BY FECHA DESC
            """)
            
            cargas_por_fecha = cursor.fetchall()
            
            print(f"\n📅 Cargas por fecha:")
            print(f"{'FECHA':<12} {'PARTIDOS':<9} {'PRIMERA CARGA':<20} {'ÚLTIMA CARGA':<20}")
            print("-" * 70)
            for fecha, partidos, primera, ultima in cargas_por_fecha:
                print(f"{fecha:<12} {partidos:<9} {primera.strftime('%H:%M:%S'):<20} {ultima.strftime('%H:%M:%S'):<20}")
        
        # Verificar distribución de estados de partidos
        cursor.execute("""
            SELECT ESTADO_PARTIDO, COUNT(*) as CANTIDAD
            FROM PARTIDOS_PRIMERA_DIVISION_CHILE
            GROUP BY ESTADO_PARTIDO
        """)
        
        estados = cursor.fetchall()
        
        print(f"\n🏁 Estados de partidos:")
        for estado, cantidad in estados:
            print(f"   {estado}: {cantidad} partidos")
        
    except mysql.connector.Error as e:
        print(f"❌ Error verificando estado de BD: {e}")
    finally:
        cursor.close()

def export_load_summary(connection):
    """Exporta un resumen de la carga actual a CSV"""
    cursor = connection.cursor()
    
    try:
        # Obtener resumen de la última carga
        cursor.execute("""
            SELECT 
                MAX(HORA_INSERCION) as ULTIMA_CARGA
            FROM PARTIDOS_PRIMERA_DIVISION_CHILE
        """)
        
        result = cursor.fetchone()
        if not result or not result[0]:
            print("❌ No hay cargas para exportar")
            return None
        
        ultima_carga = result[0]
        
        # Exportar partidos de la última carga
        cursor.execute("""
            SELECT 
                ID_PARTIDO, FECHA, EQUIPO_LOCAL, EQUIPO_VISITANTE, 
                GOLES_LOCAL, GOLES_VISITANTE, ESTADO_PARTIDO,
                HORA_INSERCION
            FROM PARTIDOS_PRIMERA_DIVISION_CHILE
            WHERE HORA_INSERCION = %s
            ORDER BY FECHA, HORA
        """, (ultima_carga,))
        
        partidos_carga = cursor.fetchall()
        
        if partidos_carga:
            output_dir = "load_summaries"
            if not os.path.exists(output_dir):
                os.makedirs(output_dir)
            
            timestamp = ultima_carga.strftime("%Y%m%d_%H%M%S")
            filename = f"{output_dir}/carga_partidos_{timestamp}.csv"
            
            with open(filename, 'w', newline='', encoding='utf-8') as csvfile:
                fieldnames = ['ID_PARTIDO', 'FECHA', 'EQUIPO_LOCAL', 'EQUIPO_VISITANTE', 
                             'GOLES_LOCAL', 'GOLES_VISITANTE', 'ESTADO_PARTIDO', 'HORA_INSERCION']
                writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
                writer.writeheader()
                
                for row in partidos_carga:
                    writer.writerow({
                        'ID_PARTIDO': row[0],
                        'FECHA': row[1],
                        'EQUIPO_LOCAL': row[2],
                        'EQUIPO_VISITANTE': row[3],
                        'GOLES_LOCAL': row[4],
                        'GOLES_VISITANTE': row[5],
                        'ESTADO_PARTIDO': row[6],
                        'HORA_INSERCION': row[7]
                    })
            
            print(f"✅ Resumen de carga exportado a: {filename}")
            print(f"   Partidos en resumen: {len(partidos_carga)}")
            
            return filename
        
    except mysql.connector.Error as e:
        print(f"❌ Error exportando resumen: {e}")
        return None
    finally:
        cursor.close()

def main():
    # Configuración
    api_key = "AzumZVPR1MlXaroDdCzrE4OT0ezDLMlLDjVCi0Txb0k"
    
    print(f"{'='*60}")
    print("OBTENCIÓN COMPLETA DE DATOS DE PRIMERA DIVISIÓN CHILENA 2025")
    print("CON TRACKING DE CARGAS MEDIANTE HORA_INSERCION")
    print(f"{'='*60}")
    
    # Conectar a MySQL
    connection = create_database_connection()
    if not connection:
        print("❌ No se pudo conectar a MySQL. Proceso cancelado.")
        return
    
    try:
        # 0. Verificar estado inicial y tracking de cargas previas
        verify_load_tracking(connection)
        
        # 1. Encontrar Primera División chilena
        first_division = find_chilean_first_division(api_key)
        
        if not first_division:
            print("❌ No se pudo encontrar la Primera División chilena")
            return
        
        print(f"\n🎯 Primera División encontrada:")
        print(f"   Nombre: {first_division['competition_name']}")
        print(f"   ID: {first_division['league_id']}")
        print(f"   Nivel: {first_division['tier']}")
        
        time.sleep(7)
        
        # 2. Obtener partidos básicos de la temporada 2025
        print(f"\n{'='*60}")
        print("OBTENIENDO PARTIDOS BÁSICOS")
        print(f"{'='*60}")
        
        matches_data = get_league_matches(first_division['league_id'], "2025", api_key)
        
        if not matches_data:
            print("❌ No se pudieron obtener los partidos")
            return
        
        print(f"✅ {len(matches_data.get('data', []))} partidos básicos obtenidos")
        
        time.sleep(7)
        
        # 3. Procesar datos detallados de partidos
        detailed_matches = process_detailed_matches(matches_data, first_division, api_key)
        
        if not detailed_matches:
            print("❌ No se pudieron procesar los partidos detallados")
            return
        
        print(f"\n🔍 VERIFICACIÓN DE DATOS PROCESADOS:")
        print(f"   📊 Total partidos procesados: {len(detailed_matches)}")
        print(f"   📋 Primeros 3 IDs de partido: {[m.get('ID_PARTIDO') for m in detailed_matches[:3]]}")
        print(f"   ⏰ Hora de carga asignada: {detailed_matches[0].get('HORA_INSERCION', 'N/A')}")
        
        # 4. Insertar partidos en MySQL
        print(f"\n{'='*60}")
        print("INSERTANDO PARTIDOS EN MYSQL")
        print(f"{'='*60}")
        
        matches_inserted = insert_matches_to_mysql(detailed_matches, connection)
        
        if matches_inserted:
            print("✅ Partidos insertados exitosamente")
        else:
            print("❌ Error insertando partidos - continuando con jugadores...")
        
        # 5. Procesar jugadores por partido
        print(f"\n{'='*60}")
        print("PROCESANDO JUGADORES POR PARTIDO")
        print(f"{'='*60}")
        
        players_data = process_match_players(detailed_matches, api_key)
        
        if not players_data:
            print("❌ No se pudieron obtener datos de jugadores")
        else:
            print(f"✅ {len(players_data)} registros de jugadores procesados")
        
        # 6. Insertar jugadores en MySQL
        if players_data:
            players_inserted = insert_players_to_mysql(players_data, connection)
            if players_inserted:
                print("✅ Jugadores insertados exitosamente")
        
        # 7. Verificar estado final de la base de datos con tracking
        verify_database_state(connection)
        
        # 8. Verificar tracking de cargas post-inserción
        verify_load_tracking(connection)
        
        # 9. Exportar resumen de la carga
        export_load_summary(connection)
        
        # 10. Mostrar resumen final
        print(f"\n{'='*60}")
        print("✅ PROCESO COMPLETADO - RESUMEN FINAL CON TRACKING")
        print(f"{'='*60}")
        
        # Contar registros finales
        cursor = connection.cursor()
        cursor.execute("SELECT COUNT(*) FROM PARTIDOS_PRIMERA_DIVISION_CHILE")
        final_partidos = cursor.fetchone()[0]
        cursor.execute("SELECT COUNT(*) FROM JUGADORES_POR_PARTIDO_CHILE")
        final_jugadores = cursor.fetchone()[0]
        
        # Obtener información de la carga actual
        if detailed_matches:
            hora_carga_actual = detailed_matches[0].get('HORA_INSERCION')
            if hora_carga_actual:
                cursor.execute("""
                    SELECT COUNT(*) FROM PARTIDOS_PRIMERA_DIVISION_CHILE 
                    WHERE HORA_INSERCION = %s
                """, (hora_carga_actual,))
                partidos_esta_carga = cursor.fetchone()[0]
                
                cursor.execute("""
                    SELECT COUNT(*) FROM JUGADORES_POR_PARTIDO_CHILE 
                    WHERE HORA_INSERCION = %s
                """, (hora_carga_actual,))
                jugadores_esta_carga = cursor.fetchone()[0]
                
                print(f"📊 ESTA CARGA (⏰ {hora_carga_actual.strftime('%Y-%m-%d %H:%M:%S')}):")
                print(f"   🏆 Partidos cargados: {partidos_esta_carga}")
                print(f"   👥 Jugadores cargados: {jugadores_esta_carga}")
        
        cursor.close()
        
        print(f"\n📊 TOTAL EN BASE DE DATOS:")
        print(f"   📊 PARTIDOS_PRIMERA_DIVISION_CHILE: {final_partidos} registros")
        print(f"   👥 JUGADORES_POR_PARTIDO_CHILE: {final_jugadores} registros")
        
        # Estadísticas adicionales
        if detailed_matches:
            jugados = [m for m in detailed_matches if m.get('ESTADO_PARTIDO') == 'JUGADO']
            programados = [m for m in detailed_matches if m.get('ESTADO_PARTIDO') == 'PROGRAMADO']
            
            print(f"\n🏁 Estado de los partidos procesados:")
            print(f"   🟢 Partidos jugados: {len(jugados)}")
            print(f"   🟡 Partidos programados: {len(programados)}")
        
        print(f"\n💡 BENEFICIOS DEL CAMPO HORA_INSERCION:")
        print(f"   ✅ Tracking de cargas por fecha/hora")
        print(f"   ✅ Identificación de duplicados")
        print(f"   ✅ Historial de actualizaciones")
        print(f"   ✅ Auditoría de procesos de carga")
        
    except KeyboardInterrupt:
        print("\n⚠️ Proceso interrumpido por el usuario")
    except Exception as e:
        print(f"\n❌ Error inesperado: {e}")
        import traceback
        print(f"   📝 Traceback completo:")
        traceback.print_exc()
    finally:
        if connection:
            connection.close()
            print("🔐 Conexión a MySQL cerrada")

if __name__ == "__main__":
    main()