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
        for player in team_data['team_roster']['data']:  # Mostrar todos los jugadores
            name = player.get('player', 'N/A')
            position = player.get('position', 'N/A')
            nationality = player.get('nationality', 'N/A')
            age = player.get('age', 'N/A')
            matches = player.get('mp', 'N/A')
            print(f"{name[:24]:<25} {position:<10} {nationality:<10} {age:<5} {matches:<10}")
    
    # Mostrar información del calendario
    if 'team_schedule' in team_data and 'data' in team_data['team_schedule']:
        print("\n==== CALENDARIO DEL EQUIPO ====")
        print(f"Total de partidos: {len(team_data['team_schedule']['data'])}")
        # Crear una tabla simple para mostrar partidos
        print(f"{'FECHA':<12} {'RIVAL':<25} {'LOCAL/VISITA':<12} {'RESULTADO':<10} {'GOLES F/C':<10}")
        print("-" * 75)
        for match in team_data['team_schedule']['data']:  # Mostrar todos los partidos
            date = match.get('date', 'N/A')
            opponent = match.get('opponent', 'N/A')
            home_away = match.get('home_away', 'N/A')
            result = match.get('result', 'N/A')
            goals = f"{match.get('gf', 'N/A')}/{match.get('ga', 'N/A')}"
            print(f"{date:<12} {opponent[:24]:<25} {home_away:<12} {result:<10} {goals:<10}")

def export_to_csv(team_data, team_id):
    """Exporta los datos del equipo a archivos CSV"""
    if not team_data:
        print("No hay datos para exportar")
        return
    
    # Crear directorio para los CSV si no existe
    output_dir = "fbr_data"
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
    
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    
    # Exportar roster a CSV
    if 'team_roster' in team_data and 'data' in team_data['team_roster']:
        roster_data = team_data['team_roster']['data']
        roster_filename = f"{output_dir}/team_{team_id}_roster_{timestamp}.csv"
        
        if roster_data:
            try:
                # Determinar los campos del CSV basado en las claves disponibles en el primer registro
                fieldnames = roster_data[0].keys()
                
                with open(roster_filename, 'w', newline='', encoding='utf-8-sig') as csvfile:
                    writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
                    writer.writeheader()
                    writer.writerows(roster_data)
                
                print(f"\nRoster exportado a: {roster_filename}")
            except Exception as e:
                print(f"Error al exportar el roster: {e}")
    
    # Exportar calendario a CSV
    if 'team_schedule' in team_data and 'data' in team_data['team_schedule']:
        schedule_data = team_data['team_schedule']['data']
        schedule_filename = f"{output_dir}/team_{team_id}_schedule_{timestamp}.csv"
        
        if schedule_data:
            try:
                # Determinar los campos del CSV basado en las claves disponibles en el primer registro
                fieldnames = schedule_data[0].keys()
                
                with open(schedule_filename, 'w', newline='', encoding='utf-8-sig') as csvfile:
                    writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
                    writer.writeheader()
                    writer.writerows(schedule_data)
                
                print(f"Calendario exportado a: {schedule_filename}")
            except Exception as e:
                print(f"Error al exportar el calendario: {e}")

def main():
    # Tu clave API
    api_key = "AzumZVPR1MlXaroDdCzrE4OT0ezDLMlLDjVCi0Txb0k"
    
    # Lista de equipos para consultar (IDs)
    team_ids = [
        "5049d576",  # Mantener como lista para futuras necesidades
    ]
    
    for i, team_id in enumerate(team_ids):
        # Obtener datos del equipo
        team_data = get_team_data(team_id, api_key)
        
        # Mostrar datos en consola
        display_team_data(team_data)
        
        # Exportar datos a CSV
        export_to_csv(team_data, team_id)
        
        # Esperar 7 segundos antes de la siguiente petición (excepto en la última)
        if i < len(team_ids) - 1:
            print(f"\nEsperando 7 segundos antes de la siguiente petición...")
            time.sleep(7)

if __name__ == "__main__":
    main()