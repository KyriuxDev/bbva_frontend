import { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/src/store/auth.store';
import Svg, { Path } from 'react-native-svg';

export default function Splash() {
  const router = useRouter();
  const { isHydrated, isAuthenticated, hydrate } = useAuthStore();
  const [timerDone, setTimerDone] = useState(false);

  useEffect(() => {
    hydrate();
    const t = setTimeout(() => setTimerDone(true), 3000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!isHydrated || !timerDone) return;
    router.replace(isAuthenticated ? '/(main)/dashboard' : '/(auth)/welcome');
  }, [isHydrated, timerDone, isAuthenticated]);

  return (
    <View style={s.root}>
      <View style={s.logoContainer}>
        <Svg width={220} height={60} viewBox="0 0 162 40">
          <Path d="M0 0H14.1209C21.8491 0 26.6859 4.39126 26.6859 10.4578C26.6859 13.9877 24.8272 17.0321 21.6631 18.7301C25.5661 20.2526 28.0241 23.9056 28.0241 28.1671C28.0241 35.107 23.0757 40 14.3811 40H0V0ZM14.1209 17.0321C18.1727 17.0321 20.4402 14.7183 20.4402 11.0057C20.4402 7.29302 18.21 4.97921 14.1209 4.97921H6.24498V17.0321H14.1209ZM14.3811 35.0213C18.8418 35.0213 21.7375 32.551 21.7375 28.3497C21.7375 24.1484 18.8046 21.6781 14.3439 21.6781H6.24498V35.0213H14.3811Z" fill="white" />
          <Path d="M33.6748 0H47.7957C55.5239 0 60.3607 4.39126 60.3607 10.4578C60.3607 13.9877 58.502 17.0321 55.3379 18.7301C59.2409 20.2526 61.6989 23.9056 61.6989 28.1671C61.6989 35.107 56.7505 40 48.0559 40H33.6748V0ZM47.7957 17.0321C51.8475 17.0321 54.115 14.7183 54.115 11.0057C54.115 7.29302 51.8848 4.97921 47.7957 4.97921H39.9198V17.0321H47.7957ZM48.0559 35.0213C52.5166 35.0213 55.4123 32.551 55.4123 28.3497C55.4123 24.1484 52.4794 21.6781 48.0187 21.6781H39.9198V35.0213H48.0559Z" fill="white" />
          <Path d="M92.7314 0H99.4224L83.0294 40H76.4128L60.0198 0H66.7108L79.7211 31.7301L92.7314 0Z" fill="white" />
          <Path d="M121.317 0L142 33.6748V40H135.346V35.9282L121.317 12.9868L107.288 35.9282V40H100.634V33.6748L121.317 0Z" fill="white" />
        </Svg>
      </View>
      <View style={s.homeIndicator} />
    </View>
  );
}

const s = StyleSheet.create({
  root:          { flex: 1, backgroundColor: '#001491',
                   justifyContent: 'space-between', alignItems: 'center',
                   paddingVertical: 32 },
  logoContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  homeIndicator: { width: 134, height: 5, backgroundColor: 'rgba(255,255,255,0.5)',
                   borderRadius: 100, marginBottom: 8 },
});