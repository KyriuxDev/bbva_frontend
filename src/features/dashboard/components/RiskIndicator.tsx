import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, Easing, Platform, UIManager } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { s } from '@/src/features/dashboard/styles/styles';
import { EXPLICACIONES } from '@/src/features/dashboard/constants/umbrales';

interface Props {
  label:   string;
  value:   number;
  umbral:  number;
  icon:    string;
}

export function RiskIndicator({ label, value, umbral, icon }: Props) {
  const isRisk  = value > umbral;
  const color   = isRisk ? '#ba1a1a' : value > umbral * 0.6 ? '#fbbd08' : '#00a278';
  const bgColor = isRisk ? '#fbebeb' : value > umbral * 0.6 ? '#fff7e6' : '#e6f7f0';
  const anim    = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue:  Math.min((value / (umbral * 1.5)) * 100, 100),
      duration: 700,
      easing:   Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [value]);

  const animWidth   = anim.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] });
  const sufijo      = EXPLICACIONES[label];
  const explicacion = sufijo ? `${Math.round(value)} ${sufijo}` : null;

  return (
    <View style={[s.riskCard, { backgroundColor: bgColor, borderColor: color + '44' }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <View style={{
          width: 36, height: 36, borderRadius: 18,
          backgroundColor: color + '22',
          alignItems: 'center', justifyContent: 'center',
        }}>
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

      {explicacion && (
        <Text style={{
          fontSize: 11, marginTop: 8, lineHeight: 15,
          fontWeight: isRisk ? '600' : '400',
          color: isRisk ? '#ba1a1a' : '#737781',
        }}>
          {explicacion}
        </Text>
      )}
    </View>
  );
}