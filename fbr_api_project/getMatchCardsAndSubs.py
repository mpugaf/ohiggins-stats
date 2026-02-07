import requests
import time

def get_match_cards_and_subs(match_id, api_key):
    """Obtiene tarjetas amarillas y sustituciones para un partido específico"""
    base_url = "https://fbrapi.com/all-players-match-stats"
    headers = {"X-API-Key": api_key}
    params = {"match_id": match_id}
    
    print(f"Consultando información del partido: {match_id}")
    
    try:
        response = requests.get(base_url, params=params, headers=headers)
        
        if response.status_code == 200:
            data = response.json()
            
            # Listas para almacenar tarjetas y sustituciones
            yellow_cards = []
            substitutions = []
            
            # Procesar cada equipo
            for team_data in data['data']:
                team_name = team_data['team_name']
                home_away = team_data['home_away']
                
                # Procesar jugadores del equipo
                for player in team_data['players']:
                    player_name = player['meta_data']['player_name']
                    player_id = player['meta_data']['player_id']
                    
                    # Comprobar tarjetas amarillas
                    if 'yellow_cards' in player['stats']['summary'] and player['stats']['summary']['yellow_cards'] > 0:
                        yellow_cards.append({
                            'team': team_name,
                            'player': player_name,
                            'player_id': player_id,
                            'home_away': home_away,
                            'count': player['stats']['summary']['yellow_cards']
                        })
                    
                    # Para sustituciones, necesitamos identificar jugadores que no jugaron el partido completo
                    if 'min' in player['stats']['summary'] and player['stats']['summary']['min'] != '90':
                        minutes_played = player['stats']['summary']['min']
                        
                        # Si fue sustituto (entró durante el partido)
                        if 'start' in player['stats']['summary'] and player['stats']['summary']['start'] != 'Y':
                            substitutions.append({
                                'team': team_name,
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
                                'player': player_name, 
                                'player_id': player_id,
                                'home_away': home_away,
                                'type': 'out',
                                'minute': minutes_played
                            })
            
            return {
                'yellow_cards': yellow_cards,
                'substitutions': substitutions
            }
        else:
            print(f"Error: {response.status_code}")
            print(response.text)
            return None
    except Exception as e:
        print(f"Error en la solicitud: {e}")
        return None

# Ejemplo de uso
api_key = "AzumZVPR1MlXaroDdCzrE4OT0ezDLMlLDjVCi0Txb0k"
match_id = "9fb48f41"  # ID del partido de ejemplo de la documentación
result = get_match_cards_and_subs(match_id, api_key)

if result:
    print("\n=== TARJETAS AMARILLAS ===")
    for card in result['yellow_cards']:
        print(f"Equipo: {card['team']} ({card['home_away']})")
        print(f"Jugador: {card['player']}")
        print(f"Cantidad: {card['count']}")
        print("---")
    
    print("\n=== SUSTITUCIONES ===")
    for sub in result['substitutions']:
        print(f"Equipo: {sub['team']} ({sub['home_away']})")
        print(f"Jugador: {sub['player']}")
        print(f"Tipo: {'Entró' if sub['type'] == 'in' else 'Salió'}")
        print(f"Minuto: {sub['minute']}")
        print("---")