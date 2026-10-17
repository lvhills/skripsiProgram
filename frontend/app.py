import streamlit as st
import requests

st.set_page_config(page_title="serasi", page_icon="🌿", layout="wide")

# Alamat backend FastAPI
BACKEND = "http://127.0.0.1:8000"

st.title("serasi")
st.caption("rekomendasi skincare berdasarkan profil bahan aktif")

st.header("Cari rekomendasi")

# Pilihan masalah kulit (harus sama dengan yang ada di backend)
masalah = st.selectbox("Apa masalah kulitmu?", ["Jerawat", "Kemerahan", "Kering", "Kusam"])
top_n = st.slider("Jumlah rekomendasi", 3, 15, 5)

if st.button("Cari produk mirip"):
    # Mengirim permintaan ke backend
    try:
        respon = requests.get(f"{BACKEND}/rekomendasi",
                              params={"masalah": masalah, "top_n": top_n})
        data = respon.json()
    except Exception as e:
        st.error(f"Gagal menghubungi backend. Pastikan backend berjalan. ({e})")
        st.stop()

    # Menampilkan hasil
    st.caption("Kandungan terkait: " + ", ".join(data["kandungan"]))
    st.subheader(f"{len(data['hasil'])} produk paling mirip")
    for produk in data["hasil"]:
        with st.container(border=True):
            st.markdown(f"**{produk['product']}** — {produk['brand']}")
            st.caption(f"{produk['category']} · kemiripan {produk['similarity']}")