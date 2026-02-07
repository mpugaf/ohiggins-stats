"""
Funciones utilitarias para el procesamiento de datos
"""

def safe_get(data, key, default=0):
    """Obtiene un valor de forma segura desde un diccionario"""
    try:
        return data.get(key, default) if data else default
    except (AttributeError, TypeError):
        return default

def calculate_pass_accuracy(completed, attempted):
    """Calcula el porcentaje de precisión de pases"""
    if attempted and attempted > 0:
        return round((completed / attempted) * 100, 1)
    return 0.0

def format_minutes(minutes):
    """Formatea los minutos jugados"""
    try:
        return int(minutes) if minutes and str(minutes).isdigit() else 0
    except (ValueError, TypeError):
        return 0

def determine_match_result(home_goals, away_goals, home_team, away_team):
    """Determina el resultado del partido"""
    if home_goals > away_goals:
        return f"Victoria de {home_team}"
    elif away_goals > home_goals:
        return f"Victoria de {away_team}"
    else:
        return "Empate"

def format_team_indicator(home_away):
    """Retorna el indicador visual del equipo"""
    return "🏠" if home_away == 'home' else "✈️"

def print_separator(length=60, char="="):
    """Imprime una línea separadora"""
    print(char * length)

def print_section_header(title, length=60):
    """Imprime un encabezado de sección"""
    print_separator(length)
    print(f"{title}")
    print_separator(length)