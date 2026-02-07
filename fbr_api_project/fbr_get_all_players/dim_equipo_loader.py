import requests
import time
import mysql.connector
from datetime import datetime
import re

class ChileanTeamsLoader:
    def __init__(self, api_key, db_config):
        self.api_key = api_key
        self.db_config = db_config
        self.connection = None
        
    def connect_db(self):
        """Conecta a la base de datos MySQL"""
        try:
            self.connection = mysql.connector.connect(**self.db_config)
            print("✅ Conexión a base de datos establecida")
            return True
        except mysql.connector.Error as err:
            print(f"❌ Error de conexión a la base de datos: {err}")
            return False
    
    def disconnect_db(self):
        """Desconecta de la base de datos"""
        if self.connection and self.connection.is_connected():
            self.connection.close()
            print("✅ Conexión a base de datos cerrada")
    
    def get_countries(self):
        """Obtiene todos los países disponibles"""
        base_url = "https://fbrapi.com"
        url = f"{base_url}/countries"
        headers = {"X-API-Key": self.api_key}
        
        try:
            print("🔍 Obteniendo lista de países...")
            response = requests.get(url, headers=headers)
            
            if response.status_code == 200:
                return response.json()
            else:
                print(f"❌ Error: {response.status_code}")
                return None
        except Exception as e:
            print(f"❌ Error en la solicitud: {e}")
            return None

    def get_leagues_by_country(self, country_code):
        """Obtiene todas las ligas de un país específico"""
        base_url = "https://fbrapi.com"
        url = f"{base_url}/leagues"
        params = {"country_code": country_code}
        headers = {"X-API-Key": self.api_key}
        
        try:
            print(f"🔍 Obteniendo ligas para {country_code}...")
            response = requests.get(url, params=params, headers=headers)
            
            if response.status_code == 200:
                return response.json()
            else:
                print(f"❌ Error: {response.status_code}")
                return None
        except Exception as e:
            print(f"❌ Error en la solicitud: {e}")
            return None

    def get_team_season_stats(self, league_id, season_id=None):
        """Obtiene estadísticas de temporada de todos los equipos de una liga"""
        base_url = "https://fbrapi.com"
        url = f"{base_url}/team-season-stats"
        params = {"league_id": league_id}
        if season_id:
            params["season_id"] = season_id
        headers = {"X-API-Key": self.api_key}
        
        try:
            print(f"🔍 Obteniendo estadísticas de equipos para liga {league_id}...")
            if season_id:
                print(f"   Temporada: {season_id}")
            response = requests.get(url, params=params, headers=headers)
            
            if response.status_code == 200:
                return response.json()
            else:
                print(f"❌ Error: {response.status_code}")
                return None
        except Exception as e:
            print(f"❌ Error en la solicitud: {e}")
            return None

    def find_chilean_first_division(self):
        """Encuentra la primera división chilena"""
        print(f"{'='*60}")
        print("BUSCANDO PRIMERA DIVISIÓN CHILENA")
        print(f"{'='*60}")
        
        # Buscar Chile en la lista de países
        countries_data = self.get_countries()
        
        if not countries_data:
            print("❌ No se pudieron obtener los países")
            return None
        
        # Buscar Chile
        chile_info = None
        for country in countries_data.get('data', []):
            if country.get('country', '').lower() == 'chile':
                chile_info = country
                break
        
        if not chile_info:
            print("❌ No se encontró Chile en la lista de países")
            return None
        
        print(f"✅ Chile encontrado:")
        print(f"   Código país: {chile_info.get('country_code')}")
        print(f"   Clubes: {chile_info.get('#_clubs')}")
        print(f"   Jugadores: {chile_info.get('#_players')}")
        
        time.sleep(7)
        
        # Obtener ligas de Chile
        leagues_data = self.get_leagues_by_country(chile_info.get('country_code'))
        
        if not leagues_data:
            print("❌ No se pudieron obtener las ligas chilenas")
            return None
        
        # Buscar la primera división (Liga 1)
        primera_division = None
        for league_category in leagues_data.get('data', []):
            if league_category.get('league_type') == 'domestic_leagues':
                leagues = league_category.get('leagues', [])
                
                for league in leagues:
                    # Buscar la liga de primera división (tier = "1st" y masculina)
                    if (league.get('gender') == 'M' and 
                        league.get('tier') == '1st'):
                        primera_division = league
                        break
                
                if primera_division:
                    break
        
        if not primera_division:
            print("❌ No se encontró la primera división chilena")
            return None
        
        print(f"✅ Primera División encontrada:")
        print(f"   ID Liga: {primera_division.get('league_id')}")
        print(f"   Nombre: {primera_division.get('competition_name')}")
        print(f"   Última temporada: {primera_division.get('last_season')}")
        
        return primera_division

    def extract_teams_data(self, stats_data, league_info):
        """Extrae información de equipos para la tabla DIM_EQUIPO"""
        teams = []
        
        if not stats_data or 'data' not in stats_data:
            return teams
        
        print(f"\n{'='*60}")
        print(f"PROCESANDO EQUIPOS DE {league_info.get('competition_name')}")
        print(f"Liga ID: {league_info.get('league_id')} | Temporada: {league_info.get('last_season')}")
        print(f"{'='*60}")
        
        print(f"{'#':<3} {'EQUIPO':<30} {'TEAM_ID_FBR':<12}")
        print("-" * 50)
        
        for i, team_data in enumerate(stats_data['data'], 1):
            meta_data = team_data.get('meta_data', {})
            
            # Extraer ciudad del nombre del equipo (heurística simple)
            team_name = meta_data.get('team_name', '')
            ciudad = self.extract_city_from_team_name(team_name)
            
            team_info = {
                'team_id_fbr': meta_data.get('team_id', ''),
                'nombre': team_name,
                'apodo': None,  # No disponible en la API
                'ciudad': ciudad,
                'fecha_fundacion': None  # No disponible en la API
            }
            
            teams.append(team_info)
            
            # Mostrar en consola
            name = team_info['nombre'][:29]
            team_id = team_info['team_id_fbr'][:11]
            
            print(f"{i:<3} {name:<30} {team_id:<12}")
        
        return teams

    def extract_city_from_team_name(self, team_name):
        """Extrae la ciudad del nombre del equipo usando heurísticas"""
        # Casos específicos conocidos de equipos chilenos
        city_mappings = {
            'Colo-Colo': 'Santiago',
            'Universidad de Chile': 'Santiago',
            'Universidad Católica': 'Santiago',
            'Palestino': 'Santiago',
            'Audax Italiano': 'Santiago',
            'Unión Española': 'Santiago',
            'Magallanes': 'Santiago',
            'Santiago Morning': 'Santiago',
            'Ñublense': 'Chillán',
            'Universidad de Concepción': 'Concepción',
            'Huachipato': 'Talcahuano',
            'Deportes Temuco': 'Temuco',
            'La Serena': 'La Serena',
            'Antofagasta': 'Antofagasta',
            'Cobresal': 'El Salvador',
            'Cobreloa': 'Calama',
            'Everton': 'Viña del Mar',
            'Coquimbo Unido': 'Coquimbo',
            'Deportes Iquique': 'Iquique',
            'O\'Higgins': 'Rancagua',
            'Curicó Unido': 'Curicó',
            'Deportes Copiapó': 'Copiapó'
        }
        
        # Buscar coincidencia exacta
        for team_key, city in city_mappings.items():
            if team_key.lower() in team_name.lower():
                return city
        
        # Si no encuentra coincidencia, intentar extraer de patrones comunes
        # Buscar "de [Ciudad]"
        match = re.search(r'\bde\s+([A-Za-z\s]+)', team_name)
        if match:
            return match.group(1).strip().title()
        
        # Buscar nombres de ciudades conocidas en el nombre
        ciudades_chilenas = [
            'Santiago', 'Valparaíso', 'Concepción', 'La Serena', 'Antofagasta',
            'Temuco', 'Rancagua', 'Talca', 'Chillán', 'Iquique', 'Valdivia',
            'Osorno', 'Calama', 'Copiapó', 'Coquimbo', 'Curicó'
        ]
        
        for ciudad in ciudades_chilenas:
            if ciudad.lower() in team_name.lower():
                return ciudad
        
        return None

    def merge_team_to_db(self, team_data):
        """Realiza MERGE (INSERT o UPDATE) de un equipo en la base de datos"""
        if not self.connection:
            return False
        
        try:
            cursor = self.connection.cursor()
            
            # Query de MERGE usando ON DUPLICATE KEY UPDATE
            merge_query = """
            INSERT INTO DIM_EQUIPO (TEAM_ID_FBR, NOMBRE, APODO, CIUDAD, FECHA_FUNDACION)
            VALUES (%s, %s, %s, %s, %s)
            ON DUPLICATE KEY UPDATE
                NOMBRE = VALUES(NOMBRE),
                APODO = VALUES(APODO),
                CIUDAD = VALUES(CIUDAD),
                FECHA_FUNDACION = VALUES(FECHA_FUNDACION)
            """
            
            values = (
                team_data['team_id_fbr'],
                team_data['nombre'],
                team_data['apodo'],
                team_data['ciudad'],
                team_data['fecha_fundacion']
            )
            
            cursor.execute(merge_query, values)
            self.connection.commit()
            
            # Verificar si fue INSERT o UPDATE
            if cursor.rowcount == 1:
                action = "INSERTADO"
            elif cursor.rowcount == 2:
                action = "ACTUALIZADO"
            else:
                action = "SIN CAMBIOS"
            
            cursor.close()
            return action
            
        except mysql.connector.Error as err:
            print(f"❌ Error en la operación de base de datos: {err}")
            return False

    def load_teams_to_database(self, teams_data):
        """Carga todos los equipos a la base de datos"""
        if not teams_data:
            print("❌ No hay datos de equipos para cargar")
            return
        
        print(f"\n{'='*60}")
        print("CARGANDO EQUIPOS A LA BASE DE DATOS")
        print(f"{'='*60}")
        
        success_count = 0
        insert_count = 0
        update_count = 0
        
        for i, team in enumerate(teams_data, 1):
            print(f"[{i}/{len(teams_data)}] Procesando: {team['nombre']}")
            
            result = self.merge_team_to_db(team)
            
            if result:
                success_count += 1
                if result == "INSERTADO":
                    insert_count += 1
                elif result == "ACTUALIZADO":
                    update_count += 1
                print(f"   ✅ {result}")
            else:
                print(f"   ❌ ERROR al procesar")
        
        print(f"\n{'='*60}")
        print("RESUMEN DE CARGA")
        print(f"{'='*60}")
        print(f"Total equipos procesados: {len(teams_data)}")
        print(f"Operaciones exitosas: {success_count}")
        print(f"Equipos insertados: {insert_count}")
        print(f"Equipos actualizados: {update_count}")
        print(f"Errores: {len(teams_data) - success_count}")

    def run(self):
        """Ejecuta el proceso completo de carga"""
        print(f"{'='*60}")
        print("CARGADOR DE EQUIPOS CHILENOS - DIM_EQUIPO")
        print(f"{'='*60}")
        
        try:
            # 1. Conectar a la base de datos
            if not self.connect_db():
                return
            
            # 2. Encontrar la primera división chilena
            primera_division = self.find_chilean_first_division()
            if not primera_division:
                return
            
            time.sleep(7)
            
            # 3. Obtener datos de equipos
            stats_data = self.get_team_season_stats(
                primera_division.get('league_id'),
                primera_division.get('last_season')
            )
            
            if not stats_data:
                print("❌ No se pudieron obtener datos de equipos")
                return
            
            # 4. Extraer información de equipos
            teams_data = self.extract_teams_data(stats_data, primera_division)
            
            if not teams_data:
                print("❌ No se pudieron extraer datos de equipos")
                return
            
            # 5. Cargar equipos a la base de datos
            self.load_teams_to_database(teams_data)
            
            print(f"\n{'='*60}")
            print("✅ PROCESO COMPLETADO EXITOSAMENTE")
            print(f"{'='*60}")
            
        except KeyboardInterrupt:
            print("\n⚠️ Proceso interrumpido por el usuario")
        except Exception as e:
            print(f"\n❌ Error inesperado: {e}")
        finally:
            self.disconnect_db()


def main():
    # Configuración de la API
    api_key = "AzumZVPR1MlXaroDdCzrE4OT0ezDLMlLDjVCi0Txb0k"
    
    # Configuración de la base de datos
    db_config = {
        'host': '192.168.100.16',
        'port': 3306,
        'database': 'MP_DATA_DEV',
        'user': 'mpuga',
        'password': '123qweasd',
        'charset': 'utf8mb4',
        'collation': 'utf8mb4_general_ci',
        'autocommit': False
    }
    
    print("🔧 CONFIGURACIÓN:")
    print(f"   Base de datos: {db_config['database']}")
    print(f"   Host: {db_config['host']}:{db_config['port']}")
    print(f"   Usuario: {db_config['user']}")
    print(f"   API Key: {api_key[:20]}...")
    
    # Crear y ejecutar el cargador
    loader = ChileanTeamsLoader(api_key, db_config)
    loader.run()


if __name__ == "__main__":
    main()