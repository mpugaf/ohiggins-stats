import requests
import json
import csv
import time
import os
from datetime import datetime, date

def get_team_data(team_id, api_key):
    """Obtiene los datos del equipo a través de la API"""
    base_url = "https://fbrapi.com"
    url = f"{base_url}/teams"
    params = {"team_id": team_id}
    headers = {"X-API-Key": api_key}
    print(f"Consultando información del equipo: {team_id}")
    
    try:
        response = requests.get(url, params=params, headers=headers)
        print(f"Código de respuesta: {response.status_code}")
        
        if response.status_code == 200:
            return response.json()
        else:
            print(f"Error: {response.status_code}")
            print(response.text)
            return None
    except Exception as e:
        print(f"Error en la solicitud: {e}")
        return None

def safe_int(value, default=0):
    """Convierte un valor a entero de forma segura"""
    if value is None:
        return default
    try:
        return int(value)
    except (ValueError, TypeError):
        return default

def is_match_played(match_date_str):
    """Verifica si un partido ya fue jugado (fecha anterior a hoy)"""
    if not match_date_str:
        return False
    
    try:
        match_date = datetime.strptime(match_date_str, '%Y-%m-%d').date()
        today = date.today()
        return match_date < today
    except (ValueError, TypeError):
        return False

def get_match_players_stats(match_id, api_key):
    """Obtiene estadísticas de jugadores de un partido específico"""
    base_url = "https://fbrapi.com"
    url = f"{base_url}/all-players-match-stats"
    params = {"match_id": match_id}
    headers = {"X-API-Key": api_key}
    
    try:
        response = requests.get(url, params=params, headers=headers)
        if response.status_code == 200:
            return response.json()
        else:
            print(f"Error obteniendo estadísticas del partido {match_id}: {response.status_code}")
            return None
    except Exception as e:
        print(f"Error en solicitud de estadísticas del partido {match_id}: {e}")
        return None

def extract_goal_scorers(match_players_data, team_name):
    """Extrae los goleadores del equipo específico"""
    if not match_players_data or 'data' not in match_players_data:
        return []
    
    goal_scorers = []
    
    for team_data in match_players_data['data']:
        # Solo procesar datos del equipo específico
        if team_data['team_name'] != team_name:
            continue
            
        for player in team_data['players']:
            if 'stats' in player and 'summary' in player['stats']:
                summary = player['stats']['summary']
                goals = safe_int(summary.get('gls'), 0)
                
                if goals > 0:
                    goal_scorers.append({
                        'player_name': player['meta_data']['player_name'],
                        'player_id': player['meta_data']['player_id'],
                        'goals': goals,
                        'penalties': safe_int(summary.get('pk_made'), 0)
                    })
    
    return goal_scorers

def safe_str(value, default=''):
    """Convierte un valor a string de forma segura"""
    if value is None:
        return default
    return str(value)

def process_matches_data(team_data, team_id, api_key):
    """Procesa los datos de partidos del equipo"""
    if not team_data or 'team_schedule' not in team_data:
        print("No hay datos de calendario disponibles")
        return []
    
    matches_list = []
    schedule_data = team_data['team_schedule']['data']
    
    # Filtrar solo partidos ya jugados
    played_matches = []
    for match in schedule_data:
        if is_match_played(match.get('date')):
            played_matches.append(match)
    
    print(f"Encontrados {len(played_matches)} partidos ya jugados de {len(schedule_data)} totales")
    
    if not played_matches:
        print("No hay partidos jugados para procesar")
        return []
    
    # Obtener nombre del equipo para filtrar goleadores
    team_name = None
    if 'team_roster' in team_data and team_data['team_roster'].get('data'):
        # El nombre del equipo no viene directo, pero podemos inferirlo del primer partido
        for match in played_matches:
            if match.get('opponent'):
                # Por ahora usaremos None y procesaremos todos los goleadores
                break
    
    for i, match in enumerate(played_matches):
        print(f"Procesando partido jugado {i+1}/{len(played_matches)}: {match.get('date', 'N/A')} vs {match.get('opponent', 'N/A')}")
        
        # Convertir valores de forma segura para evitar errores
        gf = safe_int(match.get('gf'), 0)
        ga = safe_int(match.get('ga'), 0)
        
        # Obtener goleadores si hay goles
        goal_scorers = []
        if gf > 0 and match.get('match_id'):
            print(f"  Obteniendo goleadores del partido...")
            match_players_data = get_match_players_stats(match.get('match_id'), api_key)
            if match_players_data:
                # Como no tenemos el nombre exacto del equipo, buscaremos en ambos equipos
                # y filtraremos después por el que marcó los goles
                all_scorers = []
                for team_data_match in match_players_data.get('data', []):
                    team_scorers = extract_goal_scorers(match_players_data, team_data_match['team_name'])
                    if team_scorers:
                        all_scorers.extend([(team_data_match['team_name'], scorer) for scorer in team_scorers])
                
                # Tomar los goleadores del equipo con más goles (asumiendo que es nuestro equipo si gf > ga)
                if all_scorers:
                    goal_scorers = [scorer[1] for scorer in all_scorers]
            
            # Esperar para respetar límites de API
            time.sleep(7)
        
        # Crear string de goleadores
        scorers_str = ""
        if goal_scorers:
            scorer_names = []
            for scorer in goal_scorers:
                penalty_text = f"({scorer['penalties']}p)" if scorer['penalties'] > 0 else ""
                scorer_names.append(f"{scorer['player_name']} {scorer['goals']}{penalty_text}")
            scorers_str = ", ".join(scorer_names)
        
        # Datos básicos del partido
        match_data = {
            'MATCH_ID_API': safe_str(match.get('match_id')),
            'FECHA': safe_str(match.get('date')),
            'HORA': safe_str(match.get('time')),
            'RIVAL': safe_str(match.get('opponent')),
            'RIVAL_ID_API': safe_str(match.get('opponent_id')),
            'LOCAL_VISITANTE': safe_str(match.get('home_away')),
            'RESULTADO': safe_str(match.get('result')),
            'GOLES_FAVOR': gf,
            'GOLES_CONTRA': ga,
            'DIFERENCIA_GOLES': gf - ga,
            'GOLEADORES': scorers_str,
            'LIGA': safe_str(match.get('league_name')),
            'LIGA_ID_API': safe_int(match.get('league_id')),
            'RONDA': safe_str(match.get('round')),
            'ASISTENCIA': safe_str(match.get('attendance')),
            'CAPITAN': safe_str(match.get('captain')),
            'FORMACION': safe_str(match.get('formation')),
            'ARBITRO': safe_str(match.get('referee')),
            'EQUIPO_ID_API': team_id
        }
        
        matches_list.append(match_data)
    
    return matches_list

def create_matches_summary(matches_data):
    """Crea un resumen de los partidos"""
    if not matches_data:
        return {}
    
    summary = {
        'total_partidos': len(matches_data),
        'partidos_local': 0,
        'partidos_visitante': 0,
        'victorias': 0,
        'empates': 0,
        'derrotas': 0,
        'goles_favor_total': 0,
        'goles_contra_total': 0,
        'diferencia_goles_total': 0,
        'ligas_participadas': set(),
        'rivales_enfrentados': set(),
        'partidos_por_resultado': {'W': 0, 'D': 0, 'L': 0, '': 0}
    }
    
    for match in matches_data:
        # Contar local/visitante
        if match['LOCAL_VISITANTE'] == 'Home':
            summary['partidos_local'] += 1
        elif match['LOCAL_VISITANTE'] == 'Away':
            summary['partidos_visitante'] += 1
        
        # Contar resultados
        resultado = match['RESULTADO']
        if resultado == 'W':
            summary['victorias'] += 1
        elif resultado == 'D':
            summary['empates'] += 1
        elif resultado == 'L':
            summary['derrotas'] += 1
        
        summary['partidos_por_resultado'][resultado] += 1
        
        # Sumar goles
        summary['goles_favor_total'] += match['GOLES_FAVOR']
        summary['goles_contra_total'] += match['GOLES_CONTRA']
        summary['diferencia_goles_total'] += match['DIFERENCIA_GOLES']
        
        # Agregar ligas y rivales
        if match['LIGA']:
            summary['ligas_participadas'].add(match['LIGA'])
        if match['RIVAL']:
            summary['rivales_enfrentados'].add(match['RIVAL'])
    
    # Convertir sets a listas para serialización
    summary['ligas_participadas'] = list(summary['ligas_participadas'])
    summary['rivales_enfrentados'] = list(summary['rivales_enfrentados'])
    
    return summary

def export_matches_to_csv(matches_data, team_id):
    """Exporta los datos de partidos a archivos CSV"""
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    output_dir = "team_matches_data"
    
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
    
    # Exportar datos de partidos
    matches_filename = f"{output_dir}/partidos_equipo_{team_id}_{timestamp}.csv"
    
    if matches_data:
        # Obtener todas las claves únicas
        all_keys = set()
        for match in matches_data:
            all_keys.update(match.keys())
        
        fieldnames = sorted(list(all_keys))
        
        with open(matches_filename, 'w', newline='', encoding='utf-8') as csvfile:
            writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(matches_data)
        
        print(f"Partidos exportados a: {matches_filename}")
    
    return matches_filename

def display_matches_summary(matches_data, summary, team_id):
    """Muestra un resumen de los partidos en consola"""
    print(f"\n{'='*70}")
    print(f"RESUMEN DE PARTIDOS DEL EQUIPO {team_id}")
    print(f"{'='*70}")
    
    print(f"\nESTADISTICAS GENERALES:")
    print(f"Total de partidos: {summary['total_partidos']}")
    print(f"Partidos en casa: {summary['partidos_local']}")
    print(f"Partidos de visitante: {summary['partidos_visitante']}")
    
    print(f"\nRESULTADOS:")
    print(f"Victorias: {summary['victorias']}")
    print(f"Empates: {summary['empates']}")
    print(f"Derrotas: {summary['derrotas']}")
    
    if summary['total_partidos'] > 0:
        porcentaje_victorias = (summary['victorias'] / summary['total_partidos']) * 100
        print(f"Porcentaje de victorias: {porcentaje_victorias:.1f}%")
    
    print(f"\nGOLES:")
    print(f"Goles a favor: {summary['goles_favor_total']}")
    print(f"Goles en contra: {summary['goles_contra_total']}")
    print(f"Diferencia de goles: {summary['diferencia_goles_total']}")
    
    if summary['total_partidos'] > 0:
        promedio_gf = summary['goles_favor_total'] / summary['total_partidos']
        promedio_gc = summary['goles_contra_total'] / summary['total_partidos']
        print(f"Promedio goles a favor por partido: {promedio_gf:.2f}")
        print(f"Promedio goles en contra por partido: {promedio_gc:.2f}")
    
    print(f"\nCOMPETICIONES:")
    print(f"Ligas participadas: {len(summary['ligas_participadas'])}")
    for liga in summary['ligas_participadas']:
        print(f"  - {liga}")
    
    print(f"\nRIVALES:")
    print(f"Total de rivales enfrentados: {len(summary['rivales_enfrentados'])}")
    
    # Mostrar últimos partidos
    print(f"\nULTIMOS PARTIDOS JUGADOS:")
    print(f"{'FECHA':<12} {'RIVAL':<20} {'L/V':<6} {'RES':<4} {'GOLES':<8} {'GOLEADORES':<30} {'LIGA':<15}")
    print("-" * 100)
    
    # Mostrar últimos 10 partidos jugados
    recent_matches = matches_data[-10:] if len(matches_data) > 10 else matches_data
    
    for match in reversed(recent_matches):  # Más recientes primero
        fecha = match['FECHA'][:10] if match['FECHA'] else 'N/A'
        rival = match['RIVAL'][:19] if match['RIVAL'] else 'N/A'
        local_visit = 'Local' if match['LOCAL_VISITANTE'] == 'Home' else 'Visit'
        resultado = match['RESULTADO'] if match['RESULTADO'] else 'N/A'
        goles = f"{match['GOLES_FAVOR']}-{match['GOLES_CONTRA']}"
        goleadores = match['GOLEADORES'][:29] if match['GOLEADORES'] else 'Sin goles'
        liga = match['LIGA'][:14] if match['LIGA'] else 'N/A'
        
        print(f"{fecha:<12} {rival:<20} {local_visit:<6} {resultado:<4} {goles:<8} {goleadores:<30} {liga:<15}")
    
    print(f"\n{'='*70}")

def main():
    # Configuración
    api_key = "AzumZVPR1MlXaroDdCzrE4OT0ezDLMlLDjVCi0Txb0k"
    team_id = "5049d576"  # ID del equipo específico
    
    print(f"Iniciando extracción de partidos del equipo {team_id}")
    print("=" * 60)
    
    try:
        # Obtener datos del equipo
        print("1. Obteniendo datos del equipo...")
        team_data = get_team_data(team_id, api_key)
        
        if not team_data:
            print("Error: No se pudieron obtener datos del equipo")
            return
        
        print("Datos del equipo obtenidos correctamente")
        
        # Verificar si hay datos de calendario
        if 'team_schedule' not in team_data:
            print("Error: No hay datos de calendario en la respuesta")
            return
        
        if not team_data['team_schedule'].get('data'):
            print("Error: No hay partidos en el calendario")
            return
        
        # Procesar datos de partidos
        print(f"\n2. Procesando datos de partidos...")
        matches_data = process_matches_data(team_data, team_id, api_key)
        
        if not matches_data:
            print("Error: No se pudieron procesar los datos de partidos")
            return
        
        print(f"{len(matches_data)} partidos procesados correctamente")
        
        # Crear resumen
        print("\n3. Creando resumen de partidos...")
        summary = create_matches_summary(matches_data)
        
        # Mostrar resumen en consola
        display_matches_summary(matches_data, summary, team_id)
        
        # Exportar a CSV
        print("\n4. Exportando datos a archivos CSV...")
        csv_file = export_matches_to_csv(matches_data, team_id)
        
        print("Datos exportados correctamente")
        print(f"\nProceso completado exitosamente!")
        print(f"Revisa la carpeta 'team_matches_data' para los archivos generados")
        
    except KeyboardInterrupt:
        print("\nProceso interrumpido por el usuario")
    except Exception as e:
        print(f"\nError inesperado: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()