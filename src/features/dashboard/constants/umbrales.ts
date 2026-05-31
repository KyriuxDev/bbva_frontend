export const UMBRALES: Record<string, number> = {
  porcentajeFraudePotencial:   5,
  porcentajeCobrosExcedidos:   10,
  porcentajeCuentasCanceladas: 20,
  porcentajePrestamosVencidos: 15,
  porcentajeMetasFallidas:     30,
};

export const EXPLICACIONES: Record<string, string> = {
  'Fraude Potencial':         'de cada 100 transacciones son sospechosas de fraude',
  'Cobros Excedidos':         'de cada 100 cobros superan el límite permitido por regulación',
  'Cuentas Canceladas':       'de cada 100 cuentas fueron cerradas en el periodo',
  'Préstamos Vencidos':       'de cada 100 clientes no están pagando su préstamo a tiempo',
  'Metas de Ahorro Fallidas': 'de cada 100 metas de ahorro no se completaron',
};

export const PASOS_ACCION: Record<string, string[]> = {
  Seguridad: [
    'Revisar las transacciones marcadas como sospechosas en el último período',
    'Bloquear temporalmente las cuentas con más de 3 alertas activas',
    'Notificar al cliente vía app y solicitar confirmación de actividad reciente',
    'Reportar los patrones detectados al equipo de ciberseguridad',
  ],
  Cumplimiento: [
    'Auditar los tipos de cobro que superan el límite regulatorio',
    'Ajustar los parámetros de cobro en el sistema de facturación',
    'Generar reporte de incidencias para el área de cumplimiento normativo',
    'Capacitar al equipo en la normativa de cobros vigente',
  ],
  Retención: [
    'Identificar los motivos de cancelación más frecuentes mediante encuestas',
    'Contactar a clientes en riesgo de cancelación con oferta de retención personalizada',
    'Diseñar programa de beneficios para cuentas con más de 12 meses de antigüedad',
    'Analizar si el problema es de producto, precio o experiencia de usuario',
  ],
  Cartera: [
    'Identificar a los clientes con más de 30 días de atraso en sus pagos',
    'Enviar notificación de reestructuración de deuda con opciones flexibles',
    'Ofrecer plan de pagos con quita de intereses moratorios para casos críticos',
    'Escalar a cobranza extrajudicial si el atraso supera los 90 días',
  ],
  Ahorro: [
    'Revisar si las metas configuradas son alcanzables con el perfil financiero del cliente',
    'Enviar recordatorios automáticos cuando el ahorro está por debajo del ritmo esperado',
    'Proponer metas ajustadas con montos más pequeños y plazos más cortos',
    'Analizar en qué punto del periodo se abandona la meta con mayor frecuencia',
  ],
};

export const OBJ_CONFIG: Record<string, {
  umbral:    number;
  titulo:    string;
  meta:      number;
  area:      string;
  icono:     string;
  prioridad: 'Alta' | 'Media' | 'Baja';
  acciones:  string[];
}> = {
  porcentajePrestamosVencidos: {
    umbral: 15, titulo: 'Reducir préstamos vencidos al 15%', meta: 15,
    area: 'Crédito y Cobranza', icono: 'card-outline', prioridad: 'Alta',
    acciones: [
      'Contactar clientes con +30 días de atraso',
      'Ofrecer reestructuración de deuda',
      'Activar campaña de regularización',
    ],
  },
  porcentajeFraudePotencial: {
    umbral: 1.5, titulo: 'Reducir tasa de fraude al 1.5%', meta: 1.5,
    area: 'Seguridad y Prevención', icono: 'shield-outline', prioridad: 'Alta',
    acciones: [
      'Activar alertas de transacciones inusuales',
      'Reforzar autenticación en canales digitales',
      'Revisar patrones de fraude por zona geográfica',
    ],
  },
  porcentajeCobrosExcedidos: {
    umbral: 7, titulo: 'Reducir cobros excedidos al 7%', meta: 7,
    area: 'Cumplimiento Normativo', icono: 'business-outline', prioridad: 'Media',
    acciones: [
      'Auditar tipos de cobro fuera de límite regulatorio',
      'Actualizar parámetros en sistema de facturación',
      'Capacitar al equipo en normativa de cobros vigente',
    ],
  },
  porcentajeCuentasCanceladas: {
    umbral: 10, titulo: 'Reducir cancelaciones al 10%', meta: 10,
    area: 'Retención de Clientes', icono: 'people-outline', prioridad: 'Media',
    acciones: [
      'Identificar causas de cancelación con encuestas',
      'Lanzar oferta de retención personalizada',
      'Diseñar programa de beneficios por antigüedad',
    ],
  },
  porcentajeMetasFallidas: {
    umbral: 20, titulo: 'Mejorar cumplimiento de metas al 80%', meta: 20,
    area: 'Productos de Ahorro', icono: 'wallet-outline', prioridad: 'Baja',
    acciones: [
      'Revisar metas vs perfil financiero del cliente',
      'Enviar recordatorios automáticos de progreso',
      'Ofrecer ajuste de metas con plazos más cortos',
    ],
  },
};