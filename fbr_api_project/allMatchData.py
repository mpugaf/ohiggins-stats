import requests
import json
import time
import pandas as pd
from datetime import datetime
import os

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
            
    def get_match_metadata(self, match_id):
        """Obtiene metadatos del partido"""
        return self.make_api_request("matches", {"match_id": match_id})
        
    def get_all_players_match_stats(self, match_id):
        """Obtiene estadísticas de todos los jugadores del partido"""
        return self.make_api_request("all-players-match-stats", {"match_id": match_id})
    
    def get_team_match_stats(self, match_id, team_id):
        """Obtiene estadísticas del equipo para el partido específico"""
        # Primero necesitamos obtener la información de la liga y temporada
        match_metadata = self.get_match_metadata(match_id)
        
        if not match_metadata or not match_metadata.get('data'):
            print("No se pudo obtener información del partido")
            return None
            
        # En la respuesta de matches, necesitamos extraer la liga y temporada
        match_data = match_metadata['data']
        if isinstance(match_data, list) and len(match_data) > 0:
            match_info = match_data[0]
            league_id = match_info.get('league_id')
            # La temporada normalmente no viene directamente, habría que extraerla de otro endpoint
            # Por ahora, asumimos que podemos obtener team_match_stats solo con match_id y team_id
            
            return self.make_api_request("team-match-stats", {
                "match_id": match_id,
                "team_id": team_id
            })
        
        return None
        
    def get_match_cards_and_subs(self, match_id):
        """Extrae tarjetas y sustituciones de los datos de jugadores"""
        player_data = self.get_all_players_match_stats(match_id)
        
        if not player_data:
            return None
            
        yellow_cards = []
        red_cards = []
        substitutions = []
        
        # Procesar cada equipo
        for team_data in player_data['data']:
            team_name = team_data['team_name']
            team_id = None  # Intentaremos encontrar el team_id
            home_away = team_data['home_away']
            
            # Procesar jugadores del equipo
            for player in team_data['players']:
                player_name = player['meta_data']['player_name']
                player_id = player['meta_data']['player_id']
                
                # Obtener el team_id si está disponible
                if 'team_id' in player['meta_data']:
                    team_id = player['meta_data']['team_id']
                
                # Comprobar tarjetas amarillas
                if 'summary' in player['stats'] and 'yellow_cards' in player['stats']['summary'] and player['stats']['summary']['yellow_cards'] > 0:
                    yellow_cards.append({
                        'team': team_name,
                        'team_id': team_id,
                        'player': player_name,
                        'player_id': player_id,
                        'home_away': home_away,
                        'count': player['stats']['summary']['yellow_cards']
                    })
                
                # Comprobar tarjetas rojas
                if 'summary' in player['stats'] and 'red_cards' in player['stats']['summary'] and player['stats']['summary']['red_cards'] > 0:
                    red_cards.append({
                        'team': team_name,
                        'team_id': team_id,
                        'player': player_name,
                        'player_id': player_id,
                        'home_away': home_away,
                        'count': player['stats']['summary']['red_cards']
                    })
                
                # Para sustituciones, identificamos jugadores que no jugaron el partido completo
                if 'summary' in player['stats'] and 'min' in player['stats']['summary'] and player['stats']['summary']['min'] != '90':
                    minutes_played = player['stats']['summary']['min']
                    
                    # Si fue sustituto (entró durante el partido)
                    if 'start' in player['stats']['summary'] and player['stats']['summary']['start'] != 'Y':
                        substitutions.append({
                            'team': team_name,
                            'team_id': team_id,
                            'player': player_name,
                            'player_id': player_id,
                            'home_away': home_away,
                            'type': 'in',
                            'minute': minutes_played
                        })
                    # Si fue titular y salió durante el partido
                    elif 'start' in player['stats']['summary'] and player['stats']['summary']['start'] == 'Y':
                        substitutions.append({
                            'team': team_name,
                            'team_id': team_id,
                            'player': player_name, 
                            'player_id': player_id,
                            'home_away': home_away,
                            'type': 'out',
                            'minute': minutes_played
                        })
        
        return {
            'yellow_cards': yellow_cards,
            'red_cards': red_cards,
            'substitutions': substitutions
        }
    
    def get_match_goals(self, match_id):
        """Extrae información de goles (deduce de las estadísticas de jugadores)"""
        player_data = self.get_all_players_match_stats(match_id)
        
        if not player_data:
            return None
            
        goals = []
        
        # Procesar cada equipo
        for team_data in player_data['data']:
            team_name = team_data['team_name']
            team_id = None
            home_away = team_data['home_away']
            
            # Procesar jugadores del equipo
            for player in team_data['players']:
                player_name = player['meta_data']['player_name']
                player_id = player['meta_data']['player_id']
                
                # Obtener el team_id si está disponible
                if 'team_id' in player['meta_data']:
                    team_id = player['meta_data']['team_id']
                
                # Comprobar goles
                if 'summary' in player['stats'] and 'gls' in player['stats']['summary'] and player['stats']['summary']['gls'] > 0:
                    goals.append({
                        'team': team_name,
                        'team_id': team_id,
                        'player': player_name,
                        'player_id': player_id,
                        'home_away': home_away,
                        'count': player['stats']['summary']['gls'],
                        'penalty_goals': player['stats']['summary'].get('pk_made', 0)
                    })
        
        return goals

    def get_complete_match_data(self, match_id):
        """Obtiene todos los datos disponibles para un partido específico"""
        print(f"\n{'='*50}")
        print(f"OBTENIENDO DATOS COMPLETOS DEL PARTIDO: {match_id}")
        print(f"{'='*50}")
        
        # Recopilamos todos los datos
        match_metadata = self.get_match_metadata(match_id)
        time.sleep(7)  # Respetamos la limitación de frecuencia de la API
        
        all_players_stats = self.get_all_players_match_stats(match_id)
        time.sleep(7)
        
        cards_and_subs = self.get_match_cards_and_subs(match_id)
        
        goals = self.get_match_goals(match_id)
        
        # Obtener IDs de equipo del partido para consultar sus estadísticas
        team_stats = {}
        if match_metadata and 'data' in match_metadata and len(match_metadata['data']) > 0:
            match_info = match_metadata['data'][0]
            
            # Para partidos de equipos
            if 'home_team_id' in match_info and 'away_team_id' in match_info:
                home_team_id = match_info['home_team_id']
                away_team_id = match_info['away_team_id']
                
                # Obtener estadísticas de equipo (respetando límite de frecuencia)
                time.sleep(7)
                team_stats['home'] = self.get_team_match_stats(match_id, home_team_id)
                time.sleep(7)
                team_stats['away'] = self.get_team_match_stats(match_id, away_team_id)
            
            # Para partidos donde el equipo es el protagonista
            elif 'opponent_id' in match_info:
                team_id = None  # Necesitaríamos extraerlo de algún otro endpoint
                opponent_id = match_info['opponent_id']
                
                # Aquí necesitaríamos identificar el team_id del equipo principal
        
        # Compilar todos los datos
        complete_data = {
            'match_metadata': match_metadata,
            'all_players_stats': all_players_stats,
            'cards_and_substitutions': cards_and_subs,
            'goals': goals,
            'team_stats': team_stats
        }
        
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
        
        # Exportar metadatos del partido
        if data['match_metadata'] and 'data' in data['match_metadata']:
            match_df = pd.DataFrame(data['match_metadata']['data'])
            match_df.to_csv(f"{match_dir}/match_metadata.csv", index=False, encoding='utf-8')
            print(f"Metadatos del partido guardados en: {match_dir}/match_metadata.csv")
        
        # Exportar estadísticas de jugadores
        if data['all_players_stats'] and 'data' in data['all_players_stats']:
            # Procesamos estadísticas de jugadores a un formato tabular
            player_rows = []
            
            for team_data in data['all_players_stats']['data']:
                team_name = team_data['team_name']
                home_away = team_data['home_away']
                
                for player in team_data['players']:
                    player_meta = player['meta_data']
                    player_row = {
                        'team': team_name,
                        'home_away': home_away,
                        'player_id': player_meta['player_id'],
                        'player_name': player_meta['player_name'],
                        'player_country': player_meta.get('player_country_code', ''),
                        'player_number': player_meta.get('player_number', ''),
                        'age': player_meta.get('age', '')
                    }
                    
                    # Añadir estadísticas de resumen
                    if 'summary' in player['stats']:
                        for key, value in player['stats']['summary'].items():
                            player_row[f'summary_{key}'] = value
                    
                    # Añadir otras categorías de estadísticas disponibles
                    for stat_category in ['passing', 'passing_types', 'defense', 'possession', 'misc']:
                        if stat_category in player['stats']:
                            for key, value in player['stats'][stat_category].items():
                                player_row[f'{stat_category}_{key}'] = value
                    
                    player_rows.append(player_row)
            
            # Crear DataFrame y exportar
            if player_rows:
                players_df = pd.DataFrame(player_rows)
                players_df.to_csv(f"{match_dir}/players_stats.csv", index=False, encoding='utf-8')
                print(f"Estadísticas de jugadores guardadas en: {match_dir}/players_stats.csv")
        
        # Exportar tarjetas y sustituciones
        if data['cards_and_substitutions']:
            if data['cards_and_substitutions']['yellow_cards']:
                yellow_df = pd.DataFrame(data['cards_and_substitutions']['yellow_cards'])
                yellow_df.to_csv(f"{match_dir}/yellow_cards.csv", index=False, encoding='utf-8')
                print(f"Tarjetas amarillas guardadas en: {match_dir}/yellow_cards.csv")
            
            if data['cards_and_substitutions']['red_cards']:
                red_df = pd.DataFrame(data['cards_and_substitutions']['red_cards'])
                red_df.to_csv(f"{match_dir}/red_cards.csv", index=False, encoding='utf-8')
                print(f"Tarjetas rojas guardadas en: {match_dir}/red_cards.csv")
            
            if data['cards_and_substitutions']['substitutions']:
                subs_df = pd.DataFrame(data['cards_and_substitutions']['substitutions'])
                subs_df.to_csv(f"{match_dir}/substitutions.csv", index=False, encoding='utf-8')
                print(f"Sustituciones guardadas en: {match_dir}/substitutions.csv")
        
        # Exportar goles
        if data['goals']:
            goals_df = pd.DataFrame(data['goals'])
            goals_df.to_csv(f"{match_dir}/goals.csv", index=False, encoding='utf-8')
            print(f"Goles guardados en: {match_dir}/goals.csv")
        
        # Exportar estadísticas de equipo
        if data['team_stats']:
            for team_type, team_data in data['team_stats'].items():
                if team_data and 'data' in team_data:
                    # Aplanar los datos anidados para cada equipo
                    team_rows = []
                    for stat_entry in team_data['data']:
                        team_row = {'team_type': team_type}
                        
                        # Añadir metadatos
                        if 'meta_data' in stat_entry:
                            for key, value in stat_entry['meta_data'].items():
                                team_row[f'meta_{key}'] = value
                        
                        # Añadir estadísticas
                        if 'stats' in stat_entry:
                            for stat_category, stat_values in stat_entry['stats'].items():
                                for key, value in stat_values.items():
                                    team_row[f'{stat_category}_{key}'] = value
                        
                        team_rows.append(team_row)
                    
                    if team_rows:
                        team_df = pd.DataFrame(team_rows)
                        team_df.to_csv(f"{match_dir}/team_stats_{team_type}.csv", index=False, encoding='utf-8')
                        print(f"Estadísticas del equipo {team_type} guardadas en: {match_dir}/team_stats_{team_type}.csv")
        
        print(f"\nTodos los datos del partido {match_id} han sido exportados a: {match_dir}")
        return match_dir

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
            # Exportar todos los datos
            output_dir = stats_manager.export_match_data(match_id, match_data)
            
            # Mostrar resumen de los datos obtenidos
            print(f"\n{'='*50}")
            print(f"RESUMEN DE DATOS DEL PARTIDO {match_id}")
            print(f"{'='*50}")
            
            if match_data['match_metadata'] and 'data' in match_data['match_metadata']:
                match_info = match_data['match_metadata']['data'][0]
                print(f"Fecha: {match_info.get('date', 'N/A')}")
                
                if 'home' in match_info and 'away' in match_info:
                    print(f"Equipos: {match_info['home']} vs {match_info['away']}")
                    if 'home_team_score' in match_info and 'away_team_score' in match_info:
                        print(f"Resultado: {match_info['home']} {match_info['home_team_score']} - {match_info['away_team_score']} {match_info['away']}")
                
                if 'venue' in match_info:
                    print(f"Estadio: {match_info['venue']}")
                
                if 'attendance' in match_info:
                    print(f"Asistencia: {match_info['attendance']}")
                
                if 'referee' in match_info:
                    print(f"Árbitro: {match_info['referee']}")
            
            # Resumen de goles
            if match_data['goals']:
                print("\n--- GOLES ---")
                for goal in match_data['goals']:
                    penalty = " (penal)" if goal['penalty_goals'] > 0 else ""
                    print(f"{goal['team']} ({goal['home_away']}): {goal['player']} - {goal['count']} goles{penalty}")
            
            # Resumen de tarjetas
            if match_data['cards_and_substitutions']['yellow_cards']:
                print("\n--- TARJETAS AMARILLAS ---")
                for card in match_data['cards_and_substitutions']['yellow_cards']:
                    print(f"{card['team']} ({card['home_away']}): {card['player']} - {card['count']} tarjetas")
            
            if match_data['cards_and_substitutions']['red_cards']:
                print("\n--- TARJETAS ROJAS ---")
                for card in match_data['cards_and_substitutions']['red_cards']:
                    print(f"{card['team']} ({card['home_away']}): {card['player']} - {card['count']} tarjetas")
            
            print(f"\nTodos los detalles disponibles en: {output_dir}")
            print(f"{'='*50}")
        else:
            print(f"No se pudieron obtener datos para el partido {match_id}")
        
        # Esperar antes de procesar el siguiente partido (si hay más de uno)
        if match_id != match_ids[-1]:
            print(f"\nEsperando 10 segundos antes de procesar el siguiente partido...")
            time.sleep(10)

if __name__ == "__main__":
    main()