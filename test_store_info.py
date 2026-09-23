#!/usr/bin/env python3
"""
Test script for /api/store/info endpoint
"""

import urllib.request
import urllib.error
import json
import time

URL = "http://localhost:3000/api/store/info"

def test_store_info():
    print(f"Testing endpoint: {URL}")
    req = urllib.request.Request(
        URL,
        headers={"User-Agent": "StoreInfoTester/1.0", "Accept": "application/json"}
    )
    
    start_time = time.time()
    try:
        with urllib.request.urlopen(req, timeout=10) as response:
            status = response.status
            elapsed_ms = round((time.time() - start_time) * 1000, 1)
            raw_body = response.read().decode('utf-8')
            data = json.loads(raw_body)
            
            print(f"\n[✓] HTTP Status: {status}")
            print(f"[✓] Response Time: {elapsed_ms} ms")
            print("\nResponse Body:")
            print(json.dumps(data, indent=2))
            
            if data.get("success"):
                print("\nResult: SUCCESS - /api/store/info responded successfully.")
            else:
                print("\nResult: FAILED - Endpoint returned success=false.")
                
    except urllib.error.HTTPError as e:
        print(f"\n[✗] HTTP Error: {e.code} - {e.reason}")
    except Exception as e:
        print(f"\n[✗] Exception: {str(e)}")

if __name__ == "__main__":
    test_store_info()
