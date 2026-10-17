from supabase import create_client
import config

# Menyambung ke Supabase sekali
supabase = create_client(config.SUPABASE_URL, config.SUPABASE_KEY)


def ambil_produk_contoh(jumlah=10):
    """Mengambil beberapa produk untuk pengecekan."""
    hasil = supabase.table("produk").select(
        "product_id, product, brand, category").limit(jumlah).execute()
    return hasil.data


def ambil_produk_by_id(daftar_id):
    """Mengambil detail produk berdasarkan daftar product_id."""
    hasil = supabase.table("produk").select(
        "product_id, product, brand, category").in_("product_id", daftar_id).execute()
    return hasil.data