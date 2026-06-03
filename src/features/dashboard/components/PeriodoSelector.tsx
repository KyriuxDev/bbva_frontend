// src/features/dashboard/components/PeriodoSelector.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Selector de período con:
//   1. Tabs de tipo  (Mes / Trimestre / Semestre / Año)
//   2. Selector de año  (← 2022  2023  2024 →)
//   3. Chips de subdivisión  (Q1 / Q2 / Q3 / Q4, etc.)
//   4. Banda inferior con rango actual y período de comparación
// ─────────────────────────────────────────────────────────────────────────────

import React, { useRef } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  TipoPeriodo, Periodo, Seleccion,
  MIN_ANIO, MAX_ANIO,
  getOpciones,
} from '../hooks/usePeriodo';

// ── Tipos de prop ─────────────────────────────────────────────────────────────

interface Props {
  seleccion: Seleccion;
  periodo:   Periodo;
  onTipo:    (t: TipoPeriodo) => void;
  onAnio:    (a: number) => void;
  onSub:     (s: number) => void;
}

// ── Helpers de formato ────────────────────────────────────────────────────────

function fmtFecha(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  const MM = ['Ene','Feb','Mar','Abr','May','Jun',
               'Jul','Ago','Sep','Oct','Nov','Dic'];
  return `${d} ${MM[m - 1]} ${y}`;
}

// ── Opciones de tipo ──────────────────────────────────────────────────────────

const TIPOS: { tipo: TipoPeriodo; icono: string; titulo: string }[] = [
  { tipo: 'mes',       icono: 'calendar-outline',        titulo: 'Mes'       },
  { tipo: 'trimestre', icono: 'stats-chart-outline',     titulo: 'Trimestre' },
  { tipo: 'semestre',  icono: 'bar-chart-outline',       titulo: 'Semestre'  },
  { tipo: 'anio',      icono: 'calendar-number-outline', titulo: 'Año'       },
];

// ── Componente ────────────────────────────────────────────────────────────────

export function PeriodoSelector({
  seleccion, periodo,
  onTipo, onAnio, onSub,
}: Props) {
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const flash = () => {
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 0.45, duration: 90,  useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1,    duration: 200, useNativeDriver: true }),
    ]).start();
  };

  const handleTipo = (t: TipoPeriodo) => {
    if (t === seleccion.tipo) return;
    flash();
    onTipo(t);
  };

  const handleAnio = (delta: number) => {
    const nuevo = seleccion.anio + delta;
    if (nuevo < MIN_ANIO || nuevo > MAX_ANIO) return;
    flash();
    onAnio(nuevo);
  };

  const handleSub = (sub: number) => {
    if (sub === seleccion.sub) return;
    flash();
    onSub(sub);
  };

  const opciones = getOpciones(seleccion.tipo);
  const puedeRetroceder = seleccion.anio > MIN_ANIO;
  const puedeAvanzar    = seleccion.anio < MAX_ANIO;

  return (
    <View style={s.root}>

      {/* ── 1. Tabs de tipo ──────────────────────────────────────────────── */}
      <View style={s.tiposRow}>
        {TIPOS.map(op => {
          const activo = seleccion.tipo === op.tipo;
          return (
            <TouchableOpacity
              key={op.tipo}
              style={[s.tipoTab, activo && s.tipoTabActivo]}
              onPress={() => handleTipo(op.tipo)}
              activeOpacity={0.75}
            >
              <Ionicons
                name={op.icono as any}
                size={13}
                color={activo ? '#fff' : '#737781'}
              />
              <Text style={[s.tipoTxt, activo && s.tipoTxtActivo]}>
                {op.titulo}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ── 2. Selector de año ───────────────────────────────────────────── */}
      <View style={s.anioRow}>
        <TouchableOpacity
          style={[s.anioBtn, !puedeRetroceder && s.anioBtnDisabled]}
          onPress={() => handleAnio(-1)}
          disabled={!puedeRetroceder}
          activeOpacity={0.7}
        >
          <Ionicons
            name="chevron-back"
            size={18}
            color={puedeRetroceder ? '#004481' : '#c2c6d2'}
          />
        </TouchableOpacity>

        <View style={s.anioCenter}>
          <Text style={s.anioLabel}>{seleccion.anio}</Text>
          {seleccion.tipo !== 'anio' && (
            <Text style={s.anioSub}>
              vs {seleccion.anio - 1} (año anterior)
            </Text>
          )}
        </View>

        <TouchableOpacity
          style={[s.anioBtn, !puedeAvanzar && s.anioBtnDisabled]}
          onPress={() => handleAnio(+1)}
          disabled={!puedeAvanzar}
          activeOpacity={0.7}
        >
          <Ionicons
            name="chevron-forward"
            size={18}
            color={puedeAvanzar ? '#004481' : '#c2c6d2'}
          />
        </TouchableOpacity>
      </View>

      {/* ── 3. Chips de subdivisión (ocultos si tipo = año) ──────────────── */}
      {seleccion.tipo !== 'anio' && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.chipsRow}
        >
          {opciones.map(op => {
            const activo = seleccion.sub === op.sub;
            return (
              <TouchableOpacity
                key={op.sub}
                style={[s.chip, activo && s.chipActivo]}
                onPress={() => handleSub(op.sub)}
                activeOpacity={0.75}
              >
                <Text style={[s.chipTxt, activo && s.chipTxtActivo]}>
                  {op.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {/* ── 4. Banda de rango ────────────────────────────────────────────── */}
      <Animated.View style={[s.rangeRow, { opacity: fadeAnim }]}>

        {/* Período seleccionado */}
        <View style={s.rangeBlock}>
          <View style={[s.dot, { backgroundColor: '#004481' }]} />
          <View>
            <Text style={s.rangeLabel}>{periodo.label}</Text>
            <Text style={s.rangeFechas}>
              {fmtFecha(periodo.actual.desde)} – {fmtFecha(periodo.actual.hasta)}
            </Text>
          </View>
        </View>

        <View style={s.rangeSep} />

        {/* Período de comparación */}
        <View style={s.rangeBlock}>
          <View style={[s.dot, { backgroundColor: '#b0c8e8' }]} />
          <View>
            <Text style={[s.rangeLabel, { color: '#737781' }]}>vs anterior</Text>
            <Text style={s.rangeFechas}>
              {fmtFecha(periodo.anterior.desde)} – {fmtFecha(periodo.anterior.hasta)}
            </Text>
          </View>
        </View>

      </Animated.View>
    </View>
  );
}

// ── Estilos ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({

  root: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(194,198,210,0.4)',
    marginBottom: 16,
    overflow: 'hidden',
    elevation: 2,
  },

  // Tabs de tipo
  tiposRow: {
    flexDirection: 'row',
    padding: 10,
    gap: 6,
  },
  tipoTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#f4f6fa',
    borderWidth: 1,
    borderColor: 'rgba(194,198,210,0.4)',
  },
  tipoTabActivo: {
    backgroundColor: '#004481',
    borderColor: '#004481',
  },
  tipoTxt: {
    fontSize: 11,
    fontWeight: '700',
    color: '#737781',
  },
  tipoTxtActivo: {
    color: '#fff',
  },

  // Selector de año
  anioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#f8faff',
    borderTopWidth: 1,
    borderTopColor: 'rgba(194,198,210,0.3)',
  },
  anioBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#e8effa',
    alignItems: 'center',
    justifyContent: 'center',
  },
  anioBtnDisabled: {
    backgroundColor: '#f4f6fa',
  },
  anioCenter: {
    alignItems: 'center',
    flex: 1,
  },
  anioLabel: {
    fontSize: 22,
    fontWeight: '900',
    color: '#002e5a',
    letterSpacing: 1,
  },
  anioSub: {
    fontSize: 10,
    color: '#737781',
    marginTop: 1,
  },

  // Chips de subdivisión
  chipsRow: {
    flexDirection: 'row',
    paddingHorizontal: 10,
    paddingVertical: 10,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(194,198,210,0.3)',
  },
  chip: {
    paddingHorizontal: 18,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#f4f6fa',
    borderWidth: 1,
    borderColor: 'rgba(194,198,210,0.4)',
  },
  chipActivo: {
    backgroundColor: '#e8effa',
    borderColor: '#004481',
  },
  chipTxt: {
    fontSize: 13,
    fontWeight: '700',
    color: '#737781',
  },
  chipTxtActivo: {
    color: '#004481',
  },

  // Banda de rango
  rangeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: 'rgba(194,198,210,0.3)',
  },
  rangeBlock: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    flexShrink: 0,
  },
  rangeLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#004481',
  },
  rangeFechas: {
    fontSize: 10,
    color: '#737781',
    marginTop: 1,
  },
  rangeSep: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(194,198,210,0.5)',
    marginHorizontal: 10,
  },
});