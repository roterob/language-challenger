# Quick Start - Despliegue en Producción

Guía rápida para desplegar Language Challenger en un LXC de Proxmox.

## 📋 Pre-requisitos

- [ ] Proxmox VE instalado
- [ ] Template Ubuntu 24.04 o Debian 12
- [ ] Nginx Proxy Manager funcionando
- [ ] Dominio apuntando a tu IP pública
- [ ] Port forwarding 80/443 configurado

## 🚀 Pasos Rápidos

### 1️⃣ Crear LXC en Proxmox

```bash
# En Proxmox Web UI
# Create CT → Ubuntu 24.04 → 2 CPU / 2GB RAM / 20GB Disk

# En shell de Proxmox (reemplaza 100 con tu CT ID)
pct set 100 -features nesting=1,keyctl=1
pct start 100
```

### 2️⃣ Configurar el LXC

```bash
# Entrar al LXC
pct enter 100

# Instalar curl y git
apt-get update && apt-get install -y curl git

# Clonar el repositorio
cd /opt
git clone https://github.com/TU-USUARIO/language-challenger.git
cd language-challenger

# Ejecutar setup automático
chmod +x deploy/setup-lxc.sh
./deploy/setup-lxc.sh
```

### 3️⃣ Desplegar la aplicación

```bash
# Cambiar a usuario appuser
su - appuser
cd /opt/language-challenger

# Primer deployment (crea .env, build, seed)
./scripts/deploy.sh --init
```

**Duración**: ~5-10 minutos

### 4️⃣ Configurar Nginx Proxy Manager

1. Accede a NPM: `http://IP_NPM:81`
2. **Add Proxy Host**:
   - Domain: `language-challenger.tu-dominio.com`
   - Forward IP: `IP_DEL_LXC`
   - Forward Port: `3001`
   - ✅ Cache Assets, Block Exploits, Websockets
3. **SSL Tab**:
   - Request new SSL Certificate
   - ✅ Force SSL, HTTP/2, HSTS

### 5️⃣ Verificar

Abre: `https://language-challenger.tu-dominio.com`

**Login**:
- Username: `admin`
- Password: `secret`

⚠️ **Cambia la contraseña inmediatamente**

---

## 🔧 Comandos Útiles

```bash
# Ver logs
docker compose logs -f

# Actualizar aplicación
./scripts/deploy.sh

# Backup manual
./scripts/backup.sh

# Restaurar backup
./scripts/backup.sh --restore

# Reiniciar
docker compose restart

# Ver estado
docker compose ps

# Shell en el container
docker compose exec app sh
```

---

## 📚 Documentación Completa

Para guía detallada, troubleshooting y configuración avanzada:

- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Guía completa paso a paso
- **[deploy/NGINX_PROXY_MANAGER.md](./deploy/NGINX_PROXY_MANAGER.md)** - Configuración de NPM
- **[README.md](./README.md)** - Documentación del proyecto

---

## 🆘 Troubleshooting Rápido

### Container no arranca
```bash
docker compose logs -f
docker compose ps
```

### Error 502 en Nginx Proxy Manager
```bash
# Verificar que la app esté corriendo
curl http://localhost:3001/api/health

# Verificar firewall
ufw allow 3001/tcp
```

### Base de datos corrupta
```bash
./scripts/backup.sh --restore
```

---

## ⏱️ Tiempo Total Estimado

| Paso | Tiempo |
|------|--------|
| Crear LXC | 5 min |
| Setup LXC | 10 min |
| Deploy app | 10 min |
| Config NPM | 5 min |
| **Total** | **~30 min** |

---

## 🎉 ¡Listo!

Tu aplicación está desplegada y accesible desde internet con SSL.

**Próximos pasos**:
1. Cambia la contraseña de admin
2. Configura backups automáticos (ya incluidos)
3. Configura monitoreo (opcional)
4. Invita usuarios
