from fbr_client import FBRClient

def main():
    # Inicializar el cliente
    client = FBRClient()
    
    # Ejemplo: Obtener estadísticas de un jugador
    # Nota: Reemplaza '12345' con un ID de jugador real
    player_id = '12345'
    print(f"\nObteniendo estadísticas del jugador {player_id}...")
    player_stats = client.get_player_stats(player_id)
    print(f"Resultado: {player_stats}")
    
    # Ejemplo: Obtener estadísticas de un equipo
    # Nota: Reemplaza '67890' con un ID de equipo real
    team_id = '5049d576'
    print(f"\nObteniendo estadísticas del equipo {team_id}...")
    team_stats = client.get_team_stats(team_id)
    print(f"Resultado: {team_stats}")
    
    # Ejemplo: Obtener clasificación de una liga
    # Nota: Reemplaza '24680' con un ID de liga real
    league_id = '24680'
    print(f"\nObteniendo clasificación de la liga {league_id}...")
    league_standings = client.get_league_standings(league_id, season="2022-2023")
    print(f"Resultado: {league_standings}")

if __name__ == "__main__":
    main()
