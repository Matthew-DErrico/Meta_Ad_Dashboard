from fastapi import APIRouter
from snowflake_service import SnowflakeService
from schemas import OverviewResponse
from schemas import AdvertiserSpend

router = APIRouter()
sf = SnowflakeService()


@router.get("/overview", response_model=OverviewResponse)
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

@router.get("/top-advertisers", response_model=list[AdvertiserSpend])
def top_advertisers(limit: int = 10):

    query = f"""
        SELECT
            a.advertiser_name,
            SUM(f.ad_spend) AS total_spend
        FROM Fact_Ad_Performance f
        JOIN Dim_Advertiser a
            ON f.advertiser_id = a.advertiser_id
        GROUP BY a.advertiser_name
        ORDER BY total_spend DESC
        LIMIT {limit}
    """

    rows = sf.run_query(query)

    return [
        {
            "advertiser_name": r[0],
            "total_spend": float(r[1])
        }
        for r in rows
    ]

@router.get("/spend-trend")
def spend_trend():

    query = """
        SELECT
            d.date,
            SUM(f.ad_spend) AS total_spend
        FROM Fact_Ad_Performance f
        JOIN Dim_Date d
            ON f.date_id = d.date_id
        GROUP BY d.date
        ORDER BY d.date
    """

    rows = sf.run_query(query)

    return [
        {"date": r[0], "total_spend": float(r[1])}
        for r in rows
    ]

@router.get("/geography-breakdown")
def geography_breakdown():

    query = """
        SELECT
            g.geography_name,
            SUM(f.ad_spend) AS total_spend
        FROM Fact_Ad_Performance f
        JOIN Dim_Geography g
            ON f.geography_id = g.geography_id
        GROUP BY g.geography_name
        ORDER BY total_spend DESC
    """

    rows = sf.run_query(query)

    return [
        {"geography": r[0], "total_spend": float(r[1])}
        for r in rows
    ]

@router.get("/platform-breakdown")
def platform_breakdown():

    query = """
        SELECT
            p.platform_name,
            SUM(f.ad_spend) AS total_spend
        FROM Fact_Ad_Performance f
        JOIN Dim_Platform p
            ON f.platform_id = p.platform_id
        GROUP BY p.platform_name
    """

    rows = sf.run_query(query)

    return [
        {"platform": r[0], "total_spend": float(r[1])}
        for r in rows
    ]

@router.get("/top-campaigns")
def top_campaigns(limit: int = 10):

    query = f"""
        SELECT
            c.campaign_name,
            SUM(f.ad_spend) AS total_spend
        FROM Fact_Ad_Performance f
        JOIN Dim_Campaign c
            ON f.campaign_id = c.campaign_id
        GROUP BY c.campaign_name
        ORDER BY total_spend DESC
        LIMIT {limit}
    """

    rows = sf.run_query(query)

    return [
        {"campaign": r[0], "total_spend": float(r[1])}
        for r in rows
    ]

@router.get("/creative-breakdown")
def creative_breakdown():

    query = """
        SELECT
            c.creative_type,
            COUNT(*) AS ad_count
        FROM Fact_Ad_Performance f
        JOIN Dim_Ad_Creative c
            ON f.creative_id = c.creative_id
        GROUP BY c.creative_type
    """

    rows = sf.run_query(query)

    return [
        {"creative_type": r[0], "ad_count": r[1]}
        for r in rows
    ]

from fastapi import Query

@router.get("/search")
def search_ads(keyword: str = Query(..., min_length=2)):

    query = f"""
        SELECT
            a.advertiser_name,
            c.campaign_name,
            SUM(f.ad_spend) AS total_spend
        FROM Fact_Ad_Performance f
        JOIN Dim_Advertiser a
            ON f.advertiser_id = a.advertiser_id
        JOIN Dim_Campaign c
            ON f.campaign_id = c.campaign_id
        WHERE
            LOWER(a.advertiser_name) LIKE LOWER('%{keyword}%')
            OR LOWER(c.campaign_name) LIKE LOWER('%{keyword}%')
        GROUP BY a.advertiser_name, c.campaign_name
        LIMIT 25
    """

    rows = sf.run_query(query)

    return [
        {
            "advertiser": r[0],
            "campaign": r[1],
            "total_spend": float(r[2])
        }
        for r in rows
    ]
