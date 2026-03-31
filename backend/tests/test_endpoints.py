import importlib.util
import sys
import types
from pathlib import Path

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


#checks empty advertiser results
def test_advertiser_details_returns_empty_dict_when_no_rows():
    exploration = load_exploration_module()
    calls = []
    class FakeLoader:
        def run_query(self, query, params=None):
            calls.append((query, params))
            return []

    exploration.sf = FakeLoader()
    assert exploration.advertiser_details(
        advertiser_id=77,
        geography="Texas",
        platform="Facebook",
    ) == {}
    assert "WHERE f.advertiser_id = %(advertiser_id)s" in calls[0][0]
    assert "AND g.geography_name = %(geography)s" in calls[0][0]
    assert "AND p.platform_name = %(platform)s" in calls[0][0]
    assert calls[0][1] == {
        "geography": "Texas",
        "platform": "Facebook",
        "advertiser_id": 77,
    }

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
