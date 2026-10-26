"""Schema untuk fitur rekomendasi."""
from pydantic import BaseModel
from schemas.produk_schema import ProdukItem


# Bentuk satu produk hasil rekomendasi, yaitu produk biasa plus skor
class RekomendasiItem(ProdukItem):
    similarity: float


# Bentuk keluaran endpoint rekomendasi
class RekomendasiResponse(BaseModel):
    masalah: str
    kandungan: list[str]
    hasil: list[RekomendasiItem]
    