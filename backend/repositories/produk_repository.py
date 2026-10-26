"""Repository: satu-satunya lapisan yang berbicara ke database."""
from functools import lru_cache
from supabase import create_client
import config

supabase = create_client(config.SUPABASE_URL, config.SUPABASE_KEY)

KOLOM_PRODUK = ("product_id, product, brand, category, price, rating, "
                "star_1, star_2, star_3, star_4, star_5, total_review, "
                "recommended_percentage, image_url, bahan_aktif, description")


def count_products():
    hasil = supabase.table("produk").select("product_id", count="exact").execute()
    return hasil.count


def get_products_by_id(id_list):
    hasil = supabase.table("produk").select(KOLOM_PRODUK).in_("product_id", id_list).execute()
    return hasil.data


def _ambil_semua(kolom):
    """Ambil kolom tertentu dari semua baris, bertahap (atasi batas 1000)."""
    rows = []
    step, start = 1000, 0
    while True:
        hasil = supabase.table("produk").select(kolom).range(start, start + step - 1).execute()
        if not hasil.data:
            break
        rows.extend(hasil.data)
        if len(hasil.data) < step:
            break
        start += step
    return rows


def _tambah_kandungan(item):
    d = dict(item)
    ba = d.get("bahan_aktif") or ""
    d["kandungan"] = [s.strip() for s in ba.split(";") if s.strip()]
    return d


@lru_cache(maxsize=1)
def get_categories():
    rows = _ambil_semua("category")
    nilai = {d["category"] for d in rows if d["category"]}
    return sorted(nilai)


@lru_cache(maxsize=1)
def get_brands():
    rows = _ambil_semua("brand")
    nilai = {d["brand"] for d in rows if d["brand"]}
    return sorted(nilai)


@lru_cache(maxsize=1)
def get_product_list():
    return _ambil_semua("product_id, product, brand")


@lru_cache(maxsize=1)
def get_categories_with_image():
    """Tiap kategori dengan satu foto wakil dan jumlah produk (di-cache)."""
    rows = _ambil_semua("category, image_url")
    peta = {}
    for row in rows:
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
    """Minta Supabase menyaring, ambil product_id yang lolos (bertahap)."""
    ids = []
    step, start = 1000, 0
    while True:
        query = supabase.table("produk").select("product_id")
        if categories:
            query = query.in_("category", categories)
        if brands:
            query = query.in_("brand", brands)
        if min_price and min_price > 0:
            query = query.gte("price", min_price)
        if max_price and max_price > 0:
            query = query.lte("price", max_price)
        hasil = query.range(start, start + step - 1).execute()
        if not hasil.data:
            break
        ids.extend(d["product_id"] for d in hasil.data)
        if len(hasil.data) < step:
            break
        start += step
    return ids


# ===== Katalog: ringan =====
@lru_cache(maxsize=1)
def katalog_per_kategori(per_kat=4):
    """Ambil sedikit produk tiap kategori langsung dari DB (di-cache sekali)."""
    kategori_list = get_categories()
    hasil = {}
    for kat in kategori_list:
        data = supabase.table("produk").select(KOLOM_PRODUK).eq("category", kat).limit(per_kat).execute()
        rows = data.data
        if rows:
            hasil[kat] = [_tambah_kandungan(r) for r in rows]
    return hasil


def cari_katalog(keyword="", kategori=None, harga_min=0, harga_max=0, merek=None, limit=120):
    """Cari langsung di database, kembalikan yang cocok saja (cepat)."""
    query = supabase.table("produk").select(KOLOM_PRODUK)
    if keyword:
        query = query.or_(f"product.ilike.%{keyword}%,brand.ilike.%{keyword}%")
    if kategori:
        query = query.eq("category", kategori)
    if merek:
        query = query.in_("brand", merek)
    if harga_min and harga_min > 0:
        query = query.gte("price", harga_min)
    if harga_max and harga_max > 0:
        query = query.lte("price", harga_max)
    data = query.limit(limit).execute()
    return [_tambah_kandungan(r) for r in data.data]


def get_catalog(limit=12, offset=0):
    hasil = supabase.table("produk").select(
        "product_id, product, brand, category, price, rating, total_review, image_url"
    ).range(offset, offset + limit - 1).execute()
    return hasil.data