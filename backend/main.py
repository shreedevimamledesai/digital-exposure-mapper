import os
import random
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
import resend
from twilio.rest import Client

app = FastAPI(title="Digital Exposure Mapper API")

# Enable CORS so your Netlify/Lovable frontend can talk to Render
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load keys from environment variables
RESEND_API_KEY = os.getenv("RESEND_API_KEY", "")
resend.api_key = RESEND_API_KEY

TWILIO_SID = os.getenv("TWILIO_ACCOUNT_SID", "")
TWILIO_TOKEN = os.getenv("TWILIO_AUTH_TOKEN", "")
TWILIO_PHONE = os.getenv("TWILIO_PHONE_NUMBER", "")

# Temporary storage for 6-digit codes
otp_store = {}

class SendOtpRequest(BaseModel):
    email: str | None = None
    phone: str | None = None

class VerifyOtpRequest(BaseModel):
    email: str | None = None
    phone: str | None = None
    otp: str

@app.post("/api/send-otp")
async def send_otp(payload: SendOtpRequest):
    target = payload.email or payload.phone
    if not target:
        raise HTTPException(status_code=400, detail="Invalid contact input.")

    # Generate 6-digit code
    generated_otp = str(random.randint(100000, 999999))
    otp_store[target] = generated_otp

    # Send via Email if Email provided
    if payload.email:
        if RESEND_API_KEY:
            try:
                resend.Emails.send({
                    "from": "Security <onboarding@resend.dev>",
                    "to": payload.email,
                    "subject": "Verification Code",
                    "html": f"<p>Your OTP is <strong>{generated_otp}</strong></p>"
                })
            except Exception as e:
                print("Email failed:", e)
        else:
            print(f"[FALLBACK LOG] Email OTP for {payload.email}: {generated_otp}")

    # Send via SMS if Phone provided
    elif payload.phone:
        if TWILIO_SID and TWILIO_TOKEN:
            try:
                client = Client(TWILIO_SID, TWILIO_TOKEN)
                client.messages.create(
                    body=f"Your verification code is {generated_otp}",
                    from_=TWILIO_PHONE,
                    to=payload.phone
                )
            except Exception as e:
                print("SMS failed:", e)
        else:
            print(f"[FALLBACK LOG] Phone OTP for {payload.phone}: {generated_otp}")

    return {"message": "OTP sent successfully"}

@app.post("/api/verify-otp")
async def verify_otp(payload: VerifyOtpRequest):
    target = payload.email or payload.phone
    saved_otp = otp_store.get(target)

    if saved_otp and saved_otp == payload.otp:
        del otp_store[target]
        return {"status": "verified", "target": target}

    raise HTTPException(status_code=400, detail="Invalid or expired OTP")

@app.get("/scan")
async def get_scan_data(target: str):
    return {
        "target": target,
        "score": 64,
        "nodes": [
            {
                "id": "linkedin21",
                "label": "LinkedIn Data Leak",
                "category": "Breach",
                "severity": "critical",
                "confidence": 98,
                "date": "2021-06-22",
                "records": "700M",
                "exposed": ["Email", "Full Name", "Phone Number"],
                "metadata": {
                    "Domain": "linkedin.com",
                    "Breach Type": "Public Scraping"
                }
            }
        ]
    }