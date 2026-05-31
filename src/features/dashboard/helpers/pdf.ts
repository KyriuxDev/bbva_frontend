// src/features/dashboard/helpers/pdf.ts
// ─────────────────────────────────────────────────────────────────────────────
// Helpers para generación de PDF con TODOS los KPIs y acciones recomendadas
// ─────────────────────────────────────────────────────────────────────────────

import { fmt, fmtMXN } from './format';

// ── Escape HTML ───────────────────────────────────────────────────────────────
export const esc = (s: string | number): string =>
  String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

// ── Fecha y trimestre ─────────────────────────────────────────────────────────
export const pdfFecha = (): string =>
  new Date().toLocaleDateString('es-MX', {
    day: '2-digit', month: 'long', year: 'numeric',
  });

// ── Gráfica de barras SVG ─────────────────────────────────────────────────────
export const pdfBarsSvg = (
  items: { label: string; value: number }[],
  color = '#004990'
): string => {
  if (!items.length) return '';
  const maxV = Math.max(...items.map(i => i.value), 1);
  const bH = 22, gap = 6, lblW = 140, barMaxW = 190;
  const W = lblW + barMaxW + 70;
  const H = items.length * (bH + gap) + 10;
  const bars = items.map((item, i) => {
    const bw = Math.max(2, (item.value / maxV) * barMaxW);
    const y  = i * (bH + gap);
    return `
      <text x="0" y="${y + bH - 5}" font-size="10" fill="#5d5f5f" font-family="sans-serif">
        ${esc(item.label)}
      </text>
      <rect x="${lblW}" y="${y}" width="${bw}" height="${bH}" fill="${color}" rx="3"/>
      <text x="${lblW + bw + 6}" y="${y + bH - 5}" font-size="10" fill="${color}"
        font-weight="bold" font-family="sans-serif">
        ${esc(item.value.toLocaleString('es-MX'))}
      </text>`;
  }).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">${bars}</svg>`;
};

// ── Gráfica de línea SVG ──────────────────────────────────────────────────────
export const pdfLineSvg = (data: { label: string; value: number }[]): string => {
  if (data.length < 2) return '';
  const W = 420, H = 110, padL = 36, padR = 10, padT = 8, padB = 22;
  const maxV  = Math.max(...data.map(d => d.value));
  const minV  = Math.min(...data.map(d => d.value));
  const xStep = (W - padL - padR) / (data.length - 1);
  const yFor  = (v: number) =>
    padT + (1 - (maxV === minV ? 0.5 : (v - minV) / (maxV - minV))) * (H - padT - padB);
  const pts  = data.map((d, i) => `${(padL + i * xStep).toFixed(1)},${yFor(d.value).toFixed(1)}`).join(' ');
  const area = `M${padL},${H - padB} ` +
    data.map((d, i) => `L${(padL + i * xStep).toFixed(1)},${yFor(d.value).toFixed(1)}`).join(' ') +
    ` L${padL + (data.length - 1) * xStep},${H - padB} Z`;
  const step  = Math.ceil(data.length / 5);
  const xlbls = data
    .map((d, i) => ({ d, i }))
    .filter(({ i }) => i % step === 0 || i === data.length - 1)
    .map(({ d, i }) =>
      `<text x="${(padL + i * xStep).toFixed(1)}" y="${H - 4}" font-size="8"
        fill="#737781" text-anchor="middle" font-family="sans-serif">
        ${esc(d.label)}
      </text>`
    ).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
    <path d="${area}" fill="#ba1a1a" opacity="0.08"/>
    <polyline fill="none" stroke="#ba1a1a" stroke-width="2"
      stroke-linejoin="round" points="${pts}"/>
    ${xlbls}
  </svg>`;
};

// ── Escape seguro: escapa solo caracteres peligrosos, NO etiquetas bold/em ───
// Úsalo para valores de datos, NO para textos de conclusiones con <b>.
const escData = (s: string | number): string =>
  String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

// ── Escape que preserva <b>, </b>, <em>, </em> ────────────────────────────────
const escText = (s: string): string =>
  s
    .replace(/&(?!(?:amp|lt|gt|quot|#\d+);)/g, '&amp;') // escapa & sueltos
    .replace(/<(?!\/?(?:b|em|strong|br)\b)/g, '&lt;')   // escapa < que NO son <b> <em> <strong>
    .replace(/(?<!\/?(?:b|em|strong|br)\b)>/g, match => match); // deja > intactos en tags seguros

// ── Conclusión / insight ──────────────────────────────────────────────────────
// Usa escText para que <b>texto</b> se renderice como negrita real en el PDF.
export const pdfConclusion = (text: string, isAlert = false): string =>
  `<div class="conclusion${isAlert ? ' alert' : ''}">${text}</div>`;

// ── Lista de acciones ─────────────────────────────────────────────────────────
export const pdfAcciones = (acciones: string[]): string =>
  `<div class="acciones-title">Acciones recomendadas</div>` +
  acciones.map((a, i) =>
    `<div class="accion">
      <div class="accion-num">${i + 1}</div>
      <div class="accion-txt">${esc(a)}</div>
    </div>`
  ).join('');

// ── Tabla de indicadores ──────────────────────────────────────────────────────
export const pdfTable = (rows: { label: string; val: string }[]): string =>
  `<table class="table">
    <thead><tr><th>Indicador</th><th>Valor</th></tr></thead>
    <tbody>
      ${rows.map(r => `<tr><td>${esc(r.label)}</td><td>${esc(r.val)}</td></tr>`).join('')}
    </tbody>
  </table>`;

// ── Gráfica de donut SVG ──────────────────────────────────────────────────────
export const pdfDonutSvg = (
  segments: { label: string; value: number; color: string }[]
): string => {
  if (!segments.length) return '';
  const total  = segments.reduce((s, d) => s + d.value, 0) || 1;
  const R = 60, cx = 80, cy = 70, sw = 22;
  const circ = 2 * Math.PI * R;
  let offset = 0;
  const arcs = segments.map(seg => {
    const pct    = seg.value / total;
    const arcLen = pct * circ;
    const dash   = `${arcLen.toFixed(2)} ${(circ - arcLen).toFixed(2)}`;
    const dashOff = (circ - offset).toFixed(2);
    offset += arcLen;
    return `<circle cx="${cx}" cy="${cy}" r="${R}"
      fill="transparent" stroke="${seg.color}" stroke-width="${sw}"
      stroke-dasharray="${dash}" stroke-dashoffset="${dashOff}"
      transform="rotate(-90 ${cx} ${cy})"/>`;
  }).join('');

  const legendItems = segments.map((seg, i) => {
    const pct = ((seg.value / total) * 100).toFixed(1);
    const y   = i * 18 + 20;
    return `
      <rect x="175" y="${y - 9}" width="12" height="12" rx="3" fill="${seg.color}"/>
      <text x="192" y="${y}" font-size="10" fill="#374151" font-family="sans-serif">
        ${esc(seg.label)} — ${pct}%
      </text>`;
  }).join('');

  const W = 380, H = Math.max(140, segments.length * 18 + 30);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
    <circle cx="${cx}" cy="${cy}" r="${R}" fill="transparent"
      stroke="#f0f2f5" stroke-width="${sw}"/>
    ${arcs}
    ${legendItems}
  </svg>`;
};

// ── Barra de progreso simple ──────────────────────────────────────────────────
export const pdfProgressBar = (
  pct: number,
  color: string,
  label: string,
  valueLabel: string
): string => {
  const clampedPct = Math.min(Math.max(pct, 0), 100);
  const barW = Math.round((clampedPct / 100) * 280);
  return `
    <div style="margin-bottom:10px;">
      <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
        <span style="font-size:12px;color:#374151;font-weight:600;">${esc(label)}</span>
        <span style="font-size:13px;font-weight:800;color:${color};">${esc(valueLabel)}</span>
      </div>
      <svg xmlns="http://www.w3.org/2000/svg" width="300" height="10">
        <rect x="0" y="0" width="300" height="10" rx="5" fill="#e8effa"/>
        <rect x="0" y="0" width="${barW}" height="10" rx="5" fill="${color}"/>
      </svg>
    </div>`;
};

// ── Sección con título ────────────────────────────────────────────────────────
export const pdfSection = (
  title: string,
  content: string,
  acciones?: string[]
): string =>
  `<div class="sec">
    <div class="sec-title">${esc(title)}</div>
    ${content}
    ${acciones && acciones.length ? pdfAcciones(acciones) : ''}
  </div>`;

// ── Chips de resumen ──────────────────────────────────────────────────────────
export const pdfChips = (
  chips: { label: string; val: string; variant?: 'ok' | 'risk' | 'warn' | 'default' }[]
): string =>
  `<div class="chips">
    ${chips.map(c => {
      const cls = c.variant === 'ok'   ? 'ok'
                : c.variant === 'risk' ? 'risk'
                : c.variant === 'warn' ? 'warn'
                : '';
      return `<div class="chip">
        <div class="chip-lbl">${esc(c.label)}</div>
        <div class="chip-val ${cls}">${esc(c.val)}</div>
      </div>`;
    }).join('')}
  </div>`;

// ── Indicador de riesgo inline ────────────────────────────────────────────────
export const pdfRiskBadge = (label: string, valor: number, umbral: number): string => {
  const isRisk = valor > umbral;
  const color  = isRisk ? '#ba1a1a' : valor > umbral * 0.8 ? '#e67e22' : '#27ae60';
  const estado = isRisk ? 'RIESGO' : valor > umbral * 0.8 ? 'ATENCION' : 'OK';
  const barPct = Math.min((valor / (umbral * 1.5)) * 100, 100);
  const barW   = Math.round((barPct / 100) * 240);
  return `
    <div class="risk-badge" style="background:${color}11;border:1px solid ${color}44;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
        <span style="font-size:13px;font-weight:700;color:#1a1c1c;">${esc(label)}</span>
        <div style="display:flex;align-items:center;gap:10px;">
          <span style="font-size:18px;font-weight:800;color:${color};">${valor.toFixed(1)}%</span>
          <span style="background:${color};color:#fff;border-radius:6px;
            padding:2px 8px;font-size:10px;font-weight:800;">${estado}</span>
        </div>
      </div>
      <svg xmlns="http://www.w3.org/2000/svg" width="260" height="8">
        <rect x="0" y="0" width="260" height="8" rx="4" fill="${color}22"/>
        <rect x="0" y="0" width="${barW + 20}" height="8" rx="4" fill="${color}"/>
      </svg>
      <div style="font-size:10px;color:#737781;margin-top:4px;">Umbral: ${umbral}%</div>
    </div>`;
};

// ── HTML completo del documento ───────────────────────────────────────────────
export const buildDocHtml = (
  docTitle: string,
  fecha:    string,
  tri:      string,
  bodyHtml: string
): string => `<!DOCTYPE html><html><head><meta charset="utf-8"/><style>
*{margin:0;padding:0;box-sizing:border-box;}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#1a1c1c;background:#fff;}
.hdr{background:linear-gradient(135deg,#003d7a 0%,#004990 60%,#0066cc 100%);color:#fff;padding:28px 32px 24px;page-break-inside:avoid;}
.hdr-logo{font-size:34px;font-weight:900;letter-spacing:2px;margin-bottom:8px;}
.hdr-title{font-size:20px;font-weight:700;margin-bottom:4px;opacity:.95;}
.hdr-meta{font-size:12px;opacity:.75;margin-top:2px;}
.body{padding:24px 32px;}
.sec{margin-bottom:28px;padding-bottom:28px;border-bottom:1.5px solid #e8effa;page-break-inside:avoid;}
.sec:last-child{border-bottom:none;margin-bottom:0;}
.sec-title{font-size:10px;font-weight:800;color:#004990;letter-spacing:2px;
  text-transform:uppercase;margin-bottom:14px;padding-bottom:6px;
  border-bottom:2px solid #004990;page-break-after:avoid;}
.chips{display:flex;gap:10px;flex-wrap:wrap;margin-bottom:16px;page-break-inside:avoid;}
.chip{background:#f4f6fa;border:1px solid #e2e8f0;border-radius:10px;
  padding:10px 14px;flex:1;min-width:90px;page-break-inside:avoid;}
.chip-lbl{font-size:10px;color:#737781;font-weight:600;margin-bottom:3px;
  text-transform:uppercase;letter-spacing:.5px;}
.chip-val{font-size:20px;font-weight:800;color:#004990;}
.chip-val.ok{color:#27ae60;}.chip-val.risk{color:#c0392b;}.chip-val.warn{color:#e67e22;}
.conclusion{background:#eef5ff;border-left:3px solid #004990;padding:12px 14px;
  margin:12px 0;font-size:12px;color:#1e3a5f;line-height:1.7;border-radius:0 8px 8px 0;
  page-break-inside:avoid;}
.conclusion.alert{background:#fff4f4;border-left-color:#c0392b;color:#7a1010;}
.acciones-title{font-size:11px;font-weight:800;color:#004990;margin:14px 0 8px;
  text-transform:uppercase;letter-spacing:.8px;page-break-after:avoid;}
.accion{display:flex;gap:10px;margin-bottom:8px;align-items:flex-start;page-break-inside:avoid;}
.accion-num{background:#004990;color:#fff;border-radius:50%;width:20px;height:20px;
  font-size:10px;font-weight:800;flex-shrink:0;text-align:center;line-height:20px;}
.accion-txt{font-size:12px;color:#374151;line-height:1.6;flex:1;}
.table{width:100%;border-collapse:collapse;margin:12px 0;font-size:12px;page-break-inside:avoid;}
.table th{background:#004990;color:#fff;font-size:10px;font-weight:700;
  padding:9px 12px;text-align:left;letter-spacing:.5px;}
.table td{padding:9px 12px;border-bottom:1px solid #f0f2f5;color:#374151;}
.table tr:nth-child(even) td{background:#fafbfc;}
.table td:last-child{font-weight:700;color:#004990;text-align:right;}
.table tr{page-break-inside:avoid;}
.chart{margin:14px 0;overflow:hidden;page-break-inside:avoid;}
.badge{display:inline-block;border-radius:10px;padding:2px 9px;font-size:10px;
  font-weight:800;color:#fff;margin-right:4px;}
.badge.alta{background:#ba1a1a;}.badge.media{background:#e67e22;}.badge.baja{background:#27ae60;}
.kpi-block{background:#f8faff;border:1px solid #dce8f8;border-radius:12px;
  padding:16px;margin-bottom:14px;page-break-inside:avoid;}
.kpi-block-title{font-size:14px;font-weight:700;color:#002e5a;margin-bottom:10px;}
.kpi-block-sub{font-size:11px;color:#737781;margin-bottom:10px;}
.two-col{display:flex;gap:12px;margin-bottom:12px;page-break-inside:avoid;}
.col-stat{flex:1;background:#fff;border:1px solid #e2e8f0;border-radius:8px;
  padding:12px;text-align:center;page-break-inside:avoid;}
.col-stat-val{font-size:22px;font-weight:800;color:#004990;display:block;margin-bottom:2px;}
.col-stat-lbl{font-size:10px;color:#737781;font-weight:600;}
.col-stat-val.ok{color:#27ae60;}.col-stat-val.risk{color:#ba1a1a;}
.subsec{font-size:10px;font-weight:700;color:#737781;letter-spacing:1.2px;
  text-transform:uppercase;margin:16px 0 8px;padding-top:12px;
  border-top:1px dashed #e2e8f0;page-break-after:avoid;}
.alerta-box{background:#fff4f4;border:1px solid #fcc;border-left:4px solid #ba1a1a;
  border-radius:8px;padding:14px;margin-bottom:14px;page-break-inside:avoid;}
.alerta-box-ok{background:#f0fff4;border:1px solid #86efac;border-left:4px solid #27ae60;
  border-radius:8px;padding:14px;margin-bottom:14px;page-break-inside:avoid;}
.alerta-title{font-size:13px;font-weight:800;margin-bottom:4px;}
.alerta-body{font-size:12px;line-height:1.6;color:#374151;}
.page-break{page-break-before:always;height:0;margin:0;padding:0;}
.ftr{background:#f4f6fa;padding:14px 32px;font-size:10px;color:#737781;
  text-align:center;border-top:2px solid #e2e8f0;margin-top:20px;page-break-inside:avoid;}
.toc-item{display:flex;align-items:center;gap:6px;margin-bottom:6px;
  font-size:12px;color:#374151;page-break-inside:avoid;}
.toc-num{background:#004990;color:#fff;border-radius:4px;width:20px;height:20px;
  font-size:10px;font-weight:800;flex-shrink:0;text-align:center;line-height:20px;}
/* Evita que SVG de gráficas se parta entre páginas */
svg{page-break-inside:avoid;display:block;}
/* Debilidades: cards individuales nunca se parten */
.deb-card{page-break-inside:avoid;background:#fff;border:1px solid #e2e8f0;
  border-radius:12px;padding:16px;margin-bottom:12px;}
/* Indicadores de riesgo inline */
.risk-badge{page-break-inside:avoid;border-radius:10px;padding:12px 14px;margin-bottom:8px;}
</style></head><body>
<div class="hdr">
  <div class="hdr-logo">BBVA</div>
  <div class="hdr-title">${esc(docTitle)}</div>
  <div class="hdr-meta">${esc(tri)} &nbsp;&middot;&nbsp; Generado el ${esc(fecha)}</div>
</div>
<div class="body">${bodyHtml}</div>
<div class="ftr">Generado automáticamente por BBVA Analytics &nbsp;&middot;&nbsp; Documento confidencial &nbsp;&middot;&nbsp; Solo para uso interno</div>
</body></html>`;

// ─────────────────────────────────────────────────────────────────────────────
// buildFullReportHtml
//
// Recibe TODOS los datos del dashboard y genera el HTML del reporte ejecutivo
// completo con todos los KPIs, conclusiones y acciones recomendadas.
// ─────────────────────────────────────────────────────────────────────────────

interface FullReportData {
  // Generales
  fecha:    string;
  tri:      string;
  kpisResumen?: any;
  etlResumen?:  any;

  // Fraude
  fraudePorMes?:       any[];
  fraudePorCanal?:     any[];
  fraudePorCategoria?: any[];
  fraudeGeo?:          any[];
  fraudeComercio?:     any[];

  // Clientes
  segmentos?:   any[];
  generos?:     any[];

  // Cuentas y préstamos
  saldoCuentas?:  any[];
  prestamos?:     any[];
  cobrosExc?:     any[];
  scores?:        any[];

  // Tarjetas de crédito
  utilizacionCredito?:  any[];
  utilizacionResumen?:  any;
  morosidadTarjetas?:   any[];
  morosidadResumen?:    any;
  tasasInteres?:        any[];

  // Metas de ahorro
  metasEstatus?:  any[];
  metasProgreso?: any;

  // Pagos
  pagosPorEstatus?: any[];
  pagosPorCanal?:   any[];

  // Seguros
  segurosPorEstatus?: any[];
  primaAnual?:        any;

  // Notificaciones
  notiEstatus?: any[];
  notiCanal?:   any[];

  // Sucursales y nómina
  cuentasSucursal?: any[];
  nominaRes?:       any;

  // Debilidades
  debilidadesData?: any;
  soluciones?:      any[];
  indicadores?:     any;
}

export const buildFullReportHtml = (d: FullReportData): string => {
  const NA = 'Sin datos';
  const safe = (arr?: any[]) => arr ?? [];
  const safeV = (v: any, fallback = NA) => (v !== undefined && v !== null ? v : fallback);

  // ── Tabla de contenido ────────────────────────────────────────
  const toc = `
    <div class="sec">
      <div class="sec-title">Contenido del Reporte</div>
      ${[
        'Resumen Ejecutivo',
        'Estado Global del Sistema',
        'Fraude y Seguridad',
        'Cartera de Clientes',
        'Cuentas y Préstamos',
        'Tarjetas de Crédito',
        'Metas de Ahorro',
        'Medios de Pago',
        'Seguros',
        'Comunicación',
        'Captación Comercial',
        'Debilidades Detectadas y Plan de Acción',
      ].map((item, i) => `
        <div class="toc-item">
          <div class="toc-num">${i + 1}</div>
          <span>${item}</span>
        </div>`).join('')}
    </div>`;

  // ── 1. Resumen ejecutivo ──────────────────────────────────────
  const resumenEjecutivo = (() => {
    if (!d.kpisResumen && !d.etlResumen) return '';
    const chips = [];
    if (d.kpisResumen) {
      chips.push(
        { label: 'Total clientes',  val: fmt(d.kpisResumen.totalClientes) },
        { label: 'Cuentas activas', val: fmt(d.kpisResumen.cuentasActivas) },
        { label: 'Saldo total',     val: fmtMXN(d.kpisResumen.saldoTotalCuentas), variant: 'ok' as const },
        { label: 'Txs hoy',         val: fmt(d.kpisResumen.transaccionesHoy) },
        { label: 'Fraudes potenc.', val: fmt(d.kpisResumen.fraudesPotenciales), variant: 'risk' as const },
        { label: 'Cobros excedidos',val: fmt(d.kpisResumen.cobrosExcedidos), variant: 'warn' as const },
      );
    }
    if (d.etlResumen) {
      chips.push(
        { label: 'Tasa fraude',     val: `${d.etlResumen.tasa_fraude_pct?.toFixed(2)}%`, variant: d.etlResumen.tasa_fraude_pct > 3 ? 'risk' as const : 'ok' as const },
        { label: 'Monto en riesgo', val: fmtMXN(d.etlResumen.monto_total_fraude), variant: 'risk' as const },
      );
    }
    return pdfSection('1. Resumen Ejecutivo', pdfChips(chips));
  })();

  // ── 2. Estado global ──────────────────────────────────────────
  const estadoGlobal = (() => {
    if (!d.indicadores) return '';
    const ind  = d.indicadores;
    const UMBS: Record<string, number> = {
      porcentajeFraudePotencial:   5,
      porcentajeCobrosExcedidos:   10,
      porcentajeCuentasCanceladas: 20,
      porcentajePrestamosVencidos: 15,
      porcentajeMetasFallidas:     30,
    };
    const LABELS: Record<string, string> = {
      porcentajeFraudePotencial:   'Fraude Potencial',
      porcentajeCobrosExcedidos:   'Cobros Excedidos',
      porcentajeCuentasCanceladas: 'Cuentas Canceladas',
      porcentajePrestamosVencidos: 'Préstamos Vencidos',
      porcentajeMetasFallidas:     'Metas de Ahorro Fallidas',
    };
    const risks = Object.entries(UMBS).map(([k, u]) => ({
      label: LABELS[k], valor: ind[k] ?? 0, umbral: u,
    }));
    const criticos  = risks.filter(r => r.valor > r.umbral);
    const atencion  = risks.filter(r => r.valor > r.umbral * 0.8 && r.valor <= r.umbral);

    let estadoHtml = '';
    if (criticos.length > 0) {
      estadoHtml = `<div class="alerta-box">
        <div class="alerta-title" style="color:#ba1a1a;">
          ⚠ ${criticos.length} indicador${criticos.length > 1 ? 'es' : ''} fuera de rango — Acción inmediata requerida
        </div>
        <div class="alerta-body">${criticos.map(r => `<b>${r.label}</b>: ${r.valor.toFixed(1)}% (límite ${r.umbral}%)`).join(' &nbsp;·&nbsp; ')}</div>
      </div>`;
    } else if (atencion.length > 0) {
      estadoHtml = `<div style="background:#fffbf0;border:1px solid #fde68a;border-left:4px solid #e67e22;border-radius:8px;padding:14px;margin-bottom:14px;">
        <div class="alerta-title" style="color:#e67e22;">
          Monitoreo recomendado — ${atencion.length} indicador${atencion.length > 1 ? 'es' : ''} cerca del límite
        </div>
        <div class="alerta-body">${atencion.map(r => `<b>${r.label}</b>: ${r.valor.toFixed(1)}%`).join(' &nbsp;·&nbsp; ')}</div>
      </div>`;
    } else {
      estadoHtml = `<div class="alerta-box-ok">
        <div class="alerta-title" style="color:#27ae60;">✓ Todos los indicadores dentro del rango esperado</div>
        <div class="alerta-body">El sistema opera con normalidad. Se recomienda mantener el monitoreo periódico.</div>
      </div>`;
    }

    const barsHtml = risks.map(r =>
      pdfRiskBadge(r.label, r.valor, r.umbral)
    ).join('');

    return pdfSection('2. Estado Global del Sistema',
      estadoHtml + barsHtml,
      criticos.length > 0 ? [
        'Priorizar la atención de los indicadores en rojo antes del siguiente corte semanal.',
        'Convocar reunión urgente con los líderes de las áreas afectadas.',
        'Generar plan de contención con responsables y fechas compromiso.',
        'Reportar el estado al comité de riesgos con evidencia de las acciones tomadas.',
      ] : []
    );
  })();

  // ── 3. Fraude y Seguridad ─────────────────────────────────────
  const fraudeSection = (() => {
    const partes: string[] = [];

    // Resumen ETL
    if (d.etlResumen) {
      partes.push(`
        <div class="subsec">Pipeline ETL — Resumen</div>
        ${pdfTable([
          { label: 'Transacciones analizadas', val: fmt(d.etlResumen.total_transacciones) },
          { label: 'Fraudes detectados',        val: fmt(d.etlResumen.total_fraudes) },
          { label: 'Tasa de fraude',            val: `${d.etlResumen.tasa_fraude_pct?.toFixed(2)}%` },
          { label: 'Monto total en riesgo',     val: fmtMXN(d.etlResumen.monto_total_fraude) },
          { label: 'Monto promedio por fraude', val: fmtMXN(d.etlResumen.monto_promedio_fraude) },
          { label: 'Monto máximo de fraude',    val: fmtMXN(d.etlResumen.monto_maximo_fraude) },
        ])}`);
      // Conclusión tasa fraude
      const tasa = d.etlResumen.tasa_fraude_pct ?? 0;
      const conclTasa = tasa > 5
        ? `La tasa de fraude del ${tasa.toFixed(2)}% está en nivel crítico. Se requiere revisión urgente de los controles preventivos.`
        : tasa > 2
        ? `La tasa de fraude del ${tasa.toFixed(2)}% está elevada. Se recomienda reforzar los modelos de detección.`
        : `La tasa de fraude del ${tasa.toFixed(2)}% se mantiene dentro de los parámetros aceptables.`;
      partes.push(pdfConclusion(conclTasa, tasa > 2));
    }

    // Tendencia mensual
    if (safe(d.fraudePorMes).length >= 3) {
      const items = d.fraudePorMes!.map(x => ({ label: x.año_mes.substring(5), value: x.total_fraudes }));
      const pico  = d.fraudePorMes!.reduce((m, x) => x.total_fraudes > m.total_fraudes ? x : m);
      const tercio = Math.max(1, Math.floor(d.fraudePorMes!.length / 3));
      const avgIni = d.fraudePorMes!.slice(0, tercio).reduce((s, x) => s + x.total_fraudes, 0) / tercio;
      const avgFin = d.fraudePorMes!.slice(-tercio).reduce((s, x) => s + x.total_fraudes, 0) / tercio;
      const isAlza = avgFin > avgIni;
      partes.push(`
        <div class="subsec">Tendencia mensual de fraudes</div>
        <div class="chart">${pdfLineSvg(items)}</div>
        ${pdfConclusion(
          isAlza
            ? `Tendencia al alza. Pico máximo en ${pico.año_mes} con ${fmt(pico.total_fraudes)} incidentes. Los controles actuales no son suficientes.`
            : `Tendencia a la baja. El pico fue ${pico.año_mes}. Los esfuerzos de contención están dando resultado.`,
          isAlza
        )}`);
    }

    // Por canal
    if (safe(d.fraudePorCanal).length) {
      const topCanal = d.fraudePorCanal!.reduce((m, x) => x.total_fraudes > m.total_fraudes ? x : m);
      partes.push(`
        <div class="subsec">Distribución por canal</div>
        ${pdfTable(d.fraudePorCanal!.map(x => ({
          label: x.canal,
          val:   `${fmt(x.total_fraudes)} fraudes (${x.porcentaje.toFixed(1)}%) — ${fmtMXN(x.monto_total)}`,
        })))}
        ${pdfConclusion(`El canal <b>${topCanal.canal}</b> concentra el ${topCanal.porcentaje.toFixed(1)}% de los fraudes. Priorizar controles en este canal.`, topCanal.porcentaje > 40)}`);
    }

    // Por categoría
    if (safe(d.fraudePorCategoria).length) {
      const top4 = d.fraudePorCategoria!.slice(0, 8);
      const catMax = top4.reduce((m, x) => x.total_fraudes > m.total_fraudes ? x : m);
      partes.push(`
        <div class="subsec">Top categorías con más fraude</div>
        <div class="chart">${pdfBarsSvg(top4.map(x => ({ label: x.categoria, value: x.total_fraudes })), '#ba1a1a')}</div>
        ${pdfConclusion(`La categoría <b>${catMax.categoria}</b> lidera con ${fmt(catMax.total_fraudes)} fraudes. Focalizar revisión de transacciones en esta categoría.`, true)}`);
    }

    // Top comercios
    if (safe(d.fraudeComercio).length) {
      const top5 = d.fraudeComercio!.slice(0, 5);
      partes.push(`
        <div class="subsec">Comercios con mayor incidencia</div>
        ${pdfTable(top5.map(x => ({
          label: `${x.comercio} (${x.categoria})`,
          val:   `${fmt(x.total_fraudes)} fraudes — ${fmtMXN(x.monto_total)}`,
        })))}`);
    }

    const acciones = [
      'Bloquear temporalmente cuentas con 3 o más alertas activas y notificar al cliente.',
      'Aplicar doble verificación (OTP + biometría) en canales con mayor tasa de fraude.',
      'Revisar patrones en la categoría y canal con mayor incidencia y actualizar reglas del motor de scoring.',
      'Establecer límites de monto diario reducidos para clientes con perfil de riesgo elevado.',
      'Coordinar con los comercios más afectados para implementar medidas preventivas conjuntas.',
      'Presentar informe semanal al Comité de Seguridad con evolución de indicadores.',
    ];

    return pdfSection('3. Fraude y Seguridad', partes.join(''), acciones);
  })();

  // ── 4. Cartera de Clientes ────────────────────────────────────
  const clientesSection = (() => {
    const partes: string[] = [];

    if (safe(d.segmentos).length) {
      const total = d.segmentos!.reduce((s, x) => s + x.total, 0);
      const top   = d.segmentos!.reduce((m, x) => x.total > m.total ? x : m);
      partes.push(`
        <div class="subsec">Distribución por segmento</div>
        ${pdfTable(d.segmentos!.map(x => ({
          label: x.segmento,
          val:   `${fmt(x.total)} clientes (${((x.total / total) * 100).toFixed(1)}%)`,
        })))}
        ${pdfConclusion(`El segmento <b>${top.segmento}</b> es el más representativo con ${((top.total / total) * 100).toFixed(1)}% de la base. Diseñar productos y comunicación diferenciada para este grupo.`)}`);
    }

    if (safe(d.generos).length) {
      const total = d.generos!.reduce((s, x) => s + x.total, 0);
      partes.push(`
        <div class="subsec">Distribución por género</div>
        ${pdfTable(d.generos!.map(x => ({
          label: x.genero,
          val:   `${fmt(x.total)} clientes (${((x.total / total) * 100).toFixed(1)}%)`,
        })))}`);
    }

    const acciones = [
      'Desarrollar ofertas específicas para el segmento dominante con mayores beneficios.',
      'Diseñar campañas de adquisición focalizadas en los segmentos con menor representación.',
      'Revisar el NPS por segmento para identificar oportunidades de mejora en experiencia.',
      'Evaluar si la distribución de género refleja el mercado objetivo y ajustar estrategia comercial.',
    ];

    return partes.length
      ? pdfSection('4. Cartera de Clientes', partes.join(''), acciones)
      : '';
  })();

  // ── 5. Cuentas y Préstamos ────────────────────────────────────
  const cuentasSection = (() => {
    const partes: string[] = [];

    // Saldo por tipo de cuenta
    if (safe(d.saldoCuentas).length) {
      const saldoMax = d.saldoCuentas!.reduce((m, x) => Number(x.saldo_total) > Number(m.saldo_total) ? x : m);
      partes.push(`
        <div class="subsec">Saldo por tipo de cuenta</div>
        <div class="chart">${pdfBarsSvg(d.saldoCuentas!.map(x => ({ label: x.tipo, value: Number(x.saldo_total) })), '#1973B8')}</div>
        ${pdfConclusion(`Las cuentas <b>${saldoMax.tipo}</b> concentran la mayor liquidez. Mantener monitoreo constante de movimientos inusuales en este tipo.`)}`);
    }

    // Préstamos por tipo
    if (safe(d.prestamos).length) {
      const prestMax = d.prestamos!.reduce((m, x) => x.total > m.total ? x : m);
      const prestMin = d.prestamos!.reduce((m, x) => x.total < m.total ? x : m);
      partes.push(`
        <div class="subsec">Préstamos por tipo</div>
        <div class="chart">${pdfBarsSvg(d.prestamos!.map(x => ({ label: x.tipo, value: x.total })))}</div>
        ${pdfConclusion(`Los préstamos <b>${prestMax.tipo}</b> son los más otorgados y representan la mayor exposición crediticia. Los <b>${prestMin.tipo}</b> tienen menor demanda; revisar condiciones de mercado.`)}`);
    }

    // Score crediticio
    if (safe(d.scores).length) {
      const scoreTop = d.scores!.reduce((m, x) => x.total > m.total ? x : m);
      const firstNum = parseInt(scoreTop.rango.split(/[-\s]/)[0], 10);
      const isRisk   = !isNaN(firstNum) && firstNum < 600;
      partes.push(`
        <div class="subsec">Distribución de Score Crediticio</div>
        <div class="chart">${pdfBarsSvg(d.scores!.map(x => ({ label: x.rango, value: x.total })), '#7c3aed')}</div>
        ${pdfConclusion(
          isRisk
            ? `El rango <b>${scoreTop.rango}</b> concentra la mayor cantidad de clientes. Un score bajo implica mayor riesgo de impago; reforzar el análisis en nuevas solicitudes.`
            : `El rango <b>${scoreTop.rango}</b> es el predominante. El perfil crediticio es saludable y ofrece margen para ampliar la oferta de productos.`,
          isRisk
        )}`);
    }

    // Cobros excedidos
    if (safe(d.cobrosExc).length) {
      partes.push(`
        <div class="subsec">Cobros excedidos por tipo</div>
        <div class="chart">${pdfBarsSvg(d.cobrosExc!.map(x => ({ label: x.tipo, value: x.total })), '#ba1a1a')}</div>
        ${pdfConclusion('Se detectaron cobros que superan los límites regulatorios. Auditar inmediatamente y corregir los parámetros del sistema de facturación.', true)}`);
    } else if (d.cobrosExc !== undefined) {
      partes.push(`
        <div class="subsec">Cobros excedidos</div>
        <div class="alerta-box-ok">
          <div class="alerta-title" style="color:#27ae60;">✓ Sin cobros excedidos detectados</div>
          <div class="alerta-body">Todos los cobros se encuentran dentro de los límites regulatorios.</div>
        </div>`);
    }

    const acciones = [
      'Revisar los préstamos vencidos con más de 30 días de atraso y activar protocolo de cobranza preventiva.',
      'Reevaluar las condiciones de los préstamos con mayor morosidad y ofrecer reestructuración.',
      'Auditar los tipos de cobro fuera de límite y corregirlos en el sistema en un plazo máximo de 72 horas.',
      'Establecer alertas automáticas cuando el saldo de cuentas de alto volumen supere umbrales definidos.',
      'Revisar políticas de otorgamiento para clientes con score por debajo de 600 puntos.',
    ];

    return partes.length
      ? pdfSection('5. Cuentas y Préstamos', partes.join(''), acciones)
      : '';
  })();

  // ── 6. Tarjetas de Crédito ────────────────────────────────────
  const tarjetasSection = (() => {
    const partes: string[] = [];

    // Utilización
    if (d.utilizacionResumen) {
      const u = d.utilizacionResumen;
      const uColor = u.utilizacion_global > 70 ? '#ba1a1a' : u.utilizacion_global > 50 ? '#e67e22' : '#27ae60';
      partes.push(`
        <div class="subsec">Utilización promedio del crédito</div>
        ${pdfChips([
          { label: 'Uso global',       val: `${u.utilizacion_global.toFixed(1)}%`, variant: u.utilizacion_global > 70 ? 'risk' : u.utilizacion_global > 50 ? 'warn' : 'ok' },
          { label: 'Tarjetas activas', val: fmt(u.total_tarjetas) },
          { label: 'Saldo usado',      val: fmtMXN(u.saldo_total) },
          { label: 'Límite total',     val: fmtMXN(u.limite_total) },
        ])}
        ${pdfRiskBadge('Utilización del límite de crédito', u.utilizacion_global, 70)}
        ${pdfConclusion(
          u.utilizacion_global > 70
            ? `Utilización global del ${u.utilizacion_global.toFixed(1)}%, por encima del 70%. Riesgo elevado de incumplimiento. Revisar límites y activar alertas preventivas para clientes con uso superior al 90%.`
            : u.utilizacion_global > 50
            ? `Utilización del ${u.utilizacion_global.toFixed(1)}%. Nivel moderado. Monitorear clientes con uso individual superior al 80% de su límite.`
            : `Utilización del ${u.utilizacion_global.toFixed(1)}%. Cartera saludable con capacidad crediticia disponible.`,
          u.utilizacion_global > 70
        )}`);
    }

    if (safe(d.utilizacionCredito).length) {
      partes.push(`
        <div class="subsec">Utilización por tipo de tarjeta</div>
        <div class="chart">${pdfBarsSvg(d.utilizacionCredito!.map(x => ({ label: x.tipo_tarjeta, value: x.utilizacion_promedio })), '#004481')}</div>`);
    }

    // Morosidad
    if (d.morosidadResumen) {
      const m = d.morosidadResumen;
      partes.push(`
        <div class="subsec">Morosidad en tarjetas de crédito</div>
        ${pdfChips([
          { label: 'Al corriente',    val: fmt(m.total_activas - m.total_morosas), variant: 'ok' },
          { label: 'Bloqueadas',      val: fmt(m.total_morosas), variant: 'risk' },
          { label: 'Tasa morosidad',  val: `${m.tasa_morosidad.toFixed(1)}%`, variant: m.tasa_morosidad > 30 ? 'risk' : 'warn' },
        ])}
        ${pdfConclusion(
          m.tasa_morosidad > 40
            ? `El ${m.tasa_morosidad.toFixed(1)}% de las tarjetas están bloqueadas. Nivel crítico. Activar inmediatamente estrategia de recuperación y revisar políticas de otorgamiento.`
            : m.tasa_morosidad > 30
            ? `El ${m.tasa_morosidad.toFixed(1)}% de las tarjetas bloqueadas por impago. Lanzar campaña de regularización y revisar perfiles de riesgo.`
            : `El ${m.tasa_morosidad.toFixed(1)}% de las tarjetas están bloqueadas. Las tarjetas activas operan con normalidad.`,
          m.tasa_morosidad > 30
        )}`);
    }

    if (safe(d.morosidadTarjetas).length) {
      partes.push(`
        <div class="subsec">Morosidad por tipo de tarjeta</div>
        <div class="chart">${pdfBarsSvg(d.morosidadTarjetas!.map(x => ({ label: x.tipo_tarjeta, value: x.tasa_morosidad })), '#ba1a1a')}</div>`);
    }

    // Tasas de interés
    if (safe(d.tasasInteres).length) {
      const maxTasa = d.tasasInteres!.reduce((m, x) => x.tasa_promedio > m.tasa_promedio ? x : m);
      const minTasa = d.tasasInteres!.reduce((m, x) => x.tasa_promedio < m.tasa_promedio ? x : m);
      partes.push(`
        <div class="subsec">Tasa de interés promedio por tipo de préstamo</div>
        ${pdfTable([
          ...d.tasasInteres!.map(t => ({
            label: t.tipo_prestamo,
            val:   `Prom: ${t.tasa_promedio.toFixed(1)}% | Mín: ${t.tasa_minima.toFixed(1)}% | Máx: ${t.tasa_maxima.toFixed(1)}%`,
          })),
        ])}
        ${pdfConclusion(
          maxTasa.tipo_prestamo !== minTasa.tipo_prestamo
            ? `${maxTasa.tipo_prestamo} tiene la tasa más alta (${maxTasa.tasa_promedio.toFixed(1)}%) y ${minTasa.tipo_prestamo} la más baja (${minTasa.tasa_promedio.toFixed(1)}%). Revisar pricing para mayor competitividad en el mercado.`
            : `Las tasas están niveladas entre productos.`
        )}`);
    }

    const acciones = [
      'Activar alertas automáticas para clientes con utilización superior al 80% de su límite crediticio.',
      'Revisar y ajustar los límites de crédito de los clientes con utilización crónica superior al 90%.',
      'Lanzar campaña de pago mínimo para clientes bloqueados ofreciendo quita de cargos moratorios.',
      'Revisar el pricing de las tasas de interés comparando con el mercado para mantener competitividad.',
      'Implementar modelos predictivos de impago para anticipar bloqueos antes de que ocurran.',
      'Ofrecer planes de regularización personalizados a los segmentos con mayor tasa de bloqueo.',
    ];

    return partes.length
      ? pdfSection('6. Tarjetas de Crédito', partes.join(''), acciones)
      : '';
  })();

  // ── 7. Metas de Ahorro ────────────────────────────────────────
  const metasSection = (() => {
    if (!safe(d.metasEstatus).length && !d.metasProgreso) return '';
    const partes: string[] = [];

    if (safe(d.metasEstatus).length) {
      const completadas = d.metasEstatus!.find(m => m.estatus?.toLowerCase().includes('complet'));
      const fallidas    = d.metasEstatus!.find(m => m.estatus?.toLowerCase().includes('fall'));
      const isAlerta    = !!(fallidas && completadas && fallidas.porcentaje > completadas.porcentaje);
      partes.push(`
        <div class="subsec">Distribución de metas por estatus</div>
        ${pdfTable(d.metasEstatus!.map(m => ({
          label: m.estatus,
          val:   `${fmt(m.total)} metas (${m.porcentaje.toFixed(1)}%)`,
        })))}
        ${pdfConclusion(
          isAlerta
            ? `Las metas fallidas (${fallidas!.porcentaje.toFixed(1)}%) superan a las completadas (${completadas?.porcentaje.toFixed(1) ?? '?'}%). Revisar si los montos objetivo son alcanzables con el perfil financiero del cliente.`
            : completadas
            ? `El ${completadas.porcentaje.toFixed(1)}% de las metas fueron completadas exitosamente. Buen indicador de engagement financiero.`
            : 'Sin conclusión disponible.',
          isAlerta
        )}`);
    }

    if (d.metasProgreso) {
      const mp = d.metasProgreso;
      partes.push(`
        <div class="subsec">Progreso de metas activas</div>
        ${pdfChips([
          { label: 'Progreso promedio', val: `${mp.progreso_promedio.toFixed(1)}%`, variant: mp.progreso_promedio >= 75 ? 'ok' : 'warn' },
          { label: 'Metas activas',     val: fmt(mp.total_activas) },
          { label: 'Ahorrado',          val: fmtMXN(mp.monto_actual_total), variant: 'ok' },
          { label: 'Objetivo total',    val: fmtMXN(mp.monto_objetivo_total) },
        ])}
        ${pdfConclusion(
          mp.progreso_promedio >= 75
            ? `Gran parte de los clientes están cerca de completar sus metas (${mp.progreso_promedio.toFixed(1)}% de avance promedio). Mantener recordatorios para el cierre.`
            : `Con un avance del ${mp.progreso_promedio.toFixed(1)}%, activar microincentivos y recordatorios automáticos puede acelerar el cumplimiento.`,
          mp.progreso_promedio < 50
        )}`);
    }

    const acciones = [
      'Revisar que los montos objetivo de las metas sean proporcionales al perfil de ingresos del cliente.',
      'Activar recordatorios push cuando el ahorro acumulado esté por debajo del ritmo esperado.',
      'Ofrecer ajuste de metas con plazos más cortos y montos más pequeños a clientes con baja adherencia.',
      'Diseñar microincentivos (cashback, puntos, tasas preferenciales) al completar una meta.',
      'Analizar en qué mes del ciclo se producen más abandonos para intervenir de forma preventiva.',
    ];

    return pdfSection('7. Metas de Ahorro', partes.join(''), acciones);
  })();

  // ── 8. Medios de Pago ─────────────────────────────────────────
  const pagosSection = (() => {
    if (!safe(d.pagosPorEstatus).length && !safe(d.pagosPorCanal).length) return '';
    const partes: string[] = [];

    if (safe(d.pagosPorEstatus).length) {
      const exitoso  = d.pagosPorEstatus!.find(p => p.estatus?.toLowerCase().includes('exit'));
      const esRiesgo = exitoso ? exitoso.porcentaje < 95 : false;
      partes.push(`
        <div class="subsec">Tasa de éxito en pagos</div>
        ${pdfTable(d.pagosPorEstatus!.map(p => ({
          label: p.estatus,
          val:   `${fmt(p.total)} (${p.porcentaje.toFixed(1)}%)`,
        })))}
        ${exitoso ? pdfConclusion(
          esRiesgo
            ? `Tasa de éxito del ${exitoso.porcentaje.toFixed(1)}%, por debajo del 95% recomendado. Revisar integración con redes de pago y ejecutar pruebas de latencia.`
            : `El ${exitoso.porcentaje.toFixed(1)}% de los pagos se procesan exitosamente. La infraestructura opera con normalidad.`,
          esRiesgo
        ) : ''}`);
    }

    if (safe(d.pagosPorCanal).length) {
      const top = d.pagosPorCanal!.reduce((m, x) => x.total > m.total ? x : m);
      partes.push(`
        <div class="subsec">Canal de pago más utilizado</div>
        <div class="chart">${pdfBarsSvg(d.pagosPorCanal!.map(x => ({ label: x.canal, value: x.total })))}</div>
        ${pdfConclusion(`El canal <b>${top.canal}</b> concentra el ${top.porcentaje.toFixed(1)}% de los pagos. Priorizar la disponibilidad y rendimiento de este canal en los planes de capacidad.`)}`);
    }

    const acciones = [
      'Garantizar una disponibilidad del 99.9% en el canal de pago principal mediante redundancia de infraestructura.',
      'Ejecutar pruebas de carga semanales en los canales con mayor volumen de transacciones.',
      'Revisar los pagos fallidos e identificar si el error es del cliente, del banco o del comercio.',
      'Establecer un SLA de resolución máximo de 48 horas para los pagos rechazados recurrentes.',
      'Evaluar si los canales digitales están creciendo y ajustar la inversión en infraestructura acorde.',
    ];

    return pdfSection('8. Medios de Pago', partes.join(''), acciones);
  })();

  // ── 9. Seguros ────────────────────────────────────────────────
  const segurosSection = (() => {
    if (!safe(d.segurosPorEstatus).length && !d.primaAnual) return '';
    const partes: string[] = [];

    if (safe(d.segurosPorEstatus).length) {
      const activas    = d.segurosPorEstatus!.find(s => s.estatus?.toLowerCase().includes('activ'));
      const canceladas = d.segurosPorEstatus!.find(s => s.estatus?.toLowerCase().includes('cancel'));
      const esRiesgo   = !!(canceladas && canceladas.porcentaje > 15);
      partes.push(`
        <div class="subsec">Pólizas por estatus</div>
        ${pdfTable(d.segurosPorEstatus!.map(s => ({
          label: s.estatus,
          val:   `${fmt(s.total)} pólizas (${s.porcentaje.toFixed(1)}%)`,
        })))}
        ${activas ? pdfConclusion(
          esRiesgo
            ? `Tasa de cancelación del ${canceladas!.porcentaje.toFixed(1)}%, supera el umbral del 15%. Revisar estrategia de retención.`
            : `El ${activas.porcentaje.toFixed(1)}% de las pólizas se mantienen activas. Portafolio con buena retención.`,
          esRiesgo
        ) : ''}`);
    }

    if (d.primaAnual) {
      const p = d.primaAnual;
      partes.push(`
        <div class="subsec">Prima anual — Rentabilidad del portafolio</div>
        ${pdfChips([
          { label: 'Prima promedio', val: fmtMXN(p.prima_promedio) },
          { label: 'Ingreso total',  val: fmtMXN(p.prima_total), variant: 'ok' },
          { label: 'Total pólizas', val: fmt(p.total_polizas) },
        ])}`);
    }

    const acciones = [
      'Contactar a clientes con pólizas próximas a cancelarse con oferta de renovación con descuento.',
      'Revisar si el precio de las primas es competitivo en el mercado comparando con la competencia.',
      'Implementar recordatorios automáticos de vencimiento con 60, 30 y 15 días de anticipación.',
      'Analizar las causas de cancelación más frecuentes mediante encuesta post-cancelación.',
      'Diseñar bundles de productos que incluyan seguro para aumentar la retención.',
    ];

    return pdfSection('9. Seguros', partes.join(''), acciones);
  })();

  // ── 10. Comunicación ──────────────────────────────────────────
  const comunicacionSection = (() => {
    if (!safe(d.notiEstatus).length && !safe(d.notiCanal).length) return '';
    const partes: string[] = [];

    if (safe(d.notiEstatus).length) {
      const entregadas = d.notiEstatus!.find(n => n.estatus?.toLowerCase().includes('entreg'));
      const esOk = entregadas ? entregadas.porcentaje >= 90 : true;
      partes.push(`
        <div class="subsec">Notificaciones por estatus</div>
        ${pdfTable(d.notiEstatus!.map(n => ({
          label: n.estatus,
          val:   `${fmt(n.total)} (${n.porcentaje.toFixed(1)}%)`,
        })))}
        ${entregadas ? pdfConclusion(
          esOk
            ? `El ${entregadas.porcentaje.toFixed(1)}% de notificaciones llegan al cliente. Tasa de entrega saludable.`
            : `Solo el ${entregadas.porcentaje.toFixed(1)}% se entregan. Revisar tokens push y permisos de notificación en app.`,
          !esOk
        ) : ''}`);
    }

    if (safe(d.notiCanal).length) {
      const top = d.notiCanal!.reduce((m, x) => x.total > m.total ? x : m);
      partes.push(`
        <div class="subsec">Canal de mayor alcance</div>
        ${pdfTable(d.notiCanal!.map(n => ({
          label: n.canal,
          val:   `${fmt(n.total)} (${n.porcentaje.toFixed(1)}%)`,
        })))}
        ${pdfConclusion(`El canal <b>${top.canal}</b> lidera con ${top.porcentaje.toFixed(1)}% del alcance total. Priorizar este canal en campañas de retención y comunicación crítica.`)}`);
    }

    const acciones = [
      'Revisar y actualizar los tokens push de los usuarios con notificaciones fallidas.',
      'Priorizar el canal con mayor tasa de entrega para comunicados urgentes de seguridad.',
      'Realizar pruebas A/B de mensajes para mejorar la tasa de apertura en canales digitales.',
      'Segmentar las notificaciones por perfil de cliente para mejorar relevancia y reducir opt-outs.',
      'Establecer un límite de notificaciones diarias por cliente para evitar fatiga de mensajes.',
    ];

    return pdfSection('10. Comunicación', partes.join(''), acciones);
  })();

  // ── 11. Captación Comercial ───────────────────────────────────
  const captacionSection = (() => {
    if (!safe(d.cuentasSucursal).length && !d.nominaRes) return '';
    const partes: string[] = [];

    if (safe(d.cuentasSucursal).length) {
      const sorted = [...d.cuentasSucursal!].sort((a, b) => b.nuevas_cuentas - a.nuevas_cuentas);
      const top3   = sorted.slice(0, 3);
      const bottom = sorted[sorted.length - 1];
      const top10  = sorted.slice(0, 10);
      partes.push(`
        <div class="subsec">Nuevas cuentas por sucursal (Top 10)</div>
        <div class="chart">${pdfBarsSvg(top10.map(s => ({ label: s.sucursal, value: s.nuevas_cuentas })))}</div>
        ${pdfConclusion(`Sucursales más productivas: <b>${top3.map(s => s.sucursal).join(', ')}</b>. La sucursal <b>${bottom.sucursal}</b> tiene el menor volumen y puede beneficiarse de apoyo comercial o revisión de zona.`)}`);
    }

    if (d.nominaRes) {
      const n = d.nominaRes;
      partes.push(`
        <div class="subsec">Penetración de nómina BBVA</div>
        ${pdfChips([
          { label: 'Con nómina BBVA',  val: fmt(n.con_nomina_bbva), variant: 'ok' },
          { label: 'Sin nómina BBVA',  val: fmt(n.sin_nomina_bbva), variant: 'warn' },
          { label: 'Penetración',      val: `${n.porcentaje_penetracion.toFixed(1)}%`, variant: n.porcentaje_penetracion >= 50 ? 'ok' : 'warn' },
        ])}
        ${pdfConclusion(
          n.porcentaje_penetracion >= 50
            ? `Penetración del ${n.porcentaje_penetracion.toFixed(1)}%. Más de la mitad de las empresas procesan nómina con BBVA. Facilita el cross-selling de crédito nómina y seguros.`
            : `${fmt(n.sin_nomina_bbva)} empresas aún no procesan nómina con BBVA. Oportunidad de crecimiento significativa. Activar fuerza de ventas corporativa.`,
          n.porcentaje_penetracion < 30
        )}`);
    }

    const acciones = [
      'Asignar metas individuales de apertura de cuentas por sucursal basadas en potencial de zona.',
      'Reforzar con promotores adicionales las sucursales con menor captación.',
      'Diseñar campaña de nómina empresarial para las empresas sin domiciliación BBVA.',
      'Establecer incentivos para ejecutivos de sucursales top como modelo a replicar.',
      'Revisar la distribución geográfica de sucursales vs concentración de clientes potenciales.',
    ];

    return pdfSection('11. Captación Comercial', partes.join(''), acciones);
  })();

  // ── 12. Debilidades y Plan de Acción ─────────────────────────
  const debilidadesSection = (() => {
    if (!d.debilidadesData) return '';
    const soluciones = safe(d.soluciones);
    const ind        = d.indicadores;

    const UMBS: Record<string, number> = {
      porcentajeFraudePotencial:   5,
      porcentajeCobrosExcedidos:   10,
      porcentajeCuentasCanceladas: 20,
      porcentajePrestamosVencidos: 15,
      porcentajeMetasFallidas:     30,
    };
    const LABELS: Record<string, string> = {
      porcentajeFraudePotencial:   'Fraude Potencial',
      porcentajeCobrosExcedidos:   'Cobros Excedidos',
      porcentajeCuentasCanceladas: 'Cuentas Canceladas',
      porcentajePrestamosVencidos: 'Préstamos Vencidos',
      porcentajeMetasFallidas:     'Metas de Ahorro Fallidas',
    };

    const indicadoresHtml = ind
      ? Object.entries(UMBS).map(([k, u]) =>
          pdfRiskBadge(LABELS[k], ind[k] ?? 0, u)
        ).join('')
      : '';

    const solucionesHtml = soluciones.length === 0
      ? `<div class="alerta-box-ok">
          <div class="alerta-title" style="color:#27ae60;">✓ Sin debilidades críticas detectadas</div>
          <div class="alerta-body">Todos los indicadores están dentro de los rangos esperados para este periodo.</div>
        </div>`
      : soluciones.map(sol => {
          const PASOS: Record<string, string[]> = {
            Seguridad:    ['Revisar transacciones sospechosas del último período', 'Bloquear cuentas con 3+ alertas activas', 'Notificar al cliente y solicitar confirmación', 'Reportar al equipo de ciberseguridad'],
            Cumplimiento: ['Auditar cobros que superan el límite regulatorio', 'Ajustar parámetros en sistema de facturación', 'Generar reporte al área de cumplimiento', 'Capacitar al equipo en normativa vigente'],
            Retención:    ['Identificar motivos de cancelación mediante encuestas', 'Contactar clientes en riesgo con oferta personalizada', 'Diseñar programa de beneficios por antigüedad', 'Analizar si el problema es de producto, precio o UX'],
            Cartera:      ['Identificar clientes con más de 30 días de atraso', 'Enviar oferta de reestructuración de deuda', 'Ofrecer plan de pagos con quita de intereses moratorios', 'Escalar a cobranza extrajudicial si supera 90 días'],
            Ahorro:       ['Revisar si las metas son alcanzables para el perfil del cliente', 'Enviar recordatorios automáticos de progreso', 'Proponer metas ajustadas con montos menores', 'Analizar en qué punto del periodo se abandona la meta'],
          };
          const pasos = PASOS[sol.area] ?? ['Revisar el área afectada', 'Implementar controles preventivos', 'Monitorear evolución del indicador'];
          const colorBadge = sol.prioridad === 'Alta' ? '#ba1a1a' : sol.prioridad === 'Media' ? '#e67e22' : '#27ae60';
          return `
            <div class="deb-card" style="border-left:4px solid ${colorBadge};">
              <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
                <span class="badge ${sol.prioridad.toLowerCase()}">${esc(sol.prioridad.toUpperCase())}</span>
                <span style="font-size:14px;font-weight:700;color:#1a1c1c;">${esc(sol.problema)}</span>
              </div>
              <div style="font-size:12px;color:#475569;line-height:1.6;margin-bottom:10px;">
                ${esc(sol.solucion ?? '')}
              </div>
              <div style="font-size:10px;font-weight:700;color:#737781;letter-spacing:.8px;
                margin-bottom:8px;">PASOS DE ACCIÓN</div>
              ${pasos.map((p, i) => `
                <div style="display:flex;gap:8px;margin-bottom:6px;align-items:flex-start;
                  page-break-inside:avoid;">
                  <div style="background:${colorBadge};color:#fff;border-radius:50%;width:18px;
                    height:18px;font-size:10px;font-weight:800;flex-shrink:0;text-align:center;
                    line-height:18px;">${i + 1}</div>
                  <div style="font-size:12px;color:#374151;line-height:1.5;">${esc(p)}</div>
                </div>`).join('')}
            </div>`;
        }).join('');

    const content = `
      <div class="subsec">Indicadores de Riesgo</div>
      ${indicadoresHtml}
      <div class="subsec">Planes de Acción por Debilidad</div>
      ${solucionesHtml}`;

    return pdfSection('12. Debilidades Detectadas y Plan de Acción', content);
  })();

  // ── Ensamblar documento ───────────────────────────────────────
  const body = [
    toc,
    resumenEjecutivo,
    estadoGlobal,
    fraudeSection,
    clientesSection,
    cuentasSection,
    tarjetasSection,
    metasSection,
    pagosSection,
    segurosSection,
    comunicacionSection,
    captacionSection,
    debilidadesSection,
  ].filter(Boolean).join('\n');

  return buildDocHtml('Reporte Ejecutivo Completo de KPIs', d.fecha, d.tri, body);
};