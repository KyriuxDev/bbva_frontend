import { StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

export const s = StyleSheet.create({
  // ── Layout ──────────────────────────────────────────────────
  root:             { flex: 1, backgroundColor: '#f4f6fa' },
  scrollBody:       { flex: 1 },
  scrollContent:    { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 24 },

  // ── Header ──────────────────────────────────────────────────
  header:           { height: 60, backgroundColor: '#fff', flexDirection: 'row',
                      justifyContent: 'space-between', alignItems: 'center',
                      paddingHorizontal: 16, borderBottomWidth: 1,
                      borderBottomColor: 'rgba(194,198,210,0.3)', elevation: 1 },
  headerBtn:        { padding: 8 },
  headerTitle:      { fontSize: 22, fontWeight: '800', color: '#004481', letterSpacing: 0.8 },
  headerTimestamp:  { fontSize: 10, color: '#737781', marginTop: 1 },

  // ── Banner principal ─────────────────────────────────────────
  bannerCard:       { backgroundColor: '#004481', borderRadius: 16, padding: 20,
                      marginBottom: 20, elevation: 4 },
  bannerTitle:      { fontSize: 24, fontWeight: '700', color: '#fff', marginBottom: 4 },
  bannerSub:        { fontSize: 14, color: 'rgba(255,255,255,0.8)', fontWeight: '500' },

  // ── Estado global (Inicio) ───────────────────────────────────
  statusBanner:     { flexDirection: 'row', alignItems: 'center', gap: 12,
                      borderRadius: 12, padding: 12, marginBottom: 20, borderWidth: 1 },

  // ── KPI grid ─────────────────────────────────────────────────
  kpiGrid:          { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between',
                      gap: 10, marginBottom: 24 },
  kpiCard:          { backgroundColor: '#fff', borderRadius: 14, padding: 14,
                      width: (width - 42) / 2, borderWidth: 1,
                      borderColor: 'rgba(194,198,210,0.4)', elevation: 2 },
  kpiHeaderRow:     { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  iconWrapper:      { width: 34, height: 34, borderRadius: 17, backgroundColor: '#e8effa',
                      alignItems: 'center', justifyContent: 'center' },
  kpiValue:         { fontSize: 18, fontWeight: '800', color: '#1a1c1c', marginBottom: 2 },
  kpiLabel:         { fontSize: 11, fontWeight: '600', color: '#737781', marginBottom: 6 },
  trendRow:         { flexDirection: 'row', alignItems: 'center', gap: 3 },
  trendText:        { fontSize: 10, fontWeight: '700' },

  // ── Carrusel ─────────────────────────────────────────────────
  carousel:         { marginBottom: 24 },
  carouselCard:     { backgroundColor: '#fff', borderRadius: 16, padding: 18,
                      width: width - 52, marginRight: 16, borderWidth: 1,
                      borderColor: 'rgba(194,198,210,0.4)', elevation: 2 },
  carouselTitle:    { fontSize: 16, fontWeight: '700', color: '#1a1c1c', marginBottom: 2 },
  carouselSub:      { fontSize: 12, color: '#737781', marginBottom: 10 },

  // ── Títulos de sección ───────────────────────────────────────
  sectionTitle:     { fontSize: 18, fontWeight: '800', color: '#002e5a',
                      marginTop: 8, marginBottom: 14 },
  sectionHeader:    { fontSize: 11, fontWeight: '800', color: '#737781',
                      letterSpacing: 1.5, marginTop: 20, marginBottom: 10 },
  tabMainTitle:     { fontSize: 22, fontWeight: '800', color: '#002e5a', marginBottom: 4 },
  tabSubtitle:      { fontSize: 12, color: '#5d5f5f', lineHeight: 18, marginBottom: 20 },

  // ── Tarjetas de KPI detalle ──────────────────────────────────
  kpiDetailCard:    { backgroundColor: '#fff', borderRadius: 16, padding: 18,
                      marginBottom: 14, borderWidth: 1,
                      borderColor: 'rgba(194,198,210,0.4)', elevation: 2 },
  kpiCardHdr:       { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 2 },
  kpiExportBtn:     { width: 32, height: 32, borderRadius: 16, backgroundColor: '#e8effa',
                      alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0, marginLeft: 8 },
  cardTitle:        { fontSize: 15, fontWeight: '700', color: '#1a1c1c', marginBottom: 2 },
  cardSubtitle:     { fontSize: 11, color: '#737781', marginBottom: 8 },

  // ── Conclusión ───────────────────────────────────────────────
  conclusionBox:    { flexDirection: 'row', alignItems: 'flex-start',
                      backgroundColor: '#f4f5f8', borderRadius: 10,
                      padding: 12, marginTop: 14, gap: 8 },
  conclusionBoxAlert: { backgroundColor: '#fff4f4' },
  conclusionTxt:    { fontSize: 12, color: '#3d4046', flex: 1, lineHeight: 18 },

  // ── Side by side ─────────────────────────────────────────────
  sideBySideRow:    { flexDirection: 'row', justifyContent: 'space-between',
                      gap: 10, marginBottom: 14 },
  halfCard:         { flex: 1, backgroundColor: '#fff', borderRadius: 16, padding: 14,
                      borderWidth: 1, borderColor: 'rgba(194,198,210,0.4)', elevation: 2 },
  halfCardTitle:    { fontSize: 13, fontWeight: '700', color: '#1a1c1c',
                      marginBottom: 6, textAlign: 'center' },

  // ── Debilidades ──────────────────────────────────────────────
  debCard:          { backgroundColor: '#fff', borderRadius: 16, padding: 16,
                      flexDirection: 'row', gap: 14, marginBottom: 14, borderWidth: 1,
                      borderColor: 'rgba(194,198,210,0.4)', elevation: 2 },
  debIconBox:       { width: 44, height: 44, borderRadius: 22, backgroundColor: '#fbebeb',
                      alignItems: 'center', justifyContent: 'center' },
  debDetailCard:    { backgroundColor: '#fff', borderRadius: 16, padding: 18,
                      marginBottom: 14, borderWidth: 1,
                      borderColor: 'rgba(194,198,210,0.4)', elevation: 2 },
  debTitle:         { fontSize: 14, fontWeight: '700', color: '#1a1c1c',
                      marginBottom: 4, lineHeight: 20 },
  debDesc:          { fontSize: 12, color: '#5d5f5f', lineHeight: 17, marginBottom: 8 },
  solLink:          { flexDirection: 'row', alignItems: 'center', gap: 4 },
  solLinkTxt:       { fontSize: 12, fontWeight: '700', color: '#004481' },

  // ── Acordeón ─────────────────────────────────────────────────
  accordionBtn:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                      gap: 4, backgroundColor: '#f0f2f5', borderRadius: 20,
                      paddingVertical: 10, marginTop: 10 },
  accordionBtnText: { fontSize: 13, fontWeight: '700', color: '#004481' },
  accordionContent: { marginTop: 10, backgroundColor: '#f8fafc', borderRadius: 12,
                      padding: 14, borderWidth: 1, borderColor: '#e2e8f0', gap: 8 },
  mitigationTitle:  { fontSize: 12, fontWeight: '700', color: '#1e293b',
                      borderBottomWidth: 1, borderBottomColor: '#cbd5e1', paddingBottom: 4 },

  // ── Badges ───────────────────────────────────────────────────
  badge:            { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2,
                      marginBottom: 6, alignSelf: 'flex-start' },
  badgeText:        { fontSize: 10, fontWeight: '800', color: '#fff', letterSpacing: 0.5 },
  badgeBadge:       { position: 'absolute', right: -6, top: -4, backgroundColor: '#ba1a1a',
                      borderRadius: 8, minWidth: 16, height: 16,
                      alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 },
  badgeBadgeTxt:    { color: '#fff', fontSize: 9, fontWeight: '800' },

  // ── Indicador de riesgo ──────────────────────────────────────
  riskCard:         { borderRadius: 14, padding: 14, borderWidth: 1 },

  // ── Alert banner (Debilidades) ───────────────────────────────
  alertBanner:      { borderRadius: 16, padding: 18, marginBottom: 20, elevation: 4 },
  alertBannerHeader:{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  alertBannerText:  { color: '#fff', fontSize: 14, fontWeight: '700' },
  alertBannerAmount:{ color: '#fff', fontSize: 22, fontWeight: '800' },

  // ── Objetivos ────────────────────────────────────────────────
  objTrimestreCard: { flexDirection: 'row', alignItems: 'center', gap: 12,
                      backgroundColor: '#e8effa', borderRadius: 14,
                      padding: 16, marginBottom: 20, elevation: 1 },
  objTrimestreIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#fff',
                      alignItems: 'center', justifyContent: 'center', elevation: 2 },
  objTrimestreText: { fontSize: 17, fontWeight: '800', color: '#004481', marginTop: 2 },

  // ── Mapa geo — bottom sheet ───────────────────────────────────
  geoSheet:         { backgroundColor: '#fff', borderTopLeftRadius: 24,
                      borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  geoSheetHandle:   { width: 40, height: 4, backgroundColor: '#d1d5db', borderRadius: 2,
                      alignSelf: 'center', marginBottom: 20 },
  geoSheetTitle:    { fontSize: 17, fontWeight: '800', color: '#1a1c1c' },
  geoSheetRow:      { flexDirection: 'row', alignItems: 'center', gap: 12,
                      paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f0f2f5' },
  geoSheetIcon:     { width: 36, height: 36, borderRadius: 18,
                      alignItems: 'center', justifyContent: 'center' },
  geoSheetRowLabel: { fontSize: 11, color: '#737781', fontWeight: '600' },
  geoSheetRowVal:   { fontSize: 14, fontWeight: '700', color: '#1a1c1c' },

  // ── Comercios ────────────────────────────────────────────────
  comercioCard:     { backgroundColor: '#fff', borderRadius: 16, padding: 16,
                      marginBottom: 12, borderWidth: 1,
                      borderColor: 'rgba(194,198,210,0.4)', elevation: 2 },
  comercioIconBox:  { width: 44, height: 44, borderRadius: 22, backgroundColor: '#e8effa',
                      alignItems: 'center', justifyContent: 'center' },
  comercioName:     { fontSize: 14, fontWeight: '700', color: '#1a1c1c', marginBottom: 4 },
  comercioFraudes:  { fontSize: 20, fontWeight: '800', color: '#ba1a1a' },
  comercioStatBox:  { flex: 1, backgroundColor: '#f4f6fa', borderRadius: 10, padding: 10 },
  comercioStatLabel:{ fontSize: 10, color: '#737781', fontWeight: '600', marginBottom: 2 },
  comercioStatVal:  { fontSize: 13, fontWeight: '700', color: '#1a1c1c' },

  // ── Tab bar ──────────────────────────────────────────────────
  tabBar:           { height: 62, backgroundColor: '#fff', flexDirection: 'row',
                      justifyContent: 'space-around', alignItems: 'center',
                      borderTopWidth: 1, borderTopColor: 'rgba(194,198,210,0.3)', elevation: 5 },
  tabItem:          { alignItems: 'center', justifyContent: 'center', paddingVertical: 4 },
  tabLabel:         { fontSize: 10, fontWeight: '600', marginTop: 4 },

  // ── Floating export button ───────────────────────────────────
  floatingExportBtn:{ position: 'absolute', right: 16, bottom: 16, width: 52, height: 52,
                      borderRadius: 26, backgroundColor: '#004990', alignItems: 'center',
                      justifyContent: 'center', elevation: 6, zIndex: 10 },
});