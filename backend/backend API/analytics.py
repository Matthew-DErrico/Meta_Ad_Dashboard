from fastapi import APIRouter
from fastapi import Query
from typing import Optional
from snowflake_service import SnowflakeService
from schemas import OverviewResponse
from schemas import AdvertiserSpend

analytics_router = APIRouter()
sf = SnowflakeService()

def build_filters(geography=None, platform=None, keyword=None, start_date=None, end_date=None):

    conditions = []
    params = {}

    if geography:
        conditions.append(f"g.geography_name = '{geography}'")
        params["geography"] = geography

    if platform:
        conditions.append(f"p.platform_name = '{platform}'")
        params["platform"] = platform

    if keyword:
        conditions.append(
            f"LOWER(c.campaign_name) LIKE LOWER('%{keyword}%')"
        )
        params["keyword"] = f"%{keyword}%"

    if start_date:
        conditions.append(f"d.date >= '{start_date}'")
        params["start_date"] = start_date

    if end_date:
        conditions.append(f"d.date <= '{end_date}'")
        params["end_date"] = end_date

    where_clause = ""
    if conditions:
        where_clause = "Where" + " AND ".join(conditions)

    return where_clause, params

@analytics_router.get("/overview", response_model=OverviewResponse)
def get_overview():

    query = """
        SELECT
            SUM(ad_spend) AS total_spend,
            SUM(impressions) AS total_impressions,
            COUNT(DISTINCT advertiser_id) AS advertiser_count
        FROM Fact_Ad_Performance
    """

    rows = sf.run_query(query)

    return {
        "total_spend": float(rows[0][0] or 0),
        "total_impressions": int(rows[0][1] or 0),
        "advertiser_count": int(rows[0][2] or 0)
    }

@analytics_router.get("/top-advertisers", response_model=list[AdvertiserSpend])
def top_advertisers(
    geography: Optional[str] = None,
    platform: Optional[str] = None,
):

    where_clause, params = build_filters(geography, platform)

    query = f"""
        SELECT
            a.advertiser_name,
            SUM(f.ad_spend)
        FROM Fact_Ad_Performance f
        JOIN Dim_Advertiser a ON f.advertiser_id = a.advertiser_id
        LEFT JOIN Dim_Geography g ON f.geography_id = g.geography_id
        LEFT JOIN Dim_Platform p ON f.platform_id = p.platform_id
        {where_clause}
        GROUP BY a.advertiser_name
        ORDER BY SUM(f.ad_spend) DESC
        LIMIT 10
    """
    rows = sf.run_query(query, params)

    return [
        {
            "advertiser_name": r[0],
            "total_spend": float(r[1])
        }
        for r in rows
    ]

@analytics_router.get("/spend-trend")
def spend_trend(
    geography: Optional[str] = None,
    platform: Optional[str] = None,
    keyword: Optional[str] = Query(None, min_length=2),
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
):

    where_clause, params = build_filters(
        geography,
        platform,
        keyword,
        start_date,
        end_date
    )

    query = f"""
        SELECT
            d.date,
            SUM(f.ad_spend) AS total_spend
        FROM Fact_Ad_Performance f
        JOIN Dim_Date d ON f.date_id = d.date_id
        LEFT JOIN Dim_Geography g ON f.geography_id = g.geography_id
        LEFT JOIN Dim_Platform p ON f.platform_id = p.platform_id
        LEFT JOIN Dim_Campaign c ON f.campaign_id = c.campaign_id
        {where_clause}
        GROUP BY d.date
        ORDER BY d.date
    """

    rows = sf.run_query(query, params)

    return [
        {"date": r[0], "total_spend": float(r[1])}
        for r in rows
    ]

@analytics_router.get("/geography-breakdown")
def geography_breakdown(
    platform: Optional[str] = None,
    keyword: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
):

    where_clause, params = build_filters(
        geography=None,
        platform=platform,
        keyword=keyword,
        start_date=start_date,
        end_date=end_date
    )

    query = f"""
        SELECT
            g.geography_name,
            SUM(f.ad_spend) AS total_spend
        FROM Fact_Ad_Performance f
        JOIN Dim_Geography g ON f.geography_id = g.geography_id
        LEFT JOIN Dim_Platform p ON f.platform_id = p.platform_id
        LEFT JOIN Dim_Campaign c ON f.campaign_id = c.campaign_id
        LEFT JOIN Dim_Date d ON f.date_id = d.date_id
        {where_clause}
        GROUP BY g.geography_name
        ORDER BY total_spend DESC
    """

    rows = sf.run_query(query, params)

    return [{"geography": r[0], "total_spend": float(r[1])} for r in rows]

@analytics_router.get("/platform-breakdown")
def platform_breakdown(
    geography: Optional[str] = None,
    keyword: Optional[str] = None,
):

    where_clause, params = build_filters(
        geography=geography,
        platform=None,
        keyword=keyword
    )

    query = f"""
        SELECT
            p.platform_name,
            SUM(f.ad_spend) AS total_spend
        FROM Fact_Ad_Performance f
        JOIN Dim_Platform p ON f.platform_id = p.platform_id
        LEFT JOIN Dim_Geography g ON f.geography_id = g.geography_id
        LEFT JOIN Dim_Campaign c ON f.campaign_id = c.campaign_id
        LEFT JOIN Dim_Date d ON f.date_id = d.date_id
        {where_clause}
        GROUP BY p.platform_name
    """

    rows = sf.run_query(query, params)

    return [{"platform": r[0], "total_spend": float(r[1])} for r in rows]


@analytics_router.get("/top-campaigns")
def top_campaigns(
    limit: int = 10,
    geography: Optional[str] = None,
    platform: Optional[str] = None,
    keyword: Optional[str] = None,
):

    where_clause, params = build_filters(
        geography,
        platform,
        keyword
    )

    query = f"""
        SELECT
            c.campaign_name,
            SUM(f.ad_spend) AS total_spend
        FROM Fact_Ad_Performance f
        JOIN Dim_Campaign c ON f.campaign_id = c.campaign_id
        LEFT JOIN Dim_Geography g ON f.geography_id = g.geography_id
        LEFT JOIN Dim_Platform p ON f.platform_id = p.platform_id
        LEFT JOIN Dim_Date d ON f.date_id = d.date_id
        {where_clause}
        GROUP BY c.campaign_name
        ORDER BY total_spend DESC
        LIMIT {limit}
    """

    rows = sf.run_query(query, params)

    return [{"campaign": r[0], "total_spend": float(r[1])} for r in rows]

@analytics_router.get("/creative-breakdown")
def creative_breakdown(
    geography: Optional[str] = None,
    platform: Optional[str] = None,
):

    where_clause, params = build_filters(
        geography,
        platform
    )

    query = f"""
        SELECT
            c.creative_type,
            COUNT(*) AS ad_count
        FROM Fact_Ad_Performance f
        JOIN Dim_Ad_Creative c ON f.creative_id = c.creative_id
        LEFT JOIN Dim_Geography g ON f.geography_id = g.geography_id
        LEFT JOIN Dim_Platform p ON f.platform_id = p.platform_id
        LEFT JOIN Dim_Date d ON f.date_id = d.date_id
        {where_clause}
        GROUP BY c.creative_type
    """

    rows = sf.run_query(query, params)

    return [{"creative_type": r[0], "ad_count": r[1]} for r in rows]
