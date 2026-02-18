#transformer for the response
def normalize(raw_ads):
    normalized_ads = []
    for ad in raw_ads:
        normalized_ads.append({
            "id": ad.get("id"),
            "page_id": ad.get("page_id"),
            "ad_snapshot_url": f"https://www.facebook.com/ads/archive/render_ad/?id={ad.get('id')}",
            "start_date": ad.get("ad_delivery_start_time"),
            "end_date": ad.get("ad_delivery_end_time",""),
            "impressions": 0,
            "spend": 0.0
        })
    return normalized_ads
