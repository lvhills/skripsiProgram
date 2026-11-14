"""Pembaruan terjadwal atribut tampilan produk dari API Female Daily.

Yang diperbarui hanya atribut tampilan: price, rating, star_1..star_5,
total_review, recommended_percentage, serta data_diperbarui_pada. Kandungan
aktif, matriks fitur, dan artefak FCM tidak disentuh (tidak perlu latih ulang).

Pemakaian:
    python scripts/perbarui_data.py          # ambil, cocokkan, lalu tulis
    python scripts/perbarui_data.py --uji    # seluruh proses tanpa menulis apa pun

Variabel lingkungan wajib: SUPABASE_URL, SUPABASE_SERVICE_KEY, FD_API_KEY.

Kode keluar: 0 sukses, 1 pengaman gagal / galat saat menulis, 2 env tidak lengkap.
"""
import argparse
import math
import os
import sys
import time
from datetime import datetime, timezone

import requests
from supabase import create_client

API_URL = "https://reviews.femaledaily.com/service_review/api/products"
LIMIT = 100
JEDA_HALAMAN = 1.0      # detik antarhalaman (jangan dihilangkan)
JEDA_KATEGORI = 2.0     # detik antarkategori (jangan dihilangkan)
COBA_ULANG = 3          # percobaan per halaman sebelum dianggap gagal
GAGAL_BERUNTUN_MAKS = 3 # berhenti menelusuri kategori setelah sekian halaman gagal berturut-turut
HALAMAN_MAKS = 500      # batas pengaman per kategori

# 25 kategori skincare, sama dengan category_query pada pengumpulan data awal
# (Dataset/Dataset_Skincare (Mentah).csv).
KATEGORI = [
    "acne-treatment", "brow-lash-treatment", "cream-1", "cream-lotion", "eye-cream",
    "eye-lip", "eye-mask", "eye-serum", "face", "face-mist",
    "face-oil", "facial-wash", "gel", "lotion-emulsion", "mask-sheet",
    "nose-pack", "oil-2", "peeling", "scrub-exfoliator", "serum-essence",
    "skin-soothing-treatment", "sleeping-mask", "sun-protection-1", "toner", "wash-off",
]

KOLOM_NILAI = ["price", "rating", "star_1", "star_2", "star_3", "star_4", "star_5",
               "total_review", "recommended_percentage"]
KOLOM_INT = {"price", "star_1", "star_2", "star_3", "star_4", "star_5", "total_review"}

BATAS_BACA_DB = 1000    # batas baris per permintaan Supabase
BATCH_SLUG = 500        # maks slug per permintaan untuk jalur "hanya tanggal"

# Pengaman sebelum menulis
MAKS_PERSEN_HALAMAN_GAGAL = 30.0
MIN_BARIS_DB = 7000
MIN_PERSEN_NAMA_COCOK = 99.0


# ---------------------------------------------------------------- utilitas nilai
def angka(v, bulat=False):
    """Ubah ke float/int; yang tidak terbaca (None, '', NaN, inf, teks) menjadi None."""
    if v is None or isinstance(v, bool):
        return None
    try:
        x = float(str(v).replace(",", "").strip()) if isinstance(v, str) else float(v)
    except (TypeError, ValueError):
        return None
    if math.isnan(x) or math.isinf(x):
        return None
    return int(round(x)) if bulat else x


def rapikan_nama(s):
    return (s or "").strip().casefold() if isinstance(s, str) else ""


def nama_dari(obj):
    """brand dan product di API berupa objek bersarang; namanya ada di field 'name'."""
    return obj.get("name") if isinstance(obj, dict) else None


def baca_produk(item):
    """Ambil slug, nama, dan nilai tampilan dari satu item API."""
    rating = item.get("rating")
    rating = rating if isinstance(rating, dict) else {}
    detail = rating.get("rating_overall_detail")
    detail = detail if isinstance(detail, dict) else {}
    nilai = {
        "price": item.get("price"),
        "rating": rating.get("rating_overall"),
        **{f"star_{b}": detail.get(str(b)) for b in range(1, 6)},
        "total_review": item.get("total_review"),
        "recommended_percentage": item.get("recommended_percentage"),
    }
    nilai = {k: angka(v, bulat=k in KOLOM_INT) for k, v in nilai.items()}
    return {
        "slug": item.get("slug"),
        "brand": nama_dari(item.get("brand")),
        "product": nama_dari(item.get("product")),
        "nilai": nilai,
    }


def daftar_item(data):
    """Temukan daftar produk di respons: list berisi dict yang memuat 'slug'.

    List kosong hanya diterima bila tidak ada list ber-slug sama sekali (halaman terakhir),
    supaya list lain yang kebetulan kosong (mis. 'errors': []) tidak dikira akhir data.
    None bila strukturnya tidak dikenali.
    """
    ber_slug, kosong = [], []

    def telusuri(v):
        if isinstance(v, list):
            if not v:
                kosong.append(v)
            elif all(isinstance(x, dict) for x in v) and "slug" in v[0]:
                ber_slug.append(v)
        elif isinstance(v, dict):
            for x in v.values():
                telusuri(x)

    telusuri(data)
    if len(ber_slug) == 1:
        return ber_slug[0]
    if not ber_slug and kosong:
        return []
    return None  # tidak ada, atau lebih dari satu kandidat (ambigu)


# ---------------------------------------------------------------- ambil dari API
def sesi_api(kunci):
    s = requests.Session()
    s.headers.update({
        "key": kunci,
        "version": "1.5",
        "device": "3",
        "User-Agent": ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                       "(KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36"),
        "Accept": "application/json, text/plain, */*",
        "Accept-Language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
        "Origin": "https://reviews.femaledaily.com",
        "Referer": "https://reviews.femaledaily.com/",
    })
    return s


def ambil_halaman(sesi, kategori, halaman):
    """Kembalikan daftar item, atau None bila gagal setelah COBA_ULANG kali."""
    params = {"category": kategori, "sort": "popular", "page": halaman, "limit": LIMIT, "type": "all"}
    for coba in range(1, COBA_ULANG + 1):
        try:
            r = sesi.get(API_URL, params=params, timeout=30)
            r.raise_for_status()
            items = daftar_item(r.json())
            if items is None:
                raise ValueError("struktur respons tidak dikenali (tidak ada daftar item ber-slug)")
            return items
        except (requests.RequestException, ValueError) as e:
            pesan = f"{type(e).__name__}: {e}"[:160]
            print(f"   ! {kategori} hal {halaman} percobaan {coba}/{COBA_ULANG} gagal: {pesan}")
            if coba < COBA_ULANG:
                time.sleep(JEDA_HALAMAN * 2 * coba)
    return None


def ambil_semua_api(sesi):
    """Telusuri 25 kategori. Kembalikan (produk per slug, jumlah halaman, jumlah halaman gagal, contoh kunci item)."""
    produk, total_hal, gagal_hal, contoh_kunci = {}, 0, 0, None
    for i, kat in enumerate(KATEGORI):
        if i > 0:
            time.sleep(JEDA_KATEGORI)
        hal, gagal_beruntun, jumlah_kat = 1, 0, 0
        while hal <= HALAMAN_MAKS:
            if hal > 1:
                time.sleep(JEDA_HALAMAN)
            total_hal += 1
            items = ambil_halaman(sesi, kat, hal)
            if items is None:
                gagal_hal += 1
                gagal_beruntun += 1
                if gagal_beruntun >= GAGAL_BERUNTUN_MAKS:
                    print(f"   ! {kat}: {gagal_beruntun} halaman gagal berturut-turut, kategori dihentikan")
                    break
                hal += 1
                continue
            gagal_beruntun = 0
            for item in items:
                if contoh_kunci is None:
                    contoh_kunci = sorted(item.keys())
                p = baca_produk(item)
                if p["slug"] and p["slug"] not in produk:   # slug sama di kategori lain: ambil yang pertama
                    produk[p["slug"]] = p
            jumlah_kat += len(items)
            if len(items) < LIMIT:
                break
            hal += 1
        print(f"[API] {i + 1:2}/{len(KATEGORI)} {kat:24} {jumlah_kat:6} item, total unik {len(produk)}")
    return produk, total_hal, gagal_hal, contoh_kunci


# ---------------------------------------------------------------- basis data
def baca_semua_db(db):
    kolom = "slug, brand, product, " + ", ".join(KOLOM_NILAI)
    rows, mulai = [], 0
    while True:
        res = db.table("produk").select(kolom).order("product_id").range(mulai, mulai + BATAS_BACA_DB - 1).execute()
        rows.extend(res.data)
        if len(res.data) < BATAS_BACA_DB:
            return rows
        mulai += BATAS_BACA_DB


def sama(a, b):
    if a is None or b is None:
        return a is None and b is None
    return math.isclose(float(a), float(b), rel_tol=0, abs_tol=1e-9)


# ---------------------------------------------------------------- proses utama
def main():
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--uji", action="store_true", help="jalankan seluruh proses tanpa menulis apa pun")
    args = ap.parse_args()

    kurang = [k for k in ("SUPABASE_URL", "SUPABASE_SERVICE_KEY", "FD_API_KEY") if not os.environ.get(k)]
    if kurang:
        print("Variabel lingkungan belum diisi: " + ", ".join(kurang))
        return 2

    mulai = time.time()
    print(f"Mode: {'UJI (tanpa menulis)' if args.uji else 'TULIS'}")
    db = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_KEY"])

    # 1. API
    api, total_hal, gagal_hal, contoh_kunci = ambil_semua_api(sesi_api(os.environ["FD_API_KEY"]))
    persen_gagal = 100.0 * gagal_hal / total_hal if total_hal else 100.0
    print(f"\n[API] halaman: {total_hal}, gagal: {gagal_hal} ({persen_gagal:.1f}%), produk unik: {len(api)}")
    print(f"[API] contoh kunci item: {contoh_kunci}")

    # 2. Basis data
    rows = baca_semua_db(db)
    print(f"[DB ] baris: {len(rows)}")

    # 3. Pencocokan
    cocok = [(r, api[r["slug"]]) for r in rows if r.get("slug") in api]
    nama_ok, nama_beda = [], []
    for r, p in cocok:
        ok = (rapikan_nama(r["brand"]) == rapikan_nama(p["brand"])
              and rapikan_nama(r["product"]) == rapikan_nama(p["product"]))
        (nama_ok if ok else nama_beda).append((r, p))
    persen_nama = 100.0 * len(nama_ok) / len(cocok) if cocok else 0.0
    print(f"[COC] slug cocok: {len(cocok)}, nama cocok: {len(nama_ok)} ({persen_nama:.2f}%), "
          f"tidak ditemukan di API: {len(rows) - len(cocok)}")
    for r, p in nama_beda[:5]:
        print(f"      beda nama  {r['slug']}: DB '{r['brand']} | {r['product']}'  API '{p['brand']} | {p['product']}'")

    # 4. Pengaman
    alasan = []
    if persen_gagal > MAKS_PERSEN_HALAMAN_GAGAL:
        alasan.append(f"halaman API gagal {persen_gagal:.1f}% > {MAKS_PERSEN_HALAMAN_GAGAL}%")
    if len(rows) < MIN_BARIS_DB:
        alasan.append(f"baris DB {len(rows)} < {MIN_BARIS_DB}")
    if not cocok:
        alasan.append("tidak ada slug yang cocok")
    elif persen_nama < MIN_PERSEN_NAMA_COCOK:
        alasan.append(f"kecocokan nama {persen_nama:.2f}% < {MIN_PERSEN_NAMA_COCOK}%")

    # 5. Bagi dua jalur (hanya baris yang slug DAN namanya cocok).
    #    Kolom bernilai None (tak terbaca dari API) dilewati: nilai lama di DB dibiarkan.
    #    Bila semua kolom None, baris diperlakukan tidak berubah (hanya tanggal).
    berubah, tetap = [], []
    ada_none = semua_none = 0
    for r, p in nama_ok:
        terbaca = {k: v for k, v in p["nilai"].items() if v is not None}
        ada_none += len(terbaca) < len(KOLOM_NILAI)
        semua_none += not terbaca
        beda = {k: v for k, v in terbaca.items() if not sama(r.get(k), v)}
        (berubah if beda else tetap).append((r["slug"], terbaca, beda))
    print(f"[RIN] berubah: {len(berubah)}, tidak berubah: {len(tetap)}, "
          f"dilewati karena nama beda: {len(nama_beda)}")
    print(f"[RIN] produk dengan kolom None (kolom itu dilewati): {ada_none}, "
          f"di antaranya semua kolom None (hanya tanggal): {semua_none}")
    for slug, _, beda in berubah[:5]:
        print(f"      contoh berubah {slug}: {beda}")

    if alasan:
        print("\nBERHENTI, pengaman tidak terpenuhi: " + "; ".join(alasan))
        return 1
    if args.uji:
        print(f"\nMode uji: tidak ada yang ditulis. Selesai dalam {time.time() - mulai:.0f} detik.")
        return 0

    # 6. Tulis
    waktu = datetime.now(timezone.utc).isoformat()
    try:
        for i, (slug, nilai, _) in enumerate(berubah, 1):
            db.table("produk").update({**nilai, "data_diperbarui_pada": waktu}).eq("slug", slug).execute()
            if i % 500 == 0:
                print(f"[TUL] berubah: {i}/{len(berubah)}")
        slug_tetap = [s for s, _, _ in tetap]
        for i in range(0, len(slug_tetap), BATCH_SLUG):
            db.table("produk").update({"data_diperbarui_pada": waktu}) \
              .in_("slug", slug_tetap[i:i + BATCH_SLUG]).execute()
    except Exception as e:  # galat jaringan/DB di tengah penulisan
        print(f"\nGALAT saat menulis: {type(e).__name__}: {str(e)[:200]}")
        return 1

    print(f"\n[TUL] ditulis: {len(berubah)} baris berubah (nilai + tanggal), "
          f"{len(tetap)} baris hanya tanggal, data_diperbarui_pada = {waktu}. "
          f"Selesai dalam {time.time() - mulai:.0f} detik.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
