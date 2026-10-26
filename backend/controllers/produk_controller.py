"""Controller untuk hal terkait produk."""
from services import fcm_service
from repositories import produk_repository


def get_statistics():
    return {
        "jumlah_produk": produk_repository.count_products(),
        "jumlah_segmen": int(fcm_service.centers.shape[0]),
        "jumlah_kandungan": len(fcm_service.feature_names),
    }


def get_catalog(page=1, per_page=12):
    offset = (page - 1) * per_page
    data = produk_repository.get_catalog(per_page, offset)
    for d in data:
        seg_idx, seg_label = fcm_service.get_segment_info(d["product_id"])
        d["segmen_idx"] = seg_idx
        d["segmen"] = seg_label
    return {"halaman": page, "produk": data}


def get_product_list():
    return produk_repository.get_product_list()

def get_categories_with_image():
    return produk_repository.get_categories_with_image()

def cari_katalog(keyword="", kategori=None, harga_min=0, harga_max=0, merek=None):
    data = produk_repository.cari_katalog(keyword, kategori, harga_min, harga_max, merek)
    for item in data:
        pid = item["product_id"]
        seg_idx, seg_label = fcm_service.get_segment_info(pid)
        item["segmen_idx"] = seg_idx
        item["segmen"] = seg_label
        item["keanggotaan"] = fcm_service.get_membership(pid)
    return data

def katalog_per_kategori():
    data = produk_repository.katalog_per_kategori()
    for kat, rows in data.items():
        for item in rows:
            pid = item["product_id"]
            seg_idx, seg_label = fcm_service.get_segment_info(pid)
            item["segmen_idx"] = seg_idx
            item["segmen"] = seg_label
            item["keanggotaan"] = fcm_service.get_membership(pid)
    return data