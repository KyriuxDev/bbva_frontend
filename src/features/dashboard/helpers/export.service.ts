import * as Print   from 'expo-print';
import * as Sharing from 'expo-sharing';
import {
  pdfFecha, pdfBarsSvg, pdfLineSvg,
  buildDocHtml, buildFullReportHtml,
  esc,
} from './pdf';
import { fmt, fmtMXN, fmtMesLargo, calcTrimestre } from './format';

// ── Tipos de datos del dashboard ──────────────────────────────────────────────
import type {
  FraudePorMes, FraudePorCanal, FraudePorCategoria,
  PrestamosPorTipo, SaldoPorTipoCuenta,
  ScoreCrediticio, CobrosExcedidos,
  EtlResumen, KpisResumen,
  ClientesPorSegmento, ClientesPorGenero,
  PagosPorEstatus, PagosPorCanal,
  SegurosPorEstatus, PrimaAnualResumen,
  NotificacionesPorEstatus, NotificacionesPorCanal,
  CuentasPorSucursal, NominaResumen,
  UtilizacionCredito, UtilizacionCreditoResumen,
  MorosidadTarjeta, MorosidadTarjetaResumen,
  TasaInteresPrestamo,
  MetaAhorroPorEstatus, MetaAhorroProgreso,
  FraudeGeo, FraudeComercio,
} from '../types';

// ── Interfaz completa de datos del dashboard ──────────────────────────────────
export interface DashboardExportData {
  // Generales
  kpisResumen?:      KpisResumen;
  etlResumen?:       EtlResumen;
  // Fraude
  fraudePorMes?:       FraudePorMes[];
  fraudePorCanal?:     FraudePorCanal[];
  fraudePorCategoria?: FraudePorCategoria[];
  fraudeGeo?:          FraudeGeo[];
  fraudeComercio?:     FraudeComercio[];
  // Clientes
  segmentos?: ClientesPorSegmento[];
  generos?:   ClientesPorGenero[];
  // Cuentas y préstamos
  saldoCuentas?: SaldoPorTipoCuenta[];
  prestamos?:    PrestamosPorTipo[];
  cobrosExc?:    CobrosExcedidos[];
  scores?:       ScoreCrediticio[];
  // Tarjetas
  utilizacionCredito?:  UtilizacionCredito[];
  utilizacionResumen?:  UtilizacionCreditoResumen;
  morosidadTarjetas?:   MorosidadTarjeta[];
  morosidadResumen?:    MorosidadTarjetaResumen;
  tasasInteres?:        TasaInteresPrestamo[];
  // Metas
  metasEstatus?:  MetaAhorroPorEstatus[];
  metasProgreso?: MetaAhorroProgreso;
  // Pagos
  pagosPorEstatus?: PagosPorEstatus[];
  pagosPorCanal?:   PagosPorCanal[];
  // Seguros
  segurosPorEstatus?: SegurosPorEstatus[];
  primaAnual?:        PrimaAnualResumen;
  // Notificaciones
  notiEstatus?: NotificacionesPorEstatus[];
  notiCanal?:   NotificacionesPorCanal[];
  // Sucursales
  cuentasSucursal?: CuentasPorSucursal[];
  nominaRes?:       NominaResumen;
  // Debilidades
  debilidadesData?: any;
  soluciones?:      any[];
  indicadores?:     Record<string, number>;
}

// ── Helper: compartir PDF ─────────────────────────────────────────────────────
const sharePdf = async (html: string, dialogTitle = 'Exportar PDF') => {
  const { uri } = await Print.printToFileAsync({ html, base64: false });
  await Sharing.shareAsync(uri, {
    mimeType:    'application/pdf',
    UTI:         'com.adobe.pdf',
    dialogTitle,
  });
};

// ── Helpers HTML internos ─────────────────────────────────────────────────────
const sec = (title: string, content: string, acciones: string[]) =>
  `<div class="sec">
    <div class="sec-title">${esc(title)}</div>
    ${content}
    <div class="acciones-title">Acciones recomendadas</div>
    ${acciones.map((a, i) => `
      <div class="accion">
        <div class="accion-num">${i + 1}</div>
        <div class="accion-txt">${esc(a)}</div>
      </div>`).join('')}
  </div>`;

const chips = (
  items: { label: string; val: string; variant?: 'ok' | 'risk' | 'warn' }[]
) =>
  `<div class="chips">${items.map(c => `
    <div class="chip">
      <div class="chip-lbl">${esc(c.label)}</div>
      <div class="chip-val ${c.variant ?? ''}">${esc(c.val)}</div>
    </div>`).join('')}
  </div>`;

const table = (rows: { label: string; val: string }[]) =>
  `<table class="table">
    <thead><tr><th>Indicador</th><th>Valor</th></tr></thead>
    <tbody>${rows.map(r =>
      `<tr><td>${esc(r.label)}</td><td>${esc(r.val)}</td></tr>`
    ).join('')}</tbody>
  </table>`;

// Las conclusiones admiten HTML interno (<b>) por eso no usan esc()
const conclusion = (text: string, isAlert = false) =>
  `<div class="conclusion${isAlert ? ' alert' : ''}">${text}</div>`;

// ── Reporte global ────────────────────────────────────────────────────────────
export const exportFullReport = async (data: DashboardExportData) => {
  const fecha = pdfFecha();
  const tri   = calcTrimestre();
  const html  = buildFullReportHtml({ fecha, tri, ...data });

  const { uri } = await Promise.race([
    Print.printToFileAsync({ html, base64: false }),
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Timeout al generar el PDF')), 30_000)
    ),
  ]);

  await Sharing.shareAsync(uri, {
    mimeType:    'application/pdf',
    UTI:         'com.adobe.pdf',
    dialogTitle: 'Exportar Reporte Ejecutivo BBVA',
  });
};

// ── Reportes individuales ─────────────────────────────────────────────────────
export const exportKpi = async (id: string, data: DashboardExportData) => {
  const fecha    = pdfFecha();
  const tri      = calcTrimestre();
  const {
    fraudePorMes = [], fraudePorCanal = [], fraudePorCategoria = [],
    fraudeComercio = [], prestamos = [], saldoCuentas = [], cobrosExc = [],
    scores = [], etlResumen, kpisResumen,
    segmentos = [], generos = [],
    pagosPorEstatus = [], pagosPorCanal = [],
    segurosPorEstatus = [], primaAnual,
    notiEstatus = [], notiCanal = [],
    cuentasSucursal = [], nominaRes,
    utilizacionCredito = [], utilizacionResumen,
    morosidadTarjetas = [], morosidadResumen,
    tasasInteres = [],
    metasEstatus = [], metasProgreso,
  } = data;

  let body = '';

  // ── FRAUDE: Tendencia mensual ───────────────────────────────────────────────
  if (id === 'fraude-tendencia') {
    if (!fraudePorMes.length) throw new Error('Sin datos de tendencia');
    const items  = fraudePorMes.map(d => ({ label: d.año_mes.substring(5), value: d.total_fraudes }));
    const peakV  = Math.max(...fraudePorMes.map(d => d.total_fraudes));
    const peakM  = fraudePorMes.find(d => d.total_fraudes === peakV)!;
    const tercio = Math.max(1, Math.floor(fraudePorMes.length / 3));
    const avgIni = fraudePorMes.slice(0, tercio).reduce((s, d) => s + d.total_fraudes, 0) / tercio;
    const avgFin = fraudePorMes.slice(-tercio).reduce((s, d) => s + d.total_fraudes, 0) / tercio;
    const isAlza = avgFin > avgIni;

    body = sec(
      'Tendencia Mensual de Fraudes',
      `${chips([
        { label: 'Meses analizados', val: String(fraudePorMes.length) },
        { label: 'Pico máximo',      val: `${fmt(peakV)} en ${peakM.año_mes.substring(5)}`, variant: 'risk' },
        { label: 'Tendencia',        val: isAlza ? '↑ Al alza' : '↓ A la baja', variant: isAlza ? 'risk' : 'ok' },
      ])}
      <div class="chart">${pdfLineSvg(items)}</div>
      ${conclusion(
        isAlza
          ? `Los fraudes están en aumento. <b>${fmtMesLargo(peakM.año_mes)}</b> fue el mes más crítico con <b>${fmt(peakV)}</b> incidentes. Los controles actuales no son suficientes.`
          : `La tendencia de fraudes muestra mejoría. <b>${fmtMesLargo(peakM.año_mes)}</b> fue el pico máximo, pero los niveles recientes son más bajos.`,
        isAlza
      )}`,
      isAlza ? [
        'Revisar y actualizar inmediatamente las reglas del motor de detección de fraude.',
        'Activar alerta de nivel crítico al equipo de seguridad y al Comité de Riesgos.',
        'Implementar doble verificación (OTP + biometría) en transacciones superiores a $5,000 MXN.',
        'Analizar qué canal y categoría impulsaron el aumento y priorizar controles en ellos.',
        'Establecer revisión diaria de métricas de fraude hasta que la tendencia sea estable.',
      ] : [
        'Mantener los controles actuales que están generando la mejoría.',
        'Documentar qué acciones se tomaron para replicarlas en futuros incrementos.',
        'Continuar el monitoreo semanal para detectar repuntes a tiempo.',
        'Revisar si quedan patrones residuales en el mes con mayor incidencia.',
      ]
    );
  }

  // ── FRAUDE: Por categoría ───────────────────────────────────────────────────
  else if (id === 'fraude-categoria') {
    if (!fraudePorCategoria.length) throw new Error('Sin datos de categorías');
    const top4   = fraudePorCategoria.slice(0, 8);
    const catMax = top4.reduce((m, d) => d.total_fraudes > m.total_fraudes ? d : m);
    const catMin = top4.reduce((m, d) => d.total_fraudes < m.total_fraudes ? d : m);

    body = sec(
      'Fraude por Categoría',
      `${chips([
        { label: 'Categorías',     val: String(top4.length) },
        { label: 'Mayor riesgo',   val: catMax.categoria, variant: 'risk' },
        { label: 'Menor riesgo',   val: catMin.categoria, variant: 'ok' },
      ])}
      <div class="chart">${pdfBarsSvg(top4.map(d => ({ label: d.categoria, value: d.total_fraudes })), '#ba1a1a')}</div>
      ${table(top4.map(d => ({
        label: d.categoria,
        val:   `${fmt(d.total_fraudes)} fraudes — ${fmtMXN(d.monto_total)} — prom ${fmtMXN(d.monto_promedio)}`,
      })))}
      ${conclusion(`La categoría <b>${catMax.categoria}</b> concentra la mayor incidencia. Focalizar los controles aquí tendrá el mayor impacto.`, true)}`,
      [
        `Priorizar revisión manual de transacciones en la categoría "${catMax.categoria}".`,
        'Actualizar las reglas de scoring para penalizar patrones típicos de esta categoría.',
        'Coordinar con los comercios afectados para implementar controles en punto de venta.',
        'Establecer límites de monto más estrictos para clientes con historial en esta categoría.',
        'Revisar si el problema es estacional y anticipar incrementos en los mismos períodos del año.',
      ]
    );
  }

  // ── PRÉSTAMOS: Por tipo ─────────────────────────────────────────────────────
  else if (id === 'prestamos') {
    if (!prestamos.length) throw new Error('Sin datos de préstamos');
    const prestMax   = prestamos.reduce((m, d) => d.total > m.total ? d : m);
    const prestMin   = prestamos.reduce((m, d) => d.total < m.total ? d : m);
    const totalPrest = prestamos.reduce((s, d) => s + d.total, 0);

    body = sec(
      'Préstamos por Tipo',
      `${chips([
        { label: 'Tipos',         val: String(prestamos.length) },
        { label: 'Mayor demanda', val: prestMax.tipo, variant: 'ok' },
        { label: 'Menor demanda', val: prestMin.tipo, variant: 'warn' },
        { label: 'Total',         val: fmt(totalPrest) },
      ])}
      <div class="chart">${pdfBarsSvg(prestamos.map(p => ({ label: p.tipo, value: p.total })))}</div>
      ${table(prestamos.map(p => ({
        label: p.tipo,
        val:   `${fmt(p.total)} préstamos — ${fmtMXN(Number(p.saldo_total))}`,
      })))}
      ${conclusion(`Los préstamos <b>${prestMax.tipo}</b> son los más solicitados y representan la mayor exposición crediticia. Los <b>${prestMin.tipo}</b> tienen menor demanda; revisar condiciones de mercado.`)}`,
      [
        `Revisar la política de otorgamiento de "${prestMax.tipo}" dado que representan mayor exposición.`,
        `Evaluar si las condiciones de "${prestMin.tipo}" son competitivas en el mercado actual.`,
        'Monitorear la tasa de vencimiento por tipo para anticipar riesgo crediticio.',
        'Diseñar campañas para los tipos con menor penetración y mayor potencial de mercado.',
        'Revisar provisiones de cartera para asegurar cobertura adecuada según el mix actual.',
      ]
    );
  }

  // ── CUENTAS: Saldo por tipo ─────────────────────────────────────────────────
  else if (id === 'saldo-cuentas') {
    if (!saldoCuentas.length) throw new Error('Sin datos de saldo');
    const saldoMax   = saldoCuentas.reduce((m, d) => Number(d.saldo_total) > Number(m.saldo_total) ? d : m);
    const saldoMin   = saldoCuentas.reduce((m, d) => Number(d.saldo_total) < Number(m.saldo_total) ? d : m);
    const totalSaldo = saldoCuentas.reduce((s, d) => s + Number(d.saldo_total), 0);

    body = sec(
      'Saldo por Tipo de Cuenta',
      `${chips([
        { label: 'Tipos',        val: String(saldoCuentas.length) },
        { label: 'Mayor saldo',  val: saldoMax.tipo, variant: 'ok' },
        { label: 'Menor saldo',  val: saldoMin.tipo, variant: 'warn' },
        { label: 'Saldo total',  val: fmtMXN(totalSaldo), variant: 'ok' },
      ])}
      <div class="chart">${pdfBarsSvg(saldoCuentas.map(c => ({ label: c.tipo, value: Number(c.saldo_total) })), '#1973B8')}</div>
      ${table(saldoCuentas.map(c => ({
        label: c.tipo,
        val:   `${fmt(c.total_cuentas)} cuentas — ${fmtMXN(Number(c.saldo_total))}`,
      })))}
      ${conclusion(`Las cuentas <b>${saldoMax.tipo}</b> concentran la mayor liquidez. Requieren monitoreo constante de movimientos inusuales.`)}`,
      [
        `Establecer alertas automáticas para movimientos inusuales en cuentas "${saldoMax.tipo}".`,
        'Revisar la distribución de saldo para detectar concentración de riesgo en pocos clientes.',
        `Evaluar si las cuentas "${saldoMin.tipo}" tienen condiciones atractivas para incrementar captación.`,
        'Implementar segmentación por saldo para ofrecer productos diferenciados.',
        'Monitorear la evolución mensual del saldo total como indicador de salud de la captación.',
      ]
    );
  }

  // ── CRÉDITO: Score crediticio ───────────────────────────────────────────────
  else if (id === 'score') {
    if (!scores.length) throw new Error('Sin datos de score');
    const scoreTop   = scores.reduce((m, d) => d.total > m.total ? d : m);
    const firstNum   = parseInt(scoreTop.rango.split(/[-\s]/)[0], 10);
    const isRisk     = !isNaN(firstNum) && firstNum < 600;
    const totalScore = scores.reduce((s, d) => s + d.total, 0);

    body = sec(
      'Distribución de Score Crediticio',
      `${chips([
        { label: 'Rangos',         val: String(scores.length) },
        { label: 'Rango dominante',val: scoreTop.rango, variant: isRisk ? 'risk' : 'ok' },
        { label: 'Total clientes', val: fmt(totalScore) },
      ])}
      <div class="chart">${pdfBarsSvg(scores.map(sc => ({ label: sc.rango, value: sc.total })), '#7c3aed')}</div>
      ${table(scores.map(sc => ({
        label: sc.rango,
        val:   `${fmt(sc.total)} clientes (${((sc.total / totalScore) * 100).toFixed(1)}%)`,
      })))}
      ${conclusion(
        isRisk
          ? `El rango <b>${scoreTop.rango}</b> concentra el mayor número de clientes. Score bajo implica mayor riesgo de impago; reforzar el análisis en nuevas solicitudes.`
          : `El rango <b>${scoreTop.rango}</b> es el predominante. Perfil crediticio saludable con margen para ampliar productos.`,
        isRisk
      )}`,
      isRisk ? [
        'Reforzar el análisis crediticio para nuevas solicitudes en rangos de score más bajo.',
        'Implementar modelos predictivos de impago basados en comportamiento transaccional.',
        'Diseñar productos de crédito escalonado para clientes con score en mejora progresiva.',
        'Activar programas de educación financiera para clientes con score por debajo de 600.',
        'Revisar criterios de otorgamiento para reducir exposición en segmentos de riesgo.',
      ] : [
        'Aprovechar el perfil saludable para lanzar campañas de crédito preaprobado.',
        'Diseñar ofertas de ampliación de límite para los clientes en rangos más altos.',
        'Monitorear la evolución trimestral del score para detectar deterioro temprano.',
        'Usar el score como criterio de segmentación para campañas de cross-selling.',
      ]
    );
  }

  // ── COMISIONES: Cobros excedidos ────────────────────────────────────────────
  else if (id === 'cobros') {
    body = sec(
      'Cobros Excedidos por Tipo',
      cobrosExc.length > 0
        ? `${chips([
            { label: 'Tipos con exceso', val: String(cobrosExc.length), variant: 'risk' },
            { label: 'Total excedidos',  val: fmt(cobrosExc.reduce((s, c) => s + c.total, 0)), variant: 'risk' },
          ])}
          <div class="chart">${pdfBarsSvg(cobrosExc.map(c => ({ label: c.tipo, value: c.total })), '#ba1a1a')}</div>
          ${table(cobrosExc.map(c => ({
            label: c.tipo,
            val:   `${fmt(c.total)} cobros — diferencia ${fmtMXN(c.diferencia_total)}`,
          })))}
          ${conclusion('Se detectaron cobros que superan los límites regulatorios. Se requiere acción correctiva inmediata para evitar sanciones.', true)}`
        : `<div class="alerta-box-ok">
            <div class="alerta-title" style="color:#27ae60;">✓ Sin cobros excedidos detectados</div>
            <div class="alerta-body">Todos los cobros se encuentran dentro de los límites regulatorios en este período.</div>
          </div>`,
      cobrosExc.length > 0 ? [
        'Auditar de inmediato los tipos de cobro fuera de límite e identificar el origen del exceso.',
        'Corregir los parámetros en el sistema de facturación en un plazo máximo de 72 horas.',
        'Notificar al área de Cumplimiento Normativo y generar reporte de incidencias.',
        'Reembolsar a los clientes afectados y documentar el proceso para la auditoría.',
        'Capacitar al equipo en la normativa de cobros vigente para prevenir recurrencia.',
      ] : [
        'Mantener el monitoreo mensual de cobros para detectar desviaciones a tiempo.',
        'Documentar las reglas de validación actuales para referencia en auditorías.',
        'Revisar si los parámetros del sistema están actualizados con la normativa más reciente.',
      ]
    );
  }

  // ── ETL: Pipeline ───────────────────────────────────────────────────────────
  else if (id === 'etl') {
    if (!etlResumen) throw new Error('Sin datos ETL');
    const tasa     = etlResumen.tasa_fraude_pct ?? 0;
    const isAlerta = tasa > 3;

    body = sec(
      'Pipeline ETL — Análisis de Fraude',
      `${chips([
        { label: 'Transacciones',   val: fmt(etlResumen.total_transacciones) },
        { label: 'Fraudes',         val: fmt(etlResumen.total_fraudes), variant: 'risk' },
        { label: 'Tasa de fraude',  val: `${tasa.toFixed(2)}%`, variant: isAlerta ? 'risk' : 'ok' },
        { label: 'Monto en riesgo', val: fmtMXN(etlResumen.monto_total_fraude), variant: 'risk' },
      ])}
      ${table([
        { label: 'Transacciones analizadas', val: fmt(etlResumen.total_transacciones) },
        { label: 'Fraudes detectados',        val: fmt(etlResumen.total_fraudes) },
        { label: 'Tasa de fraude',            val: `${tasa.toFixed(2)}%` },
        { label: 'Monto total en riesgo',     val: fmtMXN(etlResumen.monto_total_fraude) },
        { label: 'Monto promedio por fraude', val: fmtMXN(etlResumen.monto_promedio_fraude) },
        { label: 'Monto máximo registrado',   val: fmtMXN(etlResumen.monto_maximo_fraude) },
      ])}
      ${conclusion(
        isAlerta
          ? `Tasa de fraude del <b>${tasa.toFixed(2)}%</b>, por encima del umbral del 3%. Se requiere revisión urgente del pipeline.`
          : `Tasa del <b>${tasa.toFixed(2)}%</b> dentro de parámetros aceptables. El pipeline ETL opera correctamente.`,
        isAlerta
      )}`,
      isAlerta ? [
        'Revisar y actualizar los modelos de ML usados en el pipeline de detección.',
        'Aumentar la frecuencia de ejecución del ETL a near-real-time.',
        'Escalar al equipo de Data Science para ajuste de umbrales de clasificación.',
        'Implementar revisión manual de casos con mayor monto individual de fraude.',
        'Comparar con el mismo período del año anterior para identificar estacionalidad.',
      ] : [
        'Mantener el pipeline actualizado con los últimos patrones de fraude conocidos.',
        'Programar revisión trimestral de los modelos para evitar degradación.',
        'Documentar el desempeño actual como línea base para comparaciones futuras.',
        'Evaluar si el monto promedio por fraude está aumentando aunque la tasa sea baja.',
      ]
    );
  }

  // ── PAGOS: Por estatus ──────────────────────────────────────────────────────
  else if (id === 'pagos-estatus') {
    if (!pagosPorEstatus.length) throw new Error('Sin datos de pagos');
    const exitoso  = pagosPorEstatus.find(p => p.estatus?.toLowerCase().includes('exit'));
    const fallido  = pagosPorEstatus.find(p =>
      p.estatus?.toLowerCase().includes('fall') || p.estatus?.toLowerCase().includes('rechaz')
    );
    const esRiesgo = exitoso ? exitoso.porcentaje < 95 : false;

    body = sec(
      'Tasa de Éxito en Pagos',
      `${chips([
        { label: 'Estatus analizados', val: String(pagosPorEstatus.length) },
        ...(exitoso ? [{ label: 'Tasa de éxito', val: `${exitoso.porcentaje.toFixed(1)}%`, variant: (esRiesgo ? 'risk' : 'ok') as 'risk' | 'ok' }] : []),
        ...(fallido ? [{ label: 'Tasa de fallo', val: `${fallido.porcentaje.toFixed(1)}%`, variant: (fallido.porcentaje > 5 ? 'risk' : 'warn') as 'risk' | 'warn' }] : []),
      ])}
      <div class="chart">${pdfBarsSvg(pagosPorEstatus.map(d => ({ label: d.estatus, value: d.total })), '#00a278')}</div>
      ${table(pagosPorEstatus.map(d => ({
        label: d.estatus,
        val:   `${fmt(d.total)} pagos (${d.porcentaje.toFixed(1)}%)`,
      })))}
      ${exitoso ? conclusion(
        esRiesgo
          ? `Tasa de éxito del <b>${exitoso.porcentaje.toFixed(1)}%</b>, por debajo del <b>95%</b> recomendado. Revisar integración con redes de pago.`
          : `El <b>${exitoso.porcentaje.toFixed(1)}%</b> de los pagos se procesan exitosamente. La infraestructura opera con normalidad.`,
        esRiesgo
      ) : ''}`,
      esRiesgo ? [
        'Revisar logs de errores de las redes de pago para identificar el origen de los fallos.',
        'Ejecutar pruebas de latencia y carga en los endpoints de procesamiento.',
        'Establecer SLA de resolución máximo de 48 horas para pagos rechazados recurrentes.',
        'Notificar a los clientes afectados y ofrecer canal alternativo de pago.',
        'Coordinar con proveedores de red de pagos para mejorar la tasa de autorización.',
      ] : [
        'Mantener monitoreo 24/7 de la disponibilidad del sistema de pagos.',
        'Documentar los patrones de fallos residuales para identificar mejoras.',
        'Establecer alertas automáticas si la tasa de éxito cae por debajo del 95%.',
        'Revisar si los pagos fallidos se concentran en algún canal o tipo de cuenta.',
      ]
    );
  }

  // ── PAGOS: Por canal ────────────────────────────────────────────────────────
  else if (id === 'pagos-canal') {
    if (!pagosPorCanal.length) throw new Error('Sin datos de canal de pagos');
    const top     = pagosPorCanal.reduce((m, d) => d.total > m.total ? d : m);
    const digital = pagosPorCanal
      .filter(p => ['app','web','digital','móvil','mobile'].some(k => p.canal.toLowerCase().includes(k)))
      .reduce((s, p) => s + p.porcentaje, 0);

    body = sec(
      'Canal de Pago Más Utilizado',
      `${chips([
        { label: 'Canales activos',    val: String(pagosPorCanal.length) },
        { label: 'Canal dominante',    val: top.canal, variant: 'ok' },
        { label: 'Uso dominante',      val: `${top.porcentaje.toFixed(1)}%`, variant: 'ok' },
        ...(digital > 0 ? [{ label: 'Canales digitales', val: `${digital.toFixed(1)}%` }] : []),
      ])}
      <div class="chart">${pdfBarsSvg(pagosPorCanal.map(d => ({ label: d.canal, value: d.total })))}</div>
      ${table(pagosPorCanal.map(d => ({
        label: d.canal,
        val:   `${fmt(d.total)} pagos (${d.porcentaje.toFixed(1)}%)`,
      })))}
      ${conclusion(
        `El canal <b>${top.canal}</b> concentra el <b>${top.porcentaje.toFixed(1)}%</b> de los pagos.${digital > 0 ? ` Canales digitales: <b>${digital.toFixed(1)}%</b> del volumen total.` : ''}`
      )}`,
      [
        `Garantizar disponibilidad del 99.9% en el canal "${top.canal}" con redundancia de infraestructura.`,
        'Revisar la capacidad del canal principal para soportar picos en fechas de quincena.',
        'Evaluar si los canales con menor uso tienen problemas de UX o de comunicación.',
        'Invertir en mejora de canales digitales si su participación es menor al 40%.',
        'Establecer planes de contingencia para redirigir tráfico si el canal principal falla.',
      ]
    );
  }

  // ── SEGUROS: Por estatus ────────────────────────────────────────────────────
  else if (id === 'seguros-estatus') {
    if (!segurosPorEstatus.length) throw new Error('Sin datos de seguros');
    const activas    = segurosPorEstatus.find(s => s.estatus?.toLowerCase().includes('activ'));
    const canceladas = segurosPorEstatus.find(s => s.estatus?.toLowerCase().includes('cancel'));
    const esRiesgo   = !!(canceladas && canceladas.porcentaje > 15);

    body = sec(
      'Pólizas de Seguros por Estatus',
      `${chips([
        ...(activas    ? [{ label: 'Activas',    val: `${activas.porcentaje.toFixed(1)}%`,    variant: 'ok' as const }] : []),
        ...(canceladas ? [{ label: 'Canceladas', val: `${canceladas.porcentaje.toFixed(1)}%`, variant: (esRiesgo ? 'risk' : 'warn') as 'risk' | 'warn' }] : []),
        ...(primaAnual ? [
          { label: 'Ingreso primas', val: fmtMXN(primaAnual.prima_total),    variant: 'ok' as const },
          { label: 'Prima promedio', val: fmtMXN(primaAnual.prima_promedio) },
        ] : []),
      ])}
      ${table(segurosPorEstatus.map(s => ({
        label: s.estatus,
        val:   `${fmt(s.total)} pólizas (${s.porcentaje.toFixed(1)}%)`,
      })))}
      ${primaAnual ? table([
        { label: 'Total pólizas',  val: fmt(primaAnual.total_polizas) },
        { label: 'Prima promedio', val: fmtMXN(primaAnual.prima_promedio) },
        { label: 'Ingreso total',  val: fmtMXN(primaAnual.prima_total) },
      ]) : ''}
      ${activas ? conclusion(
        esRiesgo
          ? `Tasa de cancelación del <b>${canceladas!.porcentaje.toFixed(1)}%</b>, supera el umbral del 15%. Se requiere estrategia de retención urgente.`
          : `El <b>${activas.porcentaje.toFixed(1)}%</b> de las pólizas se mantienen activas. Portafolio con buena retención.`,
        esRiesgo
      ) : ''}`,
      esRiesgo ? [
        'Contactar clientes con pólizas canceladas en los últimos 90 días con oferta de reactivación.',
        'Revisar si el precio de las primas es competitivo comparándolo con el mercado.',
        'Implementar recordatorios automáticos de vencimiento con 60, 30 y 15 días de anticipación.',
        'Realizar encuesta post-cancelación para identificar los motivos más frecuentes.',
        'Diseñar bundles que incluyan seguro como valor añadido a otros servicios.',
      ] : [
        'Mantener comunicación proactiva con clientes sobre los beneficios de su póliza.',
        'Implementar recordatorios automáticos de renovación para mantener la tasa actual.',
        'Evaluar oportunidades de cross-selling de seguros complementarios.',
        'Revisar si hay segmentos sin cobertura de seguros que puedan ser abordados.',
      ]
    );
  }

  // ── NOTIFICACIONES: Por estatus ─────────────────────────────────────────────
  else if (id === 'notificaciones-estatus') {
    if (!notiEstatus.length) throw new Error('Sin datos de notificaciones');
    const entregadas = notiEstatus.find(n => n.estatus?.toLowerCase().includes('entreg'));
    const esOk       = entregadas ? entregadas.porcentaje >= 90 : true;

    body = sec(
      'Tasa de Entrega de Notificaciones',
      `${chips([
        ...(entregadas ? [{ label: 'Tasa de entrega', val: `${entregadas.porcentaje.toFixed(1)}%`, variant: (esOk ? 'ok' : 'risk') as 'ok' | 'risk' }] : []),
        { label: 'Tipos de estatus', val: String(notiEstatus.length) },
      ])}
      <div class="chart">${pdfBarsSvg(notiEstatus.map(d => ({ label: d.estatus, value: d.total })), '#004481')}</div>
      ${table(notiEstatus.map(n => ({
        label: n.estatus,
        val:   `${fmt(n.total)} notificaciones (${n.porcentaje.toFixed(1)}%)`,
      })))}
      ${entregadas ? conclusion(
        esOk
          ? `El <b>${entregadas.porcentaje.toFixed(1)}%</b> de las notificaciones llegan al cliente. Canal de comunicación en buen estado.`
          : `Solo el <b>${entregadas.porcentaje.toFixed(1)}%</b> de las notificaciones se entregan. Revisar tokens push y permisos.`,
        !esOk
      ) : ''}`,
      !esOk ? [
        'Revisar y actualizar los tokens push de usuarios con notificaciones no entregadas.',
        'Identificar si el problema es global o concentrado en un SO (iOS/Android).',
        'Implementar fallback a SMS o email cuando el push falle por 2 intentos consecutivos.',
        'Revisar los permisos de notificación en la app y optimizar el flujo de opt-in.',
        'Establecer alerta automática si la tasa de entrega cae por debajo del 85%.',
      ] : [
        'Mantener monitoreo mensual de la tasa de entrega para detectar degradación.',
        'Segmentar notificaciones por perfil para mejorar relevancia y reducir opt-outs.',
        'Revisar si el volumen de notificaciones por cliente es adecuado para evitar fatiga.',
        'Probar nuevos formatos de push para mejorar el engagement.',
      ]
    );
  }

  // ── NOTIFICACIONES: Por canal ───────────────────────────────────────────────
  else if (id === 'notificaciones-canal') {
    if (!notiCanal.length) throw new Error('Sin datos de canal de notificaciones');
    const top = notiCanal.reduce((m, n) => n.total > m.total ? n : m);

    body = sec(
      'Canal de Notificación con Mayor Alcance',
      `${chips([
        { label: 'Canal líder',      val: top.canal, variant: 'ok' },
        { label: 'Alcance del líder',val: `${top.porcentaje.toFixed(1)}%`, variant: 'ok' },
        { label: 'Canales activos',  val: String(notiCanal.length) },
      ])}
      <div class="chart">${pdfBarsSvg(notiCanal.map(d => ({ label: d.canal, value: d.total })))}</div>
      ${table(notiCanal.map(n => ({
        label: n.canal,
        val:   `${fmt(n.total)} notificaciones (${n.porcentaje.toFixed(1)}%)`,
      })))}
      ${conclusion(`El canal <b>${top.canal}</b> lidera con el <b>${top.porcentaje.toFixed(1)}%</b> del alcance total. Priorizar en comunicados urgentes y campañas de retención.`)}`,
      [
        `Priorizar el canal "${top.canal}" en comunicaciones críticas de seguridad y fraude.`,
        'Establecer enrutamiento automático al canal con mayor alcance como principal.',
        'Revisar costos por canal para optimizar el mix entre alcance y eficiencia.',
        'Realizar pruebas A/B de contenido en el canal dominante para mejorar apertura.',
        'Evaluar si canales con menor alcance tienen problemas técnicos o de adopción.',
      ]
    );
  }

  // ── SUCURSALES: Nuevas cuentas ──────────────────────────────────────────────
  else if (id === 'sucursales') {
    if (!cuentasSucursal.length) throw new Error('Sin datos de sucursales');
    const sorted = [...cuentasSucursal].sort((a, b) => b.nuevas_cuentas - a.nuevas_cuentas);
    const top3   = sorted.slice(0, 3);
    const bottom = sorted[sorted.length - 1];
    const top10  = sorted.slice(0, 10);
    const total  = cuentasSucursal.reduce((s, d) => s + d.nuevas_cuentas, 0);

    body = sec(
      'Nuevas Cuentas por Sucursal',
      `${chips([
        { label: 'Total sucursales', val: String(cuentasSucursal.length) },
        { label: 'Total cuentas',    val: fmt(total) },
        { label: 'Sucursal líder',   val: top3[0].sucursal, variant: 'ok' },
        { label: 'Menor captación',  val: bottom.sucursal, variant: 'warn' },
      ])}
      <div class="chart">${pdfBarsSvg(top10.map(s => ({ label: s.sucursal, value: s.nuevas_cuentas })))}</div>
      ${table(top10.map(s => ({
        label: s.sucursal,
        val:   `${fmt(s.nuevas_cuentas)} cuentas nuevas`,
      })))}
      ${nominaRes ? `
        <div class="subsec">Penetración de Nómina BBVA</div>
        ${table([
          { label: 'Con nómina BBVA', val: fmt(nominaRes.con_nomina_bbva) },
          { label: 'Sin nómina BBVA', val: fmt(nominaRes.sin_nomina_bbva) },
          { label: 'Penetración',     val: `${nominaRes.porcentaje_penetracion.toFixed(1)}%` },
        ])}
        ${conclusion(
          nominaRes.porcentaje_penetracion >= 50
            ? `Penetración del <b>${nominaRes.porcentaje_penetracion.toFixed(1)}%</b>. Facilita el cross-selling de crédito nómina y seguros.`
            : `<b>${fmt(nominaRes.sin_nomina_bbva)}</b> empresas aún no tienen nómina BBVA. Oportunidad de crecimiento significativa.`,
          nominaRes.porcentaje_penetracion < 30
        )}` : ''}
      ${conclusion(
        `Sucursales más productivas: <b>${top3.map(s => s.sucursal).join(', ')}</b>. La sucursal <b>${bottom.sucursal}</b> tiene el menor volumen y puede beneficiarse de apoyo comercial.`
      )}`,
      [
        `Analizar las prácticas de "${top3[0].sucursal}" para replicarlas en sucursales de menor rendimiento.`,
        `Asignar promotor adicional a "${bottom.sucursal}" con meta de captación incremental.`,
        'Revisar si la ubicación de las sucursales con menor captación corresponde a zonas de bajo potencial.',
        'Diseñar campaña de nómina empresarial para empresas sin domiciliación BBVA en cada zona.',
        'Establecer ranking mensual con incentivos para los equipos de mayor captación.',
      ]
    );
  }

  // ── CLIENTES: Por segmento ──────────────────────────────────────────────────
  else if (id === 'clientes-segmento') {
    if (!segmentos.length) throw new Error('Sin datos de segmentos');
    const total  = segmentos.reduce((s, d) => s + d.total, 0);
    const topSeg = segmentos.reduce((m, d) => d.total > m.total ? d : m);

    body = sec(
      'Clientes por Segmento',
      `${chips([
        { label: 'Segmentos',      val: String(segmentos.length) },
        { label: 'Total clientes', val: fmt(total) },
        { label: 'Seg. dominante', val: topSeg.segmento, variant: 'ok' },
        { label: 'Participación',  val: `${((topSeg.total / total) * 100).toFixed(1)}%`, variant: 'ok' },
      ])}
      ${table(segmentos.map(s => ({
        label: s.segmento,
        val:   `${fmt(s.total)} clientes (${((s.total / total) * 100).toFixed(1)}%)`,
      })))}
      ${conclusion(
        `El segmento <b>${topSeg.segmento}</b> es el más representativo con el <b>${((topSeg.total / total) * 100).toFixed(1)}%</b> de la base. Diseñar productos y comunicación diferenciada para este grupo genera el mayor impacto.`
      )}`,
      [
        `Desarrollar propuesta de valor específica para el segmento "${topSeg.segmento}" con beneficios exclusivos.`,
        'Diseñar campañas de adquisición focalizadas en los segmentos con menor representación.',
        'Revisar el NPS por segmento para identificar oportunidades de mejora en experiencia.',
        'Analizar el LTV por segmento para priorizar la inversión comercial.',
        'Evaluar si la distribución refleja el mercado objetivo y ajustar la estrategia de captación.',
      ]
    );
  }

  // ── CLIENTES: Por género ────────────────────────────────────────────────────
  else if (id === 'clientes-genero') {
    if (!generos.length) throw new Error('Sin datos de género');
    const total  = generos.reduce((s, d) => s + d.total, 0);
    const topGen = generos.reduce((m, d) => d.total > m.total ? d : m);

    body = sec(
      'Clientes por Género',
      `${chips([
        { label: 'Total clientes', val: fmt(total) },
        { label: 'Género líder',   val: topGen.genero },
        { label: 'Participación',  val: `${((topGen.total / total) * 100).toFixed(1)}%` },
      ])}
      ${table(generos.map(g => ({
        label: g.genero,
        val:   `${fmt(g.total)} clientes (${((g.total / total) * 100).toFixed(1)}%)`,
      })))}
      ${conclusion(
        `La base está compuesta predominantemente por <b>${topGen.genero}</b> con el <b>${((topGen.total / total) * 100).toFixed(1)}%</b>. Considerar si la distribución refleja el mercado objetivo.`
      )}`,
      [
        'Evaluar si la distribución de género refleja el mercado objetivo y ajustar captación.',
        'Diseñar campañas específicas para atraer al género con menor representación.',
        'Revisar si los productos actuales tienen sesgos de adopción por género.',
        'Analizar si hay diferencias significativas en comportamiento financiero entre segmentos.',
        'Considerar la paridad de género como KPI en las metas de captación de nuevos clientes.',
      ]
    );
  }

  // ── TARJETAS: Utilización del crédito ──────────────────────────────────────
  else if (id === 'utilizacion-credito') {
    if (!utilizacionResumen) throw new Error('Sin datos de utilización');
    const u        = utilizacionResumen;
    const esAlerta = u.utilizacion_global > 70;
    const esModera = u.utilizacion_global > 50 && !esAlerta;

    body = sec(
      'Utilización Promedio del Crédito',
      `${chips([
        { label: 'Uso global',       val: `${u.utilizacion_global.toFixed(1)}%`, variant: esAlerta ? 'risk' : esModera ? 'warn' : 'ok' },
        { label: 'Tarjetas activas', val: fmt(u.total_tarjetas) },
        { label: 'Saldo usado',      val: fmtMXN(u.saldo_total), variant: 'risk' },
        { label: 'Límite total',     val: fmtMXN(u.limite_total), variant: 'ok' },
      ])}
      ${utilizacionCredito.length ? `
        <div class="chart">${pdfBarsSvg(utilizacionCredito.map(uc => ({ label: uc.tipo_tarjeta, value: uc.utilizacion_promedio })), '#004481')}</div>
        ${table(utilizacionCredito.map(uc => ({
          label: uc.tipo_tarjeta,
          val:   `${uc.utilizacion_promedio.toFixed(1)}% uso — ${fmtMXN(uc.saldo_total)} de ${fmtMXN(uc.limite_total)}`,
        })))}` : ''}
      ${conclusion(
        esAlerta
          ? `Utilización global del <b>${u.utilizacion_global.toFixed(1)}%</b>, por encima del <b>70%</b>. Riesgo elevado de incumplimiento; revisar límites y activar alertas para clientes con uso superior al 90%.`
          : esModera
          ? `Utilización del <b>${u.utilizacion_global.toFixed(1)}%</b>. Nivel moderado. Monitorear clientes con uso individual superior al <b>80%</b> de su límite.`
          : `Utilización del <b>${u.utilizacion_global.toFixed(1)}%</b>. Cartera de tarjetas con capacidad crediticia saludable.`,
        esAlerta
      )}`,
      esAlerta ? [
        'Activar alertas automáticas para clientes con utilización superior al 80% de su límite.',
        'Revisar y reducir límites en clientes con utilización crónica superior al 90%.',
        'Implementar modelos predictivos para identificar riesgo de impago antes de que ocurra.',
        'Ofrecer planes de pago diferido o reestructuración a clientes con utilización máxima.',
        'Pausar el aumento automático de límites hasta que la utilización global baje del 70%.',
      ] : [
        'Mantener el monitoreo mensual de la utilización por tipo de tarjeta.',
        'Aprovechar el margen para ofrecer productos de crédito adicionales a clientes calificados.',
        'Establecer alertas preventivas para clientes que superen el 70% de utilización repentinamente.',
        'Revisar si los límites asignados son adecuados para cada segmento.',
      ]
    );
  }

  // ── TARJETAS: Morosidad ─────────────────────────────────────────────────────
  else if (id === 'morosidad-tarjetas') {
    if (!morosidadResumen) throw new Error('Sin datos de morosidad');
    const m        = morosidadResumen;
    const esAlerta = m.tasa_morosidad > 30;

    body = sec(
      'Morosidad en Tarjetas de Crédito',
      `${chips([
        { label: 'Tarjetas activas',    val: fmt(m.total_activas) },
        { label: 'Tarjetas bloqueadas', val: fmt(m.total_morosas), variant: 'risk' },
        { label: 'Tasa de morosidad',   val: `${m.tasa_morosidad.toFixed(1)}%`, variant: esAlerta ? 'risk' : 'warn' },
        { label: 'Al corriente',        val: fmt(m.total_activas - m.total_morosas), variant: 'ok' },
      ])}
      ${morosidadTarjetas.length ? `
        <div class="chart">${pdfBarsSvg(morosidadTarjetas.map(mt => ({ label: mt.tipo_tarjeta, value: mt.tasa_morosidad })), '#ba1a1a')}</div>
        ${table(morosidadTarjetas.map(mt => ({
          label: mt.tipo_tarjeta,
          val:   `${mt.tasa_morosidad.toFixed(1)}% bloqueadas — ${fmt(mt.morosas)} de ${fmt(mt.total)}`,
        })))}` : ''}
      ${conclusion(
        esAlerta
          ? `El <b>${m.tasa_morosidad.toFixed(1)}%</b> de las tarjetas están bloqueadas por impago. Nivel <b>crítico</b>. Activar estrategia de recuperación inmediata.`
          : `El <b>${m.tasa_morosidad.toFixed(1)}%</b> de las tarjetas bloqueadas por impago. Nivel moderado; lanzar campaña de regularización preventiva.`,
        esAlerta
      )}`,
      esAlerta ? [
        'Activar campaña de regularización con quita de intereses moratorios para los primeros 30 días.',
        'Segmentar clientes bloqueados por monto y antigüedad para priorizar recuperación.',
        'Ofrecer planes de pago mínimo diferido para clientes con mayor probabilidad de recuperación.',
        'Revisar políticas de otorgamiento para los tipos de tarjeta con mayor tasa de bloqueo.',
        'Escalar a cobranza externa los casos con más de 90 días de bloqueo sin actividad.',
      ] : [
        'Lanzar campaña preventiva de recordatorio de pago mínimo para clientes con saldo elevado.',
        'Revisar si los clientes bloqueados tienen productos alternativos para pagar.',
        'Implementar alertas automáticas al cliente cuando se acerque a la fecha de corte.',
        'Analizar si la tasa varía significativamente por tipo de tarjeta y focalizar atención.',
      ]
    );
  }

  // ── PRÉSTAMOS: Tasas de interés ─────────────────────────────────────────────
  else if (id === 'tasas-interes') {
    if (!tasasInteres.length) throw new Error('Sin datos de tasas');
    const maxTasa = tasasInteres.reduce((m, t) => t.tasa_promedio > m.tasa_promedio ? t : m);
    const minTasa = tasasInteres.reduce((m, t) => t.tasa_promedio < m.tasa_promedio ? t : m);
    const diff    = maxTasa.tasa_promedio - minTasa.tasa_promedio;

    body = sec(
      'Tasa de Interés Promedio por Tipo de Préstamo',
      `${chips([
        { label: 'Productos',    val: String(tasasInteres.length) },
        { label: 'Tasa más alta',val: `${maxTasa.tasa_promedio.toFixed(1)}% — ${maxTasa.tipo_prestamo}`, variant: 'warn' },
        { label: 'Tasa más baja',val: `${minTasa.tasa_promedio.toFixed(1)}% — ${minTasa.tipo_prestamo}`, variant: 'ok' },
        { label: 'Diferencial',  val: `${diff.toFixed(1)} pp`, variant: diff > 5 ? 'warn' : 'ok' },
      ])}
      ${table(tasasInteres.map(t => ({
        label: t.tipo_prestamo,
        val:   `Prom: ${t.tasa_promedio.toFixed(1)}% | Mín: ${t.tasa_minima.toFixed(1)}% | Máx: ${t.tasa_maxima.toFixed(1)}%`,
      })))}
      <div class="chart">${pdfBarsSvg(tasasInteres.map(t => ({ label: t.tipo_prestamo, value: t.tasa_promedio })), '#7c3aed')}</div>
      ${conclusion(
        diff > 5
          ? `<b>${maxTasa.tipo_prestamo}</b> tiene la tasa más alta (<b>${maxTasa.tasa_promedio.toFixed(1)}%</b>) y <b>${minTasa.tipo_prestamo}</b> la más baja (<b>${minTasa.tasa_promedio.toFixed(1)}%</b>). El diferencial de ${diff.toFixed(1)} pp sugiere revisar el pricing.`
          : `Las tasas están relativamente niveladas. <b>${maxTasa.tipo_prestamo}</b> lidera en costo (<b>${maxTasa.tasa_promedio.toFixed(1)}%</b>).`
      )}`,
      [
        `Comparar la tasa de "${maxTasa.tipo_prestamo}" con el mercado para evaluar si es competitiva.`,
        'Revisar si las tasas máximas individuales reflejan adecuadamente el riesgo del cliente.',
        'Evaluar si el diferencial entre productos incentiva al cliente a elegir el correcto.',
        'Implementar tasas personalizadas basadas en el score crediticio.',
        'Revisar la rentabilidad de cada producto considerando la tasa neta después de pérdidas.',
      ]
    );
  }

  // ── METAS DE AHORRO: Por estatus ────────────────────────────────────────────
  else if (id === 'metas-estatus') {
    if (!metasEstatus.length) throw new Error('Sin datos de metas');
    const completadas = metasEstatus.find(m => m.estatus?.toLowerCase().includes('complet'));
    const fallidas    = metasEstatus.find(m => m.estatus?.toLowerCase().includes('fall'));
    const esAlerta    = !!(fallidas && completadas && fallidas.porcentaje > completadas.porcentaje);

    body = sec(
      'Metas de Ahorro por Estatus',
      `${chips([
        ...(completadas ? [{ label: 'Completadas', val: `${completadas.porcentaje.toFixed(1)}%`, variant: 'ok' as const }] : []),
        ...(fallidas    ? [{ label: 'Fallidas',    val: `${fallidas.porcentaje.toFixed(1)}%`,    variant: (esAlerta ? 'risk' : 'warn') as 'risk' | 'warn' }] : []),
      ])}
      ${table(metasEstatus.map(m => ({
        label: m.estatus,
        val:   `${fmt(m.total)} metas (${m.porcentaje.toFixed(1)}%)`,
      })))}
      ${metasProgreso ? table([
        { label: 'Metas activas',     val: fmt(metasProgreso.total_activas) },
        { label: 'Progreso promedio', val: `${metasProgreso.progreso_promedio.toFixed(1)}%` },
        { label: 'Monto ahorrado',    val: fmtMXN(metasProgreso.monto_actual_total) },
        { label: 'Objetivo total',    val: fmtMXN(metasProgreso.monto_objetivo_total) },
      ]) : ''}
      ${conclusion(
        esAlerta
          ? `Las metas fallidas (<b>${fallidas!.porcentaje.toFixed(1)}%</b>) superan a las completadas (<b>${completadas?.porcentaje.toFixed(1) ?? '?'}%</b>). Los montos objetivo pueden no ser alcanzables con el perfil del cliente.`
          : completadas
          ? `El <b>${completadas.porcentaje.toFixed(1)}%</b> de las metas fueron completadas. Buen indicador de engagement financiero.`
          : '',
        esAlerta
      )}`,
      esAlerta ? [
        'Revisar si los montos objetivo son proporcionales al perfil de ingresos del cliente.',
        'Ofrecer ajuste de metas con plazos más largos y montos menores a clientes con baja adherencia.',
        'Activar recordatorios push cuando el ritmo de ahorro esté por debajo del objetivo.',
        'Analizar en qué mes del ciclo se producen más abandonos e intervenir preventivamente.',
        'Diseñar microincentivos (cashback, puntos, tasa preferencial) al alcanzar hitos intermedios.',
      ] : [
        'Mantener los recordatorios automáticos que están contribuyendo al buen desempeño.',
        'Celebrar los logros con mensajes personalizados en la app para reforzar el comportamiento.',
        'Ofrecer metas de mayor plazo y monto a clientes que han completado al menos una.',
        'Usar el éxito en metas como criterio de elegibilidad para crédito preaprobado.',
      ]
    );
  }

  else {
    throw new Error(`KPI no reconocido: ${id}`);
  }

  // ── Titulos del PDF ─────────────────────────────────────────────────────────
  const titulos: Record<string, string> = {
    'fraude-tendencia':       'Tendencia de Fraudes',
    'fraude-categoria':       'Fraude por Categoría',
    'prestamos':              'Préstamos por Tipo',
    'saldo-cuentas':          'Saldo por Tipo de Cuenta',
    'score':                  'Score Crediticio',
    'cobros':                 'Cobros Excedidos',
    'etl':                    'Pipeline ETL',
    'pagos-estatus':          'Tasa de Éxito en Pagos',
    'pagos-canal':            'Canal de Pago',
    'seguros-estatus':        'Pólizas de Seguros',
    'notificaciones-estatus': 'Entrega de Notificaciones',
    'notificaciones-canal':   'Canal de Notificaciones',
    'sucursales':             'Captación por Sucursal',
    'clientes-segmento':      'Clientes por Segmento',
    'clientes-genero':        'Clientes por Género',
    'utilizacion-credito':    'Utilización del Crédito',
    'morosidad-tarjetas':     'Morosidad en Tarjetas',
    'tasas-interes':          'Tasas de Interés',
    'metas-estatus':          'Metas de Ahorro',
  };

  await sharePdf(
    buildDocHtml(`KPI: ${titulos[id] ?? id}`, fecha, tri, body),
    `Exportar — ${titulos[id] ?? id}`
  );
};