import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, Dimensions, StatusBar, Switch,
  ActivityIndicator, Alert, Animated, Easing, PanResponder, Modal, RefreshControl,
} from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle, G, Line, Text as SvgText, Polyline, Defs, LinearGradient as SvgGradient, Stop, Path } from 'react-native-svg';
import { useQuery } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/src/store/auth.store';
import { dashboardService } from '@/src/features/dashboard/dashboard.service';
import type {
  FraudePorMes, Solucion,
  PrestamosPorTipo, SaldoPorTipoCuenta,
  ScoreCrediticio, TendenciaMes, CobrosExcedidos,
  FraudeGeo, FraudeComercio,
} from '@/src/features/dashboard/dashboard.types';

const { width } = Dimensions.get('window');
const STALE = 5 * 60 * 1000; // 5 min de caché

// ── Helpers ───────────────────────────────────────────────────
const fmt    = (n: number) => Math.round(n).toLocaleString('es-MX');
const fmtMXN = (n: number) => {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(1)}K`;
  return `$${fmt(n)}`;
};

const PALETTE = ['#004481','#1973B8','#48A9E6','#00a86b','#fbbd08','#ba1a1a','#7c3aed','#0ea5e9'];
const CANAL_COLORS: Record<string, string> = {
  App: '#004481', Cajero: '#1973B8', POS: '#00a86b', Web: '#fbbd08', Ventanilla: '#ba1a1a',
};
const AREA_ICONS: Record<string, string> = {
  Seguridad: 'shield-outline', Cumplimiento: 'business-outline',
  Retención: 'people-outline', Cartera: 'card-outline', Ahorro: 'wallet-outline',
};
const PRIORIDAD_COLOR: Record<string, string> = {
  Alta: '#ba1a1a', Media: '#fbbd08', Baja: '#00a278',
};
const UMBRALES: Record<string, number> = {
  porcentajeFraudePotencial: 5, porcentajeCobrosExcedidos: 10,
  porcentajeCuentasCanceladas: 20, porcentajePrestamosVencidos: 15, porcentajeMetasFallidas: 30,
};

// ─────────────────────────────────────────────────────────────
//  SKELETON LOADER
// ─────────────────────────────────────────────────────────────
function SkeletonCard({ lines = 3, height = 120 }: { lines?: number; height?: number }) {
  const pulse = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1,   duration: 800, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.4, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  return (
    <Animated.View style={[s.kpiDetailCard, { opacity: pulse, height }]}>
      {Array.from({ length: lines }).map((_, i) => (
        <View key={i} style={{ height: 12, backgroundColor: '#e0e4eb', borderRadius: 6,
          marginBottom: 10, width: i === 0 ? '60%' : i % 2 === 0 ? '90%' : '75%' }} />
      ))}
    </Animated.View>
  );
}

// ─────────────────────────────────────────────────────────────
//  DONA ANIMADA
// ─────────────────────────────────────────────────────────────
interface Segment { percentage: number; color: string; label: string }

function DonutChart({ segments, size = 'large' }: { segments: Segment[]; size?: 'large' | 'small' }) {
  const progress = useRef(new Animated.Value(0)).current;
  const [animPct, setAnimPct] = useState(0);

  useEffect(() => {
    if (!segments.length) return;
    progress.setValue(0);
    Animated.timing(progress, {
      toValue: 1, duration: 900, easing: Easing.out(Easing.cubic), useNativeDriver: false,
    }).start();
    const id = progress.addListener(({ value }) => setAnimPct(value));
    return () => progress.removeListener(id);
  }, [segments.map(s => s.label).join()]);

  const isLarge = size === 'large';
  const dim = isLarge ? 180 : 120;
  const center = dim / 2;
  const radius = isLarge ? 50 : 33;
  const sw = isLarge ? 22 : 14;
  const circ = 2 * Math.PI * radius;
  let acc = 0;

  return (
    <View style={{ alignItems: 'center', marginVertical: 6 }}>
      <Svg width={dim} height={dim} viewBox={`0 0 ${dim} ${dim}`}>
        <G transform={`rotate(-90 ${center} ${center})`}>
          <Circle cx={center} cy={center} r={radius} stroke="#f0f2f5" strokeWidth={sw} fill="transparent" />
          {segments.map((seg, idx) => {
            const effectivePct = seg.percentage * animPct;
            const len    = (effectivePct / 100) * circ;
            const offset = circ - (acc / 100) * circ * animPct;
            acc += seg.percentage;
            return (
              <Circle key={idx} cx={center} cy={center} r={radius}
                stroke={seg.color} strokeWidth={sw}
                strokeDasharray={`${len} ${circ}`}
                strokeDashoffset={offset} strokeLinecap="butt" fill="transparent" />
            );
          })}
        </G>
      </Svg>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 6, marginTop: 6 }}>
        {segments.map((seg, idx) => (
          <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: seg.color }} />
            <Text style={{ fontSize: isLarge ? 11 : 10, fontWeight: '600', color: '#5d5f5f' }}>
              {seg.label} {seg.percentage.toFixed(1)}%
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────
//  GRÁFICA DE BARRAS ANIMADA + TÁCTIL
// ─────────────────────────────────────────────────────────────
function AnimatedBarChart({
  data, colorFn, valueFormatter,
}: {
  data: { label: string; value: number }[];
  colorFn?: (i: number) => string;
  valueFormatter?: (v: number) => string;
}) {
  const maxVal = Math.max(...data.map(d => d.value), 1);
  const fmtVal = valueFormatter ?? fmt;
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

  // Un Animated.Value por barra
  const anims = useRef<Animated.Value[]>([]);
  if (anims.current.length !== data.length) {
    anims.current = data.map(() => new Animated.Value(0));
  }

  useEffect(() => {
    anims.current.forEach(a => a.setValue(0));
    const animations = anims.current.map((a, i) =>
      Animated.timing(a, {
        toValue: 1,
        duration: 550,
        delay: i * 60,
        easing: Easing.out(Easing.back(1.1)),
        useNativeDriver: false,
      })
    );
    Animated.stagger(60, animations).start();
  }, [data.map(d => d.value).join()]);

  return (
    <View style={{ gap: 6, marginTop: 8 }}>
      {data.map((item, i) => {
        const pct = (item.value / maxVal) * 100;
        const color = colorFn ? colorFn(i) : PALETTE[i % PALETTE.length];
        const isSelected = selectedIdx === i;

        const animWidth = anims.current[i]?.interpolate({
          inputRange: [0, 1],
          outputRange: ['0%', `${pct}%`],
        }) ?? '0%';

        return (
          <TouchableOpacity key={i} activeOpacity={0.75}
            onPress={() => setSelectedIdx(isSelected ? null : i)}>
            <View style={{ gap: 4 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ fontSize: 12, fontWeight: isSelected ? '700' : '600',
                  color: isSelected ? color : '#5d5f5f', flex: 1 }} numberOfLines={1}>
                  {item.label}
                </Text>
                <View style={[{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10,
                  backgroundColor: isSelected ? color : 'transparent' }]}>
                  <Text style={{ fontSize: 12, fontWeight: '700',
                    color: isSelected ? 'white' : '#1a1c1c' }}>
                    {fmtVal(item.value)}
                  </Text>
                </View>
              </View>

              <View style={{ height: isSelected ? 12 : 9, backgroundColor: color + '20',
                borderRadius: 6, overflow: 'hidden' }}>
                <Animated.View style={{
                  width: animWidth, height: '100%',
                  backgroundColor: isSelected ? color : color + 'CC',
                  borderRadius: 6,
                }} />
              </View>

              {isSelected && (
                <View style={{ backgroundColor: color + '12', borderRadius: 10, padding: 10,
                  borderLeftWidth: 3, borderLeftColor: color, marginTop: 2 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Ionicons name="bar-chart-outline" size={13} color={color} />
                    <Text style={{ fontSize: 12, color, fontWeight: '700' }}>{item.label}</Text>
                  </View>
                  <Text style={{ fontSize: 11, color: '#333', marginTop: 2 }}>
                    Valor: {fmtVal(item.value)}
                    {'  ·  '}
                    {pct.toFixed(1)}% del total
                  </Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────
//  GRÁFICA DE LÍNEA INTERACTIVA (dedo deslizante)
// ─────────────────────────────────────────────────────────────
function InteractiveLineChart({
  data, color = '#004481', valueFormatter,
}: {
  data: { label: string; value: number }[];
  color?: string;
  valueFormatter?: (v: number) => string;
}) {
  const fmtVal = valueFormatter ?? fmt;
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const chartRenderWidth = width - 64;
  const SVG_W = 320, SVG_H = 150;
  const X1 = 40, X2 = 310, Y_TOP = 15, Y_BOT = 125;

  const counts = data.map(d => d.value);
  const minV = Math.min(...counts);
  const maxV = Math.max(...counts);
  const xStep = data.length > 1 ? (X2 - X1) / (data.length - 1) : 0;

  const ptX = (i: number) => X1 + i * xStep;
  const ptY = (v: number) => maxV === minV ? (Y_TOP + Y_BOT) / 2
    : Y_BOT - ((v - minV) / (maxV - minV)) * (Y_BOT - Y_TOP);

  const pointsStr = data.map((d, i) => `${ptX(i).toFixed(1)},${ptY(d.value).toFixed(1)}`).join(' ');

  // Área bajo la línea (path)
  const areaPath = data.length
    ? `M ${ptX(0)} ${Y_BOT} ` +
      data.map((d, i) => `L ${ptX(i).toFixed(1)} ${ptY(d.value).toFixed(1)}`).join(' ') +
      ` L ${ptX(data.length - 1)} ${Y_BOT} Z`
    : '';

  // Animación de entrada
  const progress = useRef(new Animated.Value(0)).current;
  const [lineProgress, setLineProgress] = useState(0);
  useEffect(() => {
    if (!data.length) return;
    progress.setValue(0);
    setLineProgress(0);
    Animated.timing(progress, {
      toValue: 1, duration: 800, easing: Easing.out(Easing.cubic), useNativeDriver: false,
    }).start();
    const id = progress.addListener(({ value }) => setLineProgress(value));
    return () => progress.removeListener(id);
  }, [data.map(d => d.value).join()]);

  const visiblePoints = Math.ceil(lineProgress * data.length);
  const visibleStr = data.slice(0, visiblePoints)
    .map((d, i) => `${ptX(i).toFixed(1)},${ptY(d.value).toFixed(1)}`).join(' ');

  // PanResponder
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder:  () => true,
      onPanResponderGrant: (e) => handleTouch(e.nativeEvent.locationX),
      onPanResponderMove:  (e) => handleTouch(e.nativeEvent.locationX),
      onPanResponderRelease: () => setActiveIdx(null),
    })
  ).current;

  const handleTouch = (touchX: number) => {
    if (!data.length) return;
    const svgX = (touchX / chartRenderWidth) * SVG_W;
    const idx  = Math.round((svgX - X1) / xStep);
    setActiveIdx(Math.max(0, Math.min(data.length - 1, idx)));
  };

  const active = activeIdx !== null ? data[activeIdx] : null;
  const activeX = activeIdx !== null ? ptX(activeIdx) : null;
  const activeY = active ? ptY(active.value) : null;

  const yLabels = [maxV, maxV * 0.75, maxV * 0.5, maxV * 0.25, minV];

  return (
    <View style={{ marginVertical: 8 }}>
      {active && (
        <View style={{ backgroundColor: color + '15', borderRadius: 10, padding: 10,
          borderLeftWidth: 3, borderLeftColor: color, marginBottom: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Ionicons name="location-outline" size={13} color={color} />
            <Text style={{ fontSize: 12, color, fontWeight: '700' }}>{active.label}</Text>
          </View>
          <Text style={{ fontSize: 13, fontWeight: '800', color: '#1a1c1c', marginTop: 2 }}>
            {fmtVal(active.value)}
          </Text>
        </View>
      )}

      <View style={{ height: SVG_H + 10 }} {...panResponder.panHandlers}>
        <Svg width={chartRenderWidth} height={SVG_H} viewBox={`0 0 ${SVG_W} ${SVG_H}`}>
          <Defs>
            <SvgGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0"   stopColor={color} stopOpacity="0.18" />
              <Stop offset="1"   stopColor={color} stopOpacity="0" />
            </SvgGradient>
          </Defs>

          {/* Líneas de referencia */}
          {[Y_TOP, (Y_TOP+Y_BOT)/2, Y_BOT].map((y, i) => (
            <React.Fragment key={i}>
              <Line x1={X1} y1={y} x2={X2} y2={y} stroke="#e2e6ed" strokeDasharray="3 3" strokeWidth="0.7" />
              <SvgText x="2" y={y + 4} fontSize="8" fill="#aaa" fontWeight="600">
                {Math.round(yLabels[i * 2]).toLocaleString()}
              </SvgText>
            </React.Fragment>
          ))}

          {/* Área */}
          {visiblePoints > 1 && <Path d={areaPath} fill="url(#areaGrad)" />}

          {/* Línea */}
          {visibleStr && <Polyline fill="none" stroke={color} strokeWidth="2.2" points={visibleStr} strokeLinecap="round" strokeLinejoin="round" />}

          {/* Indicador activo */}
          {activeX !== null && activeY !== null && (
            <>
              <Line x1={activeX} y1={Y_TOP} x2={activeX} y2={Y_BOT}
                stroke={color} strokeWidth="1.2" strokeDasharray="3 2" />
              <Circle cx={activeX} cy={activeY} r="5" fill={color} opacity="0.9" />
              <Circle cx={activeX} cy={activeY} r="9" fill={color} opacity="0.15" />
            </>
          )}

          {/* Puntos en cada dato (si hay pocos) */}
          {data.length <= 14 && data.slice(0, visiblePoints).map((d, i) => (
            <Circle key={i} cx={ptX(i)} cy={ptY(d.value)} r="3"
              fill={activeIdx === i ? color : 'white'}
              stroke={color} strokeWidth="1.5" />
          ))}

          {/* Etiquetas eje X */}
          {data.length > 0 && [0, Math.floor(data.length / 2), data.length - 1].map(i => (
            <SvgText key={i} x={ptX(i)} y={SVG_H - 2} fontSize="7"
              fill="#737781" textAnchor="middle" fontWeight="600">
              {data[i]?.label ?? ''}
            </SvgText>
          ))}
        </Svg>
      </View>
      {!active && (
        <Text style={{ fontSize: 10, color: '#aaa', textAlign: 'center', marginTop: 2 }}>
          ← Desliza el dedo para ver valores →
        </Text>
      )}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────
//  INDICADOR DE RIESGO
// ─────────────────────────────────────────────────────────────
function RiskIndicator({ label, value, umbral, icon }: {
  label: string; value: number; umbral: number; icon: string;
}) {
  const isRisk  = value > umbral;
  const color   = isRisk ? '#ba1a1a' : value > umbral * 0.6 ? '#fbbd08' : '#00a278';
  const bgColor = isRisk ? '#fbebeb' : value > umbral * 0.6 ? '#fff7e6' : '#e6f7f0';
  const anim    = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: Math.min((value / (umbral * 1.5)) * 100, 100),
      duration: 700, easing: Easing.out(Easing.cubic), useNativeDriver: false,
    }).start();
  }, [value]);

  const animWidth = anim.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] });

  return (
    <View style={[s.riskCard, { backgroundColor: bgColor, borderColor: color + '44' }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: color + '22',
          alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name={icon as any} size={18} color={color} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 12, color: '#5d5f5f', fontWeight: '600' }}>{label}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
            <Text style={{ fontSize: 24, fontWeight: '800', color }}>{value.toFixed(1)}%</Text>
            <Text style={{ fontSize: 10, color: '#999' }}>umbral: {umbral}%</Text>
          </View>
        </View>
        <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, backgroundColor: color }}>
          <Text style={{ color: 'white', fontSize: 10, fontWeight: '800' }}>
            {isRisk ? 'RIESGO' : 'OK'}
          </Text>
        </View>
      </View>
      <View style={{ height: 7, backgroundColor: color + '25', borderRadius: 4, overflow: 'hidden' }}>
        <Animated.View style={{ width: animWidth, height: '100%', backgroundColor: color, borderRadius: 4 }} />
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────
//  TARJETA DE DEBILIDAD
// ─────────────────────────────────────────────────────────────
function DebCard({ sol, idx, expandedId, setExpandedId }: {
  sol: Solucion; idx: number;
  expandedId: number | null; setExpandedId: (v: number | null) => void;
}) {
  const icon  = AREA_ICONS[sol.area]  ?? 'alert-circle-outline';
  const color = PRIORIDAD_COLOR[sol.prioridad] ?? '#737781';
  const bg    = sol.prioridad === 'Alta' ? '#fbebeb' : sol.prioridad === 'Media' ? '#fff7e6' : '#e6f7f0';

  return (
    <View style={s.debDetailCard}>
      <View style={{ flexDirection: 'row', gap: 12, marginBottom: 8 }}>
        <View style={{ width: 44, height: 44, borderRadius: 22,
          backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name={icon as any} size={24} color={color} />
        </View>
        <View style={{ flex: 1 }}>
          <View style={[s.badge, { backgroundColor: color }]}>
            <Text style={s.badgeText}>{sol.prioridad.toUpperCase()}</Text>
          </View>
          <Text style={s.debTitle}>{sol.problema}</Text>
        </View>
      </View>
      <TouchableOpacity style={s.accordionBtn}
        onPress={() => setExpandedId(expandedId === idx ? null : idx)}>
        <Text style={s.accordionBtnText}>
          {expandedId === idx ? 'Ocultar solución' : 'Ver solución completa'}
        </Text>
        <Ionicons name={expandedId === idx ? 'chevron-up' : 'chevron-down'} size={16} color="#004481" />
      </TouchableOpacity>
      {expandedId === idx && (
        <View style={s.accordionContent}>
          <Text style={s.mitigationTitle}>Plan de Mitigación</Text>
          <View style={{ flexDirection: 'row', gap: 6, alignItems: 'flex-start' }}>
            <Ionicons name="arrow-forward-circle-outline" size={15} color="#ba1a1a" style={{ marginTop: 1 }} />
            <Text style={{ fontSize: 12, color: '#475569', lineHeight: 18, flex: 1 }}>{sol.solucion}</Text>
          </View>
        </View>
      )}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────
//  MAPA SVG DE FRAUDE GEOGRAFICO
// ─────────────────────────────────────────────────────────────
const MEX_LAT_MIN = 14.5,   MEX_LAT_MAX = 32.7;
const MEX_LNG_MIN = -118.4, MEX_LNG_MAX = -86.7;
const MAP_SVG_W = 320,      MAP_SVG_H = 200;

function lngToX(lng: number) {
  return ((lng - MEX_LNG_MIN) / (MEX_LNG_MAX - MEX_LNG_MIN)) * MAP_SVG_W;
}
function latToY(lat: number) {
  return ((MEX_LAT_MAX - lat) / (MEX_LAT_MAX - MEX_LAT_MIN)) * MAP_SVG_H;
}

// Contorno simplificado de México para SVG — [lng, lat]
const MEX_MAINLAND_COORDS: [number, number][] = [
  [-114.8,32.5],[-111.0,31.3],[-108.5,31.5],[-106.5,31.7],
  [-104.5,29.6],[-100.7,29.1],[-99.5,27.5],[-98.3,26.1],[-97.5,25.9],
  [-97.8,22.3],[-96.1,19.2],[-94.5,18.2],
  [-90.6,19.8],[-87.0,21.5],[-86.8,21.0],[-87.6,18.5],[-89.1,16.0],
  [-92.2,14.9],
  [-97.0,15.9],[-99.9,17.0],[-102.2,18.0],[-104.3,19.1],
  [-105.2,20.6],[-106.4,23.2],
  [-109.1,25.6],[-110.9,27.9],[-113.5,31.3],[-114.8,32.5],
];
const MEX_BAJA_COORDS: [number, number][] = [
  [-117.0,32.5],[-116.6,31.9],[-115.7,30.0],[-115.0,28.0],
  [-114.5,26.8],[-112.0,24.5],[-109.9,22.9],
  [-110.3,24.1],[-111.3,26.0],[-112.3,27.3],
  [-113.3,28.0],[-113.5,29.0],[-114.9,31.0],[-115.5,32.7],
];
function coordsToPath(coords: [number, number][]): string {
  return coords.map(([lng, lat], i) =>
    `${i === 0 ? 'M' : 'L'}${lngToX(lng).toFixed(1)},${latToY(lat).toFixed(1)}`
  ).join(' ') + ' Z';
}

// Lookup de zonas geográficas de México para el modal
const GEO_ZONAS = [
  { n: 'CDMX y area metropolitana', lat:19.4, lng:-99.1 },
  { n: 'Guadalajara, Jalisco',       lat:20.7, lng:-103.4 },
  { n: 'Monterrey, Nuevo Leon',      lat:25.7, lng:-100.3 },
  { n: 'Tijuana, Baja California',   lat:32.5, lng:-117.0 },
  { n: 'Merida, Yucatan',            lat:21.0, lng:-89.6  },
  { n: 'Puebla, Puebla',             lat:19.0, lng:-98.2  },
  { n: 'Cancun, Quintana Roo',       lat:21.2, lng:-86.9  },
  { n: 'Leon, Guanajuato',           lat:21.1, lng:-101.7 },
  { n: 'Toluca, Edo. de Mexico',     lat:19.3, lng:-99.7  },
  { n: 'Torreon, Coahuila',          lat:25.5, lng:-103.5 },
  { n: 'San Luis Potosi',            lat:22.2, lng:-101.0 },
  { n: 'Queretaro',                  lat:20.6, lng:-100.4 },
  { n: 'Chihuahua, Chihuahua',       lat:28.6, lng:-106.1 },
  { n: 'Hermosillo, Sonora',         lat:29.1, lng:-111.0 },
  { n: 'Saltillo, Coahuila',         lat:25.4, lng:-101.0 },
  { n: 'Mexicali, Baja California',  lat:32.7, lng:-115.5 },
  { n: 'Culiacan, Sinaloa',          lat:24.8, lng:-107.4 },
  { n: 'Acapulco, Guerrero',         lat:16.9, lng:-99.9  },
  { n: 'Veracruz, Veracruz',         lat:19.2, lng:-96.1  },
  { n: 'Aguascalientes',             lat:21.9, lng:-102.3 },
  { n: 'Morelia, Michoacan',         lat:19.7, lng:-101.2 },
  { n: 'Tampico, Tamaulipas',        lat:22.3, lng:-97.9  },
  { n: 'Mazatlan, Sinaloa',          lat:23.2, lng:-106.4 },
  { n: 'Durango, Durango',           lat:24.0, lng:-104.7 },
  { n: 'Oaxaca, Oaxaca',             lat:17.1, lng:-96.7  },
  { n: 'Tuxtla Gutierrez, Chiapas',  lat:16.8, lng:-93.1  },
  { n: 'Ciudad Juarez, Chihuahua',   lat:31.7, lng:-106.5 },
  { n: 'Nuevo Laredo, Tamaulipas',   lat:27.5, lng:-99.5  },
  { n: 'Matamoros, Tamaulipas',      lat:25.9, lng:-97.5  },
  { n: 'Reynosa, Tamaulipas',        lat:26.1, lng:-98.3  },
  { n: 'Ensenada, Baja California',  lat:31.9, lng:-116.6 },
  { n: 'Villahermosa, Tabasco',      lat:18.0, lng:-92.9  },
  { n: 'Campeche, Campeche',         lat:19.9, lng:-90.5  },
  { n: 'Tepic, Nayarit',             lat:21.5, lng:-104.9 },
  { n: 'Zacatecas, Zacatecas',       lat:22.8, lng:-102.6 },
];
function getNombreZona(lat: number, lng: number): string {
  let minD = Infinity, nearest = 'Mexico';
  for (const z of GEO_ZONAS) {
    const d = Math.hypot(z.lat - lat, z.lng - lng);
    if (d < minD) { minD = d; nearest = z.n; }
  }
  return minD < 2.5 ? `Cerca de ${nearest}` : 'Zona rural de Mexico';
}

// Recomendaciones por canal y categoria
const REC_CANAL: Record<string, string[]> = {
  App:        ['Activa autenticacion biometrica en la app', 'Evita usar WiFi publico para transacciones', 'Revisa permisos de la app regularmente'],
  Cajero:     ['Cubre el teclado al ingresar tu NIP', 'Prefiere cajeros dentro de sucursales bancarias', 'Revisa que no haya dispositivos extraños en el lector'],
  POS:        ['Nunca pierdas de vista tu tarjeta al pagar', 'Verifica el monto antes de confirmar', 'Activa alertas de cargo en tiempo real'],
  Web:        ['Verifica que la URL empiece con https://', 'Usa tarjetas virtuales para compras en linea', 'No guardes datos de tarjeta en sitios desconocidos'],
  Ventanilla: ['Solicita identificacion al ejecutivo', 'Conserva todos tus comprobantes de operacion', 'No proporciones datos fuera de ventanilla oficial'],
};

function getRecomendaciones(canal: string, _categoria: string): string[] {
  return REC_CANAL[canal] ?? [
    'Monitorea tu estado de cuenta con frecuencia',
    'Reporta cargos no reconocidos de inmediato al banco',
    'Activa notificaciones push para cada transaccion',
  ];
}

// Fusiona puntos que caen a menos de minPx unidades SVG entre sí
function clusterGeoData(data: FraudeGeo[], minPx: number): FraudeGeo[] {
  const out: { x: number; y: number; d: FraudeGeo }[] = [];
  for (const item of [...data].sort((a, b) => b.total_fraudes - a.total_fraudes)) {
    const x = lngToX(item.lng);
    const y = latToY(item.lat);
    const hit = out.find(c => Math.hypot(c.x - x, c.y - y) < minPx);
    if (hit) {
      hit.d = {
        ...hit.d,
        total_fraudes: hit.d.total_fraudes + item.total_fraudes,
        monto_total:   hit.d.monto_total   + item.monto_total,
      };
    } else {
      out.push({ x, y, d: { ...item } });
    }
  }
  return out.map(c => c.d);
}

const CIUDADES_REF = [
  { nombre: 'CDMX',       lat: 19.43, lng: -99.13  },
  { nombre: 'GDL',        lat: 20.67, lng: -103.35 },
  { nombre: 'MTY',        lat: 25.67, lng: -100.32 },
  { nombre: 'TIJ',        lat: 32.53, lng: -117.0  },
  { nombre: 'MER',        lat: 20.97, lng: -89.62  },
];

function FraudeMapView({ data }: { data: FraudeGeo[] }) {
  const [selected, setSelected] = useState<FraudeGeo | null>(null);
  const clusters    = clusterGeoData(data, 22);
  const maxFraudes  = Math.max(...clusters.map(d => d.total_fraudes), 1);
  const chartW      = width - 64;
  const chartH      = (chartW / MAP_SVG_W) * MAP_SVG_H;
  const mainlandD   = coordsToPath(MEX_MAINLAND_COORDS);
  const bajaD       = coordsToPath(MEX_BAJA_COORDS);

  // Detecta toque en SVG: convierte coordenadas de pantalla a espacio viewBox
  const handleMapPress = (evt: any) => {
    const { locationX, locationY } = evt.nativeEvent;
    const svgX = (locationX / chartW)  * MAP_SVG_W;
    const svgY = (locationY / chartH) * MAP_SVG_H;
    const hit = clusters.find(cluster => {
      const ratio = cluster.total_fraudes / maxFraudes;
      const r = 6 + ratio * 18;
      return Math.hypot(lngToX(cluster.lng) - svgX, latToY(cluster.lat) - svgY) <= r + 4;
    });
    if (hit) setSelected(hit);
  };

  return (
    <View>
      <TouchableOpacity
        activeOpacity={1}
        onPress={handleMapPress}
        style={{ backgroundColor: '#dbeafe', borderRadius: 14, overflow: 'hidden' }}
      >
        <Svg width={chartW} height={chartH} viewBox={`0 0 ${MAP_SVG_W} ${MAP_SVG_H}`}>
          {/* Contorno de Mexico */}
          <Path d={mainlandD} fill="#dde8d0" stroke="#6b7280" strokeWidth="0.8" />
          <Path d={bajaD}     fill="#dde8d0" stroke="#6b7280" strokeWidth="0.8" />
          {/* Cuadricula sutil */}
          {[0.25, 0.5, 0.75].map((f, i) => (
            <React.Fragment key={i}>
              <Line x1={MAP_SVG_W * f} y1={0} x2={MAP_SVG_W * f} y2={MAP_SVG_H}
                stroke="#93c5fd" strokeWidth="0.6" opacity="0.6" />
              <Line x1={0} y1={MAP_SVG_H * f} x2={MAP_SVG_W} y2={MAP_SVG_H * f}
                stroke="#93c5fd" strokeWidth="0.6" opacity="0.6" />
            </React.Fragment>
          ))}

          {/* Clusters — sin onPress, el toque lo maneja TouchableOpacity */}
          {clusters.map((cluster, i) => {
            const ratio = cluster.total_fraudes / maxFraudes;
            const cx    = lngToX(cluster.lng);
            const cy    = latToY(cluster.lat);
            const r     = 6 + ratio * 18;
            const alpha = (0.55 + ratio * 0.45).toFixed(2);
            return (
              <Circle
                key={i}
                cx={cx} cy={cy} r={r}
                fill={`rgba(186,26,26,${alpha})`}
                stroke="#fff" strokeWidth="2"
              />
            );
          })}

          {/* Ciudades de referencia — encima de los clusters */}
          {CIUDADES_REF.map((city, i) => {
            const cx = lngToX(city.lng);
            const cy = latToY(city.lat);
            return (
              <React.Fragment key={i}>
                <Circle cx={cx} cy={cy} r={4} fill="#1d4ed8" stroke="#fff" strokeWidth="1.5" />
                <SvgText x={cx} y={cy - 7}
                  fontSize="7.5" fill="#1e3a8a" textAnchor="middle" fontWeight="700">
                  {city.nombre}
                </SvgText>
              </React.Fragment>
            );
          })}
        </Svg>
      </TouchableOpacity>

      {/* Leyenda */}
      <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 16, marginTop: 8 }}>
        {[
          { size: 8,  label: 'Pocos',  opacity: 0.55 },
          { size: 14, label: 'Medios', opacity: 0.75 },
          { size: 20, label: 'Muchos', opacity: 1    },
        ].map((leg, i) => (
          <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <View style={{ width: leg.size, height: leg.size, borderRadius: leg.size / 2,
              backgroundColor: '#ba1a1a', opacity: leg.opacity }} />
            <Text style={{ fontSize: 10, color: '#737781' }}>{leg.label}</Text>
          </View>
        ))}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#1d4ed8' }} />
          <Text style={{ fontSize: 10, color: '#737781' }}>Ciudad ref.</Text>
        </View>
      </View>
      <Text style={{ fontSize: 10, color: '#aaa', textAlign: 'center', marginTop: 4 }}>
        Toca un cluster rojo para ver el detalle
      </Text>

      {/* Bottom sheet modal con estadisticas + recomendaciones */}
      <Modal
        visible={selected !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setSelected(null)}
      >
        <View style={{ flex: 1, justifyContent: 'flex-end' }}>
          <TouchableOpacity
            style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' }}
            activeOpacity={1}
            onPress={() => setSelected(null)}
          />
          {selected && (
            <ScrollView
              style={s.geoSheet}
              contentContainerStyle={{ paddingBottom: 32 }}
              bounces={false}
              showsVerticalScrollIndicator={false}
            >
              <View style={s.geoSheetHandle} />

              {/* Cabecera */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <View style={{ width: 38, height: 38, borderRadius: 19,
                    backgroundColor: '#fbebeb', alignItems: 'center', justifyContent: 'center' }}>
                    <Ionicons name="location-outline" size={20} color="#ba1a1a" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.geoSheetTitle}>Cluster de Fraude</Text>
                    <Text style={{ fontSize: 11, color: '#737781' }} numberOfLines={1}>
                      {getNombreZona(selected.lat, selected.lng)}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity onPress={() => setSelected(null)}>
                  <Ionicons name="close-circle-outline" size={26} color="#737781" />
                </TouchableOpacity>
              </View>

              {/* Estadisticas */}
              {[
                { icon: 'alert-circle-outline',  label: 'Fraudes detectados', val: fmt(selected.total_fraudes),     color: '#ba1a1a' },
                { icon: 'cash-outline',           label: 'Monto total',        val: fmtMXN(selected.monto_total),    color: '#004481' },
                { icon: 'analytics-outline',      label: 'Monto promedio',     val: fmtMXN(selected.monto_promedio), color: '#1973B8' },
                { icon: 'pricetag-outline',       label: 'Categoria principal', val: selected.categoria_top,         color: '#00a278' },
                { icon: 'phone-portrait-outline', label: 'Canal principal',     val: selected.canal_top,             color: '#7c3aed' },
              ].map((row, i) => (
                <View key={i} style={s.geoSheetRow}>
                  <View style={[s.geoSheetIcon, { backgroundColor: row.color + '18' }]}>
                    <Ionicons name={row.icon as any} size={16} color={row.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.geoSheetRowLabel}>{row.label}</Text>
                    <Text style={s.geoSheetRowVal}>{row.val}</Text>
                  </View>
                </View>
              ))}

              {/* Recomendaciones de prevencion */}
              <View style={{ marginTop: 16, backgroundColor: '#f0f9f4', borderRadius: 14,
                padding: 14, borderLeftWidth: 3, borderLeftColor: '#00a278' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                  <Ionicons name="shield-checkmark-outline" size={16} color="#00a278" />
                  <Text style={{ fontSize: 13, fontWeight: '800', color: '#00a278' }}>
                    Como evitar este fraude
                  </Text>
                </View>
                {getRecomendaciones(selected.canal_top, selected.categoria_top).map((rec, i) => (
                  <View key={i} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>
                    <View style={{ width: 18, height: 18, borderRadius: 9, backgroundColor: '#00a278',
                      alignItems: 'center', justifyContent: 'center', marginTop: 1, flexShrink: 0 }}>
                      <Text style={{ color: '#fff', fontSize: 10, fontWeight: '800' }}>{i + 1}</Text>
                    </View>
                    <Text style={{ fontSize: 12, color: '#374151', lineHeight: 18, flex: 1 }}>{rec}</Text>
                  </View>
                ))}
              </View>
            </ScrollView>
          )}
        </View>
      </Modal>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────
//  TARJETA DE COMERCIO CON ACORDEN
// ─────────────────────────────────────────────────────────────
function ComercioCard({ item, idx, expandedId, setExpandedId }: {
  item: FraudeComercio;
  idx: number;
  expandedId: number | null;
  setExpandedId: (v: number | null) => void;
}) {
  const isExpanded = expandedId === idx;
  const fecha = item.ultima_alerta
    ? new Date(item.ultima_alerta).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
    : 'Sin alerta';

  return (
    <View style={s.comercioCard}>
      {/* Cabecera */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 }}>
        <View style={s.comercioIconBox}>
          <Ionicons name="storefront-outline" size={22} color="#004481" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.comercioName} numberOfLines={1}>{item.comercio}</Text>
          <View style={[s.badge, { backgroundColor: '#1973B8', alignSelf: 'flex-start' }]}>
            <Text style={s.badgeText}>{item.categoria.toUpperCase()}</Text>
          </View>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={s.comercioFraudes}>{fmt(item.total_fraudes)}</Text>
          <Text style={{ fontSize: 9, color: '#737781', fontWeight: '600' }}>fraudes</Text>
        </View>
      </View>

      {/* Stats visibles */}
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 10 }}>
        <View style={s.comercioStatBox}>
          <Text style={s.comercioStatLabel}>Monto total</Text>
          <Text style={s.comercioStatVal}>{fmtMXN(item.monto_total)}</Text>
        </View>
        <View style={s.comercioStatBox}>
          <Text style={s.comercioStatLabel}>Clientes afect.</Text>
          <Text style={s.comercioStatVal}>{fmt(item.clientes_afectados)}</Text>
        </View>
      </View>

      {/* Boton acorden */}
      <TouchableOpacity
        style={s.accordionBtn}
        onPress={() => setExpandedId(isExpanded ? null : idx)}
      >
        <Text style={s.accordionBtnText}>
          {isExpanded ? 'Ocultar detalle' : 'Ver detalle completo'}
        </Text>
        <Ionicons
          name={isExpanded ? 'chevron-up' : 'chevron-down'}
          size={16} color="#004481"
        />
      </TouchableOpacity>

      {/* Contenido expandido */}
      {isExpanded && (
        <View style={s.accordionContent}>
          {[
            { icon: 'analytics-outline', label: 'Monto promedio',     val: fmtMXN(item.monto_promedio),  color: '#1973B8' },
            { icon: 'people-outline',    label: 'Clientes afectados', val: fmt(item.clientes_afectados), color: '#7c3aed' },
            { icon: 'time-outline',      label: 'Ultima alerta',      val: fecha,                        color: '#ba1a1a' },
          ].map((row, i) => (
            <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 10,
              paddingVertical: 6, borderBottomWidth: i < 2 ? 1 : 0, borderBottomColor: '#f0f2f5' }}>
              <Ionicons name={row.icon as any} size={14} color={row.color} />
              <Text style={{ fontSize: 12, color: '#5d5f5f', flex: 1 }}>{row.label}</Text>
              <Text style={{ fontSize: 12, fontWeight: '700', color: '#1a1c1c' }}>{row.val}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────
//  PANTALLA PRINCIPAL
// ─────────────────────────────────────────────────────────────
export default function Dashboard() {
  const insets  = useSafeAreaInsets();
  const router  = useRouter();
  const logout  = useAuthStore((s) => s.logout);

  const [activeTab, setActiveTab]     = useState<'Inicio' | 'KPIs' | 'Reportes' | 'Debilidades'>('Inicio');
  const [hideAmounts, setHideAmounts] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [reportHistory, setReportHistory] = useState<{ name: string; date: string; uri: string }[]>([]);
  const [incKpi, setIncKpi]     = useState(true);
  const [incFraud, setIncFraud] = useState(true);
  const [incDeb, setIncDeb]     = useState(true);
  const [incRec, setIncRec]     = useState(true);
  const [incGraph, setIncGraph] = useState(true);
  const [expandedDebId, setExpandedDebId]         = useState<number | null>(null);
  const [expandedComercioId, setExpandedComercioId] = useState<number | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<string>(
    new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
  );

  // ── Queries con caché de 5 min ───────────────────────────────
  const { data: kpisResumen,     refetch: rKpisResumen     } = useQuery({ queryKey: ['kpis-resumen'],   queryFn: dashboardService.getKpisResumen,    staleTime: STALE });
  const { data: etlResumen,      refetch: rEtl             } = useQuery({ queryKey: ['etl-resumen'],    queryFn: dashboardService.getEtlResumen,     staleTime: STALE });
  const { data: debilidadesData, refetch: rDebilidades     } = useQuery({ queryKey: ['debilidades'],    queryFn: dashboardService.getDebilidades,    staleTime: STALE });

  const { data: fraudePorCanal     = [], refetch: rCanal    } = useQuery({ queryKey: ['fraude-canal'],     queryFn: dashboardService.getFraudePorCanal,     staleTime: STALE });
  const { data: fraudePorCategoria = [], refetch: rCategoria} = useQuery({ queryKey: ['fraude-categoria'], queryFn: dashboardService.getFraudePorCategoria, staleTime: STALE });
  const { data: fraudePorMes       = [], refetch: rMes      } = useQuery({ queryKey: ['fraude-mes'],       queryFn: dashboardService.getFraudePorMes,       staleTime: STALE });

  const { data: segmentos    = [], isLoading: loadSeg,   refetch: rSeg    } = useQuery({ queryKey: ['kpis-segmentos'], queryFn: dashboardService.getClientesPorSegmento, staleTime: STALE });
  const { data: generos      = [], isLoading: loadGen,   refetch: rGen    } = useQuery({ queryKey: ['kpis-generos'],   queryFn: dashboardService.getClientesPorGenero,   staleTime: STALE });
  const { data: tendencia    = [], isLoading: loadTend,  refetch: rTend   } = useQuery({ queryKey: ['kpis-tendencia'], queryFn: dashboardService.getTendencia,           staleTime: STALE });
  const { data: prestamos    = [], isLoading: loadPrest, refetch: rPrest  } = useQuery({ queryKey: ['kpis-prestamos'], queryFn: dashboardService.getPrestamosPorTipo,    staleTime: STALE });
  const { data: saldoCuentas = [], isLoading: loadSaldo, refetch: rSaldo  } = useQuery({ queryKey: ['kpis-saldo'],     queryFn: dashboardService.getSaldoPorTipoCuenta,  staleTime: STALE });
  const { data: scores       = [], isLoading: loadScore, refetch: rScores } = useQuery({ queryKey: ['kpis-scores'],    queryFn: dashboardService.getScoreCrediticio,     staleTime: STALE });
  const { data: cobrosExc    = [], isLoading: loadCob,   refetch: rCobros } = useQuery({ queryKey: ['kpis-cobros'],    queryFn: dashboardService.getCobrosExcedidos,     staleTime: STALE });
  const { data: fraudeGeo      = [], isLoading: loadGeo, refetch: rGeo    } = useQuery({ queryKey: ['fraude-geo'],      queryFn: dashboardService.getFraudeGeografico,  staleTime: STALE });
  const { data: fraudeComercio = [], isLoading: loadCom, refetch: rCom    } = useQuery({ queryKey: ['fraude-comercio'], queryFn: dashboardService.getFraudePorComercio,  staleTime: STALE });

  // ── Pull-to-refresh ──────────────────────────────────────────
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      rKpisResumen(), rEtl(), rDebilidades(),
      rCanal(), rCategoria(), rMes(),
      rSeg(), rGen(), rTend(), rPrest(), rSaldo(), rScores(), rCobros(),
      rGeo(), rCom(),
    ]);
    setLastUpdate(new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }));
    setRefreshing(false);
  }, []);

  // ── Datos derivados ──────────────────────────────────────────
  const donutFraude: Segment[] = fraudePorCanal.map(d => ({
    percentage: Math.round(d.porcentaje * 10) / 10,
    color: CANAL_COLORS[d.canal] ?? '#737781', label: d.canal,
  }));

  const totalSeg = segmentos.reduce((a, s) => a + s.total, 0);
  const donutSeg: Segment[] = segmentos.map((s, i) => ({
    label: s.segmento, total: s.total,
    percentage: totalSeg > 0 ? Math.round((s.total / totalSeg) * 1000) / 10 : 0,
    color: PALETTE[i % PALETTE.length],
  }));

  const totalGen = generos.reduce((a, g) => a + g.total, 0);
  const donutGen: Segment[] = generos.map((g, i) => ({
    label: g.genero, total: g.total,
    percentage: totalGen > 0 ? Math.round((g.total / totalGen) * 1000) / 10 : 0,
    color: ['#004481','#48A9E6'][i % 2],
  }));

  const maxFraudes  = Math.max(...fraudePorCategoria.map(d => d.total_fraudes), 1);
  const soluciones  = debilidadesData?.soluciones ?? [];
  const indicadores = debilidadesData?.debilidades;
  const altaCount   = soluciones.filter(s => s.prioridad === 'Alta').length;
  const val = (v: string | number | undefined) => v !== undefined ? String(v) : '...';

  // ── Descarga PDF ─────────────────────────────────────────────
  const handleDownloadPDF = async () => {
    try {
      setDownloading(true);
      const token    = useAuthStore.getState().accessToken;
      const fileName = `reporte-bbva-${Date.now()}.pdf`;
      const fileUri  = FileSystem.documentDirectory + fileName;
      const params   = new URLSearchParams({
        kpis: String(incKpi), fraude: String(incFraud),
        debilidades: String(incDeb), recomendaciones: String(incRec), graficas: String(incGraph),
      });
      const result = await FileSystem.downloadAsync(
        `${process.env.EXPO_PUBLIC_API_URL}/reportes/kpis?${params}`,
        fileUri, { headers: { Authorization: `Bearer ${token}` } },
      );
      if (result.status === 200) {
        const fecha = new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
        setReportHistory(prev => [{ name: fileName, date: fecha, uri: result.uri }, ...prev]);
        const canShare = await Sharing.isAvailableAsync();
        if (canShare) await Sharing.shareAsync(result.uri, { mimeType: 'application/pdf' });
        else Alert.alert('Descargado', `PDF guardado en: ${result.uri}`);
      } else { Alert.alert('Error', 'El servidor no pudo generar el reporte.'); }
    } catch { Alert.alert('Error', 'No se pudo descargar. Verifica la conexión.'); }
    finally  { setDownloading(false); }
  };

  const handleLogout = async () => { await logout(); router.replace('/(auth)/welcome'); };

  // ─────────────────────────────────────────────────────────────
  return (
    <View style={[s.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      <View style={s.header}>
        <TouchableOpacity style={s.headerBtn} onPress={() => setHideAmounts(!hideAmounts)}>
          <Ionicons name={hideAmounts ? 'eye-off-outline' : 'eye-outline'} size={24} color="#004481" />
        </TouchableOpacity>
        <View style={{ alignItems: 'center' }}>
          <Text style={s.headerTitle}>BBVA</Text>
          <Text style={s.headerTimestamp}>Act. {lastUpdate}</Text>
        </View>
        <TouchableOpacity style={s.headerBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={24} color="#004481" />
        </TouchableOpacity>
      </View>

      <View style={{ flex: 1 }}>

        {/* ══ INICIO ══════════════════════════════════════════════ */}
        {activeTab === 'Inicio' && (
          <ScrollView style={s.scrollBody} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#004481']} tintColor="#004481" />}>
            <View style={s.bannerCard}>
              <Text style={s.bannerTitle}>Hola, Admin</Text>
              <Text style={s.bannerSub}>Panel de análisis BBVA</Text>
            </View>

            <Text style={s.sectionTitle}>Indicadores Generales</Text>
            <View style={s.kpiGrid}>
              {[
                { icon: 'people-outline',         label: 'Total Clientes',      val: kpisResumen && fmt(kpisResumen.totalClientes),            trend: 'up',   txt: 'Registrados' },
                { icon: 'checkmark-circle-outline',label: 'Cuentas Activas',    val: kpisResumen && fmt(kpisResumen.cuentasActivas),           trend: 'up',   txt: 'Vigentes' },
                { icon: 'cash-outline',            label: 'Saldo Total',        val: kpisResumen && fmtMXN(kpisResumen.saldoTotalCuentas),     trend: 'up',   txt: 'Cuentas act.' },
                { icon: 'trending-up-outline',     label: 'Txs Hoy',            val: kpisResumen && fmt(kpisResumen.transaccionesHoy),         trend: 'up',   txt: 'Último día' },
                { icon: 'document-text-outline',   label: 'Préstamos Vigentes', val: kpisResumen && fmt(kpisResumen.prestamosActivos),         trend: 'up',   txt: 'Activos' },
                { icon: 'wallet-outline',          label: 'Cartera Préstamos',  val: kpisResumen && fmtMXN(kpisResumen.montoPrestamosVigentes),trend: 'up',   txt: 'Vigente' },
                { icon: 'shield-outline',          label: 'Alertas Fraude',     val: kpisResumen && fmt(kpisResumen.fraudesPotenciales),       trend: 'down', txt: 'Potenciales' },
                { icon: 'alert-circle-outline',    label: 'Cobros Excedidos',   val: kpisResumen && fmt(kpisResumen.cobrosExcedidos),          trend: 'warn', txt: 'Exceden límite' },
              ].map((kpi, i) => {
                const tc = kpi.trend === 'up' ? '#00a278' : kpi.trend === 'down' ? '#ba1a1a' : '#fbbd08';
                const ti = kpi.trend === 'up' ? 'trending-up' : kpi.trend === 'down' ? 'trending-down' : 'alert-circle-outline';
                return (
                  <View key={i} style={s.kpiCard}>
                    <View style={s.kpiHeaderRow}>
                      <View style={s.iconWrapper}>
                        <Ionicons name={kpi.icon as any} size={18} color="#004481" />
                      </View>
                    </View>
                    <Text style={s.kpiValue}>{hideAmounts ? '•••••' : val(kpi.val ?? undefined)}</Text>
                    <Text style={s.kpiLabel}>{kpi.label}</Text>
                    <View style={s.trendRow}>
                      <Ionicons name={ti as any} size={12} color={tc} />
                      <Text style={[s.trendText, { color: tc }]}>{kpi.txt}</Text>
                    </View>
                  </View>
                );
              })}
            </View>

            <Text style={s.sectionTitle}>Análisis rápido</Text>
            <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false}
              style={s.carousel} contentContainerStyle={{ paddingRight: 20 }}>

              <View style={s.carouselCard}>
                <Text style={s.carouselTitle}>Fraude por canal</Text>
                <Text style={s.carouselSub}>Distribución porcentual</Text>
                {donutFraude.length > 0
                  ? <DonutChart segments={donutFraude} />
                  : <ActivityIndicator color="#004481" style={{ marginVertical: 30 }} />}
              </View>

              <View style={s.carouselCard}>
                <Text style={s.carouselTitle}>Top Categorías</Text>
                <Text style={s.carouselSub}>Mayor número de fraudes</Text>
                {fraudePorCategoria.length > 0
                  ? <AnimatedBarChart
                      data={fraudePorCategoria.slice(0, 3).map(d => ({ label: d.categoria, value: d.total_fraudes }))}
                      colorFn={(i) => ['#ba1a1a','#fbbd08','#00a86b'][i]}
                      valueFormatter={(v) => hideAmounts ? '••••' : fmt(v)}
                    />
                  : <ActivityIndicator color="#004481" style={{ marginVertical: 20 }} />}
              </View>

              <View style={s.carouselCard}>
                <Text style={s.carouselTitle}>Pipeline ETL</Text>
                <Text style={s.carouselSub}>Resumen de análisis de fraude</Text>
                {etlResumen ? (
                  <View style={{ gap: 8, marginTop: 4 }}>
                    {[
                      { label: 'Txs analizadas',   val: fmt(etlResumen.total_transacciones) },
                      { label: 'Fraudes',           val: fmt(etlResumen.total_fraudes) },
                      { label: 'Tasa de fraude',    val: `${etlResumen.tasa_fraude_pct?.toFixed(2)}%` },
                      { label: 'Monto en riesgo',   val: hideAmounts ? '•••••' : fmtMXN(etlResumen.monto_total_fraude) },
                    ].map((row, i) => (
                      <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between',
                        borderBottomWidth: 1, borderBottomColor: '#f0f2f5', paddingBottom: 6 }}>
                        <Text style={{ fontSize: 12, color: '#5d5f5f' }}>{row.label}</Text>
                        <Text style={{ fontSize: 12, fontWeight: '700', color: '#1a1c1c' }}>{row.val}</Text>
                      </View>
                    ))}
                  </View>
                ) : <ActivityIndicator color="#004481" style={{ marginVertical: 20 }} />}
              </View>
            </ScrollView>

            <Text style={s.sectionTitle}>Alertas de riesgo</Text>
            {soluciones.slice(0, 2).map((sol, idx) => (
              <View key={idx} style={s.debCard}>
                <View style={s.debIconBox}>
                  <Ionicons name={(AREA_ICONS[sol.area] ?? 'alert-circle-outline') as any} size={22} color="#ba1a1a" />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={[s.badge, { backgroundColor: PRIORIDAD_COLOR[sol.prioridad] }]}>
                    <Text style={s.badgeText}>{sol.prioridad.toUpperCase()}</Text>
                  </View>
                  <Text style={s.debTitle}>{sol.problema}</Text>
                  <Text style={s.debDesc}>{sol.solucion}</Text>
                  <TouchableOpacity style={s.solLink} onPress={() => setActiveTab('Debilidades')}>
                    <Text style={s.solLinkTxt}>Ver solución</Text>
                    <Ionicons name="chevron-forward" size={13} color="#004481" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
            {!debilidadesData && <ActivityIndicator color="#004481" style={{ marginVertical: 20 }} />}
            {debilidadesData && soluciones.length === 0 && (
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginVertical: 12 }}>
                <Ionicons name="checkmark-circle-outline" size={18} color="#00a278" />
                <Text style={{ color: '#00a278', fontWeight: '600' }}>Sin debilidades críticas detectadas</Text>
              </View>
            )}
            <View style={{ height: 40 }} />
          </ScrollView>
        )}

        {/* ══ KPIs ════════════════════════════════════════════════ */}
        {activeTab === 'KPIs' && (
          <ScrollView style={s.scrollBody} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#004481']} tintColor="#004481" />}>
            <Text style={s.tabMainTitle}>Indicadores Clave</Text>
            <Text style={s.tabSubtitle}>Toca las barras para más detalle · Desliza la línea para ver valores</Text>

            <Text style={s.sectionHeader}>TRANSACCIONES</Text>

            <View style={s.kpiDetailCard}>
              <Text style={s.cardTitle}>Tendencia mensual de fraudes</Text>
              <Text style={s.cardSubtitle}>{fraudePorMes.length} meses</Text>
              {fraudePorMes.length > 0
                ? <InteractiveLineChart
                    data={fraudePorMes.map((d: FraudePorMes) => ({ label: d.año_mes.substring(5), value: d.total_fraudes }))}
                    color="#ba1a1a" valueFormatter={fmt}
                  />
                : <SkeletonCard height={160} lines={2} />}
            </View>

            <View style={s.kpiDetailCard}>
              <Text style={s.cardTitle}>Tendencia de transacciones (12 meses)</Text>
              <Text style={s.cardSubtitle}>Volumen total · Toca para ver detalle</Text>
              {loadTend
                ? <SkeletonCard height={200} lines={4} />
                : <InteractiveLineChart
                    data={tendencia.map((t: TendenciaMes) => ({ label: t.mes.substring(5), value: t.total }))}
                    color="#004481" valueFormatter={fmt}
                  />}
            </View>

            <View style={s.kpiDetailCard}>
              <Text style={s.cardTitle}>Fraude por categoría</Text>
              <Text style={s.cardSubtitle}>Toca una barra para ver el detalle</Text>
              {fraudePorCategoria.length > 0
                ? <AnimatedBarChart
                    data={fraudePorCategoria.slice(0, 8).map(d => ({ label: d.categoria, value: d.total_fraudes }))}
                    colorFn={() => '#ba1a1a'} valueFormatter={fmt}
                  />
                : <SkeletonCard lines={5} />}
            </View>

            <Text style={s.sectionHeader}>CLIENTES</Text>
            <View style={s.sideBySideRow}>
              <View style={s.halfCard}>
                <Text style={s.halfCardTitle}>Por segmento</Text>
                {loadSeg
                  ? <ActivityIndicator color="#004481" style={{ marginVertical: 20 }} />
                  : <DonutChart segments={donutSeg} size="small" />}
              </View>
              <View style={s.halfCard}>
                <Text style={s.halfCardTitle}>Por género</Text>
                {loadGen
                  ? <ActivityIndicator color="#004481" style={{ marginVertical: 20 }} />
                  : <DonutChart segments={donutGen} size="small" />}
              </View>
            </View>

            <Text style={s.sectionHeader}>PRÉSTAMOS</Text>
            <View style={s.kpiDetailCard}>
              <Text style={s.cardTitle}>Préstamos por tipo</Text>
              <Text style={s.cardSubtitle}>Toca para ver detalle</Text>
              {loadPrest
                ? <SkeletonCard lines={4} />
                : <AnimatedBarChart
                    data={prestamos.map((p: PrestamosPorTipo) => ({ label: p.tipo, value: p.total }))}
                    colorFn={(i) => PALETTE[i % PALETTE.length]} valueFormatter={fmt}
                  />}
            </View>

            <Text style={s.sectionHeader}>CUENTAS</Text>
            <View style={s.kpiDetailCard}>
              <Text style={s.cardTitle}>Saldo por tipo de cuenta</Text>
              {loadSaldo
                ? <SkeletonCard lines={3} />
                : <AnimatedBarChart
                    data={saldoCuentas.map((c: SaldoPorTipoCuenta) => ({ label: c.tipo, value: Number(c.saldo_total) }))}
                    colorFn={(i) => PALETTE[i % PALETTE.length]}
                    valueFormatter={(v) => hideAmounts ? '•••••' : fmtMXN(v)}
                  />}
            </View>

            <View style={s.kpiDetailCard}>
              <Text style={s.cardTitle}>Distribución de Score Crediticio</Text>
              {loadScore
                ? <SkeletonCard lines={4} />
                : <AnimatedBarChart
                    data={scores.map((sc: ScoreCrediticio) => ({ label: sc.rango, value: sc.total }))}
                    colorFn={(i) => ['#ba1a1a','#fbbd08','#1973B8','#00a278'][i % 4]} valueFormatter={fmt}
                  />}
            </View>

            <Text style={s.sectionHeader}>COMISIONES</Text>
            <View style={s.kpiDetailCard}>
              <Text style={s.cardTitle}>Cobros excedidos por tipo</Text>
              {loadCob
                ? <SkeletonCard lines={3} />
                : cobrosExc.length > 0
                  ? <AnimatedBarChart
                      data={cobrosExc.map((c: CobrosExcedidos) => ({ label: c.tipo, value: c.total }))}
                      colorFn={() => '#ba1a1a'} valueFormatter={fmt}
                    />
                  : <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginVertical: 16 }}>
                      <Ionicons name="checkmark-circle-outline" size={16} color="#00a278" />
                      <Text style={{ color: '#00a278', fontWeight: '600' }}>Sin cobros excedidos</Text>
                    </View>}
            </View>

            <Text style={s.sectionHeader}>ETL PIPELINE</Text>
            <View style={s.kpiDetailCard}>
              <Text style={s.cardTitle}>Resumen análisis de fraude</Text>
              {etlResumen ? (
                <View style={{ gap: 10, marginTop: 8 }}>
                  {[
                    { label: 'Transacciones analizadas', val: fmt(etlResumen.total_transacciones) },
                    { label: 'Fraudes detectados',       val: fmt(etlResumen.total_fraudes) },
                    { label: 'Tasa de fraude',           val: `${etlResumen.tasa_fraude_pct?.toFixed(2)}%` },
                    { label: 'Monto total en riesgo',    val: fmtMXN(etlResumen.monto_total_fraude) },
                    { label: 'Monto promedio/fraude',    val: fmtMXN(etlResumen.monto_promedio_fraude) },
                    { label: 'Monto máximo',             val: fmtMXN(etlResumen.monto_maximo_fraude) },
                  ].map((row, i) => (
                    <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between',
                      borderBottomWidth: 1, borderBottomColor: '#f0f2f5', paddingBottom: 8 }}>
                      <Text style={{ fontSize: 13, color: '#5d5f5f', flex: 1 }}>{row.label}</Text>
                      <Text style={{ fontSize: 13, fontWeight: '700', color: '#1a1c1c' }}>
                        {hideAmounts && row.label.includes('onto') ? '•••••' : row.val}
                      </Text>
                    </View>
                  ))}
                </View>
              ) : <SkeletonCard lines={5} />}
            </View>

            <Text style={s.sectionHeader}>GEOGRAFIA</Text>
            <View style={s.kpiDetailCard}>
              <Text style={s.cardTitle}>Mapa de fraude por zona</Text>
              <Text style={s.cardSubtitle}>Tamano proporcional al numero de fraudes · Toca para ver detalle</Text>
              {loadGeo
                ? <SkeletonCard height={220} lines={3} />
                : fraudeGeo.length > 0
                  ? <FraudeMapView data={fraudeGeo} />
                  : (
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginVertical: 16 }}>
                      <Ionicons name="map-outline" size={16} color="#aaa" />
                      <Text style={{ color: '#aaa', fontWeight: '600' }}>Sin datos geograficos</Text>
                    </View>
                  )}
            </View>

            <Text style={s.sectionHeader}>COMERCIOS</Text>
            {loadCom
              ? <>{[1, 2, 3].map(i => <SkeletonCard key={i} height={130} lines={3} />)}</>
              : fraudeComercio.length > 0
                ? fraudeComercio.map((item, idx) => (
                    <ComercioCard
                      key={idx}
                      item={item}
                      idx={idx}
                      expandedId={expandedComercioId}
                      setExpandedId={setExpandedComercioId}
                    />
                  ))
                : (
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginVertical: 16 }}>
                    <Ionicons name="storefront-outline" size={16} color="#aaa" />
                    <Text style={{ color: '#aaa', fontWeight: '600' }}>Sin datos de comercios</Text>
                  </View>
                )}

            <View style={{ height: 40 }} />
          </ScrollView>
        )}

        {/* ══ REPORTES ════════════════════════════════════════════ */}
        {activeTab === 'Reportes' && (
          <ScrollView style={s.scrollBody} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#004481']} tintColor="#004481" />}>
            <Text style={s.tabMainTitle}>Reportes</Text>
            <Text style={s.tabSubtitle}>Genera y descarga informes ejecutivos</Text>
            <View style={s.reportHeroCard}>
              <Text style={s.heroTitle}>Reporte Ejecutivo de KPIs</Text>
              <Text style={s.heroSubtitle}>Fraude · Debilidades · Soluciones</Text>
              <Text style={s.heroDesc}>Informe con análisis completo del pipeline ETL, alertas y recomendaciones.</Text>
              <TouchableOpacity style={[s.heroBtn, downloading && { opacity: 0.7 }]}
                onPress={handleDownloadPDF} disabled={downloading} activeOpacity={0.9}>
                {downloading
                  ? <ActivityIndicator color="#004481" style={{ marginRight: 8 }} />
                  : <Ionicons name="download-outline" size={20} color="#004481" style={{ marginRight: 8 }} />}
                <Text style={s.heroBtnTxt}>{downloading ? 'Generando PDF...' : 'Generar y Descargar PDF'}</Text>
              </TouchableOpacity>
              <View style={s.heroTagRow}>
                {['Incluye gráficas','Análisis automático','Soluciones'].map((tag, i) => (
                  <View key={i} style={s.heroTag}><Text style={s.heroTagTxt}>{tag}</Text></View>
                ))}
              </View>
            </View>

            {reportHistory.length > 0 && (
              <>
                <Text style={s.sectionHeader}>REPORTES GENERADOS</Text>
                {reportHistory.map((rep, idx) => (
                  <TouchableOpacity key={idx} style={s.repListItem} activeOpacity={0.8}
                    onPress={async () => {
                      const ok = await Sharing.isAvailableAsync();
                      if (ok) await Sharing.shareAsync(rep.uri, { mimeType: 'application/pdf' });
                    }}>
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
                { label: 'KPIs generales',         val: incKpi,   set: setIncKpi },
                { label: 'Análisis de fraude',      val: incFraud, set: setIncFraud },
                { label: 'Debilidades detectadas',  val: incDeb,   set: setIncDeb },
                { label: 'Recomendaciones',         val: incRec,   set: setIncRec },
                { label: 'Gráficas',                val: incGraph, set: setIncGraph },
              ].map((row, i, arr) => (
                <View key={i} style={[s.customRow, i === arr.length - 1 && { borderBottomWidth: 0, paddingBottom: 0 }]}>
                  <Text style={s.customRowLabel}>{row.label}</Text>
                  <Switch value={row.val} onValueChange={row.set}
                    trackColor={{ false: '#d1d5db', true: '#004481' }} thumbColor="#fff" />
                </View>
              ))}
            </View>
            <View style={{ height: 40 }} />
          </ScrollView>
        )}

        {/* ══ DEBILIDADES ═════════════════════════════════════════ */}
        {activeTab === 'Debilidades' && (
          <ScrollView style={s.scrollBody} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#004481']} tintColor="#004481" />}>
            <Text style={s.tabMainTitle}>Debilidades Detectadas</Text>
            <Text style={s.tabSubtitle}>Análisis automático basado en datos reales</Text>

            <LinearGradient colors={['#ba1a1a','#ff9900']} start={{ x: 0, y: 1 }} end={{ x: 1, y: 0 }} style={s.alertBanner}>
              <View style={s.alertBannerHeader}>
                <Ionicons name="warning-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
                <Text style={s.alertBannerText}>
                  {debilidadesData
                    ? `${altaCount} debilidad${altaCount !== 1 ? 'es' : ''} crítica${altaCount !== 1 ? 's' : ''} encontrada${altaCount !== 1 ? 's' : ''}`
                    : 'Analizando sistema...'}
                </Text>
              </View>
              <Text style={s.alertBannerAmount}>
                {hideAmounts ? '•••••••••' : etlResumen ? `${fmtMXN(etlResumen.monto_total_fraude)} en riesgo` : '...'}
              </Text>
            </LinearGradient>

            <Text style={s.sectionHeader}>INDICADORES DE RIESGO</Text>
            {!debilidadesData
              ? <>{[1,2,3,4,5].map(i => <SkeletonCard key={i} height={90} lines={2} />)}</>
              : indicadores && (
                <View style={{ gap: 10 }}>
                  <RiskIndicator label="Fraude Potencial"        value={indicadores.porcentajeFraudePotencial}   umbral={UMBRALES.porcentajeFraudePotencial}   icon="shield-outline" />
                  <RiskIndicator label="Cobros Excedidos"        value={indicadores.porcentajeCobrosExcedidos}   umbral={UMBRALES.porcentajeCobrosExcedidos}   icon="business-outline" />
                  <RiskIndicator label="Cuentas Canceladas"      value={indicadores.porcentajeCuentasCanceladas} umbral={UMBRALES.porcentajeCuentasCanceladas} icon="close-circle-outline" />
                  <RiskIndicator label="Préstamos Vencidos"      value={indicadores.porcentajePrestamosVencidos} umbral={UMBRALES.porcentajePrestamosVencidos} icon="card-outline" />
                  <RiskIndicator label="Metas de Ahorro Fallidas" value={indicadores.porcentajeMetasFallidas}   umbral={UMBRALES.porcentajeMetasFallidas}     icon="wallet-outline" />
                </View>
              )}

            {soluciones.length > 0 && (
              <>
                <Text style={[s.sectionHeader, { marginTop: 24 }]}>PLANES DE ACCIÓN</Text>
                {soluciones.map((sol, idx) => (
                  <DebCard key={idx} sol={sol} idx={idx}
                    expandedId={expandedDebId} setExpandedId={setExpandedDebId} />
                ))}
              </>
            )}

            {debilidadesData && soluciones.length === 0 && (
              <View style={{ alignItems: 'center', paddingVertical: 32 }}>
                <Ionicons name="checkmark-circle-outline" size={56} color="#00a278" />
                <Text style={{ fontSize: 16, fontWeight: '700', color: '#00a278', marginTop: 10 }}>
                  Sin debilidades críticas
                </Text>
                <Text style={{ fontSize: 13, color: '#5d5f5f', marginTop: 6, textAlign: 'center' }}>
                  Todos los indicadores están dentro de los parámetros aceptables.
                </Text>
              </View>
            )}
            <View style={{ height: 40 }} />
          </ScrollView>
        )}
      </View>

      {/* ── Tab Bar ── */}
      <View style={s.tabBar}>
        {([
          { key: 'Inicio',      icon: 'home',          iconO: 'home-outline' },
          { key: 'KPIs',        icon: 'bar-chart',     iconO: 'bar-chart-outline' },
          { key: 'Reportes',    icon: 'document-text', iconO: 'document-text-outline' },
          { key: 'Debilidades', icon: 'warning',       iconO: 'warning-outline', badge: altaCount },
        ] as const).map(tab => (
          <TouchableOpacity key={tab.key} style={s.tabItem} onPress={() => setActiveTab(tab.key as any)}>
            <View>
              <Ionicons name={(activeTab === tab.key ? tab.icon : tab.iconO) as any}
                size={22} color={activeTab === tab.key ? '#004481' : '#737781'} />
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

// ─────────────────────────────────────────────────────────────
//  ESTILOS
// ─────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root:             { flex: 1, backgroundColor: '#f4f6fa' },
  header:           { height: 60, backgroundColor: '#fff', flexDirection: 'row',
                      justifyContent: 'space-between', alignItems: 'center',
                      paddingHorizontal: 16, borderBottomWidth: 1,
                      borderBottomColor: 'rgba(194,198,210,0.3)', elevation: 1 },
  headerBtn:        { padding: 8 },
  headerTitle:      { fontSize: 22, fontWeight: '800', color: '#004481', letterSpacing: 0.8 },
  headerTimestamp:  { fontSize: 10, color: '#737781', marginTop: 1 },
  scrollBody:       { flex: 1 },
  scrollContent:    { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 24 },
  bannerCard:       { backgroundColor: '#004481', borderRadius: 16, padding: 20, marginBottom: 20, elevation: 4 },
  bannerTitle:      { fontSize: 24, fontWeight: '700', color: '#fff', marginBottom: 4 },
  bannerSub:        { fontSize: 14, color: 'rgba(255,255,255,0.8)', fontWeight: '500' },
  kpiGrid:          { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 10, marginBottom: 24 },
  kpiCard:          { backgroundColor: '#fff', borderRadius: 14, padding: 14,
                      width: (width - 42) / 2, borderWidth: 1,
                      borderColor: 'rgba(194,198,210,0.4)', elevation: 2 },
  kpiHeaderRow:     { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  iconWrapper:      { width: 34, height: 34, borderRadius: 17, backgroundColor: '#e8effa',
                      alignItems: 'center', justifyContent: 'center' },
  kpiValue:         { fontSize: 18, fontWeight: '800', color: '#1a1c1c', marginBottom: 2 },
  kpiLabel:         { fontSize: 11, fontWeight: '600', color: '#737781', marginBottom: 6 },
  trendRow:         { flexDirection: 'row', alignItems: 'center', gap: 3 },
  trendText:        { fontSize: 10, fontWeight: '700' },
  sectionTitle:     { fontSize: 18, fontWeight: '800', color: '#002e5a', marginTop: 8, marginBottom: 14 },
  carousel:         { marginBottom: 24 },
  carouselCard:     { backgroundColor: '#fff', borderRadius: 16, padding: 18,
                      width: width - 52, marginRight: 16, borderWidth: 1,
                      borderColor: 'rgba(194,198,210,0.4)', elevation: 2 },
  carouselTitle:    { fontSize: 16, fontWeight: '700', color: '#1a1c1c', marginBottom: 2 },
  carouselSub:      { fontSize: 12, color: '#737781', marginBottom: 10 },
  debCard:          { backgroundColor: '#fff', borderRadius: 16, padding: 16,
                      flexDirection: 'row', gap: 14, marginBottom: 14, borderWidth: 1,
                      borderColor: 'rgba(194,198,210,0.4)', elevation: 2 },
  debIconBox:       { width: 44, height: 44, borderRadius: 22, backgroundColor: '#fbebeb',
                      alignItems: 'center', justifyContent: 'center' },
  badge:            { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2, marginBottom: 6, alignSelf: 'flex-start' },
  badgeText:        { fontSize: 10, fontWeight: '800', color: '#fff', letterSpacing: 0.5 },
  debTitle:         { fontSize: 14, fontWeight: '700', color: '#1a1c1c', marginBottom: 4, lineHeight: 20 },
  debDesc:          { fontSize: 12, color: '#5d5f5f', lineHeight: 17, marginBottom: 8 },
  solLink:          { flexDirection: 'row', alignItems: 'center', gap: 4 },
  solLinkTxt:       { fontSize: 12, fontWeight: '700', color: '#004481' },
  riskCard:         { borderRadius: 14, padding: 14, borderWidth: 1 },
  tabBar:           { height: 62, backgroundColor: '#fff', flexDirection: 'row',
                      justifyContent: 'space-around', alignItems: 'center',
                      borderTopWidth: 1, borderTopColor: 'rgba(194,198,210,0.3)', elevation: 5 },
  tabItem:          { alignItems: 'center', justifyContent: 'center', paddingVertical: 4 },
  tabLabel:         { fontSize: 10, fontWeight: '600', marginTop: 4 },
  badgeBadge:       { position: 'absolute', right: -6, top: -4, backgroundColor: '#ba1a1a',
                      borderRadius: 8, minWidth: 16, height: 16,
                      alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 },
  badgeBadgeTxt:    { color: '#fff', fontSize: 9, fontWeight: '800' },
  tabMainTitle:     { fontSize: 22, fontWeight: '800', color: '#002e5a', marginBottom: 4 },
  tabSubtitle:      { fontSize: 12, color: '#5d5f5f', lineHeight: 18, marginBottom: 20 },
  sectionHeader:    { fontSize: 11, fontWeight: '800', color: '#737781', letterSpacing: 1.5, marginTop: 20, marginBottom: 10 },
  kpiDetailCard:    { backgroundColor: '#fff', borderRadius: 16, padding: 18,
                      marginBottom: 14, borderWidth: 1, borderColor: 'rgba(194,198,210,0.4)', elevation: 2 },
  cardTitle:        { fontSize: 15, fontWeight: '700', color: '#1a1c1c', marginBottom: 2 },
  cardSubtitle:     { fontSize: 11, color: '#737781', marginBottom: 8 },
  sideBySideRow:    { flexDirection: 'row', justifyContent: 'space-between', gap: 10, marginBottom: 14 },
  halfCard:         { flex: 1, backgroundColor: '#fff', borderRadius: 16, padding: 14,
                      borderWidth: 1, borderColor: 'rgba(194,198,210,0.4)', elevation: 2 },
  halfCardTitle:    { fontSize: 13, fontWeight: '700', color: '#1a1c1c', marginBottom: 6, textAlign: 'center' },
  reportHeroCard:   { backgroundColor: '#004481', borderRadius: 16, padding: 20, marginBottom: 24, elevation: 4 },
  heroTitle:        { fontSize: 20, fontWeight: '700', color: '#fff', marginBottom: 4 },
  heroSubtitle:     { fontSize: 13, color: 'rgba(255,255,255,0.7)', fontWeight: '600', marginBottom: 10 },
  heroDesc:         { fontSize: 13, color: '#fff', lineHeight: 18, marginBottom: 18, opacity: 0.9 },
  heroBtn:          { backgroundColor: '#fff', borderRadius: 24, paddingVertical: 14,
                      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  heroBtnTxt:       { color: '#004481', fontSize: 14, fontWeight: '700' },
  heroTagRow:       { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  heroTag:          { backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  heroTagTxt:       { color: '#fff', fontSize: 10, fontWeight: '600' },
  customizeCard:    { backgroundColor: '#fff', borderRadius: 16, padding: 18,
                      borderWidth: 1, borderColor: 'rgba(194,198,210,0.4)', elevation: 2 },
  customRow:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
                      paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(194,198,210,0.2)' },
  customRowLabel:   { fontSize: 13, fontWeight: '600', color: '#1a1c1c' },
  alertBanner:      { borderRadius: 16, padding: 18, marginBottom: 20, elevation: 4 },
  alertBannerHeader:{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  alertBannerText:  { color: '#fff', fontSize: 14, fontWeight: '700' },
  alertBannerAmount:{ color: '#fff', fontSize: 22, fontWeight: '800' },
  debDetailCard:    { backgroundColor: '#fff', borderRadius: 16, padding: 18,
                      marginBottom: 14, borderWidth: 1, borderColor: 'rgba(194,198,210,0.4)', elevation: 2 },
  accordionBtn:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                      gap: 4, backgroundColor: '#f0f2f5', borderRadius: 20, paddingVertical: 10, marginTop: 10 },
  accordionBtnText: { fontSize: 13, fontWeight: '700', color: '#004481' },
  accordionContent: { marginTop: 10, backgroundColor: '#f8fafc', borderRadius: 12,
                      padding: 14, borderWidth: 1, borderColor: '#e2e8f0', gap: 8 },
  mitigationTitle:  { fontSize: 12, fontWeight: '700', color: '#1e293b',
                      borderBottomWidth: 1, borderBottomColor: '#cbd5e1', paddingBottom: 4 },
  repListItem:      { backgroundColor: '#fff', borderRadius: 14, padding: 14, flexDirection: 'row',
                      alignItems: 'center', gap: 12, marginBottom: 10, borderWidth: 1,
                      borderColor: 'rgba(194,198,210,0.4)', elevation: 1 },
  pdfIconContainer: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#fbebeb',
                      alignItems: 'center', justifyContent: 'center' },
  repFileName:      { fontSize: 13, fontWeight: '700', color: '#1a1c1c' },
  repSubText:       { fontSize: 11, color: '#737781', marginTop: 2 },
  repDownloadBtn:   { width: 36, height: 36, borderRadius: 18, backgroundColor: '#e8effa',
                      alignItems: 'center', justifyContent: 'center' },
  // Mapa geografico - bottom sheet
  geoSheet:          { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24,
                       padding: 24, paddingBottom: 40 },
  geoSheetHandle:    { width: 40, height: 4, backgroundColor: '#d1d5db', borderRadius: 2,
                       alignSelf: 'center', marginBottom: 20 },
  geoSheetTitle:     { fontSize: 17, fontWeight: '800', color: '#1a1c1c' },
  geoSheetRow:       { flexDirection: 'row', alignItems: 'center', gap: 12,
                       paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f0f2f5' },
  geoSheetIcon:      { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  geoSheetRowLabel:  { fontSize: 11, color: '#737781', fontWeight: '600' },
  geoSheetRowVal:    { fontSize: 14, fontWeight: '700', color: '#1a1c1c' },
  geoSheetCoords:    { fontSize: 10, color: '#aaa', marginTop: 14, textAlign: 'center' },
  // Tarjetas de comercio
  comercioCard:      { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12,
                       borderWidth: 1, borderColor: 'rgba(194,198,210,0.4)', elevation: 2 },
  comercioIconBox:   { width: 44, height: 44, borderRadius: 22, backgroundColor: '#e8effa',
                       alignItems: 'center', justifyContent: 'center' },
  comercioName:      { fontSize: 14, fontWeight: '700', color: '#1a1c1c', marginBottom: 4 },
  comercioFraudes:   { fontSize: 20, fontWeight: '800', color: '#ba1a1a' },
  comercioStatBox:   { flex: 1, backgroundColor: '#f4f6fa', borderRadius: 10, padding: 10 },
  comercioStatLabel: { fontSize: 10, color: '#737781', fontWeight: '600', marginBottom: 2 },
  comercioStatVal:   { fontSize: 13, fontWeight: '700', color: '#1a1c1c' },
});
