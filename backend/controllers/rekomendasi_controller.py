"""Controller rekomendasi: tiga jalur input, filter, dan opsi."""
import config
from services import fcm_service
from repositories import produk_repository


def _build_results(topn):
    """Gabungkan hasil top-N (product_id, skor) dengan data produk dari database."""
    data = produk_repository.get_products_by_id([pid for pid, _ in topn])
    peta = {d["product_id"]: d for d in data}
    results = []
    for pid, score in topn:
        if pid in peta:
            item = peta[pid]
            item["similarity"] = score
            item.update(fcm_service.info_segmen(pid))
            results.append(item)
    return results


def _filter_ids(categories, brands, min_price, max_price):
    """None berarti tanpa filter (semua produk boleh)."""
    if not (categories or brands or min_price or max_price):
        return None
    return produk_repository.get_filtered_ids(categories, brands, min_price, max_price)


def recommend_by_problem(problem, top_n=5, categories=None, brands=None, min_price=0, max_price=0):
    if problem not in config.PETA_MASALAH:
        return {"error": "Masalah kulit tidak dikenali",
                "pilihan": list(config.PETA_MASALAH.keys()), "hasil": []}
    ingredients = config.PETA_MASALAH[problem]
    allowed = _filter_ids(categories, brands, min_price, max_price)
    topn = fcm_service.rekomendasi_dari_kandungan(ingredients, top_n, allowed)
    return {"masalah": problem, "kandungan": ingredients, "hasil": _build_results(topn)}


def recommend_by_ingredients(ingredients, top_n=5, categories=None, brands=None, min_price=0, max_price=0):
    allowed = _filter_ids(categories, brands, min_price, max_price)
    topn = fcm_service.rekomendasi_dari_kandungan(ingredients, top_n, allowed)
    return {"kandungan": ingredients, "hasil": _build_results(topn)}


def recommend_by_product(product_id, top_n=5, categories=None, brands=None, min_price=0, max_price=0):
    allowed = _filter_ids(categories, brands, min_price, max_price)
    topn = fcm_service.compute_topn_from_product(product_id, top_n, allowed)
    return {"product_id": product_id, "hasil": _build_results(topn)}


def get_options():
    return {
        "masalah": list(config.PETA_MASALAH.keys()),
        "kandungan": fcm_service.feature_names,
        "merek": produk_repository.get_brands(),
    }
