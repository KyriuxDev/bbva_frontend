# BBVA Dashboard — Frontend Mobile

<p align="center">
  <img src="https://img.shields.io/badge/React_Native-0.81-61DAFB?style=for-the-badge&logo=react&logoColor=white"/>
  <img src="https://img.shields.io/badge/Expo_SDK-54-000020?style=for-the-badge&logo=expo&logoColor=white"/>
  <img src="https://img.shields.io/badge/TypeScript-5.9-3178C6?style=for-the-badge&logo=typescript&logoColor=white"/>
  <img src="https://img.shields.io/badge/Zustand-5-FF6B35?style=for-the-badge"/>
  <img src="https://img.shields.io/badge/TanStack_Query-5-FF4154?style=for-the-badge"/>
  <img src="https://img.shields.io/badge/NativeWind-4-06B6D4?style=for-the-badge"/>
</p>

Aplicación móvil administrativa para el dashboard de análisis BBVA. Construida con **React Native + Expo**, consume la API REST del backend para mostrar KPIs en tiempo real, gráficas interactivas, mapas de fraude geográfico, reportes PDF descargables y un asistente de IA conversacional.

---

## Índice

1. [Stack tecnológico](#stack-tecnológico)
2. [Arquitectura del proyecto](#arquitectura-del-proyecto)
3. [Pantallas y flujo de navegación](#pantallas-y-flujo-de-navegación)
4. [Módulos del dashboard](#módulos-del-dashboard)
5. [Componentes visuales](#componentes-visuales)
6. [Sistema de exportación PDF](#sistema-de-exportación-pdf)
7. [Módulo de IA Conversacional](#módulo-de-ia-conversacional)
8. [Autenticación y seguridad](#autenticación-y-seguridad)
9. [Instalación y configuración](#instalación-y-configuración)
10. [Variables de entorno](#variables-de-entorno)
11. [Paleta de colores BBVA](#paleta-de-colores-bbva)

---

## Stack tecnológico

| Capa | Tecnología | Versión |
|------|-----------|---------|
| Framework | React Native | 0.81 |
| SDK | Expo | 54 |
| Lenguaje | TypeScript | 5.9 |
| Routing | Expo Router (file-based) | 6 |
| Estado global | Zustand | 5 |
| Fetching / caché | TanStack Query | 5 |
| Formularios | React Hook Form + Zod | 7 / 4 |
| HTTP | Axios con interceptor JWT | 1 |
| Almacenamiento seguro | expo-secure-store | — |
| Estilos | StyleSheet nativo + NativeWind | 4 |
| Gráficos | react-native-svg | 15.12 |
| Mapas | react-native-maps | 1.20 |
| Video | expo-av | — |
| Gradientes | expo-linear-gradient | — |
| Biometría | expo-local-authentication | — |
| PDF | expo-print + expo-sharing | — |
| Íconos | @expo/vector-icons | 15 |

---

## Arquitectura del proyecto

```
bbva-frontend/
├── app/                                ← Expo Router (file-based routing)
│   ├── _layout.tsx                     ← Root layout: QueryClient + AuthGuard
│   ├── index.tsx                       ← Splash screen con logo SVG BBVA
│   ├── (auth)/
│   │   ├── _layout.tsx
│   │   ├── welcome.tsx                 ← Video de fondo + botón Entrar
│   │   ├── landing.tsx                 ← Vitrina de funcionalidades
│   │   └── login.tsx                   ← Login con labels flotantes animados
│   └── (main)/
│       ├── _layout.tsx
│       └── dashboard/
│           └── index.tsx               ← Dashboard principal (5 tabs)
│
├── src/
│   ├── lib/
│   │   └── axios.ts                    ← Instancia Axios + interceptor JWT
│   │
│   ├── store/
│   │   └── auth.store.ts               ← Estado de autenticación (Zustand)
│   │
│   ├── features/
│   │   ├── auth/
│   │   │   ├── auth.types.ts
│   │   │   ├── auth.schema.ts          ← Validación Zod del formulario
│   │   │   └── auth.service.ts         ← POST /auth/login
│   │   │
│   │   └── dashboard/
│   │       ├── dashboard.service.ts    ← Todas las llamadas HTTP del dashboard
│   │       ├── types/                  ← Interfaces TypeScript por módulo
│   │       │   ├── kpis.types.ts
│   │       │   ├── etl.types.ts
│   │       │   ├── debilidades.types.ts
│   │       │   ├── nuevos-kpis.types.ts
│   │       │   └── credito-ahorro.types.ts
│   │       ├── components/             ← Componentes visuales reutilizables
│   │       │   ├── AnimatedBarChart.tsx
│   │       │   ├── InteractiveLineChart.tsx
│   │       │   ├── DonutChart.tsx
│   │       │   ├── FraudeMapView.tsx
│   │       │   ├── RiskIndicator.tsx
│   │       │   ├── DebCard.tsx
│   │       │   ├── ObjetivoCard.tsx
│   │       │   ├── ComercioCard.tsx
│   │       │   ├── ComerciosModal.tsx
│   │       │   ├── SkeletonCard.tsx
│   │       │   └── ChatIA.tsx
│   │       ├── constants/
│   │       │   ├── colores.ts          ← Paleta BBVA + colores por canal
│   │       │   ├── umbrales.ts         ← Umbrales de riesgo + pasos de acción
│   │       │   └── mapa.ts             ← Coordenadas del mapa de México
│   │       ├── helpers/
│   │       │   ├── format.ts           ← fmt, fmtMXN, fmtMesLargo, calcTrimestre
│   │       │   ├── geo.ts              ← Haversine, clustering, zonas de México
│   │       │   ├── pdf.ts              ← Generadores SVG y HTML para PDFs
│   │       │   └── export.service.ts   ← Orquestador de exportación por KPI
│   │       └── styles/
│   │           └── styles.ts           ← StyleSheet global del dashboard
│   │
│   └── hooks/
│       └── useDebounce.ts
│
└── assets/
    ├── bg.mp4                          ← Video de fondo (welcome screen)
    └── images/
        ├── charts.jpg
        ├── reports.jpg
        └── analysis.jpg
```

---

## Pantallas y flujo de navegación

### Flujo completo

```
App inicia
    │
    ▼
Splash (index.tsx)
    ├── Token en SecureStore → /(main)/dashboard
    └── Sin token → /(auth)/welcome
                        │
                        ▼
                   /(auth)/landing
                        │
                        ▼
                   /(auth)/login
                        │
                        ▼ JWT guardado
                   /(main)/dashboard
```

### Pantallas detalladas

#### `app/index.tsx` — Splash Screen
Logo SVG de BBVA animado sobre fondo azul `#001491`. Hidrata el store de autenticación y redirige automáticamente según el estado de la sesión tras 3 segundos.

#### `app/(auth)/welcome.tsx` — Welcome Screen
Video de fondo en loop (fondo azul oscuro de ciudad nocturna), gradiente `rgba(4,30,66,0.85)` sobre él, y un único botón "Entrar" que lleva al Landing.

#### `app/(auth)/landing.tsx` — Landing Screen
Vitrina de las tres funcionalidades principales del dashboard (KPIs, Reportes PDF, Análisis estratégico) con tarjetas de imagen, tags y descripción. Incluye el saludo dinámico por hora del día.

#### `app/(auth)/login.tsx` — Login Screen
Formulario con labels flotantes animados (Animated.Value), validación Zod en tiempo real, toggle de visibilidad de contraseña y soporte de **autenticación biométrica** (huella dactilar) via `expo-local-authentication`. El token se guarda en `expo-secure-store`.

#### `app/(main)/dashboard/index.tsx` — Dashboard Principal
Panel con 5 tabs y pull-to-refresh. Carga en paralelo con TanStack Query (staleTime: 5 min) todos los KPIs del backend.

---

## Módulos del dashboard

El dashboard está organizado en 5 tabs, cada uno con su propia sección de datos y lógica de visualización.

### Tab 1 — Inicio

Vista de resumen ejecutivo con:

- **Banner de bienvenida** con nombre del admin
- **Banner de estado global** — clasifica automáticamente el estado del sistema en CRÍTICO, ATENCIÓN o NORMAL según cuántos indicadores superan su umbral. Toca para ir al tab de Debilidades.
- **Grid de 6 KPI cards** — Clientes, Cuentas Activas, Saldo Total, Transacciones Hoy, Alertas de Fraude, Cobros Excedidos. Cada card tiene un icono, el valor formateado, label y un indicador de tendencia coloreado.
- **Carrusel de análisis rápido** — 3 cards desplazables: Fraude por canal (donut), Top categorías (barras), Pipeline ETL (tabla de resumen).
- **Alertas de riesgo** — Las primeras 2 soluciones priorizadas de Debilidades con botón de acceso directo.

### Tab 2 — KPIs

Sección de indicadores detallados organizada por dominios:

| Sección | KPIs incluidos |
|---------|----------------|
| **TRANSACCIONES** | Tendencia mensual de fraudes (línea interactiva), Fraude por categoría (barras), Resumen ETL pipeline |
| **CLIENTES** | Distribución por segmento (donut), Distribución por género (donut) |
| **PRÉSTAMOS** | Préstamos por tipo (barras), Tasa de interés por producto (tabla + barras) |
| **CUENTAS** | Saldo por tipo de cuenta, Score crediticio (barras con semáforo) |
| **COMISIONES** | Cobros excedidos por tipo |
| **CRÉDITO — TARJETAS** | Utilización promedio (barra de progreso + barras por tipo), Morosidad (comparativa activas vs bloqueadas) |
| **METAS DE AHORRO** | Distribución por estatus (donut grande), Progreso promedio |
| **GEOGRAFÍA** | Mapa de calor de fraude sobre México SVG (toca un cluster para ver detalle) |
| **COMERCIOS** | Top 5 comercios con más fraude (acordeón expandible) + Modal con todos los comercios y filtros |
| **PAGOS** | Tasa de éxito, Canal de pago dominante |
| **SEGUROS** | Pólizas por estatus, Prima anual |
| **COMUNICACIÓN** | Tasa de entrega de notificaciones, Canal de mayor alcance (donut) |
| **CAPTACIÓN COMERCIAL** | Nuevas cuentas por sucursal (Top 10 barras), Penetración de nómina BBVA |

Cada sección incluye una **conclusión automática** (insight en caja azul o roja según si hay alerta) y un **botón de exportación individual** que genera un PDF de ese KPI específico.

Un **botón flotante** en la esquina inferior genera el **reporte ejecutivo completo** con todos los KPIs.

### Tab 3 — Debilidades

Análisis automático de riesgo con:

- **Banner rojo/naranja** con conteo de debilidades críticas y monto en riesgo del ETL
- **5 indicadores de riesgo** con barra de progreso animada, valor actual, umbral y etiqueta RIESGO / OK
- **Tarjetas de plan de acción** — una por cada área que supera su umbral, con 4 pasos numerados y solución detallada (acordeón expandible con animación `LayoutAnimation`)

### Tab 4 — Objetivos

Metas estratégicas generadas automáticamente a partir de los indicadores que superan su umbral:

- **Card del trimestre** actual con período (T1, T2, T3 o T4)
- **Una card por objetivo** con: valor actual vs meta, barra de progreso animada (Animated.Value), área responsable, estado (Pendiente / En progreso), y lista de acciones recomendadas (acordeón)

Si todos los indicadores están dentro del rango, muestra un mensaje de éxito con ícono verde.

### Tab 5 — IA

Chat conversacional con el asistente BBVA IA (Ollama local). Incluye:

- Indicador de estado de conexión a Ollama
- 4 sugerencias de preguntas frecuentes como chips
- Historial de mensajes con burbujas diferenciadas (usuario / asistente)
- Indicador "Analizando datos..." mientras el modelo genera la respuesta
- Botón de limpiar historial
- Ajuste automático al teclado virtual

---

## Componentes visuales

### `AnimatedBarChart`
Barras horizontales con animación de entrada staggered (Easing.back). Al tocar una barra, se expande para mostrar el valor y porcentaje sobre el total. El color de la barra seleccionada se intensifica.

### `InteractiveLineChart`
Gráfica de línea SVG con:
- Animación de dibujado progresivo al cargar
- PanResponder para desplazar el dedo y ver el valor de cada punto
- Tooltip animado con fecha y valor formateado
- Área bajo la curva con gradiente semitransparente
- Línea de referencia vertical en el punto seleccionado

### `DonutChart`
Donut SVG con animación de progreso (Animated.Value + progress listener). Soporte de tamaños `small` y `large`. Normaliza automáticamente los segmentos para que siempre sumen 100% y evita gaps visuales.

### `FraudeMapView`
Mapa SVG de México (mainland + Baja California) con:
- Coordenadas geográficas reales del territorio
- Clusters de fraude como círculos rojos proporcionales al número de fraudes
- Ciudades de referencia (CDMX, GDL, MTY, TIJ, MER)
- Cuadrícula semitransparente
- Al tocar un cluster: bottom sheet modal con estadísticas del cluster y recomendaciones personalizadas según canal y categoría

### `RiskIndicator`
Tarjeta de indicador de riesgo con:
- Barra de progreso animada con color semáforo (verde/amarillo/rojo)
- Etiqueta RIESGO / OK según si supera el umbral
- Texto explicativo contextualizado ("de cada 100 transacciones son sospechosas...")

### `DebCard`
Tarjeta de debilidad con acordeón animado. Muestra el área, prioridad (badge de color), problema y pasos de acción enumerados.

### `ObjetivoCard`
Tarjeta de objetivo estratégico con barra de progreso hacia la meta, estado visual (Pendiente / En progreso) y acciones recomendadas en acordeón.

### `ComercioCard` / `ComerciosModal`
Card de comercio con estadísticas básicas y acordeón de detalle (monto promedio, clientes afectados, última alerta). El modal permite buscar por nombre y filtrar por categoría con chips horizontales.

### `SkeletonCard`
Placeholder animado (pulso fade in/out) mostrado mientras cargan los datos reales.

---

## Sistema de exportación PDF

El sistema genera PDFs directamente en el dispositivo usando `expo-print` y los comparte con `expo-sharing`.

### Arquitectura de exportación

```
handleExportKpi(id)          handleExportAll()
      │                            │
      ▼                            ▼
exportKpi(id, data)         exportFullReport(data)
      │                            │
      ▼                            ▼
buildDocHtml(...)        buildFullReportHtml(...)
      │                            │
      ▼                            ▼
pdfBarsSvg / pdfLineSvg      Todas las secciones
(SVG inline en el HTML)      ensambladas en orden
      │                            │
      └─────────────┬──────────────┘
                    ▼
         Print.printToFileAsync(html)
                    │
                    ▼
         Sharing.shareAsync(uri)
```

### PDFs individuales por KPI

Cada KPI tiene su propia exportación con:
- **Chips de resumen** con valores clave y variantes de color (ok/risk/warn)
- **Gráfica SVG** de barras o línea inline en el HTML
- **Tabla de datos** con filas alternadas
- **Conclusión** automática (caja azul normal o roja de alerta)
- **5 acciones recomendadas** numeradas específicas para ese KPI

KPIs exportables individualmente: tendencia de fraudes, fraude por categoría, préstamos, saldo de cuentas, score crediticio, cobros excedidos, ETL pipeline, pagos por estatus, pagos por canal, seguros, notificaciones (estatus y canal), sucursales, clientes (segmento y género), utilización de crédito, morosidad de tarjetas, tasas de interés, metas de ahorro.

### Reporte ejecutivo completo

Contiene 12 secciones:
1. Tabla de contenido
2. Resumen ejecutivo
3. Estado global del sistema
4. Fraude y seguridad
5. Cartera de clientes
6. Cuentas y préstamos
7. Tarjetas de crédito
8. Metas de ahorro
9. Medios de pago
10. Seguros
11. Comunicación
12. Captación comercial
13. Debilidades detectadas y plan de acción

---

## Módulo de IA Conversacional

El componente `ChatIA` se conecta al endpoint `/api/v1/ai/chat` del backend, que a su vez consulta Ollama corriendo localmente.

### Características

- Envía los **últimos 6 mensajes** como historial para dar continuidad a la conversación
- Detecta cuando Ollama no está disponible y muestra banner de error con instrucciones
- Ajusta automáticamente el layout al teclado virtual usando `Keyboard.addListener`
- Las burbujas del asistente muestran el badge "BBVA IA" y están visualmente diferenciadas
- El historial persiste mientras el tab está montado y puede limpiarse con el botón de basura

### Sugerencias predefinidas

```
"¿Cuál es el estado general hoy?"
"¿Qué indicador está más crítico?"
"Resume el análisis de fraude"
"¿Qué sucursal debo priorizar?"
```

---

## Autenticación y seguridad

### Flujo de autenticación

```
1. Usuario ingresa email + contraseña en LoginScreen
        │
        ▼
2. Validación Zod del formulario
        │
        ▼
3. loginRequest() → POST /api/v1/auth/login
        │
        ▼
4. useAuthStore.login(token, admin)
   → SecureStore.set('access_token', token)
   → SecureStore.set('admin_payload', JSON.stringify(admin))
        │
        ▼
5. AuthGuard detecta isAuthenticated = true
        │
        ▼
6. router.replace('/(main)/dashboard')
```

El token se adjunta automáticamente a todas las peticiones mediante el interceptor de Axios:

```typescript
api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
```

### Bloqueo de pantalla

El dashboard incluye un menú de "Bloquear pantalla" que establece `isLocked: true` en el store. El `AuthGuard` detecta este estado y redirige a `/auth/login`. Al volver con huella dactilar, se restaura la sesión desde `SecureStore` sin necesidad de re-ingresar credenciales.

### Biometría

Si el dispositivo tiene hardware biométrico disponible (`hasHardwareAsync`) y huella registrada (`isEnrolledAsync`), aparece el botón "Entrar con huella dactilar". Usa `expo-local-authentication` y solo funciona si hay una sesión previa guardada en SecureStore.

---

## Instalación y configuración

### Requisitos

- Node.js 18 o superior
- npm 9 o superior
- Expo Go en el dispositivo ([Android](https://play.google.com/store/apps/details?id=host.exp.exponent) / [iOS](https://apps.apple.com/app/expo-go/id982107779))
- Backend BBVA corriendo y accesible en la red local

### Pasos

```bash
# 1. Clonar el repositorio
git clone https://github.com/KyriuxDev/bbva_frontend.git bbva-frontend
cd bbva-frontend

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env
# Editar .env con la IP local del backend

# 4. Agregar assets de video e imágenes
# assets/bg.mp4          ← Video de fondo (ciudad nocturna)
# assets/images/charts.jpg
# assets/images/reports.jpg
# assets/images/analysis.jpg

# 5. Iniciar servidor de desarrollo
npx expo start --clear
```

Escanea el QR con Expo Go. El celular y la PC deben estar en la **misma red WiFi**.

### Obtener la IP local

```bash
# Linux / Mac
ip route get 1 | awk '{print $7}' | head -1
# o en Mac:
ipconfig getifaddr en0

# Windows
ipconfig
# Buscar "Dirección IPv4" en el adaptador WiFi
```

### Comprimir el video de fondo (recomendado)

```bash
ffmpeg -i original.mp4 -vf scale=720:-1 -b:v 1M -t 15 assets/bg.mp4
```

---

## Variables de entorno

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `EXPO_PUBLIC_API_URL` | URL base de la API REST del backend | `http://192.168.1.100:3000/api/v1` |
| `EXPO_PUBLIC_APP_NAME` | Nombre de la app (para EAS Build) | `BBVA Dashboard` |

> Solo las variables con prefijo `EXPO_PUBLIC_` son accesibles desde el código cliente en Expo.
> No usar `localhost` — el dispositivo físico no puede alcanzarlo. Usar la IP local de la PC en la red WiFi.

---

## Paleta de colores BBVA

| Token | Hex | Uso |
|-------|-----|-----|
| `bbva-deep` | `#041e42` | Fondo principal de pantallas de auth |
| `bbva-navy` | `#002e5a` | Fondo secundario y títulos |
| `bbva-blue` | `#004481` | Header, botones primarios, KPI cards |
| `bbva-accent` | `#85b3f7` | Labels, links, acentos en auth |
| `bbva-light-blue` | `#8CD2F5` | Botones secundarios |
| `bbva-celeste` | `#1973B8` | Barras secundarias de gráficas |
| `success` | `#00a278` | Indicadores OK, valores positivos |
| `warning` | `#fbbd08` | Alertas moderadas |
| `danger` | `#ba1a1a` | Fraude, morosidad, indicadores de riesgo |
| `text-primary` | `#1a1c1c` | Texto principal |
| `text-secondary` | `#737781` | Texto secundario, labels |
| `surface` | `#f4f6fa` | Fondo de las tarjetas y el dashboard |

### Colores por canal de fraude

```typescript
App:        '#004481'   // Azul BBVA
Cajero:     '#1973B8'   // Azul medio
POS:        '#00a86b'   // Verde
Web:        '#fbbd08'   // Amarillo
Ventanilla: '#ba1a1a'   // Rojo
```

---

## Comandos del día a día

```bash
npx expo start           # Iniciar Metro Bundler
npx expo start --clear   # Limpiar caché y reiniciar
npx tsc --noEmit         # Verificar TypeScript sin compilar
```

## Solución de problemas frecuentes

| Error | Causa | Solución |
|-------|-------|----------|
| `Network request failed` | Backend no alcanzable | Verifica la IP en `.env` y que ambos estén en la misma red WiFi |
| `Cannot find module 'nativewind/plugin'` | Configuración incorrecta de Babel | Mueve `nativewind/babel` a `presets`, no a `plugins` |
| `ERESOLVE could not resolve` | Incompatibilidad de versión de react | `npx expo install react react-dom` |
| Video no se reproduce | Archivo `.mp4` faltante | Verifica que `assets/bg.mp4` exista |
| Labels flotantes no animan | `Animated.Value` mal inicializado | Inicializar con `new Animated.Value(value ? 1 : 0)` |
| IA no responde | Ollama no está corriendo | Ejecutar `ollama serve` en la terminal del host |
| Huella no aparece | No hay sesión previa en SecureStore | Iniciar sesión con contraseña primero al menos una vez |

---

*DSD-2303 · Desarrollo de Servicios Web · Instituto Tecnológico de Oaxaca*