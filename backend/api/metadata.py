from fastapi import APIRouter
from backend.ingestion.snowflake_loader import SnowflakeLoader

metadata_router = APIRouter()
sf = SnowflakeLoader()

@metadata_router.get("/filters")
def get_filters():
    geo_query = "SELECT DISTINCT geography_name FROM Dim_Geography"
    platform_query = "SELECT DISTINCT platform_name FROM Dim_Platform"

    geos = sf.run_query(geo_query)
    platforms = sf.run_query(platform_query)

    return {
        "geographies": [g[0] for g in geos],
        "platforms": [p[0] for p in platforms],
    }