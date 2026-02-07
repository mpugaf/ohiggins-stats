import requests
import json

def get_api_key():
    try:
        response = requests.post('https://fbrapi.com/generate_api_key')
        if response.status_code in [200, 201]:
            api_key = response.json().get('api_key')
            
            # Guardar la clave API en un archivo
            with open('api_key.json', 'w') as f:
                json.dump({'api_key': api_key}, f)
                
            print(f"API Key obtenida con éxito: {api_key}")
            print("La clave ha sido guardada en 'api_key.json'")
            return api_key
        else:
            print(f"Error: {response.status_code}")
            print(response.text)
            return None
    except Exception as e:
        print(f"Ocurrió un error: {e}")
        return None

if __name__ == "__main__":
    get_api_key()
