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

def find_chilean_leagues(api_key):
    """Encuentra las ligas chilenas disponibles"""
    print(f"{'='*60}")
    print("BUSCANDO LIGAS CHILENAS")
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
    
    return chile_info.get('country_code'), leagues_data

def display_chilean_leagues(leagues_data):
    """Muestra las ligas chilenas disponibles"""
    print(f"\n{'='*60}")
    print("LIGAS CHILENAS DISPONIBLES")
    print(f"{'='*60}")
    
    for league_category in leagues_data.get('data', []):
        league_type = league_category.get('league_type', 'N/A')
        leagues = league_category.get('leagues', [])
        
        print(f"\n--- {league_type.upper().replace('_', ' ')} ---")
        
        for league in leagues:
            print(f"  ID: {league.get('league_id')}")
            print(f"  Nombre: {league.get('competition_name')}")
            print(f"  Género: {league.get('gender', 'N/A')}")
            print(f"  Primera temporada: {league.get('first_season', 'N/A')}")
            print(f"  Última temporada: {league.get('last_season', 'N/A')}")
            if league.get('tier'):
                print(f"  División: {league.get('tier')}")
            print(f"  {'-'*40}")

def extract_teams_from_stats(stats_data, league_id, season_id, league_name):
    """Extrae información de equipos desde estadísticas de temporada"""
    teams = []
    
    if not stats_data or 'data' not in stats_data:
        return teams
    
    print(f"\n{'='*60}")
    print(f"EQUIPOS DE {league_name}")
    print(f"Liga ID: {league_id} | Temporada: {season_id}")
    print(f"{'='*60}")
    
    print(f"{'#':<3} {'EQUIPO':<25} {'ID':<12} {'PARTIDOS':<8} {'GOLES':<6}")
    print("-" * 60)
    
    for i, team_data in enumerate(stats_data['data'], 1):
        meta_data = team_data.get('meta_data', {})
        stats = team_data.get('stats', {}).get('stats', {})
        
        team_info = {
            'team_id': meta_data.get('team_id', ''),
            'team_name': meta_data.get('team_name', ''),
            'league_id': league_id,
            'league_name': league_name,
            'season_id': season_id,
            
            # Estadísticas básicas
            'roster_size': stats.get('roster_size', 0),
            'matches_played': stats.get('matches_played', 0),
            'total_goals': stats.get('ttl_gls', 0),
            'total_assists': stats.get('ttl_ast', 0),
            'total_non_pen_goals': stats.get('ttl_non_pen_gls', 0),
            'total_xg': stats.get('ttl_xg', 0),
            'total_yellow_cards': stats.get('ttl_yellow_cards', 0),
            'total_red_cards': stats.get('ttl_red_cards', 0),
            'avg_goals': stats.get('avg_gls', 0),
            'avg_assists': stats.get('avg_ast', 0),
            
            # Estadísticas defensivas
            'goals_against': team_data.get('stats', {}).get('keepers', {}).get('ttl_gls_ag', 0),
            'avg_goals_against': team_data.get('stats', {}).get('keepers', {}).get('avg_gls_ag', 0),
            'clean_sheets': team_data.get('stats', {}).get('keepers', {}).get('clean_sheets', 0),
            'save_percentage': team_data.get('stats', {}).get('keepers', {}).get('save_pct', 0),
            
            # Estadísticas de tiros
            'total_shots': team_data.get('stats', {}).get('shooting', {}).get('ttl_sh', 0),
            'shots_on_target': team_data.get('stats', {}).get('shooting', {}).get('ttl_sot', 0),
            'shot_accuracy': team_data.get('stats', {}).get('shooting', {}).get('pct_sot', 0),
            
            # Estadísticas de pases
            'total_passes_completed': team_data.get('stats', {}).get('passing', {}).get('ttl_pass_cmp', 0),
            'pass_completion_rate': team_data.get('stats', {}).get('passing', {}).get('pct_pass_cmp', 0),
            
            # Edad promedio del plantel
            'avg_age': team_data.get('stats', {}).get('playingtime', {}).get('avg_age', 0)
        }
        
        teams.append(team_info)
        
        # Mostrar en consola
        name = team_info['team_name'][:24]
        team_id = team_info['team_id'][:11]
        matches = str(team_info['matches_played'])
        goals = str(team_info['total_goals'])
        
        print(f"{i:<3} {name:<25} {team_id:<12} {matches:<8} {goals:<6}")
    
    return teams

def export_teams_to_csv(teams_data, league_info):
    """Exporta los datos de equipos a CSV"""
    if not teams_data:
        return None
    
    output_dir = "chilean_teams_data"
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
    
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"{output_dir}/chilean_teams_{league_info['league_id']}_{timestamp}.csv"
    
    try:
        fieldnames = [
            'team_id', 'team_name', 'league_id', 'league_name', 'season_id',
            'roster_size', 'matches_played', 'total_goals', 'total_assists',
            'total_non_pen_goals', 'total_xg', 'total_yellow_cards', 'total_red_cards',
            'avg_goals', 'avg_assists', 'goals_against', 'avg_goals_against',
            'clean_sheets', 'save_percentage', 'total_shots', 'shots_on_target',
            'shot_accuracy', 'total_passes_completed', 'pass_completion_rate', 'avg_age'
        ]
        
        with open(filename, 'w', newline='', encoding='utf-8') as csvfile:
            writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(teams_data)
        
        print(f"\n✅ Equipos exportados a: {filename}")
        print(f"   Total de equipos: {len(teams_data)}")
        print(f"   Liga: {league_info['league_name']}")
        
        return filename
        
    except Exception as e:
        print(f"❌ Error al exportar: {e}")
        return None

def export_league_info_to_csv(leagues_data, country_code):
    """Exporta información de todas las ligas chilenas"""
    if not leagues_data:
        return None
    
    output_dir = "chilean_teams_data"
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
    
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"{output_dir}/chilean_leagues_info_{timestamp}.csv"
    
    all_leagues = []
    
    for league_category in leagues_data.get('data', []):
        league_type = league_category.get('league_type', 'N/A')
        leagues = league_category.get('leagues', [])
        
        for league in leagues:
            league_info = {
                'country_code': country_code,
                'league_type': league_type,
                'league_id': league.get('league_id'),
                'competition_name': league.get('competition_name'),
                'gender': league.get('gender', 'N/A'),
                'first_season': league.get('first_season', 'N/A'),
                'last_season': league.get('last_season', 'N/A'),
                'tier': league.get('tier', 'N/A')
            }
            all_leagues.append(league_info)
    
    try:
        fieldnames = ['country_code', 'league_type', 'league_id', 'competition_name', 
                     'gender', 'first_season', 'last_season', 'tier']
        
        with open(filename, 'w', newline='', encoding='utf-8') as csvfile:
            writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(all_leagues)
        
        print(f"✅ Información de ligas exportada a: {filename}")
        return filename
        
    except Exception as e:
        print(f"❌ Error al exportar información de ligas: {e}")
        return None

def get_all_chilean_teams(leagues_data, api_key):
    """Obtiene equipos de todas las ligas chilenas masculinas"""
    print(f"\n{'='*60}")
    print("OBTENIENDO EQUIPOS DE LIGAS CHILENAS")
    print(f"{'='*60}")
    
    success_count = 0
    total_teams = 0
    
    for league_category in leagues_data.get('data', []):
        if league_category.get('league_type') == 'domestic_leagues':
            leagues = league_category.get('leagues', [])
            
            for league in leagues:
                if league.get('gender') == 'M':  # Solo ligas masculinas
                    league_id = league.get('league_id')
                    league_name = league.get('competition_name')
                    latest_season = league.get('last_season')
                    
                    print(f"\n🔍 Procesando: {league_name} (ID: {league_id})")
                    
                    # Obtener estadísticas de equipos
                    stats_data = get_team_season_stats(league_id, latest_season, api_key)
                    
                    if stats_data:
                        teams = extract_teams_from_stats(stats_data, league_id, latest_season, league_name)
                        
                        if teams:
                            league_info = {
                                'league_id': league_id,
                                'league_name': league_name,
                                'season_id': latest_season
                            }
                            
                            filename = export_teams_to_csv(teams, league_info)
                            if filename:
                                success_count += 1
                                total_teams += len(teams)
                                print(f"✅ {len(teams)} equipos procesados exitosamente")
                        else:
                            print(f"❌ No se encontraron equipos en {league_name}")
                    else:
                        print(f"❌ No hay datos disponibles para {league_name}")
                    
                    time.sleep(7)  # Respetar límite de frecuencia
    
    print(f"\n{'='*60}")
    print("RESUMEN FINAL")
    print(f"{'='*60}")
    print(f"Ligas procesadas exitosamente: {success_count}")
    print(f"Total de equipos encontrados: {total_teams}")

def main():
    # Configuración
    api_key = "AzumZVPR1MlXaroDdCzrE4OT0ezDLMlLDjVCi0Txb0k"
    
    print(f"{'='*60}")
    print("OBTENCIÓN DE EQUIPOS CHILENOS")
    print(f"{'='*60}")
    
    try:
        # 1. Encontrar ligas chilenas
        result = find_chilean_leagues(api_key)
        
        if not result:
            return
        
        country_code, leagues_data = result
        
        # 2. Mostrar ligas disponibles
        display_chilean_leagues(leagues_data)
        
        # 3. Exportar información de ligas
        export_league_info_to_csv(leagues_data, country_code)
        
        # 4. Obtener equipos de todas las ligas
        get_all_chilean_teams(leagues_data, api_key)
        
        print(f"\n{'='*60}")
        print("✅ PROCESO COMPLETADO")
        print(f"{'='*60}")
        print("Archivos generados en: chilean_teams_data/")
        
    except KeyboardInterrupt:
        print("\n⚠️ Proceso interrumpido por el usuario")
    except Exception as e:
        print(f"\n❌ Error inesperado: {e}")

if __name__ == "__main__":
    main()