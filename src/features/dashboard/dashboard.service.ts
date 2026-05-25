import { api } from '@/src/lib/axios';
import type {
  KpisResumen, EtlResumen,
  FraudePorCanal, FraudePorCategoria, FraudePorMes,
  DebilidadesResponse,
} from './dashboard.types';

export const dashboardService = {
  getKpisResumen:        (): Promise<KpisResumen>          => api.get('/kpis/resumen').then(r => r.data),
  getEtlResumen:         (): Promise<EtlResumen>           => api.get('/etl/resumen').then(r => r.data),
  getFraudePorCanal:     (): Promise<FraudePorCanal[]>     => api.get('/etl/fraude-por-canal').then(r => r.data),
  getFraudePorCategoria: (): Promise<FraudePorCategoria[]> => api.get('/etl/fraude-por-categoria').then(r => r.data),
  getFraudePorMes:       (): Promise<FraudePorMes[]>       => api.get('/etl/fraude-por-mes').then(r => r.data),
  getDebilidades:        (): Promise<DebilidadesResponse>  => api.get('/kpis/debilidades').then(r => r.data),
};
