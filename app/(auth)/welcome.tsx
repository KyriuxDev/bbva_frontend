import { useRouter } from 'expo-router';
import { useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Dimensions, StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Video, ResizeMode } from 'expo-av';
import Svg, { Path } from 'react-native-svg';

const { width, height } = Dimensions.get('window');

export default function WelcomeScreen() {
  const router = useRouter();
  const video  = useRef(null);

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* ── Video de fondo ── */}
      <Video
        ref={video}
        source={require('@/assets/bg.mp4')}
        style={StyleSheet.absoluteFill}
        resizeMode={ResizeMode.COVER}
        isLooping
        isMuted
        shouldPlay
      />

      {/* ── Gradiente encima del video ── */}
      <LinearGradient
        colors={['rgba(4,30,66,0.85)', 'rgba(0,68,129,0.95)']}
        style={StyleSheet.absoluteFill}
      />

      {/* ── Contenido ── */}
      <View style={s.content}>
        <Text style={s.headline}>
          Ahorra tiempo y{'\n'}evita ir a la sucursal
        </Text>

        <TouchableOpacity
          style={s.btnPrimary}
          activeOpacity={0.9}
          onPress={() => router.replace('/(auth)/landing')}
        >
          <Text style={s.btnPrimaryTxt}>Entrar</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={s.btnSecondary}
          activeOpacity={0.9}
          onPress={() => router.replace('/(auth)/login')}
        >
          <Text style={s.btnSecondaryTxt}>Quiero una cuenta</Text>
        </TouchableOpacity>
      </View>

      {/* ── Home indicator ── */}
      <View style={s.homeIndicator} />
    </View>
  );
}

const s = StyleSheet.create({
  root:          { flex: 1, backgroundColor: '#041e42' },
  bgLogo:        { position: 'absolute', top: '35%', left: '-10%',
                   opacity: 0.12, zIndex: 5 },
  content:       { position: 'absolute', bottom: 48, left: 0, right: 0,
                   paddingHorizontal: 32, zIndex: 20 },
  headline:      { fontSize: 32, fontWeight: '700', color: '#FFFFFF',
                   textAlign: 'center', lineHeight: 42, marginBottom: 40 },
  btnPrimary:    { backgroundColor: '#FFFFFF', borderRadius: 8,
                   paddingVertical: 18, alignItems: 'center', marginBottom: 16 },
  btnPrimaryTxt: { fontSize: 17, fontWeight: '800', color: '#041e42' },
  btnSecondary:    { backgroundColor: '#8CD2F5', borderRadius: 8,
                     paddingVertical: 18, alignItems: 'center' },
  btnSecondaryTxt: { fontSize: 17, fontWeight: '800', color: '#041e42' },
  homeIndicator: { position: 'absolute', bottom: 10, alignSelf: 'center',
                   width: 128, height: 5,
                   backgroundColor: 'rgba(255,255,255,0.4)', borderRadius: 100 },
});