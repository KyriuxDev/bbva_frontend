import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Image, StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path } from 'react-native-svg';

function BbvaLogo() {
  return (
    <Svg width={90} height={24} viewBox="0 0 162 40">
      <Path d="M0 0H14.1209C21.8491 0 26.6859 4.39126 26.6859 10.4578C26.6859 13.9877 24.8272 17.0321 21.6631 18.7301C25.5661 20.2526 28.0241 23.9056 28.0241 28.1671C28.0241 35.107 23.0757 40 14.3811 40H0V0ZM14.1209 17.0321C18.1727 17.0321 20.4402 14.7183 20.4402 11.0057C20.4402 7.29302 18.21 4.97921 14.1209 4.97921H6.24498V17.0321H14.1209ZM14.3811 35.0213C18.8418 35.0213 21.7375 32.551 21.7375 28.3497C21.7375 24.1484 18.8046 21.6781 14.3439 21.6781H6.24498V35.0213H14.3811Z" fill="white"/>
      <Path d="M33.6748 0H47.7957C55.5239 0 60.3607 4.39126 60.3607 10.4578C60.3607 13.9877 58.502 17.0321 55.3379 18.7301C59.2409 20.2526 61.6989 23.9056 61.6989 28.1671C61.6989 35.107 56.7505 40 48.0559 40H33.6748V0ZM47.7957 17.0321C51.8475 17.0321 54.115 14.7183 54.115 11.0057C54.115 7.29302 51.8848 4.97921 47.7957 4.97921H39.9198V17.0321H47.7957ZM48.0559 35.0213C52.5166 35.0213 55.4123 32.551 55.4123 28.3497C55.4123 24.1484 52.4794 21.6781 48.0187 21.6781H39.9198V35.0213H48.0559Z" fill="white"/>
      <Path d="M92.7314 0H99.4224L83.0294 40H76.4128L60.0198 0H66.7108L79.7211 31.7301L92.7314 0Z" fill="white"/>
      <Path d="M121.317 0L142 33.6748V40H135.346V35.9282L121.317 12.9868L107.288 35.9282V40H100.634V33.6748L121.317 0Z" fill="white"/>
    </Svg>
  );
}

const hour = new Date().getHours();
const greeting = hour < 12 ? 'Buenos días' : hour < 19 ? 'Buenas tardes' : 'Buenas noches';

export default function LandingScreen() {
  const router = useRouter();

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor="#041e42" />

      {/* ── Header ── */}
      <View style={s.header}>
        <View style={{ width: 44 }} />
        <BbvaLogo />
        <TouchableOpacity style={s.menuBtn}>
          <Ionicons name="menu" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Saludo + login ── */}
        <View style={s.card}>
          <Text style={s.greeting}>{greeting}</Text>

          <TouchableOpacity
            style={s.btnLogin}
            activeOpacity={0.9}
            onPress={() => router.push('/(auth)/login')}
          >
          <Text style={s.btnLoginTxt}>Iniciar sesión</Text>
          </TouchableOpacity>

          <Text style={s.firstTime}>¿Ingresas por primera vez?</Text>
          <Text style={s.link}>Crear clave de acceso</Text>
        </View>

        {/* ── Card 1: KPIs y gráficas ── */}
        <Text style={s.sectionTitle}>Dashboard de KPIs</Text>
        <View style={s.infoCard}>
          <Image
            source={require('@/assets/images/charts.jpg')}
            style={s.infoImg}
            resizeMode="cover"
          />
          <View style={s.infoBody}>
            <Text style={s.infoTitle}>Visualiza el rendimiento en tiempo real</Text>
            <Text style={s.infoDesc}>
              Accede a gráficas interactivas de ventas, captación y morosidad. Filtra por
              región, producto o periodo y toma decisiones basadas en datos.
            </Text>
            <View style={s.tagRow}>
              <View style={s.tag}><Text style={s.tagTxt}>Gráficas</Text></View>
              <View style={s.tag}><Text style={s.tagTxt}>Tiempo real</Text></View>
              <View style={s.tag}><Text style={s.tagTxt}>Filtros</Text></View>
            </View>
            <Text style={s.promoLink}>Explorar módulo →</Text>
          </View>
        </View>

        {/* ── Card 2: Reportes PDF ── */}
        <Text style={s.sectionTitle}>Reportes en PDF</Text>
        <View style={s.infoCard}>
          <Image
            source={require('@/assets/images/reports.jpg')}
            style={s.infoImg}
            resizeMode="cover"
          />
          <View style={s.infoBody}>
            <Text style={s.infoTitle}>Genera informes ejecutivos al instante</Text>
            <Text style={s.infoDesc}>
              Exporta reportes con gráficas, tablas y conclusiones automáticas en formato PDF
              listos para presentar a dirección o auditoría.
            </Text>
            <View style={s.tagRow}>
              <View style={s.tag}><Text style={s.tagTxt}>PDF</Text></View>
              <View style={s.tag}><Text style={s.tagTxt}>Gráficas incluidas</Text></View>
              <View style={s.tag}><Text style={s.tagTxt}>Exportar</Text></View>
            </View>
            <Text style={s.promoLink}>Ver ejemplo →</Text>
          </View>
        </View>

        {/* ── Card 3: Análisis estratégico ── */}
        <Text style={s.sectionTitle}>Análisis estratégico</Text>
        <View style={s.infoCard}>
          <Image
            source={require('@/assets/images/analysis.jpg')}
            style={s.infoImg}
            resizeMode="cover"
          />
          <View style={s.infoBody}>
            <Text style={s.infoTitle}>Debilidades detectadas y posibles soluciones</Text>
            <Text style={s.infoDesc}>
              El sistema identifica áreas de oportunidad, compara con benchmarks del sector
              y sugiere acciones correctivas basadas en los datos históricos de la empresa.
            </Text>
            <View style={s.tagRow}>
              <View style={s.tag}><Text style={s.tagTxt}>IA</Text></View>
              <View style={s.tag}><Text style={s.tagTxt}>Benchmarks</Text></View>
              <View style={s.tag}><Text style={s.tagTxt}>Alertas</Text></View>
            </View>
            <Text style={s.promoLink}>Conocer más →</Text>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root:         { flex: 1, backgroundColor: '#041e42' },

  header:       { flexDirection: 'row', justifyContent: 'space-between',
                  alignItems: 'center', paddingHorizontal: 20,
                  paddingTop: 52, paddingBottom: 16 },
  menuBtn:      { width: 44, height: 44, borderRadius: 22,
                  backgroundColor: '#004481',
                  alignItems: 'center', justifyContent: 'center' },

  scroll:       { paddingHorizontal: 20, paddingTop: 8 },

  card:         { backgroundColor: 'rgba(0,50,100,0.5)', borderRadius: 20,
                  borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
                  padding: 24, marginBottom: 28 },
  greeting:     { fontSize: 28, fontWeight: '800', color: '#fff', marginBottom: 20 },
  btnLogin:     { backgroundColor: '#fff', borderRadius: 12,
                  paddingVertical: 18, alignItems: 'center', marginBottom: 16 },
  btnLoginTxt:  { fontSize: 16, fontWeight: '700', color: '#002e5a' },
  firstTime:    { fontSize: 13, color: 'rgba(255,255,255,0.55)', marginBottom: 4 },
  link:         { fontSize: 14, fontWeight: '700', color: '#85b3f7', marginBottom: 28 },

  quickGrid:    { flexDirection: 'row', justifyContent: 'space-between' },
  quickItem:    { alignItems: 'center', flex: 1 },
  quickIconBox: { width: 52, height: 52, borderRadius: 26,
                  backgroundColor: 'rgba(10,20,50,0.6)',
                  alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  quickLabel:   { fontSize: 11, color: '#85b3f7', textAlign: 'center',
                  fontWeight: '600', lineHeight: 15 },

  sectionTitle: { fontSize: 24, fontWeight: '800', color: '#fff', marginBottom: 12 },

  promoCard:    { backgroundColor: 'rgba(0,30,66,0.6)', borderRadius: 16,
                  overflow: 'hidden', marginBottom: 16 },
  promoImg:     { width: '100%', height: 200 },
  promoBody:    { padding: 20 },
  promoTitle:   { fontSize: 22, fontWeight: '800', color: '#fff', marginBottom: 10 },
  promoDesc:    { fontSize: 13, color: 'rgba(255,255,255,0.7)',
                  lineHeight: 20, marginBottom: 12 },
  promoLink:    { fontSize: 14, fontWeight: '700', color: '#85b3f7' },

  navBtn:       { alignItems: 'center', paddingHorizontal: 16 },
  navActiveLine:{ width: 20, height: 2, backgroundColor: '#85b3f7',
                  borderRadius: 1, marginTop: 4 },

infoCard:     { backgroundColor: 'rgba(0,30,66,0.6)', borderRadius: 16,
                  borderWidth: 1, borderColor: 'rgba(133,179,247,0.2)',
                  overflow: 'hidden', marginBottom: 24 },
  infoImg:      { width: '100%', height: 200 },
  infoBody:     { padding: 20 },
  infoTitle:    { fontSize: 20, fontWeight: '800', color: '#fff', marginBottom: 10 },
  infoDesc:     { fontSize: 13, color: 'rgba(255,255,255,0.7)',
                  lineHeight: 22, marginBottom: 14 },

  tagRow:       { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  tag:          { backgroundColor: 'rgba(133,179,247,0.15)', borderRadius: 20,
                  borderWidth: 1, borderColor: 'rgba(133,179,247,0.3)',
                  paddingHorizontal: 12, paddingVertical: 4 },
  tagTxt:       { fontSize: 11, fontWeight: '600', color: '#85b3f7' },
});