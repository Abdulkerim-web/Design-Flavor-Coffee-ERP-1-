import urllib.request
import os
import tarfile

url = 'https://nodejs.org/dist/v20.17.0/node-v20.17.0-linux-x64.tar.gz'
print(f"Downloading {url}...")
try:
    req = urllib.request.Request(url)
    req.add_header('User-Agent', 'Mozilla/5.0')
    with urllib.request.urlopen(req) as response, open('node.tar.gz', 'wb') as out_file:
        out_file.write(response.read())
except Exception as e:
    print("Error downloading Node:", e)
    exit(1)

print("Extracting...")
with tarfile.open('node.tar.gz', 'r:gz') as tar:
    tar.extractall(path='.')

print("Setup complete.")
