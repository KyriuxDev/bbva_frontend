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
  }, [segments.map(s => s.label).join()]);

  const isLarge = size === 'large';
  const dim     = isLarge ? 180 : 120;
  const center  = dim / 2;
  const radius  = isLarge ? 50 : 33;
  const sw      = isLarge ? 22 : 14;
  const circ    = 2 * Math.PI * radius;
  let acc       = 0;

  return (
    <View style={{ alignItems: 'center', marginVertical: 6 }}>
      <Svg width={dim} height={dim} viewBox={`0 0 ${dim} ${dim}`}>
        <G transform={`rotate(-90 ${center} ${center})`}>
          <Circle
            cx={center} cy={center} r={radius}
            stroke="#f0f2f5" strokeWidth={sw} fill="transparent"
          />
          {segments.map((seg, idx) => {
            const effectivePct = seg.percentage * animPct;
            const len    = (effectivePct / 100) * circ;
            const offset = circ - (acc / 100) * circ * animPct;
            acc += seg.percentage;
            return (
              <Circle
                key={idx}
                cx={center} cy={center} r={radius}
                stroke={seg.color} strokeWidth={sw}
                strokeDasharray={`${len} ${circ}`}
                strokeDashoffset={offset}
                strokeLinecap="butt"
                fill="transparent"
              />
            );
          })}
        </G>
      </Svg>

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
              {seg.label} {seg.percentage.toFixed(1)}%
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}