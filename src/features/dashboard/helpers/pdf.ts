import { fmt, fmtMXN } from './format';

export const esc = (s: string | number): string =>
  String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

export const pdfFecha = (): string =>
  new Date().toLocaleDateString('es-MX', {
    day: '2-digit', month: 'long', year: 'numeric',
  });

export const pdfBarsSvg = (
  items: { label: string; value: number }[],
  color = '#004990'
): string => {
  if (!items.length) return '';
  const maxV     = Math.max(...items.map(i => i.value), 1);
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

export const pdfConclusion = (text: string, isAlert = false): string =>
  `<div class="conclusion${isAlert ? ' alert' : ''}">${esc(text)}</div>`;

export const pdfAcciones = (acciones: string[]): string =>
  `<div class="acciones-title">Acciones recomendadas</div>` +
  acciones.map((a, i) =>
    `<div class="accion">
      <div class="accion-num">${i + 1}</div>
      <div class="accion-txt">${esc(a)}</div>
    </div>`
  ).join('');

export const pdfTable = (rows: { label: string; val: string }[]): string =>
  `<table class="table">
    <thead><tr><th>Indicador</th><th>Valor</th></tr></thead>
    <tbody>
      ${rows.map(r => `<tr><td>${esc(r.label)}</td><td>${esc(r.val)}</td></tr>`).join('')}
    </tbody>
  </table>`;

export const buildDocHtml = (
  docTitle: string,
  fecha:    string,
  tri:      string,
  bodyHtml: string
): string => `<!DOCTYPE html><html><head><meta charset="utf-8"/><style>
*{margin:0;padding:0;box-sizing:border-box;}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#1a1c1c;background:#fff;}
.hdr{background:#004990;color:#fff;padding:24px 28px 20px;}
.hdr-logo{font-size:30px;font-weight:900;letter-spacing:1px;margin-bottom:6px;}
.hdr-title{font-size:18px;font-weight:700;margin-bottom:4px;}
.hdr-meta{font-size:12px;opacity:.8;}
.body{padding:20px 28px;}
.sec{margin-bottom:24px;padding-bottom:24px;border-bottom:1px solid #e2e8f0;}
.sec:last-child{border-bottom:none;}
.sec-title{font-size:11px;font-weight:800;color:#737781;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:12px;}
.chips{display:flex;gap:10px;flex-wrap:wrap;margin-bottom:14px;}
.chip{background:#f4f6fa;border-radius:8px;padding:10px 14px;flex:1;min-width:90px;}
.chip-lbl{font-size:10px;color:#737781;font-weight:600;margin-bottom:3px;}
.chip-val{font-size:22px;font-weight:800;color:#004990;}
.chip-val.ok{color:#27ae60;}.chip-val.risk{color:#c0392b;}
.conclusion{background:#f4f6fa;border-left:3px solid #004990;padding:12px;margin:12px 0;font-size:12px;color:#3d4046;line-height:1.6;}
.conclusion.alert{background:#fff4f4;border-left-color:#c0392b;}
.acciones-title{font-size:12px;font-weight:700;color:#004990;margin:12px 0 8px;}
.accion{display:flex;gap:10px;margin-bottom:7px;align-items:flex-start;}
.accion-num{background:#004990;color:#fff;border-radius:50%;width:18px;height:18px;font-size:10px;font-weight:800;flex-shrink:0;text-align:center;line-height:18px;}
.accion-txt{font-size:12px;color:#475569;line-height:1.5;}
.table{width:100%;border-collapse:collapse;margin:10px 0;}
.table th{background:#f4f6fa;font-size:11px;font-weight:700;color:#5d5f5f;padding:8px 10px;text-align:left;border-bottom:2px solid #e2e8f0;}
.table td{font-size:12px;padding:8px 10px;border-bottom:1px solid #f0f2f5;}
.table td:last-child{font-weight:700;color:#004990;}
.chart{margin:14px 0;}
.badge{display:inline-block;border-radius:10px;padding:2px 8px;font-size:10px;font-weight:800;color:#fff;}
.badge.alta{background:#ba1a1a;}.badge.media{background:#e67e22;}.badge.baja{background:#27ae60;}
.ftr{background:#f4f6fa;padding:12px 28px;font-size:10px;color:#737781;text-align:center;border-top:1px solid #e2e8f0;}
</style></head><body>
<div class="hdr">
  <div class="hdr-logo">BBVA</div>
  <div class="hdr-title">${esc(docTitle)}</div>
  <div class="hdr-meta">${esc(tri)} &middot; Generado el ${esc(fecha)}</div>
</div>
<div class="body">${bodyHtml}</div>
<div class="ftr">Generado automaticamente por BBVA Analytics &middot; Confidencial</div>
</body></html>`;