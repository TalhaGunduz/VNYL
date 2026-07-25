# VNYL Deployment Guide

This guide covers the steps to deploy the VNYL project (Laravel Backend + React Frontend) to a production server.

## 1. Backend (Laravel)

### Requirements
- PHP 8.2+
- Composer
- MySQL 8.0+
- Nginx / Apache

### Setup Steps
1. **Upload Files**: Upload the `vnyl-backend` folder to your server.
2. **Install Dependencies**:
   ```bash
   cd vnyl-backend
   composer install --optimize-autoloader --no-dev
   ```
3. **Environment Configuration**:
   - Copy `.env.example` to `.env` if not present.
   - Update the following variables for production:
     ```ini
     APP_ENV=production
     APP_DEBUG=false
     app_url=https://your-domain.com
     
     DB_DATABASE=vnyl_db
     DB_USERNAME=your_db_user
     DB_PASSWORD=your_db_password
     ```
4. **Key & Storage**:
   ```bash
   php artisan key:generate
   php artisan storage:link
   chmod -R 775 storage bootstrap/cache
   ```
5. **Database**:
   ```bash
   php artisan migrate --force
   ```

## 2. Frontend (React)

### Setup Steps
1. **Build**:
   On your local machine (or build server), run:
   ```bash
   cd vnyl-frontend
   npm install
   npm run build
   ```
2. **Upload**:
   - Upload the contents of `vnyl-frontend/dist` to your server's public html folder (or the `public` folder of Laravel if serving from there).
   - *Recommendation*: Serve frontend via Nginx as a static site or inside Laravel's `public` folder depending on your routing strategy.

## 3. Web Server Config (Nginx Example)

```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /var/www/vnyl-backend/public;

    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";

    index index.php;

    charset utf-8;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location = /favicon.ico { access_log off; log_not_found off; }
    location = /robots.txt  { access_log off; log_not_found off; }

    error_page 404 /index.php;

    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php8.2-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
    }

    location ~ /\.(?!well-known).* {
        deny all;
    }
}
```
