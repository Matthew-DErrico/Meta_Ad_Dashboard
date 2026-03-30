from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from analytics import analytics_router
from exploration import exploration_router
from metadata import metadata_router

app = FastAPI(title="Political Advertising Transparency API")

# tell the frontend to allow requests from server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"], # frontend url
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

app.include_router(analytics_router, prefix="/analytics")
app.include_router(exploration_router, prefix="/exploration")
app.include_router(metadata_router, prefix="/metadata")
