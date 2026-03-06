import csv
import json

def is_recent(date_str):
    if not date_str:
        return False
    # "recent" as defined by containing 2026 given current timestamp
    return '2026' in date_str

data = {}

with open('rss_url_status.csv', 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    for row in reader:
        if row['status'] == 'active' and is_recent(row['last_updated']):
            country = row['country']
            category = row['category']
            url = row['rss_url']
            
            if country not in data:
                data[country] = {}
            if category not in data[country]:
                data[country][category] = []
                
            data[country][category].append(url)

with open('news/rss_sources.js', 'w', encoding='utf-8') as f:
    f.write("window.RSS_SOURCES = ")
    f.write(json.dumps(data, indent=2))
    f.write(";\n")
