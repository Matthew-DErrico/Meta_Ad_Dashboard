from fastapi import APIRouter
from fastapi import Query
from typing import Optional
from snowflake_service import SnowflakeService
from analytics import build_filters
from schemas import OverviewResponse
from schemas import AdvertiserSpend

exploration_router = APIRouter()
sf = SnowflakeService()

@exploration_router.get("/search")
def search_ads(
    keyword: str = Query(..., min_length=2),
    geography: Optional[str] = None,
    platform: Optional[str] = None,
):

    filter_clause = build_filters(
        geography,
        platform
    )

    query = f"""
        SELECT
            a.advertiser_name,
            c.campaign_name,
            SUM(f.ad_spend) AS total_spend
        FROM Fact_Ad_Performance f
        JOIN Dim_Advertiser a ON f.advertiser_id = a.advertiser_id
        JOIN Dim_Campaign c ON f.campaign_id = c.campaign_id
        LEFT JOIN Dim_Geography g ON f.geography_id = g.geography_id
        LEFT JOIN Dim_Platform p ON f.platform_id = p.platform_id
        LEFT JOIN Dim_Date d ON f.date_id = d.date_id
        WHERE (
            LOWER(a.advertiser_name) LIKE LOWER(%(keyword)s)
            OR LOWER(c.campaign_name) LIKE LOWER(%(keyword)s)
        )
        {"AND " + filter_clause.replace("WHERE ", "") if filter_clause else ""}
        GROUP BY a.advertiser_name, c.campaign_name
        LIMIT 25
    """

    rows = sf.run_query(query, {"keyword": f"%{keyword}%"})

    return [
        {"advertiser": r[0], "campaign": r[1], "total_spend": float(r[2])}
        for r in rows
    ]

@exploration_router.get("/advertiser-details")
def advertiser_details(
    advertiser_id: int,
    geography: Optional[str] = None,
    platform: Optional[str] = None,
):

    where_clause, params = build_filters(
        geography=geography,
        platform=platform
    )

    params["advertiser_id"] = advertiser_id

    query = f"""
        SELECT
            a.advertiser_name,
            SUM(f.ad_spend) AS total_spend,
            SUM(f.impressions) AS total_impressions,
            COUNT(DISTINCT f.campaign_id) AS campaign_count
        FROM Fact_Ad_Performance f
        JOIN Dim_Advertiser a ON f.advertiser_id = a.advertiser_id
        LEFT JOIN Dim_Geography g ON f.geography_id = g.geography_id
        LEFT JOIN Dim_Platform p ON f.platform_id = p.platform_id
        WHERE f.advertiser_id = %(advertiser_id)s
        {"AND " + where_clause.replace("WHERE ", "") if where_clause else ""}
        GROUP BY a.advertiser_name
    """

    rows = sf.run_query(query, params)

    if not rows:
        return {}

    return {
        "advertiser": rows[0][0],
        "total_spend": float(rows[0][1]),
        "impressions": int(rows[0][2]),
        "campaign_count": int(rows[0][3]),
    }

@exploration_router.get("/campaign-details")
def campaign_details(campaign_id: int):

    query = """
        SELECT
            c.campaign_name,
            SUM(f.ad_spend) AS total_spend,
            SUM(f.impressions) AS impressions,
            MIN(d.date) AS start_date,
            MAX(d.date) AS end_date
        FROM Fact_Ad_Performance f
        JOIN Dim_Campaign c ON f.campaign_id = c.campaign_id
        JOIN Dim_Date d ON f.date_id = d.date_id
        WHERE f.campaign_id = %(campaign_id)s
        GROUP BY c.campaign_name
    """

    rows = sf.run_query(query, {"campaign_id": campaign_id})

    if not rows:
        return {}

    return {
        "campaign": rows[0][0],
        "total_spend": float(rows[0][1]),
        "impressions": int(rows[0][2]),
        "start_date": rows[0][3],
        "end_date": rows[0][4],
    }

@exploration_router.get("/ads")
def ads_list(
    campaign_id: Optional[int] = None,
    advertiser_id: Optional[int] = None,
    keyword: Optional[str] = None,
):

    conditions = []
    params = {}

    if campaign_id:
        conditions.append("f.campaign_id = %(campaign_id)s")
        params["campaign_id"] = campaign_id

    if advertiser_id:
        conditions.append("f.advertiser_id = %(advertiser_id)s")
        params["advertiser_id"] = advertiser_id

    if keyword:
        conditions.append(
            "LOWER(cre.creative_type) LIKE LOWER(%(keyword)s)"
        )
        params["keyword"] = f"%{keyword}%"

    where_clause = ""
    if conditions:
        where_clause = "WHERE " + " AND ".join(conditions)

    query = f"""
        SELECT
            a.advertiser_name,
            c.campaign_name,
            cre.creative_type,
            f.ad_spend,
            f.impressions
        FROM Fact_Ad_Performance f
        JOIN Dim_Advertiser a ON f.advertiser_id = a.advertiser_id
        JOIN Dim_Campaign c ON f.campaign_id = c.campaign_id
        LEFT JOIN Dim_Ad_Creative cre ON f.creative_id = cre.creative_id
        {where_clause}
        LIMIT 100
    """

    rows = sf.run_query(query, params)

    return [
        {
            "advertiser": r[0],
            "campaign": r[1],
            "creative_type": r[2],
            "spend": float(r[3]),
            "impressions": int(r[4]),
        }
        for r in rows
    ]
