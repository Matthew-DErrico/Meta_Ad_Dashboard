import os
import requests
import json
from dotenv import load_dotenv
import query_builder_test

# Load environment variables from .env
load_dotenv()

# Read the access token securely
ACCESS_TOKEN = os.getenv("META_ACCESS_TOKEN")

if not ACCESS_TOKEN:
    raise ValueError("META_ACCESS_TOKEN not found in environment")

# Meta Ad Library API endpoint
BASE_URL = "https://graph.facebook.com/v18.0/ads_archive"

# Basic test parameters
params = {
    "access_token": ACCESS_TOKEN,
    "ad_type": "POLITICAL_AND_ISSUE_ADS",
    "ad_reached_countries": "US",
    "search_terms": "election",
    "search_type": "KEYWORD_EXACT_PHRASE",
    "limit": 5
}

# Make the request
response = requests.get(BASE_URL, params=params)

# Check result
if response.status_code != 200:
    print("Error:", response.status_code, response.text)
else:
    data = response.json()
    print("Success! Sample response:")
    print(json.dumps(data, indent=4))

# testing query builder
builder = query_builder_test.MetaAdLibraryQuery(ACCESS_TOKEN)

builder.search_terms("election", "KEYWORD_EXACT_PHRASE")

builder.countries(["US"])

builder.ad_type("POLITICAL_AND_ISSUE_ADS")

builder.limit(5)

query = builder.build()

# Make the request
response = requests.get(BASE_URL, params=query)

# Check result
if response.status_code != 200:
    print("Error:", response.status_code, response.text)
else:
    data = response.json()
    print("Success! Sample response:")
    print(json.dumps(data, indent=4))