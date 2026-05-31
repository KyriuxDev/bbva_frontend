import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { s } from '@/src/features/dashboard/styles/styles';
import { fmt, fmtMXN } from '@/src/features/dashboard/helpers/format';
import type { FraudeComercio } from '@/src/features/dashboard/types';

interface Props {
  item:          FraudeComercio;
  idx:           number;
  expandedId:    number | null;
  setExpandedId: (v: number | null) => void;
}

export function ComercioCard({ item, idx, expandedId, setExpandedId }: Props) {
  const isExpanded = expandedId === idx;
  const fecha      = item.ultima_alerta
    ? new Date(item.ultima_alerta).toLocaleDateString('es-MX', {
        day: '2-digit', month: 'short', year: 'numeric',
      })
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

      {/* Botón acordeón */}
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
            { icon: 'time-outline',      label: 'Última alerta',      val: fecha,                        color: '#ba1a1a' },
          ].map((row, i) => (
            <View key={i} style={{
              flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6,
              borderBottomWidth: i < 2 ? 1 : 0, borderBottomColor: '#f0f2f5',
            }}>
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