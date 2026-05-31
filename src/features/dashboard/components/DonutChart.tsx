import React, { useEffect, useRef, useState } from 'react';
import { View, Text } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import { Animated, Easing } from 'react-native';

export interface Segment {
  percentage: number;
  color:      string;
  label:      string;
}

interface Props {
  segments: Segment[];
  size?:    'large' | 'small';
}

export function DonutChart({ segments, size = 'large' }: Props) {
  const progress = useRef(new Animated.Value(0)).current;
  const [animPct, setAnimPct] = useState(0);

  // Clave de los datos para detectar cambios reales
  const segKey = segments.map(s => `${s.label}:${s.percentage}`).join('|');

  useEffect(() => {
    if (!segments.length) return;
    progress.setValue(0);
    Animated.timing(progress, {
      toValue:  1,
      duration: 900,
      easing:   Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
    const id = progress.addListener(({ value }) => setAnimPct(value));
    return () => progress.removeListener(id);
  }, [segKey]);

  const isLarge = size === 'large';
  const dim     = isLarge ? 180 : 120;
  const center  = dim / 2;
  const radius  = isLarge ? 50 : 33;
  const sw      = isLarge ? 22 : 14;
  const circ    = 2 * Math.PI * radius;

  // Normalizar los porcentajes para que sumen exactamente 100
  // Esto evita que el último segmento quede corto o se pase
  const totalPct = segments.reduce((s, seg) => s + seg.percentage, 0);
  const normalized = segments.map(seg => ({
    ...seg,
    pct: totalPct > 0 ? (seg.percentage / totalPct) * 100 : 0,
  }));

  // Calcular offsets acumulados ANTES de la animación
  // para que el cálculo sea siempre consistente
  const withOffsets = normalized.reduce<{
    pct: number; color: string; label: string; offset: number;
  }[]>((acc, seg, i) => {
    const prevAcc = i === 0 ? 0 : acc.reduce((s, x) => s + x.pct, 0);
    return [...acc, { ...seg, offset: prevAcc }];
  }, []);

  return (
    <View style={{ alignItems: 'center', marginVertical: 6 }}>
      <Svg width={dim} height={dim} viewBox={`0 0 ${dim} ${dim}`}>
        <G transform={`rotate(-90 ${center} ${center})`}>
          {/* Fondo gris */}
          <Circle
            cx={center} cy={center} r={radius}
            stroke="#f0f2f5" strokeWidth={sw} fill="transparent"
          />
          {/* Segmentos */}
          {withOffsets.map((seg, idx) => {
            // Longitud del arco de este segmento, escalada por animación
            const arcLen    = (seg.pct / 100) * circ * animPct;
            // El espacio restante completa la circunferencia
            const gap       = circ - arcLen;
            // Offset: cuánto hay que rotar para empezar donde terminó el anterior
            const dashOffset = circ - (seg.offset / 100) * circ * animPct;

            if (arcLen <= 0) return null;

            return (
              <Circle
                key={idx}
                cx={center} cy={center} r={radius}
                stroke={seg.color}
                strokeWidth={sw}
                strokeDasharray={`${arcLen} ${gap}`}
                strokeDashoffset={dashOffset}
                strokeLinecap="butt"
                fill="transparent"
              />
            );
          })}
        </G>
      </Svg>

      {/* Leyenda */}
      <View style={{
        flexDirection: 'row', flexWrap: 'wrap',
        justifyContent: 'center', gap: 6, marginTop: 6,
      }}>
        {segments.map((seg, idx) => (
          <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <View style={{
              width: 8, height: 8, borderRadius: 4,
              backgroundColor: seg.color,
            }} />
            <Text style={{ fontSize: isLarge ? 11 : 10, fontWeight: '600', color: '#5d5f5f' }}>
              {`${seg.label} ${seg.percentage.toFixed(1)}%`}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}