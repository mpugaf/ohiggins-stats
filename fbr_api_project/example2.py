import requests
import time

# Usar la clave API que ya tienes
api_key = "AzumZVPR1MlXaroDdCzrE4OT0ezDLMlLDjVCi0Txb0k"
base_url = "https://fbrapi.com"

# ID del equipo
team_id = "5049d576"

# Construir la URL correcta según la documentación
url = f"{base_url}/teams"
params = {
    "team_id": team_id,
    "X-API-Key": api_key  # Según la documentación, se usa un header X-API-Key
}
headers = {
    "X-API-Key": api_key  # También intentar con header
}

print(f"\nConsultando información del equipo: {team_id}")
print(f"URL: {url}")
print(f"Parámetros: {params}")

response = requests.get(url, params=params, headers=headers)
print(f"Respuesta: {response.status_code}")
print(response.text)  # Mostrar los primeros 500 caracteres de la respuesta
