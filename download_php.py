import urllib.request
import json
import os
import tarfile

req = urllib.request.Request('https://api.github.com/repos/crazywhalecc/static-php-cli/releases/latest')
req.add_header('User-Agent', 'Mozilla/5.0')
try:
    with urllib.request.urlopen(req) as response:
        data = json.loads(response.read().decode('utf-8'))
except Exception as e:
    print("Error fetching release:", e)
    exit(1)

asset_url = None
for asset in data.get('assets', []):
    name = asset['name']
    if 'linux-x86_64' in name and 'cli' in name and name.endswith('.tar.gz') and 'micro' not in name:
        asset_url = asset['browser_download_url']
        break

if not asset_url:
    print("Could not find static php asset")
    exit(1)

print(f"Downloading {asset_url}...")
try:
    req = urllib.request.Request(asset_url)
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
else:
    print("Extracted but 'php' binary not found. Listing dir:")
    print(os.listdir('.'))

print("Downloading composer...")
try:
    req = urllib.request.Request('https://getcomposer.org/composer.phar')
    req.add_header('User-Agent', 'Mozilla/5.0')
    with urllib.request.urlopen(req) as response, open('composer', 'wb') as out_file:
        out_file.write(response.read())
    os.chmod('composer', 0o755)
except Exception as e:
    print("Error downloading composer:", e)

print("Setup complete.")
