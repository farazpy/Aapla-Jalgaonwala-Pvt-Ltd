#!/usr/bin/env python3
"""
Store Endpoints API Test Suite
Tests store endpoints of the running server on http://localhost:3000
"""

import urllib.request
import urllib.error
import json
import sys
import time

BASE_URL = "http://localhost:3000"

ENDPOINTS = [
    ("/api/store/info", "Store Info"),
    ("/api/store/orders", "Store Orders"),
    ("/api/store/coupons", "Store Coupons"),
    ("/api/store/shipping", "Store Shipping Config"),
    ("/api/store/payment-methods", "Store Payment Methods"),
    ("/api/products", "Product Catalog"),
    ("/api/categories", "Category Catalog"),
    ("/api/settings", "Store Settings"),
    ("/api/products/banana-chips/reviews", "Product Reviews (Banana Chips)"),
    ("/api/health", "Server Health Check"),
]

def test_endpoint(path: str, name: str) -> bool:
    url = f"{BASE_URL}{path}"
    req = urllib.request.Request(
        url,
        headers={"User-Agent": "StoreEndpointTester/1.0", "Accept": "application/json"}
    )
    
    start_time = time.time()
    try:
        with urllib.request.urlopen(req, timeout=10) as response:
            status = response.status
            elapsed_ms = round((time.time() - start_time) * 1000, 1)
            raw_body = response.read().decode('utf-8')
            
            try:
                data = json.loads(raw_body)
                is_success = data.get("success", True) if isinstance(data, dict) else True
                summary = f"Keys: {list(data.keys())}" if isinstance(data, dict) else f"Items: {len(data)}" if isinstance(data, list) else "OK"
            except json.JSONDecodeError:
                is_success = False
                summary = "Non-JSON Response"

            status_symbol = "✓" if status == 200 and is_success else "✗"
            print(f"[{status_symbol}] {name:30s} | Endpoint: {path:38s} | Status: {status} | Latency: {elapsed_ms}ms | Summary: {summary}")
            return status == 200 and is_success

    except urllib.error.HTTPError as e:
        elapsed_ms = round((time.time() - start_time) * 1000, 1)
        print(f"[✗] {name:30s} | Endpoint: {path:38s} | Status: {e.code} | Latency: {elapsed_ms}ms | Error: HTTP {e.code}")
        return False
    except Exception as e:
        elapsed_ms = round((time.time() - start_time) * 1000, 1)
        print(f"[✗] {name:30s} | Endpoint: {path:38s} | Latency: {elapsed_ms}ms | Exception: {str(e)}")
        return False

def main():
    print("=" * 115)
    print("  AAPLA JALGAONWALA - STORE ENDPOINTS TEST SUITE")
    print(f"  Target Server: {BASE_URL}")
    print("=" * 115)
    
    passed = 0
    failed = 0
    
    for path, name in ENDPOINTS:
        success = test_endpoint(path, name)
        if success:
            passed += 1
        else:
            failed += 1

    print("=" * 115)
    print(f"Test Summary: Total = {len(ENDPOINTS)} | Passed = {passed} | Failed = {failed}")
    print("=" * 115)
    
    if failed > 0:
        sys.exit(1)

if __name__ == "__main__":
    main()
