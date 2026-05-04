# Wrong Gazette — Deploy Guide
## Server: DigitalOcean droplet at 174.138.92.122
## Target subdomain: wrong.stephenpardue.com (or whatever you pick)

## 1. DNS setup

In Squarespace DNS (stephenpardue.com), add an A record:
- Host: `wrong` (or `dummy`, `gazette`, whatever)
- Points to: `174.138.92.122`
- TTL: 3600

## 2. First-time server setup

SSH into your droplet:
```bash
ssh contact_stephenpardue_com@174.138.92.122
```

Create directories:
```bash
mkdir -p /var/www/wrong-gazette
mkdir -p /var/data/wrong-gazette
```

Clone repo:
```bash
cd /var/www/wrong-gazette
git clone https://github.com/YOUR_USERNAME/wrong-gazette.git .
npm install
```

Create .env:
```bash
cp .env.example .env
nano .env
```

Fill in your real ANTHROPIC_API_KEY and GAZETTE_SECRET_TOKEN.

Build and start:
```bash
npm run build
pm2 start ecosystem.config.cjs
pm2 save
```

## 3. Apache virtual host

```bash
nano /etc/apache2/sites-available/wrong-gazette.conf
```

Paste:
```apache
<VirtualHost *:80>
    ServerName wrong.stephenpardue.com
    ProxyPreserveHost On
    ProxyPass / http://localhost:3002/
    ProxyPassReverse / http://localhost:3002/
</VirtualHost>
```

Enable and get SSL:
```bash
a2ensite wrong-gazette.conf
systemctl reload apache2
certbot --apache -d wrong.stephenpardue.com
```

## 4. Future deploys

On your PC:
```bash
git add .
git commit -m "update"
git push
```

On the server:
```bash
cd /var/www/wrong-gazette
git pull
npm run build
pm2 restart wrong-gazette
```

## 5. The secret knock

Tap the masthead header in this rhythm:
**tap-tap** (pause 600ms+) **tap-tap-tap**

Green flash = unlocked. Stay unlocked 30 minutes.