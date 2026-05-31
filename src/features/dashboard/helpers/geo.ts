import {
  MEX_LAT_MIN, MEX_LAT_MAX,
  MEX_LNG_MIN, MEX_LNG_MAX,
  MAP_SVG_W,   MAP_SVG_H,
  GEO_ZONAS,   REC_CANAL,
} from '@/src/features/dashboard/constants/mapa';
import type { FraudeGeo } from '@/src/features/dashboard/types';

export const lngToX = (lng: number) =>
  ((lng - MEX_LNG_MIN) / (MEX_LNG_MAX - MEX_LNG_MIN)) * MAP_SVG_W;

export const latToY = (lat: number) =>
  ((MEX_LAT_MAX - lat) / (MEX_LAT_MAX - MEX_LAT_MIN)) * MAP_SVG_H;

export const coordsToPath = (coords: [number, number][]): string =>
  coords
    .map(([lng, lat], i) =>
      `${i === 0 ? 'M' : 'L'}${lngToX(lng).toFixed(1)},${latToY(lat).toFixed(1)}`
    )
    .join(' ') + ' Z';

export const getNombreZona = (lat: number, lng: number): string => {
  let minD = Infinity, nearest = 'Mexico';
  for (const z of GEO_ZONAS) {
    const d = Math.hypot(z.lat - lat, z.lng - lng);
    if (d < minD) { minD = d; nearest = z.n; }
  }
  return minD < 2.5 ? `Cerca de ${nearest}` : 'Zona rural de Mexico';
};

export const getRecomendaciones = (canal: string, _categoria: string): string[] =>
  REC_CANAL[canal] ?? [
    'Monitorea tu estado de cuenta con frecuencia',
    'Reporta cargos no reconocidos de inmediato al banco',
    'Activa notificaciones push para cada transaccion',
  ];

export const clusterGeoData = (data: FraudeGeo[], minPx: number): FraudeGeo[] => {
  const out: { x: number; y: number; d: FraudeGeo }[] = [];
  for (const item of [...data].sort((a, b) => b.total_fraudes - a.total_fraudes)) {
    const x   = lngToX(item.lng);
    const y   = latToY(item.lat);
    const hit = out.find(c => Math.hypot(c.x - x, c.y - y) < minPx);
    if (hit) {
      hit.d = {
        ...hit.d,
        total_fraudes: hit.d.total_fraudes + item.total_fraudes,
        monto_total:   hit.d.monto_total   + item.monto_total,
      };
    } else {
      out.push({ x, y, d: { ...item } });
    }
  }
  return out.map(c => c.d);
};