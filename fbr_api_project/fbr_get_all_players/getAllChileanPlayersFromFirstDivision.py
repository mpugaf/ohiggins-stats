import requests
import json
import time
import os
import mysql.connector
from datetime import datetime

# Configuración de la base de datos
DB_CONFIG = {
    'host': '192.168.100.16',
    'user': 'mpuga',           # Cambiar por tu usuario
    'password': '123qweasd',       # Cambiar por tu contraseña
    'database': 'MP_DATA_DEV',
    'charset': 'utf8mb4',
    'collation': 'utf8mb4_general_ci',  # Collation compatible con versiones anteriores
    'autocommit': False,
    'raise_on_warnings': True
}

def get_db_connection():
    """Establece conexión con la base de datos"""
    try:
        # Primer intento con configuración completa
        connection = mysql.connector.connect(**DB_CONFIG)
        return connection
    except mysql.connector.Error as e:
        print(f"⚠️ Error con configuración completa: {e}")
        
        # Segundo intento sin collation específica
        try:
            config_simple = {k: v for k, v in DB_CONFIG.items() if k != 'collation'}
            connection = mysql.connector.connect(**config_simple)
            print("✅ Conexión exitosa sin collation específica")
            return connection
        except mysql.connector.Error as e2:
            print(f"⚠️ Error sin collation: {e2}")
            
            # Tercer intento solo con configuración básica
            try:
                config_basic = {
                    'host': DB_CONFIG['host'],
                    'user': DB_CONFIG['user'],
                    'password': DB_CONFIG['password'],
                    'database': DB_CONFIG['database']
                }
                connection = mysql.connector.connect(**config_basic)
                print("✅ Conexión exitosa con configuración básica")
                return connection
            except mysql.connector.Error as e3:
                print(f"❌ Error final conectando a la base de datos: {e3}")
                return None

def player_exists(player_id_fbr, cursor):
    """Verifica si un jugador ya existe en la base de datos"""
    try:
        query = "SELECT COUNT(*) FROM DIM_JUGADOR WHERE PLAYER_ID_FBR = %s"
        cursor.execute(query, (player_id_fbr,))
        result = cursor.fetchone()
        return result[0] > 0
    except mysql.connector.Error as e:
        print(f"    ❌ Error verificando existencia del jugador {player_id_fbr}: {e}")
        return True  # Si hay error, asumir que existe para evitar duplicados

def get_pais_id_by_codigo(codigo_pais, cursor):
    """Obtiene el ID_PAIS basado en el código de país"""
    try:
        query = "SELECT ID_PAIS FROM DIM_PAIS WHERE CODIGO_FIFA = %s"
        cursor.execute(query, (codigo_pais,))
        result = cursor.fetchone()
        return result[0] if result else None
    except mysql.connector.Error as e:
        print(f"    ❌ Error obteniendo ID país para {codigo_pais}: {e}")
        return None

def get_posicion_id_by_codigo(codigo_posicion, cursor):
    """Obtiene el ID_POSICION basado en el código de posición"""
    try:
        query = "SELECT ID_POSICION FROM DIM_POSICION WHERE CODIGO_POSICION = %s"
        cursor.execute(query, (codigo_posicion,))
        result = cursor.fetchone()
        return result[0] if result else None
    except mysql.connector.Error as e:
        print(f"    ❌ Error obteniendo ID posición para {codigo_posicion}: {e}")
        return None

def jugador_pais_exists(player_id_fbr, id_pais, tipo_relacion, cursor):
    """Verifica si ya existe la relación jugador-país"""
    try:
        query = """
        SELECT COUNT(*) FROM DIM_JUGADOR_PAIS 
        WHERE PLAYER_ID_FBR = %s AND ID_PAIS = %s AND TIPO_RELACION = %s
        """
        cursor.execute(query, (player_id_fbr, id_pais, tipo_relacion))
        result = cursor.fetchone()
        return result[0] > 0
    except mysql.connector.Error as e:
        print(f"    ❌ Error verificando relación jugador-país: {e}")
        return True

def jugador_posicion_exists(player_id_fbr, id_posicion, cursor):
    """Verifica si ya existe la relación jugador-posición"""
    try:
        query = """
        SELECT COUNT(*) FROM DIM_JUGADOR_POSICION 
        WHERE PLAYER_ID_FBR = %s AND ID_POSICION = %s
        """
        cursor.execute(query, (player_id_fbr, id_posicion))
        result = cursor.fetchone()
        return result[0] > 0
    except mysql.connector.Error as e:
        print(f"    ❌ Error verificando relación jugador-posición: {e}")
        return True

def insert_jugador_pais(player_id_fbr, nacionalidades, cursor):
    """Inserta las relaciones jugador-país"""
    if not nacionalidades:
        return 0, 0
    
    inserted = 0
    existing = 0
    
    # Si nacionalidades es una string, convertir a lista
    if isinstance(nacionalidades, str):
        nacionalidades = [nacionalidades]
    
    for nacionalidad in nacionalidades:
        if not nacionalidad or nacionalidad.strip() == '':
            continue
            
        # Obtener ID del país
        id_pais = get_pais_id_by_codigo(nacionalidad.strip(), cursor)
        
        if id_pais:
            # Verificar si ya existe la relación
            if not jugador_pais_exists(player_id_fbr, id_pais, 'NACIONALIDAD', cursor):
                try:
                    insert_query = """
                    INSERT INTO DIM_JUGADOR_PAIS 
                    (PLAYER_ID_FBR, ID_PAIS, TIPO_RELACION)
                    VALUES (%s, %s, %s)
                    """
                    cursor.execute(insert_query, (player_id_fbr, id_pais, 'NACIONALIDAD'))
                    inserted += 1
                except mysql.connector.Error as e:
                    print(f"      ❌ Error insertando nacionalidad {nacionalidad}: {e}")
            else:
                existing += 1
        else:
            print(f"      ⚠️ País no encontrado en DIM_PAIS: {nacionalidad}")
    
    return inserted, existing

def insert_jugador_posicion(player_id_fbr, posiciones_roster, posiciones_detalladas, cursor):
    """Inserta las relaciones jugador-posición"""
    inserted = 0
    existing = 0
    
    # Combinar posiciones del roster y detalladas
    all_positions = set()
    
    # Agregar posición del roster
    if posiciones_roster:
        all_positions.add(posiciones_roster.strip())
    
    # Agregar posiciones detalladas
    if posiciones_detalladas:
        if isinstance(posiciones_detalladas, str):
            # Separar por comas y limpiar
            detailed_positions = [pos.strip() for pos in posiciones_detalladas.split(',')]
            all_positions.update(detailed_positions)
        elif isinstance(posiciones_detalladas, list):
            all_positions.update(posiciones_detalladas)
    
    # Mapeo de posiciones comunes que podrían venir de la API
    position_mapping = {
        'GK': 'GK',
        'DF': 'DF', 
        'MF': 'MF',
        'FW': 'FW',
        'CB': 'CB',
        'LB': 'LB',
        'RB': 'RB',
        'DM': 'DM',
        'AM': 'AM',
        'LM': 'LM',
        'RM': 'RM',
        'LW': 'LW',
        'RW': 'RW'
    }
    
    orden = 1
    for posicion in all_positions:
        if not posicion:
            continue
            
        # Mapear la posición
        codigo_posicion = position_mapping.get(posicion, posicion)
        
        # Obtener ID de la posición
        id_posicion = get_posicion_id_by_codigo(codigo_posicion, cursor)
        
        if id_posicion:
            # Verificar si ya existe la relación
            if not jugador_posicion_exists(player_id_fbr, id_posicion, cursor):
                try:
                    insert_query = """
                    INSERT INTO DIM_JUGADOR_POSICION 
                    (PLAYER_ID_FBR, ID_POSICION, ES_POSICION_PRINCIPAL, ORDEN_PREFERENCIA)
                    VALUES (%s, %s, %s, %s)
                    """
                    es_principal = 1 if orden == 1 else 0  # Primera posición es principal
                    cursor.execute(insert_query, (player_id_fbr, id_posicion, es_principal, orden))
                    inserted += 1
                    orden += 1
                except mysql.connector.Error as e:
                    print(f"      ❌ Error insertando posición {posicion}: {e}")
            else:
                existing += 1
        else:
            print(f"      ⚠️ Posición no encontrada en DIM_POSICION: {posicion}")
    
    return inserted, existing

def insert_player_to_db(player_data, cursor):
    """Inserta un jugador en la tabla DIM_JUGADOR y sus relaciones"""
    try:
        # Verificar si el jugador ya existe
        if player_exists(player_data['player_id_fbr'], cursor):
            return False, "Ya existe", 0, 0, 0, 0
        
        # Preparar los datos para inserción
        nombre_completo = player_data.get('nombre_completo') or None
        if not nombre_completo:
            nombre_completo = player_data.get('nombre_roster') or None
        
        apodo = None  # La API no proporciona apodo específico
        fecha_nacimiento = player_data.get('fecha_nacimiento') or None
        if fecha_nacimiento == '':
            fecha_nacimiento = None
        
        pie_dominante = player_data.get('pie_dominante') or None
        if pie_dominante == '':
            pie_dominante = None
        elif pie_dominante:
            # Convertir al formato esperado en la BD
            if pie_dominante.lower() == 'left':
                pie_dominante = 'LEFT'
            elif pie_dominante.lower() == 'right':
                pie_dominante = 'RIGHT'
            elif pie_dominante.lower() == 'both':
                pie_dominante = 'BOTH'
            else:
                pie_dominante = None
        
        player_id_fbr = player_data.get('player_id_fbr') or None
        
        # Validar que tengamos al menos el PLAYER_ID_FBR
        if not player_id_fbr:
            return False, "Sin PLAYER_ID_FBR", 0, 0, 0, 0
        
        # Preparar query de inserción del jugador principal
        insert_query = """
        INSERT INTO DIM_JUGADOR 
        (PLAYER_ID_FBR, NOMBRE_COMPLETO, APODO, FECHA_NACIMIENTO, PIE_DOMINANTE)
        VALUES (%s, %s, %s, %s, %s)
        """
        
        values = (
            player_id_fbr,
            nombre_completo,
            apodo,
            fecha_nacimiento,
            pie_dominante
        )
        
        cursor.execute(insert_query, values)
        
        # Insertar relaciones de nacionalidad
        nacionalidades = []
        if player_data.get('nacionalidad_codigo'):
            nacionalidades.append(player_data.get('nacionalidad_codigo'))
        
        paises_inserted, paises_existing = insert_jugador_pais(player_id_fbr, nacionalidades, cursor)
        
        # Insertar relaciones de posición
        posiciones_inserted, posiciones_existing = insert_jugador_posicion(
            player_id_fbr,
            player_data.get('posicion_roster'),
            player_data.get('posiciones_detalladas'),
            cursor
        )
        
        return True, "Insertado correctamente", paises_inserted, paises_existing, posiciones_inserted, posiciones_existing
        
    except mysql.connector.Error as e:
        return False, f"Error BD: {e}", 0, 0, 0, 0
    except Exception as e:
        return False, f"Error general: {e}", 0, 0, 0, 0

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

def get_team_season_stats(league_id, season_id, api_key):
    """Obtiene estadísticas de temporada de todos los equipos de una liga"""
    base_url = "https://fbrapi.com"
    url = f"{base_url}/team-season-stats"
    params = {"league_id": league_id}
    if season_id:
        params["season_id"] = season_id
    headers = {"X-API-Key": api_key}
    
    try:
        print(f"Obteniendo estadísticas de equipos para liga {league_id}...")
        if season_id:
            print(f"Temporada: {season_id}")
        response = requests.get(url, params=params, headers=headers)
        
        if response.status_code == 200:
            return response.json()
        else:
            print(f"Error: {response.status_code}")
            return None
    except Exception as e:
        print(f"Error en la solicitud: {e}")
        return None

def get_team_data(team_id, api_key):
    """Obtiene los datos del equipo (roster y schedule) a través de la API"""
    base_url = "https://fbrapi.com"
    url = f"{base_url}/teams"
    params = {"team_id": team_id}
    headers = {"X-API-Key": api_key}
    
    try:
        response = requests.get(url, params=params, headers=headers)
        
        if response.status_code == 200:
            return response.json()
        else:
            print(f"Error {response.status_code} para equipo {team_id}")
            return None
    except Exception as e:
        print(f"Error en la solicitud para equipo {team_id}: {e}")
        return None

def get_player_detailed_info(player_id, api_key):
    """Obtiene información detallada de un jugador específico"""
    base_url = "https://fbrapi.com"
    url = f"{base_url}/players"
    params = {"player_id": player_id}
    headers = {"X-API-Key": api_key}
    
    try:
        response = requests.get(url, params=params, headers=headers)
        
        if response.status_code == 200:
            return response.json()
        else:
            print(f"    Error {response.status_code} para jugador {player_id}")
            return None
    except Exception as e:
        print(f"    Error en solicitud para jugador {player_id}: {e}")
        return None

def combine_player_data(basic_data, detailed_data, team_info):
    """Combina datos básicos del roster con información detallada del jugador"""
    player_data = {
        # IDs y identificadores
        'player_id_fbr': basic_data.get('player_id_fbr', ''),
        'team_id_fbr': team_info.get('team_id', ''),
        'team_name': team_info.get('team_name', ''),
        
        # Información personal
        'nombre_completo': '',
        'nombre_roster': basic_data.get('nombre_roster', ''),
        'fecha_nacimiento': '',
        
        # Información de nacionalidad y posición
        'nacionalidad_codigo': basic_data.get('nacionalidad_codigo', ''),
        'posicion_roster': basic_data.get('posicion_roster', ''),
        'posiciones_detalladas': '',
        
        # Información física y técnica
        'pie_dominante': '',
    }
    
    # Si tenemos información detallada, completar los campos
    if detailed_data:
        player_data['nombre_completo'] = detailed_data.get('full_name', basic_data.get('nombre_roster', ''))
        player_data['fecha_nacimiento'] = detailed_data.get('date_of_birth', '')
        player_data['pie_dominante'] = detailed_data.get('footed', '')
        
        # Procesar posiciones (puede ser una lista)
        positions = detailed_data.get('positions', [])
        if isinstance(positions, list):
            player_data['posiciones_detalladas'] = ', '.join(positions)
        else:
            player_data['posiciones_detalladas'] = str(positions) if positions else ''
    else:
        # Si no hay información detallada, usar datos del roster
        player_data['nombre_completo'] = basic_data.get('nombre_roster', '')
    
    return player_data

def process_team_players(team_data, team_info, api_key, cursor, connection, enable_detailed_info=True):
    """Procesa los jugadores del equipo y los inserta en la base de datos"""
    if not team_data or 'team_roster' not in team_data or 'data' not in team_data['team_roster']:
        print(f"No hay datos de roster para el equipo {team_info.get('team_name', 'N/A')}")
        return 0, 0, 0, 0, 0, 0, 0
    
    roster_data = team_data['team_roster']['data']
    
    print(f"    Procesando {len(roster_data)} jugadores...")
    
    inserted_count = 0
    existing_count = 0
    error_count = 0
    total_paises_inserted = 0
    total_paises_existing = 0
    total_posiciones_inserted = 0
    total_posiciones_existing = 0
    
    for i, player in enumerate(roster_data, 1):
        # Obtener información básica del roster
        player_basic = {
            'player_id_fbr': player.get('player_id', ''),
            'nombre_roster': player.get('player', ''),
            'nacionalidad_codigo': player.get('nationality', ''),
            'posicion_roster': player.get('position', ''),
            'edad_roster': player.get('age', None),
            'partidos_jugados': player.get('mp', None),
            'partidos_titular': player.get('starts', None)
        }
        
        # Obtener información detallada del jugador (opcional)
        detailed_info = None
        if enable_detailed_info and player.get('player_id'):
            print(f"      [{i}/{len(roster_data)}] Procesando: {player.get('player', 'N/A')}")
            detailed_info = get_player_detailed_info(player.get('player_id'), api_key)
            # Esperar para respetar límite de frecuencia
            time.sleep(7)
        
        # Combinar información básica con detallada
        final_player_data = combine_player_data(player_basic, detailed_info, team_info)
        
        # Insertar en la base de datos (jugador + relaciones)
        success, message, paises_ins, paises_ex, pos_ins, pos_ex = insert_player_to_db(final_player_data, cursor)
        
        if success:
            inserted_count += 1
            total_paises_inserted += paises_ins
            total_paises_existing += paises_ex
            total_posiciones_inserted += pos_ins
            total_posiciones_existing += pos_ex
            
            relaciones_info = ""
            if paises_ins > 0 or pos_ins > 0:
                relaciones_info = f" [🌍{paises_ins} países, 🎯{pos_ins} posiciones]"
            
            print(f"        ✅ Insertado: {final_player_data.get('nombre_completo', 'N/A')}{relaciones_info}")
        elif "Ya existe" in message:
            existing_count += 1
            print(f"        ⚠️  Ya existe: {final_player_data.get('nombre_completo', 'N/A')}")
        else:
            error_count += 1
            print(f"        ❌ Error: {final_player_data.get('nombre_completo', 'N/A')} - {message}")
    
    # Confirmar transacción después de procesar todo el equipo
    try:
        connection.commit()
        print(f"    ✅ Transacción confirmada para el equipo")
    except mysql.connector.Error as e:
        print(f"    ❌ Error confirmando transacción: {e}")
        connection.rollback()
    
    return (inserted_count, existing_count, error_count, 
            total_paises_inserted, total_paises_existing, 
            total_posiciones_inserted, total_posiciones_existing)

def find_first_division_teams(api_key):
    """Encuentra los equipos de la Primera División chilena"""
    print(f"{'='*80}")
    print("BUSCANDO EQUIPOS DE PRIMERA DIVISIÓN CHILENA")
    print(f"{'='*80}")
    
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
    
    print(f"✅ Chile encontrado: {chile_info.get('country_code')}")
    
    time.sleep(7)
    
    # Obtener ligas de Chile
    leagues_data = get_leagues_by_country(chile_info.get('country_code'), api_key)
    
    if not leagues_data:
        print("❌ No se pudieron obtener las ligas chilenas")
        return None
    
    # Buscar la Primera División (liga masculina de primer nivel)
    first_division_league = None
    for league_category in leagues_data.get('data', []):
        if league_category.get('league_type') == 'domestic_leagues':
            leagues = league_category.get('leagues', [])
            
            for league in leagues:
                if (league.get('gender') == 'M' and 
                    league.get('tier') == '1st'):
                    first_division_league = league
                    break
            
            if first_division_league:
                break
    
    if not first_division_league:
        print("❌ No se encontró la Primera División chilena")
        return None
    
    print(f"✅ Primera División encontrada: {first_division_league.get('competition_name')}")
    print(f"   ID Liga: {first_division_league.get('league_id')}")
    print(f"   Última temporada: {first_division_league.get('last_season')}")
    
    time.sleep(7)
    
    # Obtener equipos de la Primera División
    league_id = first_division_league.get('league_id')
    latest_season = first_division_league.get('last_season')
    
    teams_data = get_team_season_stats(league_id, latest_season, api_key)
    
    if not teams_data:
        print("❌ No se pudieron obtener los equipos")
        return None
    
    # Extraer información básica de los equipos
    teams_list = []
    print(f"\n✅ Equipos de Primera División encontrados:")
    print(f"{'#':<3} {'EQUIPO':<30} {'ID':<12}")
    print("-" * 50)
    
    for i, team_data in enumerate(teams_data.get('data', []), 1):
        meta_data = team_data.get('meta_data', {})
        team_info = {
            'team_id': meta_data.get('team_id', ''),
            'team_name': meta_data.get('team_name', ''),
            'league_id': league_id,
            'league_name': first_division_league.get('competition_name'),
            'season': latest_season
        }
        teams_list.append(team_info)
        
        name = team_info['team_name'][:29]
        team_id = team_info['team_id'][:11]
        print(f"{i:<3} {name:<30} {team_id:<12}")
    
    return teams_list

def test_db_connection():
    """Prueba la conexión a la base de datos"""
    print("🔍 Probando conexión a la base de datos...")
    
    # Mostrar información de la versión de MySQL
    connection = get_db_connection()
    
    if connection:
        try:
            cursor = connection.cursor()
            
            # Verificar versión de MySQL/MariaDB
            cursor.execute("SELECT VERSION()")
            version = cursor.fetchone()[0]
            print(f"📊 Versión de BD: {version}")
            
            # Verificar charset y collation actuales
            cursor.execute("SHOW VARIABLES LIKE 'character_set_database'")
            charset = cursor.fetchone()[1]
            cursor.execute("SHOW VARIABLES LIKE 'collation_database'")
            collation = cursor.fetchone()[1]
            print(f"📊 Charset BD: {charset}, Collation BD: {collation}")
            
            # Verificar tabla DIM_JUGADOR
            cursor.execute("SELECT COUNT(*) FROM DIM_JUGADOR")
            current_count = cursor.fetchone()[0]
            print(f"✅ Conexión exitosa. Jugadores actuales en BD: {current_count}")
            
            cursor.close()
            connection.close()
            return True
            
        except mysql.connector.Error as e:
            print(f"❌ Error ejecutando consulta: {e}")
            if connection.is_connected():
                connection.close()
            return False
    else:
        return False

def main():
    # Configuración
    api_key = "AzumZVPR1MlXaroDdCzrE4OT0ezDLMlLDjVCi0Txb0k"
    
    # Configuración de procesamiento
    ENABLE_DETAILED_INFO = True  # Cambiar a False para solo obtener datos básicos y ser más rápido
    
    print(f"{'='*80}")
    print("INSERCIÓN DE JUGADORES DE PRIMERA DIVISIÓN CHILENA EN BD")
    print(f"{'='*80}")
    print(f"Información detallada: {'HABILITADA' if ENABLE_DETAILED_INFO else 'DESHABILITADA'}")
    
    # Probar conexión a la base de datos
    if not test_db_connection():
        print("❌ No se pudo conectar a la base de datos. Verifica la configuración.")
        return
    
    try:
        # 1. Encontrar equipos de Primera División
        teams_list = find_first_division_teams(api_key)
        
        if not teams_list:
            print("❌ No se pudieron obtener los equipos")
            return
        
        print(f"\n🔍 Se procesarán {len(teams_list)} equipos")
        
        # 2. Establecer conexión a la base de datos
        connection = get_db_connection()
        if not connection:
            print("❌ No se pudo establecer conexión a la base de datos")
            return
        
        cursor = connection.cursor()
        
        # 3. Procesar jugadores de cada equipo
        total_inserted = 0
        total_existing = 0
        total_errors = 0
        total_paises_inserted = 0
        total_paises_existing = 0
        total_posiciones_inserted = 0
        total_posiciones_existing = 0
        successful_teams = 0
        
        print(f"\n{'='*80}")
        print("PROCESANDO JUGADORES POR EQUIPO E INSERTANDO EN BD")
        print(f"{'='*80}")
        
        for i, team_info in enumerate(teams_list, 1):
            print(f"\n[{i}/{len(teams_list)}] 🏟️  PROCESANDO: {team_info['team_name']}")
            print(f"Team ID: {team_info['team_id']}")
            
            # Obtener datos del equipo
            team_data = get_team_data(team_info['team_id'], api_key)
            time.sleep(7)  # Respetar límite de frecuencia
            
            if team_data:
                # Procesar jugadores del equipo e insertar en BD
                result = process_team_players(
                    team_data, team_info, api_key, cursor, connection, ENABLE_DETAILED_INFO
                )
                
                inserted, existing, errors, paises_ins, paises_ex, pos_ins, pos_ex = result
                
                total_inserted += inserted
                total_existing += existing
                total_errors += errors
                total_paises_inserted += paises_ins
                total_paises_existing += paises_ex
                total_posiciones_inserted += pos_ins
                total_posiciones_existing += pos_ex
                successful_teams += 1
                
                print(f"    📊 Resumen equipo: {inserted} jugadores insertados, {existing} existían, {errors} errores")
                print(f"       🌍 Países: {paises_ins} insertados, {paises_ex} existían")
                print(f"       🎯 Posiciones: {pos_ins} insertadas, {pos_ex} existían")
            else:
                print(f"    ❌ No se pudieron obtener datos del equipo")
        
        # 4. Mostrar resumen final
        print(f"\n{'='*80}")
        print("RESUMEN FINAL DE INSERCIÓN EN BD")
        print(f"{'='*80}")
        print(f"Equipos procesados exitosamente: {successful_teams}/{len(teams_list)}")
        print(f"Total jugadores insertados: {total_inserted}")
        print(f"Total jugadores que ya existían: {total_existing}")
        print(f"Total errores: {total_errors}")
        print(f"Total procesados: {total_inserted + total_existing + total_errors}")
        print(f"\n📊 RELACIONES INSERTADAS:")
        print(f"🌍 Países insertados: {total_paises_inserted} (existían: {total_paises_existing})")
        print(f"🎯 Posiciones insertadas: {total_posiciones_inserted} (existían: {total_posiciones_existing})")
        
        # Verificar conteo final en la BD
        try:
            cursor.execute("SELECT COUNT(*) FROM DIM_JUGADOR")
            final_count = cursor.fetchone()[0]
            print(f"\n📈 Total jugadores en DIM_JUGADOR: {final_count}")
            
            cursor.execute("SELECT COUNT(*) FROM DIM_JUGADOR_PAIS")
            pais_count = cursor.fetchone()[0]
            print(f"📈 Total relaciones en DIM_JUGADOR_PAIS: {pais_count}")
            
            cursor.execute("SELECT COUNT(*) FROM DIM_JUGADOR_POSICION")
            pos_count = cursor.fetchone()[0]
            print(f"📈 Total relaciones en DIM_JUGADOR_POSICION: {pos_count}")

        except mysql.connector.Error as e:
            print(f"Error verificando conteos finales: {e}")

            # Procesar jugadores del equipo e insertar en BD
            inserted, existing, errors = process_team_players(
                team_data, team_info, api_key, cursor, connection, ENABLE_DETAILED_INFO
            )

            total_inserted += inserted
            total_existing += existing
            total_errors += errors
            successful_teams += 1

            print(f"    📊 Resumen equipo: {inserted} insertados, {existing} existían, {errors} errores")
        else:
            print(f"    ❌ No se pudieron obtener datos del equipo")
        
        # 4. Mostrar resumen final
        print(f"\n{'='*80}")
        print("RESUMEN FINAL DE INSERCIÓN EN BD")
        print(f"{'='*80}")
        print(f"Equipos procesados exitosamente: {successful_teams}/{len(teams_list)}")
        print(f"Total jugadores insertados: {total_inserted}")
        print(f"Total jugadores que ya existían: {total_existing}")
        print(f"Total errores: {total_errors}")
        print(f"Total procesados: {total_inserted + total_existing + total_errors}")
        
        # Verificar conteo final en la BD
        try:
            cursor.execute("SELECT COUNT(*) FROM DIM_JUGADOR")
            final_count = cursor.fetchone()[0]
            print(f"Total jugadores en BD después del proceso: {final_count}")
        except mysql.connector.Error as e:
            print(f"Error verificando conteo final: {e}")
        
        # 5. Cerrar conexión
        cursor.close()
        connection.close()
        
        print(f"\n{'='*80}")
        print("✅ PROCESO COMPLETADO EXITOSAMENTE")
        print(f"{'='*80}")
        
    except KeyboardInterrupt:
        print("\n⚠️ Proceso interrumpido por el usuario")
        if 'connection' in locals() and connection.is_connected():
            connection.rollback()
            connection.close()
    except Exception as e:
        print(f"\n❌ Error inesperado: {e}")
        if 'connection' in locals() and connection.is_connected():
            connection.rollback()
            connection.close()

if __name__ == "__main__":
    main()