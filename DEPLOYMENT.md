# Guía de Despliegue - Language Challenger en Proxmox

Esta guía te llevará paso a paso para desplegar **Language Challenger** en un LXC container en Proxmox, con Docker y Nginx Proxy Manager.

---

## 📋 Tabla de Contenidos

- [Requisitos](#-requisitos)
- [Arquitectura](#-arquitectura)
- [Paso 1: Crear LXC Container en Proxmox](#-paso-1-crear-lxc-container-en-proxmox)
- [Paso 2: Configurar el LXC](#-paso-2-configurar-el-lxc)
- [Paso 3: Clonar el Proyecto](#-paso-3-clonar-el-proyecto)
- [Paso 4: Primer Despliegue](#-paso-4-primer-despliegue)
- [Paso 5: Configurar Nginx Proxy Manager](#-paso-5-configurar-nginx-proxy-manager)
- [Operaciones de Mantenimiento](#-operaciones-de-mantenimiento)
- [Troubleshooting](#-troubleshooting)

---

## 🎯 Requisitos

### En Proxmox
- Proxmox VE 7.x o superior
- Template de Ubuntu 24.04 o Debian 12
- Recursos mínimos para el LXC:
  - **CPU**: 2 cores
  - **RAM**: 2 GB (recomendado 4 GB)
  - **Disco**: 20 GB
  - **Red**: Bridge con acceso a internet

### En tu red local
- **Nginx Proxy Manager** configurado y funcionando
- **Dominio** apuntando a tu IP pública
- **Port forwarding** en router (puertos 80/443 → Nginx Proxy Manager)

### Conocimientos requeridos
- Bash básico
- Docker y Docker Compose
- Git básico
- SSH para conectarte al LXC

---

## 🏗️ Arquitectura

```
Internet (tu-dominio.com)
    ↓
Router (Port forwarding 80/443)
    ↓
Nginx Proxy Manager (Proxmox o VM separada)
    ↓ Proxy a LXC_IP:3001
LXC Container (Ubuntu 24.04)
    ├── Docker Engine
    └── Language Challenger Container
        ├── Node.js Backend (Hono) → :3001
        ├── Frontend (Vite build) → servido por backend
        └── SQLite DB (volumen persistente)
```

### Notas Técnicas

**TypeScript Runtime con tsx**: Esta aplicación usa `tsx` para ejecutar TypeScript directamente en runtime, sin necesidad de compilación previa. Esto simplifica el proceso de despliegue y permite hot-reloading más rápido en desarrollo.

**Ventajas del enfoque tsx**:
- ✅ No requiere paso de compilación TypeScript
- ✅ Builds de Docker más rápidos
- ✅ Menos espacio en disco (no se almacenan archivos `.js` compilados)
- ✅ Actualizaciones más simples (solo código fuente)
- ⚠️ Nota: tsx es suficientemente rápido y estable para producción

---

## 🚀 Paso 1: Crear LXC Container en Proxmox

### 1.1. Desde la Web UI de Proxmox

1. Click en **Create CT** (arriba a la derecha)
2. **General**:
   - CT ID: (automático, ej: 100)
   - Hostname: `language-challenger`
   - Password: (elige una contraseña segura)
   - ✅ Marca "Unprivileged container"

3. **Template**:
   - Selecciona **Ubuntu 24.04** o **Debian 12**

4. **Root Disk**:
   - Disk size: **20 GB**

5. **CPU**:
   - Cores: **2**

6. **Memory**:
   - Memory (MiB): **2048** (o 4096 si tienes recursos)
   - Swap: **512**

7. **Network**:
   - Bridge: **vmbr0** (o tu bridge de red local)
   - ✅ DHCP (o asigna IP estática)
   - ✅ Firewall (si quieres usar el firewall de Proxmox)

8. **DNS**:
   - Usa DNS del host o configura manualmente (ej: 1.1.1.1, 8.8.8.8)

9. Click en **Finish** para crear el container

### 1.2. Configurar características especiales para Docker

**IMPORTANTE**: Docker en LXC requiere algunas configuraciones adicionales.

Desde el shell de Proxmox (como root):

```bash
# Reemplaza 100 con tu CT ID
CT_ID=100

# Habilitar nesting y features necesarias para Docker
pct set $CT_ID -features nesting=1,keyctl=1

# Opcional: Si tienes problemas con overlayfs, usa esto:
pct set $CT_ID -mp0 /var/lib/docker,mp=/var/lib/docker,backup=0

# Iniciar el container
pct start $CT_ID
```

### 1.3. Obtener la IP del LXC

```bash
pct exec $CT_ID ip addr show eth0
# O desde Proxmox Web UI: Click en el LXC → Summary → IP Address
```

**Anota esta IP**, la necesitarás para configurar Nginx Proxy Manager.

---

## 🔧 Paso 2: Configurar el LXC

### 2.1. Conectarte al LXC

Desde Proxmox shell o SSH:

```bash
# Opción A: Desde Proxmox
pct enter 100  # Reemplaza 100 con tu CT ID

# Opción B: Desde SSH
ssh root@LXC_IP
```

### 2.2. Ejecutar el script de setup automático

Una vez dentro del LXC:

```bash
# Descargar y ejecutar el script de setup
# Opción A: Si ya tienes el repo clonado en Proxmox
# (copia el script al LXC primero)

# Opción B: Ejecutar directamente (recomendado)
apt-get update && apt-get install -y curl
curl -sSL https://raw.githubusercontent.com/TU-USUARIO/language-challenger/main/deploy/setup-lxc.sh | bash
```

O manualmente:

```bash
# Si tienes el código ya en el LXC
cd /root
git clone https://github.com/TU-USUARIO/language-challenger.git
cd language-challenger
chmod +x deploy/setup-lxc.sh
./deploy/setup-lxc.sh
```

**El script instalará automáticamente**:
- Docker Engine y Docker Compose
- Herramientas esenciales (git, curl, vim, htop)
- Usuario `appuser` con permisos de docker
- Directorios de la aplicación en `/opt/language-challenger`
- Cron job para backups diarios
- (Opcional) UFW firewall
- (Opcional) Actualizaciones automáticas de seguridad

### 2.3. Verificar la instalación

```bash
# Verificar Docker
docker --version
docker compose version

# Verificar que Docker esté corriendo
systemctl status docker

# Verificar usuario appuser
id appuser
```

---

## 📦 Paso 3: Clonar el Proyecto

### 3.1. Cambiar a usuario appuser

```bash
su - appuser
```

### 3.2. Clonar el repositorio

```bash
cd /opt/language-challenger
git clone https://github.com/TU-USUARIO/language-challenger.git .

# O si el repo ya está clonado, hacer pull
git pull origin main
```

### 3.3. Verificar archivos

```bash
ls -la
# Deberías ver:
# - Dockerfile
# - docker-compose.yml
# - docker-compose.prod.yml
# - .env.example
# - scripts/
# - deploy/
```

---

## 🎬 Paso 4: Primer Despliegue

### 4.1. Ejecutar el deployment inicial

```bash
cd /opt/language-challenger
./scripts/deploy.sh --init
```

**Este comando hará**:
1. ✅ Crear `.env` con JWT_SECRET generado automáticamente
2. ✅ Crear directorios necesarios (data, backups, logs)
3. ✅ Construir las imágenes Docker
4. ✅ Iniciar los contenedores
5. ✅ Ejecutar migraciones de base de datos
6. ✅ Hacer seed de datos iniciales (usuarios admin/guest)

**Duración aproximada**: 5-10 minutos (dependiendo de tu conexión).

### 4.2. Verificar que todo funciona

```bash
# Ver logs
docker compose logs -f

# Verificar containers
docker compose ps

# Deberías ver:
# language-challenger   running   0.0.0.0:3001->3001/tcp   healthy

# Test del health check
curl http://localhost:3001/api/health
# Respuesta esperada: {"status":"ok"}
```

### 4.3. Probar login

```bash
# Test de login (desde dentro del LXC)
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"secret"}'

# Deberías recibir un token JWT
```

---

## 🌐 Paso 5: Configurar Nginx Proxy Manager

Ahora que la aplicación está corriendo en el LXC, configura Nginx Proxy Manager para exponerla a internet.

### 5.1. Acceder a Nginx Proxy Manager

Abre tu Nginx Proxy Manager en el navegador (ej: `http://npm.tu-red.local:81`)

### 5.2. Agregar un Proxy Host

1. Click en **Hosts → Proxy Hosts → Add Proxy Host**

2. **Details Tab**:
   - **Domain Names**: `language-challenger.tu-dominio.com` (tu subdominio)
   - **Scheme**: `http`
   - **Forward Hostname / IP**: `LXC_IP` (la IP que anotaste antes)
   - **Forward Port**: `3001`
   - ✅ **Cache Assets**
   - ✅ **Block Common Exploits**
   - ✅ **Websockets Support** (opcional, pero recomendado)

3. **SSL Tab**:
   - **SSL Certificate**: None (por ahora)
   - Click en **Request a new SSL Certificate**
   - ✅ **Force SSL**
   - ✅ **HTTP/2 Support**
   - ✅ **HSTS Enabled**
   - Acepta los términos de Let's Encrypt
   - Tu email para notificaciones

4. Click en **Save**

### 5.3. Verificar desde internet

Abre tu navegador y visita:
```
https://language-challenger.tu-dominio.com
```

Deberías ver la pantalla de login de Language Challenger.

**Credenciales por defecto**:
- Username: `admin`
- Password: `secret`

⚠️ **IMPORTANTE**: Cambia la contraseña inmediatamente después del primer login.

---

## 🛠️ Operaciones de Mantenimiento

### Actualizar la aplicación

```bash
cd /opt/language-challenger
./scripts/deploy.sh
```

Este comando:
- Hace `git pull` del último código
- Crea backup de la BD antes de actualizar
- Construye nuevas imágenes Docker
- Reinicia los contenedores
- Ejecuta migraciones

### Backup manual

```bash
cd /opt/language-challenger
./scripts/backup.sh
```

Los backups se guardan en `/opt/language-challenger/backups/` con formato:
- `database.YYYYMMDD_HHMMSS.sqlite` (sin comprimir)
- `database.YYYYMMDD_HHMMSS.sqlite.gz` (comprimido)

**Retención**: 30 días (configurable en el script)

### Restaurar backup

```bash
# Restaurar el último backup
./scripts/backup.sh --restore

# Restaurar un backup específico
./scripts/backup.sh --restore database.20240101_120000.sqlite
```

### Ver logs

```bash
# Logs en tiempo real
docker compose logs -f

# Últimas 100 líneas
docker compose logs --tail=100

# Solo logs del backend
docker compose logs app
```

### Reiniciar la aplicación

```bash
# Reinicio suave
docker compose restart

# Parar y volver a iniciar
docker compose down
docker compose up -d
```

### Acceso al shell del contenedor

```bash
docker compose exec app sh

# Dentro del contenedor:
# - Backend: /app/server
# - Frontend: /app/client/dist
# - BD: /app/data/database.sqlite
```

### Verificar uso de recursos

```bash
# CPU, RAM, Disco
docker stats

# Tamaño de imágenes
docker images

# Tamaño de volúmenes
docker system df
```

### Limpieza de recursos

```bash
# Limpiar imágenes no usadas
docker image prune -f

# Limpiar todo (cuidado, no borra volúmenes)
docker system prune -a -f
```

---

## 🔍 Troubleshooting

### La aplicación no arranca

**Síntoma**: Container se reinicia constantemente

```bash
# Ver logs detallados
docker compose logs -f

# Verificar health check
docker compose ps
```

**Soluciones comunes**:
1. Verificar que el puerto 3001 no esté ocupado:
   ```bash
   netstat -tuln | grep 3001
   ```

2. Verificar permisos del directorio de datos:
   ```bash
   ls -la /opt/language-challenger/data
   chown -R appuser:appuser /opt/language-challenger/data
   ```

3. Verificar variables de entorno:
   ```bash
   cat .env
   # JWT_SECRET debe estar configurado
   ```

### Error de conexión desde Nginx Proxy Manager

**Síntoma**: 502 Bad Gateway

**Verificar**:
1. Container está healthy:
   ```bash
   docker compose ps
   ```

2. Health check funciona desde el LXC:
   ```bash
   curl http://localhost:3001/api/health
   ```

3. Firewall no está bloqueando (si usas UFW):
   ```bash
   ufw status
   ufw allow 3001/tcp
   ```

4. IP correcta en Nginx Proxy Manager (debe ser la IP del LXC)

### Base de datos corrupta

**Síntoma**: Errores de SQLite al iniciar

```bash
# Restaurar desde backup
./scripts/backup.sh --restore

# Si no hay backups, recrear BD
docker compose down
rm /opt/language-challenger/data/database.sqlite
docker compose up -d
# Luego ejecutar migraciones y seed
docker compose exec -u node app server/node_modules/.bin/tsx server/src/db/migrate.ts
docker compose exec -u node app server/node_modules/.bin/tsx server/src/db/seed.ts
```

### Sin espacio en disco

```bash
# Verificar espacio
df -h

# Limpiar logs de Docker
docker system prune -a -f

# Limpiar backups antiguos manualmente
cd /opt/language-challenger/backups
ls -lth
# Eliminar los más antiguos si es necesario
```

### El build de Docker falla

**Síntoma**: Error durante `docker compose build`

```bash
# Limpiar build cache
docker builder prune -a -f

# Build forzado sin cache
./scripts/deploy.sh --build
```

### No se puede hacer git pull

**Síntoma**: `git pull` falla por cambios locales

```bash
# Ver qué cambió
git status

# Stash cambios locales
git stash

# Pull de nuevo
git pull origin main

# Recuperar cambios si es necesario
git stash pop
```

---

## 📊 Monitoreo y Logs

### Logs de aplicación

Los logs se encuentran en:
- **Docker logs**: `docker compose logs`
- **Backup logs**: `/opt/language-challenger/logs/backup.log`

### Monitoreo de recursos

```bash
# Ver uso en tiempo real
htop

# Ver uso de Docker
docker stats

# Ver espacio en disco
ncdu /opt/language-challenger
```

### Health checks

La aplicación expone un endpoint de health:
```bash
curl http://localhost:3001/api/health
```

Puedes configurar un monitor externo (como UptimeRobot) para hacer ping a:
```
https://language-challenger.tu-dominio.com/api/health
```

---

## 🔒 Seguridad

### Checklist de seguridad post-deployment

- [ ] Cambiar contraseña del usuario `admin` inmediatamente
- [ ] Verificar que JWT_SECRET sea aleatorio y seguro
- [ ] Configurar SSL/HTTPS en Nginx Proxy Manager
- [ ] Habilitar HSTS en Nginx Proxy Manager
- [ ] Configurar UFW firewall en el LXC
- [ ] Deshabilitar login root por SSH (opcional)
- [ ] Configurar fail2ban (opcional)
- [ ] Revisar logs regularmente
- [ ] Verificar backups automáticos funcionan

### Actualizar el sistema

```bash
# Actualizar paquetes del LXC (como root)
apt-get update && apt-get upgrade -y

# Actualizar la aplicación
cd /opt/language-challenger
./scripts/deploy.sh
```

---

## 📚 Referencias Útiles

### Comandos Docker Compose

```bash
# Ver containers
docker compose ps

# Ver logs
docker compose logs -f

# Reiniciar
docker compose restart

# Parar
docker compose down

# Iniciar
docker compose up -d

# Rebuild y reiniciar
docker compose up -d --build

# Shell en el container
docker compose exec app sh
```

### Estructura de directorios

```
/opt/language-challenger/
├── client/                 # Código del frontend
├── server/                 # Código del backend
├── packages/shared/        # Tipos compartidos
├── data/                   # Base de datos SQLite
│   └── database.sqlite
├── backups/                # Backups de la BD
│   ├── database.*.sqlite
│   └── database.*.sqlite.gz
├── logs/                   # Logs de la aplicación
│   └── backup.log
├── scripts/                # Scripts de deployment
│   ├── deploy.sh
│   └── backup.sh
├── deploy/                 # Scripts de setup
│   └── setup-lxc.sh
├── Dockerfile
├── docker-compose.yml
├── docker-compose.prod.yml
└── .env                    # Variables de entorno (NO commitear)
```

---

## 🆘 Obtener Ayuda

Si encuentras problemas no cubiertos en este documento:

1. Revisa los logs: `docker compose logs -f`
2. Verifica el health check: `curl http://localhost:3001/api/health`
3. Revisa issues en el repositorio de GitHub
4. Contacta al equipo de desarrollo

---

## 📝 Notas Finales

- **Backups automáticos**: Se ejecutan diariamente a las 2 AM (configurable en cron)
- **Retención de backups**: 30 días (configurable en `scripts/backup.sh`)
- **Puertos expuestos**: Solo 3001 (backend + frontend)
- **Base de datos**: SQLite en volumen Docker persistente
- **Certificados SSL**: Renovación automática con Let's Encrypt vía Nginx Proxy Manager

---

🎉 **¡Despliegue completo!** Tu aplicación Language Challenger está ahora en producción.
