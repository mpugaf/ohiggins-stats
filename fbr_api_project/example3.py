import requests
import json
import csv
import time
import os
from datetime import datetime

def get_team_data(team_id, api_key):
    """Obtiene los datos del equipo a través de la API"""
    base_url = "https://fbrapi.com"
    url = f"{base_url}/teams"
    params = {"team_id": team_id}
    headers = {"X-API-Key": api_key}
    
    print(f"Consultando información del equipo: {team_id}")
    response = requests.get(url, params=params, headers=headers)
    
    if response.status_code == 200:
        return response.json()
    else:
        print(f"Error: {response.status_code}")
        print(response.text)
        return None

def display_team_data(team_data):
    """Muestra los datos del equipo de forma legible en la consola"""
    if not team_data:
        print("No hay datos para mostrar")
        return
    
    # Mostrar información del roster
    if 'team_roster' in team_data and 'data' in team_data['team_roster']:
        print("\n==== ROSTER DEL EQUIPO ====")
        print(f"Total de jugadores: {len(team_data['team_roster']['data'])}")
        
        # Crear una tabla simple para mostrar jugadores
        print(f"{'NOMBRE':<25} {'POSICIÓN':<10} {'NACIONALIDAD':<10} {'EDAD':<5} {'PARTIDOS':<10}")
        print("-" * 65)
        
        for player in team_data['team_roster']['data'][:10]:  # Mostrar solo los primeros 10 para no saturar la consola
            name = player.get('player', 'N/A')
            position = player.get('position', 'N/A')
            nationality = player.get('nationality', 'N/A')
            age = player.get('age', 'N/A')
            matches = player.get('mp', 'N/A')
            
            print(f"{name[:24]:<25} {position:<10} {nationality:<10} {age:<5} {matches:<10}")
        
        if len(team_data['team_roster']['data']) > 10:
            print(f"... y {len(team_data['team_roster']['data']) - 10} jugadores más.")
    
    # Mostrar información del calendario
    if 'team_schedule' in team_data and 'data' in team_data['team_schedule']:
        print("\n==== CALENDARIO DEL EQUIPO ====")
        print(f"Total de partidos: {len(team_data['team_schedule']['data'])}")
        
        # Crear una tabla simple para mostrar partidos
        print(f"{'FECHA':<12} {'RIVAL':<25} {'LOCAL/VISITA':<12} {'RESULTADO':<10} {'GOLES F/C':<10}")
        print("-" * 75)
        
        for match in team_data['team_schedule']['data'][:10]:  # Mostrar solo los primeros 10
            date = match.get('date', 'N/A')
            opponent = match.get('opponent', 'N/A')
            home_away = match.get('home_away', 'N/A')
            result = match.get('result', 'N/A')
            goals = f"{match.get('gf', 'N/A')}-{match.get('ga', 'N/A')}"
            
            print(f"{date:<12} {opponent[:24]:<25} {home_away:<12} {result:<10} {goals:<10}")
        
        if len(team_data['team_schedule']['data']) > 10:
            print(f"... y {len(team_data['team_schedule']['data']) - 10} partidos más.")

def save_to_csv(team_data, team_id):
    """Guarda los datos del equipo en archivos CSV"""
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    
    # Crear directorio para guardar los archivos si no existe
    os.makedirs("fbr_data", exist_ok=True)
    
    # Guardar roster en CSV
    if 'team_roster' in team_data and 'data' in team_data['team_roster']:
        roster_filename = f"fbr_data/team_{team_id}_roster_{timestamp}.csv"
        
        with open(roster_filename, 'w', newline='', encoding='utf-8') as csvfile:
            # Obtener todas las claves posibles para crear las columnas
            all_keys = set()
            for player in team_data['team_roster']['data']:
                all_keys.update(player.keys())
            
            fieldnames = sorted(list(all_keys))
            writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
            
            writer.writeheader()
            for player in team_data['team_roster']['data']:
                writer.writerow(player)
        
        print(f"\nRoster guardado en: {roster_filename}")
    
    # Guardar calendario en CSV
    if 'team_schedule' in team_data and 'data' in team_data['team_schedule']:
        schedule_filename = f"fbr_data/team_{team_id}_schedule_{timestamp}.csv"
        
        with open(schedule_filename, 'w', newline='', encoding='utf-8') as csvfile:
            # Obtener todas las claves posibles para crear las columnas
            all_keys = set()
            for match in team_data['team_schedule']['data']:
                all_keys.update(match.keys())
            
            fieldnames = sorted(list(all_keys))
            writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
            
            writer.writeheader()
            for match in team_data['team_schedule']['data']:
                writer.writerow(match)
        
        print(f"Calendario guardado en: {schedule_filename}")

def save_raw_json(team_data, team_id):
    """Guarda los datos brutos en formato JSON"""
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    os.makedirs("fbr_data", exist_ok=True)
    
    json_filename = f"fbr_data/team_{team_id}_raw_{timestamp}.json"
    
    with open(json_filename, 'w', encoding='utf-8') as jsonfile:
        json.dump(team_data, jsonfile, indent=2)
    
    print(f"Datos JSON guardados en: {json_filename}")

def main():
    # Usar la clave API que ya tienes
    api_key = "AzumZVPR1MlXaroDdCzrE4OT0ezDLMlLDjVCi0Txb0k"
    
    # ID del equipo
    team_id = "5049d576"
    
    # Obtener datos
    team_data = get_team_data(team_id, api_key)
    
    if team_data:
        # Mostrar datos de forma legible
        display_team_data(team_data)
        
        # Guardar datos en CSV
        save_to_csv(team_data, team_id)
        
        # Guardar datos brutos en JSON
        save_raw_json(team_data, team_id)

if __name__ == "__main__":
    main()
