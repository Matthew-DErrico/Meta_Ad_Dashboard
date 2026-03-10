from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from analytics import analytics_router
from exploration import exploration_router
from metadata import metadata_router


app = FastAPI(title="Political Advertising Transparency API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

@app.get("/")
def root():
    return {"message": "Backend is running!", "status": "ok"}

@app.get("/test")
def test():
    return {"geographies": ["United States", "Canada", "United Kingdom"], "platforms": ["Facebook", "Instagram"]}

app.include_router(analytics_router, prefix="/analytics")
app.include_router(exploration_router, prefix="/exploration")
app.include_router(metadata_router, prefix="/metadata")
