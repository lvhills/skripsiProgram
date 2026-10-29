"""Controller untuk hal terkait produk."""
from services import fcm_service
from repositories import produk_repository


def _lengkapi_segmen(produk_list):
    for item in produk_list:
        item.update(fcm_service.info_segmen(item["product_id"]))
    return produk_list


def get_product_list():
    return produk_repository.get_product_list()


def get_categories_with_image():
    return produk_repository.get_categories_with_image()


def cari_katalog(keyword="", kategori=None, harga_min=0, harga_max=0, merek=None):
    data = produk_repository.cari_katalog(keyword, kategori, harga_min, harga_max, merek)
    return _lengkapi_segmen(data)


def katalog_per_kategori():
    data = produk_repository.katalog_per_kategori()
    for rows in data.values():
        _lengkapi_segmen(rows)
    return data
