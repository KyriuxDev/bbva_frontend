import React, { useState, useRef } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, Dimensions, StatusBar, Animated, Switch, ActivityIndicator, Alert,
} from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle, G, Path, Line, Text as TextSvg, Polyline } from 'react-native-svg';
import { useQuery } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/src/store/auth.store';
import { dashboardService } from '@/src/features/dashboard/dashboard.service';
import type { FraudePorMes, Solucion } from '@/src/features/dashboard/dashboard.types';

const { width } = Dimensions.get('window');

// ── Helpers de formato ────────────────────────────────────────
const fmt    = (n: number) => Math.round(n).toLocaleString('es-MX');
const fmtMXN = (n: number) => {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B MXN`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M MXN`;
  return `$${fmt(n)} MXN`;
};

// ── Colores por canal ─────────────────────────────────────────
const CANAL_COLORS: Record<string, string> = {
  App:        '#004481',
  Cajero:     '#007dd6',
  POS:        '#00a86b',
  Web:        '#fbbd08',
  Ventanilla: '#ba1a1a',
};

// ── Iconos y colores por área de debilidad ───────────────────
const AREA_ICONS: Record<string, string> = {
  Seguridad:    'shield-outline',
  Cumplimiento: 'business-outline',
  Retención:    'people-outline',
  Cartera:      'card-outline',
  Ahorro:       'wallet-outline',
};
const PRIORIDAD_COLOR: Record<string, string> = {
  Alta:  '#ba1a1a',
  Media: '#fbbd08',
  Baja:  '#00a278',
};

// ── Gráfico de Dona ───────────────────────────────────────────
interface Segment { percentage: number; color: string; label: string }

function DonutChart({ segments }: { segments: Segment[] }) {
  const radius = 55, strokeWidth = 24;
  const circumference = 2 * Math.PI * radius;
  const center = 100;
  let acc = 0;

  return (
    <View style={dc.container}>
      <Svg width={200} height={200} viewBox="0 0 200 200">
        <G transform="rotate(-90 100 100)">
          <Circle cx={center} cy={center} r={radius}
            stroke="#f0f2f5" strokeWidth={strokeWidth} fill="transparent" />
          {segments.map((seg, idx) => {
            const len    = (seg.percentage / 100) * circumference;
            const offset = circumference - (acc / 100) * circumference;
            acc += seg.percentage;
            return (
              <Circle key={idx} cx={center} cy={center} r={radius}
                stroke={seg.color} strokeWidth={strokeWidth}
                strokeDasharray={`${len} ${circumference}`}
                strokeDashoffset={offset} strokeLinecap="butt" fill="transparent" />
            );
          })}
        </G>
      </Svg>
      <View style={dc.legendGrid}>
        {segments.slice(0, 4).map((seg, idx) => (
          <View key={idx} style={dc.legendItem}>
            <View style={[dc.dot, { backgroundColor: seg.color }]} />
            <Text style={dc.legendText}>{seg.label} {seg.percentage}%</Text>
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

// ── Mini Donut ────────────────────────────────────────────────
function MiniDonutChart({ segments }: { segments: Segment[] }) {
  const radius = 26, strokeWidth = 10;
  const circumference = 2 * Math.PI * radius;
  const center = 40;
  let acc = 0;

  return (
    <View style={mdc.container}>
      <Svg width={80} height={80} viewBox="0 0 80 80">
        <G transform="rotate(-90 40 40)">
          <Circle cx={center} cy={center} r={radius}
            stroke="#f0f2f5" strokeWidth={strokeWidth} fill="transparent" />
          {segments.map((seg, idx) => {
            const len    = (seg.percentage / 100) * circumference;
            const offset = circumference - (acc / 100) * circumference;
            acc += seg.percentage;
            return (
              <Circle key={idx} cx={center} cy={center} r={radius}
                stroke={seg.color} strokeWidth={strokeWidth}
                strokeDasharray={`${len} ${circumference}`}
                strokeDashoffset={offset} strokeLinecap="butt" fill="transparent" />
            );
          })}
        </G>
      </Svg>
      <View style={mdc.legendGrid}>
        {segments.map((seg, idx) => (
          <View key={idx} style={mdc.legendItem}>
            <View style={[mdc.dot, { backgroundColor: seg.color }]} />
            <Text style={mdc.legendText}>{seg.label} {seg.percentage}%</Text>
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

// ── Gráfico de línea dinámico ─────────────────────────────────
function buildPoints(data: FraudePorMes[]): string {
  if (!data.length) return '';
  const xStart = 40, xEnd = 310, yTop = 15, yBottom = 125;
  const counts = data.map(d => d.total_fraudes);
  const minVal = Math.min(...counts);
  const maxVal = Math.max(...counts);
  const xStep  = (xEnd - xStart) / Math.max(data.length - 1, 1);
  return data.map((d, i) => {
    const x = xStart + i * xStep;
    const norm = maxVal === minVal ? 0.5 : (d.total_fraudes - minVal) / (maxVal - minVal);
    const y = yBottom - norm * (yBottom - yTop);
    return `${x.toFixed(0)},${y.toFixed(0)}`;
  }).join(' ');
}

function FraudLineChart({ data }: { data: FraudePorMes[] }) {
  if (!data.length) return null;
  const counts  = data.map(d => d.total_fraudes);
  const minVal  = Math.min(...counts);
  const maxVal  = Math.max(...counts);
  const step    = (maxVal - minVal) / 4;
  const yLabels = [maxVal, maxVal - step, maxVal - 2 * step, maxVal - 3 * step, minVal];
  const firstM  = data[0]?.año_mes ?? '';
  const midM    = data[Math.floor(data.length / 2)]?.año_mes ?? '';
  const lastM   = data[data.length - 1]?.año_mes ?? '';

  return (
    <View style={{ height: 160, marginVertical: 12, alignItems: 'center' }}>
      <Svg width={width - 64} height={150} viewBox="0 0 320 150">
        {[15, 42.5, 70, 97.5, 125].map((y, i) => (
          <React.Fragment key={i}>
            <Line x1="40" y1={y} x2="310" y2={y} stroke="#e2e6ed" strokeDasharray="3 3" />
            <TextSvg x="2" y={y + 4} fontSize="9" fill="#737781" fontWeight="600">
              {Math.round(yLabels[i]).toLocaleString()}
            </TextSvg>
          </React.Fragment>
        ))}
        <Polyline fill="none" stroke="#004481" strokeWidth="2" points={buildPoints(data)} />
        <TextSvg x="35"  y="142" fontSize="7" fill="#737781" fontWeight="600">{firstM}</TextSvg>
        <TextSvg x="145" y="142" fontSize="7" fill="#737781" fontWeight="600">{midM}</TextSvg>
        <TextSvg x="265" y="142" fontSize="7" fill="#737781" fontWeight="600">{lastM}</TextSvg>
      </Svg>
    </View>
  );
}

// ── Tarjeta de debilidad dinámica ─────────────────────────────
function DebCardDetalle({
  sol, idx, expandedId, setExpandedId, hideAmounts,
}: {
  sol: Solucion; idx: number;
  expandedId: number | null; setExpandedId: (v: number | null) => void;
  hideAmounts: boolean;
}) {
  const icon  = AREA_ICONS[sol.area]  ?? 'alert-circle-outline';
  const color = PRIORIDAD_COLOR[sol.prioridad] ?? '#737781';
  const bg    = sol.prioridad === 'Alta' ? '#fbebeb' : sol.prioridad === 'Media' ? '#fff7e6' : '#e6f7f0';

  return (
    <View style={s.debDetailCard}>
      <View style={s.debHeaderRow}>
        <View style={[s.debDetailIconBox, { backgroundColor: bg }]}>
          <Ionicons name={icon as any} size={24} color={color} />
        </View>
        <View style={{ flex: 1 }}>
          <View style={[s.badge, { backgroundColor: color }]}>
            <Text style={s.badgeText}>{sol.prioridad.toUpperCase()}</Text>
          </View>
          <Text style={s.debTitle}>{sol.problema}</Text>
        </View>
      </View>

      <TouchableOpacity
        style={s.accordionBtn}
        onPress={() => setExpandedId(expandedId === idx ? null : idx)}
      >
        <Text style={s.accordionBtnText}>
          {expandedId === idx ? 'Ocultar solución' : 'Ver solución completa'}
        </Text>
        <Ionicons name={expandedId === idx ? 'chevron-up' : 'chevron-down'} size={16} color="#004481" />
      </TouchableOpacity>

      {expandedId === idx && (
        <View style={s.accordionContent}>
          <Text style={s.mitigationTitle}>Plan de Mitigación Sugerido</Text>
          <View style={s.mitigationItem}>
            <Text style={s.mitigationDot}>•</Text>
            <Text style={s.mitigationText}>{sol.solucion}</Text>
          </View>
        </View>
      )}
    </View>
  );
}

// ── Pantalla principal ────────────────────────────────────────
export default function Dashboard() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const logout = useAuthStore((s) => s.logout);

  const [activeTab, setActiveTab] = useState<'Inicio' | 'KPIs' | 'Reportes' | 'Debilidades'>('Inicio');
  const [hideAmounts, setHideAmounts] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [reportHistory, setReportHistory] = useState<{ name: string; date: string; uri: string }[]>([]);
  const [incKpi, setIncKpi]   = useState(true);
  const [incFraud, setIncFraud] = useState(true);
  const [incDeb, setIncDeb]   = useState(true);
  const [incRec, setIncRec]   = useState(true);
  const [incGraph, setIncGraph] = useState(true);
  const [expandedDebId, setExpandedDebId] = useState<number | null>(null);

  // ── Queries ──────────────────────────────────────────────────
  const { data: kpisResumen } = useQuery({
    queryKey: ['kpis-resumen'],
    queryFn:  dashboardService.getKpisResumen,
  });

  const { data: etlResumen } = useQuery({
    queryKey: ['etl-resumen'],
    queryFn:  dashboardService.getEtlResumen,
  });

  const { data: fraudePorCanal = [] } = useQuery({
    queryKey: ['fraude-canal'],
    queryFn:  dashboardService.getFraudePorCanal,
  });

  const { data: fraudePorCategoria = [] } = useQuery({
    queryKey: ['fraude-categoria'],
    queryFn:  dashboardService.getFraudePorCategoria,
  });

  const { data: fraudePorMes = [] } = useQuery({
    queryKey: ['fraude-mes'],
    queryFn:  dashboardService.getFraudePorMes,
  });

  const { data: debilidadesData } = useQuery({
    queryKey: ['debilidades'],
    queryFn:  dashboardService.getDebilidades,
  });

  // ── Datos derivados ──────────────────────────────────────────
  const donutData: Segment[] = fraudePorCanal.map(d => ({
    percentage: Math.round(d.porcentaje * 10) / 10,
    color: CANAL_COLORS[d.canal] ?? '#737781',
    label: d.canal,
  }));

  const maxFraudes = Math.max(...fraudePorCategoria.map(d => d.total_fraudes), 1);

  const soluciones = debilidadesData?.soluciones ?? [];
  const altaCount  = soluciones.filter(s => s.prioridad === 'Alta').length;

  const handleDownloadPDF = async () => {
    try {
      setDownloading(true);
      const token    = useAuthStore.getState().accessToken;
      const fileName = `reporte-bbva-${Date.now()}.pdf`;
      const fileUri  = FileSystem.documentDirectory + fileName;

      const params = new URLSearchParams({
        kpis:            String(incKpi),
        fraude:          String(incFraud),
        debilidades:     String(incDeb),
        recomendaciones: String(incRec),
        graficas:        String(incGraph),
      });

      const result = await FileSystem.downloadAsync(
        `${process.env.EXPO_PUBLIC_API_URL}/reportes/kpis?${params}`,
        fileUri,
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (result.status === 200) {
        // Agregar a historial
        const fecha = new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
        setReportHistory(prev => [{ name: fileName, date: fecha, uri: result.uri }, ...prev]);

        const canShare = await Sharing.isAvailableAsync();
        if (canShare) {
          await Sharing.shareAsync(result.uri, {
            mimeType: 'application/pdf',
            dialogTitle: 'Reporte BBVA KPIs',
          });
        } else {
          Alert.alert('Descargado', `PDF guardado en: ${result.uri}`);
        }
      } else {
        Alert.alert('Error', 'El servidor no pudo generar el reporte.');
      }
    } catch (e) {
      Alert.alert('Error', 'No se pudo descargar el reporte. Verifica la conexión.');
    } finally {
      setDownloading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/(auth)/welcome');
  };

  // ── Placeholder mientras carga ───────────────────────────────
  const val = (v: string | number | undefined, placeholder = '...') =>
    v !== undefined ? String(v) : placeholder;

  return (
    <View style={[s.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {/* ── Header ── */}
      <View style={s.header}>
        <TouchableOpacity style={s.headerBtn} onPress={() => setHideAmounts(!hideAmounts)}>
          <Ionicons name={hideAmounts ? 'eye-off-outline' : 'eye-outline'} size={24} color="#004481" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>BBVA</Text>
        <TouchableOpacity style={s.headerBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={24} color="#004481" />
        </TouchableOpacity>
      </View>

      {/* ── Contenido por pestaña ── */}
      <View style={{ flex: 1 }}>

        {/* ─── Inicio ─── */}
        {activeTab === 'Inicio' && (
          <ScrollView style={s.scrollBody} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
            <View style={s.bannerCard}>
              <Text style={s.bannerTitle}>Hola, Admin</Text>
              <Text style={s.bannerSub}>Panel de análisis BBVA</Text>
            </View>

            {/* KPIs 2x2 */}
            <View style={s.kpiGrid}>
              <View style={s.kpiCard}>
                <View style={s.kpiHeaderRow}>
                  <View style={s.iconWrapper}><Ionicons name="people-outline" size={20} color="#004481" /></View>
                </View>
                <Text style={s.kpiValue}>
                  {hideAmounts ? '•••••' : val(kpisResumen && fmt(kpisResumen.totalClientes))}
                </Text>
                <Text style={s.kpiLabel}>Total Clientes</Text>
                <View style={s.trendRow}>
                  <Ionicons name="trending-up" size={14} color="#00a278" />
                  <Text style={[s.trendText, { color: '#00a278' }]}>Activos</Text>
                </View>
              </View>

              <View style={s.kpiCard}>
                <View style={s.kpiHeaderRow}>
                  <View style={s.iconWrapper}><Ionicons name="cash-outline" size={20} color="#004481" /></View>
                </View>
                <Text style={s.kpiValue}>
                  {hideAmounts ? '••••••••' : val(kpisResumen && fmtMXN(kpisResumen.saldoTotalCuentas))}
                </Text>
                <Text style={s.kpiLabel}>Saldo Total</Text>
                <View style={s.trendRow}>
                  <Ionicons name="trending-up" size={14} color="#00a278" />
                  <Text style={[s.trendText, { color: '#00a278' }]}>Cuentas activas</Text>
                </View>
              </View>

              <View style={s.kpiCard}>
                <View style={s.kpiHeaderRow}>
                  <View style={s.iconWrapper}><Ionicons name="shield-outline" size={20} color="#004481" /></View>
                </View>
                <Text style={s.kpiValue}>
                  {hideAmounts ? '•••••' : val(kpisResumen && fmt(kpisResumen.fraudesPotenciales))}
                </Text>
                <Text style={s.kpiLabel}>Alertas Fraude</Text>
                <View style={s.trendRow}>
                  <Ionicons name="trending-down" size={14} color="#ba1a1a" />
                  <Text style={[s.trendText, { color: '#ba1a1a' }]}>Potenciales</Text>
                </View>
              </View>

              <View style={s.kpiCard}>
                <View style={s.kpiHeaderRow}>
                  <View style={s.iconWrapper}><Ionicons name="card-outline" size={20} color="#004481" /></View>
                </View>
                <Text style={s.kpiValue}>
                  {hideAmounts ? '••••' : val(kpisResumen && fmt(kpisResumen.cobrosExcedidos))}
                </Text>
                <Text style={s.kpiLabel}>Cobros Excedidos</Text>
                <View style={s.trendRow}>
                  <Ionicons name="alert-circle-outline" size={14} color="#fbbd08" />
                  <Text style={[s.trendText, { color: '#fbbd08' }]}>Exceden límite</Text>
                </View>
              </View>
            </View>

            {/* Carrusel */}
            <Text style={s.sectionTitle}>Análisis rápido</Text>
            <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false}
              style={s.carousel} contentContainerStyle={{ paddingRight: 20 }}>

              {/* Donut — Fraude por canal */}
              <View style={s.carouselCard}>
                <Text style={s.carouselTitle}>Fraude por canal</Text>
                <Text style={s.carouselSub}>Distribución porcentual</Text>
                {donutData.length > 0
                  ? <DonutChart segments={donutData} />
                  : <ActivityIndicator color="#004481" style={{ marginVertical: 40 }} />
                }
              </View>

              {/* Top 3 categorías */}
              <View style={s.carouselCard}>
                <Text style={s.carouselTitle}>Top Categorías</Text>
                <Text style={s.carouselSub}>Mayor número de fraudes</Text>
                <View style={s.critList}>
                  {fraudePorCategoria.slice(0, 3).map((item, idx) => {
                    const colors = ['#ba1a1a', '#fbbd08', '#00a86b'];
                    const pct = Math.round((item.total_fraudes / maxFraudes) * 100);
                    return (
                      <View key={idx} style={s.critItem}>
                        <View style={s.critLabelRow}>
                          <Text style={s.critName}>{item.categoria}</Text>
                          <Text style={s.critCount}>
                            {hideAmounts ? '••••' : fmt(item.total_fraudes)}
                          </Text>
                        </View>
                        <View style={s.barBg}>
                          <View style={[s.barFill, { width: `${pct}%`, backgroundColor: colors[idx] }]} />
                        </View>
                      </View>
                    );
                  })}
                  {fraudePorCategoria.length === 0 && (
                    <ActivityIndicator color="#004481" style={{ marginVertical: 20 }} />
                  )}
                </View>
              </View>
            </ScrollView>

            {/* Debilidades detectadas (top 2) */}
            <Text style={s.sectionTitle}>Debilidades detectadas</Text>
            {soluciones.slice(0, 2).map((sol, idx) => (
              <View key={idx} style={s.debCard}>
                <View style={s.debIconBox}>
                  <Ionicons name={(AREA_ICONS[sol.area] ?? 'alert-circle-outline') as any}
                    size={24} color="#ba1a1a" />
                </View>
                <View style={s.debBody}>
                  <View style={[s.badge, { backgroundColor: PRIORIDAD_COLOR[sol.prioridad] }]}>
                    <Text style={s.badgeText}>{sol.prioridad.toUpperCase()}</Text>
                  </View>
                  <Text style={s.debTitle}>{sol.problema}</Text>
                  <Text style={s.debDesc}>{sol.solucion}</Text>
                  <TouchableOpacity style={s.solLink} onPress={() => setActiveTab('Debilidades')}>
                    <Text style={s.solLinkTxt}>Ver solución</Text>
                    <Ionicons name="chevron-forward" size={14} color="#004481" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
            {soluciones.length === 0 && !debilidadesData && (
              <ActivityIndicator color="#004481" style={{ marginVertical: 20 }} />
            )}
            {debilidadesData && soluciones.length === 0 && (
              <Text style={{ color: '#00a278', fontWeight: '600', textAlign: 'center', marginVertical: 12 }}>
                ✅ Sin debilidades críticas detectadas
              </Text>
            )}

            <View style={{ height: 40 }} />
          </ScrollView>
        )}

        {/* ─── KPIs ─── */}
        {activeTab === 'KPIs' && (
          <ScrollView style={s.scrollBody} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
            <Text style={s.tabMainTitle}>Indicadores Clave</Text>
            <Text style={s.tabSubtitle}>Métricas y tendencias del sistema</Text>

            <Text style={s.sectionHeader}>TRANSACCIONES</Text>

            {/* Tendencia mensual de fraudes */}
            <View style={s.kpiDetailCard}>
              <Text style={s.cardTitle}>Tendencia mensual de fraudes</Text>
              <Text style={s.cardSubtitle}>{fraudePorMes.length} meses registrados</Text>
              {fraudePorMes.length > 0
                ? <FraudLineChart data={fraudePorMes} />
                : <ActivityIndicator color="#004481" style={{ marginVertical: 40 }} />
              }
            </View>

            {/* Fraude por categoría */}
            <View style={s.kpiDetailCard}>
              <Text style={s.cardTitle}>Fraude por categoría</Text>
              <Text style={s.cardSubtitle}>{fraudePorCategoria.length} categorías</Text>
              <View style={[s.barChartContainer, { marginTop: 8 }]}>
                {fraudePorCategoria.slice(0, 10).map((item, idx) => {
                  const pct = Math.round((item.total_fraudes / maxFraudes) * 100);
                  return (
                    <View key={idx} style={s.barChartRow}>
                      <Text style={s.barChartLabel} numberOfLines={1}>{item.categoria}</Text>
                      <View style={s.barChartFillWrapper}>
                        <View style={[s.barChartFill, { width: `${pct}%`, backgroundColor: '#00a2ff' }]} />
                      </View>
                    </View>
                  );
                })}
                {fraudePorCategoria.length === 0 && (
                  <ActivityIndicator color="#004481" style={{ marginVertical: 20 }} />
                )}
              </View>
            </View>

            <Text style={s.sectionHeader}>CLIENTES</Text>
            <View style={s.sideBySideRow}>
              <View style={s.halfCard}>
                <Text style={s.halfCardTitle}>Por segmento</Text>
                <MiniDonutChart segments={[
                  { percentage: 48, color: '#004481', label: 'Premium' },
                  { percentage: 32, color: '#007dd6', label: 'Nómina' },
                  { percentage: 20, color: '#00a86b', label: 'PyME' },
                ]} />
              </View>
              <View style={s.halfCard}>
                <Text style={s.halfCardTitle}>Por género</Text>
                <MiniDonutChart segments={[
                  { percentage: 51, color: '#004481', label: 'Masc.' },
                  { percentage: 49, color: '#007dd6', label: 'Fem.' },
                ]} />
              </View>
            </View>

            <Text style={s.sectionHeader}>RESUMEN ETL</Text>
            <View style={s.kpiDetailCard}>
              <Text style={s.cardTitle}>Pipeline de Fraude</Text>
              <Text style={s.cardSubtitle}>Datos del análisis ETL</Text>
              {etlResumen ? (
                <View style={{ gap: 12, marginTop: 12 }}>
                  {[
                    { label: 'Total transacciones analizadas', val: fmt(etlResumen.total_transacciones) },
                    { label: 'Fraudes detectados',             val: fmt(etlResumen.total_fraudes) },
                    { label: 'Tasa de fraude',                 val: `${etlResumen.tasa_fraude_pct?.toFixed(2)}%` },
                    { label: 'Monto total en riesgo',          val: fmtMXN(etlResumen.monto_total_fraude) },
                    { label: 'Monto promedio por fraude',      val: fmtMXN(etlResumen.monto_promedio_fraude) },
                  ].map((row, i) => (
                    <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#f0f2f5', paddingBottom: 8 }}>
                      <Text style={{ fontSize: 13, color: '#5d5f5f', flex: 1 }}>{row.label}</Text>
                      <Text style={{ fontSize: 13, fontWeight: '700', color: '#1a1c1c' }}>
                        {hideAmounts ? '•••••' : row.val}
                      </Text>
                    </View>
                  ))}
                </View>
              ) : (
                <ActivityIndicator color="#004481" style={{ marginVertical: 20 }} />
              )}
            </View>

            <View style={{ height: 40 }} />
          </ScrollView>
        )}

        {/* ─── Reportes ─── */}
        {activeTab === 'Reportes' && (
          <ScrollView style={s.scrollBody} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
            <Text style={s.tabMainTitle}>Reportes</Text>
            <Text style={s.tabSubtitle}>Genera y descarga informes ejecutivos</Text>

            <View style={s.reportHeroCard}>
              <Text style={s.heroTitle}>Reporte Ejecutivo de KPIs</Text>
              <Text style={s.heroSubtitle}>Fraude · Debilidades · Soluciones</Text>
              <Text style={s.heroDesc}>
                Informe estructurado con análisis completo del pipeline ETL, alertas detectadas y recomendaciones priorizadas.
              </Text>
              <TouchableOpacity
                style={[s.heroBtn, downloading && { opacity: 0.7 }]}
                activeOpacity={0.9}
                onPress={handleDownloadPDF}
                disabled={downloading}
              >
                {downloading
                  ? <ActivityIndicator color="#004481" style={{ marginRight: 8 }} />
                  : <Ionicons name="download-outline" size={20} color="#004481" style={{ marginRight: 8 }} />
                }
                <Text style={s.heroBtnTxt}>
                  {downloading ? 'Generando PDF...' : 'Generar y Descargar PDF'}
                </Text>
              </TouchableOpacity>
              <View style={s.heroTagRow}>
                <View style={s.heroTag}><Text style={s.heroTagTxt}>Incluye gráficas</Text></View>
                <View style={s.heroTag}><Text style={s.heroTagTxt}>Análisis automático</Text></View>
                <View style={s.heroTag}><Text style={s.heroTagTxt}>Soluciones</Text></View>
              </View>
            </View>

            {/* ── Historial de reportes ── */}
            {reportHistory.length > 0 && (
              <>
                <Text style={s.sectionHeader}>REPORTES GENERADOS</Text>
                {reportHistory.map((rep, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={s.repListItem}
                    activeOpacity={0.8}
                    onPress={async () => {
                      const canShare = await Sharing.isAvailableAsync();
                      if (canShare) await Sharing.shareAsync(rep.uri, { mimeType: 'application/pdf' });
                    }}
                  >
                    <View style={s.pdfIconContainer}>
                      <Ionicons name="document-text-outline" size={24} color="#ba1a1a" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.repFileName} numberOfLines={1}>{rep.name}</Text>
                      <Text style={s.repSubText}>{rep.date}</Text>
                    </View>
                    <View style={s.repDownloadBtn}>
                      <Ionicons name="share-outline" size={20} color="#004481" />
                    </View>
                  </TouchableOpacity>
                ))}
              </>
            )}

            <Text style={s.sectionHeader}>PERSONALIZAR REPORTE</Text>
            <View style={s.customizeCard}>
              {[
                { label: 'Incluir KPIs generales',       val: incKpi,   set: setIncKpi },
                { label: 'Incluir análisis de fraude',    val: incFraud, set: setIncFraud },
                { label: 'Incluir debilidades detectadas',val: incDeb,   set: setIncDeb },
                { label: 'Incluir recomendaciones',       val: incRec,   set: setIncRec },
                { label: 'Incluir gráficas',              val: incGraph, set: setIncGraph },
              ].map((row, i, arr) => (
                <View key={i} style={[s.customRow, i === arr.length - 1 && { borderBottomWidth: 0, paddingBottom: 0 }]}>
                  <Text style={s.customRowLabel}>{row.label}</Text>
                  <Switch value={row.val} onValueChange={row.set}
                    trackColor={{ false: '#d1d5db', true: '#004481' }}
                    thumbColor="#ffffff" ios_backgroundColor="#d1d5db" />
                </View>
              ))}
            </View>

            <View style={{ height: 40 }} />
          </ScrollView>
        )}

        {/* ─── Debilidades ─── */}
        {activeTab === 'Debilidades' && (
          <ScrollView style={s.scrollBody} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
            <Text style={s.tabMainTitle}>Debilidades Detectadas</Text>
            <Text style={s.tabSubtitle}>Análisis automático del sistema</Text>

            <LinearGradient colors={['#ba1a1a', '#ff9900']} start={{ x: 0, y: 1 }} end={{ x: 1, y: 0 }} style={s.alertBanner}>
              <View style={s.alertBannerHeader}>
                <Ionicons name="warning-outline" size={20} color="#ffffff" style={{ marginRight: 8 }} />
                <Text style={s.alertBannerText}>
                  {debilidadesData
                    ? `${altaCount} debilidad${altaCount !== 1 ? 'es' : ''} crítica${altaCount !== 1 ? 's' : ''} encontrada${altaCount !== 1 ? 's' : ''}`
                    : 'Analizando sistema...'}
                </Text>
              </View>
              <Text style={s.alertBannerAmount}>
                {hideAmounts
                  ? '•••••••••'
                  : etlResumen
                    ? `${fmtMXN(etlResumen.monto_total_fraude)} en riesgo`
                    : '...'}
              </Text>
            </LinearGradient>

            {!debilidadesData && (
              <ActivityIndicator color="#004481" size="large" style={{ marginVertical: 40 }} />
            )}

            {soluciones.map((sol, idx) => (
              <DebCardDetalle key={idx} sol={sol} idx={idx}
                expandedId={expandedDebId} setExpandedId={setExpandedDebId}
                hideAmounts={hideAmounts} />
            ))}

            {debilidadesData && soluciones.length === 0 && (
              <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                <Ionicons name="checkmark-circle-outline" size={64} color="#00a278" />
                <Text style={{ fontSize: 18, fontWeight: '700', color: '#00a278', marginTop: 12 }}>
                  Sin debilidades críticas
                </Text>
                <Text style={{ fontSize: 14, color: '#5d5f5f', marginTop: 8, textAlign: 'center' }}>
                  El sistema opera dentro de los parámetros aceptables.
                </Text>
              </View>
            )}

            <View style={{ height: 40 }} />
          </ScrollView>
        )}
      </View>

      {/* ── Bottom Tab Bar ── */}
      <View style={s.tabBar}>
        {([
          { key: 'Inicio',      icon: 'home',          iconO: 'home-outline' },
          { key: 'KPIs',        icon: 'bar-chart',     iconO: 'bar-chart-outline' },
          { key: 'Reportes',    icon: 'document-text', iconO: 'document-text-outline' },
          { key: 'Debilidades', icon: 'warning',       iconO: 'warning-outline', badge: altaCount },
        ] as const).map(tab => (
          <TouchableOpacity key={tab.key} style={s.tabItem} onPress={() => setActiveTab(tab.key as any)}>
            <View>
              <Ionicons
                name={(activeTab === tab.key ? tab.icon : tab.iconO) as any}
                size={22}
                color={activeTab === tab.key ? '#004481' : '#737781'}
              />
              {'badge' in tab && tab.badge > 0 && (
                <View style={s.badgeBadge}>
                  <Text style={s.badgeBadgeTxt}>{tab.badge}</Text>
                </View>
              )}
            </View>
            <Text style={[s.tabLabel, { color: activeTab === tab.key ? '#004481' : '#737781' }]}>
              {tab.key}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

// ── Estilos ───────────────────────────────────────────────────
const s = StyleSheet.create({
  root:          { flex: 1, backgroundColor: '#f4f6fa' },
  header:        { height: 60, backgroundColor: '#ffffff', flexDirection: 'row',
                   justifyContent: 'space-between', alignItems: 'center',
                   paddingHorizontal: 16, borderBottomWidth: 1,
                   borderBottomColor: 'rgba(194,198,210,0.3)',
                   shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
                   shadowOpacity: 0.03, shadowRadius: 3, elevation: 1 },
  headerBtn:     { padding: 8 },
  headerTitle:   { fontSize: 22, fontWeight: '800', color: '#004481', letterSpacing: 0.8 },
  scrollBody:    { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 24 },
  bannerCard:    { backgroundColor: '#004481', borderRadius: 16, padding: 20,
                   marginBottom: 20, shadowColor: '#004481',
                   shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15,
                   shadowRadius: 10, elevation: 4 },
  bannerTitle:   { fontSize: 26, fontWeight: '700', color: '#ffffff', marginBottom: 4 },
  bannerSub:     { fontSize: 14, color: 'rgba(255,255,255,0.8)', fontWeight: '500' },
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
  kpiValue:      { fontSize: 20, fontWeight: '800', color: '#1a1c1c', marginBottom: 4 },
  kpiLabel:      { fontSize: 12, fontWeight: '600', color: '#737781', marginBottom: 8 },
  trendRow:      { flexDirection: 'row', alignItems: 'center', gap: 4 },
  trendText:     { fontSize: 11, fontWeight: '700' },
  sectionTitle:  { fontSize: 20, fontWeight: '800', color: '#002e5a',
                   marginTop: 12, marginBottom: 16, letterSpacing: 0.2 },
  carousel:      { marginBottom: 24 },
  carouselCard:  { backgroundColor: '#ffffff', borderRadius: 16, padding: 20,
                   width: width - 52, marginRight: 16, borderWidth: 1,
                   borderColor: 'rgba(194,198,210,0.4)', shadowColor: '#000',
                   shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04,
                   shadowRadius: 6, elevation: 2 },
  carouselTitle: { fontSize: 16, fontWeight: '700', color: '#1a1c1c', marginBottom: 2 },
  carouselSub:   { fontSize: 12, color: '#737781', marginBottom: 12 },
  critList:      { gap: 12, marginTop: 4 },
  critItem:      { gap: 6 },
  critLabelRow:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  critName:      { fontSize: 13, fontWeight: '600', color: '#1a1c1c', flex: 1 },
  critCount:     { fontSize: 12, fontWeight: '700', color: '#737781' },
  barBg:         { height: 6, backgroundColor: '#f0f2f5', borderRadius: 3, overflow: 'hidden' },
  barFill:       { height: 6, borderRadius: 3 },
  debCard:       { backgroundColor: '#ffffff', borderRadius: 16, padding: 16,
                   flexDirection: 'row', gap: 14, marginBottom: 16, borderWidth: 1,
                   borderColor: 'rgba(194,198,210,0.4)', shadowColor: '#000',
                   shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04,
                   shadowRadius: 6, elevation: 2 },
  debIconBox:    { width: 44, height: 44, borderRadius: 22, backgroundColor: '#fbebeb',
                   alignItems: 'center', justifyContent: 'center' },
  debBody:       { flex: 1, alignItems: 'flex-start' },
  badge:         { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2, marginBottom: 8 },
  badgeText:     { fontSize: 10, fontWeight: '800', color: '#ffffff', letterSpacing: 0.5 },
  debTitle:      { fontSize: 15, fontWeight: '700', color: '#1a1c1c', marginBottom: 6, lineHeight: 20 },
  debDesc:       { fontSize: 13, color: '#5d5f5f', lineHeight: 18, marginBottom: 10 },
  solLink:       { flexDirection: 'row', alignItems: 'center', gap: 4 },
  solLinkTxt:    { fontSize: 13, fontWeight: '700', color: '#004481' },
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
  tabMainTitle:  { fontSize: 24, fontWeight: '800', color: '#002e5a', marginBottom: 6 },
  tabSubtitle:   { fontSize: 14, color: '#5d5f5f', lineHeight: 20, marginBottom: 20 },
  sectionHeader: { fontSize: 12, fontWeight: '800', color: '#737781', letterSpacing: 1.5,
                   marginTop: 24, marginBottom: 12 },
  kpiDetailCard: { backgroundColor: '#ffffff', borderRadius: 16, padding: 20,
                   marginBottom: 16, borderWidth: 1, borderColor: 'rgba(194,198,210,0.4)',
                   shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
                   shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  cardTitle:     { fontSize: 16, fontWeight: '700', color: '#1a1c1c', marginBottom: 2 },
  cardSubtitle:  { fontSize: 12, color: '#737781', marginBottom: 12 },
  barChartContainer: { gap: 10, marginVertical: 8 },
  barChartRow:   { flexDirection: 'row', alignItems: 'center', gap: 12 },
  barChartLabel: { width: 90, fontSize: 12, fontWeight: '600', color: '#5d5f5f', textAlign: 'right' },
  barChartFillWrapper: { flex: 1, height: 10, backgroundColor: '#f0f2f5', borderRadius: 5, overflow: 'hidden' },
  barChartFill:  { height: 10, borderRadius: 5 },
  sideBySideRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, marginBottom: 16 },
  halfCard:      { flex: 1, backgroundColor: '#ffffff', borderRadius: 16, padding: 16,
                   borderWidth: 1, borderColor: 'rgba(194,198,210,0.4)',
                   shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
                   shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  halfCardTitle: { fontSize: 14, fontWeight: '700', color: '#1a1c1c', marginBottom: 8, textAlign: 'center' },
  reportHeroCard:{ backgroundColor: '#004481', borderRadius: 16, padding: 20,
                   marginBottom: 24, shadowColor: '#004481',
                   shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15,
                   shadowRadius: 10, elevation: 4 },
  heroTitle:     { fontSize: 20, fontWeight: '700', color: '#ffffff', marginBottom: 4 },
  heroSubtitle:  { fontSize: 13, color: 'rgba(255,255,255,0.7)', fontWeight: '600', marginBottom: 12 },
  heroDesc:      { fontSize: 13, color: '#ffffff', lineHeight: 18, marginBottom: 20, opacity: 0.9 },
  heroBtn:       { backgroundColor: '#ffffff', borderRadius: 24, paddingVertical: 14,
                   flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  heroBtnTxt:    { color: '#004481', fontSize: 14, fontWeight: '700' },
  heroTagRow:    { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  heroTag:       { backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  heroTagTxt:    { color: '#ffffff', fontSize: 10, fontWeight: '600' },
  customizeCard: { backgroundColor: '#ffffff', borderRadius: 16, padding: 20,
                   borderWidth: 1, borderColor: 'rgba(194,198,210,0.4)',
                   shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
                   shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  customRow:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
                   paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(194,198,210,0.2)' },
  customRowLabel:{ fontSize: 14, fontWeight: '600', color: '#1a1c1c' },
  alertBanner:   { borderRadius: 16, padding: 20, marginBottom: 24, shadowColor: '#ba1a1a',
                   shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15,
                   shadowRadius: 10, elevation: 4 },
  alertBannerHeader:{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  alertBannerText:  { color: '#ffffff', fontSize: 14, fontWeight: '700' },
  alertBannerAmount:{ color: '#ffffff', fontSize: 22, fontWeight: '800' },
  debDetailCard: { backgroundColor: '#ffffff', borderRadius: 16, padding: 20,
                   marginBottom: 16, borderWidth: 1, borderColor: 'rgba(194,198,210,0.4)',
                   shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
                   shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  debHeaderRow:  { flexDirection: 'row', gap: 14, marginBottom: 8 },
  debDetailIconBox:{ width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  accordionBtn:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                   gap: 4, backgroundColor: '#f0f2f5', borderRadius: 20,
                   paddingVertical: 10, marginTop: 12 },
  accordionBtnText:{ fontSize: 13, fontWeight: '700', color: '#004481' },
  accordionContent:{ marginTop: 12, backgroundColor: '#f8fafc', borderRadius: 12,
                    padding: 16, borderWidth: 1, borderColor: '#e2e8f0', gap: 10 },
  mitigationTitle: { fontSize: 13, fontWeight: '700', color: '#1e293b',
                    borderBottomWidth: 1, borderBottomColor: '#cbd5e1', paddingBottom: 4 },
  mitigationItem:  { flexDirection: 'row', gap: 6, alignItems: 'flex-start' },
  mitigationDot:   { fontSize: 12, color: '#ba1a1a', fontWeight: '800', marginTop: -2 },
  mitigationText:  { fontSize: 12, color: '#475569', lineHeight: 18, flex: 1 },
});
