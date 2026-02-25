# Language Challenger - Quick Reference Guide

**Quick commands and info for deploying and managing Language Challenger**

---

## 🚀 Quick Start (Local Development)

```bash
# Install dependencies
npm install

# Start development servers
npm run dev

# Frontend: http://localhost:5173
# Backend: http://localhost:3001
```

---

## 🐳 Docker Quick Commands

### Build & Deploy
```bash
# Full deployment (first time)
./scripts/deploy.sh --init

# Update existing deployment
./scripts/deploy.sh

# Build without cache
docker compose build --no-cache

# Start containers
docker compose up -d

# Stop containers
docker compose down
```

### Logs & Status
```bash
# View logs (follow)
docker compose logs -f

# View last 100 lines
docker compose logs --tail=100

# Check container status
docker compose ps

# Check container health
docker compose ps | grep healthy
```

### Database Operations
```bash
# Run migrations
docker compose exec -u node app server/node_modules/.bin/tsx server/src/db/migrate.ts

# Seed database
docker compose exec -u node app server/node_modules/.bin/tsx server/src/db/seed.ts

# Access container shell
docker compose exec -u node app sh
```

### Backup & Restore
```bash
# Create backup
./scripts/backup.sh

# Restore latest backup
./scripts/backup.sh --restore

# Restore specific backup
./scripts/backup.sh --restore database.20260225_120000.sqlite
```

---

## 🌐 API Endpoints

### Health Check
```bash
curl http://localhost:3001/api/health
# Response: {"status":"ok","timestamp":"..."}
```

### Login
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"secret"}'
```

### Protected Endpoint (Example)
```bash
# Get token from login response
TOKEN="your-jwt-token"

curl http://localhost:3001/api/imports/active \
  -H "Authorization: Bearer $TOKEN"
```

---

## 🔧 Environment Variables

### Required Variables (`.env`)
```bash
NODE_ENV=production
PORT=3001
DATABASE_PATH=/app/data/database.sqlite
CLIENT_DIST_PATH=/app/client/dist
JWT_SECRET=<generate-with-openssl>
JWT_EXPIRES_IN=7d
```

### Generate JWT Secret
```bash
# Option 1: OpenSSL
openssl rand -base64 32

# Option 2: Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

---

## 📦 Production Deployment (Proxmox LXC)

### 1. Create LXC Container
```bash
# From Proxmox host
CT_ID=100
pct set $CT_ID -features nesting=1,keyctl=1
pct start $CT_ID
pct exec $CT_ID ip addr show eth0  # Get IP
```

### 2. Setup LXC (one-time)
```bash
# Inside LXC container
apt-get update && apt-get install -y curl git
cd /tmp
git clone https://github.com/YOUR-USERNAME/language-challenger.git
cd language-challenger
chmod +x deploy/setup-lxc.sh
./deploy/setup-lxc.sh
```

### 3. Clone & Deploy
```bash
# Switch to appuser
su - appuser

# Clone repo
cd /opt/language-challenger
git clone https://github.com/YOUR-USERNAME/language-challenger.git .

# Deploy
./scripts/deploy.sh --init
```

### 4. Verify Deployment
```bash
# Check health
curl http://localhost:3001/api/health

# Check logs
docker compose logs -f

# Test login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"secret"}'
```

---

## 🌐 Nginx Proxy Manager Configuration

### Add Proxy Host
```
Domain: language-challenger.yourdomain.com
Scheme: http
Forward Hostname/IP: <LXC_IP>
Forward Port: 3001

☑ Cache Assets
☑ Block Common Exploits  
☑ Websockets Support

SSL:
☑ Request new certificate
☑ Force SSL
☑ HTTP/2 Support
☑ HSTS Enabled
```

---

## 🐛 Troubleshooting

### Container won't start
```bash
# Check logs
docker compose logs -f

# Check permissions
ls -la data/
chown -R 1000:1000 data/

# Verify .env exists
cat .env
```

### 502 Bad Gateway from Nginx
```bash
# Verify container is healthy
docker compose ps

# Test health locally
curl http://localhost:3001/api/health

# Check firewall (if using UFW)
ufw status
ufw allow 3001/tcp
```

### Database errors
```bash
# Restore from backup
./scripts/backup.sh --restore

# Or recreate database
docker compose down
rm data/database.sqlite
docker compose up -d
docker compose exec -u node app server/node_modules/.bin/tsx server/src/db/migrate.ts
docker compose exec -u node app server/node_modules/.bin/tsx server/src/db/seed.ts
```

### Out of disk space
```bash
# Check disk usage
df -h
docker system df

# Clean up Docker
docker system prune -a -f

# Clean old backups
cd /opt/language-challenger/backups
ls -lth | tail -10
# Delete old files as needed
```

---

## 🔐 Default Credentials

**⚠️ CHANGE IMMEDIATELY AFTER FIRST LOGIN**

```
Username: admin
Password: secret
```

---

## 📊 Monitoring

### Health Check Endpoint
```
https://language-challenger.yourdomain.com/api/health
```

### Resource Usage
```bash
# CPU/Memory/Disk
docker stats

# Container sizes
docker images

# Volume sizes
docker system df -v
```

---

## 🔄 Update Application

```bash
cd /opt/language-challenger
./scripts/deploy.sh
```

This will:
1. Git pull latest code
2. Backup database
3. Rebuild Docker images
4. Restart containers
5. Run migrations

---

## 📁 Important Paths

### In Container
```
/app/server          # Backend code
/app/client/dist     # Frontend static files
/app/data            # Database directory
```

### On Host (LXC)
```
/opt/language-challenger     # Application root
/opt/language-challenger/data        # Database
/opt/language-challenger/backups     # Backups
/opt/language-challenger/logs        # Logs
```

---

## 📞 Support

### Check Status
```bash
docker compose ps
docker compose logs --tail=50
curl http://localhost:3001/api/health
```

### Get Container Info
```bash
docker compose exec app sh
# Inside container:
pwd                  # /app
ls -la              # See all files
cat .env            # Check environment
```

---

## 🎯 Common Tasks

### Change Admin Password
1. Login to web interface
2. Go to Profile/Settings
3. Change password
4. Save

### View Application Logs
```bash
# Real-time logs
docker compose logs -f

# Last 100 lines
docker compose logs --tail=100

# Save logs to file
docker compose logs > logs.txt
```

### Restart Application
```bash
# Graceful restart
docker compose restart

# Full restart
docker compose down
docker compose up -d
```

### Check Database Size
```bash
# On host
du -h data/database.sqlite

# Inside container
docker compose exec app du -h /app/data/database.sqlite
```

---

## 🔗 Useful Links

- **Frontend**: `http://localhost:3001`
- **Health Check**: `http://localhost:3001/api/health`
- **API Base**: `http://localhost:3001/api`
- **Nginx Proxy Manager**: `http://your-npm-ip:81`

---

**Last Updated**: February 25, 2026  
**Version**: 1.0
