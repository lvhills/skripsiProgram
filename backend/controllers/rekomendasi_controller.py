"""Controller rekomendasi: tiga jalur input, filter, dan opsi."""
import config
from services import fcm_service
from repositories import produk_repository


def _build_results(topn):
    id_list = [pid for pid, _ in topn]
    data = produk_repository.get_products_by_id(id_list)
    peta = {d["product_id"]: d for d in data}
    results = []
    for pid, score in topn:
        if pid in peta:
            item = peta[pid]
            item["similarity"] = score
            seg_idx, seg_label = fcm_service.get_segment_info(pid)
            item["segmen_idx"] = seg_idx
            item["segmen"] = seg_label
            item["keanggotaan"] = fcm_service.get_membership(pid)
            # kandungan dari kolom bahan_aktif (dipisah titik koma)
            ba = item.get("bahan_aktif") or ""
            item["kandungan"] = [s.strip() for s in ba.split(";") if s.strip()]
            results.append(item)
    return results

def _filter_ids(categories, brands, min_price, max_price):
    if not categories and not brands and (not min_price or min_price == 0) and (not max_price or max_price == 0):
        return None
    return produk_repository.get_filtered_ids(categories, brands, min_price, max_price)


def recommend_by_problem(problem, top_n=5, categories=None, brands=None, min_price=0, max_price=0):
    if problem not in config.PETA_MASALAH:
        return {"error": "Masalah kulit tidak dikenali",
                "pilihan": list(config.PETA_MASALAH.keys()), "hasil": []}
    ingredients = config.PETA_MASALAH[problem]
    allowed = _filter_ids(categories, brands, min_price, max_price)
    topn = fcm_service.topn_cosine(ingredients, top_n, allowed)
    return {
        "masalah": problem,
        "kandungan": ingredients,
        "profil_segmen": fcm_service.profil_segmen(ingredients),
        "hasil": _build_results(topn)
    }


def recommend_by_ingredients(ingredients, top_n=5, categories=None, brands=None, min_price=0, max_price=0):
    allowed = _filter_ids(categories, brands, min_price, max_price)
    topn = fcm_service.topn_cosine(ingredients, top_n, allowed)
    return {
        "kandungan": ingredients,
        "profil_segmen": fcm_service.profil_segmen(ingredients),
        "hasil": _build_results(topn)
    }


def recommend_by_product(product_id, top_n=5, categories=None, brands=None, min_price=0, max_price=0):
    allowed = _filter_ids(categories, brands, min_price, max_price)
    topn = fcm_service.compute_topn_from_product(product_id, top_n, allowed)
    return {"product_id": product_id, "hasil": _build_results(topn)}


def get_options():
    return {
        "masalah": list(config.PETA_MASALAH.keys()),
        "kandungan": fcm_service.feature_names,
        "kategori": produk_repository.get_categories(),
        "merek": produk_repository.get_brands(),
    }