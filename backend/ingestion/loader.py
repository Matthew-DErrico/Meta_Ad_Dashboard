import csv

def to_csv(ads,filename="ads_data.csv"):
    if not ads:
        return
    keys=ads[0].keys()
    with open(filename, 'w',newline='',encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=keys)
        writer.writeheader()
        writer.writerows(ads)