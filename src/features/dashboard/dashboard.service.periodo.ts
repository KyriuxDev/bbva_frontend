// src/features/dashboard/dashboard.service.periodo.ts
// ─────────────────────────────────────────────────────────────────────────────
// Extensión del dashboard service para consultas filtradas por período.
// Cada método acepta { desde, hasta } y devuelve el mismo shape que
// los endpoints originales para que el UI pueda comparar fácilmente.
// ─────────────────────────────────────────────────────────────────────────────

import { api } from '@/src/lib/axios';
import type { RangoFechas } from './hooks/usePeriodo';

// ── Tipos de respuesta ────────────────────────────────────────────────────────

export interface ResumenPeriodo {
  totalClientes:          number;
  cuentasActivas:         number;
  saldoTotalCuentas:      number;
  transacciones:          number;
  montoTransacciones:     number;
  fraudesPotenciales:     number;
  cobrosExcedidos:        number;
  prestamosActivos:       number;
  montoPrestamos:         number;
}

export interface FraudePeriodo {
  totalFraudes: number;
  montoTotal:   number;
  tasaFraude:   number;
}

// ── Helper: convierte RangoFechas en query string ─────────────────────────────

const toParams = (r: RangoFechas) =>
  `desde=${r.desde}&hasta=${r.hasta}`;

// ── Servicio ──────────────────────────────────────────────────────────────────

export const dashboardPeriodoService = {

  /** Resumen de KPIs generales filtrado por período */
  getResumenPeriodo: (rango: RangoFechas): Promise<ResumenPeriodo> =>
    api.get(`/kpis/resumen-periodo?${toParams(rango)}`).then(r => r.data),

  /** Resumen de fraude ETL filtrado por período */
  getFraudePeriodo: (rango: RangoFechas): Promise<FraudePeriodo> =>
    api.get(`/etl/resumen-periodo?${toParams(rango)}`).then(r => r.data),

  /** Transacciones agrupadas por canal, filtradas por período */
  getCanalPeriodo: (rango: RangoFechas) =>
    api.get(`/kpis/canal-periodo?${toParams(rango)}`).then(r => r.data),

  /** Clientes nuevos (fecha_apertura de cuenta) en el período */
  getClientesNuevosPeriodo: (rango: RangoFechas): Promise<{ nuevos: number }> =>
    api.get(`/kpis/clientes-nuevos?${toParams(rango)}`).then(r => r.data),

  /** Préstamos otorgados en el período */
  getPrestamosPeriodo: (rango: RangoFechas) =>
    api.get(`/kpis/prestamos-periodo?${toParams(rango)}`).then(r => r.data),

};