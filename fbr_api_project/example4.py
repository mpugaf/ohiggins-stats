import requests
import json
import time
import os
from datetime import datetime

# Verificar e instalar pandas si es necesario
try:
    import pandas as pd
except ImportError:
    print("Instalando la biblioteca pandas...")
    os.system("pip install pandas")
    import pandas as pd

# Usar la clave API que ya tienes
api_key = "AzumZVPR1MlXaroDdCzrE4OT0ezDLMlLDjVCi0Txb0k"
base_url = "https://fbrapi.com"

def get_team_data(team_id, season_id=None):
    """Obtiene datos de un equipo y los devuelve como un diccionario"""
    url = f"{base_url}/teams"
    params = {"team_id": team_id}
    
    if season_id:
        params["season_id"] = season_id
        
    headers = {"X-API-Key": api_key}
    
    print(f"\nConsultando información del equipo: {team_id}")
    print(f"URL: {url}")
    
    response = requests.get(url, params=params, headers=headers)
    print(f"Respuesta: {response.status_code}")
    
    if response.status_code == 200:
        return response.json()
    else:
        print(f"Error: {response.text}")
        return None

def display_team_data(data):
    """Muestra los datos del equipo de manera legible usando pandas"""
    if not data:
        print("No hay datos para mostrar")
        return
    
    # Mostrar datos del roster
    if "team_roster" in data and "data" in data["team_roster"]:
        roster = data["team_roster"]["data"]
        print("\n=== ROSTER DEL EQUIPO ===")
        
        # Convertir a DataFrame para mejor visualización
        roster_df = pd.DataFrame(roster)
        
        # Configurar pandas para mostrar más columnas
        pd.set_option('display.max_columns', None)
        pd.set_option('display.width', None)
        
        # Mostrar el DataFrame
        print(roster_df)
        print(f"Total de jugadores: {len(roster)}")
    
    # Mostrar datos del calendario
    if "team_schedule" in data and "data" in data["team_schedule"]:
        schedule = data["team_schedule"]["data"]
        print("\n=== CALENDARIO DEL EQUIPO ===")
        
        # Convertir a DataFrame para mejor visualización
        schedule_df = pd.DataFrame(schedule)
        
        # Mostrar el DataFrame
        print(schedule_df)
        print(f"Total de partidos: {len(schedule)}")

def export_to_csv(data, team_id):
    """Exporta los datos a archivos CSV"""
    if not data:
        print("No hay datos para exportar")
        return
    
    # Crear directorio para los CSV si no existe
    output_dir = "fbr_data"
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
    
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    
    # Exportar roster
    if "team_roster" in data and "data" in data["team_roster"]:
        roster_df = pd.DataFrame(data["team_roster"]["data"])
        roster_filename = f"{output_dir}/team_{team_id}_roster_{timestamp}.csv"
        roster_df.to_csv(roster_filename, index=False)
        print(f"\nRoster exportado a: {roster_filename}")
    
    # Exportar calendario
    if "team_schedule" in data and "data" in data["team_schedule"]:
        schedule_df = pd.DataFrame(data["team_schedule"]["data"])
        schedule_filename = f"{output_dir}/team_{team_id}_schedule_{timestamp}.csv"
        schedule_df.to_csv(schedule_filename, index=False)
        print(f"Calendario exportado a: {schedule_filename}")

def main():
    # ID del equipo
    team_id = "5049d576"
    
    # Opcional: temporada específica
    season_id = "2023-2024"  # Comentar esta línea si quieres la temporada más reciente
    
    # Obtener datos
    team_data = get_team_data(team_id, season_id)
    
    # Mostrar datos de manera legible
    display_team_data(team_data)
    
    # Exportar a CSV
    export_to_csv(team_data, team_id)
    
    # Ejemplo de cómo obtener datos de otro equipo respetando el delay
    print("\nEsperando 7 segundos antes de la siguiente petición...")
    time.sleep(7)
    
    # Otro equipo (puedes cambiar el ID)
    another_team_id = "a2d435b3"  # ID de ejemplo, cámbialo por uno real
    another_team_data = get_team_data(another_team_id)
    display_team_data(another_team_data)
    export_to_csv(another_team_data, another_team_id)

if __name__ == "__main__":
    main()