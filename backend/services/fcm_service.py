"""Service: logika perhitungan FCM dan cosine (tidak menyentuh database)."""
import json
import numpy as np
import pandas as pd
import config

ARTEFAK = config.ARTIFACT_DIR


def _baca_json(nama_file):
    with open(f"{ARTEFAK}/{nama_file}", encoding="utf-8") as f:
        return json.load(f)


# ===== Muat artefak hasil pelatihan FCM =====
# Ketiga matriks diindeks dengan nomor baris yang sama (urutan produk dari notebook).
CENTERS = np.load(f"{ARTEFAK}/cluster_centers.npy")        # (c, 40)
MEMBERSHIP = np.load(f"{ARTEFAK}/membership_matrix.npy")   # (n, c)
FEATURES = np.load(f"{ARTEFAK}/feature_matrix.npy")        # (n, 40)
feature_names = _baca_json("feature_names.json")
seg_labels = _baca_json("segment_labels.json")
M = _baca_json("config.json")["m"]  # fuzzifier yang dipakai saat pelatihan

# ===== Pemetaan product_id <-> baris artefak =====
# membership.parquet menyimpan product_id untuk tiap baris, sesuai urutan matriks.
product_ids = pd.read_parquet(f"{ARTEFAK}/membership.parquet")["product_id"].to_numpy()
id_to_row = {int(pid): i for i, pid in enumerate(product_ids)}

fni = {name: k for k, name in enumerate(feature_names)}

# segmen dominan tiap baris
segment_of_product = np.argmax(MEMBERSHIP, axis=1)


# ===== Fungsi inti =====
def vektor_dari_kandungan(kandungan):
    """Vektor biner 40-dim: 1 untuk kandungan yang dipilih."""
    x = np.zeros(len(feature_names))
    for k in kandungan:
        if k in fni:
            x[fni[k]] = 1.0
    return x


def proyeksi_keanggotaan(x_query, centers):
    """Proyeksikan vektor kandungan 40-dim ke ruang keanggotaan (inferensi FCM)."""
    d = np.linalg.norm(centers - x_query, axis=1)
    if np.any(d == 0):
        u = (d == 0).astype(float)
        return u / u.sum()
    inv = 1.0 / (d ** (2.0 / (M - 1.0)))
    return inv / inv.sum()


def topn_cosine(u_query, membership, n=5, mask=None, exclude=None,
                x_query=None, X=None, desimal=4):
    """Peringkat dua tingkat: cosine keanggotaan, lalu cosine kandungan sebagai penentu seri.

    Mengembalikan (indeks baris, skor keanggotaan, skor kandungan).
    """
    A = u_query / (np.linalg.norm(u_query) + 1e-12)
    B = membership / (np.linalg.norm(membership, axis=1, keepdims=True) + 1e-12)
    sim = B @ A

    if x_query is not None and X is not None:
        a = x_query / (np.linalg.norm(x_query) + 1e-12)
        b = X / (np.linalg.norm(X, axis=1, keepdims=True) + 1e-12)
        sim2 = b @ a
    else:
        sim2 = np.zeros_like(sim)

    if mask is not None:
        sim = np.where(mask, sim, -np.inf)
    if exclude is not None:
        sim = sim.copy()
        sim[exclude] = -np.inf

    idx = np.lexsort((-sim2, -np.round(sim, desimal)))[:n]
    return idx, sim[idx], sim2[idx]


# ===== Penghubung ke controller (product_id <-> baris) =====
def _mask_dari_ids(allowed_ids):
    """None = semua produk boleh; selain itu hanya baris milik product_id yang lolos filter."""
    if allowed_ids is None:
        return None
    mask = np.zeros(len(product_ids), dtype=bool)
    for pid in allowed_ids:
        row = id_to_row.get(int(pid))
        if row is not None:
            mask[row] = True
    return mask


def _ke_hasil(idx, sim):
    """Ubah indeks baris menjadi [(product_id, skor)], buang baris yang tersaring (-inf)."""
    return [(int(product_ids[i]), round(float(s), 4))
            for i, s in zip(idx, sim) if np.isfinite(s)]


# ===== DEBUG sementara: hapus setelah selesai =====
# produk_metadata.parquet berurutan sama dengan MEMBERSHIP/FEATURES, jadi produk[i] cocok dengan idx
produk = pd.read_parquet(f"{ARTEFAK}/produk_metadata.parquet").to_dict("records")


def _cetak_debug(u_query, idx, sim, sk):
    A = u_query / (np.linalg.norm(u_query) + 1e-12)
    B = MEMBERSHIP / (np.linalg.norm(MEMBERSHIP, axis=1, keepdims=True) + 1e-12)
    sim_semua = B @ A  # skor semua produk, sebelum filter dan top-N
    print('FEATURES ada:', 'FEATURES' in globals())
    print('skor  :', np.round(sim[:5], 8))
    print('kandungan:', np.round(sk[:5], 3))
    print('jumlah produk DB   :', len(produk))
    print('baris FEATURES     :', FEATURES.shape)
    print('baris MEMBERSHIP   :', MEMBERSHIP.shape)
    print('skor maksimum semua:', float(np.round(sim_semua.max(), 8)))
    print('produk skor 1.0    :', int((np.round(sim_semua, 8) == 1.0).sum()))
    for i, s, k in list(zip(idx, sim, sk))[:5]:
        print(f'  idx={i}  {s:.8f}  {k:.3f}  {produk[i]["product"]}  {produk[i]["bahan_aktif"]}')


# ===== Tiga jalur masukan =====
def rekomendasi_dari_kandungan(kandungan, top_n=5, allowed_ids=None):
    """Jalur masalah kulit / kandungan aktif: dari daftar kandungan."""
    xq = vektor_dari_kandungan(kandungan)
    uq = proyeksi_keanggotaan(xq, CENTERS)
    idx, sim, sk = topn_cosine(uq, MEMBERSHIP, n=top_n, mask=_mask_dari_ids(allowed_ids),
                               x_query=xq, X=FEATURES)
    _cetak_debug(uq, idx, sim, sk)  # DEBUG sementara
    return _ke_hasil(idx, sim)


def compute_topn_from_product(product_id, top_n=5, allowed_ids=None):
    """Jalur produk acuan: pakai vektor keanggotaan dan kandungan produk itu sendiri."""
    ref = id_to_row.get(int(product_id))
    if ref is None:
        return []
    idx, sim, sk = topn_cosine(MEMBERSHIP[ref], MEMBERSHIP, n=top_n, mask=_mask_dari_ids(allowed_ids),
                               exclude=ref, x_query=FEATURES[ref], X=FEATURES)
    _cetak_debug(MEMBERSHIP[ref], idx, sim, sk)  # DEBUG sementara
    return _ke_hasil(idx, sim)


# ===== Info segmen tiap produk =====
def _label_segmen(j):
    return seg_labels.get(str(j), f"Segmen {j}")


def get_segment_info(product_id):
    """Mengembalikan (indeks_segmen, label_segmen) sebuah produk."""
    row = id_to_row.get(int(product_id))
    if row is None:
        return -1, "-"
    j = int(segment_of_product[row])
    return j, _label_segmen(j)


def get_membership(product_id):
    """Persentase keanggotaan sebuah produk di tiap segmen."""
    row = id_to_row.get(int(product_id))
    if row is None:
        return []
    u = MEMBERSHIP[row]
    return [{"segmen": _label_segmen(j), "persen": round(float(u[j]) * 100, 1)}
            for j in range(len(u))]


def info_segmen(product_id):
    """Field segmen yang ditempelkan ke data produk sebelum dikirim ke frontend."""
    seg_idx, seg_label = get_segment_info(product_id)
    return {
        "segmen_idx": seg_idx,
        "segmen": seg_label,
        "keanggotaan": get_membership(product_id),
    }
