import importlib.util
import sys
import types
from pathlib import Path
import pytest

ROOT=Path(__file__).resolve().parents[2]
def load_module(module_name,relative_path,injected_modules):
    original_modules ={}
    for name, module in injected_modules.items():
        original_modules[name] = sys.modules.get(name)
        sys.modules[name] = module
    try:
        spec=importlib.util.spec_from_file_location(module_name, ROOT / relative_path)
        module =importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
        return module
    finally:
        for name,original in original_modules.items():
            if original is None:
                sys.modules.pop(name,None)
            else:
                sys.modules[name]=original


def make_fastapi_stub():
    module=types.ModuleType("fastapi")
    class APIRouter:
        def get(self, *args, **kwargs):
            def decorator(func):
                return func
            return decorator

    module.APIRouter = APIRouter
    module.Query = lambda default=None, **kwargs: default
    return module

def make_loader_module():
    loader_module=types.ModuleType("backend.ingestion.snowflake_loader")
    class SnowflakeLoader:
        def run_query(self, query, params=None):
            return []
    loader_module.SnowflakeLoader = SnowflakeLoader
    return loader_module

def make_schemas_modules():
    api_pkg = types.ModuleType("api")
    schemas_module=types.ModuleType("api.schemas")
    schemas_module.OverviewResponse= type("OverviewResponse", (), {})
    schemas_module.AdvertiserSpend = type("AdvertiserSpend", (), {})
    return api_pkg, schemas_module

def make_build_filters_module():
    analytics_module=types.ModuleType("api.analytics")
    def build_filters(geography=None, platform=None, keyword=None, start_date=None, end_date=None):
        conditions = []
        params = {}
        if geography:
            conditions.append("g.geography_name = %(geography)s")
            params["geography"] = geography
        if platform:
            conditions.append("p.platform_name = %(platform)s")
            params["platform"] = platform
        if keyword:
            conditions.append("LOWER(c.campaign_name) LIKE LOWER(%(keyword)s)")
            params["keyword"] = f"%{keyword}%"
        where_clause = "WHERE " + " AND ".join(conditions) if conditions else ""
        return where_clause, params

    analytics_module.build_filters = build_filters
    return analytics_module

def load_analytics_module():
    api_pkg, schemas_module = make_schemas_modules()
    return load_module(
        "test_analytics_module",
        "backend/api/analytics.py",
        {
            "fastapi": make_fastapi_stub(),
            "api": api_pkg,
            "api.schemas": schemas_module,
            "backend.ingestion.snowflake_loader": make_loader_module(),
        },
    )
def load_exploration_module():
    api_pkg, schemas_module = make_schemas_modules()
    return load_module(
        "test_exploration_module",
        "backend/api/exploration.py",
        {
            "fastapi": make_fastapi_stub(),
            "api": api_pkg,
            "api.schemas": schemas_module,
            "api.analytics": make_build_filters_module(),
            "backend.ingestion.snowflake_loader": make_loader_module(),
        },
    )

def load_metadata_module():
    return load_module(
        "test_metadata_module",
        "backend/api/metadata.py",
        {
            "fastapi": make_fastapi_stub(),
            "backend.ingestion.snowflake_loader": make_loader_module(),
        },
    )

#checks null totals come back as zero
def test_get_overview_coerces_null_aggregates_to_zero():
    analytics=load_analytics_module()
    calls=[]
    class FakeLoader:
        def run_query(self, query, params=None):
            calls.append((query, params))
            return [(None, None, None)]
    analytics.sf = FakeLoader()
    assert analytics.get_overview() == {
        "total_spend": 0.0,
        "total_impressions": 0,
        "advertiser_count": 0,
    }
    assert "FROM Fact_Ad_Performance" in calls[0][0]
    assert calls[0][1] is None

#checks filters and row mapping
def test_top_advertisers_applies_filters_and_maps_rows():
    analytics = load_analytics_module()
    calls = []
    class FakeLoader:
        def run_query(self, query, params=None):
            calls.append((query, params))
            return [("Acme", "12.5"), ("Bravo", 4)]
    analytics.sf = FakeLoader()

    assert analytics.top_advertisers(geography="Texas", platform="Facebook") == [
        {"advertiser_name": "Acme", "total_spend": 12.5},
        {"advertiser_name": "Bravo", "total_spend": 4.0},
    ]
    assert "WHERE g.geography_name = %(geography)s" in calls[0][0]
    assert "AND p.platform_name = %(platform)s" in calls[0][0]
    assert calls[0][1] == {"geography": "Texas", "platform": "Facebook"}

#checks trend rows, filters, and spend casting
def test_spend_trend_applies_all_filters_and_coerces_spend():
    analytics=load_analytics_module()
    calls=[]
    class FakeLoader:
        def run_query(self, query,params=None):
            calls.append((query,params))
            return [("2026-03-01", "10.5"), ("2026-03-02", 0)]

    analytics.sf=FakeLoader()
    assert analytics.spend_trend(
        geography="Texas",
        platform="Facebook",
        keyword="education",
        start_date="2026-03-01",
        end_date="2026-03-31",
    )==[
        {"date": "2026-03-01", "total_spend":10.5},
        {"date": "2026-03-02", "total_spend":0.0},
    ]
    assert "g.geography_name = %(geography)s" in calls[0][0]
    assert "p.platform_name = %(platform)s" in calls[0][0]
    assert "LOWER(c.campaign_name) LIKE LOWER(%(keyword)s)" in calls[0][0]
    assert "d.date >= %(start_date)s" in calls[0][0]
    assert "d.date <= %(end_date)s" in calls[0][0]
    assert calls[0][1] == {
        "geography": "Texas",
        "platform": "Facebook",
        "keyword": "%education%",
        "start_date": "2026-03-01",
        "end_date": "2026-03-31",
    }
#checks geography totals and date filters
def test_geography_breakdown_maps_rows_and_date_filters():
    analytics = load_analytics_module()
    calls=[]
    class FakeLoader:
        def run_query(self,query,params=None):
            calls.append((query, params))
            return [("Texas","12.25"),("Ohio",0)]
    analytics.sf = FakeLoader()
    assert analytics.geography_breakdown(
        platform="Instagram",
        keyword="youth",
        start_date="2026-02-01",
        end_date="2026-02-28",
    )==[
        {"geography": "Texas", "total_spend": 12.25},
        {"geography": "Ohio", "total_spend": 0.0},
    ]
    assert "p.platform_name = %(platform)s" in calls[0][0]
    assert "LOWER(c.campaign_name) LIKE LOWER(%(keyword)s)" in calls[0][0]
    assert "d.date >= %(start_date)s" in calls[0][0]
    assert "d.date <= %(end_date)s" in calls[0][0]
    assert calls[0][1]=={
        "platform": "Instagram",
        "keyword": "%youth%",
        "start_date": "2026-02-01",
        "end_date": "2026-02-28",
    }

#checks platform rows with geography and keyword filters
def test_platform_breakdown_maps_rows_with_geography_and_keyword_filters():
    analytics = load_analytics_module()
    calls=[]
    class FakeLoader:
        def run_query(self,query, params=None):
            calls.append((query, params))
            return [("Facebook", "9.5"), ("Instagram", "4")]

    analytics.sf=FakeLoader()

    assert analytics.platform_breakdown(geography="Texas",keyword="school")==[
        {"platform":"Facebook","total_spend":9.5},
        {"platform":"Instagram","total_spend":4.0},
    ]
    assert "g.geography_name = %(geography)s" in calls[0][0]
    assert "LOWER(c.campaign_name) LIKE LOWER(%(keyword)s)" in calls[0][0]
    assert calls[0][1] == {"geography": "Texas", "keyword": "%school%"}


#checks top campaigns keeps requested limit
def test_top_campaigns_respects_limit_and_maps_float_totals():
    analytics = load_analytics_module()
    calls = []

    class FakeLoader:
        def run_query(self, query, params=None):
            calls.append((query, params))
            return [("Spring Push", "15.75")]

    analytics.sf = FakeLoader()
    assert analytics.top_campaigns(
        limit=3,
        geography="Texas",
        platform="Facebook",
        keyword="vote",
    ) == [{"campaign": "Spring Push", "total_spend": 15.75}]
    assert "LIMIT 3" in calls[0][0]
    assert "g.geography_name = %(geography)s" in calls[0][0]
    assert "p.platform_name = %(platform)s" in calls[0][0]
    assert "LOWER(c.campaign_name) LIKE LOWER(%(keyword)s)" in calls[0][0]
    assert calls[0][1] == {
        "geography": "Texas",
        "platform": "Facebook",
        "keyword": "%vote%",
    }

#checks creative counts stay as returned
def test_creative_breakdown_applies_filters_and_preserves_counts():
    analytics=load_analytics_module()
    calls =[]
    class FakeLoader:
        def run_query(self, query, params=None):
            calls.append((query, params))
            return [("VIDEO", 5), ("IMAGE", 2)]
    analytics.sf = FakeLoader()
    assert analytics.creative_breakdown(geography="Texas", platform="Facebook") == [
        {"creative_type": "VIDEO", "ad_count": 5},
        {"creative_type": "IMAGE", "ad_count": 2},
    ]
    assert "g.geography_name = %(geography)s" in calls[0][0]
    assert "p.platform_name = %(platform)s" in calls[0][0]
    assert calls[0][1] == {"geography": "Texas", "platform": "Facebook"}

#checks empty advertiser results
def test_advertiser_details_returns_empty_dict_when_no_rows():
    exploration = load_exploration_module()
    calls=[]
    class FakeLoader:
        def run_query(self, query, params=None):
            calls.append((query, params))
            return []

    exploration.sf=FakeLoader()
    assert exploration.advertiser_details(
        advertiser_id=77,
        geography="Texas",
        platform="Facebook",
    )=={}
    assert "WHERE f.advertiser_id = %(advertiser_id)s" in calls[0][0]
    assert "AND g.geography_name = %(geography)s" in calls[0][0]
    assert "AND p.platform_name = %(platform)s" in calls[0][0]
    assert calls[0][1] == {
        "geography": "Texas",
        "platform": "Facebook",
        "advertiser_id": 77,
    }
#checks search results map rows and filters
def test_search_ads_applies_filters_and_maps_rows():
    exploration=load_exploration_module()
    calls=[]
    class FakeLoader:
        def run_query(self, query, params=None):
            calls.append((query, params))
            return [("Acme", "Spring Push", "21.5")]

    exploration.sf = FakeLoader()

    assert exploration.search_ads(
        keyword="climate",
        geography="Texas",
        platform="Instagram",
    ) == [{"advertiser": "Acme", "campaign": "Spring Push", "total_spend": 21.5}]
    assert "g.geography_name = %(geography)s" in calls[0][0]
    assert "p.platform_name = %(platform)s" in calls[0][0]
    assert "LOWER(c.campaign_name) LIKE LOWER(%(keyword)s)" in calls[0][0]
    assert calls[0][1] == {
        "geography": "Texas",
        "platform": "Instagram",
        "keyword": "%climate%",
    }


#checks empty campaign details return empty dict
def test_campaign_details_returns_empty_dict_when_no_rows():
    exploration = load_exploration_module()
    calls = []

    class FakeLoader:
        def run_query(self, query, params=None):
            calls.append((query, params))
            return []

    exploration.sf = FakeLoader()

    assert exploration.campaign_details(campaign_id=11) == {}
    assert "WHERE f.campaign_id = %(campaign_id)s" in calls[0][0]
    assert calls[0][1] == {"campaign_id": 11}

#checks ad rows and filter params
def test_ads_list_combines_filters_and_casts_numeric_fields():
    exploration = load_exploration_module()
    calls = []

    class FakeLoader:
        def run_query(self, query, params=None):
            calls.append((query, params))
            return [("Acme", "Spring Push", "VIDEO", "19.95", "4000")]

    exploration.sf = FakeLoader()

    assert exploration.ads_list(campaign_id=11, advertiser_id=22, keyword="video") == [
        {
            "advertiser": "Acme",
            "campaign": "Spring Push",
            "creative_type": "VIDEO",
            "spend": 19.95,
            "impressions": 4000,
        }
    ]
    assert "WHERE f.campaign_id = %(campaign_id)s" in calls[0][0]
    assert "AND f.advertiser_id = %(advertiser_id)s" in calls[0][0]
    assert "AND LOWER(cre.creative_type) LIKE LOWER(%(keyword)s)" in calls[0][0]
    assert calls[0][1] == {
        "campaign_id": 11,
        "advertiser_id": 22,
        "keyword": "%video%",
    }
# checks filter lists get flattened
def test_get_filters_flattens_query_results():
    metadata=load_metadata_module()
    calls = []
    class FakeLoader:
        def run_query(self, query, params=None):
            calls.append((query, params))
            if "Dim_Geography" in query:
                return [("Texas",), ("Ohio",)]
            return [("Facebook",), ("Instagram",)]

    metadata.sf = FakeLoader()
    assert metadata.get_filters() == {
        "geographies": ["Texas", "Ohio"],
        "platforms": ["Facebook", "Instagram"],
    }
    assert len(calls) == 2
