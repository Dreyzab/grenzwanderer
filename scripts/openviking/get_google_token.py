import time
import json
import requests
import jwt
import sys
from pathlib import Path

def get_access_token(json_path):
    with open(json_path, 'r') as f:
        data = json.load(f)
    
    private_key = data['private_key']
    client_email = data['client_email']
    token_uri = data['token_uri']
    
    now = int(time.time())
    payload = {
        'iss': client_email,
        'scope': 'https://www.googleapis.com/auth/cloud-platform https://www.googleapis.com/auth/generative-language',
        'aud': token_uri,
        'exp': now + 3600,
        'iat': now
    }
    
    signed_jwt = jwt.encode(payload, private_key, algorithm='RS256')
    
    resp = requests.post(token_uri, data={
        'grant_type': 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        'assertion': signed_jwt
    })
    
    if resp.status_code != 200:
        raise Exception(f"Failed to get token: {resp.text}")
        
    return resp.json()['access_token']

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python get_google_token.py <path_to_json>")
        sys.exit(1)
        
    try:
        print(get_access_token(sys.argv[1]))
    except Exception as e:
        sys.stderr.write(f"Error: {str(e)}\n")
        sys.exit(1)
