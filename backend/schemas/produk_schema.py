"""Schema bentuk data produk dan statistik."""
from pydantic import BaseModel


class ProdukItem(BaseModel):
    product_id: int
    product: str
    brand: str | None = None
    category: str | None = None


class StatistikResponse(BaseModel):
    jumlah_produk: int
    jumlah_segmen: int
    jumlah_kandungan: int