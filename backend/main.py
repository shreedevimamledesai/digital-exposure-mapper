import re
import dns.resolver
import requests
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

EMAIL_RE = re.compile(r"^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$")


def domain_has_mail_server(domain):
    try:
        dns.resolver.resolve(domain, "MX", lifetime=4)
        return True
    except Exception:
        return False


@app.get("/")
def home():
    return {"status": "OSINT Exposure API is running!"}


@app.get("/scan")
def scan_identity(identifier: str):
    identifier = identifier.strip()

    # --- VALIDATION ---
    if not EMAIL_RE.match(identifier):
        return {"error": "Please enter a valid email address."}

    domain = identifier.split("@")[1]
    if not domain_has_mail_server(domain):
        return {"error": f"The domain '{domain}' can't receive email. Please check the address."}

    nodes = [{"id": "target", "label": identifier, "group": "user"}]
    edges = []
    found_breaches = []
    found_profiles = []

    clean_username = identifier.split("@")[0]

    # --- 1. BREACH CHECK ---
    try:
        res = requests.get(
            f"https://api.xposedornot.com/v1/check-email/{identifier}",
            timeout=6,
        )
        if res.status_code == 200:
            data = res.json()
            breaches = data.get("breaches") or data.get("Exposed Breaches") or []
            if breaches and isinstance(breaches[0], list):
                found_breaches = breaches[0]
            elif isinstance(breaches, list):
                found_breaches = breaches
    except Exception:
        pass

    for i, name in enumerate(found_breaches[:5]):
        nodes.append({"id": f"breach_{i}", "label": f"Exposed via: {name}", "group": "breach"})
        edges.append({"from": "target", "to": f"breach_{i}"})

    # --- 2. POSSIBLE USERNAME MATCHES (Strictly Validated) ---
    headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}
    
    # GitHub check (Ensures user exists and contains valid login data)
    try:
        gh_url = f"https://api.github.com/users/{clean_username}"
        r = requests.get(gh_url, headers=headers, timeout=4)
        if r.status_code == 200:
            data = r.json()
            if isinstance(data, dict) and "login" in data:
                found_profiles.append("GitHub")
    except Exception:
        pass

    # Reddit check (Reddit returns status 200 even for non-existent users, 
    # so we must verify the JSON payload does not contain an error / missing user structure)
    try:
        reddit_url = f"https://www.reddit.com/user/{clean_username}/about.json"
        r = requests.get(reddit_url, headers=headers, timeout=4)
        if r.status_code == 200:
            data = r.json()
            # Valid Reddit profiles contain 'data' with a unique identifier like 'name' or 'id' 
            # while non-existent ones return an error object (e.g., {"error": 404, ...})
            if isinstance(data, dict) and "data" in data and "id" in data["data"]:
                found_profiles.append("Reddit")
    except Exception:
        pass

    for i, p in enumerate(found_profiles):
        nodes.append({"id": f"profile_{i}", "label": f"Possible {p} match", "group": "profile"})
        edges.append({"from": "target", "to": f"profile_{i}"})

    # --- 3. REMEDIATION ---
    remediation = []
    if found_breaches:
        remediation.append(f"⚠️ Found in {len(found_breaches)} known breach(es). Change those passwords now.")
    if found_profiles:
        remediation.append(f"🔍 Accounts with username '{clean_username}' exist on: {', '.join(found_profiles)}. Verify they're yours.")
    if not found_breaches and not found_profiles:
        remediation.append("✅ No known breaches or matching public profiles found.")
    remediation.append("🛡️ Enable 2FA on important accounts and use unique passwords.")

    return {
        "nodes": nodes,
        "edges": edges,
        "remediation": remediation,
        "summary": {"breaches_count": len(found_breaches), "profiles_count": len(found_profiles)},
    }