"""
Importador simplificado de jugadores usando conexión básica
"""

import requests
import time
from simple_database import SimpleDatabase

class SimpleTeamImporter:
    """Importador básico sin complejidades"""
    
    def __init__(self, api_key, db_host="localhost", db_user="mpuga", 
                 db_password="123qweasd", db_name="MP_DATA"):
        self.api_key = api_key
        self.base_url = "https://fbrapi.com"
        self.headers = {"X-API-Key": api_key}
        
        # Conexión simple
        self.db = SimpleDatabase(
            host=db_host,
            user=db_user, 
            password=db_password,
            database=db_name
        )
    
    def get_team_roster(self, team_id):
        """Obtener roster del equipo desde la API"""
        url = f"{self.base_url}/teams"
        params = {"team_id": team_id}
        
        print(f"🔍 Obteniendo datos del equipo {team_id}...")
        
        try:
            response = requests.get(url, params=params, headers=self.headers)
            if response.status_code == 200:
                data = response.json()
                if 'team_roster' in data and 'data' in data['team_roster']:
                    return data['team_roster']['data']
            else:
                print(f"❌ Error API: {response.status_code}")
                print(response.text)
        except Exception as e:
            print(f"❌ Error de conexión: {e}")
        
        return None
    
    def insert_basic_player(self, player_name, position=None, nationality=None, age=None):
        """Insertar jugador básico en la tabla"""
        
        # Verificar si el jugador ya existe
        check_query = "SELECT ID_JUGADOR FROM DIM_JUGADOR WHERE NOMBRE = %s"
        existing = self.db.execute_query(check_query, (player_name,))
        
        if existing:
            print(f"   ⚠️  Jugador {player_name} ya existe (ID: {existing[0][0]})")
            return existing[0][0]
        
        # Insertar nuevo jugador
        insert_query = "INSERT INTO DIM_JUGADOR (NOMBRE, APODO, FECHA_NACIMIENTO) VALUES (%s, %s, %s)"
        
        # Calcular fecha de nacimiento aproximada
        birth_date = None
        if age:
            try:
                from datetime import datetime
                current_year = datetime.now().year
                birth_year = current_year - int(age)
                birth_date = f"{birth_year}-01-01"
            except:
                pass
        
        player_id = self.db.execute_insert(insert_query, (player_name, None, birth_date))
        
        if player_id:
            print(f"   ✅ Jugador insertado: {player_name} (ID: {player_id})")
            return player_id
        else:
            print(f"   ❌ Error insertando: {player_name}")
            return None
    
    def import_team_players(self, team_id):
        """Importar jugadores del equipo"""
        print("="*60)
        print(f"IMPORTANDO JUGADORES DEL EQUIPO {team_id}")
        print("="*60)
        
        # Conectar a la base de datos
        if not self.db.connect():
            return False
        
        try:
            # Obtener roster desde la API
            roster = self.get_team_roster(team_id)
            
            if not roster:
                print("❌ No se pudo obtener el roster del equipo")
                return False
            
            print(f"📋 Encontrados {len(roster)} jugadores")
            
            # Contadores
            successful = 0
            errors = 0
            
            # Procesar cada jugador
            for i, player in enumerate(roster, 1):
                player_name = player.get('player', 'Unknown')
                position = player.get('position', 'N/A')
                nationality = player.get('nationality', 'N/A')
                age = player.get('age', None)
                matches_played = player.get('mp', 'N/A')
                starts = player.get('starts', 'N/A')
                
                print(f"\n👤 {i}/{len(roster)}: {player_name}")
                print(f"   📍 Posición: {position}")
                print(f"   🌍 Nacionalidad: {nationality}")
                print(f"   🎂 Edad: {age}")
                print(f"   🎮 Partidos: {matches_played} | Titular: {starts}")
                
                # Insertar en la base de datos
                player_id = self.insert_basic_player(player_name, position, nationality, age)
                
                if player_id:
                    successful += 1
                else:
                    errors += 1
                
                # Pausa pequeña
                time.sleep(0.2)
            
            # Resumen
            print("\n" + "="*60)
            print("📊 RESUMEN:")
            print(f"   ✅ Exitosos: {successful}")
            print(f"   ❌ Errores: {errors}")
            print(f"   📈 Total: {len(roster)}")
            print("="*60)
            
            return successful > 0
            
        except Exception as e:
            print(f"❌ Error general: {e}")
            return False
            
        finally:
            self.db.disconnect()
    
    def show_imported_players(self):
        """Mostrar jugadores importados"""
        print("\n🔍 JUGADORES EN LA BASE DE DATOS:")
        print("-" * 60)
        
        if not self.db.connect():
            return
        
        try:
            query = """
            SELECT ID_JUGADOR, NOMBRE, FECHA_NACIMIENTO 
            FROM DIM_JUGADOR 
            ORDER BY ID_JUGADOR DESC 
            LIMIT 20
            """
            
            players = self.db.execute_query(query)
            
            if players:
                print(f"{'ID':<5} {'NOMBRE':<30} {'FECHA NACIMIENTO':<15}")
                print("-" * 60)
                
                for player in players:
                    player_id = player[0]
                    name = player[1][:29] if player[1] else 'N/A'
                    birth_date = str(player[2]) if player[2] else 'N/A'
                    print(f"{player_id:<5} {name:<30} {birth_date:<15}")
                
                print(f"\nTotal mostrados: {len(players)} (últimos 20)")
            else:
                print("❌ No se encontraron jugadores")
                
        except Exception as e:
            print(f"❌ Error consultando: {e}")
            
        finally:
            self.db.disconnect()

def main():
    """Función principal"""
    
    # ⚠️ CONFIGURAR ESTOS VALORES
    API_KEY = "AzumZVPR1MlXaroDdCzrE4OT0ezDLMlLDjVCi0Txb0k"
    TEAM_ID = "5049d576"
    
    # ⚠️ CONFIGURAR CREDENCIALES DE BASE DE DATOS
    DB_PASSWORD = ""  # PONER TU CONTRASEÑA AQUÍ
    DB_USER = "mpuga"
    DB_HOST = "localhost"
    DB_NAME = "MP_DATA_DEV"
    
    print("🚀 IMPORTADOR SIMPLIFICADO DE JUGADORES")
    print("="*60)
    
    # Verificar contraseña
    if not DB_PASSWORD:
        print("❌ ERROR: Configura DB_PASSWORD en el código")
        print("   Edita la línea: DB_PASSWORD = 'tu_contraseña'")
        return
    
    # Crear importador
    importer = SimpleTeamImporter(
        api_key=API_KEY,
        db_host=DB_HOST,
        db_user=DB_USER,
        db_password=DB_PASSWORD,
        db_name=DB_NAME
    )
    
    try:
        # Probar conexión primero
        print("🔍 Probando conexión a la base de datos...")
        test_db = SimpleDatabase(DB_HOST, 3306, DB_NAME, DB_USER, DB_PASSWORD)
        
        if not test_db.test_connection():
            print("❌ No se pudo conectar a la base de datos")
            print("💡 Verifica las credenciales y que MySQL esté ejecutándose")
            return
        
        # Importar jugadores
        success = importer.import_team_players(TEAM_ID)
        
        if success:
            print("\n✅ Importación completada")
            # Mostrar jugadores importados
            importer.show_imported_players()
        else:
            print("\n❌ La importación falló")
            
    except KeyboardInterrupt:
        print("\n⚠️ Proceso interrumpido")
    except Exception as e:
        print(f"\n❌ Error inesperado: {e}")

if __name__ == "__main__":
    main()