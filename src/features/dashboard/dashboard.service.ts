import { api } from '@/src/lib/axios';
import type {
  KpisResumen, EtlResumen,
  FraudePorCanal, FraudePorCategoria, FraudePorMes,
  DebilidadesResponse,
  ClientesPorSegmento, ClientesPorGenero,
  PrestamosPorTipo, SaldoPorTipoCuenta,
  ScoreCrediticio, TendenciaMes, CobrosExcedidos,
} from './dashboard.types';

export const dashboardService = {
  // ── KPIs generales ──────────────────────────────────────────
  getKpisResumen:        (): Promise<KpisResumen>             => api.get('/kpis/resumen').then(r => r.data),
  getDebilidades:        (): Promise<DebilidadesResponse>     => api.get('/kpis/debilidades').then(r => r.data),

  // ── KPIs de clientes ────────────────────────────────────────
  getClientesPorSegmento: (): Promise<ClientesPorSegmento[]> => api.get('/kpis/clientes-por-segmento').then(r => r.data),
  getClientesPorGenero:   (): Promise<ClientesPorGenero[]>   => api.get('/kpis/clientes-por-genero').then(r => r.data),

  // ── KPIs de transacciones ────────────────────────────────────
  getTendencia:           (): Promise<TendenciaMes[]>        => api.get('/kpis/tendencia').then(r => r.data),

  // ── KPIs de préstamos y cuentas ─────────────────────────────
  getPrestamosPorTipo:    (): Promise<PrestamosPorTipo[]>    => api.get('/kpis/prestamos-por-tipo').then(r => r.data),
  getSaldoPorTipoCuenta:  (): Promise<SaldoPorTipoCuenta[]>  => api.get('/kpis/saldo-por-tipo-cuenta').then(r => r.data),
  getScoreCrediticio:     (): Promise<ScoreCrediticio[]>     => api.get('/kpis/score-crediticio').then(r => r.data),
  getCobrosExcedidos:     (): Promise<CobrosExcedidos[]>     => api.get('/kpis/cobros-excedidos').then(r => r.data),

  // ── ETL de fraude ────────────────────────────────────────────
  getEtlResumen:          (): Promise<EtlResumen>            => api.get('/etl/resumen').then(r => r.data),
  getFraudePorCanal:      (): Promise<FraudePorCanal[]>      => api.get('/etl/fraude-por-canal').then(r => r.data),
  getFraudePorCategoria:  (): Promise<FraudePorCategoria[]>  => api.get('/etl/fraude-por-categoria').then(r => r.data),
  getFraudePorMes:        (): Promise<FraudePorMes[]>        => api.get('/etl/fraude-por-mes').then(r => r.data),
};
