"""Routes rekomendasi: tiga jalur input, filter, dan opsi."""
from fastapi import APIRouter, Body, Query
from controllers import rekomendasi_controller

router = APIRouter()


@router.get("/opsi")
def options():
    return rekomendasi_controller.get_options()

@router.get("/rekomendasi/masalah")
def recommend_by_problem(
    masalah: str, top_n: int = 5,
    kategori: list[str] = Query(default=None),
    merek: list[str] = Query(default=None),
    harga_min: float = 0, harga_max: float = 0,
):
    return rekomendasi_controller.recommend_by_problem(masalah, top_n, kategori, merek, harga_min, harga_max)


@router.get("/rekomendasi/produk")
def recommend_by_product(
    product_id: int, top_n: int = 5,
    kategori: list[str] = Query(default=None),
    merek: list[str] = Query(default=None),
    harga_min: float = 0, harga_max: float = 0,
):
    return rekomendasi_controller.recommend_by_product(product_id, top_n, kategori, merek, harga_min, harga_max)


@router.post("/rekomendasi/kandungan")
def recommend_by_ingredients(
    kandungan: list[str] = Body(...), top_n: int = 5,
    kategori: list[str] = Query(default=None),
    merek: list[str] = Query(default=None),
    harga_min: float = 0, harga_max: float = 0,
):
    return rekomendasi_controller.recommend_by_ingredients(kandungan, top_n, kategori, merek, harga_min, harga_max)