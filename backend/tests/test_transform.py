from backend.ingestion.transform_ads import normalize_ads
import pytest
#checks nested body text and ranges
def test_normalize_ads_extracts_nested_body_and_formats_ranges():
    raw_ads = [
        {
            "id": "ad-1",
            "page_id": "page-1",
            "page_name": "Example Page",
            "ad_creation_time": "2026-03-01T00:00:00+0000",
            "ad_delivery_start_time": "2026-03-02",
            "ad_delivery_stop_time": "2026-03-03",
            "ad_creative_bodies": [{"text": "Vote now"}],
            "ad_creative_link_title": "Title",
            "ad_creative_link_description": "Description",
            "ad_creative_link_caption": "Caption",
            "impressions": {"lower_bound": "100", "upper_bound": "199"},
            "spend": {"lower_bound": "10", "upper_bound": "19"},
            "publisher_platforms": ["FACEBOOK", "INSTAGRAM"],
            "ad_snapshot_url": "https://example.com/ad-1",
        }
    ]
    assert normalize_ads(raw_ads)==[
        {
            "ad_id": "ad-1",
            "page_id": "page-1",
            "page_name": "Example Page",
            "ad_creation_time": "2026-03-01T00:00:00+0000",
            "start_date": "2026-03-02",
            "end_date": "2026-03-03",
            "ad_text": "Vote now",
            "link_title": "Title",
            "link_description": "Description",
            "link_caption": "Caption",
            "impressions_range": "100-199",
            "spend_range": "10-19",
            "publisher_platforms": ["FACEBOOK", "INSTAGRAM"],
            "snapshot_url": "https://example.com/ad-1",
        }
    ]
#checks missing fields use defaults
def test_normalize_ads_default_missing_fields():
    raw_ads=[{
            "id": "ad-2",
            "page_id": "page-2",
            "page_name": "Fallback Page",
            "ad_delivery_start_time": "2026-03-10",
            "ad_delivery_stop_time": "2026-03-12",
            "ad_creative_bodies": ["Plain text body"],
            "ad_snapshot_url": "https://example.com/ad-2",
        }]
    normalized = normalize_ads(raw_ads)[0]
    assert normalized["ad_creation_time"] == "2026-03-10"
    assert normalized["ad_text"] == "Plain text body"
    assert normalized["publisher_platforms"] == []
    assert normalized["impressions_range"] is None
    assert normalized["spend_range"] is None

#checks broken bounds get ignored
def test_normalize_ads_ignores_incomplete_bounds_and_non_list_bodies():
    raw_ads=[
        {
            "id": "ad-3",
            "page_id": "page-3",
            "page_name": "Incomplete Bounds",
            "ad_creation_time": "2026-03-15",
            "ad_creative_bodies": {"text": "not-a-list"},
            "impressions": {"lower_bound": "100"},
            "spend": {"upper_bound": "25"},
        }]
    normalized=normalize_ads(raw_ads)[0]
    assert normalized["ad_text"] is None
    assert normalized["impressions_range"] is None
    assert normalized["spend_range"] is None

#checks zero bounds are a known gap
@pytest.mark.xfail(reason="normalize_ads currently drops zero-valued bounds because it checks truthiness.")
def test_normalize_ads_preserves_zero_bounds():
    raw_ads=[
        {"id":"ad-4",
            "page_id":"page-4",
            "page_name":"Zero Bounds",
            "ad_delivery_start_time":"2026-03-20",
            "impressions": {"lower_bound":0, "upper_bound": 0},
            "spend": {"lower_bound": 0,"upper_bound": 5},
        }
    ]
    normalized=normalize_ads(raw_ads)[0]
    assert normalized["impressions_range"]== "0-0"
    assert normalized["spend_range"] =="0-5"
