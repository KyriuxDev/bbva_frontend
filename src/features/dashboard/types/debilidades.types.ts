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