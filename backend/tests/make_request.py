#!/usr/bin/env python3
"""Make a request to see backend logs"""

import requests
import time

print("Making request to running uvicorn server...")
print("Check the uvicorn console for error output...")

try:
    response = requests.get("http://127.0.0.1:8000/api/conversations", 
                          headers={"Authorization": "Bearer test-token"})
    print(f"Response: {response.status_code}")
except Exception as e:
    print(f"Error: {e}")

time.sleep(1)
print("Request completed. Check uvicorn console for logs.")