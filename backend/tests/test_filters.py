import sys
import types
#mock snowflake_loader so analytics import doesn't fail
#I have no idea what the import issue is here but this workaround works
mockModule=types.ModuleType("backend.ingestion.snowflake_loader")
class SnowflakeLoader:
    pass
mockModule.SnowflakeLoader=SnowflakeLoader
sys.modules["backend.ingestion.snowflake_loader"] = mockModule

#same thing for the api module
import backend.api as real_api
sys.modules["api"]=real_api
from backend.api.analytics import build_filters

class TestBuildFilters:
    #checks empty case
    def test_returns_empty_when_no_filters(self):
        where_clause,params=build_filters()
        assert where_clause ==""
        assert params=={}

    #checks the geography filter
    def test_geography_filter(self):
        where_clause, params = build_filters(geography="Texas")
        assert where_clause == "WHERE g.geography_name = %(geography)s"
        assert params == {"geography": "Texas"}

    #checks the platform filter
    def test_platform_filter(self):
        where_clause, params = build_filters(platform="Facebook")
        assert where_clause == "WHERE p.platform_name = %(platform)s"
        assert params == {"platform":"Facebook"}

    #checks the keyword wildcards
    def test_adds_keyword_filter_wildcards(self):
        where_clause,params=build_filters(keyword="election")
        assert where_clause=="WHERE LOWER(c.campaign_name) LIKE LOWER(%(keyword)s)"
        assert params=={"keyword":"%election%"}

    #checks the start date filter
    def test_start_date_filter(self):
        where_clause,params=build_filters(start_date="2026-01-01")
        assert where_clause =="WHERE d.date >= %(start_date)s"
        assert params=={"start_date": "2026-01-01"}

    #checks the end date filter
    def test_end_date_filter(self):
        where_clause,params=build_filters(end_date="2026-01-31")
        assert where_clause=="WHERE d.date <= %(end_date)s"
        assert params=={"end_date":"2026-01-31"}

    #checks all filters together
    def test_combines_all_filters(self):
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
    def test_ignore_bad_filter_values(self):
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
    def test_parameterized_value(self):
        keyword="sale_2026%' OR 1=1 --"
        where_clause,params=build_filters(keyword=keyword)
        assert "LOWER(c.campaign_name) LIKE LOWER(%(keyword)s)" in where_clause
        assert params=={"keyword":f"%{keyword}%"}

    #checks smaller filter combo
    def test_partial_combination_geography_and_keyword(self):
        where_clause,params=build_filters(geography="Texas", keyword="election")
        assert where_clause==(
            "WHERE g.geography_name = %(geography)s "
            "AND LOWER(c.campaign_name) LIKE LOWER(%(keyword)s)")
        assert params=={"geography": "Texas", "keyword": "%election%"}

    #checks another combo
    def test_partial_combo(self):
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
    def test_where_clause_contains_single_where_prefix(self):
        where_clause,_=build_filters(
            geography="Texas",
            platform="Facebook",
            keyword="election",
        )
        assert where_clause.count("WHERE ")==1
        assert where_clause.startswith("WHERE ")

    #checks param order stays the same
    def test_params_key_order_matches_filter_order(self):
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
            "end_date",
        ]

    #checks spaces still count as values
    def test_whitespace_only_values_are_treated_as_truthy(self):
        where_clause,params=build_filters(geography="   ", keyword=" ")
        assert where_clause==(
            "WHERE g.geography_name = %(geography)s "
            "AND LOWER(c.campaign_name) LIKE LOWER(%(keyword)s)"
        )
        assert params =={"geography": "   ", "keyword": "% %"}

    #checks special like chars pass through
    def test_keyword_with_percent_and_underscore_passed_as_is(self):
        where_clause, params = build_filters(keyword="100%_match")
        assert where_clause == "WHERE LOWER(c.campaign_name) LIKE LOWER(%(keyword)s)"
        assert params == {"keyword": "%100%_match%"}

    #checks dates are not validated here
    def test_malformed_dates_are_not_validated_in_filter(self):
        where_clause,params =build_filters(
            start_date="not-a-date",
            end_date="2026-99-99",)
        assert where_clause == (
            "WHERE d.date >= %(start_date)s "
            "AND d.date <= %(end_date)s")
        assert params == {"start_date":"not-a-date","end_date":"2026-99-99"}
