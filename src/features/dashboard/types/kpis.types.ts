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

export interface ClientesPorSegmento { segmento: string; total: number; }
export interface ClientesPorGenero   { genero:   string; total: number; }

export interface PrestamosPorTipo {
  tipo:        string;
  total:       number;
  saldo_total: number;
}

export interface SaldoPorTipoCuenta {
  tipo:          string;
  total_cuentas: number;
  saldo_total:   number;
}

export interface ScoreCrediticio { rango: string; total: number; }

export interface TendenciaMes {
  mes:         string;
  total:       number;
  monto_total: number;
}

export interface CobrosExcedidos {
  tipo:             string;
  total:            number;
  diferencia_total: number;
}