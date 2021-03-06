# API Mi UTEM
API REST hecha por estudiantes de la [Universidad Tecnológica Metropolitana de Chile](https://www.utem.cl/) a base de scrapping con Puppeteer a la [plataforma académica Mi.UTEM](https://mi.utem.cl/)

## Para comenzar

### Requisitos
-  `nvm`
-  `npm`
- Node.js 14.16.0
- Puppeteer
- Dependencias de Chromium

#### Instalar `nvm`, `npm` y Node.js
1. Primero se instalará `nvm` con el siguiente comando
```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.35.3/install.sh | bash
```

2. Luego para poder ocupar `nvm` en la terminal, se deberá agregar al perfil del bash con

```bash
source  ~/.bash_profile
```

3. Teniendo instalado `nvm` y con acceso correcto desde la terminal, se instalará `npm` y Node.js con el siguiente comando

```bash
nvm install v14.16.0
```

4. Para asegurarse de estar usando la versión de Node.js recién instalada, se sugiere ejecutar lo siguiente

```bash
nvm use v14.16.0
```

#### Instalar Puppeteer
1. Teniendo instalado `npm` bastará con el siguiente comando

```bash
sudo npm install -g puppeteer --unsafe-perm=true
```

#### Instalar dependencias de Chromium
1. Bastará con ejecutar un comando, por ejemplo el comando en CentOS sería el siguiente

```bash
sudo yum install pango.x86_64 libXcomposite.x86_64 libXcursor.x86_64 libXdamage.x86_64 libXext.x86_64 libXi.x86_64 libXtst.x86_64 cups-libs.x86_64 libXScrnSaver.x86_64 libXrandr.x86_64 GConf2.x86_64 alsa-lib.x86_64 atk.x86_64 gtk3.x86_64 ipa-gothic-fonts xorg-x11-fonts-100dpi xorg-x11-fonts-75dpi xorg-x11-utils xorg-x11-fonts-cyrillic xorg-x11-fonts-Type1 xorg-x11-fonts-misc
```

## Configuración
La configuración del proyecto está determinada por las variables de entorno, las cuales pueden estar configuradas en el sistema o pueden estar en un archivo `.env` en la raíz del proyecto de la siguiente forma

```
PORT=443
SENTRY_URL=https://32ded159d1964a2ba32d50894765f32d@o507661.ingest.sentry.io/5600920
PRIVATE_KEY_PATH=/etc/letsencrypt/live/miutem.inndev.studio/privkey.pem
CERTIFICATE_PATH=/etc/letsencrypt/live/miutem.inndev.studio/fullchain.pem
MI_UTEM_URL=https://mi.utem.cl
ACADEMIA_UTEM_URL=https://academia.utem.cl
PASAPORTE_UTEM_URL=https://pasaporte.utem.cl
SSO_UTEM_URL=https://sso.utem.cl
GOOGLE_APPLICATION_CREDENTIALS=./mi-utem-inndev-credentials.json
FCM_SERVER_KEY=AAAAPEuk7fI:APA91bGG9UrjuLX8kt1DWVwz...
SISEI_KEY=123456
```

| **Variable** | **Descripción** |
|----------------------|--------------------------------------------------------------------------------------------|
| `PORT` | Puerto donde correrá el servicio, se utiliza ´443´ para habilitar las consultas ´HTTPS´ |
| `SENTRY_URL` | URL de Sentry para el manejo de errores |
| `PRIVATE_KEY_PATH` | Ubicación del archivo correspondiente a la llave privada del certificado HTTPS |
| `CERTIFICATE_PATH` | Ubicación del archivo correspondiente al certificado HTTPS |
| `MI_UTEM_URL` | URL de la página web Mi.UTEM |
| `ACADEMIA_UTEM_URL` | URL de la página web de Academia.UTEM |
| `PASAPORTE_UTEM_URL` | URL de la página web de Pasaporte.UTEM |
| `SSO_UTEM_URL` | URL de la página web de SSO.UTEM |
| `REQ_REF` | Opcional. Valor del parámetro `ref` que se agregará a las consultas a las distintas webs. |
| `GOOGLE_APPLICATION_CREDENTIALS` | Ubicación del archivo de credenciales del proyecto Firebase. |
| `FCM_SERVER_KEY` | Llave del servidor de FCM para enviar notificaciones. |
| `SISEI_KEY` | Llave para que el equipo de SISEI pueda hacer algunas consultas. Puede ser cualquier valor. |

## Ejecución
1. Antes de ejecutar el proyecto, se deberán instalar las librerías con el siguiente comando
```bash
npm install
```

2. Luego para ejecutar el proyecto con
```bash
npm start
```

## Consultas

### Enviar notificaciones

Para enviar notificaciones se debe hacer una consulta `PUT` al endpoint `/v1/notas/notificar`. Por ejemplo en caso de apuntar al servidor de SISEI, la consulta sería `PUT https://apiapp.utem.dev/v1/notas/notificar`.

Es importante que en el `body` de la consulta vayan los siguientes valores como un JSON (Para eso se debe agregar el header `Content-Type: application/json`).

```
PUT /v1/notas/notificar HTTP/1.1
Content-Type: application/json

{
    "rut": "19.649.846-K",              // RUT del estudiante que recibio la nota
    "valor": "5.3",                     // Valor de la nota
    "codigo": "INFB8026",               // Código de la asignatura
    "nombre": "PRACTICA PROFESIONAL",   // Nombre de la asignatura
    "key": "123456"                     // Debe ser la misma que SISEI_KEY en las variables de entorno
}
```

## Créditos
Proyecto hecho por el Club de Innovación y Desarrollo.

### Miembros del club
* Sebastián Albornoz Medina ([@Ballena0](https://github.com/ballena0  "GitHub de Sebastián Albornoz Medina")) - Desarrollador
* Juan Avendaño Nuñez ([@Javendanon](https://github.com/Javendanon  "GitHub de Juan Avendaño Nuñez")) - Desarrollador
* Felipe Flores Vivanco ([@Spipe](https://github.com/spipe  "GitHub de Felipe Flores Vivanco")) - Desarrollador
* Mariam V. Maldonado Marin ([@mariam6697](https://github.com/mariam6697  "GitHub de Mariam V. Maldonado Marin")) - Desarrolladora
* Jorge Verdugo Chacón ([@mapacheverdugo](https://github.com/mapacheverdugo/  "GitHub de Jorge Verdugo Chacón")) - Desarrollador
* Javiera Vergara Navarro ([@PollitoMayo](https://github.com/pollitomayo/  "GitHub de Javiera Vergara Navarro")) - Desarrolladora / Ilustradora