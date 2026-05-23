import { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/src/store/auth.store';

export default function Splash() {
  const router  = useRouter();
  const { isHydrated, isAuthenticated, hydrate } = useAuthStore();
  const [timerDone, setTimerDone] = useState(false);

  // Hidrata el token Y lanza el timer de 3s en paralelo
  useEffect(() => {
    hydrate();
    const t = setTimeout(() => setTimerDone(true), 3000);
    return () => clearTimeout(t);
  }, []);

  // Redirige solo cuando AMBOS terminaron
  useEffect(() => {
    if (!isHydrated || !timerDone) return;
    router.replace(isAuthenticated ? '/(main)/dashboard' : '/(auth)/login');
  }, [isHydrated, timerDone, isAuthenticated]);

  return (
    <View style={s.root}>
      <View style={s.center}>
        <Text style={s.logo}>BBVA</Text>
        <View style={s.bar} />
        <Text style={s.tagline}>Dashboard Administrativo</Text>
      </View>
      <ActivityIndicator color="#2DCCCD" size="small" style={s.spinner} />
      <Text style={s.footer}>DSD-2303 · Instituto Tecnológico de Oaxaca</Text>
    </View>
  );
}

const s = StyleSheet.create({
  root:    { flex: 1, backgroundColor: '#072146',
             justifyContent: 'space-between', alignItems: 'center',
             paddingVertical: 80 },
  center:  { flex: 1, alignItems: 'center', justifyContent: 'center' },
  logo:    { fontSize: 56, fontWeight: '900', color: '#FFFFFF', letterSpacing: 8 },
  bar:     { width: 48, height: 4, backgroundColor: '#2DCCCD',
             borderRadius: 2, marginTop: 16, marginBottom: 20 },
  tagline: { fontSize: 13, color: '#7A9BB5', letterSpacing: 2,
             textTransform: 'uppercase' },
  spinner: { marginBottom: 16 },
  footer:  { fontSize: 10, color: '#2A4A6A', letterSpacing: 1 },
});
