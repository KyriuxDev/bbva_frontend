import { api } from '@/src/lib/axios';
import type {
  KpisResumen, EtlResumen,
  FraudePorCanal, FraudePorCategoria, FraudePorMes,
  DebilidadesResponse,
  ClientesPorSegmento, ClientesPorGenero,
  PrestamosPorTipo, SaldoPorTipoCuenta,
  ScoreCrediticio, TendenciaMes, CobrosExcedidos,
  FraudeGeo, FraudeComercio,
  // Nuevos KPIs
  PagosPorEstatus, PagosPorCanal,
  SegurosPorEstatus, PrimaAnualResumen,
  NotificacionesPorEstatus, NotificacionesPorCanal,
  CuentasPorSucursal, NominaResumen,
} from './types';

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

  // ── ETL geo y comercios ──────────────────────────────────────
  getFraudeGeografico:    (): Promise<FraudeGeo[]>           => api.get('/etl/fraude-geografico').then(r => r.data),
  getFraudePorComercio:   (): Promise<FraudeComercio[]>      => api.get('/etl/fraude-por-comercio').then(r => r.data),

  // ── Pagos ────────────────────────────────────────────────────
  // KPI: Tasa de éxito en pagos — confiabilidad operativa
  getPagosPorEstatus:     (): Promise<PagosPorEstatus[]>     => api.get('/kpis/pagos-por-estatus').then(r => r.data),
  // KPI: Canal de pago más utilizado — preferencias de clientes
  getPagosPorCanal:       (): Promise<PagosPorCanal[]>       => api.get('/kpis/pagos-por-canal').then(r => r.data),

  // ── Seguros & Ahorro ─────────────────────────────────────────
  // KPI: Pólizas activas vs canceladas — retención de seguros
  getSegurosPorEstatus:   (): Promise<SegurosPorEstatus[]>   => api.get('/kpis/seguros-por-estatus').then(r => r.data),
  // KPI: Prima anual promedio — rentabilidad del portafolio de seguros
  getPrimaAnual:          (): Promise<PrimaAnualResumen>     => api.get('/kpis/prima-anual').then(r => r.data),

  // ── Comunicación ─────────────────────────────────────────────
  // KPI: Tasa de entrega de notificaciones — efectividad del canal
  getNotificacionesPorEstatus: (): Promise<NotificacionesPorEstatus[]> => api.get('/kpis/notificaciones-por-estatus').then(r => r.data),
  // KPI: Canal de notificación con mayor alcance — optimizar comunicación
  getNotificacionesPorCanal:   (): Promise<NotificacionesPorCanal[]>   => api.get('/kpis/notificaciones-por-canal').then(r => r.data),

  // ── Captación / Sucursales ───────────────────────────────────
  // KPI: Nuevas cuentas abiertas por sucursal — desempeño comercial regional
  getCuentasPorSucursal:  (): Promise<CuentasPorSucursal[]>  => api.get('/kpis/cuentas-por-sucursal').then(r => r.data),

  // ── Cross-selling Nómina ─────────────────────────────────────
  // KPI: % empresas con nómina BBVA — penetración del producto
  getNominaResumen:       (): Promise<NominaResumen>         => api.get('/kpis/nomina-resumen').then(r => r.data),
};