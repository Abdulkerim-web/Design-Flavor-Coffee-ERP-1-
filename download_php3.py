import urllib.request
import os
import tarfile
import ssl

ssl._create_default_https_context = ssl._create_unverified_context

url = 'https://github.com/crazywhalecc/static-php-cli/releases/download/2.2.0/php-8.3.11-cli-linux-x86_64.tar.gz'
print(f"Downloading {url}...")
try:
    req = urllib.request.Request(url)
    req.add_header('User-Agent', 'Mozilla/5.0')
    with urllib.request.urlopen(req) as response, open('php.tar.gz', 'wb') as out_file:
        out_file.write(response.read())
except Exception as e:
    print("Error downloading PHP:", e)
    # fallback 8.2
    url = 'https://github.com/crazywhalecc/static-php-cli/releases/download/2.1.2/php-8.2.19-cli-linux-x86_64.tar.gz'
    print(f"Fallback {url}...")
    try:
        req = urllib.request.Request(url)
        req.add_header('User-Agent', 'Mozilla/5.0')
        with urllib.request.urlopen(req) as response, open('php.tar.gz', 'wb') as out_file:
            out_file.write(response.read())
    except Exception as e:
        print("Fallback failed:", e)
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

print("Downloading composer...")
try:
    req = urllib.request.Request('https://getcomposer.org/composer.phar')
    req.add_header('User-Agent', 'Mozilla/5.0')
    with urllib.request.urlopen(req) as response, open('composer', 'wb') as out_file:
        out_file.write(response.read())
    os.chmod('composer', 0o755)
except Exception as e:
    print("Error downloading composer:", e)

