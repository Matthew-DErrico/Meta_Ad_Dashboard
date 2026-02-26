from pydantic import BaseModel

class OverviewResponse(BaseModel):
    total_spend: float
    total_impressions: int
    advertiser_count: int

class AdvertiserSpend(BaseModel):
    advertiser_name: str
    total_spend: float
