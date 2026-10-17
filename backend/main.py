from fastapi import FastAPI
import routes

app = FastAPI(title="serasi API")
app.include_router(routes.router)