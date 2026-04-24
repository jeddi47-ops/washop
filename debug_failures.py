#!/usr/bin/env python3
"""
Debug specific failing endpoints
"""

import requests
import json

BASE_URL = "https://washop-staging.preview.emergentagent.com"

def test_specific_failures():
    # Login as admin to get token
    admin_login = requests.post(f"{BASE_URL}/api/v1/auth/login", 
                               json={"email": "admin@washop.com", "password": "WashopAdmin2024!"})
    admin_token = admin_login.json()['data']['token']
    
    # Login as vendor
    vendor_login = requests.post(f"{BASE_URL}/api/v1/auth/login",
                                json={"email": "vendor@test.com", "password": "vendor123"})
    vendor_token = vendor_login.json()['data']['token']
    
    print("🔍 Testing specific failures...")
    
    # 1. Test token refresh
    print("\n1. Testing token refresh:")
    refresh_response = requests.post(f"{BASE_URL}/api/v1/auth/refresh", 
                                   headers={"Authorization": f"Bearer {admin_token}"})
    print(f"Status: {refresh_response.status_code}")
    print(f"Response: {refresh_response.text}")
    
    # 2. Test update order status
    print("\n2. Testing update order status:")
    # First get an order ID
    orders_response = requests.get(f"{BASE_URL}/api/v1/orders/me", 
                                 headers={"Authorization": f"Bearer {vendor_token}"})
    if orders_response.status_code == 200:
        orders = orders_response.json().get('data', [])
        if orders:
            order_id = orders[0]['id']
            status_response = requests.put(f"{BASE_URL}/api/v1/orders/{order_id}/status",
                                         json={"status": "confirmed"},
                                         headers={"Authorization": f"Bearer {vendor_token}"})
            print(f"Status: {status_response.status_code}")
            print(f"Response: {status_response.text}")
        else:
            print("No orders found")
    
    # 3. Test access key activation
    print("\n3. Testing access key activation:")
    # Generate keys first
    key_gen_response = requests.post(f"{BASE_URL}/api/v1/access-keys/generate",
                                   json={"type": "premium", "duration": "monthly", "quantity": 1},
                                   headers={"Authorization": f"Bearer {admin_token}"})
    if key_gen_response.status_code == 200:
        keys = key_gen_response.json()['data']['keys']
        if keys:
            key_code = keys[0]['key_code']
            activate_response = requests.post(f"{BASE_URL}/api/v1/access-keys/activate",
                                            json={"key_code": key_code},
                                            headers={"Authorization": f"Bearer {vendor_token}"})
            print(f"Status: {activate_response.status_code}")
            print(f"Response: {activate_response.text}")
    
    # 4. Test assign claim
    print("\n4. Testing assign claim:")
    # First create a claim
    claim_response = requests.post(f"{BASE_URL}/api/v1/claims",
                                 json={
                                     "vendor_id": "some_vendor_id",
                                     "subject": "Test claim",
                                     "message": "Test message"
                                 },
                                 headers={"Authorization": f"Bearer {vendor_token}"})
    
    if claim_response.status_code == 200:
        claim_id = claim_response.json()['data']['id']
        assign_response = requests.put(f"{BASE_URL}/api/v1/claims/{claim_id}/assign",
                                     json={"employee_id": "admin_user_id"},
                                     headers={"Authorization": f"Bearer {admin_token}"})
        print(f"Status: {assign_response.status_code}")
        print(f"Response: {assign_response.text}")

if __name__ == "__main__":
    test_specific_failures()