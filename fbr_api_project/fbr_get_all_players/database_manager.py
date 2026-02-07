"""
Gestor de conexión y operaciones de base de datos
"""

import mysql.connector
from mysql.connector import Error
from database_config import DB_CONFIG
from datetime import datetime
from typing import Optional, Dict, List, Any

class DatabaseManager:
    """Gestor de operaciones de base de datos"""
    
    def __init__(self):
        self.connection = None
        self.cursor = None
    
    def connect(self):
        """Establece conexión con la base de datos"""
        try:
            # Usar parámetros de conexión sin collation problemática
            connection_params = DB_CONFIG.get_connection_params()
            
            self.connection = mysql.connector.connect(**connection_params)
            
            if self.connection.is_connected():
                self.cursor = self.connection.cursor(dictionary=True)
                
                # Verificar versión de MySQL/MariaDB
                version_query = "SELECT VERSION() as version"
                self.cursor.execute(version_query)
                version_info = self.cursor.fetchone()
                
                print(f"✅ Conexión exitosa a la base de datos: {DB_CONFIG.database}")
                print(f"🔧 Versión del servidor: {version_info['version']}")
                
                # Configurar charset y collation de forma segura
                try:
                    self.cursor.execute("SET NAMES utf8mb4 COLLATE utf8mb4_general_ci")
                    print(f"✅ Charset configurado: utf8mb4_general_ci")
                except Error as charset_error:
                    print(f"⚠️  Warning charset: {charset_error}")
                    # Intentar con utf8 básico si utf8mb4 falla
                    try:
                        self.cursor.execute("SET NAMES utf8")
                        print(f"✅ Charset configurado: utf8 (fallback)")
                    except Error:
                        print(f"⚠️  Usando charset por defecto del servidor")
                
                return True
                
        except Error as e:
            print(f"❌ Error al conectar a la base de datos: {e}")
            print(f"💡 Sugerencias:")
            print(f"   - Verificar que MySQL/MariaDB esté ejecutándose")
            print(f"   - Verificar credenciales en database_config.py")
            print(f"   - Verificar que la base de datos '{DB_CONFIG.database}' exista")
            print(f"   - Tu versión de MySQL/MariaDB: probablemente < 8.0")
            return False
    
    def disconnect(self):
        """Cierra la conexión con la base de datos"""
        if self.cursor:
            self.cursor.close()
        if self.connection and self.connection.is_connected():
            self.connection.close()
            print("🔌 Conexión cerrada")
    
    def execute_query(self, query: str, params: tuple = None) -> Optional[List[Dict]]:
        """Ejecuta una consulta SELECT"""
        try:
            if params:
                self.cursor.execute(query, params)
            else:
                self.cursor.execute(query)
            return self.cursor.fetchall()
        except Error as e:
            print(f"❌ Error en consulta: {e}")
            return None
    
    def execute_insert(self, query: str, params: tuple = None) -> Optional[int]:
        """Ejecuta una consulta INSERT y retorna el ID insertado"""
        try:
            if params:
                self.cursor.execute(query, params)
            else:
                self.cursor.execute(query)
            return self.cursor.lastrowid
        except Error as e:
            print(f"❌ Error en inserción: {e}")
            return None
    
    def execute_batch_insert(self, query: str, data: List[tuple]) -> bool:
        """Ejecuta múltiples inserciones"""
        try:
            self.cursor.executemany(query, data)
            print(f"✅ Insertados {self.cursor.rowcount} registros")
            return True
        except Error as e:
            print(f"❌ Error en inserción por lotes: {e}")
            return False
    
    # Métodos específicos para el modelo de datos
    
    def insert_or_get_country(self, country_code: str, country_name: str) -> Optional[int]:
        """Inserta o obtiene el ID de un país"""
        # Verificar si existe
        query = "SELECT ID_PAIS FROM DIM_PAIS WHERE CODIGO_FIFA = %s"
        result = self.execute_query(query, (country_code,))
        
        if result:
            return result[0]['ID_PAIS']
        
        # Insertar nuevo país
        query = "INSERT INTO DIM_PAIS (NOMBRE, CODIGO_FIFA) VALUES (%s, %s)"
        return self.execute_insert(query, (country_name, country_code))
    
    def insert_or_get_position(self, position_name: str, description: str = None) -> Optional[int]:
        """Inserta o obtiene el ID de una posición"""
        # Verificar si existe
        query = "SELECT ID_POSICION FROM DIM_POSICION WHERE NOMBRE = %s"
        result = self.execute_query(query, (position_name,))
        
        if result:
            return result[0]['ID_POSICION']
        
        # Insertar nueva posición
        query = "INSERT INTO DIM_POSICION (NOMBRE, DESCRIPCION) VALUES (%s, %s)"
        return self.execute_insert(query, (position_name, description))
    
    def insert_or_get_team(self, team_name: str, team_nickname: str = None, 
                          city: str = None, foundation_date: str = None) -> Optional[int]:
        """Inserta o obtiene el ID de un equipo"""
        # Verificar si existe
        query = "SELECT ID_EQUIPO FROM DIM_EQUIPO WHERE NOMBRE = %s"
        result = self.execute_query(query, (team_name,))
        
        if result:
            return result[0]['ID_EQUIPO']
        
        # Insertar nuevo equipo
        query = """INSERT INTO DIM_EQUIPO (NOMBRE, APODO, CIUDAD, FECHA_FUNDACION) 
                   VALUES (%s, %s, %s, %s)"""
        
        # Convertir fecha si es string
        fecha_fundacion = None
        if foundation_date:
            try:
                fecha_fundacion = datetime.strptime(foundation_date, '%Y-%m-%d').date()
            except (ValueError, TypeError):
                fecha_fundacion = None
        
        return self.execute_insert(query, (team_name, team_nickname, city, fecha_fundacion))
    
    def insert_player(self, player_name: str, nickname: str = None, 
                     birth_date: str = None) -> Optional[int]:
        """Inserta un jugador"""
        query = "INSERT INTO DIM_JUGADOR (NOMBRE, APODO, FECHA_NACIMIENTO) VALUES (%s, %s, %s)"
        
        # Convertir fecha si es string
        fecha_nacimiento = None
        if birth_date:
            try:
                fecha_nacimiento = datetime.strptime(birth_date, '%Y-%m-%d').date()
            except (ValueError, TypeError):
                fecha_nacimiento = None
        
        return self.execute_insert(query, (player_name, nickname, fecha_nacimiento))
    
    def link_player_country(self, player_id: int, country_id: int) -> bool:
        """Vincula un jugador con un país"""
        query = """INSERT IGNORE INTO DIM_JUGADOR_PAIS (ID_JUGADOR, ID_PAIS) 
                   VALUES (%s, %s)"""
        result = self.execute_insert(query, (player_id, country_id))
        return result is not None
    
    def link_player_position(self, player_id: int, position_id: int, 
                           is_main_position: bool = False) -> bool:
        """Vincula un jugador con una posición"""
        query = """INSERT IGNORE INTO DIM_JUGADOR_POSICION 
                   (ID_JUGADOR, ID_POSICION, ES_POSICION_PRINCIPAL) 
                   VALUES (%s, %s, %s)"""
        result = self.execute_insert(query, (player_id, position_id, is_main_position))
        return result is not None
    
    def get_player_by_name(self, player_name: str) -> Optional[Dict]:
        """Obtiene un jugador por nombre"""
        query = "SELECT * FROM DIM_JUGADOR WHERE NOMBRE = %s"
        result = self.execute_query(query, (player_name,))
        return result[0] if result else None
    
    def get_team_players(self, team_id: int) -> List[Dict]:
        """Obtiene todos los jugadores de un equipo desde la base de datos"""
        query = """
        SELECT 
            j.ID_JUGADOR,
            j.NOMBRE as JUGADOR,
            j.APODO,
            j.FECHA_NACIMIENTO,
            GROUP_CONCAT(DISTINCT pos.NOMBRE) as POSICIONES,
            GROUP_CONCAT(DISTINCT p.NOMBRE) as PAISES
        FROM DIM_JUGADOR j
        LEFT JOIN DIM_JUGADOR_POSICION jp ON j.ID_JUGADOR = jp.ID_JUGADOR
        LEFT JOIN DIM_POSICION pos ON jp.ID_POSICION = pos.ID_POSICION
        LEFT JOIN DIM_JUGADOR_PAIS jpa ON j.ID_JUGADOR = jpa.ID_JUGADOR
        LEFT JOIN DIM_PAIS p ON jpa.ID_PAIS = p.ID_PAIS
        LEFT JOIN DIM_TORNEO_JUGADOR tj ON j.ID_JUGADOR = tj.ID_JUGADOR
        WHERE tj.ID_EQUIPO = %s
        GROUP BY j.ID_JUGADOR, j.NOMBRE, j.APODO, j.FECHA_NACIMIENTO
        ORDER BY j.NOMBRE
        """
        return self.execute_query(query, (team_id,))
    
    def __enter__(self):
        """Context manager entry"""
        if self.connect():
            return self
        else:
            raise Exception("No se pudo establecer conexión con la base de datos")
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        """Context manager exit"""
        self.disconnect()