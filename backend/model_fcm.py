import json
import numpy as np
import config

# Memuat artefak sekali
centers = np.load(f"{config.ARTIFACT_DIR}/cluster_centers.npy")
membership = np.load(f"{config.ARTIFACT_DIR}/membership_matrix.npy")
feature_names = json.load(open(f"{config.ARTIFACT_DIR}/feature_names.json", encoding="utf-8"))
seg_labels = json.load(open(f"{config.ARTIFACT_DIR}/segment_labels.json", encoding="utf-8"))

fni = {nama: k for k, nama in enumerate(feature_names)}
M = config.FUZZIFIER


def _proyeksi(x_query):
    d = np.linalg.norm(centers - x_query, axis=1)
    if np.any(d == 0):
        u = (d == 0).astype(float); return u / u.sum()
    inv = 1.0 / (d ** (2.0 / (M - 1.0)))
    return inv / inv.sum()


def _cosine(u_query):
    A = u_query / (np.linalg.norm(u_query) + 1e-12)
    B = membership / (np.linalg.norm(membership, axis=1, keepdims=True) + 1e-12)
    return B @ A


def hitung_topn(kandungan, top_n=5):
    """Dari daftar kandungan, hasilkan daftar (product_id, skor) Top-N."""
    x = np.zeros(len(feature_names))
    for k in kandungan:
        if k in fni:
            x[fni[k]] = 1.0
    skor = _cosine(_proyeksi(x))
    urutan = np.argsort(skor)[::-1][:top_n]
    # baris ke-i pada artefak sesuai product_id i+1
    return [(int(i) + 1, round(float(skor[i]), 4)) for i in urutan]