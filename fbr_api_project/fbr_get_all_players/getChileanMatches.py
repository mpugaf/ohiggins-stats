import requests
import json
import csv
import time
import os
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

def create_field_mapping():
    """Crea mapeo de campos en inglés a español más descriptivos"""
    return {
        # Información básica del partido
        'match_id': 'ID_PARTIDO',
        'league_id': 'ID_LIGA',
        'league_name': 'NOMBRE_LIGA',
        'season_id': 'TEMPORADA',
        'date': 'FECHA',
        'time': 'HORA',
        'round': 'RONDA',
        'wk': 'JORNADA',
        'venue': 'ESTADIO',
        'attendance': 'ASISTENCIA',
        'referee': 'ARBITRO',
        
        # Equipos
        'home_team': 'EQUIPO_LOCAL',
        'home_team_id': 'ID_EQUIPO_LOCAL',
        'away_team': 'EQUIPO_VISITANTE',
        'away_team_id': 'ID_EQUIPO_VISITANTE',
        
        # Resultados básicos
        'home_score': 'GOLES_LOCAL',
        'away_score': 'GOLES_VISITANTE',
        
        # Estadísticas del equipo local
        'home_result': 'RESULTADO_LOCAL',
        'home_gls': 'GOLES_LOCAL_DETALLE',
        'home_gls_ag': 'GOLES_EN_CONTRA_LOCAL',
        'home_xg': 'XG_LOCAL',
        'home_xga': 'XGA_LOCAL',
        'home_poss': 'POSESION_LOCAL',
        'home_captain': 'CAPITAN_LOCAL',
        'home_formation': 'FORMACION_LOCAL',
        
        # Portero local
        'home_sot_ag': 'TIROS_AL_ARCO_CONTRA_LOCAL',
        'home_saves': 'ATAJADAS_LOCAL',
        'home_save_pct': 'PORCENTAJE_ATAJADAS_LOCAL',
        'home_clean_sheets': 'VALLA_INVICTA_LOCAL',
        'home_psxg': 'PSXG_LOCAL',
        'home_pk_att': 'PENALES_ENFRENTADOS_LOCAL',
        'home_pk_saved': 'PENALES_ATAJADOS_LOCAL',
        
        # Tiros local
        'home_sh': 'TIROS_TOTALES_LOCAL',
        'home_sot': 'TIROS_AL_ARCO_LOCAL',
        'home_sh_per90': 'TIROS_POR_90_LOCAL',
        'home_sot_per90': 'TIROS_AL_ARCO_POR_90_LOCAL',
        
        # Pases local
        'home_pass_cmp': 'PASES_COMPLETADOS_LOCAL',
        'home_pass_att': 'PASES_INTENTADOS_LOCAL',
        'home_pct_pass_cmp': 'PORCENTAJE_PASES_LOCAL',
        'home_pass_prog': 'PASES_PROGRESIVOS_LOCAL',
        
        # Defensa local
        'home_tkl': 'TACKLES_LOCAL',
        'home_tkl_won': 'TACKLES_GANADOS_LOCAL',
        'home_int': 'INTERCEPCIONES_LOCAL',
        'home_blocks': 'BLOQUEOS_LOCAL',
        'home_clearances': 'DESPEJES_LOCAL',
        
        # Posesión local
        'home_touches': 'TOQUES_LOCAL',
        'home_take_on_att': 'REGATES_INTENTADOS_LOCAL',
        'home_take_on_suc': 'REGATES_EXITOSOS_LOCAL',
        'home_carries': 'CONDUCCIONES_LOCAL',
        
        # Tarjetas y faltas local
        'home_yellow_cards': 'TARJETAS_AMARILLAS_LOCAL',
        'home_red_cards': 'TARJETAS_ROJAS_LOCAL',
        'home_second_yellow_cards': 'SEGUNDA_AMARILLA_LOCAL',
        'home_fls_com': 'FALTAS_COMETIDAS_LOCAL',
        'home_fls_drawn': 'FALTAS_RECIBIDAS_LOCAL',
        'home_offside': 'FUERA_DE_JUEGO_LOCAL',
        'home_pk_won': 'PENALES_GANADOS_LOCAL',
        'home_pk_conceded': 'PENALES_CONCEDIDOS_LOCAL',
        'home_og': 'AUTOGOLES_LOCAL',
        
        # Estadísticas del equipo visitante (mismo patrón pero con 'away_')
        'away_result': 'RESULTADO_VISITANTE',
        'away_gls': 'GOLES_VISITANTE_DETALLE',
        'away_gls_ag': 'GOLES_EN_CONTRA_VISITANTE',
        'away_xg': 'XG_VISITANTE',
        'away_xga': 'XGA_VISITANTE',
        'away_poss': 'POSESION_VISITANTE',
        'away_captain': 'CAPITAN_VISITANTE',
        'away_formation': 'FORMACION_VISITANTE',
        
        # Portero visitante
        'away_sot_ag': 'TIROS_AL_ARCO_CONTRA_VISITANTE',
        'away_saves': 'ATAJADAS_VISITANTE',
        'away_save_pct': 'PORCENTAJE_ATAJADAS_VISITANTE',
        'away_clean_sheets': 'VALLA_INVICTA_VISITANTE',
        'away_psxg': 'PSXG_VISITANTE',
        'away_pk_att': 'PENALES_ENFRENTADOS_VISITANTE',
        'away_pk_saved': 'PENALES_ATAJADOS_VISITANTE',
        
        # Tiros visitante
        'away_sh': 'TIROS_TOTALES_VISITANTE',
        'away_sot': 'TIROS_AL_ARCO_VISITANTE',
        'away_sh_per90': 'TIROS_POR_90_VISITANTE',
        'away_sot_per90': 'TIROS_AL_ARCO_POR_90_VISITANTE',
        
        # Pases visitante
        'away_pass_cmp': 'PASES_COMPLETADOS_VISITANTE',
        'away_pass_att': 'PASES_INTENTADOS_VISITANTE',
        'away_pct_pass_cmp': 'PORCENTAJE_PASES_VISITANTE',
        'away_pass_prog': 'PASES_PROGRESIVOS_VISITANTE',
        
        # Defensa visitante
        'away_tkl': 'TACKLES_VISITANTE',
        'away_tkl_won': 'TACKLES_GANADOS_VISITANTE',
        'away_int': 'INTERCEPCIONES_VISITANTE',
        'away_blocks': 'BLOQUEOS_VISITANTE',
        'away_clearances': 'DESPEJES_VISITANTE',
        
        # Posesión visitante
        'away_touches': 'TOQUES_VISITANTE',
        'away_take_on_att': 'REGATES_INTENTADOS_VISITANTE',
        'away_take_on_suc': 'REGATES_EXITOSOS_VISITANTE',
        'away_carries': 'CONDUCCIONES_VISITANTE',
        
        # Tarjetas y faltas visitante
        'away_yellow_cards': 'TARJETAS_AMARILLAS_VISITANTE',
        'away_red_cards': 'TARJETAS_ROJAS_VISITANTE',
        'away_second_yellow_cards': 'SEGUNDA_AMARILLA_VISITANTE',
        'away_fls_com': 'FALTAS_COMETIDAS_VISITANTE',
        'away_fls_drawn': 'FALTAS_RECIBIDAS_VISITANTE',
        'away_offside': 'FUERA_DE_JUEGO_VISITANTE',
        'away_pk_won': 'PENALES_GANADOS_VISITANTE',
        'away_pk_conceded': 'PENALES_CONCEDIDOS_VISITANTE',
        'away_og': 'AUTOGOLES_VISITANTE'
    }

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
    
    # Schedule (información general)
    schedule = stats.get('schedule', {})
    extracted.update({
        f'{prefix}_result': schedule.get('result'),
        f'{prefix}_gls': schedule.get('gls'),
        f'{prefix}_gls_ag': schedule.get('gls_ag'),
        f'{prefix}_xg': schedule.get('xg'),
        f'{prefix}_xga': schedule.get('xga'),
        f'{prefix}_poss': schedule.get('poss'),
        f'{prefix}_captain': schedule.get('captain'),
        f'{prefix}_formation': schedule.get('formation')
    })
    
    # Keeper (estadísticas de portero)
    keeper = stats.get('keeper', {})
    extracted.update({
        f'{prefix}_sot_ag': keeper.get('sot_ag'),
        f'{prefix}_saves': keeper.get('saves'),
        f'{prefix}_save_pct': keeper.get('save_pct'),
        f'{prefix}_clean_sheets': keeper.get('clean_sheets'),
        f'{prefix}_psxg': keeper.get('psxg'),
        f'{prefix}_pk_att': keeper.get('pk_att'),
        f'{prefix}_pk_saved': keeper.get('pk_saved')
    })
    
    # Shooting (estadísticas de tiro)
    shooting = stats.get('shooting', {})
    extracted.update({
        f'{prefix}_sh': shooting.get('sh'),
        f'{prefix}_sot': shooting.get('sot'),
        f'{prefix}_sh_per90': shooting.get('sh_per90'),
        f'{prefix}_sot_per90': shooting.get('sot_per90')
    })
    
    # Passing (estadísticas de pase)
    passing = stats.get('passing', {})
    extracted.update({
        f'{prefix}_pass_cmp': passing.get('pass_cmp'),
        f'{prefix}_pass_att': passing.get('pass_att'),
        f'{prefix}_pct_pass_cmp': passing.get('pct_pass_cmp'),
        f'{prefix}_pass_prog': passing.get('pass_prog')
    })
    
    # Defense (estadísticas defensivas)
    defense = stats.get('defense', {})
    extracted.update({
        f'{prefix}_tkl': defense.get('tkl'),
        f'{prefix}_tkl_won': defense.get('tkl_won'),
        f'{prefix}_int': defense.get('int'),
        f'{prefix}_blocks': defense.get('blocks'),
        f'{prefix}_clearances': defense.get('clearances')
    })
    
    # Possession (estadísticas de posesión)
    possession = stats.get('possession', {})
    extracted.update({
        f'{prefix}_touches': possession.get('touches'),
        f'{prefix}_take_on_att': possession.get('take_on_att'),
        f'{prefix}_take_on_suc': possession.get('take_on_suc'),
        f'{prefix}_carries': possession.get('carries')
    })
    
    # Misc (tarjetas, faltas, etc.)
    misc = stats.get('misc', {})
    extracted.update({
        f'{prefix}_yellow_cards': misc.get('yellow_cards'),
        f'{prefix}_red_cards': misc.get('red_cards'),
        f'{prefix}_second_yellow_cards': misc.get('second_yellow_cards'),
        f'{prefix}_fls_com': misc.get('fls_com'),
        f'{prefix}_fls_drawn': misc.get('fls_drawn'),
        f'{prefix}_offside': misc.get('offside'),
        f'{prefix}_pk_won': misc.get('pk_won'),
        f'{prefix}_pk_conceded': misc.get('pk_conceded'),
        f'{prefix}_og': misc.get('og')
    })
    
    return extracted

def process_detailed_matches(matches_data, league_info, api_key):
    """Procesa los partidos con estadísticas detalladas"""
    if not matches_data or 'data' not in matches_data:
        print("❌ No hay datos de partidos para procesar")
        return []
    
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
            'match_id': match.get('match_id', ''),
            'league_id': league_info['league_id'],
            'league_name': league_info['competition_name'],
            'season_id': '2025',
            'date': match.get('date', ''),
            'time': match.get('time', ''),
            'round': match.get('round', ''),
            'wk': match.get('wk', ''),
            'home_team': match.get('home', ''),
            'home_team_id': match.get('home_team_id', ''),
            'away_team': match.get('away', ''),
            'away_team_id': match.get('away_team_id', ''),
            'home_score': match.get('home_team_score', None),
            'away_score': match.get('away_team_score', None),
            'venue': match.get('venue', ''),
            'attendance': match.get('attendance', ''),
            'referee': match.get('referee', '')
        }
        
        # Obtener estadísticas del equipo local
        home_team_id = match.get('home_team_id')
        away_team_id = match.get('away_team_id')
        match_id = match.get('match_id')
        
        if home_team_id in teams_stats and match_id:
            home_stats = find_team_match_stats(home_team_id, match_id, teams_stats[home_team_id])
            if home_stats:
                home_extracted = extract_team_stats(home_stats, 'home')
                match_info.update(home_extracted)
                print(f"  ✅ Estadísticas del equipo local agregadas")
            else:
                print(f"  ❌ No se encontraron estadísticas del equipo local")
        
        # Obtener estadísticas del equipo visitante
        if away_team_id in teams_stats and match_id:
            away_stats = find_team_match_stats(away_team_id, match_id, teams_stats[away_team_id])
            if away_stats:
                away_extracted = extract_team_stats(away_stats, 'away')
                match_info.update(away_extracted)
                print(f"  ✅ Estadísticas del equipo visitante agregadas")
            else:
                print(f"  ❌ No se encontraron estadísticas del equipo visitante")
        
        processed_matches.append(match_info)
    
    return processed_matches

def export_detailed_matches_to_csv(matches_data, league_info):
    """Exporta los datos detallados de partidos a CSV con nombres en español"""
    if not matches_data:
        print("❌ No hay datos de partidos para exportar")
        return None
    
    output_dir = "chilean_matches_data"
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
    
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"{output_dir}/chilean_matches_detailed_2025_{timestamp}.csv"
    
    # Obtener mapeo de campos
    field_mapping = create_field_mapping()
    
    try:
        # Determinar todos los campos disponibles
        all_fields = set()
        for match in matches_data:
            all_fields.update(match.keys())
        
        # Crear fieldnames con nombres en español
        fieldnames_spanish = []
        for field in sorted(all_fields):
            spanish_name = field_mapping.get(field, field.upper())
            fieldnames_spanish.append(spanish_name)
        
        # Crear datos con nombres en español
        spanish_data = []
        for match in matches_data:
            spanish_match = {}
            for field, value in match.items():
                spanish_name = field_mapping.get(field, field.upper())
                spanish_match[spanish_name] = value
            spanish_data.append(spanish_match)
        
        with open(filename, 'w', newline='', encoding='utf-8') as csvfile:
            writer = csv.DictWriter(csvfile, fieldnames=fieldnames_spanish)
            writer.writeheader()
            writer.writerows(spanish_data)
        
        print(f"\n✅ Partidos detallados exportados a: {filename}")
        print(f"   Total de partidos: {len(matches_data)}")
        print(f"   Liga: {league_info['competition_name']}")
        print(f"   Temporada: 2025")
        print(f"   Campos incluidos: {len(fieldnames_spanish)}")
        
        return filename
        
    except Exception as e:
        print(f"❌ Error al exportar: {e}")
        return None

def main():
    # Configuración
    api_key = "AzumZVPR1MlXaroDdCzrE4OT0ezDLMlLDjVCi0Txb0k"
    
    print(f"{'='*60}")
    print("OBTENCIÓN DETALLADA DE PARTIDOS DE PRIMERA DIVISIÓN CHILENA 2025")
    print(f"{'='*60}")
    
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
        matches_data = get_league_matches(first_division['league_id'], "2025", api_key)
        
        if not matches_data:
            print("❌ No se pudieron obtener los partidos")
            print("Esto puede ser porque:")
            print("  - La temporada 2025 aún no está disponible en la API")
            print("  - El ID de liga no es correcto")
            print("  - La API no tiene datos de partidos para esta liga")
            return
        
        time.sleep(7)
        
        # 3. Procesar datos detallados de partidos
        detailed_matches = process_detailed_matches(matches_data, first_division, api_key)
        
        if not detailed_matches:
            print("❌ No se pudieron procesar los partidos detallados")
            return
        
        # 4. Exportar a CSV con nombres en español
        filename = export_detailed_matches_to_csv(detailed_matches, first_division)
        
        if filename:
            print(f"\n{'='*60}")
            print("✅ PROCESO COMPLETADO EXITOSAMENTE")
            print(f"{'='*60}")
            print(f"Archivo generado: {filename}")
            print(f"Total de partidos obtenidos: {len(detailed_matches)}")
            
            # Mostrar algunos estadísticos básicos
            played_matches = [m for m in detailed_matches if m['home_score'] is not None]
            pending_matches = [m for m in detailed_matches if m['home_score'] is None]
            
            print(f"Partidos jugados: {len(played_matches)}")
            print(f"Partidos pendientes: {len(pending_matches)}")
            
            # Mostrar campos incluidos
            sample_match = detailed_matches[0] if detailed_matches else {}
            field_mapping = create_field_mapping()
            
            total_basic_fields = 17  # campos básicos del partido
            total_stats_fields = len([k for k in sample_match.keys() if k.startswith(('home_', 'away_'))]) 
            
            print(f"\nTipos de datos incluidos:")
            print(f"  📊 Campos básicos del partido: {total_basic_fields}")
            print(f"  ⚽ Estadísticas detalladas: {total_stats_fields}")
            print(f"  🏷️ Todos los campos han sido traducidos al español")
            
        else:
            print("❌ Error al exportar los datos")
        
    except KeyboardInterrupt:
        print("\n⚠️ Proceso interrumpido por el usuario")
    except Exception as e:
        print(f"\n❌ Error inesperado: {e}")

if __name__ == "__main__":
    main()