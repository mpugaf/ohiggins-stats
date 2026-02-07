import csv
import json
from datetime import datetime
import os

class PlayerDataPipeline:
    def __init__(self, csv_file_path):
        self.csv_file_path = csv_file_path
        self.players_data = []
        self.paises_data = {}
        self.posiciones_data = {}
        self.equipos_data = {}
        self.torneo_data = {}
        
        # IDs autoincrementales simulados
        self.next_player_id = 1
        self.next_pais_id = 1
        self.next_posicion_id = 1
        self.next_equipo_id = 1
        self.next_torneo_id = 1
        self.next_torneo_jugador_id = 1
        
    def load_csv_data(self):
        """Carga los datos del archivo CSV"""
        print("📁 Cargando datos del archivo CSV...")
        
        try:
            with open(self.csv_file_path, 'r', encoding='utf-8') as file:
                csv_reader = csv.DictReader(file)
                self.players_data = list(csv_reader)
            
            print(f"✅ Cargados {len(self.players_data)} registros de jugadores")
            return True
            
        except Exception as e:
            print(f"❌ Error al cargar CSV: {e}")
            return False
    
    def process_dim_pais(self):
        """Procesa y crea datos para la tabla DIM_PAIS"""
        print("\n🌍 Procesando DIM_PAIS...")
        
        paises_unicos = {}
        
        for player in self.players_data:
            # Procesar nacionalidad
            if player.get('nacionalidad_codigo') and player.get('pais_nacimiento'):
                codigo = player['nacionalidad_codigo']
                nombre = player['pais_nacimiento']
                
                # Corrección de inconsistencias detectadas en el análisis
                if codigo == 'CHI' and nombre in ['Ecuador', 'Colombia', 'Argentina']:
                    # Estas son inconsistencias en los datos, usar el país de nacimiento
                    if nombre == 'Ecuador':
                        codigo = 'ECU'
                    elif nombre == 'Colombia':
                        codigo = 'COL'
                    elif nombre == 'Argentina':
                        codigo = 'ARG'
                
                if codigo not in paises_unicos:
                    paises_unicos[codigo] = {
                        'ID_PAIS': self.next_pais_id,
                        'NOMBRE': nombre,
                        'CODIGO_FIFA': codigo
                    }
                    self.next_pais_id += 1
        
        # Agregar países faltantes manualmente si es necesario
        paises_adicionales = {
            'PAR': 'Paraguay'  # Detectado en el análisis
        }
        
        for codigo, nombre in paises_adicionales.items():
            if codigo not in paises_unicos:
                paises_unicos[codigo] = {
                    'ID_PAIS': self.next_pais_id,
                    'NOMBRE': nombre,
                    'CODIGO_FIFA': codigo
                }
                self.next_pais_id += 1
        
        self.paises_data = paises_unicos
        print(f"✅ Procesados {len(self.paises_data)} países únicos")
        
        return list(paises_unicos.values())
    
    def process_dim_posicion(self):
        """Procesa y crea datos para la tabla DIM_POSICION"""
        print("\n⚽ Procesando DIM_POSICION...")
        
        posiciones_unicas = {}
        
        # Definir descripciones para las posiciones
        descripciones = {
            'GK': 'Portero / Guardameta',
            'DF': 'Defensa',
            'CB': 'Defensa Central',
            'FB': 'Lateral / Fullback',
            'MF': 'Mediocampista',
            'CM': 'Mediocampista Central',
            'AM': 'Mediocampista Ofensivo / Attacking Midfielder',
            'FW': 'Delantero / Forward'
        }
        
        for player in self.players_data:
            # Procesar posiciones detalladas
            if player.get('posiciones_detalladas'):
                posiciones = [pos.strip() for pos in player['posiciones_detalladas'].split(',')]
                for posicion in posiciones:
                    if posicion and posicion not in posiciones_unicas:
                        posiciones_unicas[posicion] = {
                            'ID_POSICION': self.next_posicion_id,
                            'NOMBRE': posicion,
                            'DESCRIPCION': descripciones.get(posicion, f'Posición de fútbol: {posicion}')
                        }
                        self.next_posicion_id += 1
            
            # También procesar posición del roster como respaldo
            if player.get('posicion_roster'):
                posiciones = [pos.strip() for pos in player['posicion_roster'].split(',')]
                for posicion in posiciones:
                    if posicion and posicion not in posiciones_unicas:
                        posiciones_unicas[posicion] = {
                            'ID_POSICION': self.next_posicion_id,
                            'NOMBRE': posicion,
                            'DESCRIPCION': descripciones.get(posicion, f'Posición de fútbol: {posicion}')
                        }
                        self.next_posicion_id += 1
        
        self.posiciones_data = posiciones_unicas
        print(f"✅ Procesadas {len(self.posiciones_data)} posiciones únicas")
        
        return list(posiciones_unicas.values())
    
    def process_dim_equipo(self):
        """Procesa y crea datos para la tabla DIM_EQUIPO"""
        print("\n🏟️ Procesando DIM_EQUIPO...")
        
        # Por ahora, solo tenemos un equipo (el que consultamos)
        equipo = {
            'ID_EQUIPO': self.next_equipo_id,
            'NOMBRE': 'O\'Higgins FC',  # Inferido del ID 5049d576
            'APODO': 'Los Celestes',
            'CIUDAD': 'Rancagua',
            'FECHA_FUNDACION': None  # Se puede completar después
        }
        
        self.equipos_data['5049d576'] = equipo
        self.next_equipo_id += 1
        
        print(f"✅ Procesado 1 equipo")
        return [equipo]
    
    def process_dim_torneo(self):
        """Procesa y crea datos para la tabla DIM_TORNEO"""
        print("\n🏆 Procesando DIM_TORNEO...")
        
        # Inferir torneo basado en los datos (temporada actual)
        torneo = {
            'ID_TORNEO': self.next_torneo_id,
            'NOMBRE': 'Primera División Chile',
            'TEMPORADA': '2025',  # Inferido por las fechas de los datos
            'TIPO_TORNEO': 'Liga Doméstica'
        }
        
        self.torneo_data['2024-2025'] = torneo
        self.next_torneo_id += 1
        
        print(f"✅ Procesado 1 torneo")
        return [torneo]
    
    def process_dim_jugador(self):
        """Procesa y crea datos para la tabla DIM_JUGADOR"""
        print("\n👤 Procesando DIM_JUGADOR...")
        
        jugadores_procesados = []
        
        for player in self.players_data:
            if player.get('nombre_completo') and player.get('player_id_fbr'):
                # Limpiar y validar fecha de nacimiento
                fecha_nacimiento = None
                if player.get('fecha_nacimiento'):
                    try:
                        # Validar formato de fecha
                        datetime.strptime(player['fecha_nacimiento'], '%Y-%m-%d')
                        fecha_nacimiento = player['fecha_nacimiento']
                    except ValueError:
                        print(f"⚠️ Fecha inválida para {player['nombre_completo']}: {player['fecha_nacimiento']}")
                
                jugador = {
                    'ID_JUGADOR': self.next_player_id,
                    'NOMBRE': player['nombre_completo'],
                    'APODO': player.get('apodo') or None,
                    'FECHA_NACIMIENTO': fecha_nacimiento,
                    'PLAYER_ID_FBR': player['player_id_fbr'],  # Campo adicional para referencia externa
                    'ALTURA_CM': player.get('altura_cm'),
                    'PESO_KG': player.get('peso_kg'),
                    'PIE_DOMINANTE': player.get('pie_dominante'),
                    'CIUDAD_NACIMIENTO': player.get('ciudad_nacimiento'),
                    'SALARIO': player.get('salario')
                }
                
                jugadores_procesados.append(jugador)
                self.next_player_id += 1
        
        print(f"✅ Procesados {len(jugadores_procesados)} jugadores")
        return jugadores_procesados
    
    def process_dim_jugador_pais(self, jugadores):
        """Procesa y crea datos para la tabla DIM_JUGADOR_PAIS"""
        print("\n🌍👤 Procesando DIM_JUGADOR_PAIS...")
        
        relaciones = []
        
        for i, player in enumerate(self.players_data):
            if player.get('nacionalidad_codigo') and i < len(jugadores):
                codigo_pais = player['nacionalidad_codigo']
                
                # Corrección de inconsistencias
                if codigo_pais == 'CHI' and player.get('pais_nacimiento'):
                    if player['pais_nacimiento'] == 'Ecuador':
                        codigo_pais = 'ECU'
                    elif player['pais_nacimiento'] == 'Colombia':
                        codigo_pais = 'COL'
                    elif player['pais_nacimiento'] == 'Argentina':
                        codigo_pais = 'ARG'
                
                if codigo_pais in self.paises_data:
                    relacion = {
                        'ID_JUGADOR': jugadores[i]['ID_JUGADOR'],
                        'ID_PAIS': self.paises_data[codigo_pais]['ID_PAIS']
                    }
                    relaciones.append(relacion)
        
        print(f"✅ Procesadas {len(relaciones)} relaciones jugador-país")
        return relaciones
    
    def process_dim_jugador_posicion(self, jugadores):
        """Procesa y crea datos para la tabla DIM_JUGADOR_POSICION"""
        print("\n⚽👤 Procesando DIM_JUGADOR_POSICION...")
        
        relaciones = []
        
        for i, player in enumerate(self.players_data):
            if i < len(jugadores):
                posiciones_jugador = []
                
                # Obtener posiciones detalladas
                if player.get('posiciones_detalladas'):
                    posiciones_jugador = [pos.strip() for pos in player['posiciones_detalladas'].split(',')]
                elif player.get('posicion_roster'):
                    posiciones_jugador = [pos.strip() for pos in player['posicion_roster'].split(',')]
                
                for j, posicion in enumerate(posiciones_jugador):
                    if posicion in self.posiciones_data:
                        relacion = {
                            'ID_JUGADOR': jugadores[i]['ID_JUGADOR'],
                            'ID_POSICION': self.posiciones_data[posicion]['ID_POSICION'],
                            'ES_POSICION_PRINCIPAL': 1 if j == 0 else 0  # Primera posición es principal
                        }
                        relaciones.append(relacion)
        
        print(f"✅ Procesadas {len(relaciones)} relaciones jugador-posición")
        return relaciones
    
    def process_dim_torneo_jugador(self, jugadores):
        """Procesa y crea datos para la tabla DIM_TORNEO_JUGADOR"""
        print("\n🏆👤 Procesando DIM_TORNEO_JUGADOR...")
        
        relaciones = []
        equipo_id = list(self.equipos_data.values())[0]['ID_EQUIPO']
        torneo_id = list(self.torneo_data.values())[0]['ID_TORNEO']
        
        for jugador in jugadores:
            relacion = {
                'ID_TORNEO_JUGADOR': self.next_torneo_jugador_id,
                'ID_JUGADOR': jugador['ID_JUGADOR'],
                'ID_EQUIPO': equipo_id,
                'ID_TORNEO': torneo_id
            }
            relaciones.append(relacion)
            self.next_torneo_jugador_id += 1
        
        print(f"✅ Procesadas {len(relaciones)} relaciones torneo-jugador")
        return relaciones
    
    def export_to_files(self, data_dict):
        """Exporta todos los datos procesados a archivos"""
        print("\n📤 Exportando datos procesados...")
        
        # Crear directorio de salida
        output_dir = "processed_data_pipeline"
        if not os.path.exists(output_dir):
            os.makedirs(output_dir)
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        
        for table_name, table_data in data_dict.items():
            if table_data:
                # Exportar como CSV
                csv_filename = f"{output_dir}/{table_name}_{timestamp}.csv"
                
                if table_data:
                    fieldnames = table_data[0].keys()
                    
                    with open(csv_filename, 'w', newline='', encoding='utf-8') as csvfile:
                        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
                        writer.writeheader()
                        writer.writerows(table_data)
                    
                    print(f"✅ {table_name}: {len(table_data)} registros → {csv_filename}")
                
                # Exportar como JSON para referencia
                json_filename = f"{output_dir}/{table_name}_{timestamp}.json"
                with open(json_filename, 'w', encoding='utf-8') as jsonfile:
                    json.dump(table_data, jsonfile, indent=2, ensure_ascii=False, default=str)
        
        print(f"\n📁 Todos los archivos exportados en: {output_dir}")
    
    def run_pipeline(self):
        """Ejecuta todo el pipeline de procesamiento"""
        print("🚀 INICIANDO DATA PIPELINE PARA JUGADORES")
        print("=" * 50)
        
        # 1. Cargar datos CSV
        if not self.load_csv_data():
            return False
        
        # 2. Procesar tablas dimensionales
        dim_pais = self.process_dim_pais()
        dim_posicion = self.process_dim_posicion()
        dim_equipo = self.process_dim_equipo()
        dim_torneo = self.process_dim_torneo()
        
        # 3. Procesar tabla principal de jugadores
        dim_jugador = self.process_dim_jugador()
        
        # 4. Procesar tablas de relación
        dim_jugador_pais = self.process_dim_jugador_pais(dim_jugador)
        dim_jugador_posicion = self.process_dim_jugador_posicion(dim_jugador)
        dim_torneo_jugador = self.process_dim_torneo_jugador(dim_jugador)
        
        # 5. Compilar todos los datos
        all_data = {
            'DIM_PAIS': dim_pais,
            'DIM_POSICION': dim_posicion,
            'DIM_EQUIPO': dim_equipo,
            'DIM_TORNEO': dim_torneo,
            'DIM_JUGADOR': dim_jugador,
            'DIM_JUGADOR_PAIS': dim_jugador_pais,
            'DIM_JUGADOR_POSICION': dim_jugador_posicion,
            'DIM_TORNEO_JUGADOR': dim_torneo_jugador
        }
        
        # 6. Exportar datos
        self.export_to_files(all_data)
        
        # 7. Mostrar resumen final
        self.show_summary(all_data)
        
        print("\n✅ PIPELINE COMPLETADO EXITOSAMENTE")
        print("=" * 50)
        
        return True
    
    def show_summary(self, data_dict):
        """Muestra un resumen del procesamiento"""
        print("\n📊 RESUMEN DEL PROCESAMIENTO:")
        print("-" * 40)
        
        for table_name, table_data in data_dict.items():
            count = len(table_data) if table_data else 0
            print(f"{table_name:<25}: {count:>3} registros")
        
        # Mostrar algunos ejemplos de datos procesados
        print("\n🔍 EJEMPLOS DE DATOS PROCESADOS:")
        print("-" * 40)
        
        if data_dict['DIM_JUGADOR']:
            print("\nPrimer jugador procesado:")
            jugador = data_dict['DIM_JUGADOR'][0]
            print(f"  ID: {jugador['ID_JUGADOR']}")
            print(f"  Nombre: {jugador['NOMBRE']}")
            print(f"  Fecha nacimiento: {jugador['FECHA_NACIMIENTO']}")
            print(f"  FBR ID: {jugador['PLAYER_ID_FBR']}")
        
        if data_dict['DIM_PAIS']:
            print(f"\nPaíses procesados ({len(data_dict['DIM_PAIS'])}):")
            for pais in data_dict['DIM_PAIS']:
                print(f"  {pais['CODIGO_FIFA']}: {pais['NOMBRE']}")
        
        if data_dict['DIM_POSICION']:
            print(f"\nPosiciones procesadas ({len(data_dict['DIM_POSICION'])}):")
            for pos in data_dict['DIM_POSICION']:
                print(f"  {pos['NOMBRE']}: {pos['DESCRIPCION']}")

def generate_sql_inserts(data_dict, output_dir):
    """Genera archivos SQL con los INSERT statements"""
    print("\n🗄️ Generando scripts SQL...")
    
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    sql_file = f"{output_dir}/insert_statements_{timestamp}.sql"
    
    with open(sql_file, 'w', encoding='utf-8') as f:
        f.write("-- Inserts generados automáticamente por el Data Pipeline\n")
        f.write(f"-- Fecha: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n")
        f.write("USE MP_DATA;\n\n")
        
        # Orden de inserción respetando las foreign keys
        insert_order = [
            'DIM_PAIS', 'DIM_POSICION', 'DIM_EQUIPO', 'DIM_TORNEO', 
            'DIM_JUGADOR', 'DIM_JUGADOR_PAIS', 'DIM_JUGADOR_POSICION', 'DIM_TORNEO_JUGADOR'
        ]
        
        for table_name in insert_order:
            if table_name in data_dict and data_dict[table_name]:
                f.write(f"-- Insertar datos en {table_name}\n")
                
                for record in data_dict[table_name]:
                    columns = list(record.keys())
                    values = []
                    
                    for col in columns:
                        value = record[col]
                        if value is None:
                            values.append('NULL')
                        elif isinstance(value, str):
                            # Escapar comillas simples
                            escaped_value = value.replace("'", "''")
                            values.append(f"'{escaped_value}'")
                        else:
                            values.append(str(value))
                    
                    columns_str = ', '.join(columns)
                    values_str = ', '.join(values)
                    
                    f.write(f"INSERT INTO {table_name} ({columns_str}) VALUES ({values_str});\n")
                
                f.write("\n")
        
        f.write("-- Fin de los inserts\n")
    
    print(f"✅ Scripts SQL generados: {sql_file}")

def main():
    # Configuración
    csv_file = "team_5049d576_players_20250603_040149.csv"
    
    # Verificar que el archivo existe
    if not os.path.exists(csv_file):
        print(f"❌ Error: No se encuentra el archivo {csv_file}")
        print("Asegúrate de que el archivo CSV esté en el mismo directorio que este script")
        return
    
    try:
        # Crear y ejecutar el pipeline
        pipeline = PlayerDataPipeline(csv_file)
        success = pipeline.run_pipeline()
        
        if success:
            # Generar scripts SQL adicionales
            output_dir = "processed_data_pipeline"
            
            # Recopilar datos para SQL
            data_for_sql = {
                'DIM_PAIS': pipeline.process_dim_pais(),
                'DIM_POSICION': pipeline.process_dim_posicion(),
                'DIM_EQUIPO': pipeline.process_dim_equipo(),
                'DIM_TORNEO': pipeline.process_dim_torneo(),
                'DIM_JUGADOR': pipeline.process_dim_jugador(),
            }
            
            # Agregar relaciones
            jugadores = data_for_sql['DIM_JUGADOR']
            data_for_sql['DIM_JUGADOR_PAIS'] = pipeline.process_dim_jugador_pais(jugadores)
            data_for_sql['DIM_JUGADOR_POSICION'] = pipeline.process_dim_jugador_posicion(jugadores)
            data_for_sql['DIM_TORNEO_JUGADOR'] = pipeline.process_dim_torneo_jugador(jugadores)
            
            generate_sql_inserts(data_for_sql, output_dir)
            
            print(f"\n🎉 PIPELINE COMPLETADO")
            print(f"📁 Archivos generados en: {output_dir}/")
            print(f"📊 Datos listos para importar a la base de datos")
            
        else:
            print("❌ El pipeline falló durante la ejecución")
            
    except Exception as e:
        print(f"❌ Error durante la ejecución del pipeline: {e}")

if __name__ == "__main__":
    main()