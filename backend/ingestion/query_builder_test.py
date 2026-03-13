from typing import List, Optional

class MetaAdLibraryQuery:
    def __init__(self, access_token: str):
        self.access_token = access_token
        self.params = {
            "fields": [],
            "limit": 100
        }

    def search_terms(self, terms: str, search_type: str = "KEYWORD_UNORDERED"):
        if terms:
            self.params["search_terms"] = terms
            self.params["search_type"] = search_type
        return self

    def countries(self, codes: List[str] = ["US"]):
        if codes:
            self.params["ad_reached_countries"] = ",".join(codes)
        return self

    def ad_type(self, ad_type: str):
        self.params["ad_type"] = ad_type
        return self

    def active_status(self, status: str):
        self.params["ad_active_status"] = status
        return self

    def publisher_platforms(self, platforms: List[str]):
        if platforms:
            self.params["publisher_platforms"] = ",".join(platforms)
        return self

    def languages(self, langs: List[str]):
        if langs:
            self.params["languages"] = ",".join(langs)
        return self

    def date_range(self, start: str, end: str):
        if start:
            self.params["ad_delivery_date_min"] = start
        if end:
            self.params["ad_delivery_date_max"] = end
        return self

    def regions(self, regions: List[str]):
        if regions:
            self.params["delivery_by_region"] = ",".join(regions)
        return self

    def bylines(self, bylines: List[str]):
        if bylines:
            self.params["bylines"] = ",".join(bylines)
        return self

    def estimated_audience_min(self, value: int):
        self.params["estimated_audience_size_min"] = value
        return self

    def estimated_audience_max(self, value: int):
        self.params["estimated_audience_size_max"] = value
        return self

    def add_fields(self, fields: List[str]):
        self.params.setdefault("fields", []).extend(fields)
        return self

    def limit(self, n: int):
        self.params["limit"] = n
        return self

    def build(self):
        # convert fields list to comma-separated string
        if self.params.get("fields"):
            self.params["fields"] = ",".join(self.params["fields"])
        self.params["access_token"] = self.access_token
        return dict(self.params)
