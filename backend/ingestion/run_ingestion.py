from client import fetch_ads
from transform import normalize
from loader import to_csv
#populates a csv file with the returned ad results
def run():
    raw_ads = fetch_ads()
    print(raw_ads)
    ads =normalize(raw_ads)
    to_csv(ads) #just for viewing the data before we use snowflake
    #note: snapshot urls do NOT work in browser as I kept the access token out of the csv link

    #can insert the snowflake funtion here
    print("Ads normalized")

if __name__ == '__main__':
    run()