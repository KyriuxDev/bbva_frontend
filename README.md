# BBVA Dashboard — Frontend Mobile

Aplicación móvil administrativa para el dashboard de análisis BBVA. Construida con React Native + Expo, consume la API REST del backend para mostrar KPIs, gráficas, reportes PDF y análisis de debilidades financieras.

---

## Stack

| Capa | Tecnología |
|------|-----------|
| Framework | React Native 0.81 + Expo SDK 54 |
| Routing | Expo Router 6 (file-based) |
| Lenguaje | TypeScript 5.9 |
| Estado global | Zustand 5 |
| Fetch / caché | TanStack Query 5 |
| Formularios | React Hook Form 7 + Zod 4 |
| HTTP | Axios 1 con interceptor JWT |
| Almacenamiento seguro | expo-secure-store |
| Estilos | StyleSheet nativo + NativeWind 4 |
| Gráficos vectoriales | react-native-svg |
| Video de fondo | expo-av |
| Íconos | @expo/vector-icons |
| Gradientes | expo-linear-gradient |

---

## Pantallas implementadas

| Ruta | Archivo | Descripción |
|------|---------|-------------|
| `/` | `app/index.tsx` | Splash screen con logo SVG BBVA |
| `/(auth)/welcome` | `app/(auth)/welcome.tsx` | Onboarding con video de fondo y gradiente |
| `/(auth)/landing` | `app/(auth)/landing.tsx` | Vitrina de funcionalidades (KPIs, Reportes, Análisis) |
| `/(auth)/login` | `app/(auth)/login.tsx` | Login con labels flotantes animados |
| `/(main)/dashboard` | `app/(main)/dashboard.tsx` | Dashboard principal *(en desarrollo)* |

### Flujo de navegación

```
Splash (3s)
    ├── Autenticado    → Dashboard
    └── No autenticado → Welcome → Landing → Login → Dashboard
```

---

## Arquitectura del proyecto

```
bbva-frontend/
├── app/
│   ├── _layout.tsx                  ← Root layout: QueryClient + AuthGuard
│   ├── index.tsx                    ← Splash screen
│   ├── (auth)/
│   │   ├── _layout.tsx
│   │   ├── welcome.tsx              ← Video background + botones de entrada
│   │   ├── landing.tsx              ← Vitrina de funcionalidades
│   │   └── login.tsx                ← Formulario con animaciones
│   └── (main)/
│       ├── _layout.tsx
│       └── dashboard.tsx            ← Dashboard (en desarrollo)
│
├── src/
│   ├── lib/
│   │   └── axios.ts                 ← Instancia Axios + interceptor JWT
│   ├── store/
│   │   └── auth.store.ts            ← Estado global de autenticación (Zustand)
│   ├── features/
│   │   └── auth/
│   │       ├── auth.types.ts
│   │       ├── auth.schema.ts       ← Validación Zod
│   │       └── auth.service.ts      ← Llamada HTTP al login
│   └── hooks/
│       └── useDebounce.ts
│
├── assets/
│   ├── bg.mp4                       ← Video de fondo (welcome screen)
│   └── images/
│       ├── charts.png               ← Imagen card KPIs
│       ├── reports.png              ← Imagen card Reportes
│       └── analysis.png             ← Imagen card Análisis
│
├── .env
├── .env.example
├── app.json
├── babel.config.js
├── metro.config.js
├── tailwind.config.js
├── tsconfig.json
└── package.json
```

---

## Requisitos previos

- Node.js 18 o superior
- npm 9 o superior
- Expo Go instalado en tu dispositivo móvil ([Android](https://play.google.com/store/apps/details?id=host.exp.exponent) / [iOS](https://apps.apple.com/app/expo-go/id982107779))
- El backend BBVA corriendo (ver README del backend)

---

## Instalación

### 1. Clonar el repositorio

```bash
git clone https://github.com/KyriuxDev/bbva_frontend.git bbva-frontend
cd bbva-frontend
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

```bash
cp .env.example .env
```

Edita `.env` con la IP local de la máquina donde corre el backend:

```ini
EXPO_PUBLIC_API_URL=http://192.168.X.X:3000/api/v1
EXPO_PUBLIC_APP_NAME=BBVA Dashboard
```

> ⚠️ **No uses `localhost`** — el celular físico no puede alcanzarlo. Usa la IP local de tu PC en la red WiFi.

### 4. Agregar los assets de video e imágenes

Coloca los archivos en las rutas indicadas:

```
assets/bg.mp4              ← Video de fondo (welcome screen)
assets/images/charts.png   ← Dashboard de KPIs
assets/images/reports.png  ← Reportes PDF
assets/images/analysis.png ← Análisis estratégico
```

Recomendación para el video: busca en [Pexels](https://pexels.com/search/videos/city%20night/) algo con tonos oscuros/azules. Comprime antes de incluirlo:

```bash
ffmpeg -i original.mp4 -vf scale=720:-1 -b:v 1M -t 15 assets/bg.mp4
```

### 5. Iniciar el servidor de desarrollo

```bash
npx expo start --clear
```

Escanea el QR con Expo Go desde tu celular. El celular y la PC deben estar en **la misma red WiFi**.

---

## Obtener tu IP local

**Linux / Mac:**
```bash
ip route get 1 | awk '{print $7}' | head -1
# o en Mac:
ipconfig getifaddr en0
```

**Windows:**
```bash
ipconfig
# Busca "Dirección IPv4" en el adaptador WiFi
```

---

## Referencia de variables de entorno

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `EXPO_PUBLIC_API_URL` | URL base de la API REST | `http://192.168.1.100:3000/api/v1` |
| `EXPO_PUBLIC_APP_NAME` | Nombre de la app | `BBVA Dashboard` |

> Solo las variables con prefijo `EXPO_PUBLIC_` son accesibles desde el código cliente.

---

## Credenciales de acceso demo

| Campo | Valor |
|-------|-------|
| Email | `admin@bbva.com` |
| Contraseña | `Admin123!` |

---

## Flujo de autenticación

```
1. Usuario ingresa email + contraseña en login.tsx
        ↓
2. loginRequest() → POST /api/v1/auth/login
        ↓
3. Respuesta: { token, admin }
        ↓
4. useAuthStore.login() guarda token en expo-secure-store
        ↓
5. AuthGuard detecta isAuthenticated = true
        ↓
6. Redirección automática a /(main)/dashboard
```

El token se adjunta automáticamente a todas las peticiones mediante el interceptor en `src/lib/axios.ts`.

---

## Endpoints del backend que consume el frontend

| Módulo | Endpoint | Descripción |
|--------|----------|-------------|
| Auth | `POST /auth/login` | Login → retorna JWT |
| Auth | `GET /auth/me` | Datos del admin |
| KPIs | `GET /kpis/resumen` | Tarjetas de resumen |
| KPIs | `GET /kpis/tendencia` | Gráfica de línea 12 meses |
| KPIs | `GET /kpis/debilidades` | Análisis + soluciones |
| Reportes | `GET /reportes/kpis` | Descarga PDF |
| ETL | `GET /etl/resumen` | Resumen de fraude |

---

## Comandos del día a día

```bash
npx expo start           # iniciar Metro
npx expo start --clear   # limpiar caché y reiniciar
npx tsc --noEmit         # verificar TypeScript sin compilar
```

---

## Errores frecuentes

| Error | Causa | Solución |
|-------|-------|----------|
| `Network request failed` | Backend no alcanzable | Verifica la IP en `.env` y que ambos dispositivos estén en la misma red WiFi |
| `Cannot find module '@expo/vector-icons'` | Paquete no instalado correctamente | `npx expo install @expo/vector-icons` |
| `Cannot find module 'react-native-worklets/plugin'` | `nativewind/babel` en `plugins` en lugar de `presets` | Mueve `nativewind/babel` a la sección `presets` del `babel.config.js` |
| `ERESOLVE could not resolve` al instalar | Versión de `react` incompatible | Ejecuta `npx expo install react react-dom` primero |
| Labels flotantes no animan | `Animated.Value` inicializado incorrectamente | Asegúrate de inicializar con `value ? 1 : 0` |
| Video no se reproduce | Archivo `.mp4` faltante o ruta incorrectamente | Verifica que `assets/bg.mp4` exista |
| Footer sube al eliminar contenido | ScrollView sin `flexGrow` | Agrega `contentContainerStyle={{ flexGrow: 1, justifyContent: 'space-between' }}` |

---

## Paleta de colores BBVA

| Token | Hex | Uso |
|-------|-----|-----|
| `bbva-deep` | `#041e42` | Fondo principal oscuro |
| `bbva-navy` | `#002e5a` | Fondo secundario |
| `bbva-blue` | `#004481` | Header, botones primarios |
| `bbva-accent` | `#85b3f7` | Labels, links, acentos |
| `bbva-light-blue` | `#8CD2F5` | Botones secundarios |

---

## Estructura de carpetas — convención

| Carpeta | Responsabilidad |
|---------|-----------------|
| `app/` | Rutas Expo Router. Solo pantallas y layouts, sin lógica de negocio |
| `src/features/` | Dominio: tipos, schema, servicio y queries por módulo |
| `src/store/` | Estado global del cliente (Zustand) |
| `src/lib/` | Infraestructura: Axios, configuraciones de librerías |
| `src/hooks/` | Hooks genéricos reutilizables |
| `assets/` | Imágenes, video, íconos |

---

*DSD-2303 · Desarrollo de Servicios Web · Instituto Tecnológico de Oaxaca*