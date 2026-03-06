import os
import requests
from dotenv import load_dotenv

load_dotenv()

BASE_URL = "https://graph.facebook.com/v24.0/ads_archive"

ACCESS_TOKEN = os.getenv("META_ACCESS_TOKEN")


def fetch_ads(search_term="election", country="US", limit=25, after=None):

    params = {
        "access_token": ACCESS_TOKEN,
        "ad_type": "POLITICAL_AND_ISSUE_ADS",
        "ad_reached_countries": country,
        "search_terms": search_term,
        "limit": limit,

        # SAFE FIELDS (allowed with ads_read)
        "fields": ",".join([
            "id",
            "page_id",
            "page_name",
            "ad_creation_time",
            "ad_delivery_start_time",
            "ad_delivery_stop_time",
            "ad_creative_bodies",
            "publisher_platforms",
            "ad_snapshot_url"
        ])
    }

    if after:
        params["after"] = after

    response = requests.get(BASE_URL, params=params)

    if response.status_code != 200:
        print("API ERROR:")
        print(response.text)
        response.raise_for_status()

    return response.json()
