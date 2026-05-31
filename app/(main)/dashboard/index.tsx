import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StatusBar, ActivityIndicator, Alert, Modal,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/src/store/auth.store';
import { dashboardService } from '@/src/features/dashboard/dashboard.service';
import { ComerciosModal } from '@/src/features/dashboard/components/ComerciosModal';

// ── Exportación ──────────────────────────────────────────────────────────────
import {
  exportKpi,
  exportFullReport,
  type DashboardExportData,
} from '@/src/features/dashboard/helpers/export.service';

// ── Tipos ────────────────────────────────────────────────────────────────────
import type {
  FraudePorMes, Solucion,
  PrestamosPorTipo, SaldoPorTipoCuenta,
  ScoreCrediticio, CobrosExcedidos,
  FraudeGeo, FraudeComercio,
} from '@/src/features/dashboard/types';

// ── Componentes ──────────────────────────────────────────────────────────────
import { SkeletonCard }         from '@/src/features/dashboard/components/SkeletonCard';
import { DonutChart }           from '@/src/features/dashboard/components/DonutChart';
import type { Segment }         from '@/src/features/dashboard/components/DonutChart';
import { AnimatedBarChart }     from '@/src/features/dashboard/components/AnimatedBarChart';
import { InteractiveLineChart } from '@/src/features/dashboard/components/InteractiveLineChart';
import { RiskIndicator }        from '@/src/features/dashboard/components/RiskIndicator';
import { DebCard }              from '@/src/features/dashboard/components/DebCard';
import { ObjetivoCard }         from '@/src/features/dashboard/components/ObjetivoCard';
import { FraudeMapView }        from '@/src/features/dashboard/components/FraudeMapView';
import { ComercioCard }         from '@/src/features/dashboard/components/ComercioCard';

// ── Constantes ───────────────────────────────────────────────────────────────
import { PALETTE, CANAL_COLORS, AREA_ICONS, PRIORIDAD_COLOR } from '@/src/features/dashboard/constants/colores';
import { UMBRALES, OBJ_CONFIG }                                from '@/src/features/dashboard/constants/umbrales';

// ── Helpers ──────────────────────────────────────────────────────────────────
import { fmt, fmtMXN, fmtMesLargo, calcTrimestre } from '@/src/features/dashboard/helpers/format';

// ── Estilos ──────────────────────────────────────────────────────────────────
import { s } from '@/src/features/dashboard/styles/styles';

const STALE = 5 * 60 * 1000;

// ── Botón de exportación reutilizable ────────────────────────────────────────
function ExportBtn({
  id, exportingKpi, exportingAll, onPress,
}: {
  id: string;
  exportingKpi: string | null;
  exportingAll: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={s.kpiExportBtn}
      onPress={onPress}
      disabled={exportingKpi !== null || exportingAll}
    >
      {exportingKpi === id
        ? <ActivityIndicator size="small" color="#004481" />
        : <Ionicons name="download-outline" size={16} color="#004481" />}
    </TouchableOpacity>
  );
}

export default function Dashboard() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const lock   = useAuthStore((s) => s.lock);
  const logout = useAuthStore((s) => s.logout);

  // ── UI state ─────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab]     = useState<'Inicio' | 'KPIs' | 'Debilidades' | 'Objetivos'>('Inicio');
  const [hideAmounts, setHideAmounts] = useState(false);
  const [refreshing, setRefreshing]   = useState(false);
  const [lastUpdate, setLastUpdate]   = useState(
    new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
  );
  const [expandedDebId,      setExpandedDebId]      = useState<number | null>(null);
  const [expandedComercioId, setExpandedComercioId] = useState<number | null>(null);
  const [expandedObjId,      setExpandedObjId]      = useState<number | null>(null);
  const [exportingKpi,       setExportingKpi]       = useState<string | null>(null);
  const [exportingAll,       setExportingAll]       = useState(false);
  const [comerciosModalVisible, setComerciosModalVisible] = useState(false);

  // ── Queries ───────────────────────────────────────────────────────────────
  const { data: kpisResumen,     refetch: rKpisResumen } = useQuery({ queryKey: ['kpis-resumen'],      queryFn: dashboardService.getKpisResumen,        staleTime: STALE });
  const { data: etlResumen,      refetch: rEtl         } = useQuery({ queryKey: ['etl-resumen'],       queryFn: dashboardService.getEtlResumen,         staleTime: STALE });
  const { data: debilidadesData, refetch: rDebilidades } = useQuery({ queryKey: ['debilidades'],       queryFn: dashboardService.getDebilidades,        staleTime: STALE });

  const { data: fraudePorCanal     = [], refetch: rCanal     } = useQuery({ queryKey: ['fraude-canal'],     queryFn: dashboardService.getFraudePorCanal,     staleTime: STALE });
  const { data: fraudePorCategoria = [], refetch: rCategoria } = useQuery({ queryKey: ['fraude-categoria'], queryFn: dashboardService.getFraudePorCategoria, staleTime: STALE });
  const { data: fraudePorMes       = [], refetch: rMes       } = useQuery({ queryKey: ['fraude-mes'],       queryFn: dashboardService.getFraudePorMes,       staleTime: STALE });

  const { data: segmentos    = [], isLoading: loadSeg,   refetch: rSeg    } = useQuery({ queryKey: ['kpis-segmentos'], queryFn: dashboardService.getClientesPorSegmento, staleTime: STALE });
  const { data: generos      = [], isLoading: loadGen,   refetch: rGen    } = useQuery({ queryKey: ['kpis-generos'],   queryFn: dashboardService.getClientesPorGenero,   staleTime: STALE });
  const { data: prestamos    = [], isLoading: loadPrest, refetch: rPrest  } = useQuery({ queryKey: ['kpis-prestamos'], queryFn: dashboardService.getPrestamosPorTipo,    staleTime: STALE });
  const { data: saldoCuentas = [], isLoading: loadSaldo, refetch: rSaldo  } = useQuery({ queryKey: ['kpis-saldo'],     queryFn: dashboardService.getSaldoPorTipoCuenta,  staleTime: STALE });
  const { data: scores       = [], isLoading: loadScore, refetch: rScores } = useQuery({ queryKey: ['kpis-scores'],    queryFn: dashboardService.getScoreCrediticio,     staleTime: STALE });
  const { data: cobrosExc    = [], isLoading: loadCob,   refetch: rCobros } = useQuery({ queryKey: ['kpis-cobros'],    queryFn: dashboardService.getCobrosExcedidos,     staleTime: STALE });
  const { data: fraudeGeo    = [], isLoading: loadGeo,   refetch: rGeo    } = useQuery({ queryKey: ['fraude-geo'],      queryFn: dashboardService.getFraudeGeografico,   staleTime: STALE });
  const { data: fraudeComercio = [], isLoading: loadCom, refetch: rCom    } = useQuery({ queryKey: ['fraude-comercio'], queryFn: dashboardService.getFraudePorComercio,  staleTime: STALE });

  const { data: pagosPorEstatus   = [], isLoading: loadPagosEst, refetch: rPagosEst  } = useQuery({ queryKey: ['kpis-pagos-estatus'],  queryFn: dashboardService.getPagosPorEstatus,          staleTime: STALE });
  const { data: pagosPorCanal     = [], isLoading: loadPagosCan, refetch: rPagosCan  } = useQuery({ queryKey: ['kpis-pagos-canal'],    queryFn: dashboardService.getPagosPorCanal,            staleTime: STALE });
  const { data: segurosPorEstatus = [], isLoading: loadSegEst,   refetch: rSegEst    } = useQuery({ queryKey: ['kpis-seguros-est'],    queryFn: dashboardService.getSegurosPorEstatus,        staleTime: STALE });
  const { data: primaAnual,            isLoading: loadPrima,     refetch: rPrima     } = useQuery({ queryKey: ['kpis-prima-anual'],    queryFn: dashboardService.getPrimaAnual,               staleTime: STALE });
  const { data: notiEstatus       = [], isLoading: loadNotiEst,  refetch: rNotiEst   } = useQuery({ queryKey: ['kpis-noti-estatus'],   queryFn: dashboardService.getNotificacionesPorEstatus, staleTime: STALE });
  const { data: notiCanal         = [], isLoading: loadNotiCan,  refetch: rNotiCan   } = useQuery({ queryKey: ['kpis-noti-canal'],     queryFn: dashboardService.getNotificacionesPorCanal,   staleTime: STALE });
  const { data: cuentasSucursal   = [], isLoading: loadSucursal, refetch: rSucursal  } = useQuery({ queryKey: ['kpis-sucursales'],     queryFn: dashboardService.getCuentasPorSucursal,       staleTime: STALE });
  const { data: nominaRes,             isLoading: loadNomina,    refetch: rNomina    } = useQuery({ queryKey: ['kpis-nomina'],         queryFn: dashboardService.getNominaResumen,            staleTime: STALE });

  const { data: utilizacionCredito  = [], isLoading: loadUtilCred,  refetch: rUtilCred  } = useQuery({ queryKey: ['kpis-util-credito'],      queryFn: dashboardService.getUtilizacionCredito,        staleTime: STALE });
  const { data: utilizacionResumen,       isLoading: loadUtilRes,   refetch: rUtilRes   } = useQuery({ queryKey: ['kpis-util-credito-res'],  queryFn: dashboardService.getUtilizacionCreditoResumen, staleTime: STALE });
  const { data: morosidadTarjetas   = [], isLoading: loadMorosidad, refetch: rMorosidad } = useQuery({ queryKey: ['kpis-morosidad'],         queryFn: dashboardService.getMorosidadTarjetas,          staleTime: STALE });
  const { data: morosidadResumen,         isLoading: loadMorRes,    refetch: rMorRes    } = useQuery({ queryKey: ['kpis-morosidad-res'],     queryFn: dashboardService.getMorosidadTarjetasResumen,  staleTime: STALE });
  const { data: tasasInteres        = [], isLoading: loadTasas,     refetch: rTasas     } = useQuery({ queryKey: ['kpis-tasas'],             queryFn: dashboardService.getTasaInteresPrestamos,       staleTime: STALE });
  const { data: metasEstatus        = [], isLoading: loadMetasEst,  refetch: rMetasEst  } = useQuery({ queryKey: ['kpis-metas-estatus'],     queryFn: dashboardService.getMetasAhorroPorEstatus,     staleTime: STALE });
  const { data: metasProgreso,            isLoading: loadMetasProg, refetch: rMetasProg } = useQuery({ queryKey: ['kpis-metas-progreso'],    queryFn: dashboardService.getMetasAhorroProgreso,       staleTime: STALE });

  // ── Pull-to-refresh ───────────────────────────────────────────────────────
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      rKpisResumen(), rEtl(), rDebilidades(),
      rCanal(), rCategoria(), rMes(),
      rSeg(), rGen(), rPrest(), rSaldo(), rScores(), rCobros(),
      rGeo(), rCom(),
      rPagosEst(), rPagosCan(), rSegEst(), rPrima(),
      rNotiEst(), rNotiCan(), rSucursal(), rNomina(),
      rUtilCred(), rUtilRes(), rMorosidad(), rMorRes(),
      rTasas(), rMetasEst(), rMetasProg(),
    ]);
    setLastUpdate(new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }));
    setRefreshing(false);
  }, []);

  // ── Datos derivados ───────────────────────────────────────────────────────
  const donutFraude: Segment[] = fraudePorCanal.map(d => ({
    percentage: Math.round(d.porcentaje * 10) / 10,
    color: CANAL_COLORS[d.canal] ?? '#737781',
    label: d.canal,
  }));

  const totalSeg = segmentos.reduce((a, s) => a + s.total, 0);
  const donutSeg: Segment[] = segmentos.map((s, i) => ({
    label: s.segmento,
    percentage: totalSeg > 0 ? Math.round((s.total / totalSeg) * 1000) / 10 : 0,
    color: PALETTE[i % PALETTE.length],
  }));

  const totalGen = generos.reduce((a, g) => a + g.total, 0);
  const donutGen: Segment[] = generos.map((g, i) => ({
    label: g.genero,
    percentage: totalGen > 0 ? Math.round((g.total / totalGen) * 1000) / 10 : 0,
    color: ['#004481', '#48A9E6'][i % 2],
  }));

  const catSlice  = fraudePorCategoria.slice(0, 8);
  const catMax    = catSlice.length ? catSlice.reduce((m, d) => d.total_fraudes > m.total_fraudes ? d : m) : null;
  const catMaxIdx = catMax ? catSlice.findIndex(d => d.categoria === catMax.categoria) : -1;

  const soluciones  = debilidadesData?.soluciones ?? [];
  const indicadores = debilidadesData?.debilidades;
  const altaCount   = soluciones.filter((s: Solucion) => s.prioridad === 'Alta').length;
  const indMap      = indicadores as Record<string, number> | undefined;
  const trimestre   = calcTrimestre();

  // ── Conclusiones ──────────────────────────────────────────────────────────
  const _fraudesMeta = (() => {
    if (fraudePorMes.length < 3) return null;
    const pico   = fraudePorMes.reduce((m, d) => d.total_fraudes > m.total_fraudes ? d : m);
    const tercio = Math.max(1, Math.floor(fraudePorMes.length / 3));
    const avgIni = fraudePorMes.slice(0, tercio).reduce((s, d) => s + d.total_fraudes, 0) / tercio;
    const avgFin = fraudePorMes.slice(-tercio).reduce((s, d) => s + d.total_fraudes, 0) / tercio;
    const isAlza = avgFin > avgIni;
    return {
      isAlza,
      texto: isAlza
        ? `Los fraudes están en aumento. ${fmtMesLargo(pico.año_mes)} fue el mes más crítico, lo que indica que los controles actuales no son suficientes.`
        : `La tendencia de fraudes muestra mejoría. ${fmtMesLargo(pico.año_mes)} fue el mes más crítico, pero los niveles recientes son más bajos.`,
    };
  })();
  const conclusionFraudes      = _fraudesMeta?.texto ?? null;
  const conclusionFraudesAlert = _fraudesMeta?.isAlza ?? false;

  const conclusionCat = (() => {
    if (!catMax) return null;
    const catMin = catSlice.length ? catSlice.reduce((m, d) => d.total_fraudes < m.total_fraudes ? d : m) : null;
    if (!catMin || catMax.categoria === catMin.categoria) return null;
    const diff = (catMax.total_fraudes - catMin.total_fraudes) / catMax.total_fraudes;
    return diff > 0.15
      ? `${catMax.categoria} concentra notablemente más fraude. Focalizar los controles aquí tendría el mayor impacto.`
      : `El fraude está distribuido similarmente. ${catMax.categoria} encabeza y merece monitoreo prioritario.`;
  })();

  const conclusionPrest = (() => {
    if (!prestamos.length) return null;
    const prestMax = prestamos.reduce((m: PrestamosPorTipo, d: PrestamosPorTipo) => d.total > m.total ? d : m);
    const prestMin = prestamos.reduce((m: PrestamosPorTipo, d: PrestamosPorTipo) => d.total < m.total ? d : m);
    return prestMax.tipo !== prestMin.tipo
      ? `Los préstamos ${prestMax.tipo.toLowerCase()} son los más solicitados y representan la mayor exposición crediticia.`
      : null;
  })();

  const _scoreAlert = (() => {
    if (!scores.length) return false;
    const scoreMax = scores.reduce((m: ScoreCrediticio, d: ScoreCrediticio) => d.total > m.total ? d : m);
    const firstNum = parseInt(scoreMax.rango.split(/[-\s]/)[0], 10);
    return !isNaN(firstNum) && firstNum < 600;
  })();

  const conclusionScore = (() => {
    if (!scores.length) return null;
    const scoreMax = scores.reduce((m: ScoreCrediticio, d: ScoreCrediticio) => d.total > m.total ? d : m);
    const scoreMin = scores.reduce((m: ScoreCrediticio, d: ScoreCrediticio) => d.total < m.total ? d : m);
    if (scoreMax.rango === scoreMin.rango) return null;
    const firstNum = parseInt(scoreMax.rango.split(/[-\s]/)[0], 10);
    if (!isNaN(firstNum) && firstNum >= 600)
      return 'La mayoría de clientes presenta un perfil crediticio saludable, dando margen para ampliar la oferta de crédito.';
    if (!isNaN(firstNum) && firstNum < 600)
      return 'El segmento más numeroso muestra un score que requiere atención. Reforzar el análisis crediticio en nuevas solicitudes.';
    return `El rango ${scoreMax.rango} agrupa al mayor número de clientes.`;
  })();

  const conclusionUtilizacion = (() => {
    if (!utilizacionResumen) return null;
    const pct = utilizacionResumen.utilizacion_global;
    if (pct > 70) return `Utilización global del ${pct.toFixed(1)}%, por encima del 70%. Riesgo elevado; revisar límites y alertas preventivas.`;
    if (pct > 50) return `Utilización del ${pct.toFixed(1)}%. Nivel moderado; monitorear clientes con uso superior al 80%.`;
    return `Utilización promedio del ${pct.toFixed(1)}%. Cartera de tarjetas con capacidad crediticia saludable.`;
  })();
  const esAlertaUtilizacion = (utilizacionResumen?.utilizacion_global ?? 0) > 70;

  const conclusionMorosidad = (() => {
    if (!morosidadResumen) return null;
    const pct = morosidadResumen.tasa_morosidad;
    if (pct > 40) return `El ${pct.toFixed(1)}% de las tarjetas están bloqueadas. Nivel crítico; activar estrategias de recuperación.`;
    if (pct > 30) return `El ${pct.toFixed(1)}% de las tarjetas activas están bloqueadas. Campaña de regularización recomendada.`;
    return `El ${pct.toFixed(1)}% de las tarjetas están bloqueadas por impago. Las tarjetas activas operan con normalidad.`;
  })();
  const esAlertaMorosidad = (morosidadResumen?.tasa_morosidad ?? 0) > 30;

  const conclusionTasas = (() => {
    if (!tasasInteres.length) return null;
    const maxTasa = tasasInteres.reduce((m, t) => t.tasa_promedio > m.tasa_promedio ? t : m);
    const minTasa = tasasInteres.reduce((m, t) => t.tasa_promedio < m.tasa_promedio ? t : m);
    if (maxTasa.tipo_prestamo === minTasa.tipo_prestamo) return null;
    const diff = maxTasa.tasa_promedio - minTasa.tasa_promedio;
    return diff > 5
      ? `${maxTasa.tipo_prestamo} tiene la tasa más alta (${maxTasa.tasa_promedio.toFixed(1)}%) y ${minTasa.tipo_prestamo} la más baja (${minTasa.tasa_promedio.toFixed(1)}%). Revisar pricing.`
      : `Las tasas están relativamente niveladas. ${maxTasa.tipo_prestamo} lidera en costo (${maxTasa.tasa_promedio.toFixed(1)}%).`;
  })();

  const conclusionMetas = (() => {
    const completadas = metasEstatus.find(m => m.estatus?.toLowerCase().includes('complet'));
    const fallidas    = metasEstatus.find(m => m.estatus?.toLowerCase().includes('fall'));
    if (!completadas) return null;
    if (fallidas && fallidas.porcentaje > completadas.porcentaje)
      return `Las metas fallidas (${fallidas.porcentaje.toFixed(1)}%) superan a las completadas (${completadas.porcentaje.toFixed(1)}%). Revisar montos objetivo.`;
    return `El ${completadas.porcentaje.toFixed(1)}% de las metas fueron completadas exitosamente.`;
  })();
  const esAlertaMetas = (() => {
    const completadas = metasEstatus.find(m => m.estatus?.toLowerCase().includes('complet'));
    const fallidas    = metasEstatus.find(m => m.estatus?.toLowerCase().includes('fall'));
    return !!(fallidas && completadas && fallidas.porcentaje > completadas.porcentaje);
  })();

  // ── Estado global ─────────────────────────────────────────────────────────
  const estadoGlobal = (() => {
    if (!indicadores) return null;
    const lista = [
      { label: 'Préstamos Vencidos',      valor: indicadores.porcentajePrestamosVencidos, umbral: UMBRALES.porcentajePrestamosVencidos },
      { label: 'Fraude Potencial',         valor: indicadores.porcentajeFraudePotencial,   umbral: UMBRALES.porcentajeFraudePotencial   },
      { label: 'Cobros Excedidos',         valor: indicadores.porcentajeCobrosExcedidos,   umbral: UMBRALES.porcentajeCobrosExcedidos   },
      { label: 'Cuentas Canceladas',       valor: indicadores.porcentajeCuentasCanceladas, umbral: UMBRALES.porcentajeCuentasCanceladas },
      { label: 'Metas de Ahorro Fallidas', valor: indicadores.porcentajeMetasFallidas,     umbral: UMBRALES.porcentajeMetasFallidas     },
    ];
    const enRiesgo   = lista.filter(i => i.valor > i.umbral);
    const enAtencion = lista.filter(i => i.valor > i.umbral * 0.8 && i.valor <= i.umbral);
    if (enRiesgo.length > 0) {
      const peor = enRiesgo.reduce((m, i) => (i.valor / i.umbral) > (m.valor / m.umbral) ? i : m);
      return { estado: 'CRITICO' as const, count: enRiesgo.length, peor };
    }
    if (enAtencion.length > 0) {
      const cercano = enAtencion.reduce((m, i) => (i.valor / i.umbral) > (m.valor / m.umbral) ? i : m);
      return { estado: 'ATENCION' as const, count: enAtencion.length, peor: cercano };
    }
    return { estado: 'NORMAL' as const, count: 0, peor: null };
  })();

  // ── Objetivos generados ───────────────────────────────────────────────────
  const objetivosGenerados = indMap
    ? Object.entries(OBJ_CONFIG)
        .filter(([clave, cfg]) => (indMap[clave] ?? 0) > cfg.umbral)
        .map(([clave, cfg]) => {
          const valorActual = indMap[clave] ?? 0;
          const progress    = Math.round((cfg.meta / valorActual) * 100);
          return {
            ...cfg, valorActual, valorMeta: cfg.meta,
            estado: (progress > 70 ? 'En progreso' : 'Pendiente') as 'Pendiente' | 'En progreso',
          };
        })
        .sort((a, b) => ({ Alta: 0, Media: 1, Baja: 2 }[a.prioridad] - { Alta: 0, Media: 1, Baja: 2 }[b.prioridad]))
    : [];

  // ── Datos para exportación ────────────────────────────────────────────────
  const exportData: DashboardExportData = {
    kpisResumen, etlResumen,
    fraudePorMes, fraudePorCanal, fraudePorCategoria, fraudeGeo, fraudeComercio,
    segmentos, generos,
    saldoCuentas, prestamos, cobrosExc, scores,
    utilizacionCredito, utilizacionResumen, morosidadTarjetas, morosidadResumen, tasasInteres,
    metasEstatus, metasProgreso,
    pagosPorEstatus, pagosPorCanal,
    segurosPorEstatus, primaAnual,
    notiEstatus, notiCanal,
    cuentasSucursal, nominaRes,
    debilidadesData, soluciones,
    indicadores: indMap,
  };

  // ── Handlers de exportación ───────────────────────────────────────────────
  const handleExportKpi = async (id: string) => {
    setExportingKpi(id);
    try {
      await exportKpi(id, exportData);
    } catch (err: any) {
      Alert.alert('Error', err?.message ?? 'No se pudo generar el PDF.');
    } finally {
      setExportingKpi(null);
    }
  };

  const handleExportAll = async () => {
    if (!etlResumen) {
      Alert.alert('Espera', 'El resumen ETL aún está cargando. Intenta en unos segundos.');
      return;
    }
    setExportingAll(true);
    try {
      await exportFullReport(exportData);
    } catch (err: any) {
      Alert.alert('Error', err?.message ?? 'No se pudo generar el reporte.');
    } finally {
      setExportingAll(false);
    }
  };

  // ── Auth / Lock ───────────────────────────────────────────────────────────
  const isLocked = useAuthStore((st) => st.isLocked);

  const handleLock = () => lock();
  const handleLogout = async () => {
    await logout();
    router.replace('/(auth)/welcome');
  };
  const handlePressLogout = () => {
    Alert.alert('Cerrar sesión', '¿Qué deseas hacer?', [
      { text: 'Bloquear pantalla',     onPress: handleLock },
      { text: 'Cerrar sesión completa', style: 'destructive', onPress: handleLogout },
      { text: 'Cancelar',              style: 'cancel' },
    ]);
  };

  useEffect(() => {
    if (isLocked) router.replace('/(auth)/login');
  }, [isLocked]);

  const val = (v: string | number | undefined) => v !== undefined ? String(v) : '...';

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <View style={[s.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {/* ── Header ── */}
      <View style={s.header}>
        <TouchableOpacity style={s.headerBtn} onPress={() => setHideAmounts(!hideAmounts)}>
          <Ionicons name={hideAmounts ? 'eye-off-outline' : 'eye-outline'} size={24} color="#004481" />
        </TouchableOpacity>
        <View style={{ alignItems: 'center' }}>
          <Text style={s.headerTitle}>BBVA</Text>
          <Text style={s.headerTimestamp}>Act. {lastUpdate}</Text>
        </View>
        <TouchableOpacity style={s.headerBtn} onPress={handlePressLogout}>
          <Ionicons name="log-out-outline" size={24} color="#004481" />
        </TouchableOpacity>
      </View>

      <View style={{ flex: 1 }}>

        {/* ══ INICIO ══════════════════════════════════════════════════════════ */}
        {activeTab === 'Inicio' && (
          <ScrollView style={s.scrollBody} contentContainerStyle={s.scrollContent}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#004481']} tintColor="#004481" />}>

            <View style={s.bannerCard}>
              <Text style={s.bannerTitle}>Hola, Admin</Text>
              <Text style={s.bannerSub}>Panel de análisis BBVA</Text>
            </View>

            {estadoGlobal && (() => {
              const isCritico  = estadoGlobal.estado === 'CRITICO';
              const isAtencion = estadoGlobal.estado === 'ATENCION';
              const color   = isCritico ? '#c0392b' : isAtencion ? '#e67e22' : '#27ae60';
              const bg      = isCritico ? '#fff4f4' : isAtencion ? '#fffbf0' : '#f0fff4';
              const icon    = isCritico ? 'warning-outline' : isAtencion ? 'trending-up-outline' : 'checkmark-circle-outline';
              const titulo  = isCritico
                ? `Atención requerida · ${estadoGlobal.count} indicador${estadoGlobal.count > 1 ? 'es' : ''} fuera de rango`
                : isAtencion
                  ? `Monitoreo recomendado · ${estadoGlobal.count} indicador${estadoGlobal.count > 1 ? 'es' : ''} cerca del límite`
                  : 'Operando con normalidad';
              const subtexto = estadoGlobal.peor
                ? `${estadoGlobal.peor.label} al ${estadoGlobal.peor.valor.toFixed(1)}%`
                : 'Todos los indicadores dentro del rango esperado';
              return (
                <TouchableOpacity style={[s.statusBanner, { backgroundColor: bg, borderColor: color + '40' }]}
                  onPress={() => setActiveTab('Debilidades')} activeOpacity={0.82}>
                  <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: color + '18', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Ionicons name={icon as any} size={17} color={color} />
                  </View>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={{ fontSize: 12, fontWeight: '700', color, lineHeight: 16 }}>{titulo}</Text>
                    <Text style={{ fontSize: 11, color: color + 'bb', lineHeight: 15 }}>{subtexto}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={15} color={color + '88'} />
                </TouchableOpacity>
              );
            })()}

            <Text style={s.sectionTitle}>Indicadores Generales</Text>
            <View style={s.kpiGrid}>
              {[
                { icon: 'people-outline',          label: 'Total Clientes',     val: kpisResumen && fmt(kpisResumen.totalClientes),        trend: 'up',   txt: 'Registrados'    },
                { icon: 'checkmark-circle-outline', label: 'Cuentas Activas',   val: kpisResumen && fmt(kpisResumen.cuentasActivas),       trend: 'up',   txt: 'Vigentes'       },
                { icon: 'cash-outline',             label: 'Saldo Total',       val: kpisResumen && fmtMXN(kpisResumen.saldoTotalCuentas), trend: 'up',   txt: 'Cuentas act.'   },
                { icon: 'trending-up-outline',      label: 'Transacciones Hoy', val: kpisResumen && fmt(kpisResumen.transaccionesHoy),     trend: 'up',   txt: 'Último día'     },
                { icon: 'shield-outline',           label: 'Alertas Fraude',    val: kpisResumen && fmt(kpisResumen.fraudesPotenciales),   trend: 'down', txt: 'Potenciales'    },
                { icon: 'alert-circle-outline',     label: 'Cobros Excedidos',  val: kpisResumen && fmt(kpisResumen.cobrosExcedidos),      trend: 'warn', txt: 'Exceden límite' },
              ].map((kpi, i) => {
                const tc = kpi.trend === 'up' ? '#00a278' : kpi.trend === 'down' ? '#ba1a1a' : '#fbbd08';
                const ti = kpi.trend === 'up' ? 'trending-up' : kpi.trend === 'down' ? 'trending-down' : 'alert-circle-outline';
                return (
                  <View key={i} style={s.kpiCard}>
                    <View style={s.kpiHeaderRow}>
                      <View style={s.iconWrapper}>
                        <Ionicons name={kpi.icon as any} size={18} color="#004481" />
                      </View>
                    </View>
                    <Text style={s.kpiValue}>{hideAmounts ? '•••••' : val(kpi.val ?? undefined)}</Text>
                    <Text style={s.kpiLabel}>{kpi.label}</Text>
                    <View style={s.trendRow}>
                      <Ionicons name={ti as any} size={12} color={tc} />
                      <Text style={[s.trendText, { color: tc }]}>{kpi.txt}</Text>
                    </View>
                  </View>
                );
              })}
            </View>

            <Text style={s.sectionTitle}>Análisis rápido</Text>
            <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false}
              style={s.carousel} contentContainerStyle={{ paddingRight: 20 }}>
              <View style={s.carouselCard}>
                <Text style={s.carouselTitle}>Fraude por canal</Text>
                <Text style={s.carouselSub}>Distribución porcentual</Text>
                {donutFraude.length > 0 ? <DonutChart segments={donutFraude} /> : <ActivityIndicator color="#004481" style={{ marginVertical: 30 }} />}
              </View>
              <View style={s.carouselCard}>
                <Text style={s.carouselTitle}>Top Categorías</Text>
                <Text style={s.carouselSub}>Mayor número de fraudes</Text>
                {fraudePorCategoria.length > 0
                  ? <AnimatedBarChart
                      data={fraudePorCategoria.slice(0, 3).map(d => ({ label: d.categoria, value: d.total_fraudes }))}
                      colorFn={(i) => ['#ba1a1a', '#fbbd08', '#00a86b'][i]}
                      valueFormatter={(v) => hideAmounts ? '••••' : fmt(v)}
                    />
                  : <ActivityIndicator color="#004481" style={{ marginVertical: 20 }} />}
              </View>
              <View style={s.carouselCard}>
                <Text style={s.carouselTitle}>Pipeline ETL</Text>
                <Text style={s.carouselSub}>Resumen de análisis de fraude</Text>
                {etlResumen ? (
                  <View style={{ gap: 8, marginTop: 4 }}>
                    {[
                      { label: 'Txs analizadas', val: fmt(etlResumen.total_transacciones) },
                      { label: 'Fraudes',         val: fmt(etlResumen.total_fraudes) },
                      { label: 'Tasa de fraude',  val: `${etlResumen.tasa_fraude_pct?.toFixed(2)}%` },
                      { label: 'Monto en riesgo', val: hideAmounts ? '•••••' : fmtMXN(etlResumen.monto_total_fraude) },
                    ].map((row, i) => (
                      <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#f0f2f5', paddingBottom: 6 }}>
                        <Text style={{ fontSize: 12, color: '#5d5f5f' }}>{row.label}</Text>
                        <Text style={{ fontSize: 12, fontWeight: '700', color: '#1a1c1c' }}>{row.val}</Text>
                      </View>
                    ))}
                  </View>
                ) : <ActivityIndicator color="#004481" style={{ marginVertical: 20 }} />}
              </View>
            </ScrollView>

            <Text style={s.sectionTitle}>Alertas de riesgo</Text>
            {soluciones.slice(0, 2).map((sol: Solucion, idx: number) => (
              <View key={idx} style={s.debCard}>
                <View style={s.debIconBox}>
                  <Ionicons name={(AREA_ICONS[sol.area] ?? 'alert-circle-outline') as any} size={22} color="#ba1a1a" />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={[s.badge, { backgroundColor: PRIORIDAD_COLOR[sol.prioridad] }]}>
                    <Text style={s.badgeText}>{sol.prioridad.toUpperCase()}</Text>
                  </View>
                  <Text style={s.debTitle}>{sol.problema}</Text>
                  <Text style={s.debDesc}>{sol.solucion}</Text>
                  <TouchableOpacity style={s.solLink} onPress={() => setActiveTab('Debilidades')}>
                    <Text style={s.solLinkTxt}>Ver solución</Text>
                    <Ionicons name="chevron-forward" size={13} color="#004481" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
            {!debilidadesData && <ActivityIndicator color="#004481" style={{ marginVertical: 20 }} />}
            {debilidadesData && soluciones.length === 0 && (
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginVertical: 12 }}>
                <Ionicons name="checkmark-circle-outline" size={18} color="#00a278" />
                <Text style={{ color: '#00a278', fontWeight: '600' }}>Sin debilidades críticas detectadas</Text>
              </View>
            )}
            <View style={{ height: 40 }} />
          </ScrollView>
        )}

        {/* ══ KPIs ════════════════════════════════════════════════════════════ */}
        {activeTab === 'KPIs' && (
          <ScrollView style={s.scrollBody} contentContainerStyle={s.scrollContent}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#004481']} tintColor="#004481" />}>

            <Text style={s.tabMainTitle}>Indicadores Clave</Text>
            <Text style={s.tabSubtitle}>Toca las barras para más detalle · Desliza la línea para ver valores</Text>

            {/* ── TRANSACCIONES ── */}
            <Text style={s.sectionHeader}>TRANSACCIONES</Text>

            <View style={s.kpiDetailCard}>
              <View style={s.kpiCardHdr}>
                <View style={{ flex: 1 }}>
                  <Text style={s.cardTitle}>Tendencia mensual de fraudes</Text>
                  <Text style={s.cardSubtitle}>{fraudePorMes.length} meses</Text>
                </View>
                <ExportBtn id="fraude-tendencia" exportingKpi={exportingKpi} exportingAll={exportingAll} onPress={() => handleExportKpi('fraude-tendencia')} />
              </View>
              {fraudePorMes.length > 0
                ? <InteractiveLineChart
                    data={fraudePorMes.map((d: FraudePorMes) => ({ label: d.año_mes.substring(5), tooltip: fmtMesLargo(d.año_mes), value: d.total_fraudes }))}
                    color="#ba1a1a" valueFormatter={(v) => `${fmt(v)} alertas`}
                  />
                : <SkeletonCard height={160} lines={2} />}
              {conclusionFraudes && (
                <View style={[s.conclusionBox, conclusionFraudesAlert && s.conclusionBoxAlert]}>
                  <Ionicons name={conclusionFraudesAlert ? 'warning-outline' : 'bulb-outline'} size={15}
                    color={conclusionFraudesAlert ? '#ba1a1a' : '#004481'} style={{ flexShrink: 0, marginTop: 1 }} />
                  <Text style={s.conclusionTxt}>{conclusionFraudes}</Text>
                </View>
              )}
            </View>

            <View style={s.kpiDetailCard}>
              <View style={s.kpiCardHdr}>
                <View style={{ flex: 1 }}>
                  <Text style={s.cardTitle}>Fraude por categoría</Text>
                  <Text style={s.cardSubtitle}>Barra roja = categoría más afectada</Text>
                </View>
                <ExportBtn id="fraude-categoria" exportingKpi={exportingKpi} exportingAll={exportingAll} onPress={() => handleExportKpi('fraude-categoria')} />
              </View>
              {catSlice.length > 0 ? <>
                <AnimatedBarChart
                  data={catSlice.map(d => ({ label: d.categoria, value: d.total_fraudes }))}
                  colorFn={(i) => i === catMaxIdx ? '#ba1a1a' : '#1973B8'} valueFormatter={fmt}
                />
                {conclusionCat && (
                  <View style={[s.conclusionBox, s.conclusionBoxAlert]}>
                    <Ionicons name="warning-outline" size={15} color="#ba1a1a" style={{ flexShrink: 0, marginTop: 1 }} />
                    <Text style={s.conclusionTxt}>{conclusionCat}</Text>
                  </View>
                )}
              </> : <SkeletonCard lines={5} />}
            </View>

            {/* ── ETL ── */}
            <Text style={s.sectionHeader}>ETL PIPELINE</Text>
            <View style={s.kpiDetailCard}>
              <View style={s.kpiCardHdr}>
                <Text style={[s.cardTitle, { flex: 1 }]}>Resumen análisis de fraude</Text>
                <ExportBtn id="etl" exportingKpi={exportingKpi} exportingAll={exportingAll} onPress={() => handleExportKpi('etl')} />
              </View>
              {etlResumen ? (
                <View style={{ gap: 10, marginTop: 8 }}>
                  {[
                    { label: 'Transacciones analizadas', val: fmt(etlResumen.total_transacciones) },
                    { label: 'Fraudes detectados',        val: fmt(etlResumen.total_fraudes) },
                    { label: 'Tasa de fraude',            val: `${etlResumen.tasa_fraude_pct?.toFixed(2)}%` },
                    { label: 'Monto total en riesgo',     val: fmtMXN(etlResumen.monto_total_fraude) },
                    { label: 'Monto promedio/fraude',     val: fmtMXN(etlResumen.monto_promedio_fraude) },
                    { label: 'Monto máximo',              val: fmtMXN(etlResumen.monto_maximo_fraude) },
                  ].map((row, i) => (
                    <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#f0f2f5', paddingBottom: 8 }}>
                      <Text style={{ fontSize: 13, color: '#5d5f5f', flex: 1 }}>{row.label}</Text>
                      <Text style={{ fontSize: 13, fontWeight: '700', color: '#1a1c1c' }}>
                        {hideAmounts && row.label.includes('onto') ? '•••••' : row.val}
                      </Text>
                    </View>
                  ))}
                </View>
              ) : <SkeletonCard lines={5} />}
            </View>

            {/* ── CLIENTES ── */}
            <Text style={s.sectionHeader}>CLIENTES</Text>
            <View style={s.sideBySideRow}>
              <View style={s.halfCard}>
                <View style={s.kpiCardHdr}>
                  <Text style={[s.halfCardTitle, { flex: 1 }]}>Por segmento</Text>
                  <ExportBtn id="clientes-segmento" exportingKpi={exportingKpi} exportingAll={exportingAll} onPress={() => handleExportKpi('clientes-segmento')} />
                </View>
                {loadSeg ? <ActivityIndicator color="#004481" style={{ marginVertical: 20 }} /> : <DonutChart segments={donutSeg} size="small" />}
              </View>
              <View style={s.halfCard}>
                <View style={s.kpiCardHdr}>
                  <Text style={[s.halfCardTitle, { flex: 1 }]}>Por género</Text>
                  <ExportBtn id="clientes-genero" exportingKpi={exportingKpi} exportingAll={exportingAll} onPress={() => handleExportKpi('clientes-genero')} />
                </View>
                {loadGen ? <ActivityIndicator color="#004481" style={{ marginVertical: 20 }} /> : <DonutChart segments={donutGen} size="small" />}
              </View>
            </View>

            {/* ── PRÉSTAMOS ── */}
            <Text style={s.sectionHeader}>PRÉSTAMOS</Text>
            <View style={s.kpiDetailCard}>
              <View style={s.kpiCardHdr}>
                <View style={{ flex: 1 }}>
                  <Text style={s.cardTitle}>Préstamos por tipo</Text>
                  <Text style={s.cardSubtitle}>Toca para ver detalle</Text>
                </View>
                <ExportBtn id="prestamos" exportingKpi={exportingKpi} exportingAll={exportingAll} onPress={() => handleExportKpi('prestamos')} />
              </View>
              {loadPrest ? <SkeletonCard lines={4} /> : <>
                <AnimatedBarChart data={prestamos.map((p: PrestamosPorTipo) => ({ label: p.tipo, value: p.total }))}
                  colorFn={(i) => PALETTE[i % PALETTE.length]} valueFormatter={fmt} />
                {conclusionPrest && (
                  <View style={s.conclusionBox}>
                    <Ionicons name="bulb-outline" size={15} color="#004481" style={{ flexShrink: 0, marginTop: 1 }} />
                    <Text style={s.conclusionTxt}>{conclusionPrest}</Text>
                  </View>
                )}
              </>}
            </View>

            {/* ── CUENTAS ── */}
            <Text style={s.sectionHeader}>CUENTAS</Text>
            <View style={s.kpiDetailCard}>
              <View style={s.kpiCardHdr}>
                <Text style={[s.cardTitle, { flex: 1 }]}>Saldo por tipo de cuenta</Text>
                <ExportBtn id="saldo-cuentas" exportingKpi={exportingKpi} exportingAll={exportingAll} onPress={() => handleExportKpi('saldo-cuentas')} />
              </View>
              {loadSaldo ? <SkeletonCard lines={3} /> : <>
                <AnimatedBarChart data={saldoCuentas.map((c: SaldoPorTipoCuenta) => ({ label: c.tipo, value: Number(c.saldo_total) }))}
                  colorFn={(i) => PALETTE[i % PALETTE.length]} valueFormatter={(v) => hideAmounts ? '•••••' : fmtMXN(v)} />
              </>}
            </View>

            <View style={s.kpiDetailCard}>
              <View style={s.kpiCardHdr}>
                <Text style={[s.cardTitle, { flex: 1 }]}>Score Crediticio</Text>
                <ExportBtn id="score" exportingKpi={exportingKpi} exportingAll={exportingAll} onPress={() => handleExportKpi('score')} />
              </View>
              {loadScore ? <SkeletonCard lines={4} /> : <>
                <AnimatedBarChart data={scores.map((sc: ScoreCrediticio) => ({ label: sc.rango, value: sc.total }))}
                  colorFn={(i) => ['#ba1a1a', '#fbbd08', '#1973B8', '#00a278'][i % 4]} valueFormatter={fmt} />
                {conclusionScore && (
                  <View style={[s.conclusionBox, _scoreAlert && s.conclusionBoxAlert]}>
                    <Ionicons name={_scoreAlert ? 'warning-outline' : 'bulb-outline'} size={15}
                      color={_scoreAlert ? '#ba1a1a' : '#004481'} style={{ flexShrink: 0, marginTop: 1 }} />
                    <Text style={s.conclusionTxt}>{conclusionScore}</Text>
                  </View>
                )}
              </>}
            </View>

            {/* ── COMISIONES ── */}
            <Text style={s.sectionHeader}>COMISIONES</Text>
            <View style={s.kpiDetailCard}>
              <View style={s.kpiCardHdr}>
                <Text style={[s.cardTitle, { flex: 1 }]}>Cobros excedidos por tipo</Text>
                <ExportBtn id="cobros" exportingKpi={exportingKpi} exportingAll={exportingAll} onPress={() => handleExportKpi('cobros')} />
              </View>
              {loadCob ? <SkeletonCard lines={3} /> : cobrosExc.length > 0
                ? <AnimatedBarChart data={cobrosExc.map((c: CobrosExcedidos) => ({ label: c.tipo, value: c.total }))}
                    colorFn={() => '#ba1a1a'} valueFormatter={fmt} />
                : <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginVertical: 16 }}>
                    <Ionicons name="checkmark-circle-outline" size={16} color="#00a278" />
                    <Text style={{ color: '#00a278', fontWeight: '600' }}>Sin cobros excedidos</Text>
                  </View>}
            </View>

            {/* ── CRÉDITO — TARJETAS ── */}
            <Text style={s.sectionHeader}>CRÉDITO — TARJETAS</Text>

            <View style={s.kpiDetailCard}>
              <View style={s.kpiCardHdr}>
                <View style={{ flex: 1 }}>
                  <Text style={s.cardTitle}>Utilización promedio del crédito</Text>
                  <Text style={s.cardSubtitle}>
                    {utilizacionResumen
                      ? `${utilizacionResumen.utilizacion_global.toFixed(1)}% global · ${fmt(utilizacionResumen.total_tarjetas)} tarjetas activas`
                      : 'Cargando...'}
                  </Text>
                </View>
                <ExportBtn id="utilizacion-credito" exportingKpi={exportingKpi} exportingAll={exportingAll} onPress={() => handleExportKpi('utilizacion-credito')} />
              </View>
              {!loadUtilRes && utilizacionResumen ? (
                <View style={{ gap: 12, marginTop: 8 }}>
                  <View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                      <Text style={{ fontSize: 12, color: '#5d5f5f' }}>Uso global del límite</Text>
                      <Text style={{
                        fontSize: 14, fontWeight: '800',
                        color: utilizacionResumen.utilizacion_global > 70 ? '#ba1a1a'
                             : utilizacionResumen.utilizacion_global > 50 ? '#fbbd08' : '#00a278',
                      }}>
                        {`${utilizacionResumen.utilizacion_global.toFixed(1)}%`}
                      </Text>
                    </View>
                    <View style={{ height: 10, backgroundColor: '#e8effa', borderRadius: 5, overflow: 'hidden' }}>
                      <View style={{
                        width: `${Math.min(utilizacionResumen.utilizacion_global, 100)}%`,
                        height: '100%', borderRadius: 5,
                        backgroundColor: utilizacionResumen.utilizacion_global > 70 ? '#ba1a1a'
                                       : utilizacionResumen.utilizacion_global > 50 ? '#fbbd08' : '#00a278',
                      }} />
                    </View>
                  </View>
                  <View style={s.sideBySideRow}>
                    <View style={[s.halfCard, { alignItems: 'center' }]}>
                      <Text style={{ fontSize: 18, fontWeight: '800', color: '#004481' }}>
                        {hideAmounts ? '•••••' : fmtMXN(utilizacionResumen.saldo_total)}
                      </Text>
                      <Text style={{ fontSize: 11, color: '#737781', marginTop: 2, textAlign: 'center' }}>Saldo total usado</Text>
                    </View>
                    <View style={[s.halfCard, { alignItems: 'center' }]}>
                      <Text style={{ fontSize: 18, fontWeight: '800', color: '#00a278' }}>
                        {hideAmounts ? '•••••' : fmtMXN(utilizacionResumen.limite_total)}
                      </Text>
                      <Text style={{ fontSize: 11, color: '#737781', marginTop: 2, textAlign: 'center' }}>Límite total otorgado</Text>
                    </View>
                  </View>
                </View>
              ) : <SkeletonCard lines={2} height={80} />}
              {!loadUtilCred && utilizacionCredito.length > 0 && (
                <>
                  <Text style={[s.cardSubtitle, { marginTop: 12, marginBottom: 4 }]}>Por tipo de tarjeta</Text>
                  <AnimatedBarChart
                    data={utilizacionCredito.map(u => ({ label: u.tipo_tarjeta, value: u.utilizacion_promedio }))}
                    colorFn={(i) => {
                      const pct = utilizacionCredito[i]?.utilizacion_promedio ?? 0;
                      return pct > 70 ? '#ba1a1a' : pct > 50 ? '#fbbd08' : '#00a278';
                    }}
                    valueFormatter={(v) => `${v.toFixed(1)}%`}
                  />
                </>
              )}
              {conclusionUtilizacion && (
                <View style={[s.conclusionBox, esAlertaUtilizacion && s.conclusionBoxAlert]}>
                  <Ionicons name={esAlertaUtilizacion ? 'warning-outline' : 'bulb-outline'} size={15}
                    color={esAlertaUtilizacion ? '#ba1a1a' : '#004481'} style={{ flexShrink: 0, marginTop: 1 }} />
                  <Text style={s.conclusionTxt}>{conclusionUtilizacion}</Text>
                </View>
              )}
            </View>

            <View style={s.kpiDetailCard}>
              <View style={s.kpiCardHdr}>
                <View style={{ flex: 1 }}>
                  <Text style={s.cardTitle}>Morosidad en tarjetas de crédito</Text>
                  <Text style={s.cardSubtitle}>
                    {morosidadResumen
                      ? `${morosidadResumen.tasa_morosidad.toFixed(1)}% bloqueadas · ${fmt(morosidadResumen.total_morosas)} tarjetas`
                      : 'Cargando...'}
                  </Text>
                </View>
                <ExportBtn id="morosidad-tarjetas" exportingKpi={exportingKpi} exportingAll={exportingAll} onPress={() => handleExportKpi('morosidad-tarjetas')} />
              </View>
              {!loadMorRes && morosidadResumen && (
                <View style={s.sideBySideRow}>
                  <View style={[s.halfCard, { alignItems: 'center', backgroundColor: '#e6f7f0', borderColor: '#00a27830' }]}>
                    <Text style={{ fontSize: 22, fontWeight: '800', color: '#00a278' }}>
                      {fmt(morosidadResumen.total_activas - morosidadResumen.total_morosas)}
                    </Text>
                    <Text style={{ fontSize: 11, color: '#00a278', marginTop: 2, fontWeight: '600' }}>Al corriente</Text>
                  </View>
                  <View style={[s.halfCard, { alignItems: 'center', backgroundColor: '#fbebeb', borderColor: '#ba1a1a30' }]}>
                    <Text style={{ fontSize: 22, fontWeight: '800', color: '#ba1a1a' }}>
                      {fmt(morosidadResumen.total_morosas)}
                    </Text>
                    <Text style={{ fontSize: 11, color: '#ba1a1a', marginTop: 2, fontWeight: '600' }}>Bloqueadas</Text>
                  </View>
                </View>
              )}
              {!loadMorosidad && morosidadTarjetas.length > 0 && (
                <AnimatedBarChart
                  data={morosidadTarjetas.map(m => ({ label: m.tipo_tarjeta, value: m.tasa_morosidad }))}
                  colorFn={(i) => (morosidadTarjetas[i]?.tasa_morosidad ?? 0) > 10 ? '#ba1a1a' : (morosidadTarjetas[i]?.tasa_morosidad ?? 0) > 5 ? '#fbbd08' : '#00a278'}
                  valueFormatter={(v) => `${v.toFixed(1)}%`}
                />
              )}
              {conclusionMorosidad && (
                <View style={[s.conclusionBox, esAlertaMorosidad && s.conclusionBoxAlert]}>
                  <Ionicons name={esAlertaMorosidad ? 'warning-outline' : 'checkmark-circle-outline'} size={15}
                    color={esAlertaMorosidad ? '#ba1a1a' : '#004481'} style={{ flexShrink: 0, marginTop: 1 }} />
                  <Text style={s.conclusionTxt}>{conclusionMorosidad}</Text>
                </View>
              )}
            </View>

            {/* ── PRÉSTAMOS — PRICING ── */}
            <Text style={s.sectionHeader}>PRÉSTAMOS — PRICING</Text>
            <View style={s.kpiDetailCard}>
              <View style={s.kpiCardHdr}>
                <View style={{ flex: 1 }}>
                  <Text style={s.cardTitle}>Tasa de interés promedio por tipo</Text>
                  <Text style={s.cardSubtitle}>Solo préstamos vigentes · % anual</Text>
                </View>
                <ExportBtn id="tasas-interes" exportingKpi={exportingKpi} exportingAll={exportingAll} onPress={() => handleExportKpi('tasas-interes')} />
              </View>
              {loadTasas ? <SkeletonCard lines={4} /> : tasasInteres.length > 0 ? (
                <>
                  <View style={{ gap: 0, marginTop: 10 }}>
                    <View style={{ flexDirection: 'row', paddingBottom: 6, borderBottomWidth: 2, borderBottomColor: '#e8effa' }}>
                      <Text style={{ flex: 2, fontSize: 10, fontWeight: '700', color: '#737781' }}>TIPO</Text>
                      <Text style={{ flex: 1, fontSize: 10, fontWeight: '700', color: '#737781', textAlign: 'right' }}>PROM.</Text>
                      <Text style={{ flex: 1, fontSize: 10, fontWeight: '700', color: '#00a278', textAlign: 'right' }}>MÍN</Text>
                      <Text style={{ flex: 1, fontSize: 10, fontWeight: '700', color: '#ba1a1a', textAlign: 'right' }}>MÁX</Text>
                    </View>
                    {tasasInteres.map((t, i) => (
                      <View key={i} style={{ flexDirection: 'row', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f0f2f5', backgroundColor: i % 2 === 0 ? '#fafafa' : '#fff' }}>
                        <Text style={{ flex: 2, fontSize: 12, color: '#1a1c1c', fontWeight: '600' }} numberOfLines={1}>{t.tipo_prestamo}</Text>
                        <Text style={{ flex: 1, fontSize: 13, fontWeight: '800', color: '#004481', textAlign: 'right' }}>{`${t.tasa_promedio.toFixed(1)}%`}</Text>
                        <Text style={{ flex: 1, fontSize: 11, color: '#00a278', textAlign: 'right' }}>{`${t.tasa_minima.toFixed(1)}%`}</Text>
                        <Text style={{ flex: 1, fontSize: 11, color: '#ba1a1a', textAlign: 'right' }}>{`${t.tasa_maxima.toFixed(1)}%`}</Text>
                      </View>
                    ))}
                  </View>
                  <AnimatedBarChart
                    data={tasasInteres.map(t => ({ label: t.tipo_prestamo, value: t.tasa_promedio }))}
                    colorFn={() => '#7c3aed'}
                    valueFormatter={(v) => `${v.toFixed(1)}%`}
                  />
                  {conclusionTasas && (
                    <View style={s.conclusionBox}>
                      <Ionicons name="trending-up-outline" size={15} color="#004481" style={{ flexShrink: 0, marginTop: 1 }} />
                      <Text style={s.conclusionTxt}>{conclusionTasas}</Text>
                    </View>
                  )}
                </>
              ) : <SkeletonCard lines={4} />}
            </View>

            {/* ── METAS DE AHORRO ── */}
            <Text style={s.sectionHeader}>METAS DE AHORRO</Text>
            <View style={s.kpiDetailCard}>
              <View style={s.kpiCardHdr}>
                <View style={{ flex: 1 }}>
                  <Text style={s.cardTitle}>Distribución de metas por estatus</Text>
                  <Text style={s.cardSubtitle}>Completadas, activas, fallidas y canceladas</Text>
                </View>
                <ExportBtn id="metas-estatus" exportingKpi={exportingKpi} exportingAll={exportingAll} onPress={() => handleExportKpi('metas-estatus')} />
              </View>
              {loadMetasEst ? <SkeletonCard lines={3} /> : metasEstatus.length > 0 ? (
                <>
                  <View style={[s.sideBySideRow, { flexWrap: 'wrap', marginTop: 10 }]}>
                    {metasEstatus.slice(0, 4).map((m, i) => {
                      const esCompletada = m.estatus?.toLowerCase().includes('complet');
                      const esFallida    = m.estatus?.toLowerCase().includes('fall');
                      const color = esCompletada ? '#00a278' : esFallida ? '#ba1a1a' : '#004481';
                      const bg    = esCompletada ? '#e6f7f0'  : esFallida ? '#fbebeb'  : '#e8effa';
                      return (
                        <View key={i} style={[s.halfCard, { alignItems: 'center', backgroundColor: bg, borderColor: color + '30', marginBottom: 8 }]}>
                          <Text style={{ fontSize: 22, fontWeight: '800', color }}>{`${m.porcentaje.toFixed(1)}%`}</Text>
                          <Text style={{ fontSize: 11, fontWeight: '700', color, marginTop: 2, textAlign: 'center' }}>{m.estatus}</Text>
                          <Text style={{ fontSize: 10, color: '#737781', marginTop: 1 }}>{`${fmt(m.total)} metas`}</Text>
                        </View>
                      );
                    })}
                  </View>
                  <DonutChart
                    segments={metasEstatus.map((m, i) => ({
                      label:      m.estatus,
                      percentage: Math.round(m.porcentaje * 10) / 10,
                      color: m.estatus?.toLowerCase().includes('complet') ? '#00a278'
                           : m.estatus?.toLowerCase().includes('fall')    ? '#ba1a1a'
                           : ['#004481', '#fbbd08', '#7c3aed'][i % 3],
                    }))}
                    size="large"
                  />
                </>
              ) : <SkeletonCard lines={3} />}
              {conclusionMetas && (
                <View style={[s.conclusionBox, esAlertaMetas && s.conclusionBoxAlert]}>
                  <Ionicons name={esAlertaMetas ? 'warning-outline' : 'checkmark-circle-outline'} size={15}
                    color={esAlertaMetas ? '#ba1a1a' : '#004481'} style={{ flexShrink: 0, marginTop: 1 }} />
                  <Text style={s.conclusionTxt}>{conclusionMetas}</Text>
                </View>
              )}
            </View>

            {/* ── GEOGRAFÍA ── */}
            <Text style={s.sectionHeader}>GEOGRAFÍA</Text>
            <View style={s.kpiDetailCard}>
              <Text style={s.cardTitle}>Mapa de fraude por zona</Text>
              <Text style={s.cardSubtitle}>Tamaño proporcional al número de fraudes · Toca para ver detalle</Text>
              {loadGeo ? <SkeletonCard height={220} lines={3} />
                : fraudeGeo.length > 0 ? <FraudeMapView data={fraudeGeo} />
                : <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginVertical: 16 }}>
                    <Ionicons name="map-outline" size={16} color="#aaa" />
                    <Text style={{ color: '#aaa', fontWeight: '600' }}>Sin datos geográficos</Text>
                  </View>}
            </View>

            {/* ── COMERCIOS ── */}
            <Text style={s.sectionHeader}>COMERCIOS</Text>
            {loadCom
              ? <>{[1, 2, 3].map(i => <SkeletonCard key={i} height={130} lines={3} />)}</>
              : fraudeComercio.length > 0 ? <>
                  {fraudeComercio.slice(0, 5).map((item, idx) => (
                    <ComercioCard key={idx} item={item} idx={idx} expandedId={expandedComercioId} setExpandedId={setExpandedComercioId} />
                  ))}
                  {fraudeComercio.length > 5 && (
                    <TouchableOpacity onPress={() => setComerciosModalVisible(true)}
                      style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: '#004481' }}>
                      <Ionicons name="storefront-outline" size={18} color="#004481" />
                      <Text style={{ fontSize: 14, fontWeight: '700', color: '#004481' }}>
                        Ver los {fraudeComercio.length - 5} comercios restantes
                      </Text>
                      <Ionicons name="chevron-forward" size={16} color="#004481" />
                    </TouchableOpacity>
                  )}
                  <ComerciosModal data={fraudeComercio} visible={comerciosModalVisible} onClose={() => setComerciosModalVisible(false)} />
                </>
              : <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginVertical: 16 }}>
                  <Ionicons name="storefront-outline" size={16} color="#aaa" />
                  <Text style={{ color: '#aaa', fontWeight: '600' }}>Sin datos de comercios</Text>
                </View>}

            {/* ── PAGOS ── */}
            <Text style={s.sectionHeader}>PAGOS</Text>
            <View style={s.kpiDetailCard}>
              <View style={s.kpiCardHdr}>
                <View style={{ flex: 1 }}>
                  <Text style={s.cardTitle}>Tasa de éxito en pagos</Text>
                  <Text style={s.cardSubtitle}>Confiabilidad operativa</Text>
                </View>
                <ExportBtn id="pagos-estatus" exportingKpi={exportingKpi} exportingAll={exportingAll} onPress={() => handleExportKpi('pagos-estatus')} />
              </View>
              {loadPagosEst ? <SkeletonCard lines={3} /> : pagosPorEstatus.length > 0 ? <>
                <AnimatedBarChart data={pagosPorEstatus.map(d => ({ label: d.estatus, value: d.total }))}
                  colorFn={(i) => ['#00a278', '#ba1a1a', '#fbbd08'][i] ?? PALETTE[i]} valueFormatter={fmt} />
                {(() => {
                  const exitoso = pagosPorEstatus.find(p => p.estatus?.toLowerCase().includes('exit'));
                  if (!exitoso) return null;
                  const esRiesgo = exitoso.porcentaje < 95;
                  return (
                    <View style={[s.conclusionBox, esRiesgo && s.conclusionBoxAlert]}>
                      <Ionicons name={esRiesgo ? 'warning-outline' : 'checkmark-circle-outline'} size={15}
                        color={esRiesgo ? '#ba1a1a' : '#004481'} style={{ flexShrink: 0, marginTop: 1 }} />
                      <Text style={s.conclusionTxt}>
                        {esRiesgo
                          ? `Tasa de éxito del ${exitoso.porcentaje.toFixed(1)}%, por debajo del 95% recomendado.`
                          : `El ${exitoso.porcentaje.toFixed(1)}% de los pagos se procesan exitosamente.`}
                      </Text>
                    </View>
                  );
                })()}
              </> : null}
            </View>

            <View style={s.kpiDetailCard}>
              <View style={s.kpiCardHdr}>
                <View style={{ flex: 1 }}>
                  <Text style={s.cardTitle}>Canal de pago más utilizado</Text>
                  <Text style={s.cardSubtitle}>Preferencias del cliente</Text>
                </View>
                <ExportBtn id="pagos-canal" exportingKpi={exportingKpi} exportingAll={exportingAll} onPress={() => handleExportKpi('pagos-canal')} />
              </View>
              {loadPagosCan ? <SkeletonCard lines={3} /> : pagosPorCanal.length > 0 ? <>
                <AnimatedBarChart data={pagosPorCanal.map(d => ({ label: d.canal, value: d.total }))}
                  colorFn={(i) => PALETTE[i % PALETTE.length]} valueFormatter={fmt} />
                {(() => {
                  const top     = pagosPorCanal.reduce((m, d) => d.total > m.total ? d : m);
                  const digital = pagosPorCanal.filter(p => ['App','Web','Digital','Móvil','Mobile'].some(k => p.canal.toLowerCase().includes(k.toLowerCase()))).reduce((s, p) => s + p.porcentaje, 0);
                  return (
                    <View style={s.conclusionBox}>
                      <Ionicons name="bulb-outline" size={15} color="#004481" style={{ flexShrink: 0, marginTop: 1 }} />
                      <Text style={s.conclusionTxt}>
                        {`${top.canal} es el canal dominante con el ${top.porcentaje.toFixed(1)}% de los pagos.`}
                        {digital > 0 ? ` Canales digitales: ${digital.toFixed(1)}%.` : ''}
                      </Text>
                    </View>
                  );
                })()}
              </> : null}
            </View>

            {/* ── SEGUROS & AHORRO ── */}
            <Text style={s.sectionHeader}>SEGUROS & AHORRO</Text>
            <View style={s.kpiDetailCard}>
              <View style={s.kpiCardHdr}>
                <View style={{ flex: 1 }}>
                  <Text style={s.cardTitle}>Pólizas activas vs canceladas</Text>
                  <Text style={s.cardSubtitle}>Retención del portafolio</Text>
                </View>
                <ExportBtn id="seguros-estatus" exportingKpi={exportingKpi} exportingAll={exportingAll} onPress={() => handleExportKpi('seguros-estatus')} />
              </View>
              {loadSegEst ? <SkeletonCard lines={3} /> : segurosPorEstatus.length > 0 ? <>
                <View style={s.sideBySideRow}>
                  {segurosPorEstatus.slice(0, 3).map((seg, i) => {
                    const color = seg.estatus?.toLowerCase().includes('activ') ? '#00a278' : seg.estatus?.toLowerCase().includes('cancel') ? '#ba1a1a' : '#fbbd08';
                    const bg    = seg.estatus?.toLowerCase().includes('activ') ? '#e6f7f0' : seg.estatus?.toLowerCase().includes('cancel') ? '#fbebeb' : '#fff7e6';
                    return (
                      <View key={i} style={[s.halfCard, { backgroundColor: bg, borderColor: color + '30', alignItems: 'center' }]}>
                        <Text style={{ fontSize: 26, fontWeight: '800', color }}>{seg.porcentaje.toFixed(1)}%</Text>
                        <Text style={{ fontSize: 11, fontWeight: '700', color, marginTop: 2 }}>{seg.estatus}</Text>
                        <Text style={{ fontSize: 11, color: '#737781', marginTop: 2 }}>{fmt(seg.total)} pólizas</Text>
                      </View>
                    );
                  })}
                </View>
              </> : <SkeletonCard lines={3} />}
            </View>

            {/* ── COMUNICACIÓN ── */}
            <Text style={s.sectionHeader}>COMUNICACIÓN</Text>
            <View style={s.kpiDetailCard}>
              <View style={s.kpiCardHdr}>
                <View style={{ flex: 1 }}>
                  <Text style={s.cardTitle}>Tasa de entrega de notificaciones</Text>
                  <Text style={s.cardSubtitle}>Efectividad del canal</Text>
                </View>
                <ExportBtn id="notificaciones-estatus" exportingKpi={exportingKpi} exportingAll={exportingAll} onPress={() => handleExportKpi('notificaciones-estatus')} />
              </View>
              {loadNotiEst ? <SkeletonCard lines={3} /> : notiEstatus.length > 0 ? <>
                <AnimatedBarChart data={notiEstatus.map(d => ({ label: d.estatus, value: d.total }))}
                  colorFn={(i) => ['#00a278', '#ba1a1a', '#fbbd08'][i] ?? PALETTE[i]} valueFormatter={fmt} />
              </> : <SkeletonCard lines={3} />}
            </View>

            <View style={s.kpiDetailCard}>
              <View style={s.kpiCardHdr}>
                <View style={{ flex: 1 }}>
                  <Text style={s.cardTitle}>Canal de mayor alcance</Text>
                  <Text style={s.cardSubtitle}>Estrategia de comunicación</Text>
                </View>
                <ExportBtn id="notificaciones-canal" exportingKpi={exportingKpi} exportingAll={exportingAll} onPress={() => handleExportKpi('notificaciones-canal')} />
              </View>
              {loadNotiCan ? <SkeletonCard lines={3} /> : notiCanal.length > 0 ? <>
                <DonutChart
                  segments={notiCanal.map((n, i) => ({ label: n.canal, percentage: Math.round(n.porcentaje * 10) / 10, color: ['#004481','#1973B8','#48A9E6','#00a86b'][i % 4] }))}
                  size="large"
                />
                {(() => {
                  const top = notiCanal.reduce((m, n) => n.total > m.total ? n : m);
                  return (
                    <View style={s.conclusionBox}>
                      <Ionicons name="megaphone-outline" size={15} color="#004481" style={{ flexShrink: 0, marginTop: 1 }} />
                      <Text style={s.conclusionTxt}>{`${top.canal} lidera con ${top.porcentaje.toFixed(1)}% del alcance.`}</Text>
                    </View>
                  );
                })()}
              </> : <SkeletonCard lines={3} />}
            </View>

            {/* ── CAPTACIÓN COMERCIAL ── */}
            <Text style={s.sectionHeader}>CAPTACIÓN COMERCIAL</Text>
            <View style={s.kpiDetailCard}>
              <View style={s.kpiCardHdr}>
                <View style={{ flex: 1 }}>
                  <Text style={s.cardTitle}>Nuevas cuentas por sucursal</Text>
                  <Text style={s.cardSubtitle}>Desempeño comercial regional</Text>
                </View>
                <ExportBtn id="sucursales" exportingKpi={exportingKpi} exportingAll={exportingAll} onPress={() => handleExportKpi('sucursales')} />
              </View>
              {loadSucursal ? <SkeletonCard lines={5} /> : cuentasSucursal.length > 0 ? <>
                <AnimatedBarChart
                  data={[...cuentasSucursal].sort((a, b) => b.nuevas_cuentas - a.nuevas_cuentas).slice(0, 10).map(d => ({ label: d.sucursal, value: d.nuevas_cuentas }))}
                  colorFn={(i) => i === 0 ? '#004481' : i === 1 ? '#1973B8' : i === 2 ? '#48A9E6' : '#b0c8e8'}
                  valueFormatter={fmt}
                />
              </> : <SkeletonCard lines={5} />}
            </View>

            <View style={{ height: 40 }} />
          </ScrollView>
        )}

        {/* Botón flotante exportar todo */}
        {activeTab === 'KPIs' && (
          <TouchableOpacity style={s.floatingExportBtn} onPress={handleExportAll}
            disabled={exportingKpi !== null || exportingAll} activeOpacity={0.85}>
            {exportingAll
              ? <ActivityIndicator color="#fff" />
              : <Ionicons name="document-outline" size={24} color="#fff" />}
          </TouchableOpacity>
        )}

        {/* ══ DEBILIDADES ═════════════════════════════════════════════════════ */}
        {activeTab === 'Debilidades' && (
          <ScrollView style={s.scrollBody} contentContainerStyle={s.scrollContent}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#004481']} tintColor="#004481" />}>

            <Text style={s.tabMainTitle}>Debilidades Detectadas</Text>
            <Text style={s.tabSubtitle}>Análisis automático basado en datos reales</Text>

            <LinearGradient colors={['#ba1a1a', '#ff9900']} start={{ x: 0, y: 1 }} end={{ x: 1, y: 0 }} style={s.alertBanner}>
              <View style={s.alertBannerHeader}>
                <Ionicons name="warning-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
                <Text style={s.alertBannerText}>
                  {debilidadesData ? `${altaCount} debilidad${altaCount !== 1 ? 'es' : ''} crítica${altaCount !== 1 ? 's' : ''} encontrada${altaCount !== 1 ? 's' : ''}` : 'Analizando sistema...'}
                </Text>
              </View>
              <Text style={s.alertBannerAmount}>
                {hideAmounts ? '•••••••••' : etlResumen ? `${fmtMXN(etlResumen.monto_total_fraude)} en riesgo` : '...'}
              </Text>
            </LinearGradient>

            <Text style={s.sectionHeader}>INDICADORES DE RIESGO</Text>
            {!debilidadesData
              ? <>{[1,2,3,4,5].map(i => <SkeletonCard key={i} height={90} lines={2} />)}</>
              : indicadores && (
                <View style={{ gap: 10 }}>
                  <RiskIndicator label="Fraude Potencial"         value={indicadores.porcentajeFraudePotencial}   umbral={UMBRALES.porcentajeFraudePotencial}   icon="shield-outline" />
                  <RiskIndicator label="Cobros Excedidos"         value={indicadores.porcentajeCobrosExcedidos}   umbral={UMBRALES.porcentajeCobrosExcedidos}   icon="business-outline" />
                  <RiskIndicator label="Cuentas Canceladas"       value={indicadores.porcentajeCuentasCanceladas} umbral={UMBRALES.porcentajeCuentasCanceladas} icon="close-circle-outline" />
                  <RiskIndicator label="Préstamos Vencidos"       value={indicadores.porcentajePrestamosVencidos} umbral={UMBRALES.porcentajePrestamosVencidos} icon="card-outline" />
                  <RiskIndicator label="Metas de Ahorro Fallidas" value={indicadores.porcentajeMetasFallidas}     umbral={UMBRALES.porcentajeMetasFallidas}     icon="wallet-outline" />
                </View>
              )}

            {soluciones.length > 0 && (
              <>
                <Text style={[s.sectionHeader, { marginTop: 24 }]}>PLANES DE ACCIÓN</Text>
                {soluciones.map((sol: Solucion, idx: number) => (
                  <DebCard key={idx} sol={sol} idx={idx} expandedId={expandedDebId} setExpandedId={setExpandedDebId} />
                ))}
              </>
            )}
            {debilidadesData && soluciones.length === 0 && (
              <View style={{ alignItems: 'center', paddingVertical: 32 }}>
                <Ionicons name="checkmark-circle-outline" size={56} color="#00a278" />
                <Text style={{ fontSize: 16, fontWeight: '700', color: '#00a278', marginTop: 10 }}>Sin debilidades críticas</Text>
              </View>
            )}
            <View style={{ height: 40 }} />
          </ScrollView>
        )}

        {/* ══ OBJETIVOS ══════════════════════════════════════════════════════ */}
        {activeTab === 'Objetivos' && (
          <ScrollView style={s.scrollBody} contentContainerStyle={s.scrollContent}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#004481']} tintColor="#004481" />}>

            <Text style={s.tabMainTitle}>Objetivos</Text>
            <Text style={s.tabSubtitle}>Metas estratégicas generadas automáticamente</Text>

            <View style={s.objTrimestreCard}>
              <View style={s.objTrimestreIcon}>
                <Ionicons name="calendar-outline" size={20} color="#004481" />
              </View>
              <View>
                <Text style={{ fontSize: 10, fontWeight: '600', color: '#737781', letterSpacing: 0.5 }}>TRIMESTRE ACTUAL</Text>
                <Text style={s.objTrimestreText}>{trimestre}</Text>
              </View>
            </View>

            {!debilidadesData
              ? <>{[1,2,3].map(i => <SkeletonCard key={i} height={170} lines={5} />)}</>
              : objetivosGenerados.length === 0
                ? (
                  <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                    <Ionicons name="checkmark-circle-outline" size={64} color="#00a278" />
                    <Text style={{ fontSize: 18, fontWeight: '800', color: '#00a278', marginTop: 12, textAlign: 'center' }}>
                      Sin alertas críticas este trimestre ✓
                    </Text>
                  </View>
                )
                : <>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 8 }}>
                      <View style={{ flex: 1, height: 1, backgroundColor: 'rgba(194,198,210,0.4)' }} />
                      <Text style={{ fontSize: 11, fontWeight: '800', color: '#737781', letterSpacing: 1.2 }}>
                        {objetivosGenerados.length} OBJETIVO{objetivosGenerados.length > 1 ? 'S' : ''} ACTIVO{objetivosGenerados.length > 1 ? 'S' : ''}
                      </Text>
                      <View style={{ flex: 1, height: 1, backgroundColor: 'rgba(194,198,210,0.4)' }} />
                    </View>
                    {objetivosGenerados.map((obj, idx) => (
                      <ObjetivoCard key={idx} objetivo={obj} idx={idx} expandedId={expandedObjId} setExpandedId={setExpandedObjId} />
                    ))}
                  </>
            }
            <View style={{ height: 40 }} />
          </ScrollView>
        )}
      </View>

      {/* Modal de carga PDF */}
      <Modal visible={exportingKpi !== null || exportingAll} transparent animationType="fade">
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.45)' }}>
          <View style={{ backgroundColor: '#fff', borderRadius: 20, padding: 28, alignItems: 'center', gap: 14, elevation: 10, minWidth: 200 }}>
            <ActivityIndicator color="#004481" size="large" />
            <Text style={{ fontSize: 14, fontWeight: '700', color: '#1a1c1c' }}>Generando reporte...</Text>
            <Text style={{ fontSize: 11, color: '#737781', textAlign: 'center' }}>Esto puede tardar unos segundos</Text>
          </View>
        </View>
      </Modal>

      {/* ── Tab Bar ── */}
      <View style={s.tabBar}>
        {([
          { key: 'Inicio',      icon: 'home',      iconO: 'home-outline'      },
          { key: 'KPIs',        icon: 'bar-chart', iconO: 'bar-chart-outline' },
          { key: 'Debilidades', icon: 'warning',   iconO: 'warning-outline',   badge: altaCount },
          { key: 'Objetivos',   icon: 'flag',      iconO: 'flag-outline'       },
        ] as const).map(tab => (
          <TouchableOpacity key={tab.key} style={s.tabItem} onPress={() => setActiveTab(tab.key as any)}>
            <View>
              <Ionicons name={(activeTab === tab.key ? tab.icon : tab.iconO) as any}
                size={22} color={activeTab === tab.key ? '#004481' : '#737781'} />
              {'badge' in tab && tab.badge > 0 && (
                <View style={s.badgeBadge}>
                  <Text style={s.badgeBadgeTxt}>{tab.badge}</Text>
                </View>
              )}
            </View>
            <Text style={[s.tabLabel, { color: activeTab === tab.key ? '#004481' : '#737781' }]}>
              {tab.key}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}