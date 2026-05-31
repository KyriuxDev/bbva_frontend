// ── Tarjetas de crédito ───────────────────────────────────────────────────
 
export interface UtilizacionCredito {
  tipo_tarjeta:         string;
  total_tarjetas:       number;
  utilizacion_promedio: number;   // % promedio saldo/límite
  saldo_total:          number;
  limite_total:         number;
}
 
export interface UtilizacionCreditoResumen {
  utilizacion_global: number;
  total_tarjetas:     number;
  saldo_total:        number;
  limite_total:       number;
}
 
export interface MorosidadTarjeta {
  tipo_tarjeta:   string;
  total:          number;
  morosas:        number;
  al_corriente:   number;
  tasa_morosidad: number;
}
 
export interface MorosidadTarjetaResumen {
  total_activas:  number;
  total_morosas:  number;
  tasa_morosidad: number;
}
 
// ── Préstamos ─────────────────────────────────────────────────────────────
 
export interface TasaInteresPrestamo {
  tipo_prestamo: string;
  total:         number;
  tasa_promedio: number;
  tasa_minima:   number;
  tasa_maxima:   number;
  monto_total:   number;
}
 
// ── Metas de ahorro ───────────────────────────────────────────────────────
 
export interface MetaAhorroPorEstatus {
  estatus:    string;
  total:      number;
  porcentaje: number;
}
 
export interface MetaAhorroProgreso {
  progreso_promedio:    number;
  total_activas:        number;
  monto_objetivo_total: number;
  monto_actual_total:   number;
}
 