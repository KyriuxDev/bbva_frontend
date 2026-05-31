import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, Animated, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PALETTE } from '@/src/features/dashboard/constants/colores';
import { fmt } from '@/src/features/dashboard/helpers/format';

interface DataItem {
  label: string;
  value: number;
}

interface Props {
  data:            DataItem[];
  colorFn?:        (i: number) => string;
  valueFormatter?: (v: number) => string;
}

export function AnimatedBarChart({ data, colorFn, valueFormatter }: Props) {
  const maxVal     = Math.max(...data.map(d => d.value), 1);
  const fmtVal     = valueFormatter ?? fmt;
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

  const anims = useRef<Animated.Value[]>([]);
  if (anims.current.length !== data.length) {
    anims.current = data.map(() => new Animated.Value(0));
  }

  useEffect(() => {
    anims.current.forEach(a => a.setValue(0));
    Animated.stagger(
      60,
      anims.current.map((a, i) =>
        Animated.timing(a, {
          toValue:  1,
          duration: 550,
          delay:    i * 60,
          easing:   Easing.out(Easing.back(1.1)),
          useNativeDriver: false,
        })
      )
    ).start();
  }, [data.map(d => d.value).join()]);

  return (
    <View style={{ gap: 6, marginTop: 8 }}>
      {data.map((item, i) => {
        const pct        = (item.value / maxVal) * 100;
        const color      = colorFn ? colorFn(i) : PALETTE[i % PALETTE.length];
        const isSelected = selectedIdx === i;

        const animWidth = anims.current[i]?.interpolate({
          inputRange:  [0, 1],
          outputRange: ['0%', `${pct}%`],
        }) ?? '0%';

        return (
          <TouchableOpacity
            key={i}
            activeOpacity={0.75}
            onPress={() => setSelectedIdx(isSelected ? null : i)}
          >
            <View style={{ gap: 4 }}>
              {/* Label + valor */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text
                  numberOfLines={1}
                  style={{
                    fontSize: 12, flex: 1,
                    fontWeight: isSelected ? '700' : '600',
                    color: isSelected ? color : '#5d5f5f',
                  }}
                >
                  {item.label}
                </Text>
                <View style={{
                  paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10,
                  backgroundColor: isSelected ? color : 'transparent',
                }}>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: isSelected ? 'white' : '#1a1c1c' }}>
                    {fmtVal(item.value)}
                  </Text>
                </View>
              </View>

              {/* Barra */}
              <View style={{
                height: isSelected ? 12 : 9,
                backgroundColor: color + '20',
                borderRadius: 6,
                overflow: 'hidden',
              }}>
                <Animated.View style={{
                  width: animWidth, height: '100%', borderRadius: 6,
                  backgroundColor: isSelected ? color : color + 'CC',
                }} />
              </View>

              {/* Detalle expandido */}
              {isSelected && (
                <View style={{
                  backgroundColor: color + '12', borderRadius: 10, padding: 10,
                  borderLeftWidth: 3, borderLeftColor: color, marginTop: 2,
                }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Ionicons name="bar-chart-outline" size={13} color={color} />
                    <Text style={{ fontSize: 12, color, fontWeight: '700' }}>{item.label}</Text>
                  </View>
                  <Text style={{ fontSize: 11, color: '#333', marginTop: 2 }}>
                    Valor: {fmtVal(item.value)}{'  ·  '}{pct.toFixed(1)}% del total
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