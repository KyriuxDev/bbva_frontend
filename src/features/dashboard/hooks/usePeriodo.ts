// src/features/dashboard/hooks/usePeriodo.ts
// ─────────────────────────────────────────────────────────────────────────────
// Hook central de períodos con selección manual de año.
// El usuario elige: tipo (mes/trimestre/semestre/año) + año + subdivisión.
// El "anterior" siempre es el mismo período del año anterior para comparar.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useMemo } from 'react';

// ── Constantes de datos ───────────────────────────────────────────────────────
// Ajusta MIN_ANIO / MAX_ANIO según tu BD
export const MIN_ANIO = 2022;
export const MAX_ANIO = 2024;

export const MESES_CORTO = [
  'Ene','Feb','Mar','Abr','May','Jun',
  'Jul','Ago','Sep','Oct','Nov','Dic',
];

// ── Tipos públicos ────────────────────────────────────────────────────────────

export type TipoPeriodo = 'mes' | 'trimestre' | 'semestre' | 'anio';

export interface RangoFechas {
  desde: string;   // ISO YYYY-MM-DD
  hasta: string;
}

export interface Periodo {
  tipo:       TipoPeriodo;
  label:      string;      // "Q2 2024"
  labelCorto: string;      // "Q2"
  actual:     RangoFechas;
  anterior:   RangoFechas; // mismo período año anterior
  queryKey:   string;
}

// ── Selección del usuario ─────────────────────────────────────────────────────

export interface Seleccion {
  tipo:  TipoPeriodo;
  anio:  number;
  // índice 0-based según tipo:
  //   mes       → 0-11
  //   trimestre → 0-3
  //   semestre  → 0-1
  //   anio      → ignorado (siempre 0)
  sub:   number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const pad     = (n: number) => String(n).padStart(2, '0');
const isoDate = (d: Date)   =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const finMes  = (anio: number, mes: number) => new Date(anio, mes + 1, 0);

// ── Calculador de Periodo desde Seleccion ─────────────────────────────────────

export function calcPeriodo(sel: Seleccion): Periodo {
  const { tipo, anio, sub } = sel;
  const anioAnt = anio - 1;

  switch (tipo) {

    case 'mes': {
      const mes = Math.min(Math.max(sub, 0), 11);
      return {
        tipo, labelCorto: MESES_CORTO[mes],
        label:    `${MESES_CORTO[mes]} ${anio}`,
        actual:   { desde: isoDate(new Date(anio,   mes, 1)), hasta: isoDate(finMes(anio,    mes)) },
        anterior: { desde: isoDate(new Date(anioAnt, mes, 1)), hasta: isoDate(finMes(anioAnt, mes)) },
        queryKey: `mes-${anio}-${pad(mes + 1)}`,
      };
    }

    case 'trimestre': {
      const q         = Math.min(Math.max(sub, 0), 3);
      const mesInicio = q * 3;
      const mesFin    = mesInicio + 2;
      return {
        tipo, labelCorto: `Q${q + 1}`,
        label:    `Q${q + 1} ${anio}`,
        actual:   { desde: isoDate(new Date(anio,    mesInicio, 1)), hasta: isoDate(finMes(anio,    mesFin)) },
        anterior: { desde: isoDate(new Date(anioAnt, mesInicio, 1)), hasta: isoDate(finMes(anioAnt, mesFin)) },
        queryKey: `q-${anio}-${q + 1}`,
      };
    }

    case 'semestre': {
      const s         = Math.min(Math.max(sub, 0), 1);
      const mesInicio = s * 6;
      const mesFin    = mesInicio + 5;
      return {
        tipo, labelCorto: `S${s + 1}`,
        label:    `S${s + 1} ${anio}`,
        actual:   { desde: isoDate(new Date(anio,    mesInicio, 1)), hasta: isoDate(finMes(anio,    mesFin)) },
        anterior: { desde: isoDate(new Date(anioAnt, mesInicio, 1)), hasta: isoDate(finMes(anioAnt, mesFin)) },
        queryKey: `s-${anio}-${s + 1}`,
      };
    }

    case 'anio':
    default:
      return {
        tipo, labelCorto: `${anio}`,
        label:    `${anio}`,
        actual:   { desde: `${anio}-01-01`,    hasta: `${anio}-12-31`    },
        anterior: { desde: `${anioAnt}-01-01`, hasta: `${anioAnt}-12-31` },
        queryKey: `anio-${anio}`,
      };
  }
}

// ── Opciones de subperíodo por tipo ──────────────────────────────────────────

export function getOpciones(tipo: TipoPeriodo): { label: string; sub: number }[] {
  switch (tipo) {
    case 'mes':
      return MESES_CORTO.map((m, i) => ({ label: m, sub: i }));
    case 'trimestre':
      return ['Q1','Q2','Q3','Q4'].map((q, i) => ({ label: q, sub: i }));
    case 'semestre':
      return ['S1','S2'].map((s, i) => ({ label: s, sub: i }));
    case 'anio':
      return [{ label: 'Completo', sub: 0 }];
  }
}

// ── Selección por defecto (último período disponible) ─────────────────────────

function defaultSeleccion(): Seleccion {
  // Por defecto: Q4 2024 (último trimestre del año más reciente en BD)
  return { tipo: 'trimestre', anio: MAX_ANIO, sub: 3 };
}

// ── Hook principal ────────────────────────────────────────────────────────────

export function usePeriodo() {
  const [seleccion, setSeleccion] = useState<Seleccion>(defaultSeleccion);

  const periodo = useMemo(() => calcPeriodo(seleccion), [seleccion]);

  const setTipo = (tipo: TipoPeriodo) => {
    // Al cambiar tipo, resetear sub al último disponible y mantener año
    const opciones = getOpciones(tipo);
    setSeleccion(prev => ({
      tipo,
      anio: prev.anio,
      sub:  opciones[opciones.length - 1].sub,
    }));
  };

  const setAnio = (anio: number) =>
    setSeleccion(prev => ({ ...prev, anio: Math.min(Math.max(anio, MIN_ANIO), MAX_ANIO) }));

  const setSub = (sub: number) =>
    setSeleccion(prev => ({ ...prev, sub }));

  return { periodo, seleccion, setTipo, setAnio, setSub };
}

// ── Helper: calcular delta % ──────────────────────────────────────────────────

export function calcDelta(actual: number, anterior: number): number | null {
  if (anterior === 0) return actual > 0 ? 100 : null;
  return Math.round(((actual - anterior) / anterior) * 1000) / 10;
}