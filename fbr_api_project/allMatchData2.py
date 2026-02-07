import json
import time
import pandas as pd
from datetime import datetime
import os

import requests

def print_match_summary(self, data):
        """Imprime un resumen del partido"""
        match_info = data['match_info']
        events = data['match_events']
        team_performance = data['team_performance']
        
        print(f"\n{'='*60}")
        print(f"RESUMEN DEL PARTIDO {data['match_id']}")
        print(f"{'='*60}")
        
        if match_info:
            print(f"\n🏠 LOCAL: {match_info['home_team']} ({match_info['home_team_status']})")
            print(f"✈️  VISITANTE: {match_info['away_team']} ({match_info['away_team_status']})")
            print(f"\n📊 RESULTADO: {match_info['home_team']} {match_info['home_goals']} - {match_info['away_goals']} {match_info['away_team']}")
            print(f"🏆 {match_info['match_result']}")
        
        # Resumen de goles
        if events['goals']:
            print(f"\n--- ⚽ GOLES ({len(events['goals'])}) ---")
            for goal in events['goals']:
                penalty_text = f" ({goal['penalty_goals']} penales)" if goal['penalty_goals'] > 0 else ""
                team_status = "🏠" if goal['home_away'] == 'home' else "✈️"
                print(f"{team_status} {goal['team']}: {goal['player']} #{goal['player_number']} - {goal['goals']} goles{penalty_text}")
        
        # Resumen de asistencias
        if events['assists']:
            print(f"\n--- 🎯 ASISTENCIAS ({len(events['assists'])}) ---")
            for assist in events['assists']:
                team_status = "🏠" if assist['home_away'] == 'home' else "✈️"
                print(f"{team_status} {assist['team']}: {assist['player']} #{assist['player_number']} - {assist['assists']} asistencias")
        
        # Resumen de tarjetas
        if events['yellow_cards']:
            print(f"\n--- 🟨 TARJETAS AMARILLAS ({len(events['yellow_cards'])}) ---")
            for card in events['yellow_cards']:
                team_status = "🏠" if card['home_away'] == 'home' else "✈️"
                print(f"{team_status} {card['team']}: {card['player']} #{card['player_number']}")
        
        if events['red_cards']:
            print(f"\n--- 🟥 TARJETAS ROJAS ({len(events['red_cards'])}) ---")
            for card in events['red_cards']:
                team_status = "🏠" if card['home_away'] == 'home' else "✈️"
                print(f"{team_status} {card['team']}: {card['player']} #{card['player_number']}")
        
        # Estadísticas por equipo
        if team_performance:
            print(f"\n--- 📈 ESTADÍSTICAS POR EQUIPO ---")
            for team_type, stats in team_performance.items():
                team_status = "🏠" if team_type == 'home' else "✈️"
                print(f"\n{team_status} {stats['team_name']} ({team_type.upper()}):")
                print(f"  👥 Titulares: {stats['starters']}")
                print(f"  🔄 Sustitutos que jugaron: {stats['substitutes']}")
                print(f"  ⚽ Goles: {stats['goals']}")
                print(f"  🎯 Asistencias: {stats['assists']}")
                print(f"  🎯 Tiros: {stats['shots']} (a puerta: {stats['shots_on_target']})")
                print(f"  ⚽ Pases: {stats['passes_completed']}/{stats['passes_attempted']} ({stats['pass_accuracy']}%)")
                print(f"  🟨🟥 Tarjetas: {stats['yellow_cards']} amarillas, {stats['red_cards']} rojas")
                print(f"  ⚡ Faltas: {stats['fouls_committed']} cometidas, {stats['fouls_drawn']} recibidas")
                print(f"  🛡️ Defensivas: {stats['tackles']} entradas, {stats['interceptions']} intercepciones")
        
        # Información del jugador específico si está disponible
        if 'specific_player_data' in data and data['specific_player_data']:
            self.print_specific_player_summary(data['specific_player_data'])

def print_specific_player_summary(self, player_data):
    """Imprime un resumen del jugador específico"""
    print(f"\n{'='*60}")
    print(f"📋 DATOS COMPLETOS DEL JUGADOR ESPECÍFICO")
    print(f"{'='*60}")
    
    # Información básica
    if player_data.get('player_info'):
        info = player_data['player_info']
        print(f"\n👤 INFORMACIÓN BÁSICA:")
        print(f"  Nombre: {info.get('full_name', 'N/A')}")
        print(f"  Posiciones: {', '.join(info.get('positions', ['N/A']))}")
        print(f"  Nacionalidad: {info.get('nationality', 'N/A')}")
        print(f"  Fecha de nacimiento: {info.get('date_of_birth', 'N/A')}")
        print(f"  Altura: {info.get('height', 'N/A')} cm")
        print(f"  Peso: {info.get('weight', 'N/A')} kg")
        print(f"  Pie dominante: {info.get('footed', 'N/A')}")
        if info.get('wages'):
            print(f"  Salario: {info.get('wages', 'N/A')}")
    
    # Rendimiento en este partido
    if player_data.get('match_performance'):
        perf = player_data['match_performance']
        print(f"\n⚽ RENDIMIENTO EN ESTE PARTIDO:")
        print(f"  Equipo: {perf.get('team', 'N/A')}")
        print(f"  Posición jugada: {perf.get('summary_positions', 'N/A')}")
        print(f"  Minutos jugados: {perf.get('summary_min', 'N/A')}")
        print(f"  Titular: {'Sí' if perf.get('summary_start') == 'Y' else 'No'}")
        print(f"  Goles: {perf.get('summary_gls', 0)}")
        print(f"  Asistencias: {perf.get('summary_ast', 0)}")
        print(f"  Tiros: {perf.get('summary_sh', 0)} (a puerta: {perf.get('summary_sot', 0)})")
        print(f"  Pases: {perf.get('passing_pass_cmp', 0)}/{perf.get('passing_pass_att', 0)}")
        if perf.get('passing_pass_att', 0) > 0:
            accuracy = round((perf.get('passing_pass_cmp', 0) / perf.get('passing_pass_att', 0)) * 100, 1)
            print(f"  Precisión de pases: {accuracy}%")
        print(f"  Tarjetas: {perf.get('summary_yellow_cards', 0)} amarillas, {perf.get('summary_red_cards', 0)} rojas")
        print(f"  Entradas: {perf.get('defense_tkl', 0)}")
        print(f"  Intercepciones: {perf.get('defense_int', 0)}")
        print(f"  Toques: {perf.get('possession_touches', 0)}")
    
    # Estadísticas de temporada
    if player_data.get('season_stats') and player_data['season_stats'].get('players'):
        season_data = player_data['season_stats']['players'][0] if player_data['season_stats']['players'] else {}
        if season_data:
            print(f"\n📊 ESTADÍSTICAS DE TEMPORADA:")
            stats = season_data.get('stats', {}).get('stats', {})
            print(f"  Partidos jugados: {stats.get('matches_played', 'N/A')}")
            print(f"  Partidos como titular: {stats.get('starts', 'N/A')}")
            print(f"  Minutos totales: {stats.get('min', 'N/A')}")
            print(f"  Goles totales: {stats.get('gls', 'N/A')}")
            print(f"  Asistencias totales: {stats.get('ast', 'N/A')}")
            print(f"  Goles por 90 min: {stats.get('per90_gls', 'N/A')}")
            print(f"  Asistencias por 90 min: {stats.get('per90_ast', 'N/A')}")
    
    # Historial reciente de partidos
    if player_data.get('match_history') and player_data['match_history'].get('data'):
        matches = player_data['match_history']['data']
        print(f"\n📅 HISTORIAL RECIENTE (últimos {min(5, len(matches))} partidos):")
        for i, match in enumerate(matches[:5]):
            meta = match.get('meta_data', {})
            stats = match.get('stats', {}).get('summary', {})
            print(f"  {i+1}. {meta.get('date', 'N/A')} vs {meta.get('opponent', 'N/A')}")
            print(f"     Minutos: {stats.get('min', 'N/A')}, Goles: {stats.get('gls', 0)}, Asistencias: {stats.get('ast', 0)}")

class FBRApiMatchStats:
    def __init__(self, api_key):
        self.api_key = api_key
        self.base_url = "https://fbrapi.com"
        self.headers = {"X-API-Key": api_key}
        # Crear directorio para guardar datos
        self.output_dir = "match_data"
        if not os.path.exists(self.output_dir):
            os.makedirs(self.output_dir)
            
    def make_api_request(self, endpoint, params):
        """Realiza una solicitud a la API y maneja las restricciones de frecuencia"""
        url = f"{self.base_url}/{endpoint}"
        
        try:
            print(f"Consultando endpoint: {endpoint} con parámetros: {params}")
            response = requests.get(url, params=params, headers=self.headers)
            
            if response.status_code == 200:
                return response.json()
            else:
                print(f"Error {response.status_code}: {response.text}")
                return None
        except Exception as e:
            print(f"Error en la solicitud a {endpoint}: {e}")
            return None
            
    def get_player_season_stats(self, player_id, team_id=None, league_id=None, season_id=None):
        """Obtiene estadísticas de temporada de un jugador específico"""
        params = {"player_id": player_id}
        if team_id:
            params["team_id"] = team_id
        if league_id:
            params["league_id"] = league_id
        if season_id:
            params["season_id"] = season_id
            
        return self.make_api_request("player-season-stats", params)
    
    def get_player_match_stats(self, player_id, league_id=None, season_id=None):
        """Obtiene estadísticas de partidos de un jugador específico"""
        params = {"player_id": player_id}
        if league_id:
            params["league_id"] = league_id
        if season_id:
            params["season_id"] = season_id
            
        return self.make_api_request("player-match-stats", params)
    
    def get_player_info(self, player_id):
        """Obtiene información básica de un jugador"""
        return self.make_api_request("players", {"player_id": player_id})
    
    def get_player_complete_data(self, player_id, match_data=None):
        """Obtiene todos los datos disponibles para un jugador específico"""
        print(f"\n{'='*50}")
        print(f"OBTENIENDO DATOS COMPLETOS DEL JUGADOR: {player_id}")
        print(f"{'='*50}")
        
        player_complete_data = {}
        
        # Información básica del jugador
        print("Obteniendo información básica del jugador...")
        player_info = self.get_player_info(player_id)
        player_complete_data['player_info'] = player_info
        
        if player_info:
            print(f"Jugador: {player_info.get('full_name', 'N/A')}")
            print(f"Posiciones: {', '.join(player_info.get('positions', []))}")
            print(f"Nacionalidad: {player_info.get('nationality', 'N/A')}")
            print(f"Fecha de nacimiento: {player_info.get('date_of_birth', 'N/A')}")
        
        time.sleep(7)
        
        # Estadísticas del jugador en el partido específico (si tenemos datos del partido)
        player_match_data = None
        if match_data and 'all_players_detailed' in match_data:
            player_match_data = next(
                (player for player in match_data['all_players_detailed'] 
                 if player.get('meta_player_id') == player_id), 
                None
            )
            
        if player_match_data:
            print(f"\nEstadísticas del jugador en este partido:")
            print(f"Equipo: {player_match_data.get('team', 'N/A')}")
            print(f"Posición jugada: {player_match_data.get('summary_positions', 'N/A')}")
            print(f"Minutos jugados: {player_match_data.get('summary_min', 'N/A')}")
            print(f"Titular: {'Sí' if player_match_data.get('summary_start') == 'Y' else 'No'}")
            print(f"Goles: {player_match_data.get('summary_gls', 0)}")
            print(f"Asistencias: {player_match_data.get('summary_ast', 0)}")
        
        player_complete_data['match_performance'] = player_match_data
        
        # Intentar obtener estadísticas de temporada (puede requerir más parámetros)
        print("\nIntentando obtener estadísticas de temporada...")
        
        # Si tenemos datos del partido, extraer team_id y league_id
        team_id = None
        league_id = None
        season_id = None
        
        if player_match_data:
            # Buscar en los datos del partido información adicional
            if match_data and 'raw_player_data' in match_data:
                for team_data in match_data['raw_player_data']['data']:
                    for player in team_data['players']:
                        if player['meta_data']['player_id'] == player_id:
                            # Intentar extraer team_id si está disponible
                            team_id = player['meta_data'].get('team_id')
                            break
        
        # Estadísticas de temporada del jugador
        if team_id:
            print(f"Obteniendo estadísticas de temporada (team_id: {team_id})...")
            player_season_stats = self.get_player_season_stats(player_id, team_id=team_id)
            player_complete_data['season_stats'] = player_season_stats
            time.sleep(7)
        
        # Estadísticas de partidos del jugador
        print("Obteniendo estadísticas de otros partidos del jugador...")
        player_match_history = self.get_player_match_stats(player_id, league_id=league_id, season_id=season_id)
        player_complete_data['match_history'] = player_match_history
        time.sleep(7)
        
        return player_complete_data
    
    def get_all_players_match_stats(self, match_id):
        """Obtiene estadísticas de todos los jugadores del partido"""
        return self.make_api_request("all-players-match-stats", {"match_id": match_id})
    
    def extract_match_basic_info(self, player_data):
        """Extrae información básica del partido desde los datos de jugadores"""
        if not player_data or 'data' not in player_data:
            return None
            
        teams = player_data['data']
        if len(teams) < 2:
            return None
            
        home_team_data = next((team for team in teams if team['home_away'] == 'home'), None)
        away_team_data = next((team for team in teams if team['home_away'] == 'away'), None)
        
        if not home_team_data or not away_team_data:
            # Si no hay distinción clara, usar los primeros dos equipos
            home_team_data = teams[0]
            away_team_data = teams[1]
        
        # Calcular resultado basado en goles de jugadores
        home_goals = 0
        away_goals = 0
        
        for player in home_team_data['players']:
            if 'summary' in player['stats'] and 'gls' in player['stats']['summary']:
                home_goals += player['stats']['summary']['gls']
                
        for player in away_team_data['players']:
            if 'summary' in player['stats'] and 'gls' in player['stats']['summary']:
                away_goals += player['stats']['summary']['gls']
        
        return {
            'home_team': home_team_data['team_name'],
            'away_team': away_team_data['team_name'],
            'home_team_status': home_team_data['home_away'],
            'away_team_status': away_team_data['home_away'],
            'home_goals': home_goals,
            'away_goals': away_goals,
            'teams_data': teams,
            'match_result': self._determine_match_result(home_goals, away_goals, home_team_data['team_name'], away_team_data['team_name'])
        }
    
    def _determine_match_result(self, home_goals, away_goals, home_team, away_team):
        """Determina el resultado del partido"""
        if home_goals > away_goals:
            return f"Victoria de {home_team}"
        elif away_goals > home_goals:
            return f"Victoria de {away_team}"
        else:
            return "Empate"
    
    def extract_player_details(self, player_data):
        """Extrae todos los detalles de jugadores disponibles"""
        all_players = []
        
        for team_data in player_data['data']:
            team_name = team_data['team_name']
            home_away = team_data['home_away']
            
            for player in team_data['players']:
                player_detail = {
                    'team': team_name,
                    'home_away': home_away,
                }
                
                # Metadatos del jugador
                meta_data = player['meta_data']
                for key, value in meta_data.items():
                    player_detail[f'meta_{key}'] = value
                
                # Estadísticas del jugador - todas las categorías disponibles
                stats = player['stats']
                for category, category_stats in stats.items():
                    if isinstance(category_stats, dict):
                        for stat_key, stat_value in category_stats.items():
                            player_detail[f'{category}_{stat_key}'] = stat_value
                    else:
                        player_detail[f'stats_{category}'] = category_stats
                
                all_players.append(player_detail)
        
        return all_players
    
    def extract_match_events(self, player_data):
        """Extrae eventos del partido: goles, tarjetas, etc."""
        events = {
            'goals': [],
            'yellow_cards': [],
            'red_cards': [],
            'assists': [],
            'penalties': []
        }
        
        for team_data in player_data['data']:
            team_name = team_data['team_name']
            home_away = team_data['home_away']
            
            for player in team_data['players']:
                player_name = player['meta_data']['player_name']
                player_id = player['meta_data']['player_id']
                player_number = player['meta_data'].get('player_number', '')
                
                if 'summary' in player['stats']:
                    summary = player['stats']['summary']
                    
                    # Goles
                    if summary.get('gls', 0) > 0:
                        events['goals'].append({
                            'team': team_name,
                            'home_away': home_away,
                            'player': player_name,
                            'player_id': player_id,
                            'player_number': player_number,
                            'goals': summary['gls'],
                            'penalty_goals': summary.get('pk_made', 0),
                            'non_penalty_goals': summary.get('gls', 0) - summary.get('pk_made', 0)
                        })
                    
                    # Asistencias
                    if summary.get('ast', 0) > 0:
                        events['assists'].append({
                            'team': team_name,
                            'home_away': home_away,
                            'player': player_name,
                            'player_id': player_id,
                            'player_number': player_number,
                            'assists': summary['ast']
                        })
                    
                    # Tarjetas amarillas
                    if summary.get('yellow_cards', 0) > 0:
                        events['yellow_cards'].append({
                            'team': team_name,
                            'home_away': home_away,
                            'player': player_name,
                            'player_id': player_id,
                            'player_number': player_number,
                            'count': summary['yellow_cards']
                        })
                    
                    # Tarjetas rojas
                    if summary.get('red_cards', 0) > 0:
                        events['red_cards'].append({
                            'team': team_name,
                            'home_away': home_away,
                            'player': player_name,
                            'player_id': player_id,
                            'player_number': player_number,
                            'count': summary['red_cards']
                        })
                    
                    # Penales (intentos y convertidos)
                    if summary.get('pk_att', 0) > 0:
                        events['penalties'].append({
                            'team': team_name,
                            'home_away': home_away,
                            'player': player_name,
                            'player_id': player_id,
                            'player_number': player_number,
                            'penalties_attempted': summary['pk_att'],
                            'penalties_made': summary.get('pk_made', 0),
                            'penalties_missed': summary['pk_att'] - summary.get('pk_made', 0)
                        })
        
        return events
    
    def extract_team_performance(self, player_data):
        """Extrae estadísticas de rendimiento por equipo"""
        team_stats = {}
        
        for team_data in player_data['data']:
            team_name = team_data['team_name']
            home_away = team_data['home_away']
            
            # Inicializar estadísticas del equipo
            stats = {
                'team_name': team_name,
                'home_away': home_away,
                'total_players': len(team_data['players']),
                'starters': 0,
                'substitutes': 0,
                'goals': 0,
                'assists': 0,
                'shots': 0,
                'shots_on_target': 0,
                'passes_completed': 0,
                'passes_attempted': 0,
                'pass_accuracy': 0,
                'yellow_cards': 0,
                'red_cards': 0,
                'fouls_committed': 0,
                'fouls_drawn': 0,
                'corners': 0,
                'offsides': 0,
                'possession_touches': 0,
                'tackles': 0,
                'interceptions': 0,
                'blocks': 0,
                'clearances': 0
            }
            
            # Agregar estadísticas de todos los jugadores
            for player in team_data['players']:
                player_stats = player['stats']
                
                # Contar titulares y sustitutos
                if 'summary' in player_stats:
                    if player_stats['summary'].get('start') == 'Y':
                        stats['starters'] += 1
                    else:
                        # Solo contar como sustituto si jugó minutos
                        minutes = player_stats['summary'].get('min', '0')
                        try:
                            if int(minutes) > 0:
                                stats['substitutes'] += 1
                        except (ValueError, TypeError):
                            pass
                    
                    # Sumar estadísticas ofensivas
                    stats['goals'] += player_stats['summary'].get('gls', 0)
                    stats['assists'] += player_stats['summary'].get('ast', 0)
                    stats['shots'] += player_stats['summary'].get('sh', 0)
                    stats['shots_on_target'] += player_stats['summary'].get('sot', 0)
                    stats['yellow_cards'] += player_stats['summary'].get('yellow_cards', 0)
                    stats['red_cards'] += player_stats['summary'].get('red_cards', 0)
                
                # Estadísticas de pases
                if 'passing' in player_stats:
                    stats['passes_completed'] += player_stats['passing'].get('pass_cmp', 0)
                    stats['passes_attempted'] += player_stats['passing'].get('pass_att', 0)
                
                # Estadísticas defensivas
                if 'defense' in player_stats:
                    stats['tackles'] += player_stats['defense'].get('tkl', 0)
                    stats['interceptions'] += player_stats['defense'].get('int', 0)
                    stats['blocks'] += player_stats['defense'].get('blocks', 0)
                    stats['clearances'] += player_stats['defense'].get('clearances', 0)
                
                # Estadísticas de posesión
                if 'possession' in player_stats:
                    stats['possession_touches'] += player_stats['possession'].get('touches', 0)
                
                # Faltas y otros
                if 'misc' in player_stats:
                    stats['fouls_committed'] += player_stats['misc'].get('fls_com', 0)
                    stats['fouls_drawn'] += player_stats['misc'].get('fls_drawn', 0)
                    stats['offsides'] += player_stats['misc'].get('offside', 0)
                
                # Tiros de esquina desde passing_types
                if 'passing_types' in player_stats:
                    stats['corners'] += player_stats['passing_types'].get('ck', 0)
            
            # Calcular porcentaje de precisión de pases
            if stats['passes_attempted'] > 0:
                stats['pass_accuracy'] = round((stats['passes_completed'] / stats['passes_attempted']) * 100, 1)
            
            team_stats[home_away] = stats
        
        return team_stats
    
    def get_complete_match_data(self, match_id, specific_player_id=None):
        """Obtiene todos los datos disponibles para un partido específico"""
        print(f"\n{'='*60}")
        print(f"EXTRAYENDO DATOS COMPLETOS DEL PARTIDO: {match_id}")
        print(f"{'='*60}")
        
        # Obtener estadísticas de todos los jugadores
        print("Obteniendo estadísticas de jugadores...")
        player_data = self.get_all_players_match_stats(match_id)
        
        if not player_data:
            print("Error: No se pudieron obtener estadísticas de jugadores")
            return None
        
        print("Procesando datos del partido...")
        
        # Extraer información básica del partido
        match_info = self.extract_match_basic_info(player_data)
        
        # Extraer detalles completos de jugadores
        all_players = self.extract_player_details(player_data)
        
        # Extraer eventos del partido
        match_events = self.extract_match_events(player_data)
        
        # Extraer estadísticas por equipo
        team_performance = self.extract_team_performance(player_data)
        
        # Compilar todos los datos
        complete_data = {
            'match_id': match_id,
            'match_info': match_info,
            'all_players_detailed': all_players,
            'match_events': match_events,
            'team_performance': team_performance,
            'raw_player_data': player_data
        }
        
        # Si se especifica un jugador, obtener sus datos completos
        if specific_player_id:
            print(f"\nObteniendo datos completos del jugador específico: {specific_player_id}")
            time.sleep(7)  # Respetamos la limitación de frecuencia
            player_complete_data = self.get_player_complete_data(specific_player_id, complete_data)
            complete_data['specific_player_data'] = player_complete_data
        
        return complete_data
    
    def export_match_data(self, match_id, data):
        """Exporta todos los datos del partido a archivos CSV y JSON"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        match_dir = f"{self.output_dir}/match_{match_id}_{timestamp}"
        
        if not os.path.exists(match_dir):
            os.makedirs(match_dir)
        
        # Guardar datos completos en JSON
        with open(f"{match_dir}/complete_data.json", 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=4, ensure_ascii=False)
        
        print(f"\nDatos completos guardados en: {match_dir}/complete_data.json")
        
        # Exportar información básica del partido
        if data['match_info']:
            match_info_df = pd.DataFrame([data['match_info']])
            match_info_df.to_csv(f"{match_dir}/match_info.csv", index=False, encoding='utf-8')
            print(f"Información del partido guardada en: {match_dir}/match_info.csv")
        
        # Exportar detalles completos de jugadores
        if data['all_players_detailed']:
            players_df = pd.DataFrame(data['all_players_detailed'])
            players_df.to_csv(f"{match_dir}/all_players_detailed.csv", index=False, encoding='utf-8')
            print(f"Detalles de jugadores guardados en: {match_dir}/all_players_detailed.csv")
        
        # Exportar eventos por tipo
        events = data['match_events']
        
        if events['goals']:
            goals_df = pd.DataFrame(events['goals'])
            goals_df.to_csv(f"{match_dir}/goals.csv", index=False, encoding='utf-8')
            print(f"Goles guardados en: {match_dir}/goals.csv")
        
        if events['assists']:
            assists_df = pd.DataFrame(events['assists'])
            assists_df.to_csv(f"{match_dir}/assists.csv", index=False, encoding='utf-8')
            print(f"Asistencias guardadas en: {match_dir}/assists.csv")
        
        if events['yellow_cards']:
            yellow_df = pd.DataFrame(events['yellow_cards'])
            yellow_df.to_csv(f"{match_dir}/yellow_cards.csv", index=False, encoding='utf-8')
            print(f"Tarjetas amarillas guardadas en: {match_dir}/yellow_cards.csv")
        
        if events['red_cards']:
            red_df = pd.DataFrame(events['red_cards'])
            red_df.to_csv(f"{match_dir}/red_cards.csv", index=False, encoding='utf-8')
            print(f"Tarjetas rojas guardadas en: {match_dir}/red_cards.csv")
        
        if events['penalties']:
            penalties_df = pd.DataFrame(events['penalties'])
            penalties_df.to_csv(f"{match_dir}/penalties.csv", index=False, encoding='utf-8')
            print(f"Penales guardados en: {match_dir}/penalties.csv")
        
        # Exportar estadísticas por equipo
        if data['team_performance']:
            team_stats_list = [stats for stats in data['team_performance'].values()]
            if team_stats_list:
                team_df = pd.DataFrame(team_stats_list)
                team_df.to_csv(f"{match_dir}/team_performance.csv", index=False, encoding='utf-8')
                print(f"Rendimiento por equipo guardado en: {match_dir}/team_performance.csv")
        
        # Exportar datos del jugador específico si están disponibles
        if 'specific_player_data' in data and data['specific_player_data']:
            player_data = data['specific_player_data']
            
            # Información básica del jugador
            if player_data.get('player_info'):
                player_info_df = pd.DataFrame([player_data['player_info']])
                player_info_df.to_csv(f"{match_dir}/specific_player_info.csv", index=False, encoding='utf-8')
                print(f"Información del jugador específico guardada en: {match_dir}/specific_player_info.csv")
            
            # Rendimiento en el partido
            if player_data.get('match_performance'):
                match_perf_df = pd.DataFrame([player_data['match_performance']])
                match_perf_df.to_csv(f"{match_dir}/specific_player_match_performance.csv", index=False, encoding='utf-8')
                print(f"Rendimiento del jugador en el partido guardado en: {match_dir}/specific_player_match_performance.csv")
            
            # Estadísticas de temporada
            if player_data.get('season_stats') and player_data['season_stats'].get('players'):
                season_stats_df = pd.DataFrame(player_data['season_stats']['players'])
                season_stats_df.to_csv(f"{match_dir}/specific_player_season_stats.csv", index=False, encoding='utf-8')
                print(f"Estadísticas de temporada del jugador guardadas en: {match_dir}/specific_player_season_stats.csv")
            
            # Historial de partidos
            if player_data.get('match_history') and player_data['match_history'].get('data'):
                match_history_df = pd.DataFrame(player_data['match_history']['data'])
                match_history_df.to_csv(f"{match_dir}/specific_player_match_history.csv", index=False, encoding='utf-8')
                print(f"Historial de partidos del jugador guardado en: {match_dir}/specific_player_match_history.csv")
        
        print(f"\nTodos los datos del partido {match_id} han sido exportados a: {match_dir}")
        return match_dir

    def print_match_summary(self, data):
        """Imprime un resumen del partido"""
        match_info = data['match_info']
        events = data['match_events']
        team_performance = data['team_performance']
        
        print(f"\n{'='*60}")
        print(f"RESUMEN DEL PARTIDO {data['match_id']}")
        print(f"{'='*60}")
        
        if match_info:
            print(f"\n{match_info['home_team']} {match_info['home_goals']} - {match_info['away_goals']} {match_info['away_team']}")
        
        # Resumen de goles
        if events['goals']:
            print(f"\n--- GOLES ({len(events['goals'])}) ---")
            for goal in events['goals']:
                penalty_text = f" ({goal['penalty_goals']} penales)" if goal['penalty_goals'] > 0 else ""
                print(f"{goal['team']} ({goal['home_away']}): {goal['player']} #{goal['player_number']} - {goal['goals']} goles{penalty_text}")
        
        # Resumen de asistencias
        if events['assists']:
            print(f"\n--- ASISTENCIAS ({len(events['assists'])}) ---")
            for assist in events['assists']:
                print(f"{assist['team']} ({assist['home_away']}): {assist['player']} #{assist['player_number']} - {assist['assists']} asistencias")
        
        # Resumen de tarjetas
        if events['yellow_cards']:
            print(f"\n--- TARJETAS AMARILLAS ({len(events['yellow_cards'])}) ---")
            for card in events['yellow_cards']:
                print(f"{card['team']} ({card['home_away']}): {card['player']} #{card['player_number']}")
        
        if events['red_cards']:
            print(f"\n--- TARJETAS ROJAS ({len(events['red_cards'])}) ---")
            for card in events['red_cards']:
                print(f"{card['team']} ({card['home_away']}): {card['player']} #{card['player_number']}")
        
        # Estadísticas por equipo
        if team_performance:
            print(f"\n--- ESTADÍSTICAS POR EQUIPO ---")
            for team_type, stats in team_performance.items():
                print(f"\n{stats['team_name']} ({team_type.upper()}):")
                print(f"  Titulares: {stats['starters']}")
                print(f"  Sustitutos que jugaron: {stats['substitutes']}")
                print(f"  Goles: {stats['goals']}")
                print(f"  Asistencias: {stats['assists']}")
                print(f"  Tiros: {stats['shots']} (a puerta: {stats['shots_on_target']})")
                print(f"  Pases: {stats['passes_completed']}/{stats['passes_attempted']} ({stats['pass_accuracy']}%)")
                print(f"  Tarjetas: {stats['yellow_cards']} amarillas, {stats['red_cards']} rojas")
                print(f"  Faltas: {stats['fouls_committed']} cometidas, {stats['fouls_drawn']} recibidas")
                print(f"  Defensivas: {stats['tackles']} entradas, {stats['interceptions']} intercepciones")

def main():
    # Tu clave API
    api_key = "AzumZVPR1MlXaroDdCzrE4OT0ezDLMlLDjVCi0Txb0k"
    
    # Crear instancia del administrador de estadísticas
    stats_manager = FBRApiMatchStats(api_key)
    
    # Lista de partidos para analizar
    match_ids = [
        "9fb48f41",  # Ejemplo de partido
        # Añadir más IDs según sea necesario
    ]
    
    for match_id in match_ids:
        # Obtener datos completos del partido
        match_data = stats_manager.get_complete_match_data(match_id)
        
        if match_data:
            # Mostrar resumen en consola
            stats_manager.print_match_summary(match_data)
            
            # Exportar todos los datos
            output_dir = stats_manager.export_match_data(match_id, match_data)
            
            print(f"\nTodos los detalles disponibles en: {output_dir}")
            print(f"{'='*60}")
        else:
            print(f"No se pudieron obtener datos para el partido {match_id}")
        
        # Esperar antes de procesar el siguiente partido (si hay más de uno)
        if match_id != match_ids[-1]:
            print(f"\nEsperando 10 segundos antes de procesar el siguiente partido...")
            time.sleep(10)

if __name__ == "__main__":
    main()