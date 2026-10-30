import json
import os
from pathlib import Path
from dotenv import load_dotenv

# Jalur mutlak agar tetap benar di serverless (direktori kerja bisa berbeda)
BASE_DIR = Path(__file__).resolve().parent

load_dotenv(BASE_DIR / ".env")

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

# Folder artefak hasil pelatihan FCM (fuzzifier m dibaca dari artefak/config.json)
ARTIFACT_DIR = BASE_DIR / "artefak"

# Pemetaan masalah kulit ke kandungan aktif (Tabel 3.4), disimpan notebook ke artefak
# agar notebook dan backend selalu memakai pemetaan yang sama.
with open(ARTIFACT_DIR / "peta_masalah_kulit.json", encoding="utf-8") as f:
    PETA_MASALAH = json.load(f)