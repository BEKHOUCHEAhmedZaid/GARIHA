import requests

API_URL = "http://localhost:8000/auth/login"

print("Testing Admin Login:")
res_admin = requests.post(API_URL, json={"email": "a_bekhouche@estin.dz", "password": "12345678"})
print("Admin Response:", res_admin.status_code)
if res_admin.status_code == 200:
    token = res_admin.json().get("access_token")
    headers = {"Authorization": f"Bearer {token}"}
    me_res = requests.get("http://localhost:8000/auth/me", headers=headers)
    print("Admin /me Role:", me_res.json().get("role"))

print("\nTesting Owner Login:")
res_owner = requests.post(API_URL, json={"email": "bekhoucheahmedziad@gmail.com", "password": "12345678"})
print("Owner Response:", res_owner.status_code)
if res_owner.status_code == 200:
    token = res_owner.json().get("access_token")
    headers = {"Authorization": f"Bearer {token}"}
    me_res = requests.get("http://localhost:8000/auth/me", headers=headers)
    print("Owner /me Role:", me_res.json().get("role"))
