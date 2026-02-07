"""
Código principal simplificado para obtener y mostrar datos de partidos
"""

from api_client import FBRApiClient
from data_extractor import MatchDataExtractor
from console_display import ConsoleDisplay
from player_analyzer import PlayerAnalyzer
from config import PLAYER_CONFIG

class MatchAnalyzer:
    def __init__(self, api_key):
        self.client = FBRApiClient(api_key)
        self.extractor = MatchDataExtractor()
        self.display = ConsoleDisplay()
        self.player_analyzer = PlayerAnalyzer(self.client)
    
    def analyze_match(self, match_id, specific_player_id=None):
        """Analiza un partido y muestra los resultados en consola"""
        print(f"\nObteniendo datos del partido {match_id}...")
        
        # Obtener datos del partido
        player_data = self.client.get_all_players_match_stats(match_id)
        
        if not player_data:
            print(f"❌ No se pudieron obtener datos del partido {match_id}")
            return False
        
        # Extraer información del partido
        match_info = self.extractor.extract_basic_info(player_data)
        scorers = self.extractor.extract_goal_scorers(player_data)
        assisters = self.extractor.extract_assists(player_data)
        yellow_cards, red_cards = self.extractor.extract_cards(player_data)
        team_stats = self.extractor.extract_team_stats(player_data)
        
        # Mostrar resumen del partido
        self.display.show_complete_summary(
            match_id, match_info, scorers, assisters, 
            yellow_cards, red_cards, team_stats
        )
        
        # Si se especifica un jugador, obtener sus datos completos
        if specific_player_id:
            print(f"\n🔍 Analizando jugador específico: {specific_player_id}")
            self.client.wait_rate_limit()
            
            # Verificar si el jugador participó en este partido
            player_in_match = self._check_player_in_match(specific_player_id, player_data)
            
            if player_in_match:
                print(f"✅ El jugador {specific_player_id} participó en este partido")
            else:
                print(f"⚠️  El jugador {specific_player_id} NO participó en este partido")
            
            # Obtener datos completos del jugador
            player_complete_data = self.player_analyzer.get_player_complete_data(
                specific_player_id, player_data
            )
            
            if not player_complete_data:
                print(f"❌ No se pudieron obtener datos del jugador {specific_player_id}")
        
        return True
    
    def _check_player_in_match(self, player_id, match_data):
        """Verifica si un jugador específico participó en el partido"""
        if not match_data or 'data' not in match_data:
            return False
        
        for team_data in match_data['data']:
            for player in team_data['players']:
                if player['meta_data']['player_id'] == player_id:
                    return True
        return False
    
    def analyze_multiple_matches(self, match_ids, specific_player_id=None):
        """Analiza múltiples partidos"""
        successful = 0
        total = len(match_ids)
        
        for i, match_id in enumerate(match_ids):
            if self.analyze_match(match_id, specific_player_id):
                successful += 1
            
            # Esperar entre solicitudes (excepto en el último)
            if i < total - 1:
                print(f"\n⏱️  Esperando antes del siguiente partido...")
                self.client.wait_rate_limit()
        
        print(f"\n✅ Procesados {successful}/{total} partidos exitosamente")

def main():
    # Configuración
    API_KEY = "AzumZVPR1MlXaroDdCzrE4OT0ezDLMlLDjVCi0Txb0k"
    
    # Lista de partidos para analizar
    MATCH_IDS = [
        "9fb48f41",  # Ejemplo de partido
        # Agregar más IDs según sea necesario
    ]
    
    # ID del jugador específico a analizar
    SPECIFIC_PLAYER_ID = PLAYER_CONFIG["target_player_id"]  # ad052490
    
    # Crear analizador
    analyzer = MatchAnalyzer(API_KEY)
    
    try:
        print(f"🎯 Analizando partidos con enfoque en el jugador: {SPECIFIC_PLAYER_ID}")
        
        # Analizar partidos con jugador específico
        analyzer.analyze_multiple_matches(MATCH_IDS, SPECIFIC_PLAYER_ID)
        
    except KeyboardInterrupt:
        print("\n⚠️  Proceso interrumpido por el usuario")
    except Exception as e:
        print(f"\n❌ Error inesperado: {e}")

if __name__ == "__main__":
    main()