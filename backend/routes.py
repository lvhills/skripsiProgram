from fastapi import APIRouter
import config
import database
import model_fcm

router = APIRouter()


@router.get("/")
def beranda():
    return {"pesan": "Backend serasi berjalan"}


@router.get("/produk")
def produk():
    return database.ambil_produk_contoh(10)


@router.get("/rekomendasi")
def rekomendasi(masalah: str, top_n: int = 5):
    if masalah not in config.PETA_MASALAH:
        return {"error": "Masalah kulit tidak dikenali",
                "pilihan": list(config.PETA_MASALAH.keys())}

    kandungan = config.PETA_MASALAH[masalah]

    # 1. Model menghitung Top-N (product_id + skor)
    topn = model_fcm.hitung_topn(kandungan, top_n)

    # 2. Ambil detail produk dari database
    id_produk = [pid for pid, _ in topn]
    data = database.ambil_produk_by_id(id_produk)
    peta = {d["product_id"]: d for d in data}

    # 3. Gabungkan sesuai urutan peringkat
    hasil = []
    for pid, skor in topn:
        if pid in peta:
            item = peta[pid]
            item["similarity"] = skor
            hasil.append(item)
    return {"masalah": masalah, "kandungan": kandungan, "hasil": hasil}