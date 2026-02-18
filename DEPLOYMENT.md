# 🚀 Deployment Guide

## Production Deployment Options

### Option 1: Traditional Server (VPS/Dedicated)

#### Prerequisites
- Ubuntu 20.04+ or similar Linux server
- Node.js 18+
- PostgreSQL 13+
- Nginx
- Domain name (optional)

#### Step 1: Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Install Nginx
sudo apt install -y nginx

# Install PM2 (process manager)
sudo npm install -g pm2
```

#### Step 2: Database Setup

```bash
# Switch to postgres user
sudo -u postgres psql

# Create database and user
CREATE DATABASE library_db;
CREATE USER library_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE library_db TO library_user;
\q

# Import schema
psql -U library_user -d library_db -f database/schema.sql
```

#### Step 3: Backend Deployment

```bash
# Clone repository
git clone <your-repo-url>
cd library-management-system/backend

# Install dependencies
npm install --production

# Create production .env
cat > .env << EOF
PORT=5001
DB_HOST=localhost
DB_PORT=5432
DB_NAME=library_db
DB_USER=library_user
DB_PASSWORD=your_secure_password
JWT_SECRET=$(openssl rand -base64 32)
NODE_ENV=production
EOF

# Start with PM2
pm2 start src/server.js --name library-api
pm2 save
pm2 startup
```

#### Step 4: Frontend Deployment

```bash
cd ../frontend

# Install dependencies
npm install

# Build for production
npm run build

# Copy build to nginx
sudo cp -r dist/* /var/www/library
```

#### Step 5: Nginx Configuration

```bash
sudo nano /etc/nginx/sites-available/library
```

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Frontend
    location / {
        root /var/www/library;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/library /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### Step 6: SSL Certificate (Optional but Recommended)

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d your-domain.com
```

---

### Option 2: Docker Deployment

#### Docker Compose Setup

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: library_db
      POSTGRES_USER: library_user
      POSTGRES_PASSWORD: your_secure_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./database/schema.sql:/docker-entrypoint-initdb.d/schema.sql
    ports:
      - "5432:5432"

  backend:
    build: ./backend
    environment:
      PORT: 5001
      DB_HOST: postgres
      DB_PORT: 5432
      DB_NAME: library_db
      DB_USER: library_user
      DB_PASSWORD: your_secure_password
      JWT_SECRET: your_jwt_secret
    ports:
      - "5001:5001"
    depends_on:
      - postgres

  frontend:
    build: ./frontend
    ports:
      - "80:80"
    depends_on:
      - backend

volumes:
  postgres_data:
```

Create `backend/Dockerfile`:

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 5001
CMD ["node", "src/server.js"]
```

Create `frontend/Dockerfile`:

```dockerfile
FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

Deploy:

```bash
docker-compose up -d
```

---

### Option 3: Cloud Platforms

#### Heroku

```bash
# Install Heroku CLI
curl https://cli-assets.heroku.com/install.sh | sh

# Login
heroku login

# Create app
heroku create library-management-api

# Add PostgreSQL
heroku addons:create heroku-postgresql:hobby-dev

# Set environment variables
heroku config:set JWT_SECRET=$(openssl rand -base64 32)

# Deploy
git push heroku main
```

#### Vercel (Frontend)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
cd frontend
vercel --prod
```

#### Railway

1. Connect GitHub repository
2. Add PostgreSQL database
3. Set environment variables
4. Deploy automatically

#### DigitalOcean App Platform

1. Connect GitHub repository
2. Configure build settings
3. Add PostgreSQL database
4. Deploy

---

## Environment Variables

### Backend (.env)

```env
# Server
PORT=5001
NODE_ENV=production

# Database (PostgreSQL)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=library_db
DB_USER=library_user
DB_PASSWORD=your_secure_password

# Or SQLite
USE_SQLITE=false

# Authentication
JWT_SECRET=your_very_secure_random_string_here

# CORS (if needed)
CORS_ORIGIN=https://your-frontend-domain.com
```

### Frontend

Update `vite.config.js`:

```javascript
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'https://your-api-domain.com',
        changeOrigin: true,
      },
    },
  },
});
```

---

## Security Checklist

- [ ] Change default admin password
- [ ] Use strong JWT secret (32+ characters)
- [ ] Enable HTTPS/SSL
- [ ] Set secure database password
- [ ] Configure CORS properly
- [ ] Enable rate limiting
- [ ] Set up firewall rules
- [ ] Regular security updates
- [ ] Database backups
- [ ] Monitor logs

---

## Performance Optimization

### Backend

```javascript
// Add compression
import compression from 'compression';
app.use(compression());

// Add rate limiting
import rateLimit from 'express-rate-limit';
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
app.use('/api/', limiter);

// Add caching headers
app.use((req, res, next) => {
  res.set('Cache-Control', 'public, max-age=300');
  next();
});
```

### Frontend

```javascript
// Code splitting
const Analytics = lazy(() => import('./pages/Analytics'));

// Image optimization
// Use WebP format
// Lazy load images

// Bundle optimization
// Already configured in Vite
```

### Database

```sql
-- Add indexes
CREATE INDEX idx_books_category ON books(category);
CREATE INDEX idx_issues_dates ON issues(issue_date, due_date);

-- Analyze tables
ANALYZE books;
ANALYZE members;
ANALYZE issues;
```

---

## Monitoring

### PM2 Monitoring

```bash
# View logs
pm2 logs library-api

# Monitor resources
pm2 monit

# View status
pm2 status
```

### Database Monitoring

```sql
-- Check active connections
SELECT count(*) FROM pg_stat_activity;

-- Check slow queries
SELECT query, calls, total_time, mean_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;
```

---

## Backup Strategy

### Database Backup

```bash
# Daily backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump -U library_user library_db > backup_$DATE.sql
# Upload to S3 or similar
```

### Automated Backups

```bash
# Add to crontab
crontab -e

# Daily at 2 AM
0 2 * * * /path/to/backup-script.sh
```

---

## Scaling

### Horizontal Scaling

```bash
# Run multiple backend instances
pm2 start src/server.js -i max

# Load balancer (Nginx)
upstream backend {
    server localhost:5001;
    server localhost:5002;
    server localhost:5003;
}
```

### Database Scaling

- Read replicas for read-heavy operations
- Connection pooling
- Query optimization
- Caching layer (Redis)

---

## Troubleshooting

### Common Issues

**Port already in use:**
```bash
lsof -i :5001
kill -9 <PID>
```

**Database connection failed:**
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Check connection
psql -U library_user -d library_db -h localhost
```

**Nginx errors:**
```bash
# Check logs
sudo tail -f /var/log/nginx/error.log

# Test configuration
sudo nginx -t
```

---

## Maintenance

### Regular Tasks

- [ ] Update dependencies monthly
- [ ] Review logs weekly
- [ ] Database backups daily
- [ ] Security patches immediately
- [ ] Performance monitoring
- [ ] Disk space monitoring

### Update Process

```bash
# Pull latest code
git pull origin main

# Update dependencies
cd backend && npm update
cd ../frontend && npm update

# Rebuild frontend
cd frontend && npm run build

# Restart services
pm2 restart library-api
sudo systemctl reload nginx
```

---

## Cost Estimation

### Small Library (< 1000 books)
- **VPS**: $5-10/month (DigitalOcean, Linode)
- **Database**: Included
- **Domain**: $10-15/year
- **SSL**: Free (Let's Encrypt)
- **Total**: ~$10/month

### Medium Library (1000-10000 books)
- **VPS**: $20-40/month
- **Managed Database**: $15/month
- **CDN**: $5/month
- **Total**: ~$40-60/month

### Large Library (10000+ books)
- **VPS**: $80+/month
- **Managed Database**: $50+/month
- **CDN**: $20/month
- **Monitoring**: $10/month
- **Total**: ~$160+/month

---

## Support

For deployment issues:
1. Check logs first
2. Review configuration
3. Test locally
4. Check firewall/security groups
5. Verify environment variables

---

**Last Updated:** February 11, 2026  
**Deployment Status:** Production Ready ✅
