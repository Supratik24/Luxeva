import urllib.request
import re

url = 'https://dribbble.com/shots/16415848-Dark-mode-toggle'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'})
try:
    html = urllib.request.urlopen(req).read().decode('utf-8')
    # Find all hex colors in the HTML
    matches = re.findall(r'#[A-Fa-f0-9]{6}\b', html)
    print('Found hex colors:', list(set(matches)))
except Exception as e:
    print('Error:', e)
