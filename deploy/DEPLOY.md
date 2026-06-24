# Deployment Guide — Qeerja di Ubuntu VPS

## Prasyarat Server

```bash
# PHP 8.3+
sudo apt install -y php8.3-cli php8.3-fpm php8.3-mbstring php8.3-xml php8.3-curl \
    php8.3-bcmath php8.3-mysql php8.3-sqlite3 php8.3-zip php8.3-gd php8.3-intl

# Composer
php -r "copy('https://getcomposer.org/installer', 'composer-setup.php');"
php composer-setup.php --install-dir=/usr/local/bin --filename=composer
php -r "unlink('composer-setup.php');"

# Node.js 20+
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# PM2
sudo npm install -g pm2

# Nginx
sudo apt install -y nginx

# MySQL
sudo apt install -y mysql-server

# Supervisor (opsional — alternatif ke PM2 untuk queue)
sudo apt install -y supervisor

# Chromium untuk WhatsApp Gateway
sudo apt install -y chromium-browser
sudo apt install -y ca-certificates fonts-liberation libappindicator3-1 \
    libasound2 libatk-bridge2.0-0 libatk1.0-0 libcups2 libdbus-1-3 \
    libgdk-pixbuf2.0-0 libnspr4 libnss3 libxcomposite1 libxdamager1 \
    libxrandr2 xdg-utils
```

## Setup Aplikasi

```bash
# Clone repo
git clone git@github.com:aryadwiputra/qeerja.git /var/www/taska.web.id
cd /var/www/taska.web.id

# Install PHP dependencies
composer install --no-interaction --prefer-dist --optimize-autoloader

# Install frontend dependencies
npm ci --production

# Setup environment
cp .env.production .env
php artisan key:generate
php artisan storage:link

# Setup database (MySQL)
mysql -u root -p -e "CREATE DATABASE taska CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# Run migrations
php artisan migrate --force

# Build frontend
npm run build

# Install gateway dependencies
cd /var/www/taska.web.id/whatsapp-gateway && npm ci --production && cd ..
cd /var/www/taska.web.id/realtime-gateway && npm ci --production && cd ..

# Set permissions
sudo chown -R deploy:www-data /var/www/taska.web.id
sudo chmod -R 775 /var/www/taska.web.id/storage
sudo chmod -R 775 /var/www/taska.web.id/bootstrap/cache
```

## PM2 — Start Services

```bash
# Copy ecosystem file dan start
cp /var/www/taska.web.id/deploy/ecosystem.config.js /var/www/taska.web.id/
pm2 start ecosystem.config.js
pm2 save
sudo pm2 startup  # ikuti output untuk enable systemd
```

## Supervisor — Queue Worker (alternatif)

```bash
sudo cp /var/www/taska.web.id/deploy/supervisor-queue.conf /etc/supervisor/conf.d/qeerja-queue.conf
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start qeerja-queue:*
```

## Nginx

```bash
# Sesuaikan domain, SSL, dan path di deploy/nginx.conf lalu:
sudo cp /var/www/taska.web.id/deploy/nginx.conf /etc/nginx/sites-available/taska.web.id
sudo ln -s /etc/nginx/sites-available/taska.web.id /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

## WhatsApp Gateway — Setup Awal

```bash
# Generate API token
php -r "echo bin2hex(random_bytes(16)) . PHP_EOL;"
# Copy output → WHATSAPP_API_TOKEN di .env

# Cd ke whatsapp-gateway, jalankan untuk scan QR:
pm2 logs qeerja-whatsapp

# Atau via terminal:
cd /var/www/taska.web.id/whatsapp-gateway
node index.js
# Scan QR yang muncul, lalu Ctrl+C (PM2 akan handle selanjutnya)
```

## Update Aplikasi

```bash
cd /var/www/taska.web.id

# Pull latest code
git pull origin develop

# Update dependencies
composer install --no-interaction --prefer-dist --optimize-autoloader
npm ci --production
cd whatsapp-gateway && npm ci --production && cd ..
cd realtime-gateway && npm ci --production && cd ..

# Database migrations
php artisan migrate --force

# Rebuild frontend
npm run build

# Restart services
pm2 restart all
sudo supervisorctl restart all

# Clear cache
php artisan optimize:clear
```

## Monitoring

```bash
pm2 status                    # semua service
pm2 logs qeerja-whatsapp     # log WhatsApp gateway
pm2 logs qeerja-realtime     # log Realtime gateway
pm2 monit                     # realtime CPU/memory

# Laravel logs
tail -f /var/www/taska.web.id/storage/logs/laravel.log
```

## Env Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `APP_ENV` | Environment | `production` |
| `APP_DEBUG` | Debug mode | `false` |
| `APP_URL` | Application URL | `https://taska.web.id` |
| `DB_CONNECTION` | Database driver | `mysql` |
| `SESSION_DOMAIN` | Cookie domain | `.taska.web.id` |
| `LOG_LEVEL` | Log level | `warning` |
| `WHATSAPP_GATEWAY_URL` | WhatsApp gateway | `http://127.0.0.1:3001` |
| `WHATSAPP_API_TOKEN` | WhatsApp auth token | (random 32 hex) |
| `REALTIME_GATEWAY_URL` | Realtime gateway | `http://127.0.0.1:3002` |
| `REALTIME_API_TOKEN` | Realtime auth token | (random 32 hex) |
| `VITE_SOCKETIO_URL` | Socket.IO client URL | `https://taska.web.id` |
