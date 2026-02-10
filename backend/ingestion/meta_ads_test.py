import os
import requests
from dotenv import load_dotenv

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
    print(data)
