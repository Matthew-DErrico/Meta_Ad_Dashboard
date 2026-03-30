from fastapi import APIRouter
from fastapi import Query
from typing import Optional
from snowflake_service import SnowflakeService
from sql_service import SQLiteService
from schemas import OverviewResponse
from schemas import AdvertiserSpend

metadata_router = APIRouter()
#sf = SnowflakeService()
sf = SQLiteService()
@metadata_router.get("/filters")
def get_filters():

<<<<<<< HEAD
    geo_query = "SELECT DISTINCT geography_name FROM DIM_GEOGRAPHY"
    platform_query = "SELECT DISTINCT platform_name FROM DIM_PLATFORM"
    ad_query = "SELECT DISTINCT advertiser_name FROM DIM_ADVERTISER"
=======
    geo_query = """
        SELECT DISTINCT PAGE_NAME
        FROM META_ADS_DB.ANALYTICS.FACT_ADS
        WHERE PAGE_NAME IS NOT NULL
        ORDER BY PAGE_NAME
    """

    platform_query = """
        SELECT DISTINCT VALUE::STRING AS PLATFORM
        FROM META_ADS_DB.ANALYTICS.FACT_ADS,
        LATERAL FLATTEN(INPUT => PUBLISHER_PLATFORMS)
        ORDER BY PLATFORM
    """
>>>>>>> 040b65a848d151a154b04045cd908a4af3bee0c2

    geos = sf.run_query(geo_query)
    platforms = sf.run_query(platform_query)
    ads = sf.run_query(ad_query)

    return {
        "geographies": [g[0] for g in geos],   # now PAGE_NAME proxy
        "platforms": [p[0] for p in platforms],
        "advertisers": [a[0] for a in ads]
    }