import sys
import types

#mock snowflake_loader so analytics import doesn't fail
mockModule=types.ModuleType("backend.ingestion.snowflake_loader")
class SnowflakeLoader:
    pass
mockModule.SnowflakeLoader=SnowflakeLoader
sys.modules["backend.ingestion.snowflake_loader"]=mockModule
#same thing for the api module
import backend.api as real_api
sys.modules["api"]=real_api
from backend.api.analytics import build_filters

###############################################

class TestBuildFilters:
    #checks empty case
    def test_empty_filters(self):
        where_clause,params=build_filters()
        assert where_clause ==""
        assert params=={}

    #checks the geography filter
    def test_geography(self):
        where_clause, params = build_filters(geography="Texas")
        assert where_clause == "WHERE g.geography_name = %(geography)s"
        assert params == {"geography": "Texas"}

    #checks the platform filter
    def test_platform(self):
        where_clause, params = build_filters(platform="Facebook")
        assert where_clause == "WHERE p.platform_name = %(platform)s"
        assert params == {"platform":"Facebook"}

    #checks the keyword wildcards
    def test_keyword_wildcards(self):
        where_clause,params=build_filters(keyword="election")
        assert where_clause=="WHERE LOWER(c.campaign_name) LIKE LOWER(%(keyword)s)"
        assert params=={"keyword":"%election%"}

    #checks the start date filter
    def test_start_date(self):
        where_clause,params=build_filters(start_date="2026-01-01")
        assert where_clause =="WHERE d.date >= %(start_date)s"
        assert params=={"start_date": "2026-01-01"}

    #checks the end date filter
    def test_end_date(self):
        where_clause,params=build_filters(end_date="2026-01-31")
        assert where_clause=="WHERE d.date <= %(end_date)s"
        assert params=={"end_date":"2026-01-31"}

    #checks all filters together
    def test_all_filters(self):
        where_clause,params=build_filters(
            geography="Texas",
            platform="Facebook",
            keyword="election",
            start_date="2026-01-01",
            end_date="2026-01-31",
        )
        assert where_clause==(
            "WHERE g.geography_name = %(geography)s "
            "AND p.platform_name = %(platform)s "
            "AND LOWER(c.campaign_name) LIKE LOWER(%(keyword)s) "
            "AND d.date >= %(start_date)s "
            "AND d.date <= %(end_date)s"
        )
        assert params=={
            "geography":"Texas",
            "platform":"Facebook",
            "keyword":"%election%",
            "start_date":"2026-01-01",
            "end_date":"2026-01-31",
        }

    #checks empty values get skipped
    def test_skips_empty_values(self):
        where_clause, params=build_filters(
            geography="",
            platform=None,
            keyword="",
            start_date=None,
            end_date="",
        )
        assert where_clause==""
        assert params=={}

    #checks if keyword stays parameterized
    def test_keyword_stays_parameterized(self):
        keyword="sale_2026%' OR 1=1 --"
        where_clause,params=build_filters(keyword=keyword)
        assert "LOWER(c.campaign_name) LIKE LOWER(%(keyword)s)" in where_clause
        assert params=={"keyword":f"%{keyword}%"}

    #checks smaller filter combo
    def test_geography_and_keyword(self):
        where_clause,params=build_filters(geography="Texas", keyword="election")
        assert where_clause==(
            "WHERE g.geography_name = %(geography)s "
            "AND LOWER(c.campaign_name) LIKE LOWER(%(keyword)s)")
        assert params=={"geography": "Texas", "keyword": "%election%"}

    #checks another combo
    def test_platform_and_dates(self):
        where_clause, params = build_filters(
            platform="Facebook",
            start_date="2026-01-01",
            end_date="2026-01-31",
        )
        assert where_clause==(
            "WHERE p.platform_name = %(platform)s "
            "AND d.date >= %(start_date)s "
            "AND d.date <= %(end_date)s")
        assert params =={
            "platform": "Facebook",
            "start_date": "2026-01-01",
            "end_date": "2026-01-31",
        }

    #checks where only shows up once
    def test_one_where(self):
        where_clause,_=build_filters(
            geography="Texas",
            platform="Facebook",
            keyword="election",
        )
        assert where_clause.count("WHERE ")==1
        assert where_clause.startswith("WHERE ")

    #checks param order stays the same
    def test_param_order(self):
        _,params=build_filters(
            geography="Texas",
            platform="Facebook",
            keyword="election",
            start_date="2026-01-01",
            end_date="2026-01-31",
        )
        assert list(params.keys()) == [
            "geography",
            "platform",
            "keyword",
            "start_date",
            "end_date",]

    #checks spaces still count as values
    def test_whitespace_values(self):
        where_clause,params=build_filters(geography="   ", keyword=" ")
        assert where_clause==(
            "WHERE g.geography_name = %(geography)s "
            "AND LOWER(c.campaign_name) LIKE LOWER(%(keyword)s)"
        )
        assert params =={"geography": "   ", "keyword": "% %"}

    #checks dates are not validated here
    def test_malformed_dates(self):
        where_clause,params =build_filters(
            start_date="not-a-date",
            end_date="2026-99-99",)
        assert where_clause == (
            "WHERE d.date >= %(start_date)s "
            "AND d.date <= %(end_date)s")
        assert params == {"start_date":"not-a-date","end_date":"2026-99-99"}
