"""Routes untuk hal terkait produk."""
from fastapi import APIRouter
from controllers import produk_controller
from schemas.produk_schema import StatistikResponse

router = APIRouter()


@router.get("/statistik", response_model=StatistikResponse)
def statistics():
    return produk_controller.get_statistics()


@router.get("/katalog")
def catalog(halaman: int = 1):
    return produk_controller.get_catalog(halaman)


@router.get("/produk/daftar")
def product_list():
    return produk_controller.get_product_list()

@router.get("/kategori")
def kategori():
    return produk_controller.get_categories_with_image()

from fastapi import Query

@router.get("/katalog/cari")
def cari_katalog(
    keyword: str = "",
    kategori: str = None,
    harga_min: float = 0,
    harga_max: float = 0,
    merek: list[str] = Query(default=None),
):
    return produk_controller.cari_katalog(keyword, kategori, harga_min, harga_max, merek)

@router.get("/katalog/per-kategori")
def katalog_per_kategori():
    return produk_controller.katalog_per_kategori()