"""
Módulo para mostrar datos del partido en consola
"""

from utils import format_team_indicator, print_separator, print_section_header

class ConsoleDisplay:
    
    @staticmethod
    def show_match_header(match_id, match_info):
        """Muestra el encabezado del partido"""
        print_section_header(f"RESUMEN DEL PARTIDO {match_id}")
        
        if match_info:
            print(f"\n🏠 LOCAL: {match_info['home_team']}")
            print(f"✈️  VISITANTE: {match_info['away_team']}")
            print(f"\n📊 RESULTADO: {match_info['home_team']} {match_info['home_goals']} - {match_info['away_goals']} {match_info['away_team']}")
            print(f"🏆 {match_info['result']}")
    
    @staticmethod
    def show_goal_scorers(scorers):
        """Muestra los goleadores del partido"""
        if not scorers:
            return
            
        print(f"\n--- ⚽ GOLES ({len(scorers)}) ---")
        for scorer in scorers:
            team_icon = format_team_indicator(scorer['home_away'])
            penalty_text = f" ({scorer['penalties']} penales)" if scorer['penalties'] > 0 else ""
            print(f"{team_icon} {scorer['team']}: {scorer['player']} #{scorer['player_number']} - {scorer['goals']} goles{penalty_text}")
    
    @staticmethod
    def show_assists(assisters):
        """Muestra las asistencias del partido"""
        if not assisters:
            return
            
        print(f"\n--- 🎯 ASISTENCIAS ({len(assisters)}) ---")
        for assister in assisters:
            team_icon = format_team_indicator(assister['home_away'])
            print(f"{team_icon} {assister['team']}: {assister['player']} #{assister['player_number']} - {assister['assists']} asistencias")
    
    @staticmethod
    def show_cards(yellow_cards, red_cards):
        """Muestra las tarjetas del partido"""
        if yellow_cards:
            print(f"\n--- 🟨 TARJETAS AMARILLAS ({len(yellow_cards)}) ---")
            for card in yellow_cards:
                team_icon = format_team_indicator(card['home_away'])
                print(f"{team_icon} {card['team']}: {card['player']} #{card['player_number']}")
        
        if red_cards:
            print(f"\n--- 🟥 TARJETAS ROJAS ({len(red_cards)}) ---")
            for card in red_cards:
                team_icon = format_team_indicator(card['home_away'])
                print(f"{team_icon} {card['team']}: {card['player']} #{card['player_number']}")
    
    @staticmethod
    def show_team_stats(team_stats):
        """Muestra estadísticas por equipo"""
        if not team_stats:
            return
            
        print(f"\n--- 📈 ESTADÍSTICAS POR EQUIPO ---")
        
        for team_type, stats in team_stats.items():
            team_icon = format_team_indicator(team_type)
            print(f"\n{team_icon} {stats['team_name']} ({team_type.upper()}):")
            print(f"  👥 Titulares: {stats['starters']}")
            print(f"  ⚽ Goles: {stats['goals']}")
            print(f"  🎯 Asistencias: {stats['assists']}")
            print(f"  🎯 Tiros: {stats['shots']} (a puerta: {stats['shots_on_target']})")
            print(f"  ⚽ Pases: {stats['passes_completed']}/{stats['passes_attempted']} ({stats['pass_accuracy']}%)")
            print(f"  🟨🟥 Tarjetas: {stats['yellow_cards']} amarillas, {stats['red_cards']} rojas")
            print(f"  🛡️ Defensivas: {stats['tackles']} entradas, {stats['interceptions']} intercepciones")
    
    @staticmethod
    def show_complete_summary(match_id, match_info, scorers, assisters, yellow_cards, red_cards, team_stats):
        """Muestra el resumen completo del partido"""
        ConsoleDisplay.show_match_header(match_id, match_info)
        ConsoleDisplay.show_goal_scorers(scorers)
        ConsoleDisplay.show_assists(assisters)
        ConsoleDisplay.show_cards(yellow_cards, red_cards)
        ConsoleDisplay.show_team_stats(team_stats)
        print_separator()