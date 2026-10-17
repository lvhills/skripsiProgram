import os
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

# Ganti sesuai nama folder artefakmu
ARTIFACT_DIR = "artefak"

FUZZIFIER = 1.2

# Pemetaan masalah kulit ke kandungan aktif
PETA_MASALAH = {
    "Jerawat": ["Salicylic Acid (BHA)", "Tea Tree", "Azelaic Acid"],
    "Kemerahan": ["Centella Asiatica / Cica", "Allantoin", "Panthenol (Provitamin B5)", "Green Tea"],
    "Kering": ["Hyaluronic Acid", "Ceramide", "Squalane", "Panthenol (Provitamin B5)"],
    "Kusam": ["Vitamin C", "Niacinamide (Vitamin B3)", "Arbutin", "Tranexamic Acid"],
}