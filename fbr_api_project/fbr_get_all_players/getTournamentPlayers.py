#!/usr/bin/env python3
"""
Script para obtener jugadores por torneo y equipo de las ligas chilenas
Inserta datos en la tabla DIM_TORNEO_JUGADOR

Este script:
1. Obtiene todas las ligas domésticas masculinas chilenas
2. Para cada liga, obtiene los equipos participantes
3. Para cada equipo, obtiene sus jugadores
4. Inserta la relación torneo-equipo-jugador en la base de datos

Estructura de inserción en DIM_TORNEO_JUGADOR:
- PLAYER_ID_FBR: ID del jugador de la API FBR (clave primaria)
- ID_Equipo: ID del equipo en la base de datos local
- ID_Torneo: ID del torneo en la base de datos local  
- NUMERO_CAMISETA: Número de camiseta del jugador
- FECHA_INCORPORACION: NULL (no disponible en API)
- FECHA_SALIDA: NULL (no disponible en API)
- ESTADO: 'ACTIVO' (asumido si aparece en roster)
- FECHA_CREACION: Timestamp de inserción

Uso: python getTournamentPlayers.py

Requisitos:
- pip install mysql-connector-python requests
- Base de datos MySQL con tablas DIM_TORNEO, DIM_EQUIPO, DIM_TORNEO_JUGADOR
- Los equipos deben existir previamente en DIM_EQUIPO (ejecutar getChileanTeams.py primero)
- Configurar usuario/contraseña MySQL en DB_CONFIG
- Conexión a internet para API calls
- Respetar rate limiting de 7 segundos entre peticiones

IMPORTANTE: 
- Configurar las credenciales MySQL en la variable DB_CONFIG
- Ejecutar primero getChileanTeams.py para cargar los equipos en DIM_EQUIPO

Autor: Sistema de extracción de datos FBR API
Fecha: 2025-06-20
"""

import requests
import mysql.connector
import time
import os
from datetime import datetime
from typing import List, Dict, Optional

# Configuración global
API_BASE_URL = "https://fbrapi.com"
API_KEY = "AzumZVPR1MlXaroDdCzrE4OT0ezDLMlLDjVCi0Txb0k"  # API key del proyecto
CHILE_COUNTRY_CODE = "CHL"
SEASON_2025 = "2025"
REQUEST_DELAY = 7  # segundos entre peticiones para evitar bloqueo

# Configuración de base de datos MySQL
# IMPORTANTE: Configura estas credenciales según tu entorno
DB_CONFIG = {
    'host': '192.168.100.16',
    'port': 3306,
    'database': 'MP_DATA_DEV',
    'user': 'mpuga',  # ⚠️ CAMBIAR: tu usuario MySQL
    'password': '123qweasd',  # ⚠️ CAMBIAR: tu contraseña MySQL
    'charset': 'utf8mb4',
    'use_unicode': True,
    'autocommit': True
}

class ChileanTournamentExtractor:
    """Extractor de datos de torneos chilenos desde FBR API"""
    
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.headers = {"X-API-Key": api_key}
        self.session = requests.Session()
        self.session.headers.update(self.headers)
        
    def make_api_request(self, endpoint: str, params: Dict = None, silent: bool = False) -> Optional[Dict]:
        """Realiza petición a la API con manejo de errores y rate limiting"""
        url = f"{API_BASE_URL}/{endpoint}"
        
        try:
            if not silent:
                print(f"📡 Consultando: {endpoint} con parámetros: {params}")
            response = self.session.get(url, params=params)
            
            if response.status_code == 200:
                return response.json()
            else:
                if not silent:
                    print(f"❌ Error {response.status_code}: {response.text}")
                return None
                
        except Exception as e:
            if not silent:
                print(f"❌ Error en petición: {e}")
            return None
        finally:
            # Respetar rate limiting
            time.sleep(REQUEST_DELAY)
    
    def get_chilean_leagues(self) -> List[Dict]:
        """Obtiene las ligas chilenas disponibles (solo domésticas masculinas)"""
        print(f"\n{'='*60}")
        print("🇨🇱 OBTENIENDO LIGAS CHILENAS")
        print(f"{'='*60}")
        
        # Primero verificar que Chile existe
        countries_data = self.make_api_request("countries")
        if not countries_data:
            print("❌ No se pudieron obtener los países")
            return []
        
        # Buscar Chile
        chile_info = None
        for country in countries_data.get('data', []):
            if country.get('country', '').lower() == 'chile':
                chile_info = country
                break
        
        if not chile_info:
            print("❌ No se encontró Chile en la lista de países")
            return []
        
        print(f"✅ Chile encontrado:")
        print(f"   Código país: {chile_info.get('country_code')}")
        print(f"   Clubes: {chile_info.get('#_clubs')}")
        print(f"   Jugadores: {chile_info.get('#_players')}")
        
        # Obtener ligas chilenas
        leagues_data = self.make_api_request("leagues", {"country_code": chile_info.get('country_code')})
        
        if not leagues_data or 'data' not in leagues_data:
            print("❌ No se pudieron obtener las ligas chilenas")
            return []
        
        chilean_leagues = []
        
        # Filtrar solo ligas domésticas masculinas
        for league_category in leagues_data.get('data', []):
            if league_category.get('league_type') == 'domestic_leagues':
                leagues = league_category.get('leagues', [])
                
                for league in leagues:
                    if league.get('gender') == 'M':  # Solo ligas masculinas
                        league_info = {
                            'league_id': league.get('league_id'),
                            'league_name': league.get('competition_name'),
                            'country_code': chile_info.get('country_code'),
                            'first_season': league.get('first_season'),
                            'last_season': league.get('last_season'),
                            'tier': league.get('tier')
                        }
                        chilean_leagues.append(league_info)
                        print(f"📊 Liga encontrada: {league_info['league_name']} (ID: {league_info['league_id']})")
                        print(f"   Tier: {league_info['tier']} | Temporadas: {league_info['first_season']} - {league_info['last_season']}")
        
        return chilean_leagues
    
    def get_league_season_info(self, league_id: int, season_id: str = None) -> Optional[Dict]:
        """Obtiene información de la temporada para una liga"""
        params = {"league_id": league_id}
        if season_id:
            params["season_id"] = season_id
            
        season_data = self.make_api_request("league-season-details", params)
        
        if season_data and 'data' in season_data:
            return season_data['data']
        return None
    
    def get_teams_from_league(self, league_id: int, season_id: str = None, silent: bool = False) -> List[Dict]:
        """Obtiene equipos de una liga específica en una temporada"""
        params = {"league_id": league_id}
        if season_id:
            params["season_id"] = season_id
            
        stats_data = self.make_api_request("team-season-stats", params, silent=silent)
        
        if not stats_data or 'data' not in stats_data:
            return []
        
        teams = []
        for team_data in stats_data['data']:
            meta_data = team_data.get('meta_data', {})
            team_info = {
                'team_id_fbr': meta_data.get('team_id', ''),
                'team_name': meta_data.get('team_name', ''),
                'league_id': league_id,
                'season_id': season_id or "latest"  # Marcar como "latest" si no se especificó
            }
            teams.append(team_info)
        
        return teams
    
    def get_team_players(self, team_id: str) -> List[Dict]:
        """Obtiene jugadores de un equipo específico"""
        print(f"\n👥 Obteniendo jugadores del equipo {team_id}...")
        
        team_data = self.make_api_request("teams", {"team_id": team_id})
        
        if not team_data or 'team_roster' not in team_data:
            return []
        
        roster_data = team_data['team_roster'].get('data', [])
        players = []
        
        for player in roster_data:
            # Obtener número de camiseta (puede estar en diferentes campos)
            squad_number = player.get('number') or player.get('squad_number')
            
            player_info = {
                'player_id_fbr': player.get('player_id', ''),
                'player_name': player.get('player', ''),
                'position': player.get('position', ''),
                'nationality': player.get('nationality', ''),
                'age': player.get('age'),
                'squad_number': squad_number,  # número de camiseta
                'matches_played': player.get('mp'),
                'starts': player.get('starts')
            }
            players.append(player_info)
            
            number_display = f"#{squad_number}" if squad_number else "Sin #"
            print(f"    👤 {player_info['player_name']} - {number_display} ({player_info['position']})")
        
        return players
    
    def create_database_connection(self):
        """Crea conexión a la base de datos MySQL"""
        try:
            # Conectar sin especificar charset específico para evitar problemas de collation
            conn = mysql.connector.connect(
                host=DB_CONFIG['host'],
                port=DB_CONFIG['port'],
                database=DB_CONFIG['database'],
                user=DB_CONFIG['user'],
                password=DB_CONFIG['password'],
                buffered=True  # Importante para evitar "Unread result found"
            )
            print(f"✅ Conectado a MySQL: {DB_CONFIG['host']}:{DB_CONFIG['port']}/{DB_CONFIG['database']}")
            return conn
        except Exception as e:
            print(f"❌ Error conectando a MySQL: {e}")
            return None
    
    def player_already_exists(self, conn, player_id_fbr: str, team_id_db: int, tournament_id_db: int) -> bool:
        """Verifica si el jugador ya existe en la relación torneo-equipo"""
        cursor = None
        try:
            cursor = conn.cursor(buffered=True)
            cursor.execute("""
                SELECT COUNT(*) FROM DIM_TORNEO_JUGADOR 
                WHERE PLAYER_ID_FBR = %s AND ID_EQUIPO = %s AND ID_TORNEO = %s
            """, (player_id_fbr, team_id_db, tournament_id_db))
            result = cursor.fetchone()
            return result[0] > 0 if result else False
        except Exception as e:
            print(f"❌ Error verificando jugador existente: {e}")
            return False
        finally:
            if cursor:
                cursor.close()
    
    def insert_tournament_player(self, conn, player_data: Dict):
        """Inserta un registro en la tabla DIM_TORNEO_JUGADOR"""
        # Verificar si ya existe
        if self.player_already_exists(conn, player_data['player_id_fbr'], 
                                    player_data['team_id_db'], player_data['tournament_id_db']):
            print(f"    ⚠️ Saltando {player_data['player_id_fbr']} - ya existe en torneo")
            return True
        
        insert_query = """
        INSERT INTO DIM_TORNEO_JUGADOR (
            PLAYER_ID_FBR,
            ID_EQUIPO,
            ID_TORNEO,
            NUMERO_CAMISETA,
            FECHA_INCORPORACION,
            FECHA_SALIDA,
            ESTADO,
            FECHA_CREACION
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """
        
        values = (
            player_data['player_id_fbr'],
            player_data['team_id_db'],
            player_data['tournament_id_db'],
            player_data.get('squad_number'),
            player_data.get('fecha_incorporacion'),
            player_data.get('fecha_salida'),
            player_data.get('estado'),
            datetime.now()
        )
        
        cursor = None
        try:
            cursor = conn.cursor(buffered=True)
            cursor.execute(insert_query, values)
            conn.commit()
            return True
        except Exception as e:
            print(f"❌ Error insertando jugador {player_data['player_id_fbr']}: {e}")
            return False
        finally:
            if cursor:
                cursor.close()
    
    def get_or_create_team_id(self, conn, team_fbr_id: str, team_name: str) -> Optional[int]:
        """Obtiene el ID del equipo en la base de datos local (asume que ya existe)"""
        cursor = None
        try:
            cursor = conn.cursor(buffered=True)
            
            # Buscar el equipo existente
            cursor.execute("SELECT ID_EQUIPO FROM DIM_EQUIPO WHERE TEAM_ID_FBR = %s", (team_fbr_id,))
            result = cursor.fetchone()
            
            if result:
                return result[0]
            else:
                print(f"⚠️ Equipo {team_name} (ID: {team_fbr_id}) no encontrado en DIM_EQUIPO")
                return None
        except Exception as e:
            print(f"❌ Error buscando equipo {team_name}: {e}")
            return None
        finally:
            if cursor:
                cursor.close()
    
    def get_or_create_tournament_id(self, conn, league_id: int, season_id: str, league_name: str) -> Optional[int]:
        """Obtiene o crea el ID del torneo en la base de datos local"""
        cursor = None
        try:
            cursor = conn.cursor(buffered=True)
            
            # Buscar torneo existente
            cursor.execute("""
                SELECT ID_TORNEO FROM DIM_TORNEO 
                WHERE LEAGUE_ID_FBR = %s AND TEMPORADA = %s
            """, (league_id, season_id))
            result = cursor.fetchone()
            
            if result:
                print(f"✅ Torneo encontrado: {league_name} (ID: {result[0]})")
                return result[0]
        except Exception as e:
            print(f"❌ Error buscando torneo {league_name}: {e}")
            return None
        finally:
            if cursor:
                cursor.close()
        
        # Si no existe, crearlo con un nuevo cursor
        cursor = None
        try:
            cursor = conn.cursor(buffered=True)
            cursor.execute("""
                INSERT INTO DIM_TORNEO (LEAGUE_ID_FBR, NOMBRE, TEMPORADA, PAIS_ORGANIZADOR, RUEDA)
                VALUES (%s, %s, %s, %s, %s)
            """, (league_id, league_name, season_id, 'CHI', 'UNICA'))
            conn.commit()
            tournament_id = cursor.lastrowid
            print(f"✅ Torneo creado: {league_name} (ID: {tournament_id})")
            return tournament_id
        except Exception as e:
            print(f"❌ Error creando torneo {league_name}: {e}")
            return None
        finally:
            if cursor:
                cursor.close()
    
    def process_all_chilean_tournaments(self):
        """Proceso principal: obtiene todos los datos y los inserta en la BD"""
        print(f"\n{'='*80}")
        print("🚀 INICIANDO EXTRACCIÓN DE TORNEOS CHILENOS 2025")
        print(f"{'='*80}")
        
        # Conectar a la base de datos
        conn = self.create_database_connection()
        if not conn:
            print("❌ No se pudo conectar a la base de datos")
            return

        try:
            # 1. Obtener ligas chilenas
            leagues = self.get_chilean_leagues()
            if not leagues:
                print("❌ No se encontraron ligas chilenas")
                return
            
            total_players_inserted = 0
            
            # 2. Procesar cada liga
            for league in leagues:
                league_id = league['league_id']
                league_name = league['league_name']
                latest_season = league['last_season']  # Usar la temporada más reciente disponible
                
                print(f"\n{'='*60}")
                print(f"📊 PROCESANDO LIGA: {league_name}")
                print(f"📅 Temporada más reciente: {latest_season}")
                print(f"{'='*60}")
                
                # 3. Intentar diferentes formatos de temporada
                season_formats = [latest_season]
                if latest_season == "2025":
                    season_formats = ["2025", "2024-2025", "2024", None]  # None = temporada más reciente
                elif latest_season and len(latest_season) == 4:
                    # Si es un año de 4 dígitos, intentar formato cruzado
                    year = int(latest_season)
                    season_formats.extend([f"{year-1}-{latest_season}", None])
                else:
                    season_formats.append(None)  # Siempre intentar sin season_id como último recurso
                
                teams = None
                working_season = None
                
                # 4. Intentar obtener equipos con diferentes formatos de temporada
                for i, season_format in enumerate(season_formats):
                    season_display = season_format if season_format else "temporada más reciente"
                    print(f"🔍 Intentando temporada: {season_display}")
                    # Usar silent=True para las pruebas adicionales (no la primera)
                    teams = self.get_teams_from_league(league_id, season_format, silent=(i > 0))
                    if teams:
                        working_season = season_format or "latest"
                        print(f"✅ Encontrados {len(teams)} equipos para temporada {season_display}")
                        # Mostrar los equipos encontrados
                        for team in teams:
                            print(f"  ⚽ Equipo: {team['team_name']} (ID: {team['team_id_fbr']})")
                        break
                    else:
                        print(f"⚠️ No se encontraron equipos para temporada {season_display}")
                
                if not teams:
                    print(f"❌ No se encontraron equipos en ningún formato de temporada para {league_name}")
                    continue
                
                # 5. Obtener o crear ID del torneo en BD
                tournament_id_db = self.get_or_create_tournament_id(
                    conn, league_id, working_season, league_name
                )
                if not tournament_id_db:
                    print(f"❌ No se pudo crear/obtener ID de torneo para {league_name}")
                    continue
                
                # 6. Procesar cada equipo
                for team in teams:
                    team_fbr_id = team['team_id_fbr']
                    team_name = team['team_name']
                    
                    print(f"\n🏟️ Procesando equipo: {team_name}")
                    
                    # 7. Buscar ID del equipo en BD (debe existir previamente)
                    team_id_db = self.get_or_create_team_id(conn, team_fbr_id, team_name)
                    if not team_id_db:
                        print(f"⚠️ Saltando equipo {team_name} - no existe en DIM_EQUIPO")
                        continue
                    
                    # 8. Obtener jugadores del equipo
                    players = self.get_team_players(team_fbr_id)
                    
                    if not players:
                        print(f"⚠️ No se encontraron jugadores para {team_name}")
                        continue
                    
                    # 9. Insertar cada jugador en DIM_TORNEO_JUGADOR
                    team_player_count = 0
                    for player in players:
                        if not player['player_id_fbr']:  # Saltar jugadores sin ID
                            print(f"    ⚠️ Saltando {player['player_name']} - sin ID de FBR")
                            continue
                            
                        player_data = {
                            'player_id_fbr': player['player_id_fbr'],
                            'team_id_db': team_id_db,
                            'tournament_id_db': tournament_id_db,
                            'squad_number': player.get('squad_number'),
                            'fecha_incorporacion': None,
                            'fecha_salida': None,
                            'estado': 'ACTIVO'
                        }
                        
                        if self.insert_tournament_player(conn, player_data):
                            team_player_count += 1
                            total_players_inserted += 1
                            print(f"    ✅ Insertado: {player['player_name']}")
                        else:
                            print(f"    ❌ Error insertando: {player['player_name']}")
                    
                    print(f"  📊 Equipo {team_name}: {team_player_count} jugadores insertados")
            
            print(f"\n{'='*80}")
            print(f"🎉 PROCESO COMPLETADO")
            print(f"Total de jugadores insertados: {total_players_inserted}")
            print(f"{'='*80}")
            
        except Exception as e:
            print(f"❌ Error en el proceso principal: {e}")
            import traceback
            traceback.print_exc()
        finally:
            if conn:
                conn.close()
                print("🔌 Conexión a base de datos cerrada")

def main():
    """Función principal"""
    print(f"🚀 Iniciando extracción de datos de torneos chilenos...")
    print(f"🔑 Usando API Key del proyecto")
    print(f"🗄️ Conectando a MySQL: {DB_CONFIG['host']}:{DB_CONFIG['port']}/{DB_CONFIG['database']}")
    print(f"⚠️  NOTA: Asegúrate de configurar usuario/contraseña MySQL en DB_CONFIG")
    
    # Crear el extractor
    extractor = ChileanTournamentExtractor(API_KEY)
    
    # Ejecutar el proceso
    extractor.process_all_chilean_tournaments()

if __name__ == "__main__":
    main()