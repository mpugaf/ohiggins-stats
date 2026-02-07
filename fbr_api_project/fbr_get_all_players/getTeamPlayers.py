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

def get_player_detailed_info(player_id, api_key):
    """Obtiene información detallada de un jugador específico"""
    base_url = "https://fbrapi.com"
    url = f"{base_url}/players"
    params = {"player_id": player_id}
    headers = {"X-API-Key": api_key}
    
    try:
        print(f"  → Obteniendo detalles del jugador: {player_id}")
        response = requests.get(url, params=params, headers=headers)
        
        if response.status_code == 200:
            return response.json()
        else:
            print(f"    Error {response.status_code} para jugador {player_id}")
            return None
    except Exception as e:
        print(f"    Error en solicitud para jugador {player_id}: {e}")
        return None

def process_team_players(team_data, api_key):
    """Procesa los jugadores del equipo y obtiene información detallada"""
    if not team_data or 'team_roster' not in team_data or 'data' not in team_data['team_roster']:
        print("No hay datos de roster para procesar")
        return []
    
    roster_data = team_data['team_roster']['data']
    processed_players = []
    
    print(f"\n{'='*60}")
    print(f"PROCESANDO {len(roster_data)} JUGADORES DEL EQUIPO")
    print(f"{'='*60}")
    
    for i, player in enumerate(roster_data, 1):
        print(f"\n[{i}/{len(roster_data)}] Procesando: {player.get('player', 'N/A')}")
        
        # Obtener información básica del roster
        player_basic = {
            'player_id_fbr': player.get('player_id', ''),
            'nombre_roster': player.get('player', ''),
            'nacionalidad_codigo': player.get('nationality', ''),
            'posicion_roster': player.get('position', ''),
            'edad_roster': player.get('age', None),
            'partidos_jugados': player.get('mp', None),
            'partidos_titular': player.get('starts', None)
        }
        
        # Obtener información detallada del jugador
        detailed_info = None
        if player.get('player_id'):
            detailed_info = get_player_detailed_info(player.get('player_id'), api_key)
            # Esperar para respetar límite de frecuencia
            time.sleep(7)
        
        # Combinar información básica con detallada
        final_player_data = combine_player_data(player_basic, detailed_info)
        processed_players.append(final_player_data)
        
        print(f"    ✅ Procesado: {final_player_data.get('nombre_completo', 'N/A')}")
    
    return processed_players

def combine_player_data(basic_data, detailed_data):
    """Combina datos básicos del roster con información detallada del jugador"""
    # Estructura basada en la tabla DIM_JUGADOR del modelo de datos
    player_data = {
        # IDs y identificadores
        'player_id_fbr': basic_data.get('player_id_fbr', ''),
        
        # Información personal (DIM_JUGADOR)
        'nombre_completo': '',
        'apodo': '',
        'fecha_nacimiento': '',
        
        # Información adicional del roster
        'nombre_roster': basic_data.get('nombre_roster', ''),
        'nacionalidad_codigo': basic_data.get('nacionalidad_codigo', ''),
        'posicion_roster': basic_data.get('posicion_roster', ''),
        'edad_roster': basic_data.get('edad_roster'),
        'partidos_jugados': basic_data.get('partidos_jugados'),
        'partidos_titular': basic_data.get('partidos_titular'),
        
        # Información física y técnica
        'altura_cm': None,
        'peso_kg': None,
        'pie_dominante': '',
        'salario': '',
        'ciudad_nacimiento': '',
        'pais_nacimiento': '',
        'posiciones_detalladas': '',
        'url_foto': ''
    }
    
    # Si tenemos información detallada, completar los campos
    if detailed_data:
        player_data['nombre_completo'] = detailed_data.get('full_name', basic_data.get('nombre_roster', ''))
        player_data['fecha_nacimiento'] = detailed_data.get('date_of_birth', '')
        player_data['altura_cm'] = detailed_data.get('height')
        player_data['peso_kg'] = detailed_data.get('weight')
        player_data['pie_dominante'] = detailed_data.get('footed', '')
        player_data['salario'] = detailed_data.get('wages', '')
        player_data['ciudad_nacimiento'] = detailed_data.get('birth_city', '')
        player_data['pais_nacimiento'] = detailed_data.get('birth_country', '')
        player_data['url_foto'] = detailed_data.get('photo_url', '')
        
        # Procesar posiciones (puede ser una lista)
        positions = detailed_data.get('positions', [])
        if isinstance(positions, list):
            player_data['posiciones_detalladas'] = ', '.join(positions)
        else:
            player_data['posiciones_detalladas'] = str(positions) if positions else ''
    else:
        # Si no hay información detallada, usar datos del roster
        player_data['nombre_completo'] = basic_data.get('nombre_roster', '')
    
    return player_data

def display_players_summary(players_data):
    """Muestra un resumen de los jugadores en consola"""
    if not players_data:
        print("No hay datos de jugadores para mostrar")
        return
    
    print(f"\n{'='*80}")
    print(f"RESUMEN DE JUGADORES DEL EQUIPO")
    print(f"{'='*80}")
    print(f"Total de jugadores procesados: {len(players_data)}")
    
    # Mostrar tabla resumen
    print(f"\n{'NOMBRE':<25} {'POSICIÓN':<12} {'EDAD':<5} {'NACIONALIDAD':<8} {'FECHA NAC.':<12} {'ALTURA':<8}")
    print("-" * 80)
    
    for player in players_data:
        nombre = (player.get('nombre_completo') or player.get('nombre_roster', 'N/A'))[:24]
        posicion = (player.get('posicion_roster') or '')[:11]
        edad = str(player.get('edad_roster') or 'N/A')
        nacionalidad = (player.get('nacionalidad_codigo') or 'N/A')[:7]
        fecha_nac = (player.get('fecha_nacimiento') or 'N/A')[:11]
        altura = str(player.get('altura_cm') or 'N/A')[:7]
        
        print(f"{nombre:<25} {posicion:<12} {edad:<5} {nacionalidad:<8} {fecha_nac:<12} {altura:<8}")
    
    # Estadísticas adicionales
    print(f"\n{'='*50}")
    print("ESTADÍSTICAS DEL ROSTER:")
    
    # Contar por posiciones
    posiciones = {}
    with_detailed_info = 0
    
    for player in players_data:
        pos = player.get('posicion_roster', 'N/A')
        posiciones[pos] = posiciones.get(pos, 0) + 1
        
        if player.get('fecha_nacimiento'):
            with_detailed_info += 1
    
    print(f"Jugadores con información detallada: {with_detailed_info}/{len(players_data)}")
    print(f"\nDistribución por posiciones:")
    for pos, count in sorted(posiciones.items()):
        print(f"  {pos}: {count} jugadores")

def export_players_to_csv(players_data, team_id):
    """Exporta los datos de jugadores a CSV"""
    if not players_data:
        print("No hay datos para exportar")
        return
    
    # Crear directorio para los CSV si no existe
    output_dir = "team_players_data"
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
    
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"{output_dir}/team_{team_id}_players_{timestamp}.csv"
    
    try:
        # Determinar todos los campos disponibles
        all_fields = set()
        for player in players_data:
            all_fields.update(player.keys())
        
        fieldnames = sorted(list(all_fields))
        
        with open(filename, 'w', newline='', encoding='utf-8') as csvfile:
            writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(players_data)
        
        print(f"\n✅ Datos de jugadores exportados a: {filename}")
        print(f"   Total de registros: {len(players_data)}")
        print(f"   Campos incluidos: {len(fieldnames)}")
        
    except Exception as e:
        print(f"❌ Error al exportar jugadores: {e}")

def main():
    # Configuración
    api_key = "AzumZVPR1MlXaroDdCzrE4OT0ezDLMlLDjVCi0Txb0k"
    team_id = "5049d576"  # ID del equipo específico
    
    print(f"{'='*60}")
    print(f"OBTENCIÓN DE JUGADORES DEL EQUIPO {team_id}")
    print(f"{'='*60}")
    
    try:
        # 1. Obtener datos básicos del equipo
        print("🔍 Paso 1: Obteniendo datos básicos del equipo...")
        team_data = get_team_data(team_id, api_key)
        
        if not team_data:
            print("❌ No se pudieron obtener datos del equipo")
            return
        
        print("✅ Datos del equipo obtenidos correctamente")
        
        # 2. Procesar jugadores y obtener información detallada
        print("\n🔍 Paso 2: Procesando jugadores y obteniendo información detallada...")
        players_data = process_team_players(team_data, api_key)
        
        if not players_data:
            print("❌ No se pudieron procesar los jugadores")
            return
        
        # 3. Mostrar resumen en consola
        display_players_summary(players_data)
        
        # 4. Exportar a CSV
        print(f"\n🔍 Paso 3: Exportando datos...")
        export_players_to_csv(players_data, team_id)
        
        print(f"\n{'='*60}")
        print("✅ PROCESO COMPLETADO EXITOSAMENTE")
        print(f"{'='*60}")
        
    except KeyboardInterrupt:
        print("\n⚠️ Proceso interrumpido por el usuario")
    except Exception as e:
        print(f"\n❌ Error inesperado: {e}")

if __name__ == "__main__":
    main()