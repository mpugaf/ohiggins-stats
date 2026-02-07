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

def troubleshoot_match_insertion(matches_data, connection):
    """Función de troubleshooting para problemas de inserción de partidos"""
    if not matches_data:
        return
    
    print(f"\n{'='*60}")
    print("🔧 TROUBLESHOOTING INSERCIÓN DE PARTIDOS")
    print(f"{'='*60}")
    
    # Analizar primer partido en detalle
    sample_match = matches_data[0]
    
    print(f"🔍 Analizando partido ejemplo:")
    print(f"   ID: {sample_match.get('ID_PARTIDO')}")
    
    # Verificar longitudes de campos de texto
    text_fields = ['NOMBRE_LIGA', 'EQUIPO_LOCAL', 'EQUIPO_VISITANTE', 'ESTADIO', 'ARBITRO']
    
    print(f"\n📏 Verificando longitudes de campos de texto:")
    for field in text_fields:
        value = sample_match.get(field, '')
        if value:
            length = len(str(value))
            print(f"   {field}: {length} caracteres")
            if length > 100:  # Si es muy largo
                print(f"      ⚠️ CAMPO LARGO: '{str(value)[:50]}...'")
    
    # Verificar caracteres especiales
    print(f"\n🔤 Verificando caracteres especiales:")
    for key, value in sample_match.items():
        if isinstance(value, str) and value:
            # Buscar caracteres problemáticos
            problematic_chars = [char for char in value if ord(char) > 127]
            if problematic_chars:
                unique_chars = list(set(problematic_chars))
                print(f"   {key}: caracteres especiales encontrados: {unique_chars[:5]}")
    
    # Intentar inserción manual del primer partido
    print(f"\n🧪 Prueba de inserción manual del primer partido:")
    
    cursor = connection.cursor()
    try:
        # Crear query simple solo con campos básicos
        simple_query = """
            INSERT INTO PARTIDOS_PRIMERA_DIVISION_CHILE 
            (ID_PARTIDO, NOMBRE_LIGA, TEMPORADA, FECHA, EQUIPO_LOCAL, EQUIPO_VISITANTE) 
            VALUES (%s, %s, %s, %s, %s, %s)
            ON DUPLICATE KEY UPDATE
            NOMBRE_LIGA = VALUES(NOMBRE_LIGA)
        """
        
        simple_values = [
            sample_match.get('ID_PARTIDO'),
            sample_match.get('NOMBRE_LIGA'),
            sample_match.get('TEMPORADA'),
            sample_match.get('FECHA'),
            sample_match.get('EQUIPO_LOCAL'),
            sample_match.get('EQUIPO_VISITANTE')
        ]
        
        print(f"   Intentando insertar: {simple_values}")
        cursor.execute(simple_query, simple_values)
        connection.commit()
        print(f"   ✅ Inserción manual exitosa!")
        
        # Verificar si se insertó
        cursor.execute("SELECT COUNT(*) FROM PARTIDOS_PRIMERA_DIVISION_CHILE WHERE ID_PARTIDO = %s", 
                      (sample_match.get('ID_PARTIDO'),))
        count = cursor.fetchone()[0]
        print(f"   📊 Registros encontrados: {count}")
        
    except mysql.connector.Error as e:
        print(f"   ❌ Error en inserción manual: {e}")
        print(f"   Errno: {e.errno}")
        print(f"   SQLState: {getattr(e, 'sqlstate', 'N/A')}")
    finally:
        cursor.close()

def verify_database_state(connection):
    """Verifica el estado actual de las tablas y datos"""
    cursor = connection.cursor()
    
    print(f"\n{'='*60}")
    print("🔍 VERIFICACIÓN DEL ESTADO DE LA BASE DE DATOS")
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
        
        # Si hay jugadores pero no partidos, investigar más
        cursor.execute("SELECT COUNT(*) FROM PARTIDOS_PRIMERA_DIVISION_CHILE")
        partidos_count = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM JUGADORES_POR_PARTIDO_CHILE")
        jugadores_count = cursor.fetchone()[0]
        
        if jugadores_count > 0 and partidos_count == 0:
            print(f"\n🚨 PROBLEMA DETECTADO:")
            print(f"   Hay {jugadores_count} jugadores pero 0 partidos")
            print(f"   Verificando IDs de partido en tabla de jugadores...")
            
            cursor.execute("""
                SELECT DISTINCT ID_PARTIDO 
                FROM JUGADORES_POR_PARTIDO_CHILE 
                LIMIT 10
            """)
            partido_ids = cursor.fetchall()
            
            print(f"   📋 Primeros 10 IDs de partido en jugadores:")
            for (partido_id,) in partido_ids:
                print(f"      {partido_id}")
        
        # Verificar estructura de la tabla de partidos
        cursor.execute("DESCRIBE PARTIDOS_PRIMERA_DIVISION_CHILE")
        columns_info = cursor.fetchall()
        
        print(f"\n📋 Estructura tabla PARTIDOS_PRIMERA_DIVISION_CHILE:")
        print(f"   Total columnas: {len(columns_info)}")
        
        # Verificar si hay restricciones que puedan estar causando problemas
        cursor.execute("""
            SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
            FROM information_schema.COLUMNS 
            WHERE TABLE_SCHEMA = 'MP_DATA_DEV' 
            AND TABLE_NAME = 'PARTIDOS_PRIMERA_DIVISION_CHILE'
            AND COLUMN_NAME IN ('ID_PARTIDO', 'FECHA', 'EQUIPO_LOCAL', 'EQUIPO_VISITANTE')
        """)
        
        key_columns = cursor.fetchall()
        print(f"   📋 Columnas clave:")
        for col_name, data_type, is_nullable, col_default in key_columns:
            print(f"      {col_name}: {data_type}, NULL={is_nullable}, DEFAULT={col_default}")
        
    except mysql.connector.Error as e:
        print(f"❌ Error verificando estado de BD: {e}")
    finally:
        cursor.close()

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
        FECHA_ACTUALIZACION TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CREATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    """
    
    try:
        cursor.execute(create_table_query)
        print("✅ Tabla PARTIDOS_PRIMERA_DIVISION_CHILE creada/verificada")
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
        
        -- Metadatos
        RUEDA VARCHAR(10) DEFAULT '0',
        FECHA_ACTUALIZACION TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CREATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        INDEX idx_partido (ID_PARTIDO),
        INDEX idx_jugador (ID_JUGADOR),
        INDEX idx_equipo (EQUIPO)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    """
    
    try:
        cursor.execute(create_table_query)
        print("✅ Tabla JUGADORES_POR_PARTIDO_CHILE creada/verificada (sin claves foráneas)")
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

def determine_rueda(fecha_partido):
    """Determina la rueda del partido basada en la fecha para la Primera División chilena"""
    if not fecha_partido:
        return '0'  # Formato único si no hay fecha
    
    try:
        from datetime import datetime
        # Convertir fecha string a datetime
        if isinstance(fecha_partido, str):
            fecha_dt = datetime.strptime(fecha_partido, '%Y-%m-%d')
        else:
            fecha_dt = fecha_partido
        
        # Crear fechas de corte para 2025
        fecha_corte = datetime(2025, 7, 13)  # 13 de julio de 2025
        
        # Determinar rueda
        if fecha_dt <= fecha_corte:
            return '1'  # Primera rueda
        else:
            return '2'  # Segunda rueda
            
    except (ValueError, TypeError):
        return '0'  # Si hay error, formato único

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
        print("❌ No hay datos de partidos para procesar")
        return []
    
    # Función auxiliar para convertir valores según tipo esperado
    def convert_match_value(value, data_type='string'):
        """
        Convierte valores según el tipo de dato esperado en MySQL
        data_type: 'string', 'integer', 'decimal'
        """

        if data_type == 'string' and str(value).strip() in ['None', 'null', '']:
            return None

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
    
    print(f"\n{'='*60}")
    print(f"PROCESANDO {total_matches} PARTIDOS CON ESTADÍSTICAS DETALLADAS")
    print(f"Liga: {league_info['competition_name']} | Temporada: 2025")
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
            'ARBITRO': convert_match_value(match.get('referee', ''), 'string')
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
                        match_info['RESULTADO_LOCAL'] = value  # Ya viene convertido como string
                    elif mysql_key == 'GLS':
                        match_info['GOLES_LOCAL_DETALLE'] = value  # Ya viene convertido como integer
                    elif mysql_key == 'GLS_AG':
                        match_info['GOLES_EN_CONTRA_LOCAL'] = value  # Ya viene convertido como integer
                    elif mysql_key == 'XG':
                        match_info['XG_LOCAL'] = value  # Ya viene convertido como decimal
                    elif mysql_key == 'XGA':
                        match_info['XGA_LOCAL'] = value  # Ya viene convertido como decimal
                    elif mysql_key == 'POSS':
                        match_info['POSESION_LOCAL'] = value  # Ya viene convertido como decimal
                    elif mysql_key == 'CAPTAIN':
                        match_info['CAPITAN_LOCAL'] = value  # Ya viene convertido como string
                    elif mysql_key == 'FORMATION':
                        match_info['FORMACION_LOCAL'] = value  # Ya viene convertido como string
                    # Agregar más mapeos según necesites...
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
                        match_info['RESULTADO_VISITANTE'] = value  # Ya viene convertido como string
                    elif mysql_key == 'GLS':
                        match_info['GOLES_VISITANTE_DETALLE'] = value  # Ya viene convertido como integer
                    elif mysql_key == 'GLS_AG':
                        match_info['GOLES_EN_CONTRA_VISITANTE'] = value  # Ya viene convertido como integer
                    elif mysql_key == 'XG':
                        match_info['XG_VISITANTE'] = value  # Ya viene convertido como decimal
                    elif mysql_key == 'XGA':
                        match_info['XGA_VISITANTE'] = value  # Ya viene convertido como decimal
                    elif mysql_key == 'POSS':
                        match_info['POSESION_VISITANTE'] = value  # Ya viene convertido como decimal
                    elif mysql_key == 'CAPTAIN':
                        match_info['CAPITAN_VISITANTE'] = value  # Ya viene convertido como string
                    elif mysql_key == 'FORMATION':
                        match_info['FORMACION_VISITANTE'] = value  # Ya viene convertido como string
                    # Agregar más mapeos según necesites...
                print(f"  ✅ Estadísticas del equipo visitante agregadas")
        
        # Determinar estado del partido
        match_info['ESTADO_PARTIDO'] = determine_match_status(match_info)
        
        # Determinar rueda basada en la fecha
        match_info['RUEDA'] = determine_rueda(match_info.get('FECHA'))
        
        processed_matches.append(match_info)
    
    print(f"\n🔍 VALIDACIÓN DE IDs DE PARTIDO:")
    valid_matches_final = []
    invalid_ids = 0
    
    for match in processed_matches:
        match_id = match.get('ID_PARTIDO')
        if match_id and str(match_id).strip() and str(match_id).strip() != 'None':
            valid_matches_final.append(match)
        else:
            invalid_ids += 1
            print(f"⚠️ Partido sin ID válido omitido: {match.get('EQUIPO_LOCAL', 'N/A')} vs {match.get('EQUIPO_VISITANTE', 'N/A')} | ID: {match_id}")
    
    print(f"✅ Partidos con ID válido: {len(valid_matches_final)}")
    print(f"❌ Partidos sin ID válido: {invalid_ids}")
    
    return valid_matches_final

def process_match_players(matches_data, api_key):
    """Procesa los jugadores citados en cada partido"""
    all_players = []
    
    print(f"\n{'='*60}")
    print("OBTENIENDO JUGADORES CITADOS POR PARTIDO")
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
    
    # Crear diccionario de ruedas por partido para eficiencia
    match_rueda_dict = {}
    for match in matches_data:
        match_id = match.get('ID_PARTIDO')
        rueda = match.get('RUEDA', '0')
        if match_id:
            match_rueda_dict[match_id] = rueda
    
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
                        'EDAD': convert_player_value(meta_data.get('age', None), 'integer'),  # Aquí estaba el error
                        'CODIGO_PAIS': convert_player_value(meta_data.get('player_country_code', ''), 'string'),
                        'EQUIPO': team_name,
                        'LOCAL_VISITANTE': 'LOCAL' if home_away.lower() == 'home' else 'VISITANTE',
                        
                        # Estadísticas del partido
                        'TITULAR': convert_player_value(summary.get('start', ''), 'string'),
                        'POSICION': convert_player_value(summary.get('positions', ''), 'string'),  # Este suele ser una lista
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
                        
                        # Rueda del partido
                        'RUEDA': match_rueda_dict.get(match_id, '0')
                    }
                    
                    all_players.append(player_info)
            
            print(f"  ✅ {len(team_data.get('players', []))} jugadores obtenidos")
        else:
            print(f"  ❌ No se pudieron obtener jugadores")
        
        time.sleep(7)  # Respetar límite de frecuencia
    
    return all_players

def insert_matches_to_mysql(matches_data, connection):
    """Inserta los datos de partidos en MySQL con manejo mejorado de errores"""
    if not matches_data:
        print("❌ No hay datos de partidos para insertar")
        return False
    
    cursor = connection.cursor()
    
    # Crear tabla si no existe
    create_matches_table(cursor)
    
    print(f"\n🔄 Iniciando inserción de {len(matches_data)} partidos...")
    
    # Preparar query de inserción
    columns = list(matches_data[0].keys())
    placeholders = ', '.join(['%s'] * len(columns))
    
    # Query de inserción con ON DUPLICATE KEY UPDATE
    query = f"""
        INSERT INTO PARTIDOS_PRIMERA_DIVISION_CHILE 
        ({', '.join(columns)}) 
        VALUES ({placeholders})
        ON DUPLICATE KEY UPDATE
        {', '.join([f'{col} = VALUES({col})' for col in columns if col != 'ID_PARTIDO'])}
    """
    
    print(f"📋 Columnas a insertar: {len(columns)}")
    print(f"📋 Primeras 5 columnas: {columns[:5]}")
    
    try:
        successful_inserts = 0
        failed_inserts = 0
        
        # Insertar registros uno por uno para mejor control de errores
        for i, match in enumerate(matches_data, 1):
            try:
                values = [match.get(col) for col in columns]
                
                # Debug: mostrar algunos valores para verificar
                if i <= 3:  # Solo para los primeros 3 registros
                    print(f"\n🔍 Debug registro {i}:")
                    print(f"   ID_PARTIDO: {match.get('ID_PARTIDO')}")
                    print(f"   FECHA: {match.get('FECHA')}")
                    print(f"   EQUIPO_LOCAL: {match.get('EQUIPO_LOCAL')}")
                    print(f"   EQUIPO_VISITANTE: {match.get('EQUIPO_VISITANTE')}")
                    print(f"   Valores None en registro: {sum(1 for v in values if v is None)}")
                
                cursor.execute(query, values)
                successful_inserts += 1
                
                if i % 10 == 0:  # Progreso cada 10 registros
                    print(f"✅ Procesados {i}/{len(matches_data)} partidos...")
                    
            except mysql.connector.Error as e:
                failed_inserts += 1
                print(f"❌ Error insertando partido {i} (ID: {match.get('ID_PARTIDO', 'N/A')}): {e}")
                print(f"   Detalle del error: {e.errno} - {e.msg}")
                
                # Mostrar valores problemáticos
                print(f"   Valores con problemas:")
                for j, (col, val) in enumerate(zip(columns, values)):
                    if val == '' or (isinstance(val, str) and len(val) > 100):
                        print(f"     {col}: '{val}' (tipo: {type(val)})")
                
                continue
        
        connection.commit()
        
        print(f"\n📊 Resumen de inserción de partidos:")
        print(f"   ✅ Exitosos: {successful_inserts}")
        print(f"   ❌ Fallidos: {failed_inserts}")
        print(f"   📈 Tasa de éxito: {(successful_inserts/len(matches_data)*100):.1f}%")
        
        # Verificar cuántos registros hay en la tabla
        cursor.execute("SELECT COUNT(*) FROM PARTIDOS_PRIMERA_DIVISION_CHILE")
        total_records = cursor.fetchone()[0]
        print(f"   📊 Total registros en tabla: {total_records}")
        
        return successful_inserts > 0
        
    except mysql.connector.Error as e:
        print(f"❌ Error general insertando partidos: {e}")
        connection.rollback()
        return False
    finally:
        cursor.close()

def insert_players_to_mysql(players_data, connection):
    """Inserta los datos de jugadores por partido en MySQL con manejo mejorado de errores"""
    if not players_data:
        print("❌ No hay datos de jugadores para insertar")
        return False
    
    cursor = connection.cursor()
    
    # Crear tabla si no existe
    create_match_players_table(cursor)
    
    print(f"\n🔄 Iniciando inserción de {len(players_data)} registros de jugadores...")
    
    # Preparar query de inserción
    columns = list(players_data[0].keys())
    placeholders = ', '.join(['%s'] * len(columns))
    query = f"""
        INSERT INTO JUGADORES_POR_PARTIDO_CHILE 
        ({', '.join(columns)}) 
        VALUES ({placeholders})
        ON DUPLICATE KEY UPDATE
        {', '.join([f'{col} = VALUES({col})' for col in columns if col not in ['ID_PARTIDO', 'ID_JUGADOR']])}
    """
    
    print(f"📋 Columnas de jugadores: {len(columns)}")
    
    try:
        successful_inserts = 0
        failed_inserts = 0
        
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
        
        print(f"\n📊 Resumen de inserción de jugadores:")
        print(f"   ✅ Exitosos: {successful_inserts}")
        print(f"   ❌ Fallidos: {failed_inserts}")
        
        # Verificar cuántos registros hay en la tabla
        cursor.execute("SELECT COUNT(*) FROM JUGADORES_POR_PARTIDO_CHILE")
        total_records = cursor.fetchone()[0]
        print(f"   📊 Total registros en tabla: {total_records}")
        
        return successful_inserts > 0
        
    except mysql.connector.Error as e:
        print(f"❌ Error general insertando jugadores: {e}")
        connection.rollback()
        return False
    finally:
        cursor.close()

def main():
    # Configuración
    api_key = "AzumZVPR1MlXaroDdCzrE4OT0ezDLMlLDjVCi0Txb0k"
    
    print(f"{'='*60}")
    print("OBTENCIÓN COMPLETA DE DATOS DE PRIMERA DIVISIÓN CHILENA 2025")
    print("CON INSERCIÓN A MYSQL - VERSIÓN MEJORADA CON DEBUG")
    print(f"{'='*60}")
    
    # Conectar a MySQL
    connection = create_database_connection()
    if not connection:
        print("❌ No se pudo conectar a MySQL. Proceso cancelado.")
        return
    
    try:
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
        print(f"   📋 Ejemplo de partido completo:")
        if detailed_matches:
            sample_match = detailed_matches[0]
            print(f"      ID_PARTIDO: {sample_match.get('ID_PARTIDO')}")
            print(f"      FECHA: {sample_match.get('FECHA')}")
            print(f"      EQUIPO_LOCAL: {sample_match.get('EQUIPO_LOCAL')}")
            print(f"      EQUIPO_VISITANTE: {sample_match.get('EQUIPO_VISITANTE')}")
            print(f"      GOLES_LOCAL: {sample_match.get('GOLES_LOCAL')}")
            print(f"      GOLES_VISITANTE: {sample_match.get('GOLES_VISITANTE')}")
            print(f"      RUEDA: {sample_match.get('RUEDA')}")
            print(f"      Campos totales: {len(sample_match.keys())}")
            print(f"      Campos con None: {sum(1 for v in sample_match.values() if v is None)}")
        
        # 4. Insertar partidos en MySQL
        print(f"\n{'='*60}")
        print("INSERTANDO PARTIDOS EN MYSQL")
        print(f"{'='*60}")
        
        matches_inserted = insert_matches_to_mysql(detailed_matches, connection)
        
        if matches_inserted:
            print("✅ Partidos insertados exitosamente")
        else:
            print("❌ Error insertando partidos - continuando con jugadores...")
        
        # 5. Verificar inserción de partidos
        cursor = connection.cursor()
        cursor.execute("SELECT COUNT(*) FROM PARTIDOS_PRIMERA_DIVISION_CHILE")
        partidos_count = cursor.fetchone()[0]
        cursor.close()
        
        print(f"\n🔍 VERIFICACIÓN POST-INSERCIÓN:")
        print(f"   📊 Registros en PARTIDOS_PRIMERA_DIVISION_CHILE: {partidos_count}")
        
        if partidos_count == 0:
            print("⚠️ WARNING: No hay registros en la tabla de partidos!")
            print("   Investigando posibles causas...")
            
            # Ejecutar troubleshooting
            troubleshoot_match_insertion(detailed_matches, connection)
            
            # Debug adicional
            if detailed_matches:
                print(f"   🔍 Analizando primer partido:")
                first_match = detailed_matches[0]
                for key, value in first_match.items():
                    if value is not None and value != '':
                        print(f"      {key}: {value} (tipo: {type(value)})")
        
        # 6. Procesar jugadores por partido solo si hay partidos
        print(f"\n{'='*60}")
        print("PROCESANDO JUGADORES POR PARTIDO")
        print(f"{'='*60}")
        
        players_data = process_match_players(detailed_matches, api_key)
        
        if not players_data:
            print("❌ No se pudieron obtener datos de jugadores")
        else:
            print(f"✅ {len(players_data)} registros de jugadores procesados")
        
        # 7. Insertar jugadores en MySQL
        if players_data:
            players_inserted = insert_players_to_mysql(players_data, connection)
            if players_inserted:
                print("✅ Jugadores insertados exitosamente")
        
        # 8. Verificar estado final de la base de datos
        verify_database_state(connection)
        
        # 9. Mostrar resumen final
        print(f"\n{'='*60}")
        print("✅ PROCESO COMPLETADO - RESUMEN FINAL")
        print(f"{'='*60}")
        
        # Contar registros finales
        cursor = connection.cursor()
        cursor.execute("SELECT COUNT(*) FROM PARTIDOS_PRIMERA_DIVISION_CHILE")
        final_partidos = cursor.fetchone()[0]
        cursor.execute("SELECT COUNT(*) FROM JUGADORES_POR_PARTIDO_CHILE")
        final_jugadores = cursor.fetchone()[0]
        cursor.close()
        
        print(f"📊 ESTADÍSTICAS FINALES:")
        print(f"   🏆 Partidos procesados: {len(detailed_matches)}")
        print(f"   📊 Partidos en BD: {final_partidos}")
        print(f"   👥 Jugadores procesados: {len(players_data) if players_data else 0}")
        print(f"   📊 Jugadores en BD: {final_jugadores}")
        
        # Estadísticas adicionales
        if detailed_matches:
            jugados = [m for m in detailed_matches if m.get('ESTADO_PARTIDO') == 'JUGADO']
            programados = [m for m in detailed_matches if m.get('ESTADO_PARTIDO') == 'PROGRAMADO']
            
            # Estadísticas de ruedas
            primera_rueda = [m for m in detailed_matches if m.get('RUEDA') == '1']
            segunda_rueda = [m for m in detailed_matches if m.get('RUEDA') == '2']
            formato_unico = [m for m in detailed_matches if m.get('RUEDA') == '0']
            
            print(f"\n🏁 Estado de los partidos:")
            print(f"   🟢 Partidos jugados: {len(jugados)}")
            print(f"   🟡 Partidos programados: {len(programados)}")
            
            print(f"\n🔄 Distribución por ruedas:")
            print(f"   1️⃣ Primera rueda: {len(primera_rueda)} partidos")
            print(f"   2️⃣ Segunda rueda: {len(segunda_rueda)} partidos")
            print(f"   0️⃣ Formato único: {len(formato_unico)} partidos")
        
        print(f"\n📋 Tablas MySQL:")
        print(f"   📊 PARTIDOS_PRIMERA_DIVISION_CHILE: {final_partidos} registros")
        print(f"   👥 JUGADORES_POR_PARTIDO_CHILE: {final_jugadores} registros")
        
        # Diagnóstico si hay problemas
        if final_partidos == 0 and len(detailed_matches) > 0:
            print(f"\n🚨 DIAGNÓSTICO DE PROBLEMA:")
            print(f"   ❌ Se procesaron {len(detailed_matches)} partidos pero 0 se insertaron")
            print(f"   💡 Posibles causas:")
            print(f"      - Error en tipos de datos")
            print(f"      - Problemas de codificación de caracteres")
            print(f"      - Campos demasiado largos para las columnas")
            print(f"      - Claves primarias duplicadas")
        
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