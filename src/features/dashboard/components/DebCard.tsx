import React, { useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity,
  Animated, LayoutAnimation, Platform, UIManager,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { s } from '@/src/features/dashboard/styles/styles';
import { AREA_ICONS, PRIORIDAD_COLOR } from '@/src/features/dashboard/constants/colores';
import { PASOS_ACCION } from '@/src/features/dashboard/constants/umbrales';
import type { Solucion } from '@/src/features/dashboard/types';

interface Props {
  sol:           Solucion;
  idx:           number;
  expandedId:    number | null;
  setExpandedId: (v: number | null) => void;
}

export function DebCard({ sol, idx, expandedId, setExpandedId }: Props) {
  const icon       = AREA_ICONS[sol.area]      ?? 'alert-circle-outline';
  const color      = PRIORIDAD_COLOR[sol.prioridad] ?? '#737781';
  const bg         = sol.prioridad === 'Alta'  ? '#fbebeb'
                   : sol.prioridad === 'Media' ? '#fff7e6' : '#e6f7f0';
  const isExpanded = expandedId === idx;
  const pasos      = PASOS_ACCION[sol.area]    ?? [];

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (Platform.OS === 'android') {
      UIManager.setLayoutAnimationEnabledExperimental?.(true);
    }
    Animated.timing(fadeAnim, {
      toValue:  isExpanded ? 1 : 0,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [isExpanded]);

  const handleToggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedId(isExpanded ? null : idx);
  };

  return (
    <View style={s.debDetailCard}>
      <View style={{ flexDirection: 'row', gap: 12, marginBottom: 8 }}>
        <View style={{
          width: 44, height: 44, borderRadius: 22,
          backgroundColor: bg, alignItems: 'center', justifyContent: 'center',
        }}>
          <Ionicons name={icon as any} size={24} color={color} />
        </View>
        <View style={{ flex: 1 }}>
          <View style={[s.badge, { backgroundColor: color }]}>
            <Text style={s.badgeText}>{sol.prioridad.toUpperCase()}</Text>
          </View>
          <Text style={s.debTitle}>{sol.problema}</Text>
        </View>
      </View>

      <TouchableOpacity style={s.accordionBtn} onPress={handleToggle}>
        <Text style={s.accordionBtnText}>
          {isExpanded ? 'Ocultar plan de acción' : 'Ver plan de acción'}
        </Text>
        <Ionicons name={isExpanded ? 'chevron-up' : 'chevron-down'} size={16} color="#004481" />
      </TouchableOpacity>

      {isExpanded && (
        <Animated.View style={[s.accordionContent, { opacity: fadeAnim }]}>
          <Text style={s.mitigationTitle}>Pasos de acción</Text>
          {pasos.map((paso, i) => (
            <View key={i} style={{
              flexDirection: 'row', gap: 10, marginBottom: 10,
              alignItems: 'flex-start',
            }}>
              <View style={{
                width: 22, height: 22, borderRadius: 11, backgroundColor: color,
                alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1,
              }}>
                <Text style={{ color: '#fff', fontSize: 10, fontWeight: '800' }}>{i + 1}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 11, fontWeight: '700', color: '#1a1c1c', marginBottom: 1 }}>
                  Paso {i + 1}
                </Text>
                <Text style={{ fontSize: 12, color: '#475569', lineHeight: 18 }}>{paso}</Text>
              </View>
            </View>
          ))}
          {sol.solucion ? (
            <View style={{
              flexDirection: 'row', gap: 8, alignItems: 'flex-start',
              backgroundColor: color + '12', borderRadius: 8, padding: 10, marginTop: 4,
            }}>
              <Ionicons name="bulb-outline" size={14} color={color} style={{ marginTop: 1 }} />
              <Text style={{ fontSize: 11, color: '#475569', lineHeight: 16, flex: 1 }}>
                {sol.solucion}
              </Text>
            </View>
          ) : null}
        </Animated.View>
      )}
    </View>
  );
}