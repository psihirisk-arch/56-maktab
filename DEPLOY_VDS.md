# Инструкция по развёртыванию на VDS (Ubuntu / Debian + Nginx + PM2)

## 1. Требования
- Node.js 22+ (рекомендуется LTS 22.x)
- npm
- PM2 (`npm install -g pm2`)
- Nginx

## 2. Установка и сборка проекта
```bash
cd /var/www/school56
npm install
npm run build
```

При первом запуске сервер автоматически создаст:
- `/data` — локальную файловую базу данных (`admins.json`, `news.json`, `staff.json`, `schedule.json`, `settings.json`)
- `/uploads` — папку для загруженных фотографий новостей и сотрудников

## 3. Запуск через PM2
```bash
pm2 start ecosystem.config.cjs || PORT=3000 NODE_ENV=production pm2 start "node server.ts" --name school56
pm2 save
pm2 startup
```

Сервер раздаёт одновременно и собранный фронтенд из `/dist`, и API `/api/*`, и изображения `/uploads/*` на порту `3000`.

## 4. Конфигурация Nginx (пример для hostmaster.uz)
```nginx
server {
    listen 80;
    server_name your-domain.uz www.your-domain.uz;

    client_max_body_size 2M;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

После настройки Nginx перезагрузите его и подключите SSL-сертификат:
```bash
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d your-domain.uz -d www.your-domain.uz
```
