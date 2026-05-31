import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Dimensions, Animated, Easing, PanResponder } from 'react-native';
import Svg, {
  Circle, Line, Text as SvgText, Polyline,
  Defs, LinearGradient as SvgGradient, Stop, Path,
} from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { fmt } from '@/src/features/dashboard/helpers/format';

const { width } = Dimensions.get('window');

interface DataItem {
  label:    string;
  value:    number;
  tooltip?: string;
}

interface Props {
  data:            DataItem[];
  color?:          string;
  valueFormatter?: (v: number) => string;
}

export function InteractiveLineChart({ data, color = '#004481', valueFormatter }: Props) {
  const fmtVal          = valueFormatter ?? fmt;
  const [activeIdx, setActiveIdx] = useState<number | null>(null);

  const chartRenderWidth = width - 64;
  const SVG_W = 320, SVG_H = 150;
  const X1 = 40, X2 = 310, Y_TOP = 15, Y_BOT = 125;

  const counts = data.map(d => d.value);
  const minV   = Math.min(...counts);
  const maxV   = Math.max(...counts);
  const xStep  = data.length > 1 ? (X2 - X1) / (data.length - 1) : 0;

  const ptX = (i: number) => X1 + i * xStep;
  const ptY = (v: number) =>
    maxV === minV
      ? (Y_TOP + Y_BOT) / 2
      : Y_BOT - ((v - minV) / (maxV - minV)) * (Y_BOT - Y_TOP);

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
      toValue: 1, duration: 800,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
    const id = progress.addListener(({ value }) => setLineProgress(value));
    return () => progress.removeListener(id);
  }, [data.map(d => d.value).join()]);

  const visiblePoints = Math.ceil(lineProgress * data.length);
  const visibleStr    = data
    .slice(0, visiblePoints)
    .map((d, i) => `${ptX(i).toFixed(1)},${ptY(d.value).toFixed(1)}`)
    .join(' ');

  // PanResponder
  const handleTouch = (touchX: number) => {
    if (!data.length) return;
    const svgX = (touchX / chartRenderWidth) * SVG_W;
    const idx  = Math.round((svgX - X1) / xStep);
    setActiveIdx(Math.max(0, Math.min(data.length - 1, idx)));
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder:  () => true,
      onPanResponderGrant:   (e) => handleTouch(e.nativeEvent.locationX),
      onPanResponderMove:    (e) => handleTouch(e.nativeEvent.locationX),
      onPanResponderRelease: ()  => setActiveIdx(null),
    })
  ).current;

  const active  = activeIdx !== null ? data[activeIdx] : null;
  const activeX = activeIdx !== null ? ptX(activeIdx) : null;
  const activeY = active ? ptY(active.value) : null;
  const yLabels = [maxV, maxV * 0.75, maxV * 0.5, maxV * 0.25, minV];

  return (
    <View style={{ marginVertical: 8 }}>
      {/* Tooltip */}
      {active && (
        <View style={{
          backgroundColor: color + '15', borderRadius: 10, padding: 10,
          borderLeftWidth: 3, borderLeftColor: color, marginBottom: 8,
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Ionicons name="calendar-outline" size={13} color={color} />
            <Text style={{ fontSize: 12, color, fontWeight: '700' }}>
              {active.tooltip ?? active.label}
            </Text>
          </View>
          <Text style={{ fontSize: 13, fontWeight: '800', color: '#1a1c1c', marginTop: 2 }}>
            {fmtVal(active.value)}
          </Text>
        </View>
      )}

      {/* Gráfica */}
      <View style={{ height: SVG_H + 10 }} {...panResponder.panHandlers}>
        <Svg width={chartRenderWidth} height={SVG_H} viewBox={`0 0 ${SVG_W} ${SVG_H}`}>
          <Defs>
            <SvgGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={color} stopOpacity="0.18" />
              <Stop offset="1" stopColor={color} stopOpacity="0"    />
            </SvgGradient>
          </Defs>

          {/* Líneas de referencia */}
          {[Y_TOP, (Y_TOP + Y_BOT) / 2, Y_BOT].map((y, i) => (
            <React.Fragment key={i}>
              <Line x1={X1} y1={y} x2={X2} y2={y}
                stroke="#e2e6ed" strokeDasharray="3 3" strokeWidth="0.7" />
              <SvgText x="2" y={y + 4} fontSize="8" fill="#aaa" fontWeight="600">
                {Math.round(yLabels[i * 2]).toLocaleString()}
              </SvgText>
            </React.Fragment>
          ))}

          {/* Área */}
          {visiblePoints > 1 && <Path d={areaPath} fill="url(#areaGrad)" />}

          {/* Línea */}
          {visibleStr && (
            <Polyline
              fill="none" stroke={color} strokeWidth="2.2"
              points={visibleStr} strokeLinecap="round" strokeLinejoin="round"
            />
          )}

          {/* Indicador activo */}
          {activeX !== null && activeY !== null && (
            <>
              <Line x1={activeX} y1={Y_TOP} x2={activeX} y2={Y_BOT}
                stroke={color} strokeWidth="1.2" strokeDasharray="3 2" />
              <Circle cx={activeX} cy={activeY} r="5" fill={color} opacity="0.9" />
              <Circle cx={activeX} cy={activeY} r="9" fill={color} opacity="0.15" />
            </>
          )}

          {/* Puntos individuales (si hay pocos datos) */}
          {data.length <= 14 && data.slice(0, visiblePoints).map((d, i) => (
            <Circle key={i} cx={ptX(i)} cy={ptY(d.value)} r="3"
              fill={activeIdx === i ? color : 'white'}
              stroke={color} strokeWidth="1.5"
            />
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