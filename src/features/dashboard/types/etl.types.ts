export interface EtlResumen {
  total_transacciones:    number;
  total_fraudes:          number;
  tasa_fraude_pct:        number;
  monto_total_fraude:     number;
  monto_total_fraude_usd: number | null;
  monto_promedio_fraude:  number;
  monto_maximo_fraude:    number;
}

export interface FraudePorCanal {
  canal:         string;
  total_fraudes: number;
  monto_total:   number;
  porcentaje:    number;
}

export interface FraudePorCategoria {
  categoria:      string;
  total_fraudes:  number;
  monto_total:    number;
  monto_promedio: number;
}

export interface FraudePorMes {
  año_mes:       string;
  total_fraudes: number;
  monto_total:   number;
}

export interface FraudeGeo {
  lat:            number;
  lng:            number;
  total_fraudes:  number;
  monto_total:    number;
  monto_promedio: number;
  categoria_top:  string;
  canal_top:      string;
}

export interface FraudeComercio {
  comercio:           string;
  categoria:          string;
  total_fraudes:      number;
  monto_total:        number;
  monto_promedio:     number;
  clientes_afectados: number;
  ultima_alerta:      string;
}export interface EtlResumen {
  total_transacciones:    number;
  total_fraudes:          number;
  tasa_fraude_pct:        number;
  monto_total_fraude:     number;
  monto_total_fraude_usd: number | null;
  monto_promedio_fraude:  number;
  monto_maximo_fraude:    number;
}

export interface FraudePorCanal {
  canal:         string;
  total_fraudes: number;
  monto_total:   number;
  porcentaje:    number;
}

export interface FraudePorCategoria {
  categoria:      string;
  total_fraudes:  number;
  monto_total:    number;
  monto_promedio: number;
}

export interface FraudePorMes {
  año_mes:       string;
  total_fraudes: number;
  monto_total:   number;
}

export interface FraudeGeo {
  lat:            number;
  lng:            number;
  total_fraudes:  number;
  monto_total:    number;
  monto_promedio: number;
  categoria_top:  string;
  canal_top:      string;
}

export interface FraudeComercio {
  comercio:           string;
  categoria:          string;
  total_fraudes:      number;
  monto_total:        number;
  monto_promedio:     number;
  clientes_afectados: number;
  ultima_alerta:      string;
}