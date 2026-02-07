"""
Extractor de datos del partido desde la respuesta de la API
"""

from utils import safe_get, calculate_pass_accuracy, determine_match_result

class MatchDataExtractor:
    
    @staticmethod
    def extract_basic_info(player_data):
        """Extrae información básica del partido"""
        if not player_data or 'data' not in player_data:
            return None
            
        teams = player_data['data']
        if len(teams) < 2:
            return None
            
        home_team = next((team for team in teams if team['home_away'] == 'home'), teams[0])
        away_team = next((team for team in teams if team['home_away'] == 'away'), teams[1])
        
        # Calcular goles totales
        home_goals = sum(
            safe_get(player['stats'].get('summary', {}), 'gls', 0) 
            for player in home_team['players']
        )
        away_goals = sum(
            safe_get(player['stats'].get('summary', {}), 'gls', 0) 
            for player in away_team['players']
        )
        
        return {
            'home_team': home_team['team_name'],
            'away_team': away_team['team_name'],
            'home_goals': home_goals,
            'away_goals': away_goals,
            'result': determine_match_result(
                home_goals, away_goals, 
                home_team['team_name'], away_team['team_name']
            )
        }
    
    @staticmethod
    def extract_goal_scorers(player_data):
        """Extrae información de goleadores"""
        scorers = []
        
        for team_data in player_data['data']:
            for player in team_data['players']:
                summary = player['stats'].get('summary', {})
                goals = safe_get(summary, 'gls', 0)
                
                if goals > 0:
                    scorers.append({
                        'team': team_data['team_name'],
                        'home_away': team_data['home_away'],
                        'player': player['meta_data']['player_name'],
                        'player_number': safe_get(player['meta_data'], 'player_number', ''),
                        'goals': goals,
                        'penalties': safe_get(summary, 'pk_made', 0)
                    })
        
        return scorers
    
    @staticmethod
    def extract_assists(player_data):
        """Extrae información de asistencias"""
        assisters = []
        
        for team_data in player_data['data']:
            for player in team_data['players']:
                summary = player['stats'].get('summary', {})
                assists = safe_get(summary, 'ast', 0)
                
                if assists > 0:
                    assisters.append({
                        'team': team_data['team_name'],
                        'home_away': team_data['home_away'],
                        'player': player['meta_data']['player_name'],
                        'player_number': safe_get(player['meta_data'], 'player_number', ''),
                        'assists': assists
                    })
        
        return assisters
    
    @staticmethod
    def extract_cards(player_data):
        """Extrae información de tarjetas"""
        yellow_cards = []
        red_cards = []
        
        for team_data in player_data['data']:
            for player in team_data['players']:
                summary = player['stats'].get('summary', {})
                
                yellow = safe_get(summary, 'yellow_cards', 0)
                red = safe_get(summary, 'red_cards', 0)
                
                player_info = {
                    'team': team_data['team_name'],
                    'home_away': team_data['home_away'],
                    'player': player['meta_data']['player_name'],
                    'player_number': safe_get(player['meta_data'], 'player_number', '')
                }
                
                if yellow > 0:
                    yellow_cards.append({**player_info, 'count': yellow})
                if red > 0:
                    red_cards.append({**player_info, 'count': red})
        
        return yellow_cards, red_cards
    
    @staticmethod
    def extract_team_stats(player_data):
        """Extrae estadísticas por equipo"""
        team_stats = {}
        
        for team_data in player_data['data']:
            stats = {
                'team_name': team_data['team_name'],
                'home_away': team_data['home_away'],
                'starters': 0,
                'goals': 0,
                'assists': 0,
                'shots': 0,
                'shots_on_target': 0,
                'passes_completed': 0,
                'passes_attempted': 0,
                'yellow_cards': 0,
                'red_cards': 0,
                'tackles': 0,
                'interceptions': 0
            }
            
            for player in team_data['players']:
                player_stats = player['stats']
                summary = player_stats.get('summary', {})
                
                # Contar titulares
                if summary.get('start') == 'Y':
                    stats['starters'] += 1
                
                # Sumar estadísticas
                stats['goals'] += safe_get(summary, 'gls', 0)
                stats['assists'] += safe_get(summary, 'ast', 0)
                stats['shots'] += safe_get(summary, 'sh', 0)
                stats['shots_on_target'] += safe_get(summary, 'sot', 0)
                stats['yellow_cards'] += safe_get(summary, 'yellow_cards', 0)
                stats['red_cards'] += safe_get(summary, 'red_cards', 0)
                
                # Estadísticas de pases
                passing = player_stats.get('passing', {})
                stats['passes_completed'] += safe_get(passing, 'pass_cmp', 0)
                stats['passes_attempted'] += safe_get(passing, 'pass_att', 0)
                
                # Estadísticas defensivas
                defense = player_stats.get('defense', {})
                stats['tackles'] += safe_get(defense, 'tkl', 0)
                stats['interceptions'] += safe_get(defense, 'int', 0)
            
            # Calcular precisión de pases
            stats['pass_accuracy'] = calculate_pass_accuracy(
                stats['passes_completed'], 
                stats['passes_attempted']
            )
            
            team_stats[team_data['home_away']] = stats
        
        return team_stats