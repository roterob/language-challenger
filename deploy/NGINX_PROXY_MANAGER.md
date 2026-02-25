# Guía Rápida - Nginx Proxy Manager

Esta es una referencia rápida para configurar el proxy en Nginx Proxy Manager apuntando a tu aplicación Language Challenger.

## 📋 Pre-requisitos

- Nginx Proxy Manager instalado y corriendo
- LXC de Language Challenger desplegado y funcionando
- Conocer la IP del LXC (ej: `192.168.1.100`)
- Dominio o subdominio DNS apuntando a tu IP pública

## 🌐 Configuración del Proxy Host

### 1. Acceder a Nginx Proxy Manager

Abre tu navegador y ve a:
```
http://IP_DE_NPM:81
```

**Credenciales por defecto** (cámbialas si es la primera vez):
- Email: `admin@example.com`
- Password: `changeme`

### 2. Crear Proxy Host

1. Click en **Hosts** (menú lateral)
2. Click en **Proxy Hosts**
3. Click en **Add Proxy Host** (botón azul arriba a la derecha)

### 3. Configurar el Proxy

#### Tab: Details

```
Domain Names:         language-challenger.tu-dominio.com
                     (o el subdominio que quieras usar)

Scheme:              http
Forward Hostname/IP: 192.168.1.100  (IP del LXC)
Forward Port:        3001

☑ Cache Assets
☑ Block Common Exploits
☑ Websockets Support
☐ Access List (opcional, para restringir acceso)
```

#### Tab: SSL

```
SSL Certificate:     Request a new SSL Certificate

☑ Force SSL
☑ HTTP/2 Support
☑ HSTS Enabled
☐ HSTS Subdomains (opcional)

Email Address:       tu-email@ejemplo.com
☑ I Agree to the Let's Encrypt Terms of Service
```

### 4. Guardar

Click en **Save**

Nginx Proxy Manager automáticamente:
- Solicitará el certificado SSL a Let's Encrypt
- Configurará el proxy
- Habilitará HTTPS

## ✅ Verificar

### Desde tu navegador

Visita: `https://language-challenger.tu-dominio.com`

Deberías ver:
- ✅ Conexión segura (candado verde)
- ✅ Página de login de Language Challenger

### Credenciales de prueba

```
Username: admin
Password: secret
```

⚠️ **Cambia la contraseña inmediatamente después del primer login**

## 🔧 Configuración Avanzada (Opcional)

### Custom Nginx Configuration

Si necesitas agregar headers personalizados o configuración avanzada:

1. En el Proxy Host, ve a la tab **Advanced**
2. Agrega tu configuración custom:

```nginx
# Headers de seguridad adicionales
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "no-referrer-when-downgrade" always;

# Timeout más largo para operaciones pesadas
proxy_read_timeout 300s;
proxy_connect_timeout 300s;

# Rate limiting (opcional)
limit_req_zone $binary_remote_addr zone=language_challenger_limit:10m rate=10r/s;
limit_req zone=language_challenger_limit burst=20 nodelay;
```

### Access List (Restringir acceso)

Si quieres restringir el acceso solo a ciertas IPs:

1. Click en **Access Lists** (menú lateral)
2. Click en **Add Access List**
3. Configura:
   ```
   Name: Language Challenger Whitelist
   
   ☑ Satisfy Any
   
   Authorization:
   - Allow: 192.168.1.0/24  (tu red local)
   - Allow: TU_IP_PUBLICA_OFICINA
   ```
4. Guarda y asigna esta Access List al Proxy Host

## 🔍 Troubleshooting

### Error 502 Bad Gateway

**Causa**: Nginx Proxy Manager no puede conectarse al LXC

**Solución**:
1. Verifica que el container esté corriendo:
   ```bash
   ssh root@LXC_IP
   docker compose ps
   ```
   
2. Verifica que el puerto 3001 esté escuchando:
   ```bash
   curl http://LXC_IP:3001/api/health
   ```
   
3. Verifica la IP en Nginx Proxy Manager (debe ser la IP del LXC, no localhost)

4. Verifica firewall en el LXC:
   ```bash
   ufw status
   ufw allow 3001/tcp
   ```

### Error 504 Gateway Timeout

**Causa**: La aplicación tarda mucho en responder

**Solución**:
1. Aumenta los timeouts en la configuración avanzada:
   ```nginx
   proxy_read_timeout 300s;
   proxy_connect_timeout 300s;
   ```

### Certificado SSL no se genera

**Causa**: Let's Encrypt no puede validar el dominio

**Solución**:
1. Verifica que el dominio apunte a tu IP pública:
   ```bash
   nslookup language-challenger.tu-dominio.com
   ```

2. Verifica port forwarding en tu router (puertos 80 y 443)

3. Intenta generar el certificado manualmente:
   - Quita el ☑ Force SSL temporalmente
   - Guarda
   - Edita de nuevo
   - Marca ☑ Force SSL y regenera el certificado

### Renovación de certificados

Los certificados Let's Encrypt se renuevan automáticamente. Nginx Proxy Manager se encarga de esto.

Para verificar la fecha de expiración:
```bash
# En tu navegador, click en el candado → Ver certificado
```

## 📊 Monitoreo

### Ver logs del proxy

En Nginx Proxy Manager:
1. Click en **Proxy Hosts**
2. Click en los 3 puntos del host → **View Logs**

### Estadísticas de tráfico (requiere módulo adicional)

Nginx Proxy Manager no incluye estadísticas por defecto. Para monitoreo avanzado considera:
- Grafana + Prometheus
- Netdata
- UptimeRobot (externo)

## 🔐 Seguridad

### Checklist recomendado

- [x] SSL/TLS habilitado (Force SSL)
- [x] HSTS enabled
- [x] HTTP/2 Support
- [x] Block Common Exploits
- [ ] Rate limiting configurado
- [ ] Access List (si necesitas restringir acceso)
- [ ] Headers de seguridad custom
- [ ] Fail2ban en el servidor de Nginx Proxy Manager

### Headers de seguridad recomendados

```nginx
# En la tab Advanced del Proxy Host
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "no-referrer-when-downgrade" always;
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
```

## 📝 Notas

- **Renovación automática**: Let's Encrypt renueva automáticamente cada 60 días
- **Múltiples dominios**: Puedes agregar múltiples dominios/subdominios al mismo proxy host
- **IPv6**: Nginx Proxy Manager soporta IPv6 automáticamente
- **Wildcard certificates**: Se pueden configurar con DNS Challenge (más complejo)

## 🆘 Recursos

- [Documentación oficial de Nginx Proxy Manager](https://nginxproxymanager.com/guide/)
- [Let's Encrypt - Límites de tasa](https://letsencrypt.org/docs/rate-limits/)
- [Nginx - Configuración de proxy](https://nginx.org/en/docs/http/ngx_http_proxy_module.html)

---

**Configuración típica completa**:
```
Domain:    language-challenger.tu-dominio.com
Scheme:    http
IP:        192.168.1.100
Port:      3001
SSL:       Let's Encrypt
Force SSL: Enabled
HSTS:      Enabled
Cache:     Enabled
WebSockets: Enabled
```

¡Listo! Tu aplicación debería estar accesible desde internet de forma segura.
