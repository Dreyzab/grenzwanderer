import requests
import json
import sys

def query_viking(query, limit=10):
    url = "http://127.0.0.1:1933/api/v1/search/find"
    payload = {
        "query": query,
        "limit": limit
    }
    headers = {
        "Content-Type": "application/json"
    }
    
    try:
        response = requests.post(url, json=payload, headers=headers)
        response.raise_for_status()
        return response.json()
    except Exception as e:
        print(f"Error querying OpenViking: {e}")
        return None

if __name__ == "__main__":
    query = sys.argv[1] if len(sys.argv) > 1 else "plot beginning game actions"
    result = query_viking(query)
    if result:
        print(json.dumps(result, indent=2, ensure_ascii=False))
