#!/usr/bin/env python3
"""
Validador para verificar que el pipeline de datos funcionó correctamente
"""

import mysql.connector
from mysql.connector import Error
import pandas as pd
import logging

# Configurar logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

class PipelineValidator:
    def __init__(self, db_config):
        self.db_config = db_config
        self.connection = None
        self.cursor = None
    
    def connect_database(self):
        """Establecer conexión con la base de datos"""
        try:
            self.connection = mysql.connector.connect(**self.db_config)
            self.cursor = self.connection.cursor()
            logging.info("✅ Conexión exitosa a la base de datos")
            return True
        except Error as e:
            logging.error(f"❌ Error conectando a la base de datos: {e}")
            return False
    
    def disconnect_database(self):
        """Cerrar conexión"""
        if self.cursor:
            self.cursor.close()
        if self.connection:
            self.connection.close()
    
    def validate_jugadores(self):
        """Validar datos de jugadores"""
        print("\n" + "="*60)
        print("🧪 VALIDACIÓN DE JUGADORES")
        print("="*60)
        
        # Contar total de jugadores
        self.cursor.execute("SELECT COUNT(*) FROM DIM_JUGADOR WHERE PLAYER_ID_FBR IS NOT NULL")
        total_jugadores = self.cursor.fetchone()[0]
        print(f"📊 Total de jugadores con PLAYER_ID_FBR: {total_jugadores}")
        
        # Jugadores con datos completos
        self.cursor.execute("""
            SELECT COUNT(*) FROM DIM_JUGADOR 
            WHERE PLAYER_ID_FBR IS NOT NULL 
            AND NOMBRE IS NOT NULL 
            AND FECHA_NACIMIENTO IS NOT NULL
        """)
        completos = self.cursor.fetchone()[0]
        print(f"✅ Jugadores con datos básicos completos: {completos}")
        
        # Mostrar algunos ejemplos
        self.cursor.execute("""
            SELECT PLAYER_ID_FBR, NOMBRE, FECHA_NACIMIENTO, ALTURA_CM, PESO_KG 
            FROM DIM_JUGADOR 
            WHERE PLAYER_ID_FBR IS NOT NULL 
            ORDER BY ID_JUGADOR DESC 
            LIMIT 5
        """)
        
        print(f"\n🔍 Últimos 5 jugadores insertados:")
        for row in self.cursor.fetchall():
            print(f"   {row[0]} | {row[1]} | {row[2]} | {row[3]}cm | {row[4]}kg")
    
    def validate_paises(self):
        """Validar datos de países"""
        print("\n" + "="*60)
        print("🌍 VALIDACIÓN DE PAÍSES")
        print("="*60)
        
        self.cursor.execute("SELECT COUNT(*) FROM DIM_PAIS")
        total_paises = self.cursor.fetchone()[0]
        print(f"📊 Total de países: {total_paises}")
        
        self.cursor.execute("SELECT CODIGO_FIFA, NOMBRE_COMPLETO FROM DIM_PAIS ORDER BY CODIGO_FIFA")
        print(f"\n🗺️  Países disponibles:")
        for row in self.cursor.fetchall():
            print(f"   {row[0]} | {row[1]}")
    
    def validate_posiciones(self):
        """Validar datos de posiciones"""
        print("\n" + "="*60)
        print("⚽ VALIDACIÓN DE POSICIONES")
        print("="*60)
        
        self.cursor.execute("SELECT COUNT(*) FROM DIM_POSICION")
        total_posiciones = self.cursor.fetchone()[0]
        print(f"📊 Total de posiciones: {total_posiciones}")
        
        self.cursor.execute("SELECT NOMBRE, DESCRIPCION FROM DIM_POSICION ORDER BY NOMBRE")
        print(f"\n🎯 Posiciones disponibles:")
        for row in self.cursor.fetchall():
            print(f"   {row[0]} | {row[1]}")
    
    def validate_relaciones(self):
        """Validar relaciones entre tablas"""
        print("\n" + "="*60)
        print("🔗 VALIDACIÓN DE RELACIONES")
        print("="*60)
        
        # Relaciones jugador-país
        self.cursor.execute("""
            SELECT COUNT(*) FROM DIM_JUGADOR_PAIS jp
            JOIN DIM_JUGADOR j ON jp.ID_JUGADOR = j.ID_JUGADOR
            WHERE j.PLAYER_ID_FBR IS NOT NULL
        """)
        rel_pais = self.cursor.fetchone()[0]
        print(f"🌍 Relaciones jugador-país: {rel_pais}")
        
        # Relaciones jugador-posición
        self.cursor.execute("""
            SELECT COUNT(*) FROM DIM_JUGADOR_POSICION jp
            JOIN DIM_JUGADOR j ON jp.ID_JUGADOR = j.ID_JUGADOR
            WHERE j.PLAYER_ID_FBR IS NOT NULL
        """)
        rel_posicion = self.cursor.fetchone()[0]
        print(f"⚽ Relaciones jugador-posición: {rel_posicion}")
        
        # Ejemplo de jugadores con sus países y posiciones
        self.cursor.execute("""
            SELECT j.NOMBRE, p.CODIGO_FIFA, pos.NOMBRE as POSICION
            FROM DIM_JUGADOR j
            LEFT JOIN DIM_JUGADOR_PAIS jp ON j.ID_JUGADOR = jp.ID_JUGADOR
            LEFT JOIN DIM_PAIS p ON jp.ID_PAIS = p.ID_PAIS
            LEFT JOIN DIM_JUGADOR_POSICION jpos ON j.ID_JUGADOR = jpos.ID_JUGADOR
            LEFT JOIN DIM_POSICION pos ON jpos.ID_POSICION = pos.ID_POSICION
            WHERE j.PLAYER_ID_FBR IS NOT NULL
            ORDER BY j.NOMBRE
            LIMIT 10
        """)
        
        print(f"\n🔍 Ejemplo de jugadores con relaciones:")
        print(f"{'NOMBRE':<25} {'PAÍS':<6} {'POSICIÓN':<10}")
        print("-" * 45)
        for row in self.cursor.fetchall():
            nombre = row[0][:24] if row[0] else 'N/A'
            pais = row[1] if row[1] else 'N/A'
            posicion = row[2] if row[2] else 'N/A'
            print(f"{nombre:<25} {pais:<6} {posicion:<10}")
    
    def validate_data_integrity(self):
        """Validar integridad de datos"""
        print("\n" + "="*60)
        print("🔍 VALIDACIÓN DE INTEGRIDAD")
        print("="*60)
        
        # Verificar jugadores duplicados por PLAYER_ID_FBR
        self.cursor.execute("""
            SELECT PLAYER_ID_FBR, COUNT(*) as cantidad
            FROM DIM_JUGADOR 
            WHERE PLAYER_ID_FBR IS NOT NULL
            GROUP BY PLAYER_ID_FBR 
            HAVING COUNT(*) > 1
        """)
        duplicados = self.cursor.fetchall()
        
        if duplicados:
            print(f"⚠️  PLAYER_ID_FBR duplicados encontrados: {len(duplicados)}")
            for dup in duplicados:
                print(f"   {dup[0]} aparece {dup[1]} veces")
        else:
            print("✅ No hay PLAYER_ID_FBR duplicados")
        
        # Verificar jugadores sin país
        self.cursor.execute("""
            SELECT COUNT(*) FROM DIM_JUGADOR j
            LEFT JOIN DIM_JUGADOR_PAIS jp ON j.ID_JUGADOR = jp.ID_JUGADOR
            WHERE j.PLAYER_ID_FBR IS NOT NULL AND jp.ID_JUGADOR IS NULL
        """)
        sin_pais = self.cursor.fetchone()[0]
        print(f"⚠️  Jugadores sin país asignado: {sin_pais}")
        
        # Verificar jugadores sin posición
        self.cursor.execute("""
            SELECT COUNT(*) FROM DIM_JUGADOR j
            LEFT JOIN DIM_JUGADOR_POSICION jp ON j.ID_JUGADOR = jp.ID_JUGADOR
            WHERE j.PLAYER_ID_FBR IS NOT NULL AND jp.ID_JUGADOR IS NULL
        """)
        sin_posicion = self.cursor.fetchone()[0]
        print(f"⚠️  Jugadores sin posición asignada: {sin_posicion}")
    
    def generate_summary_report(self):
        """Generar reporte resumen"""
        print("\n" + "="*60)
        print("📋 REPORTE RESUMEN")
        print("="*60)
        
        # Estadísticas por país
        self.cursor.execute("""
            SELECT p.CODIGO_FIFA, p.NOMBRE_COMPLETO, COUNT(j.ID_JUGADOR) as cantidad
            FROM DIM_PAIS p
            LEFT JOIN DIM_JUGADOR_PAIS jp ON p.ID_PAIS = jp.ID_PAIS
            LEFT JOIN DIM_JUGADOR j ON jp.ID_JUGADOR = j.ID_JUGADOR AND j.PLAYER_ID_FBR IS NOT NULL
            GROUP BY p.ID_PAIS
            ORDER BY cantidad DESC
        """)
        
        print(f"\n🌍 Jugadores por país:")
        for row in self.cursor.fetchall():
            print(f"   {row[0]} ({row[1]}): {row[2]} jugadores")
        
        # Estadísticas por posición
        self.cursor.execute("""
            SELECT pos.NOMBRE, COUNT(j.ID_JUGADOR) as cantidad
            FROM DIM_POSICION pos
            LEFT JOIN DIM_JUGADOR_POSICION jp ON pos.ID_POSICION = jp.ID_POSICION
            LEFT JOIN DIM_JUGADOR j ON jp.ID_JUGADOR = j.ID_JUGADOR AND j.PLAYER_ID_FBR IS NOT NULL
            GROUP BY pos.ID_POSICION
            ORDER BY cantidad DESC
        """)
        
        print(f"\n⚽ Jugadores por posición:")
        for row in self.cursor.fetchall():
            print(f"   {row[0]}: {row[1]} jugadores")
    
    def run_validation(self):
        """Ejecutar validación completa"""
        print("🧪 INICIANDO VALIDACIÓN DEL PIPELINE")
        
        try:
            if not self.connect_database():
                return False
            
            self.validate_jugadores()
            self.validate_paises()
            self.validate_posiciones()
            self.validate_relaciones()
            self.validate_data_integrity()
            self.generate_summary_report()
            
            print("\n" + "="*60)
            print("✅ VALIDACIÓN COMPLETADA EXITOSAMENTE")
            print("="*60)
            
            return True
            
        except Exception as e:
            logging.error(f"❌ Error en validación: {e}")
            return False
        finally:
            self.disconnect_database()

def main():
    """Función principal"""
    # Intentar cargar configuración desde archivo temporal
    try:
        from temp_db_config import DB_CONFIG
        print("✅ Configuración cargada desde archivo temporal")
    except ImportError:
        # Configuración por defecto
        DB_CONFIG = {
            'host': 'localhost',
            'port': 3306,
            'user': 'mpuga',  # Cambiar por tu usuario
            'password': 'tu_password',  # Cambiar por tu contraseña
            'database': 'MP_DATA_DEV',
            'charset': 'utf8mb4'
        }
        print("⚠️ Usando configuración por defecto - actualiza las credenciales")
    
    validator = PipelineValidator(DB_CONFIG)
    validator.run_validation()

if __name__ == "__main__":
    main()