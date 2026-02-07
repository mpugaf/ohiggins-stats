"""
Analizador específico para obtener datos detallados de un jugador
"""

from utils import safe_get, calculate_pass_accuracy, print_section_header, print_separator

class PlayerAnalyzer:
    def __init__(self, api_client):
        self.client = api_client
    
    def get_player_complete_data(self, player_id, match_data=None):
        """Obtiene todos los datos disponibles para un jugador específico"""
        print_section_header(f"DATOS COMPLETOS DEL JUGADOR: {player_id}")
        
        player_data = {}
        
        # 1. Información básica del jugador
        print("📋 Obteniendo información básica del jugador...")
        player_info = self.client.get_player_info(player_id)
        player_data['player_info'] = player_info
        
        if player_info:
            self._show_basic_info(player_info)
        else:
            print("❌ No se pudo obtener información básica del jugador")
            return None
        
        self.client.wait_rate_limit()
        
        # 2. Rendimiento en el partido específico
        player_match_performance = self._extract_match_performance(player_id, match_data)
        player_data['match_performance'] = player_match_performance
        
        if player_match_performance:
            self._show_match_performance(player_match_performance)
        
        # 3. Estadísticas de temporada
        print("\n📊 Obteniendo estadísticas de temporada...")
        # Intentar con diferentes parámetros según la documentación
        season_stats = self.client.get_player_season_stats(player_id)
        player_data['season_stats'] = season_stats
        
        if season_stats:
            self._show_season_stats(season_stats)
        else:
            print("⚠️  No se encontraron estadísticas de temporada")
        
        self.client.wait_rate_limit()
        
        # 4. Historial de partidos
        print("\n📅 Obteniendo historial de partidos...")
        match_history = self.client.get_player_match_stats(player_id)
        player_data['match_history'] = match_history
        
        if match_history:
            self._show_match_history(match_history)
        else:
            print("⚠️  No se encontró historial de partidos")
        
        return player_data
    
    def _extract_match_performance(self, player_id, match_data):
        """Extrae el rendimiento del jugador en el partido específico"""
        if not match_data or 'data' not in match_data:
            return None
        
        for team_data in match_data['data']:
            for player in team_data['players']:
                if player['meta_data']['player_id'] == player_id:
                    return {
                        'team': team_data['team_name'],
                        'home_away': team_data['home_away'],
                        **player['meta_data'],
                        **self._flatten_stats(player['stats'])
                    }
        return None
    
    def _flatten_stats(self, stats):
        """Aplana las estadísticas anidadas"""
        flattened = {}
        for category, category_stats in stats.items():
            if isinstance(category_stats, dict):
                for stat_key, stat_value in category_stats.items():
                    flattened[f'{category}_{stat_key}'] = stat_value
            else:
                flattened[f'stats_{category}'] = category_stats
        return flattened
    
    def _show_basic_info(self, player_info):
        """Muestra información básica del jugador"""
        print(f"\n👤 INFORMACIÓN BÁSICA:")
        print(f"  🏷️  Nombre completo: {player_info.get('full_name', 'N/A')}")
        print(f"  ⚽ Posiciones: {', '.join(player_info.get('positions', ['N/A']))}")
        print(f"  🌍 Nacionalidad: {player_info.get('nationality', 'N/A')}")
        print(f"  🎂 Fecha de nacimiento: {player_info.get('date_of_birth', 'N/A')}")
        print(f"  📏 Altura: {player_info.get('height', 'N/A')} cm")
        print(f"  ⚖️  Peso: {player_info.get('weight', 'N/A')} kg")
        print(f"  🦶 Pie dominante: {player_info.get('footed', 'N/A')}")
        
        if player_info.get('wages'):
            print(f"  💰 Salario: {player_info.get('wages', 'N/A')}")
        
        if player_info.get('birth_city'):
            print(f"  🏙️  Ciudad de nacimiento: {player_info.get('birth_city', 'N/A')}")
    
    def _show_match_performance(self, performance):
        """Muestra el rendimiento del jugador en el partido específico"""
        print(f"\n⚽ RENDIMIENTO EN ESTE PARTIDO:")
        print(f"  🏟️  Equipo: {performance.get('team', 'N/A')}")
        print(f"  📍 Local/Visitante: {performance.get('home_away', 'N/A')}")
        print(f"  👕 Número: {performance.get('player_number', 'N/A')}")
        print(f"  🕐 Minutos jugados: {performance.get('summary_min', 'N/A')}")
        print(f"  🎯 Posición jugada: {performance.get('summary_positions', 'N/A')}")
        print(f"  🏁 Titular: {'Sí' if performance.get('summary_start') == 'Y' else 'No'}")
        
        # Estadísticas ofensivas
        print(f"\n  📊 ESTADÍSTICAS OFENSIVAS:")
        print(f"    ⚽ Goles: {safe_get(performance, 'summary_gls', 0)}")
        print(f"    🎯 Asistencias: {safe_get(performance, 'summary_ast', 0)}")
        print(f"    🏹 Tiros: {safe_get(performance, 'summary_sh', 0)} (a puerta: {safe_get(performance, 'summary_sot', 0)})")
        print(f"    🎯 xG: {safe_get(performance, 'summary_xg', 0)}")
        print(f"    📈 xAG: {safe_get(performance, 'summary_xag', 0)}")
        
        # Estadísticas de pases
        passes_cmp = safe_get(performance, 'passing_pass_cmp', 0)
        passes_att = safe_get(performance, 'passing_pass_att', 0)
        pass_accuracy = calculate_pass_accuracy(passes_cmp, passes_att)
        
        print(f"\n  📊 ESTADÍSTICAS DE PASES:")
        print(f"    ✅ Pases completados: {passes_cmp}/{passes_att} ({pass_accuracy}%)")
        print(f"    📏 Distancia total de pases: {safe_get(performance, 'passing_pass_ttl_dist', 0)}")
        print(f"    🔑 Pases clave: {safe_get(performance, 'passing_key_passes', 0)}")
        print(f"    ➡️  Pases progresivos: {safe_get(performance, 'summary_pass_prog', 0)}")
        
        # Estadísticas defensivas
        print(f"\n  📊 ESTADÍSTICAS DEFENSIVAS:")
        print(f"    🦵 Entradas: {safe_get(performance, 'defense_tkl', 0)}")
        print(f"    🛡️  Intercepciones: {safe_get(performance, 'summary_int', 0)}")
        print(f"    🚫 Bloqueos: {safe_get(performance, 'summary_blocks', 0)}")
        
        # Tarjetas y faltas
        print(f"\n  📊 DISCIPLINA:")
        print(f"    🟨 Tarjetas amarillas: {safe_get(performance, 'summary_yellow_cards', 0)}")
        print(f"    🟥 Tarjetas rojas: {safe_get(performance, 'summary_red_cards', 0)}")
        
        # Estadísticas de posesión
        print(f"\n  📊 POSESIÓN:")
        print(f"    ✋ Toques: {safe_get(performance, 'summary_touches', 0)}")
        print(f"    🏃 Intentos de regate: {safe_get(performance, 'summary_take_on_att', 0)}")
        print(f"    ✅ Regates exitosos: {safe_get(performance, 'summary_take_on_suc', 0)}")
    
    def _show_season_stats(self, season_stats):
        """Muestra estadísticas de temporada del jugador"""
        if not season_stats or 'players' not in season_stats:
            return
        
        players_data = season_stats.get('players', [])
        if not players_data:
            return
        
        # Tomar el primer conjunto de datos (temporada más reciente)
        player_season = players_data[0]
        meta_data = player_season.get('meta_data', {})
        stats = player_season.get('stats', {}).get('stats', {})
        
        print(f"\n📊 ESTADÍSTICAS DE TEMPORADA:")
        print(f"  👤 Jugador: {meta_data.get('player_name', 'N/A')}")
        print(f"  🌍 País: {meta_data.get('player_country_code', 'N/A')}")
        print(f"  🎂 Edad: {meta_data.get('age', 'N/A')}")
        
        print(f"\n  📈 RENDIMIENTO GENERAL:")
        print(f"    🎮 Partidos jugados: {safe_get(stats, 'matches_played', 'N/A')}")
        print(f"    🏁 Como titular: {safe_get(stats, 'starts', 'N/A')}")
        print(f"    🕐 Minutos totales: {safe_get(stats, 'min', 'N/A')}")
        print(f"    ⚽ Goles totales: {safe_get(stats, 'gls', 'N/A')}")
        print(f"    🎯 Asistencias totales: {safe_get(stats, 'ast', 'N/A')}")
        
        print(f"\n  📊 ESTADÍSTICAS POR 90 MINUTOS:")
        print(f"    ⚽ Goles por 90 min: {safe_get(stats, 'per90_gls', 'N/A')}")
        print(f"    🎯 Asistencias por 90 min: {safe_get(stats, 'per90_ast', 'N/A')}")
        print(f"    📈 xG por 90 min: {safe_get(stats, 'per90_xg', 'N/A')}")
        print(f"    📈 xAG por 90 min: {safe_get(stats, 'per90_xag', 'N/A')}")
        
        # Mostrar estadísticas adicionales si están disponibles
        shooting_stats = player_season.get('stats', {}).get('shooting', {})
        if shooting_stats:
            print(f"\n  🏹 ESTADÍSTICAS DE TIRO:")
            print(f"    🎯 Tiros totales: {safe_get(shooting_stats, 'sh', 'N/A')}")
            print(f"    🎯 Tiros a puerta: {safe_get(shooting_stats, 'sot', 'N/A')}")
            print(f"    📏 Distancia promedio de tiro: {safe_get(shooting_stats, 'avg_sh_dist', 'N/A')}")
    
    def _show_match_history(self, match_history):
        """Muestra el historial reciente de partidos"""
        if not match_history or 'data' not in match_history:
            return
        
        matches = match_history['data'][:5]  # Últimos 5 partidos
        
        print(f"\n📅 HISTORIAL RECIENTE (últimos {len(matches)} partidos):")
        
        for i, match in enumerate(matches):
            meta = match.get('meta_data', {})
            stats = match.get('stats', {}).get('summary', {})
            
            print(f"\n  {i+1}. 📅 {meta.get('date', 'N/A')} vs {meta.get('opponent', 'N/A')}")
            print(f"     🏟️  {meta.get('home_away', 'N/A')} | ⚽ Equipo: {meta.get('team_name', 'N/A')}")
            print(f"     🕐 Minutos: {stats.get('min', 'N/A')} | ⚽ Goles: {stats.get('gls', 0)} | 🎯 Asistencias: {stats.get('ast', 0)}")
            print(f"     🏹 Tiros: {stats.get('sh', 0)} | 📈 xG: {stats.get('xg', 0)} | 🟨 Tarjetas: {stats.get('yellow_cards', 0)}")