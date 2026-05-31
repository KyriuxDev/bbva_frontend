const MESES_ES = [
  'enero','febrero','marzo','abril','mayo','junio',
  'julio','agosto','septiembre','octubre','noviembre','diciembre',
];

export const fmt = (n: number) => Math.round(n).toLocaleString('es-MX');

export const fmtMXN = (n: number) => {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(1)}K`;
  return `$${fmt(n)}`;
};

export const fmtMesLargo = (añoMes: string) => {
  const [año, mes] = añoMes.split('-');
  return `${MESES_ES[parseInt(mes, 10) - 1]} ${año}`;
};

export const calcTrimestre = (): string => {
  const now   = new Date();
  const q     = Math.floor(now.getMonth() / 3) + 1;
  const meses = ['Ene - Mar', 'Abr - Jun', 'Jul - Sep', 'Oct - Dic'];
  return `T${q} ${now.getFullYear()} · ${meses[q - 1]}`;
};