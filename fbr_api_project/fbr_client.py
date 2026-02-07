import requests
import json
import time
import os

class FBRClient:
    def __init__(self, api_key=None):
        self.base_url = "https://fbrapi.com"
        
        # Cargar la clave API del archivo si no se proporciona
        if api_key is None:
            try:
                with open('api_key.json', 'r') as f:
                    data = json.load(f)
                    api_key = data.get('api_key')
            except FileNotFoundError:
                print("Archivo api_key.json no encontrado. Generando nueva clave API...")
                from get_api_key import get_api_key
                api_key = get_api_key()
                
        if not api_key:
            raise ValueError("No se pudo obtener una clave API válida")
            
        self.api_key = api_key
        self.last_request_time = 0
    
    def _make_request(self, endpoint, method="GET", params=None, data=None):
        """Método interno para hacer solicitudes respetando la limitación de frecuencia"""
        # Asegurar que hayan pasado al menos 6 segundos desde la última solicitud
        current_time = time.time()
        time_since_last_request = current_time - self.last_request_time
        
        if time_since_last_request < 6:
            sleep_time = 6 - time_since_last_request
            print(f"Esperando {sleep_time:.2f} segundos para respetar la limitación...")
            time.sleep(sleep_time)
        
        # Construir la URL
        url = f"{self.base_url}/{endpoint}"
        
        # Incluir la clave API en los parámetros
        if params is None:
            params = {}
        params['api_key'] = self.api_key
        
        # Hacer la solicitud
        try:
            if method.upper() == "GET":
                response = requests.get(url, params=params)
            elif method.upper() == "POST":
                response = requests.post(url, params=params, json=data)
            else:
                raise ValueError(f"Método no soportado: {method}")
            
            # Actualizar el tiempo de la última solicitud
            self.last_request_time = time.time()
            
            if 200 <= response.status_code < 300:
                return response.json()
            else:
                print(f"Error: {response.status_code}")
                print(response.text)
                return None
                
        except Exception as e:
            print(f"Ocurrió un error: {e}")
            return None
    
    # Ejemplos de métodos para diferentes endpoints
    def get_player_stats(self, player_id):
        """Obtiene estadísticas de un jugador por su ID"""
        return self._make_request(f"player/{player_id}")
    
    def get_team_stats(self, team_id):
        """Obtiene estadísticas de un equipo por su ID"""
        return self._make_request(f"team/{team_id}")
    
    def get_league_standings(self, league_id, season=None):
        """Obtiene la clasificación de una liga"""
        params = {}
        if season:
            params['season'] = season
        return self._make_request(f"league/{league_id}/standings", params=params)
