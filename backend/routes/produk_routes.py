"""Routes untuk hal terkait produk dan katalog."""
from fastapi import APIRouter, Query
from controllers import produk_controller

router = APIRouter()


@router.get("/produk/daftar")
def product_list():
    return produk_controller.get_product_list()


@router.get("/kategori")
def kategori():
    return produk_controller.get_categories_with_image()


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
