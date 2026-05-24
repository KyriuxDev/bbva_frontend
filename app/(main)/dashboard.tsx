import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
  StatusBar,
  Animated,
  Switch,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle, G, Path, Line, Text as TextSvg, Polyline } from 'react-native-svg';
import { useAuthStore } from '@/src/store/auth.store';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

// ── Gráfico de Dona Matemático en SVG ─────────────────────────
interface Segment {
  percentage: number;
  color: string;
  label: string;
}

function DonutChart({ segments }: { segments: Segment[] }) {
  const radius = 55;
  const strokeWidth = 24;
  const circumference = 2 * Math.PI * radius; // ~345.57
  const center = 100;

  let accumulatedPercentage = 0;

  return (
    <View style={dc.container}>
      <Svg width={200} height={200} viewBox="0 0 200 200">
        <G transform="rotate(-90 100 100)">
          {/* Fondo gris de la dona */}
          <Circle
            cx={center}
            cy={center}
            r={radius}
            stroke="#f0f2f5"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Segmentos coloreados */}
          {segments.map((seg, idx) => {
            const strokeLength = (seg.percentage / 100) * circumference;
            const strokeOffset = circumference - ((accumulatedPercentage / 100) * circumference);
            accumulatedPercentage += seg.percentage;

            return (
              <Circle
                key={idx}
                cx={center}
                cy={center}
                r={radius}
                stroke={seg.color}
                strokeWidth={strokeWidth}
                strokeDasharray={`${strokeLength} ${circumference}`}
                strokeDashoffset={strokeOffset}
                strokeLinecap="butt"
                fill="transparent"
              />
            );
          })}
        </G>
      </Svg>

      {/* Leyendas y etiquetas del gráfico */}
      <View style={dc.legendGrid}>
        {segments.slice(0, 3).map((seg, idx) => (
          <View key={idx} style={dc.legendItem}>
            <View style={[dc.dot, { backgroundColor: seg.color }]} />
            <Text style={dc.legendText}>
              {seg.label} {seg.percentage}%
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const dc = StyleSheet.create({
  container:  { alignItems: 'center', justifyContent: 'center', marginVertical: 12 },
  legendGrid: { flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap', gap: 12, marginTop: 16 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot:        { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: 12, fontWeight: '600', color: '#5d5f5f' },
});

// ── Mini Donut Chart para KPIs ────────────────────────────────
function MiniDonutChart({ segments }: { segments: Segment[] }) {
  const radius = 26;
  const strokeWidth = 10;
  const circumference = 2 * Math.PI * radius; // ~163.36
  const center = 40;

  let accumulatedPercentage = 0;

  return (
    <View style={mdc.container}>
      <Svg width={80} height={80} viewBox="0 0 80 80">
        <G transform="rotate(-90 40 40)">
          <Circle
            cx={center}
            cy={center}
            r={radius}
            stroke="#f0f2f5"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {segments.map((seg, idx) => {
            const strokeLength = (seg.percentage / 100) * circumference;
            const strokeOffset = circumference - ((accumulatedPercentage / 100) * circumference);
            accumulatedPercentage += seg.percentage;

            return (
              <Circle
                key={idx}
                cx={center}
                cy={center}
                r={radius}
                stroke={seg.color}
                strokeWidth={strokeWidth}
                strokeDasharray={`${strokeLength} ${circumference}`}
                strokeDashoffset={strokeOffset}
                strokeLinecap="butt"
                fill="transparent"
              />
            );
          })}
        </G>
      </Svg>

      <View style={mdc.legendGrid}>
        {segments.map((seg, idx) => (
          <View key={idx} style={mdc.legendItem}>
            <View style={[mdc.dot, { backgroundColor: seg.color }]} />
            <Text style={mdc.legendText}>
              {seg.label} {seg.percentage}%
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const mdc = StyleSheet.create({
  container:  { alignItems: 'center', justifyContent: 'center' },
  legendGrid: { marginTop: 12, gap: 4, width: '100%' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot:        { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 10, fontWeight: '700', color: '#5d5f5f' },
});

// ── Gráfico de Línea de Fraudes Mensuales ──────────────────────
function FraudLineChart() {
  return (
    <View style={{ height: 160, marginVertical: 12, alignItems: 'center' }}>
      <Svg width={width - 64} height={150} viewBox="0 0 320 150">
        {/* Líneas de cuadrícula y etiquetas Y */}
        <Line x1="40" y1="15" x2="310" y2="15" stroke="#e2e6ed" strokeDasharray="3 3" />
        <TextSvg x="10" y="19" fontSize="10" fill="#737781" fontWeight="600">650</TextSvg>

        <Line x1="40" y1="42.5" x2="310" y2="42.5" stroke="#e2e6ed" strokeDasharray="3 3" />
        <TextSvg x="10" y="46.5" fontSize="10" fill="#737781" fontWeight="600">600</TextSvg>

        <Line x1="40" y1="70" x2="310" y2="70" stroke="#e2e6ed" strokeDasharray="3 3" />
        <TextSvg x="10" y="74" fontSize="10" fill="#737781" fontWeight="600">550</TextSvg>

        <Line x1="40" y1="97.5" x2="310" y2="97.5" stroke="#e2e6ed" strokeDasharray="3 3" />
        <TextSvg x="10" y="101.5" fontSize="10" fill="#737781" fontWeight="600">500</TextSvg>

        <Line x1="40" y1="125" x2="310" y2="125" stroke="#e2e6ed" strokeDasharray="3 3" />
        <TextSvg x="10" y="129" fontSize="10" fill="#737781" fontWeight="600">450</TextSvg>

        {/* Línea del gráfico */}
        <Polyline
          fill="none"
          stroke="#004481"
          strokeWidth="2"
          points="40,75 55,42 70,95 85,55 100,100 115,42 130,68 145,95 160,68 175,32 190,62 205,25 220,62 235,88 250,95 265,52 280,88 295,68 310,95"
        />

        {/* Etiquetas X */}
        <TextSvg x="35" y="142" fontSize="7" fill="#737781" fontWeight="600">2022-01</TextSvg>
        <TextSvg x="80" y="142" fontSize="7" fill="#737781" fontWeight="600">2022-07</TextSvg>
        <TextSvg x="125" y="142" fontSize="7" fill="#737781" fontWeight="600">2023-01</TextSvg>
        <TextSvg x="170" y="142" fontSize="7" fill="#737781" fontWeight="600">2023-07</TextSvg>
        <TextSvg x="215" y="142" fontSize="7" fill="#737781" fontWeight="600">2024-01</TextSvg>
        <TextSvg x="260" y="142" fontSize="7" fill="#737781" fontWeight="600">2024-07</TextSvg>
      </Svg>
    </View>
  );
}

// ── Pantalla Principal de Dashboard ───────────────────────────
export default function Dashboard() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const logout = useAuthStore((s) => s.logout);

  // Estados de navegación e interactividad
  const [activeTab, setActiveTab] = useState<'Inicio' | 'KPIs' | 'Reportes' | 'Debilidades'>('Inicio');
  const [hideAmounts, setHideAmounts] = useState<boolean>(false);

  // Estados para personalización de reportes
  const [incKpi, setIncKpi] = useState(true);
  const [incFraud, setIncFraud] = useState(true);
  const [incDeb, setIncDeb] = useState(true);
  const [incRec, setIncRec] = useState(true);
  const [incGraph, setIncGraph] = useState(true);

  // Estado para acordeones de debilidades
  const [expandedDebId, setExpandedDebId] = useState<number | null>(null);

  // Animación del carrusel horizontal de análisis rápido
  const scrollX = useRef(new Animated.Value(0)).current;

  const handleLogout = async () => {
    await logout();
    router.replace('/(auth)/welcome');
  };

  // Datos del gráfico de dona
  const donutData: Segment[] = [
    { percentage: 35.4, color: '#004481', label: 'App' },
    { percentage: 24.6, color: '#007dd6', label: 'Cajero' },
    { percentage: 15.3, color: '#00a86b', label: 'POS' },
    { percentage: 24.7, color: '#ba1a1a', label: 'Otros' },
  ];

  return (
    <View style={[s.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {/* ── 1. Cabecera (Header) ── */}
      <View style={s.header}>
        <TouchableOpacity style={s.headerBtn} onPress={() => setHideAmounts(!hideAmounts)}>
          <Ionicons name={hideAmounts ? 'eye-off-outline' : 'eye-outline'} size={24} color="#004481" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>BBVA</Text>
        <TouchableOpacity style={s.headerBtn}>
          <Ionicons name="menu" size={24} color="#004481" />
        </TouchableOpacity>
      </View>

      {/* ── 2. Contenido según la pestaña activa ── */}
      <View style={{ flex: 1 }}>
        {activeTab === 'Inicio' && (
          <ScrollView
            style={s.scrollBody}
            contentContainerStyle={s.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Banner de saludo */}
            <View style={s.bannerCard}>
              <Text style={s.bannerTitle}>Hola, Admin</Text>
              <Text style={s.bannerSub}>Panel de análisis BBVA</Text>
            </View>

            {/* Grid de KPIs 2x2 */}
            <View style={s.kpiGrid}>
              {/* Tarjeta 1: Clientes */}
              <View style={s.kpiCard}>
                <View style={s.kpiHeaderRow}>
                  <View style={s.iconWrapper}>
                    <Ionicons name="people-outline" size={20} color="#004481" />
                  </View>
                </View>
                <Text style={s.kpiValue}>{hideAmounts ? '•••••' : '50,000'}</Text>
                <Text style={s.kpiLabel}>Total Clientes</Text>
                <View style={s.trendRow}>
                  <Ionicons name="trending-up" size={14} color="#00a278" />
                  <Text style={[s.trendText, { color: '#00a278' }]}>↑ 2.3%</Text>
                </View>
              </View>

              {/* Tarjeta 2: Saldo Total */}
              <View style={s.kpiCard}>
                <View style={s.kpiHeaderRow}>
                  <View style={s.iconWrapper}>
                    <Ionicons name="cash-outline" size={20} color="#004481" />
                  </View>
                </View>
                <Text style={s.kpiValue}>{hideAmounts ? '••••••••' : '$2.4B MXN'}</Text>
                <Text style={s.kpiLabel}>Saldo Total</Text>
                <View style={s.trendRow}>
                  <Ionicons name="trending-up" size={14} color="#00a278" />
                  <Text style={[s.trendText, { color: '#00a278' }]}>↑ 1.1%</Text>
                </View>
              </View>

              {/* Tarjeta 3: Alertas Fraude */}
              <View style={s.kpiCard}>
                <View style={s.kpiHeaderRow}>
                  <View style={s.iconWrapper}>
                    <Ionicons name="shield-outline" size={20} color="#004481" />
                  </View>
                </View>
                <Text style={s.kpiValue}>{hideAmounts ? '•••••' : '20,252'}</Text>
                <Text style={s.kpiLabel}>Alertas Fraude</Text>
                <View style={s.trendRow}>
                  <Ionicons name="trending-down" size={14} color="#ba1a1a" />
                  <Text style={[s.trendText, { color: '#ba1a1a' }]}>↑ 0.8%</Text>
                </View>
              </View>

              {/* Tarjeta 4: Cobros Excedidos */}
              <View style={s.kpiCard}>
                <View style={s.kpiHeaderRow}>
                  <View style={s.iconWrapper}>
                    <Ionicons name="card-outline" size={20} color="#004481" />
                  </View>
                </View>
                <Text style={s.kpiValue}>{hideAmounts ? '••••' : '1,847'}</Text>
                <Text style={s.kpiLabel}>Cobros Excedidos</Text>
                <View style={s.trendRow}>
                  <Ionicons name="trending-up" size={14} color="#00a278" />
                  <Text style={[s.trendText, { color: '#00a278' }]}>↓ 0.3%</Text>
                </View>
              </View>
            </View>

            {/* Análisis Rápido (Carrusel Horizontal) */}
            <Text style={s.sectionTitle}>Análisis rápido</Text>
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              style={s.carousel}
              contentContainerStyle={{ paddingRight: 20 }}
            >
              {/* Tarjeta Carrusel 1: Dona */}
              <View style={s.carouselCard}>
                <Text style={s.carouselTitle}>Fraude por canal</Text>
                <Text style={s.carouselSub}>Distribución porcentual</Text>
                <DonutChart segments={donutData} />
              </View>

              {/* Tarjeta Carrusel 2: Categorías Críticas */}
              <View style={s.carouselCard}>
                <Text style={s.carouselTitle}>Top 3 Categorías</Text>
                <Text style={s.carouselSub}>Mayor morosidad y alertas</Text>
                <View style={s.critList}>
                  {[
                    { cat: 'Electrónica', count: '12,450', percent: 65, color: '#ba1a1a' },
                    { cat: 'Salud y Farmacia', count: '5,802', percent: 45, color: '#fbbd08' },
                    { cat: 'Supermercados', count: '2,000', percent: 25, color: '#00a86b' },
                  ].map((item, idx) => (
                    <View key={idx} style={s.critItem}>
                      <View style={s.critLabelRow}>
                        <Text style={s.critName}>{item.cat}</Text>
                        <Text style={s.critCount}>{hideAmounts ? '••••' : item.count}</Text>
                      </View>
                      <View style={s.barBg}>
                        <View style={[s.barFill, { width: `${item.percent}%`, backgroundColor: item.color }]} />
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            </ScrollView>

            {/* Debilidades Detectadas */}
            <Text style={s.sectionTitle}>Debilidades detectadas</Text>

            {/* Tarjeta Debilidad 1 */}
            <View style={s.debCard}>
              <View style={s.debIconBox}>
                <Ionicons name="phone-portrait-outline" size={24} color="#ba1a1a" />
              </View>
              <View style={s.debBody}>
                <View style={s.badge}>
                  <Text style={s.badgeText}>ALTA</Text>
                </View>
                <Text style={s.debTitle}>App Móvil concentra 35.4% del fraude</Text>
                <Text style={s.debDesc}>
                  El canal digital presenta la mayor vulnerabilidad. Autenticación insuficiente en operaciones de transferencias rápidas.
                </Text>
                <TouchableOpacity style={s.solLink} onPress={() => setActiveTab('Debilidades')}>
                  <Text style={s.solLinkTxt}>Ver solución</Text>
                  <Ionicons name="chevron-forward" size={14} color="#004481" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Tarjeta Debilidad 2 */}
            <View style={s.debCard}>
              <View style={s.debIconBox}>
                <Ionicons name="basket-outline" size={24} color="#ba1a1a" />
              </View>
              <View style={s.debBody}>
                <View style={s.badge}>
                  <Text style={s.badgeText}>ALTA</Text>
                </View>
                <Text style={s.debTitle}>Salud y Electrónica: categorías críticas</Text>
                <Text style={s.debDesc}>
                  Concentran más de 4,000 alertas combinadas. Posibles campañas de fraude organizadas en comercios virtuales no verificados.
                </Text>
                <TouchableOpacity style={s.solLink} onPress={() => setActiveTab('Debilidades')}>
                  <Text style={s.solLinkTxt}>Ver solución</Text>
                  <Ionicons name="chevron-forward" size={14} color="#004481" />
                </TouchableOpacity>
              </View>
            </View>

            <View style={{ height: 40 }} />
          </ScrollView>
        )}

        {/* ── Pestaña: KPIs ── */}
        {activeTab === 'KPIs' && (
          <ScrollView style={s.scrollBody} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
            <Text style={s.tabMainTitle}>Indicadores Clave</Text>
            <Text style={s.tabSubtitle}>Métricas y tendencias del sistema</Text>

            {/* SECCIÓN: TRANSACCIONES */}
            <Text style={s.sectionHeader}>TRANSACCIONES</Text>

            {/* Tarjeta: Tendencia Mensual */}
            <View style={s.kpiDetailCard}>
              <Text style={s.cardTitle}>Tendencia mensual de fraudes</Text>
              <Text style={s.cardSubtitle}>2022-2024 · 36 meses</Text>
              <FraudLineChart />
              <TouchableOpacity style={s.detailLink}>
                <Text style={s.detailLinkTxt}>Ver detalle →</Text>
              </TouchableOpacity>
            </View>

            {/* Tarjeta: Fraude por Categoría */}
            <View style={s.kpiDetailCard}>
              <Text style={s.cardTitle}>Fraude por categoría</Text>
              <Text style={s.cardSubtitle}>10 principales categorías</Text>
              
              <View style={s.barChartContainer}>
                {[
                  { name: 'Salud', percent: 90 },
                  { name: 'Electrónica', percent: 87 },
                  { name: 'Servicios', percent: 84 },
                  { name: 'Educación', percent: 81 },
                  { name: 'Viajes', percent: 77 },
                  { name: 'Entretenimiento', percent: 73 },
                  { name: 'Gasolina', percent: 67 },
                  { name: 'Restaurantes', percent: 63 },
                  { name: 'Ropa', percent: 56 },
                  { name: 'Súper', percent: 48 },
                ].map((item, idx) => (
                  <View key={idx} style={s.barChartRow}>
                    <Text style={s.barChartLabel}>{item.name}</Text>
                    <View style={s.barChartFillWrapper}>
                      <View style={[s.barChartFill, { width: `${item.percent}%`, backgroundColor: '#00a2ff' }]} />
                    </View>
                  </View>
                ))}
              </View>

              <TouchableOpacity style={s.detailLink}>
                <Text style={s.detailLinkTxt}>Ver detalle →</Text>
              </TouchableOpacity>
            </View>

            {/* SECCIÓN: CLIENTES */}
            <Text style={s.sectionHeader}>CLIENTES</Text>

            <View style={s.sideBySideRow}>
              {/* Tarjeta: Por segmento */}
              <View style={s.halfCard}>
                <Text style={s.halfCardTitle}>Por segmento</Text>
                <View style={{ marginVertical: 8, alignItems: 'center' }}>
                  <MiniDonutChart
                    segments={[
                      { percentage: 48, color: '#004481', label: 'Premium' },
                      { percentage: 32, color: '#007dd6', label: 'Nómina' },
                      { percentage: 20, color: '#00a86b', label: 'PyME' },
                    ]}
                  />
                </View>
              </View>

              {/* Tarjeta: Por género */}
              <View style={s.halfCard}>
                <Text style={s.halfCardTitle}>Por género</Text>
                <View style={{ marginVertical: 8, alignItems: 'center' }}>
                  <MiniDonutChart
                    segments={[
                      { percentage: 51, color: '#004481', label: 'Masculino' },
                      { percentage: 49, color: '#007dd6', label: 'Femenino' },
                    ]}
                  />
                </View>
              </View>
            </View>

            {/* SECCIÓN: CRÉDITO Y CUENTAS */}
            <Text style={s.sectionHeader}>CRÉDITO Y CUENTAS</Text>

            {/* Tarjeta: Saldo por tipo de cuenta */}
            <View style={s.kpiDetailCard}>
              <Text style={s.cardTitle}>Saldo por tipo de cuenta</Text>
              <Text style={s.cardSubtitle}>En millones MXN</Text>

              <View style={[s.barChartContainer, { marginTop: 16 }]}>
                {[
                  { name: 'Ahorro', percent: 85 },
                  { name: 'Nómina', percent: 70 },
                  { name: 'Corriente', percent: 50 },
                  { name: 'Inversión', percent: 35 },
                ].map((item, idx) => (
                  <View key={idx} style={s.barChartRow}>
                    <Text style={s.barChartLabel}>{item.name}</Text>
                    <View style={s.barChartFillWrapper}>
                      <View style={[s.barChartFill, { width: `${item.percent}%`, backgroundColor: '#00a86b' }]} />
                    </View>
                  </View>
                ))}
              </View>

              <TouchableOpacity style={s.detailLink}>
                <Text style={s.detailLinkTxt}>Ver detalle →</Text>
              </TouchableOpacity>
            </View>

            {/* Tarjeta: Préstamos por tipo */}
            <View style={s.kpiDetailCard}>
              <Text style={s.cardTitle}>Préstamos por tipo</Text>
              <Text style={s.cardSubtitle}>En millones MXN</Text>

              <View style={[s.barChartContainer, { marginTop: 16 }]}>
                {[
                  { name: 'Hipotecario', percent: 82 },
                  { name: 'Personal', percent: 52 },
                  { name: 'Auto', percent: 32 },
                  { name: 'PyME', percent: 28 },
                ].map((item, idx) => (
                  <View key={idx} style={s.barChartRow}>
                    <Text style={s.barChartLabel}>{item.name}</Text>
                    <View style={s.barChartFillWrapper}>
                      <View style={[s.barChartFill, { width: `${item.percent}%`, backgroundColor: '#fbbd08' }]} />
                    </View>
                  </View>
                ))}
              </View>

              <TouchableOpacity style={s.detailLink}>
                <Text style={s.detailLinkTxt}>Ver detalle →</Text>
              </TouchableOpacity>
            </View>

            <View style={{ height: 40 }} />
          </ScrollView>
        )}

        {/* ── Pestaña: Reportes ── */}
        {activeTab === 'Reportes' && (
          <ScrollView style={s.scrollBody} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
            <Text style={s.tabMainTitle}>Reportes</Text>
            <Text style={s.tabSubtitle}>Genera y descarga informes ejecutivos</Text>

            {/* Tarjeta Hero: Reporte Ejecutivo de KPIs */}
            <View style={s.reportHeroCard}>
              <Text style={s.heroTitle}>Reporte Ejecutivo de KPIs</Text>
              <Text style={s.heroSubtitle}>Fraude · Debilidades · Soluciones</Text>
              <Text style={s.heroDesc}>
                Informe estructurado para dirección con análisis completo del pipeline ETL, alertas detectadas y recomendaciones priorizadas.
              </Text>
              
              <TouchableOpacity style={s.heroBtn} activeOpacity={0.9}>
                <Ionicons name="download-outline" size={20} color="#004481" style={{ marginRight: 8 }} />
                <Text style={s.heroBtnTxt}>Generar y Descargar PDF</Text>
              </TouchableOpacity>

              <View style={s.heroTagRow}>
                <View style={s.heroTag}><Text style={s.heroTagTxt}>Incluye gráficas</Text></View>
                <View style={s.heroTag}><Text style={s.heroTagTxt}>Análisis automático</Text></View>
                <View style={s.heroTag}><Text style={s.heroTagTxt}>Soluciones</Text></View>
              </View>
            </View>

            {/* SECCIÓN: REPORTES RECIENTES */}
            <Text style={s.sectionHeader}>REPORTES RECIENTES</Text>

            {[
              { name: 'Reporte_KPIs_Mayo_2025.pdf', date: '15 May 2025', size: '2.4 MB' },
              { name: 'Reporte_KPIs_Abril_2025.pdf', date: '15 Abr 2025', size: '2.1 MB' },
              { name: 'Reporte_KPIs_Marzo_2025.pdf', date: '15 Mar 2025', size: '2.3 MB' },
            ].map((rep, idx) => (
              <View key={idx} style={s.repListItem}>
                <View style={s.pdfIconContainer}>
                  <Ionicons name="document-text-outline" size={24} color="#ba1a1a" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.repFileName} numberOfLines={1}>{rep.name}</Text>
                  <Text style={s.repSubText}>{rep.date} • {rep.size}</Text>
                </View>
                <TouchableOpacity style={s.repDownloadBtn}>
                  <Ionicons name="download-outline" size={20} color="#004481" />
                </TouchableOpacity>
              </View>
            ))}

            {/* SECCIÓN: PERSONALIZAR REPORTE */}
            <Text style={s.sectionHeader}>PERSONALIZAR REPORTE</Text>

            <View style={s.customizeCard}>
              {/* Opción 1: Incluir KPIs generales */}
              <View style={s.customRow}>
                <Text style={s.customRowLabel}>Incluir KPIs generales</Text>
                <Switch
                  value={incKpi}
                  onValueChange={setIncKpi}
                  trackColor={{ false: '#d1d5db', true: '#004481' }}
                  thumbColor="#ffffff"
                  ios_backgroundColor="#d1d5db"
                />
              </View>

              {/* Opción 2: Incluir análisis de fraude */}
              <View style={s.customRow}>
                <Text style={s.customRowLabel}>Incluir análisis de fraude</Text>
                <Switch
                  value={incFraud}
                  onValueChange={setIncFraud}
                  trackColor={{ false: '#d1d5db', true: '#004481' }}
                  thumbColor="#ffffff"
                  ios_backgroundColor="#d1d5db"
                />
              </View>

              {/* Opción 3: Incluir debilidades detectadas */}
              <View style={s.customRow}>
                <Text style={s.customRowLabel}>Incluir debilidades detectadas</Text>
                <Switch
                  value={incDeb}
                  onValueChange={setIncDeb}
                  trackColor={{ false: '#d1d5db', true: '#004481' }}
                  thumbColor="#ffffff"
                  ios_backgroundColor="#d1d5db"
                />
              </View>

              {/* Opción 4: Incluir recomendaciones */}
              <View style={s.customRow}>
                <Text style={s.customRowLabel}>Incluir recomendaciones</Text>
                <Switch
                  value={incRec}
                  onValueChange={setIncRec}
                  trackColor={{ false: '#d1d5db', true: '#004481' }}
                  thumbColor="#ffffff"
                  ios_backgroundColor="#d1d5db"
                />
              </View>

              {/* Opción 5: Incluir gráficas */}
              <View style={[s.customRow, { borderBottomWidth: 0, paddingBottom: 0 }]}>
                <Text style={s.customRowLabel}>Incluir gráficas</Text>
                <Switch
                  value={incGraph}
                  onValueChange={setIncGraph}
                  trackColor={{ false: '#d1d5db', true: '#004481' }}
                  thumbColor="#ffffff"
                  ios_backgroundColor="#d1d5db"
                />
              </View>
            </View>

            <View style={{ height: 40 }} />
          </ScrollView>
        )}

        {/* ── Pestaña: Debilidades ── */}
        {activeTab === 'Debilidades' && (
          <ScrollView style={s.scrollBody} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
            <Text style={s.tabMainTitle}>Debilidades Detectadas</Text>
            <Text style={s.tabSubtitle}>Análisis automático del sistema</Text>

            {/* Banner Degradado de Alerta */}
            <LinearGradient
              colors={['#ba1a1a', '#ff9900']}
              start={{ x: 0, y: 1 }}
              end={{ x: 1, y: 0 }}
              style={s.alertBanner}
            >
              <View style={s.alertBannerHeader}>
                <Ionicons name="warning-outline" size={20} color="#ffffff" style={{ marginRight: 8 }} />
                <Text style={s.alertBannerText}>3 debilidades críticas encontradas</Text>
              </View>
              <Text style={s.alertBannerAmount}>
                {hideAmounts ? '•••••••••' : '$151.1M MXN en riesgo'}
              </Text>
            </LinearGradient>

            {/* Tarjeta Debilidad 1: App Móvil */}
            <View style={s.debDetailCard}>
              <View style={s.debHeaderRow}>
                <View style={[s.debDetailIconBox, { backgroundColor: '#fbebeb' }]}>
                  <Ionicons name="phone-portrait-outline" size={24} color="#ba1a1a" />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={s.badge}>
                    <Text style={s.badgeText}>ALTA</Text>
                  </View>
                  <Text style={s.debTitle}>App Móvil concentra 35.4% del fraude</Text>
                  <Text style={s.debDesc}>
                    El canal digital presenta la mayor vulnerabilidad. Autenticación insuficiente en transacciones nocturnas.
                  </Text>
                </View>
              </View>

              {/* Metricas de Alertas y Monto */}
              <View style={s.debMetricsRow}>
                <View style={s.debMetricItem}>
                  <Ionicons name="alert-circle-outline" size={14} color="#737781" />
                  <Text style={s.debMetricText}>7161 alertas</Text>
                </View>
                <View style={s.debMetricItem}>
                  <Ionicons name="cash-outline" size={14} color="#ba1a1a" />
                  <Text style={s.debMetricTextCritical}>{hideAmounts ? '••••••••' : '$53.5M MXN'}</Text>
                </View>
              </View>

              {/* Botón Acordeón */}
              <TouchableOpacity
                style={s.accordionBtn}
                onPress={() => setExpandedDebId(expandedDebId === 1 ? null : 1)}
              >
                <Text style={s.accordionBtnText}>
                  {expandedDebId === 1 ? 'Ocultar solución' : 'Ver solución completa'}
                </Text>
                <Ionicons
                  name={expandedDebId === 1 ? 'chevron-up' : 'chevron-down'}
                  size={16}
                  color="#004481"
                />
              </TouchableOpacity>

              {/* Acordeón Desplegable */}
              {expandedDebId === 1 && (
                <View style={s.accordionContent}>
                  <Text style={s.mitigationTitle}>Plan de Mitigación Sugerido</Text>
                  <View style={s.mitigationItem}>
                    <Text style={s.mitigationDot}>•</Text>
                    <Text style={s.mitigationText}>Forzar aprobación biométrica multifactor (2FA) para transferencias rápidas.</Text>
                  </View>
                  <View style={s.mitigationItem}>
                    <Text style={s.mitigationDot}>•</Text>
                    <Text style={s.mitigationText}>Implementar segundo factor dinámico obligatorio para operaciones entre las 11 PM y 6 AM.</Text>
                  </View>
                  <View style={s.mitigationItem}>
                    <Text style={s.mitigationDot}>•</Text>
                    <Text style={s.mitigationText}>Activar análisis conductual heurístico con Inteligencia Artificial.</Text>
                  </View>
                </View>
              )}
            </View>

            {/* Tarjeta Debilidad 2: Salud y Electrónica */}
            <View style={s.debDetailCard}>
              <View style={s.debHeaderRow}>
                <View style={[s.debDetailIconBox, { backgroundColor: '#fbebeb' }]}>
                  <Ionicons name="basket-outline" size={24} color="#ba1a1a" />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={s.badge}>
                    <Text style={s.badgeText}>ALTA</Text>
                  </View>
                  <Text style={s.debTitle}>Salud y Electrónica: categorías críticas</Text>
                  <Text style={s.debDesc}>
                    Concentran más de 4,000 alertas combinadas. Posibles campañas de fraude organizadas.
                  </Text>
                </View>
              </View>

              {/* Metricas de Alertas y Monto */}
              <View style={s.debMetricsRow}>
                <View style={s.debMetricItem}>
                  <Ionicons name="alert-circle-outline" size={14} color="#737781" />
                  <Text style={s.debMetricText}>4150 alertas</Text>
                </View>
                <View style={s.debMetricItem}>
                  <Ionicons name="cash-outline" size={14} color="#ba1a1a" />
                  <Text style={s.debMetricTextCritical}>{hideAmounts ? '••••••••' : '$38.2M MXN'}</Text>
                </View>
              </View>

              {/* Botón Acordeón */}
              <TouchableOpacity
                style={s.accordionBtn}
                onPress={() => setExpandedDebId(expandedDebId === 2 ? null : 2)}
              >
                <Text style={s.accordionBtnText}>
                  {expandedDebId === 2 ? 'Ocultar solución' : 'Ver solución completa'}
                </Text>
                <Ionicons
                  name={expandedDebId === 2 ? 'chevron-up' : 'chevron-down'}
                  size={16}
                  color="#004481"
                />
              </TouchableOpacity>

              {/* Acordeón Desplegable */}
              {expandedDebId === 2 && (
                <View style={s.accordionContent}>
                  <Text style={s.mitigationTitle}>Plan de Mitigación Sugerido</Text>
                  <View style={s.mitigationItem}>
                    <Text style={s.mitigationDot}>•</Text>
                    <Text style={s.mitigationText}>Restringir temporalmente transacciones en e-commerce sin soporte 3D Secure (3DS).</Text>
                  </View>
                  <View style={s.mitigationItem}>
                    <Text style={s.mitigationDot}>•</Text>
                    <Text style={s.mitigationText}>Bloqueo temporal preventivo para cuentas con compras repetitivas en farmacias virtuales.</Text>
                  </View>
                  <View style={s.mitigationItem}>
                    <Text style={s.mitigationDot}>•</Text>
                    <Text style={s.mitigationText}>Establecer alertas vía Push/SMS para compras mayores a $2,000 MXN en estas categorías.</Text>
                  </View>
                </View>
              )}
            </View>

            {/* Tarjeta Debilidad 3: Cobros Excedentes */}
            <View style={s.debDetailCard}>
              <View style={s.debHeaderRow}>
                <View style={[s.debDetailIconBox, { backgroundColor: '#fff7e6' }]}>
                  <Ionicons name="business-outline" size={24} color="#fbbd08" />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={s.badgeMedia}>
                    <Text style={s.badgeMediaText}>MEDIA</Text>
                  </View>
                  <Text style={s.debTitle}>Cobros excediendo límite legal</Text>
                  <Text style={s.debDesc}>
                    1,847 registros superan el tope regulatorio de comisiones establecido por Banxico.
                  </Text>
                </View>
              </View>

              {/* Metricas de Alertas y Monto */}
              <View style={s.debMetricsRow}>
                <View style={s.debMetricItem}>
                  <Ionicons name="alert-circle-outline" size={14} color="#737781" />
                  <Text style={s.debMetricText}>1847 alertas</Text>
                </View>
                <View style={s.debMetricItem}>
                  <Ionicons name="cash-outline" size={14} color="#ba1a1a" />
                  <Text style={s.debMetricTextCritical}>{hideAmounts ? '••••••••' : '$12.4M MXN'}</Text>
                </View>
              </View>

              {/* Botón Acordeón */}
              <TouchableOpacity
                style={s.accordionBtn}
                onPress={() => setExpandedDebId(expandedDebId === 3 ? null : 3)}
              >
                <Text style={s.accordionBtnText}>
                  {expandedDebId === 3 ? 'Ocultar solución' : 'Ver solución completa'}
                </Text>
                <Ionicons
                  name={expandedDebId === 3 ? 'chevron-up' : 'chevron-down'}
                  size={16}
                  color="#004481"
                />
              </TouchableOpacity>

              {/* Acordeón Desplegable */}
              {expandedDebId === 3 && (
                <View style={s.accordionContent}>
                  <Text style={s.mitigationTitle}>Plan de Mitigación Sugerido</Text>
                  <View style={s.mitigationItem}>
                    <Text style={s.mitigationDot}>•</Text>
                    <Text style={s.mitigationText}>Ajustar de forma inmediata los topes máximos de comisiones en el Core bancario.</Text>
                  </View>
                  <View style={s.mitigationItem}>
                    <Text style={s.mitigationDot}>•</Text>
                    <Text style={s.mitigationText}>Ejecutar auditoría retrospectiva automatizada para el reembolso de cobros excedidos.</Text>
                  </View>
                </View>
              )}
            </View>

            {/* Botón de logout al final */}
            <TouchableOpacity onPress={handleLogout} style={s.logoutBtn}>
              <Text style={s.logoutBtnTxt}>Cerrar Sesión del Sistema</Text>
            </TouchableOpacity>
          </ScrollView>
        )}
      </View>

      {/* ── 3. Barra de Navegación Inferior (Bottom Tab Bar) ── */}
      <View style={s.tabBar}>
        {/* Pestaña: Inicio */}
        <TouchableOpacity style={s.tabItem} onPress={() => setActiveTab('Inicio')}>
          <Ionicons
            name={activeTab === 'Inicio' ? 'home' : 'home-outline'}
            size={22}
            color={activeTab === 'Inicio' ? '#004481' : '#737781'}
          />
          <Text style={[s.tabLabel, { color: activeTab === 'Inicio' ? '#004481' : '#737781' }]}>
            Inicio
          </Text>
        </TouchableOpacity>

        {/* Pestaña: KPIs */}
        <TouchableOpacity style={s.tabItem} onPress={() => setActiveTab('KPIs')}>
          <Ionicons
            name={activeTab === 'KPIs' ? 'bar-chart' : 'bar-chart-outline'}
            size={22}
            color={activeTab === 'KPIs' ? '#004481' : '#737781'}
          />
          <Text style={[s.tabLabel, { color: activeTab === 'KPIs' ? '#004481' : '#737781' }]}>
            KPIs
          </Text>
        </TouchableOpacity>

        {/* Pestaña: Reportes */}
        <TouchableOpacity style={s.tabItem} onPress={() => setActiveTab('Reportes')}>
          <Ionicons
            name={activeTab === 'Reportes' ? 'document-text' : 'document-text-outline'}
            size={22}
            color={activeTab === 'Reportes' ? '#004481' : '#737781'}
          />
          <Text style={[s.tabLabel, { color: activeTab === 'Reportes' ? '#004481' : '#737781' }]}>
            Reportes
          </Text>
        </TouchableOpacity>

        {/* Pestaña: Debilidades (Con alerta/badge flotante '3') */}
        <TouchableOpacity style={s.tabItem} onPress={() => setActiveTab('Debilidades')}>
          <View>
            <Ionicons
              name={activeTab === 'Debilidades' ? 'warning' : 'warning-outline'}
              size={22}
              color={activeTab === 'Debilidades' ? '#004481' : '#737781'}
            />
            {/* Globo de alerta rojo con el número 3 */}
            <View style={s.badgeBadge}>
              <Text style={s.badgeBadgeTxt}>3</Text>
            </View>
          </View>
          <Text style={[s.tabLabel, { color: activeTab === 'Debilidades' ? '#004481' : '#737781' }]}>
            Debilidades
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── Hojas de Estilos de Alta Fidelidad ───────────────────────
const s = StyleSheet.create({
  root:          { flex: 1, backgroundColor: '#f4f6fa' },

  // Cabecera
  header:        { height: 60, backgroundColor: '#ffffff', flexDirection: 'row',
                   justifyContent: 'space-between', alignItems: 'center',
                   paddingHorizontal: 16, borderBottomWidth: 1,
                   borderBottomColor: 'rgba(194,198,210,0.3)',
                   shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
                   shadowOpacity: 0.03, shadowRadius: 3, elevation: 1 },
  headerBtn:   { padding: 8 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#004481', letterSpacing: 0.8 },

  // Scroll Body
  scrollBody:    { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 24 },

  // Banner saludo
  bannerCard:    { backgroundColor: '#004481', borderRadius: 16, padding: 20,
                   marginBottom: 20, shadowColor: '#004481',
                   shadowOffset: { width: 0, height: 4 },
                   shadowOpacity: 0.15, shadowRadius: 10, elevation: 4 },
  bannerTitle:   { fontSize: 26, fontWeight: '700', color: '#ffffff', marginBottom: 4 },
  bannerSub:     { fontSize: 14, color: 'rgba(255,255,255,0.8)', fontWeight: '500' },

  // Grid KPIs
  kpiGrid:       { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between',
                   gap: 12, marginBottom: 24 },
  kpiCard:       { backgroundColor: '#ffffff', borderRadius: 16, padding: 16,
                   width: (width - 44) / 2, borderWidth: 1,
                   borderColor: 'rgba(194,198,210,0.4)', shadowColor: '#000',
                   shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04,
                   shadowRadius: 6, elevation: 2 },
  kpiHeaderRow:  { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  iconWrapper:   { width: 36, height: 36, borderRadius: 18, backgroundColor: '#e8effa',
                   alignItems: 'center', justifyContent: 'center' },
  kpiValue:      { fontSize: 22, fontWeight: '800', color: '#1a1c1c', marginBottom: 4 },
  kpiLabel:      { fontSize: 12, fontWeight: '600', color: '#737781', marginBottom: 8 },
  trendRow:      { flexDirection: 'row', alignItems: 'center', gap: 4 },
  trendText:     { fontSize: 11, fontWeight: '700' },

  // Sección Titulos
  sectionTitle:  { fontSize: 20, fontWeight: '800', color: '#002e5a',
                   marginTop: 12, marginBottom: 16, letterSpacing: 0.2 },

  // Carrusel
  carousel:      { marginBottom: 24 },
  carouselCard:  { backgroundColor: '#ffffff', borderRadius: 16, padding: 20,
                   width: width - 52, marginRight: 16, borderWidth: 1,
                   borderColor: 'rgba(194,198,210,0.4)', shadowColor: '#000',
                   shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04,
                   shadowRadius: 6, elevation: 2 },
  carouselTitle: { fontSize: 16, fontWeight: '700', color: '#1a1c1c', marginBottom: 2 },
  carouselSub:   { fontSize: 12, color: '#737781', marginBottom: 12 },

  // Categorías Críticas dentro de carrusel
  critList:      { gap: 12, marginTop: 4 },
  critItem:      { gap: 6 },
  critLabelRow:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  critName:      { fontSize: 13, fontWeight: '600', color: '#1a1c1c' },
  critCount:     { fontSize: 12, fontWeight: '700', color: '#737781' },
  barBg:         { height: 6, backgroundColor: '#f0f2f5', borderRadius: 3, overflow: 'hidden' },
  barFill:       { height: 6, borderRadius: 3 },

  // Tarjetas Debilidades
  debCard:       { backgroundColor: '#ffffff', borderRadius: 16, padding: 16,
                   flexDirection: 'row', gap: 14, marginBottom: 16, borderWidth: 1,
                   borderColor: 'rgba(194,198,210,0.4)', shadowColor: '#000',
                   shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04,
                   shadowRadius: 6, elevation: 2 },
  debIconBox:    { width: 44, height: 44, borderRadius: 22, backgroundColor: '#fbebeb',
                   alignItems: 'center', justifyContent: 'center' },
  debBody:       { flex: 1, alignItems: 'flex-start' },
  badge:         { backgroundColor: '#ba1a1a', borderRadius: 10,
                   paddingHorizontal: 8, paddingVertical: 2, marginBottom: 8 },
  badgeText:     { fontSize: 10, fontWeight: '800', color: '#ffffff', letterSpacing: 0.5 },
  debTitle:      { fontSize: 15, fontWeight: '700', color: '#1a1c1c', marginBottom: 6,
                   lineHeight: 20 },
  debDesc:       { fontSize: 13, color: '#5d5f5f', lineHeight: 18, marginBottom: 10 },
  solLink:       { flexDirection: 'row', alignItems: 'center', gap: 4 },
  solLinkTxt:    { fontSize: 13, fontWeight: '700', color: '#004481' },

  // Barra de Navegación Inferior
  tabBar:        { height: 62, backgroundColor: '#ffffff', flexDirection: 'row',
                   justifyContent: 'space-around', alignItems: 'center',
                   borderTopWidth: 1, borderTopColor: 'rgba(194,198,210,0.3)',
                   shadowColor: '#000', shadowOffset: { width: 0, height: -2 },
                   shadowOpacity: 0.03, shadowRadius: 3, elevation: 5 },
  tabItem:       { alignItems: 'center', justifyContent: 'center', paddingVertical: 4 },
  tabLabel:      { fontSize: 10, fontWeight: '600', marginTop: 4 },
  badgeBadge:    { position: 'absolute', right: -6, top: -4, backgroundColor: '#ba1a1a',
                   borderRadius: 8, minWidth: 16, height: 16,
                   alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 },
  badgeBadgeTxt: { color: '#ffffff', fontSize: 9, fontWeight: '800' },

  // Otros Tabs
  tabMainTitle:  { fontSize: 24, fontWeight: '800', color: '#002e5a', marginBottom: 6 },
  tabSubtitle:   { fontSize: 14, color: '#5d5f5f', lineHeight: 20, marginBottom: 20 },

  metricPanel:   { backgroundColor: '#ffffff', borderRadius: 16, padding: 20,
                   borderWidth: 1, borderColor: 'rgba(194,198,210,0.4)', marginBottom: 20 },
  panelTitle:    { fontSize: 16, fontWeight: '700', color: '#1a1c1c' },
  dummyChart:    { height: 180, backgroundColor: '#f4f6fa', borderRadius: 12,
                   justifyContent: 'center', alignItems: 'center', marginVertical: 16, gap: 10 },
  dummyText:     { fontSize: 12, color: '#737781', fontWeight: '600', textAlign: 'center' },

  actionBtn:     { backgroundColor: '#004481', borderRadius: 12, paddingVertical: 16,
                   alignItems: 'center', justifyContent: 'center' },
  actionBtnTxt:  { color: '#ffffff', fontSize: 14, fontWeight: '700' },

  // Reportes
  reportItem:    { backgroundColor: '#ffffff', borderRadius: 16, padding: 16,
                   flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 12,
                   borderWidth: 1, borderColor: 'rgba(194,198,210,0.4)' },
  reportTitle:   { fontSize: 14, fontWeight: '700', color: '#1a1c1c', marginBottom: 2 },
  reportDate:    { fontSize: 12, color: '#737781' },
  downloadBtn:   { width: 36, height: 36, borderRadius: 18, backgroundColor: '#e8effa',
                   alignItems: 'center', justifyContent: 'center' },

  // Alertas / Mitigaciones
  alertDetailBox: { backgroundColor: '#ffffff', borderRadius: 16, padding: 20,
                    borderLeftWidth: 5, marginBottom: 16, shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04,
                    shadowRadius: 6, elevation: 2 },
  alertHeader:    { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  alertBoxTitle:  { fontSize: 15, fontWeight: '700', color: '#1a1c1c' },
  alertBoxDesc:   { fontSize: 13, color: '#5d5f5f', lineHeight: 18, marginBottom: 14 },
  solutionHeader: { fontSize: 13, fontWeight: '700', color: '#1a1c1c', marginBottom: 6 },
  solutionPoint:  { fontSize: 12, color: '#5d5f5f', lineHeight: 18, paddingLeft: 6 },

  logoutBtn:      { borderWidth: 2, borderColor: '#ba1a1a', borderRadius: 12,
                    paddingVertical: 16, alignItems: 'center', justifyContent: 'center',
                    marginTop: 24 },
  logoutBtnTxt:   { color: '#ba1a1a', fontSize: 14, fontWeight: '700' },

  // Estilos Pestaña KPIs
  sectionHeader:  { fontSize: 12, fontWeight: '800', color: '#737781', letterSpacing: 1.5, marginTop: 24, marginBottom: 12 },
  kpiDetailCard:  { backgroundColor: '#ffffff', borderRadius: 16, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(194,198,210,0.4)', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  cardTitle:      { fontSize: 16, fontWeight: '700', color: '#1a1c1c', marginBottom: 2 },
  cardSubtitle:   { fontSize: 12, color: '#737781', marginBottom: 12 },
  detailLink:     { marginTop: 12, alignSelf: 'flex-start' },
  detailLinkTxt:  { fontSize: 13, fontWeight: '700', color: '#004481' },
  barChartContainer: { gap: 10, marginVertical: 8 },
  barChartRow:    { flexDirection: 'row', alignItems: 'center', gap: 12 },
  barChartLabel:  { width: 90, fontSize: 13, fontWeight: '600', color: '#5d5f5f', textAlign: 'right' },
  barChartFillWrapper: { flex: 1, height: 10, backgroundColor: '#f0f2f5', borderRadius: 5, overflow: 'hidden' },
  barChartFill:   { height: 10, borderRadius: 5 },
  sideBySideRow:  { flexDirection: 'row', justifyContent: 'space-between', gap: 12, marginBottom: 16 },
  halfCard:       { flex: 1, backgroundColor: '#ffffff', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: 'rgba(194,198,210,0.4)', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  halfCardTitle:  { fontSize: 14, fontWeight: '700', color: '#1a1c1c', marginBottom: 8, textAlign: 'center' },

  // Estilos Pestaña Reportes
  reportHeroCard: { backgroundColor: '#004481', borderRadius: 16, padding: 20, marginBottom: 24, shadowColor: '#004481', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 10, elevation: 4 },
  heroTitle:      { fontSize: 20, fontWeight: '700', color: '#ffffff', marginBottom: 4 },
  heroSubtitle:   { fontSize: 13, color: 'rgba(255,255,255,0.7)', fontWeight: '600', marginBottom: 12 },
  heroDesc:       { fontSize: 13, color: '#ffffff', lineHeight: 18, marginBottom: 20, opacity: 0.9 },
  heroBtn:        { backgroundColor: '#ffffff', borderRadius: 24, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  heroBtnTxt:     { color: '#004481', fontSize: 14, fontWeight: '700' },
  heroTagRow:     { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  heroTag:        { backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  heroTagTxt:     { color: '#ffffff', fontSize: 10, fontWeight: '600' },
  repListItem:    { backgroundColor: '#ffffff', borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(194,198,210,0.4)', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  pdfIconContainer: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#fbebeb', alignItems: 'center', justifyContent: 'center' },
  repFileName:    { fontSize: 14, fontWeight: '700', color: '#1a1c1c', marginBottom: 2 },
  repSubText:     { fontSize: 12, color: '#737781' },
  repDownloadBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#e8effa', alignItems: 'center', justifyContent: 'center' },
  customizeCard:  { backgroundColor: '#ffffff', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: 'rgba(194,198,210,0.4)', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  customRow:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(194,198,210,0.2)' },
  customRowLabel: { fontSize: 14, fontWeight: '600', color: '#1a1c1c' },

  // Estilos Pestaña Debilidades
  alertBanner:    { borderRadius: 16, padding: 20, marginBottom: 24, shadowColor: '#ba1a1a', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 10, elevation: 4 },
  alertBannerHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  alertBannerText: { color: '#ffffff', fontSize: 14, fontWeight: '700' },
  alertBannerAmount: { color: '#ffffff', fontSize: 22, fontWeight: '800' },
  debDetailCard:  { backgroundColor: '#ffffff', borderRadius: 16, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(194,198,210,0.4)', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  debHeaderRow:   { flexDirection: 'row', gap: 14 },
  badgeMedia:     { backgroundColor: '#fbbd08', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2, marginBottom: 8, alignSelf: 'flex-start' },
  badgeMediaText: { fontSize: 10, fontWeight: '800', color: '#ffffff', letterSpacing: 0.5 },
  debDetailIconBox: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  debMetricsRow:  { flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 12, marginBottom: 8, paddingLeft: 58 },
  debMetricItem:  { flexDirection: 'row', alignItems: 'center', gap: 4 },
  debMetricText:  { fontSize: 12, fontWeight: '600', color: '#737781' },
  debMetricTextCritical: { fontSize: 12, fontWeight: '700', color: '#ba1a1a' },
  accordionBtn:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, backgroundColor: '#f0f2f5', borderRadius: 20, paddingVertical: 10, marginTop: 12 },
  accordionBtnText: { fontSize: 13, fontWeight: '700', color: '#004481' },
  accordionContent: { marginTop: 12, backgroundColor: '#f8fafc', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#e2e8f0', gap: 10 },
  mitigationTitle: { fontSize: 13, fontWeight: '700', color: '#1e293b', borderBottomWidth: 1, borderBottomColor: '#cbd5e1', paddingBottom: 4 },
  mitigationItem: { flexDirection: 'row', gap: 6, alignItems: 'flex-start' },
  mitigationDot:  { fontSize: 12, color: '#ba1a1a', fontWeight: '800', marginTop: -2 },
  mitigationText: { fontSize: 12, color: '#475569', lineHeight: 18, flex: 1 },
});