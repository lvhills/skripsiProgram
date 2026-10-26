"""Service: logika perhitungan FCM dan cosine (tidak menyentuh database)."""
import json
import numpy as np
import pandas as pd
import config

# ===== Muat artefak hasil pelatihan FCM =====
centers = np.load(f"{config.ARTIFACT_DIR}/cluster_centers.npy")        # (c, 40)
membership = np.load(f"{config.ARTIFACT_DIR}/membership_matrix.npy")   # (n, c)
feature_names = json.load(open(f"{config.ARTIFACT_DIR}/feature_names.json", encoding="utf-8"))
seg_labels = json.load(open(f"{config.ARTIFACT_DIR}/segment_labels.json", encoding="utf-8"))

# ===== Pemetaan product_id <-> baris artefak =====
# membership.parquet menyimpan product_id untuk tiap baris, sesuai urutan matriks.
_mem_df = pd.read_parquet(f"{config.ARTIFACT_DIR}/membership.parquet")
product_ids = _mem_df["product_id"].to_numpy()                 # baris ke-i -> product_id
id_to_row = {int(pid): i for i, pid in enumerate(product_ids)} # product_id -> baris ke-i

fni = {name: k for k, name in enumerate(feature_names)}
M = config.FUZZIFIER

# segmen dominan tiap baris
segment_of_product = np.argmax(membership, axis=1)


# ===== Fungsi inti =====
def proyeksi_keanggotaan(x_query):
    """Proyeksikan vektor kandungan 40-dim ke ruang keanggotaan (inferensi FCM)."""
    d = np.linalg.norm(centers - x_query, axis=1)
    if np.any(d == 0):
        u = (d == 0).astype(float)
        return u / u.sum()
    inv = 1.0 / (d ** (2.0 / (M - 1.0)))
    return inv / inv.sum()


def _cosine(u_query):
    """Cosine similarity query ke seluruh produk."""
    A = u_query / (np.linalg.norm(u_query) + 1e-12)
    B = membership / (np.linalg.norm(membership, axis=1, keepdims=True) + 1e-12)
    return B @ A


def _take_topn(scores, top_n, allowed_ids=None, exclude=None):
    """Saring (filter) sebelum urutkan, lalu kembalikan (product_id asli, skor)."""
    scores = scores.copy()
    if allowed_ids is not None:
        allowed = np.zeros(len(scores), dtype=bool)
        for pid in allowed_ids:
            row = id_to_row.get(int(pid))
            if row is not None:
                allowed[row] = True
        scores[~allowed] = -1.0
    if exclude is not None:
        row = id_to_row.get(int(exclude))
        if row is not None:
            scores[row] = -1.0
    order = np.argsort(scores)[::-1][:top_n]
    return [(int(product_ids[i]), round(float(scores[i]), 4))
            for i in order if scores[i] > -1.0]


# ===== Tiga jalur masukan =====
def topn_cosine(ingredients, top_n=5, allowed_ids=None):
    """Jalur masalah kulit / pilih kandungan: dari daftar kandungan."""
    x = np.zeros(len(feature_names))
    for k in ingredients:
        if k in fni:
            x[fni[k]] = 1.0
    scores = _cosine(proyeksi_keanggotaan(x))
    return _take_topn(scores, top_n, allowed_ids)


def compute_topn_from_product(product_id, top_n=5, allowed_ids=None):
    """Jalur produk acuan: pakai vektor keanggotaan produk yang sudah ada."""
    row = id_to_row.get(int(product_id))
    if row is None:
        return []
    scores = _cosine(membership[row])
    return _take_topn(scores, top_n, allowed_ids, exclude=product_id)


# ===== Info tambahan tiap produk =====
def get_segment_info(product_id):
    """Mengembalikan (indeks_segmen, label_segmen) sebuah produk."""
    row = id_to_row.get(int(product_id))
    if row is None:
        return -1, "-"
    j = int(segment_of_product[row])
    label = seg_labels.get(str(j), f"Segmen {j}")
    return j, label

def get_membership(product_id):
    """Persentase keanggotaan sebuah produk di tiap segmen."""
    row = id_to_row.get(int(product_id))
    if row is None:
        return []
    u = membership[row]
    return [{"segmen": seg_labels.get(str(j), f"Segmen {j}"), "persen": round(float(u[j]) * 100, 1)}
            for j in range(len(u))]

def profil_segmen(ingredients):
    """Vektor keanggotaan query ke tiap segmen (untuk bar profil)."""
    x = np.zeros(len(feature_names))
    for k in ingredients:
        if k in fni:
            x[fni[k]] = 1.0
    u = proyeksi_keanggotaan(x)
    return [
        {"segmen": seg_labels.get(str(j), f"Segmen {j}"),
         "persen": round(float(u[j]) * 100, 1)}
        for j in range(len(u))
    ]