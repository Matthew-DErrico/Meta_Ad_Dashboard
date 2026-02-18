import os
import requests
from dotenv import load_dotenv

load_dotenv()
ACCESS_TOKEN = os.getenv("META_ACCESS_TOKEN")
BASE_URL = "https://graph.facebook.com/v18.0/ads_archive"

if not ACCESS_TOKEN:
    raise ValueError("META_ACCESS_TOKEN not found in environment")

def fetch_ads(search_terms=input("[FOR TESTING] enter search term (ex: election, Desantis...): "),countries=["US"],ad_type="POLITICAL_AND_ISSUE_ADS",limit=10):
    params ={
        "access_token": ACCESS_TOKEN,
        "ad_type": ad_type,
        "ad_reached_countries": ",".join(countries),
        "search_terms": search_terms,
        "search_type": "KEYWORD_EXACT_PHRASE",
        "limit": limit,
    }
    response = requests.get(BASE_URL, params=params)
    response.raise_for_status()
    return response.json().get("data",[])