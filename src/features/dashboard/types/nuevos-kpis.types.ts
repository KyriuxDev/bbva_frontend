export interface PagosPorEstatus {
  estatus:    string;
  total:      number;
  porcentaje: number;
}

export interface PagosPorCanal {
  canal:      string;
  total:      number;
  porcentaje: number;
}

export interface SegurosPorEstatus {
  estatus:    string;
  total:      number;
  porcentaje: number;
}

export interface PrimaAnualResumen {
  prima_promedio:  number;
  prima_total:     number;
  total_polizas:   number;
}

export interface NotificacionesPorEstatus {
  estatus:    string;
  total:      number;
  porcentaje: number;
}

export interface NotificacionesPorCanal {
  canal:      string;
  total:      number;
  porcentaje: number;
}

export interface CuentasPorSucursal {
  sucursal:      string;
  nuevas_cuentas: number;
}

export interface NominaResumen {
  total_empresas:         number;
  con_nomina_bbva:        number;
  sin_nomina_bbva:        number;
  porcentaje_penetracion: number;
}