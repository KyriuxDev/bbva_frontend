import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, Modal, Dimensions,
} from 'react-native';
import Svg, { Circle, Line, Path, Text as SvgText } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { s } from '@/src/features/dashboard/styles/styles';
import {
  MAP_SVG_W, MAP_SVG_H,
  MEX_MAINLAND_COORDS, MEX_BAJA_COORDS,
  CIUDADES_REF,
} from '@/src/features/dashboard/constants/mapa';
import {
  lngToX, latToY, coordsToPath,
  clusterGeoData, getNombreZona, getRecomendaciones,
} from '@/src/features/dashboard/helpers/geo';
import { fmt, fmtMXN } from '@/src/features/dashboard/helpers/format';
import type { FraudeGeo } from '@/src/features/dashboard/types';

const { width } = Dimensions.get('window');

interface Props {
  data: FraudeGeo[];
}

export function FraudeMapView({ data }: Props) {
  const [selected, setSelected] = useState<FraudeGeo | null>(null);

  const clusters   = clusterGeoData(data, 22);
  const maxFraudes = Math.max(...clusters.map(d => d.total_fraudes), 1);
  const chartW     = width - 64;
  const chartH     = (chartW / MAP_SVG_W) * MAP_SVG_H;
  const mainlandD  = coordsToPath(MEX_MAINLAND_COORDS);
  const bajaD      = coordsToPath(MEX_BAJA_COORDS);

  const handleMapPress = (evt: any) => {
    const { locationX, locationY } = evt.nativeEvent;
    const svgX = (locationX / chartW)  * MAP_SVG_W;
    const svgY = (locationY / chartH) * MAP_SVG_H;
    const hit  = clusters.find(cluster => {
      const ratio = cluster.total_fraudes / maxFraudes;
      const r     = 6 + ratio * 18;
      return Math.hypot(lngToX(cluster.lng) - svgX, latToY(cluster.lat) - svgY) <= r + 4;
    });
    if (hit) setSelected(hit);
  };

  return (
    <View>
      {/* Mapa */}
      <TouchableOpacity
        activeOpacity={1}
        onPress={handleMapPress}
        style={{ backgroundColor: '#dbeafe', borderRadius: 14, overflow: 'hidden' }}
      >
        <Svg width={chartW} height={chartH} viewBox={`0 0 ${MAP_SVG_W} ${MAP_SVG_H}`}>
          <Path d={mainlandD} fill="#dde8d0" stroke="#6b7280" strokeWidth="0.8" />
          <Path d={bajaD}     fill="#dde8d0" stroke="#6b7280" strokeWidth="0.8" />

          {/* Cuadrícula */}
          {[0.25, 0.5, 0.75].map((f, i) => (
            <React.Fragment key={i}>
              <Line x1={MAP_SVG_W * f} y1={0} x2={MAP_SVG_W * f} y2={MAP_SVG_H}
                stroke="#93c5fd" strokeWidth="0.6" opacity="0.6" />
              <Line x1={0} y1={MAP_SVG_H * f} x2={MAP_SVG_W} y2={MAP_SVG_H * f}
                stroke="#93c5fd" strokeWidth="0.6" opacity="0.6" />
            </React.Fragment>
          ))}

          {/* Clusters */}
          {clusters.map((cluster, i) => {
            const ratio = cluster.total_fraudes / maxFraudes;
            const cx    = lngToX(cluster.lng);
            const cy    = latToY(cluster.lat);
            const r     = 6 + ratio * 18;
            const alpha = (0.55 + ratio * 0.45).toFixed(2);
            return (
              <Circle key={i} cx={cx} cy={cy} r={r}
                fill={`rgba(186,26,26,${alpha})`}
                stroke="#fff" strokeWidth="2"
              />
            );
          })}

          {/* Ciudades de referencia */}
          {CIUDADES_REF.map((city, i) => {
            const cx = lngToX(city.lng);
            const cy = latToY(city.lat);
            return (
              <React.Fragment key={i}>
                <Circle cx={cx} cy={cy} r={4} fill="#1d4ed8" stroke="#fff" strokeWidth="1.5" />
                <SvgText x={cx} y={cy - 7} fontSize="7.5"
                  fill="#1e3a8a" textAnchor="middle" fontWeight="700">
                  {city.nombre}
                </SvgText>
              </React.Fragment>
            );
          })}
        </Svg>
      </TouchableOpacity>

      {/* Leyenda */}
      <View style={{
        flexDirection: 'row', justifyContent: 'center',
        alignItems: 'center', gap: 16, marginTop: 8,
      }}>
        {[
          { size: 8,  label: 'Pocos',  opacity: 0.55 },
          { size: 14, label: 'Medios', opacity: 0.75 },
          { size: 20, label: 'Muchos', opacity: 1    },
        ].map((leg, i) => (
          <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <View style={{
              width: leg.size, height: leg.size, borderRadius: leg.size / 2,
              backgroundColor: '#ba1a1a', opacity: leg.opacity,
            }} />
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

      {/* Bottom sheet */}
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
              <View style={{
                flexDirection: 'row', justifyContent: 'space-between',
                alignItems: 'center', marginBottom: 16,
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <View style={{
                    width: 38, height: 38, borderRadius: 19,
                    backgroundColor: '#fbebeb', alignItems: 'center', justifyContent: 'center',
                  }}>
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

              {/* Estadísticas */}
              {[
                { icon: 'alert-circle-outline',  label: 'Fraudes detectados',  val: fmt(selected.total_fraudes),      color: '#ba1a1a' },
                { icon: 'cash-outline',           label: 'Monto total',         val: fmtMXN(selected.monto_total),     color: '#004481' },
                { icon: 'analytics-outline',      label: 'Monto promedio',      val: fmtMXN(selected.monto_promedio),  color: '#1973B8' },
                { icon: 'pricetag-outline',       label: 'Categoría principal', val: selected.categoria_top,           color: '#00a278' },
                { icon: 'phone-portrait-outline', label: 'Canal principal',     val: selected.canal_top,               color: '#7c3aed' },
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

              {/* Recomendaciones */}
              <View style={{
                marginTop: 16, backgroundColor: '#f0f9f4', borderRadius: 14,
                padding: 14, borderLeftWidth: 3, borderLeftColor: '#00a278',
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                  <Ionicons name="shield-checkmark-outline" size={16} color="#00a278" />
                  <Text style={{ fontSize: 13, fontWeight: '800', color: '#00a278' }}>
                    Cómo evitar este fraude
                  </Text>
                </View>
                {getRecomendaciones(selected.canal_top, selected.categoria_top).map((rec, i) => (
                  <View key={i} style={{
                    flexDirection: 'row', alignItems: 'flex-start',
                    gap: 8, marginBottom: 8,
                  }}>
                    <View style={{
                      width: 18, height: 18, borderRadius: 9, backgroundColor: '#00a278',
                      alignItems: 'center', justifyContent: 'center', marginTop: 1, flexShrink: 0,
                    }}>
                      <Text style={{ color: '#fff', fontSize: 10, fontWeight: '800' }}>{i + 1}</Text>
                    </View>
                    <Text style={{ fontSize: 12, color: '#374151', lineHeight: 18, flex: 1 }}>
                      {rec}
                    </Text>
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