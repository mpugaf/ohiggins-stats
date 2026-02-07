"""
Importador de jugadores de un equipo específico a la base de datos
"""

from api_client import FBRApiClient
from database_manager import DatabaseManager
from database_config import POSITION_MAPPING, COUNTRY_MAPPING
from utils import safe_get, print_section_header, print_separator
from datetime import datetime
import time

class TeamPlayersImporter:
    """Importa jugadores de un equipo desde la API a la base de datos"""
    
    def __init__(self, api_key):
        self.client = FBRApiClient(api_key)
        self.db = DatabaseManager()
        
    def get_team_data_from_api(self, team_id):
        """Obtiene datos del equipo desde la API"""
        print(f"🔍 Obteniendo datos del equipo {team_id} desde la API...")
        
        # Usar el endpoint teams para obtener roster y schedule
        team_data = self.client.make_request("teams", {"team_id": team_id})
        
        if not team_data:
            print(f"❌ No se pudieron obtener datos del equipo {team_id}")
            return None
            
        return team_data
    
    def process_team_info(self, team_data):
        """Procesa información básica del equipo"""
        # Extraer información del primer partido del schedule para obtener datos del equipo
        if 'team_schedule' in team_data and team_data['team_schedule']['data']:
            first_match = team_data['team_schedule']['data'][0]
            # El nombre del equipo no está directamente en la respuesta, 
            # pero podemos inferirlo del oponente y home_away
            team_name = "Equipo ID: " + str(team_data.get('team_id', 'Unknown'))
            
            # Si hay información adicional del equipo, procesarla aquí
            return {
                'name': team_name,
                'nickname': None,
                'city': None,
                'foundation_date': None
            }
        return None
    
    def import_team_players(self, team_id, season_id=None):
        """Importa todos los jugadores de un equipo a la base de datos"""
        
        print_section_header(f"IMPORTANDO JUGADORES DEL EQUIPO {team_id}")
        
        # Conectar a la base de datos
        if not self.db.connect():
            return False
        
        try:
            # Obtener datos del equipo desde la API
            team_data = self.get_team_data_from_api(team_id)
            
            if not team_data or 'team_roster' not in team_data:
                print("❌ No se encontraron datos del roster del equipo")
                return False
            
            roster_data = team_data['team_roster']['data']
            print(f"📋 Encontrados {len(roster_data)} jugadores en el roster")
            
            # Procesar información del equipo
            team_info = self.process_team_info(team_data)
            if team_info:
                team_db_id = self.db.insert_or_get_team(
                    team_info['name'], 
                    team_info['nickname'], 
                    team_info['city'], 
                    team_info['foundation_date']
                )
                print(f"✅ Equipo procesado con ID en BD: {team_db_id}")
            else:
                # Crear equipo genérico si no tenemos información
                team_name = f"Equipo API ID {team_id}"
                team_db_id = self.db.insert_or_get_team(team_name)
                print(f"✅ Equipo genérico creado con ID en BD: {team_db_id}")
            
            # Contadores para el resumen
            players_processed = 0
            players_inserted = 0
            errors = 0
            
            # Procesar cada jugador
            for i, player in enumerate(roster_data):
                try:
                    print(f"\n👤 Procesando jugador {i+1}/{len(roster_data)}: {player.get('player', 'N/A')}")
                    
                    # Datos básicos del jugador
                    player_name = player.get('player', 'Unknown Player')
                    player_id_api = player.get('player_id', '')
                    nationality = player.get('nationality', '')
                    position = player.get('position', '')
                    age = player.get('age', None)
                    
                    # Insertar jugador en la base de datos
                    player_db_id = self.db.insert_player(
                        player_name=player_name,
                        nickname=None,  # No disponible en la API
                        birth_date=self._calculate_birth_date(age)
                    )
                    
                    if not player_db_id:
                        print(f"⚠️  No se pudo insertar el jugador {player_name}")
                        errors += 1
                        continue
                    
                    players_inserted += 1
                    print(f"   ✅ Jugador insertado con ID: {player_db_id}")
                    
                    # Procesar nacionalidad
                    if nationality and nationality in COUNTRY_MAPPING:
                        country_info = COUNTRY_MAPPING[nationality]
                        country_id = self.db.insert_or_get_country(
                            nationality, 
                            country_info['name']
                        )
                        
                        if country_id:
                            self.db.link_player_country(player_db_id, country_id)
                            print(f"   🌍 Nacionalidad vinculada: {country_info['name']}")
                    
                    # Procesar posición(es)
                    if position:
                        # Las posiciones pueden venir separadas por comas o como string único
                        positions = [pos.strip() for pos in position.split(',') if pos.strip()]
                        
                        for idx, pos in enumerate(positions):
                            position_name = POSITION_MAPPING.get(pos, pos)
                            position_id = self.db.insert_or_get_position(
                                position_name, 
                                f"Posición {position_name}"
                            )
                            
                            if position_id:
                                # La primera posición se marca como principal
                                is_main = (idx == 0)
                                self.db.link_player_position(player_db_id, position_id, is_main)
                                print(f"   ⚽ Posición vinculada: {position_name} {'(Principal)' if is_main else ''}")
                    
                    # Mostrar información procesada
                    print(f"   📊 Edad: {age if age else 'N/A'}")
                    print(f"   🎮 Partidos jugados: {player.get('mp', 'N/A')}")
                    print(f"   🏁 Como titular: {player.get('starts', 'N/A')}")
                    
                    players_processed += 1
                    
                    # Pequeña pausa para no sobrecargar
                    time.sleep(0.1)
                    
                except Exception as e:
                    print(f"❌ Error procesando jugador {player.get('player', 'Unknown')}: {e}")
                    errors += 1
                    continue
            
            # Mostrar resumen final
            print_separator()
            print(f"📊 RESUMEN DE IMPORTACIÓN:")
            print(f"   👥 Jugadores procesados: {players_processed}")
            print(f"   ✅ Jugadores insertados: {players_inserted}")
            print(f"   ❌ Errores: {errors}")
            print(f"   🏆 Equipo ID en BD: {team_db_id}")
            
            return True
            
        except Exception as e:
            print(f"❌ Error general en la importación: {e}")
            return False
            
        finally:
            self.db.disconnect()
    
    def _calculate_birth_date(self, age):
        """Calcula fecha de nacimiento aproximada basada en la edad"""
        if not age or not isinstance(age, int):
            return None
        
        try:
            current_year = datetime.now().year
            birth_year = current_year - age
            # Usar 1 de enero como fecha aproximada
            return f"{birth_year}-01-01"
        except:
            return None
    
    def show_team_players_from_db(self, team_db_id):
        """Muestra jugadores del equipo desde la base de datos"""
        print_section_header(f"JUGADORES DEL EQUIPO (ID BD: {team_db_id})")
        
        if not self.db.connect():
            return False
        
        try:
            players = self.db.get_team_players(team_db_id)
            
            if not players:
                print("❌ No se encontraron jugadores para este equipo en la base de datos")
                return False
            
            print(f"📋 Total de jugadores en BD: {len(players)}")
            print()
            
            # Mostrar jugadores en formato tabla
            print(f"{'#':<3} {'NOMBRE':<25} {'POSICIONES':<20} {'PAÍSES':<15} {'FECHA NAC.':<12}")
            print("-" * 80)
            
            for i, player in enumerate(players, 1):
                nombre = player['JUGADOR'][:24] if player['JUGADOR'] else 'N/A'
                posiciones = player['POSICIONES'][:19] if player['POSICIONES'] else 'N/A'
                paises = player['PAISES'][:14] if player['PAISES'] else 'N/A'
                fecha_nac = str(player['FECHA_NACIMIENTO']) if player['FECHA_NACIMIENTO'] else 'N/A'
                
                print(f"{i:<3} {nombre:<25} {posiciones:<20} {paises:<15} {fecha_nac:<12}")
            
            return True
            
        except Exception as e:
            print(f"❌ Error consultando jugadores: {e}")
            return False
            
        finally:
            self.db.disconnect()

def main():
    # Configuración
    API_KEY = "AzumZVPR1MlXaroDdCzrE4OT0ezDLMlLDjVCi0Txb0k"
    TEAM_ID = "5049d576"  # ID del equipo específico
    
    # Crear importador
    importer = TeamPlayersImporter(API_KEY)
    
    try:
        print("🚀 Iniciando importación de jugadores del equipo...")
        
        # Importar jugadores del equipo
        success = importer.import_team_players(TEAM_ID)
        
        if success:
            print("\n✅ Importación completada exitosamente")
            
            # Mostrar jugadores desde la base de datos
            print("\n" + "="*60)
            print("🔍 Verificando datos importados...")
            
            # Nota: Para mostrar desde BD necesitamos el ID interno del equipo
            # En un caso real, podríamos buscar por nombre o mantener un mapeo
            # Por ahora, usar un ID genérico o buscar el equipo recién creado
            
        else:
            print("\n❌ La importación falló")
            
    except KeyboardInterrupt:
        print("\n⚠️  Proceso interrumpido por el usuario")
    except Exception as e:
        print(f"\n❌ Error inesperado: {e}")

if __name__ == "__main__":
    main()