from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import produk_routes
from routes import rekomendasi_routes

app = FastAPI(title="serasi API")

# Izinkan frontend memanggil backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(produk_routes.router)
app.include_router(rekomendasi_routes.router)