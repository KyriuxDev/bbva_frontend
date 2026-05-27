// ── /kpis/resumen ────────────────────────────────────────────
export interface KpisResumen {
  totalClientes:          number;
  cuentasActivas:         number;
  saldoTotalCuentas:      number;
  prestamosActivos:       number;
  montoPrestamosVigentes: number;
  transaccionesHoy:       number;
  fraudesPotenciales:     number;
  cobrosExcedidos:        number;
}

// ── /etl/resumen ─────────────────────────────────────────────
export interface EtlResumen {
  total_transacciones:    number;
  total_fraudes:          number;
  tasa_fraude_pct:        number;
  monto_total_fraude:     number;
  monto_total_fraude_usd: number | null;
  monto_promedio_fraude:  number;
  monto_maximo_fraude:    number;
}

// ── /etl/fraude-por-canal ────────────────────────────────────
export interface FraudePorCanal {
  canal:         string;
  total_fraudes: number;
  monto_total:   number;
  porcentaje:    number;
}

// ── /etl/fraude-por-categoria ────────────────────────────────
export interface FraudePorCategoria {
  categoria:      string;
  total_fraudes:  number;
  monto_total:    number;
  monto_promedio: number;
}

// ── /etl/fraude-por-mes ──────────────────────────────────────
export interface FraudePorMes {
  año_mes:       string;
  total_fraudes: number;
  monto_total:   number;
}

// ── /kpis/debilidades ────────────────────────────────────────
export interface Solucion {
  area:      string;
  problema:  string;
  solucion:  string;
  prioridad: 'Alta' | 'Media' | 'Baja';
}

export interface DebilidadesResponse {
  debilidades: {
    porcentajeFraudePotencial:   number;
    porcentajeCobrosExcedidos:   number;
    porcentajeCuentasCanceladas: number;
    porcentajePrestamosVencidos: number;
    porcentajeMetasFallidas:     number;
  };
  soluciones: Solucion[];
}

// ── /kpis/clientes-por-segmento ──────────────────────────────
export interface ClientesPorSegmento {
  segmento: string;
  total:    number;
}

// ── /kpis/clientes-por-genero ────────────────────────────────
export interface ClientesPorGenero {
  genero: string;
  total:  number;
}

// ── /kpis/prestamos-por-tipo ─────────────────────────────────
export interface PrestamosPorTipo {
  tipo:        string;
  total:       number;
  saldo_total: number;
}

// ── /kpis/saldo-por-tipo-cuenta ──────────────────────────────
export interface SaldoPorTipoCuenta {
  tipo:          string;
  total_cuentas: number;
  saldo_total:   number;
}

// ── /kpis/score-crediticio ───────────────────────────────────
export interface ScoreCrediticio {
  rango: string;
  total: number;
}

// ── /kpis/tendencia ──────────────────────────────────────────
export interface TendenciaMes {
  mes:         string;
  total:       number;
  monto_total: number;
}

// ── /kpis/cobros-excedidos ───────────────────────────────────
export interface CobrosExcedidos {
  tipo:             string;
  total:            number;
  diferencia_total: number;
}
