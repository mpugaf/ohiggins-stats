"""
Configuración de conexión a base de datos
"""

import os
from dataclasses import dataclass

@dataclass
class DatabaseConfig:
    """Configuración de la base de datos"""
    host: str = "192.168.100.16"
    port: int = 3306
    database: str = "MP_DATA_DEV"
    user: str = "mpuga"
    password: str = "123qweasd"  # Configurar según tu entorno
    charset: str = "utf8mb4"
    # collation: str = "utf8mb4_general_ci"  # Collation compatible con versiones anteriores
    
    def get_connection_params(self):
        """Retorna parámetros de conexión sin collation para evitar conflictos"""
        return {
            'host': self.host,
            'port': self.port,
            'database': self.database,
            'user': self.user,
            'password': self.password,
            'charset': self.charset,
            'use_unicode': True,
            'autocommit': True
        }

# Configuración por defecto
DB_CONFIG = DatabaseConfig()

# Variables de entorno (opcional)
DB_CONFIG.host = os.getenv('DB_HOST', DB_CONFIG.host)
DB_CONFIG.port = int(os.getenv('DB_PORT', DB_CONFIG.port))
DB_CONFIG.database = os.getenv('DB_NAME', DB_CONFIG.database)
DB_CONFIG.user = os.getenv('DB_USER', DB_CONFIG.user)
DB_CONFIG.password = os.getenv('DB_PASSWORD', DB_CONFIG.password)

# Configuración de mapeo de posiciones
POSITION_MAPPING = {
    'GK': 'Portero',
    'DF': 'Defensa', 
    'MF': 'Mediocampo',
    'FW': 'Delantero',
    'CB': 'Defensa Central',
    'LB': 'Lateral Izquierdo',
    'RB': 'Lateral Derecho',
    'CM': 'Mediocampo Central',
    'LM': 'Mediocampo Izquierdo',
    'RM': 'Mediocampo Derecho',
    'AM': 'Mediocampo Ofensivo',
    'DM': 'Mediocampo Defensivo',
    'LW': 'Extremo Izquierdo',
    'RW': 'Extremo Derecho',
    'CF': 'Centrodelantero',
    'ST': 'Delantero'
}

# Configuración de mapeo de países
COUNTRY_MAPPING = {
    'ARG': {'name': 'Argentina', 'fifa_code': 'ARG'},
    'BRA': {'name': 'Brasil', 'fifa_code': 'BRA'},
    'CHI': {'name': 'Chile', 'fifa_code': 'CHI'},
    'COL': {'name': 'Colombia', 'fifa_code': 'COL'},
    'ESP': {'name': 'España', 'fifa_code': 'ESP'},
    'FRA': {'name': 'Francia', 'fifa_code': 'FRA'},
    'GER': {'name': 'Alemania', 'fifa_code': 'GER'},
    'ITA': {'name': 'Italia', 'fifa_code': 'ITA'},
    'MEX': {'name': 'México', 'fifa_code': 'MEX'},
    'PER': {'name': 'Perú', 'fifa_code': 'PER'},
    'URU': {'name': 'Uruguay', 'fifa_code': 'URU'},
    'USA': {'name': 'Estados Unidos', 'fifa_code': 'USA'},
    'ENG': {'name': 'Inglaterra', 'fifa_code': 'ENG'},
    'POR': {'name': 'Portugal', 'fifa_code': 'POR'},
    'PAR': {'name': 'Paraguay', 'fifa_code': 'PAR'},
    'VEN': {'name': 'Venezuela', 'fifa_code': 'VEN'}
    # Agregar más países según necesidades
}

# ################################
# """
# Configuración de conexión a base de datos
# """

# import os
# from dataclasses import dataclass

# @dataclass
# class DatabaseConfig:
#     """Configuración de la base de datos"""
#     host: str = "localhost"
#     port: int = 3306
#     database: str = "MP_DATA_DEV"
#     user: str = "mpuga"
#     password: str = "123qweasd"  # Configurar según tu entorno
#     charset: str = "utf8mb4"

# # Configuración por defecto
# DB_CONFIG = DatabaseConfig()

# # Variables de entorno (opcional)
# DB_CONFIG.host = os.getenv('DB_HOST', DB_CONFIG.host)
# DB_CONFIG.port = int(os.getenv('DB_PORT', DB_CONFIG.port))
# DB_CONFIG.database = os.getenv('DB_NAME', DB_CONFIG.database)
# DB_CONFIG.user = os.getenv('DB_USER', DB_CONFIG.user)
# DB_CONFIG.password = os.getenv('DB_PASSWORD', DB_CONFIG.password)

# # Configuración de mapeo de posiciones
# POSITION_MAPPING = {
#     'GK': 'Portero',
#     'DF': 'Defensa', 
#     'MF': 'Mediocampo',
#     'FW': 'Delantero',
#     'CB': 'Defensa Central',
#     'LB': 'Lateral Izquierdo',
#     'RB': 'Lateral Derecho',
#     'CM': 'Mediocampo Central',
#     'LM': 'Mediocampo Izquierdo',
#     'RM': 'Mediocampo Derecho',
#     'AM': 'Mediocampo Ofensivo',
#     'DM': 'Mediocampo Defensivo',
#     'LW': 'Extremo Izquierdo',
#     'RW': 'Extremo Derecho',
#     'CF': 'Centrodelantero',
#     'ST': 'Delantero'
# }

# # Configuración de mapeo de países
# COUNTRY_MAPPING = {
#     'ARG': {'name': 'Argentina', 'fifa_code': 'ARG'},
#     'BRA': {'name': 'Brasil', 'fifa_code': 'BRA'},
#     'CHI': {'name': 'Chile', 'fifa_code': 'CHI'},
#     'COL': {'name': 'Colombia', 'fifa_code': 'COL'},
#     'ESP': {'name': 'España', 'fifa_code': 'ESP'},
#     'FRA': {'name': 'Francia', 'fifa_code': 'FRA'},
#     'GER': {'name': 'Alemania', 'fifa_code': 'GER'},
#     'ITA': {'name': 'Italia', 'fifa_code': 'ITA'},
#     'MEX': {'name': 'México', 'fifa_code': 'MEX'},
#     'PER': {'name': 'Perú', 'fifa_code': 'PER'},
#     'URU': {'name': 'Uruguay', 'fifa_code': 'URU'},
#     'USA': {'name': 'Estados Unidos', 'fifa_code': 'USA'},
#     'ENG': {'name': 'Inglaterra', 'fifa_code': 'ENG'},
#     'POR': {'name': 'Portugal', 'fifa_code': 'POR'},
#     'PAR': {'name': 'Paraguay', 'fifa_code': 'PAR'},
#     'VEN': {'name': 'Venezuela', 'fifa_code': 'VEN'},
#     # Agregar más países según necesidades
# }