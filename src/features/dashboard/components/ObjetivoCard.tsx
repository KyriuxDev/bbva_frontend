import React, { useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity,
  Animated, Easing, LayoutAnimation, Platform, UIManager,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { s } from '@/src/features/dashboard/styles/styles';
import { PRIORIDAD_COLOR } from '@/src/features/dashboard/constants/colores';

interface Objetivo {
  titulo:       string;
  prioridad:    'Alta' | 'Media' | 'Baja';
  valorActual:  number;
  valorMeta:    number;
  area:         string;
  estado:       'Pendiente' | 'En progreso';
  acciones:     string[];
  icono:        string;
}

interface Props {
  objetivo:      Objetivo;
  idx:           number;
  expandedId:    number | null;
  setExpandedId: (v: number | null) => void;
}

export function ObjetivoCard({ objetivo, idx, expandedId, setExpandedId }: Props) {
  const color      = PRIORIDAD_COLOR[objetivo.prioridad] ?? '#737781';
  const bg         = objetivo.prioridad === 'Alta'  ? '#fbebeb'
                   : objetivo.prioridad === 'Media' ? '#fff7e6' : '#e6f7f0';
  const isExpanded = expandedId === idx;

  // FIX: clamp entre 0-100, proteger división por cero
  const progress = (() => {
    const actual = objetivo.valorActual ?? 0;
    const meta   = objetivo.valorMeta   ?? 1;
    if (actual <= 0) return 0;
    if (actual <= meta) return 100; // ya cumplió la meta
    // Cuánto del camino hacia la meta se ha recorrido (inverso: bajar de actual a meta)
    const raw = Math.round((meta / actual) * 100);
    return Math.min(Math.max(raw, 0), 100);
  })();

  const estadoColor = objetivo.estado === 'En progreso' ? '#1973B8' : '#737781';
  const estadoBg    = objetivo.estado === 'En progreso' ? '#e8effa'  : '#f0f2f5';

  const barAnim  = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(barAnim, {
      toValue:  progress,
      duration: 700,
      easing:   Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [progress]);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue:  isExpanded ? 1 : 0,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [isExpanded]);

  const animWidth = barAnim.interpolate({
    inputRange:  [0, 100],
    outputRange: ['0%', '100%'],
  });

  const handleToggle = () => {
    if (Platform.OS === 'android') {
      UIManager.setLayoutAnimationEnabledExperimental?.(true);
    }
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedId(isExpanded ? null : idx);
  };

  return (
    <View style={s.debDetailCard}>
      <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
        <View style={{
          width: 44, height: 44, borderRadius: 22,
          backgroundColor: bg, alignItems: 'center', justifyContent: 'center',
        }}>
          <Ionicons name={objetivo.icono as any} size={24} color={color} />
        </View>
        <View style={{ flex: 1 }}>
          <View style={[s.badge, { backgroundColor: color }]}>
            <Text style={s.badgeText}>{objetivo.prioridad.toUpperCase()}</Text>
          </View>
          <Text style={[s.debTitle, { marginBottom: 0 }]}>{objetivo.titulo}</Text>
        </View>
      </View>

      {/* Valores actual vs meta */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <Text style={{ fontSize: 12, color: '#5d5f5f' }}>
          {'Actual: '}
          <Text style={{ fontWeight: '800', color: '#ba1a1a' }}>{objetivo.valorActual.toFixed(1)}%</Text>
          {'  →  Meta: '}
          <Text style={{ fontWeight: '800', color: '#00a278' }}>{objetivo.valorMeta}%</Text>
        </Text>
        <Text style={{ fontSize: 12, fontWeight: '800', color }}>{progress}%</Text>
      </View>

      {/* Barra de progreso */}
      <View style={{
        height: 8, backgroundColor: color + '25',
        borderRadius: 4, overflow: 'hidden', marginBottom: 12,
      }}>
        <Animated.View style={{
          width: animWidth, height: '100%',
          backgroundColor: color, borderRadius: 4,
        }} />
      </View>

      {/* Área + estado */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Ionicons name="business-outline" size={12} color="#737781" />
          <Text style={{ fontSize: 11, color: '#737781' }}>Área: {objetivo.area}</Text>
        </View>
        <View style={{ backgroundColor: estadoBg, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 }}>
          <Text style={{ fontSize: 10, fontWeight: '700', color: estadoColor }}>
            {objetivo.estado.toUpperCase()}
          </Text>
        </View>
      </View>

      <TouchableOpacity style={[s.accordionBtn, { marginTop: 10 }]} onPress={handleToggle}>
        <Text style={s.accordionBtnText}>
          {isExpanded ? 'Ocultar acciones recomendadas' : 'Ver acciones recomendadas'}
        </Text>
        <Ionicons name={isExpanded ? 'chevron-up' : 'chevron-down'} size={16} color="#004481" />
      </TouchableOpacity>

      {isExpanded && (
        <Animated.View style={[s.accordionContent, { opacity: fadeAnim }]}>
          {objetivo.acciones.map((accion, i) => (
            <View key={i} style={{
              flexDirection: 'row', gap: 10, alignItems: 'flex-start',
              marginBottom: i < objetivo.acciones.length - 1 ? 10 : 0,
            }}>
              <View style={{
                width: 22, height: 22, borderRadius: 11, backgroundColor: color,
                alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1,
              }}>
                <Text style={{ color: '#fff', fontSize: 10, fontWeight: '800' }}>{i + 1}</Text>
              </View>
              <Text style={{ fontSize: 12, color: '#475569', lineHeight: 18, flex: 1 }}>
                {accion}
              </Text>
            </View>
          ))}
        </Animated.View>
      )}
    </View>
  );
}