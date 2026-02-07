"""
Cliente simplificado para interactuar con la FBR API
"""

import requests
import time
from config import API_CONFIG, ENDPOINTS

class FBRApiClient:
    def __init__(self, api_key):
        self.api_key = api_key
        self.base_url = API_CONFIG["base_url"]
        self.headers = {"X-API-Key": api_key}
        self.rate_limit = API_CONFIG["rate_limit_seconds"]
    
    def make_request(self, endpoint, params):
        """Realiza una solicitud a la API"""
        url = f"{self.base_url}/{endpoint}"
        
        try:
            print(f"Consultando: {endpoint} -> {params}")
            response = requests.get(
                url, 
                params=params, 
                headers=self.headers,
                timeout=API_CONFIG["timeout"]
            )
            
            if response.status_code == 200:
                return response.json()
            else:
                print(f"Error {response.status_code}: {response.text}")
                return None
                
        except Exception as e:
            print(f"Error en solicitud: {e}")
            return None
    
    def get_all_players_match_stats(self, match_id):
        """Obtiene estadísticas de todos los jugadores del partido"""
        return self.make_request(
            ENDPOINTS["all_players_match_stats"], 
            {"match_id": match_id}
        )
    
    def get_player_info(self, player_id):
        """Obtiene información básica de un jugador"""
        return self.make_request(
            ENDPOINTS["player_info"], 
            {"player_id": player_id}
        )
    
    def get_player_season_stats(self, player_id, team_id=None, league_id=None, season_id=None):
        """Obtiene estadísticas de temporada de un jugador"""
        params = {"player_id": player_id}
        if team_id:
            params["team_id"] = team_id
        if league_id:
            params["league_id"] = league_id
        if season_id:
            params["season_id"] = season_id
        
        return self.make_request(ENDPOINTS["player_season_stats"], params)
    
    def get_player_match_stats(self, player_id, league_id=None, season_id=None):
        """Obtiene estadísticas de partidos de un jugador"""
        params = {"player_id": player_id}
        if league_id:
            params["league_id"] = league_id
        if season_id:
            params["season_id"] = season_id
        
        return self.make_request(ENDPOINTS["player_match_stats"], params)
    
    def wait_rate_limit(self):
        """Espera el tiempo necesario para respetar límites de frecuencia"""
        time.sleep(self.rate_limit)