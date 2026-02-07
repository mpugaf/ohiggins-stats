"""
Configuración y constantes para la aplicación FBR API
"""

# Configuración de API
API_CONFIG = {
    "base_url": "https://fbrapi.com",
    "rate_limit_seconds": 7,
    "timeout": 30
}

# Rutas de archivos
PATHS = {
    "output_dir": "match_data",
    "logs_dir": "logs"
}

# Configuración de exportación
EXPORT_CONFIG = {
    "include_json": True,
    "include_csv": True,
    "encoding": "utf-8",
    "timestamp_format": "%Y%m%d_%H%M%S"
}

# Endpoints disponibles
ENDPOINTS = {
    "all_players_match_stats": "all-players-match-stats",
    "player_season_stats": "player-season-stats", 
    "player_match_stats": "player-match-stats",
    "player_info": "players",
    "teams": "teams",
    "matches": "matches"
}

# Configuración de visualización en consola
DISPLAY_CONFIG = {
    "separator_length": 60,
    "max_recent_matches": 5,
    "max_display_players": 10
}

# Configuración específica para jugadores
PLAYER_CONFIG = {
    "target_player_id": "ad052490",  # ID del jugador específico a analizar
    "show_detailed_stats": True,
    "show_match_history": True,
    "show_season_comparison": True
}