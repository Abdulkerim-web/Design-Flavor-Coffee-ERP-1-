import urllib.request
import re
import os
import tarfile

url = 'https://github.com/crazywhalecc/static-php-cli/releases/latest'
req = urllib.request.Request(url)
req.add_header('User-Agent', 'Mozilla/5.0')
try:
    with urllib.request.urlopen(req) as response:
        html = response.read().decode('utf-8')
except Exception as e:
    print("Error fetching release HTML:", e)
    exit(1)

# The HTML will contain links like: /crazywhalecc/static-php-cli/releases/download/2.4.0/php-8.3.14-cli-linux-x86_64.tar.gz
matches = re.findall(r'href="([^"]+php-8\.[^"]+-cli-linux-x86_64\.tar\.gz)"', html)
if not matches:
    # try without 8.
    matches = re.findall(r'href="([^"]+php-[^"]+-cli-linux-x86_64\.tar\.gz)"', html)

if not matches:
    print("Could not find download link in HTML")
    exit(1)

# filter out micro
matches = [m for m in matches if 'micro' not in m]

download_path = matches[0]
if not download_path.startswith('http'):
    download_url = 'https://github.com' + download_path
else:
    download_url = download_path

print(f"Downloading {download_url}...")
try:
    req = urllib.request.Request(download_url)
    req.add_header('User-Agent', 'Mozilla/5.0')
    with urllib.request.urlopen(req) as response, open('php.tar.gz', 'wb') as out_file:
        out_file.write(response.read())
except Exception as e:
    print("Error downloading PHP:", e)
    exit(1)

print("Extracting...")
with tarfile.open('php.tar.gz', 'r:gz') as tar:
    tar.extractall(path='.')

if os.path.exists('php'):
    os.chmod('php', 0o755)
    print("PHP is ready!")
else:
    print("Extracted but 'php' binary not found. Listing dir:")
    print(os.listdir('.'))
