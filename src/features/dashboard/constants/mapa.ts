export const MEX_LAT_MIN = 14.5;
export const MEX_LAT_MAX = 32.7;
export const MEX_LNG_MIN = -118.4;
export const MEX_LNG_MAX = -86.7;
export const MAP_SVG_W   = 320;
export const MAP_SVG_H   = 200;

export const MEX_MAINLAND_COORDS: [number, number][] = [
  [-114.8,32.5],[-111.0,31.3],[-108.5,31.5],[-106.5,31.7],
  [-104.5,29.6],[-100.7,29.1],[-99.5,27.5],[-98.3,26.1],[-97.5,25.9],
  [-97.8,22.3],[-96.1,19.2],[-94.5,18.2],
  [-90.6,19.8],[-87.0,21.5],[-86.8,21.0],[-87.6,18.5],[-89.1,16.0],
  [-92.2,14.9],
  [-97.0,15.9],[-99.9,17.0],[-102.2,18.0],[-104.3,19.1],
  [-105.2,20.6],[-106.4,23.2],
  [-109.1,25.6],[-110.9,27.9],[-113.5,31.3],[-114.8,32.5],
];

export const MEX_BAJA_COORDS: [number, number][] = [
  [-117.0,32.5],[-116.6,31.9],[-115.7,30.0],[-115.0,28.0],
  [-114.5,26.8],[-112.0,24.5],[-109.9,22.9],
  [-110.3,24.1],[-111.3,26.0],[-112.3,27.3],
  [-113.3,28.0],[-113.5,29.0],[-114.9,31.0],[-115.5,32.7],
];

export const GEO_ZONAS = [
  { n: 'CDMX y area metropolitana', lat: 19.4,  lng: -99.1  },
  { n: 'Guadalajara, Jalisco',       lat: 20.7,  lng: -103.4 },
  { n: 'Monterrey, Nuevo Leon',      lat: 25.7,  lng: -100.3 },
  { n: 'Tijuana, Baja California',   lat: 32.5,  lng: -117.0 },
  { n: 'Merida, Yucatan',            lat: 21.0,  lng: -89.6  },
  { n: 'Puebla, Puebla',             lat: 19.0,  lng: -98.2  },
  { n: 'Cancun, Quintana Roo',       lat: 21.2,  lng: -86.9  },
  { n: 'Leon, Guanajuato',           lat: 21.1,  lng: -101.7 },
  { n: 'Toluca, Edo. de Mexico',     lat: 19.3,  lng: -99.7  },
  { n: 'Torreon, Coahuila',          lat: 25.5,  lng: -103.5 },
  { n: 'San Luis Potosi',            lat: 22.2,  lng: -101.0 },
  { n: 'Queretaro',                  lat: 20.6,  lng: -100.4 },
  { n: 'Chihuahua, Chihuahua',       lat: 28.6,  lng: -106.1 },
  { n: 'Hermosillo, Sonora',         lat: 29.1,  lng: -111.0 },
  { n: 'Saltillo, Coahuila',         lat: 25.4,  lng: -101.0 },
  { n: 'Mexicali, Baja California',  lat: 32.7,  lng: -115.5 },
  { n: 'Culiacan, Sinaloa',          lat: 24.8,  lng: -107.4 },
  { n: 'Acapulco, Guerrero',         lat: 16.9,  lng: -99.9  },
  { n: 'Veracruz, Veracruz',         lat: 19.2,  lng: -96.1  },
  { n: 'Aguascalientes',             lat: 21.9,  lng: -102.3 },
  { n: 'Morelia, Michoacan',         lat: 19.7,  lng: -101.2 },
  { n: 'Tampico, Tamaulipas',        lat: 22.3,  lng: -97.9  },
  { n: 'Mazatlan, Sinaloa',          lat: 23.2,  lng: -106.4 },
  { n: 'Durango, Durango',           lat: 24.0,  lng: -104.7 },
  { n: 'Oaxaca, Oaxaca',             lat: 17.1,  lng: -96.7  },
  { n: 'Tuxtla Gutierrez, Chiapas',  lat: 16.8,  lng: -93.1  },
  { n: 'Ciudad Juarez, Chihuahua',   lat: 31.7,  lng: -106.5 },
  { n: 'Nuevo Laredo, Tamaulipas',   lat: 27.5,  lng: -99.5  },
  { n: 'Matamoros, Tamaulipas',      lat: 25.9,  lng: -97.5  },
  { n: 'Reynosa, Tamaulipas',        lat: 26.1,  lng: -98.3  },
  { n: 'Ensenada, Baja California',  lat: 31.9,  lng: -116.6 },
  { n: 'Villahermosa, Tabasco',      lat: 18.0,  lng: -92.9  },
  { n: 'Campeche, Campeche',         lat: 19.9,  lng: -90.5  },
  { n: 'Tepic, Nayarit',             lat: 21.5,  lng: -104.9 },
  { n: 'Zacatecas, Zacatecas',       lat: 22.8,  lng: -102.6 },
];

export const CIUDADES_REF = [
  { nombre: 'CDMX', lat: 19.43, lng: -99.13  },
  { nombre: 'GDL',  lat: 20.67, lng: -103.35 },
  { nombre: 'MTY',  lat: 25.67, lng: -100.32 },
  { nombre: 'TIJ',  lat: 32.53, lng: -117.0  },
  { nombre: 'MER',  lat: 20.97, lng: -89.62  },
];

export const REC_CANAL: Record<string, string[]> = {
  App:        ['Activa autenticacion biometrica en la app', 'Evita usar WiFi publico para transacciones', 'Revisa permisos de la app regularmente'],
  Cajero:     ['Cubre el teclado al ingresar tu NIP', 'Prefiere cajeros dentro de sucursales bancarias', 'Revisa que no haya dispositivos extraños en el lector'],
  POS:        ['Nunca pierdas de vista tu tarjeta al pagar', 'Verifica el monto antes de confirmar', 'Activa alertas de cargo en tiempo real'],
  Web:        ['Verifica que la URL empiece con https://', 'Usa tarjetas virtuales para compras en linea', 'No guardes datos de tarjeta en sitios desconocidos'],
  Ventanilla: ['Solicita identificacion al ejecutivo', 'Conserva todos tus comprobantes de operacion', 'No proporciones datos fuera de ventanilla oficial'],
};