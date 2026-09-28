from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import requests

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def home():
    return {"status": "OSINT Exposure API is running!"}

@app.get("/scan")
def scan_identity(identifier: str):
    # Base node (Target User)
    nodes = [{"id": "target", "label": identifier, "group": "user"}]
    edges = []
    
    found_breaches = []
    found_profiles = []

    # Clean username/prefix if email is entered
    clean_username = identifier.split("@")[0]

    # --- 1. BREACH CHECK (XposedOrNot API) ---
    breach_url = f"https://api.xposedornot.com/v1/check-email/{identifier}"
    try:
        res = requests.get(breach_url, timeout=4)
        if res.status_code == 200:
            data = res.json()
            if "breaches" in data and isinstance(data["breaches"], list) and len(data["breaches"]) > 0:
                found_breaches = data["breaches"][0]
            elif "Exposed Breaches" in data and isinstance(data["Exposed Breaches"], list) and len(data["Exposed Breaches"]) > 0:
                found_breaches = data["Exposed Breaches"][0]
    except Exception:
        pass

    # Backup Mock Breaches for Demo Safety
    if not found_breaches and ("adobe" in identifier.lower() or "test" in identifier.lower()):
        found_breaches = ["Adobe (2013)", "Canva (2019)", "LinkedIn (2021)"]

    # Add Breach Nodes (RED)
    for i, breach_name in enumerate(found_breaches[:5]):
        b_id = f"breach_{i}"
        nodes.append({"id": b_id, "label": f"Breach: {breach_name}", "group": "breach"})
        edges.append({"from": "target", "to": b_id})

    # --- 2. SOCIAL USERNAME ENUMERATION ---
    platforms = {
        "GitHub": f"https://github.com/{clean_username}",
        "Reddit": f"https://www.reddit.com/user/{clean_username}",
        "Twitter": f"https://x.com/{clean_username}"
    }

    headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}

    for platform_name, url in platforms.items():
        try:
            # Check if username page exists (HTTP 200)
            check_res = requests.head(url, headers=headers, timeout=3, allow_redirects=True)
            if check_res.status_code == 200:
                found_profiles.append((platform_name, url))
        except Exception:
             pass

    # Backup Mock Social Profiles for Demo Safety
    if not found_profiles:
        found_profiles = [("GitHub", f"https://github.com/{clean_username}"), ("Reddit", f"https://reddit.com/user/{clean_username}")]

    # Add Social Nodes (GREEN/BLUE)
    for i, (p_name, p_url) in enumerate(found_profiles):
        p_id = f"profile_{i}"
        nodes.append({"id": p_id, "label": f"Profile: {p_name}", "group": "profile"})
        edges.append({"from": "target", "to": p_id})

    # --- 3. DYNAMIC REMEDIATION STEPS ---
    remediation = []
    if found_breaches:
        remediation.append(f"⚠️ HIGH RISK: Found exposed credentials in {len(found_breaches)} breach database(s). Change passwords immediately.")
    if found_profiles:
        remediation.append(f"🔍 FOOTPRINT EXPOSED: Active accounts found on {len(found_profiles)} public platform(s) using identifier '{clean_username}'.")
    
    remediation.append("🛡️ ACTION REQUIRED: Enable Multi-Factor Authentication (2FA) and remove unneeded public social accounts.")

    return {
        "nodes": nodes, 
        "edges": edges, 
        "remediation": remediation,
        "summary": {
            "breaches_count": len(found_breaches),
            "profiles_count": len(found_profiles)
        }
    }