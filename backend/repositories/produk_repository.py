"""Repository: satu-satunya lapisan yang berbicara ke database."""
from functools import lru_cache
from supabase import create_client
import config

supabase = create_client(config.SUPABASE_URL, config.SUPABASE_KEY)

KOLOM_PRODUK = ("product_id, product, brand, category, price, rating, "
                "star_1, star_2, star_3, star_4, star_5, total_review, "
                "recommended_percentage, image_url, bahan_aktif, description")

BATAS_PER_HALAMAN = 1000  # batas baris per permintaan Supabase


def _saring(query, kategori=None, merek=None, harga_min=0, harga_max=0):
    """Terapkan filter kategori, merek, dan rentang harga ke query."""
    if kategori:
        query = query.in_("category", kategori)
    if merek:
        query = query.in_("brand", merek)
    if harga_min and harga_min > 0:
        query = query.gte("price", harga_min)
    if harga_max and harga_max > 0:
        query = query.lte("price", harga_max)
    return query


def _ambil_semua(kolom, **saringan):
    """Ambil kolom tertentu dari semua baris yang lolos filter, bertahap (atasi batas 1000)."""
    rows = []
    start = 0
    while True:
        query = _saring(supabase.table("produk").select(kolom), **saringan)
        hasil = query.range(start, start + BATAS_PER_HALAMAN - 1).execute()
        rows.extend(hasil.data)
        if len(hasil.data) < BATAS_PER_HALAMAN:
            return rows
        start += BATAS_PER_HALAMAN


def _tambah_kandungan(item):
    """Pecah kolom bahan_aktif (dipisah titik koma) menjadi daftar kandungan."""
    d = dict(item)
    ba = d.get("bahan_aktif") or ""
    d["kandungan"] = [s.strip() for s in ba.split(";") if s.strip()]
    return d


def get_products_by_id(id_list):
    hasil = supabase.table("produk").select(KOLOM_PRODUK).in_("product_id", id_list).execute()
    return [_tambah_kandungan(r) for r in hasil.data]


@lru_cache(maxsize=1)
def get_categories():
    rows = _ambil_semua("category")
    return sorted({d["category"] for d in rows if d["category"]})


@lru_cache(maxsize=1)
def get_brands():
    rows = _ambil_semua("brand")
    return sorted({d["brand"] for d in rows if d["brand"]})


@lru_cache(maxsize=1)
def get_product_list():
    return _ambil_semua("product_id, product, brand")


@lru_cache(maxsize=1)
def get_categories_with_image():
    """Tiap kategori dengan satu foto wakil dan jumlah produk (di-cache)."""
    peta = {}
    for row in _ambil_semua("category, image_url"):
        kat = row.get("category")
        if not kat:
            continue
        if kat not in peta:
            peta[kat] = {"category": kat, "image_url": row.get("image_url"), "jumlah": 0}
        peta[kat]["jumlah"] += 1
        if not peta[kat]["image_url"] and row.get("image_url"):
            peta[kat]["image_url"] = row.get("image_url")
    return sorted(peta.values(), key=lambda x: x["jumlah"], reverse=True)


def get_filtered_ids(categories=None, brands=None, min_price=0, max_price=0):
    """Minta Supabase menyaring, ambil product_id yang lolos."""
    rows = _ambil_semua("product_id", kategori=categories, merek=brands,
                        harga_min=min_price, harga_max=max_price)
    return [d["product_id"] for d in rows]


# ===== Katalog =====
@lru_cache(maxsize=1)
def katalog_per_kategori(per_kat=4):
    """Ambil sedikit produk tiap kategori langsung dari DB (di-cache sekali)."""
    hasil = {}
    for kat in get_categories():
        data = supabase.table("produk").select(KOLOM_PRODUK).eq("category", kat).limit(per_kat).execute()
        if data.data:
            hasil[kat] = [_tambah_kandungan(r) for r in data.data]
    return hasil


def cari_katalog(keyword="", kategori=None, harga_min=0, harga_max=0, merek=None, limit=120):
    """Cari langsung di database, kembalikan yang cocok saja (cepat)."""
    query = supabase.table("produk").select(KOLOM_PRODUK)
    if keyword:
        query = query.or_(f"product.ilike.%{keyword}%,brand.ilike.%{keyword}%")
    query = _saring(query, [kategori] if kategori else None, merek, harga_min, harga_max)
    data = query.limit(limit).execute()
    return [_tambah_kandungan(r) for r in data.data]
