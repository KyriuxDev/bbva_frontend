// src/features/dashboard/components/DeltaBadge.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Muestra la variación porcentual entre dos períodos.
// Verde = crecimiento, Rojo = caída (o inverso para indicadores negativos
// como fraudes — usar invertido=true).
// ─────────────────────────────────────────────────────────────────────────────

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  delta:     number | null;  // null = sin dato anterior
  invertido?: boolean;       // true: subida es mala (fraude, cobros excedidos)
  size?:     'sm' | 'md';
}

export function DeltaBadge({ delta, invertido = false, size = 'md' }: Props) {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, {
      toValue: 1, duration: 350, useNativeDriver: true,
    }).start();
  }, [delta]);

  if (delta === null) {
    return (
      <View style={[st.badge, st.neutral, size === 'sm' && st.badgeSm]}>
        <Text style={[st.txt, st.neutralTxt, size === 'sm' && st.txtSm]}>—</Text>
      </View>
    );
  }

  // Un delta positivo es bueno para clientes/transacciones/cuentas/prestamos
  // pero malo para fraudes/cobros (invertido=true)
  const esBueno = invertido ? delta <= 0 : delta >= 0;
  const color   = delta === 0 ? '#737781' : esBueno ? '#00a278' : '#ba1a1a';
  const bg      = delta === 0 ? '#f4f6fa'  : esBueno ? '#e6f7f0' : '#fbebeb';

  const icono =
    delta === 0 ? 'remove-outline' :
    delta  > 0  ? 'trending-up-outline' :
                  'trending-down-outline';

  const signo = delta > 0 ? '+' : '';

  return (
    <Animated.View
      style={[
        st.badge,
        { backgroundColor: bg, borderColor: color + '44' },
        size === 'sm' && st.badgeSm,
        { opacity: fadeAnim },
      ]}
    >
      <Ionicons name={icono as any} size={size === 'sm' ? 10 : 12} color={color} />
      <Text style={[st.txt, { color }, size === 'sm' && st.txtSm]}>
        {`${signo}${delta.toFixed(1)}%`}
      </Text>
    </Animated.View>
  );
}

const st = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  badgeSm: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  neutral: {
    backgroundColor: '#f4f6fa',
    borderColor: 'rgba(194,198,210,0.4)',
  },
  neutralTxt: {
    color: '#737781',
  },
  txt: {
    fontSize: 11,
    fontWeight: '700',
  },
  txtSm: {
    fontSize: 10,
  },
});