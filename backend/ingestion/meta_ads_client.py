"""
meta_ads_client.py – Meta Ads Library API client

This module provides a function to fetch political/issue ads from Meta's
Ads Archive endpoint. It uses the `ads_read` permission and returns raw JSON.
"""

import os
import requests
from dotenv import load_dotenv

# Load environment variables from .env file (META_ACCESS_TOKEN)
load_dotenv()

BASE_URL = "https://graph.facebook.com/v24.0/ads_archive"

ACCESS_TOKEN = os.getenv("META_ACCESS_TOKEN")


def fetch_ads(search_term="election", country="US", limit=2500, after=None):
    """
    Fetch political/issue ads from Meta Ads Library.

    Parameters
    ----------
    search_term : str, default "election"
        Keyword to filter ads by text content.
    country : str, default "US"
        Two-letter country code for ads reached.
    limit : int, default 25
        Number of ads per page (max 50).
    after : str, optional
        Pagination cursor for the next page of results.

    Returns
    -------
    dict
        JSON response from Meta API containing 'data' list and 'paging' info.

    Raises
    ------
    requests.exceptions.HTTPError
        If the API returns a non-200 status code.
    """
    params = {
        "access_token": ACCESS_TOKEN,
        "ad_type": "POLITICAL_AND_ISSUE_ADS",
        "ad_reached_countries": country,
        "search_terms": search_term,
        "limit": limit,

        # SAFE FIELDS – these are allowed with the `ads_read` permission.
        # No sensitive or user-specific data is requested.
        "fields": ",".join([
            "id",
            "page_id",
            "page_name",
            "ad_creation_time",
            "ad_delivery_start_time",
            "ad_delivery_stop_time",
            "ad_creative_bodies",
            "publisher_platforms",
            "impressions",
            "spend",
            "ad_snapshot_url"
        ])
    }

    # Add pagination cursor if provided
    if after:
        params["after"] = after

    response = requests.get(BASE_URL, params=params)

    # If the request failed, print the error and raise an exception
    if response.status_code != 200:
        print("API ERROR:")
        print(response.text)
        response.raise_for_status()

    return response.json()