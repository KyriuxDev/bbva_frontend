import {
  View, Text, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ActivityIndicator,
  StatusBar, ScrollView, StyleSheet, Animated,
} from 'react-native';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, type LoginFormValues } from '@/src/features/auth/auth.schema';
import { loginRequest } from '@/src/features/auth/auth.service';
import { useAuthStore } from '@/src/store/auth.store';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path } from 'react-native-svg';

// ── Logo SVG BBVA ────────────────────────────────────────────
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

// ── Label flotante ───────────────────────────────────────────
function FloatingInput({
  label, value, onChangeText, onBlur,
  secureTextEntry, keyboardType, hasError, errorMsg, rightElement,
}: {
  label: string; value: string;
  onChangeText: (v: string) => void; onBlur?: () => void;
  secureTextEntry?: boolean; keyboardType?: any;
  hasError?: boolean; errorMsg?: string; rightElement?: React.ReactNode;
}) {
  const anim = useRef(new Animated.Value(value ? 1 : 0)).current;
  const [focused, setFocused] = useState(false);

  const up   = () => Animated.timing(anim, { toValue: 1, duration: 180, useNativeDriver: false }).start();
  const down = () => { if (!value) Animated.timing(anim, { toValue: 0, duration: 180, useNativeDriver: false }).start(); };

  const top   = anim.interpolate({ inputRange: [0, 1], outputRange: [18, -2] });
  const size  = anim.interpolate({ inputRange: [0, 1], outputRange: [16, 12] });
  const color = anim.interpolate({ inputRange: [0, 1], outputRange: ['#737781', '#004481'] });
  const border = hasError ? '#ba1a1a' : focused ? '#004481' : '#c2c6d2';

  return (
    <View style={fi.wrap}>
      <View style={[fi.field, { borderBottomColor: border }]}>
        <Animated.Text style={[fi.label, { top, fontSize: size, color }]}>{label}</Animated.Text>
        <TextInput
          style={fi.input}
          value={value}
          onChangeText={onChangeText}
          onFocus={() => { setFocused(true); up(); }}
          onBlur={() => { setFocused(false); down(); onBlur?.(); }}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize="none"
          autoCorrect={false}
          selectionColor="#004481"
        />
        {rightElement && <View style={fi.right}>{rightElement}</View>}
      </View>
      {hasError && <Text style={fi.error}>{errorMsg ?? 'Campo requerido'}</Text>}
    </View>
  );
}

const fi = StyleSheet.create({
  wrap:  { marginBottom: 24 },
  field: { borderBottomWidth: 2, paddingBottom: 8, paddingTop: 22 },
  label: { position: 'absolute', left: 0, fontWeight: '600' },
  input: { fontSize: 16, color: '#1a1c1c', paddingVertical: 0 },
  right: { position: 'absolute', right: 0, top: 18 },
  error: { marginTop: 4, fontSize: 11, color: '#ba1a1a' },
});

// ── Pantalla ─────────────────────────────────────────────────
export default function LoginScreen() {
  const router  = useRouter();
  const login   = useAuthStore((s) => s.login);
  const [loading,    setLoading]    = useState(false);
  const [showPwd,    setShowPwd]    = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // ── Animación de entrada ─────────────────────────────────────
  const cardOpacity   = useRef(new Animated.Value(0)).current;
  const cardTranslate = useRef(new Animated.Value(28)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(cardOpacity,   { toValue: 1, duration: 400, delay: 100, useNativeDriver: true }),
      Animated.timing(cardTranslate, { toValue: 0, duration: 400, delay: 100, useNativeDriver: true }),
    ]).start();
  }, []);

  const { control, handleSubmit, formState: { errors } } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (values: LoginFormValues) => {
    try {
      setLoading(true);
      setLoginError(null);
      const { token, admin } = await loginRequest({
        email:    values.email.trim().toLowerCase(),
        password: values.password.trim(),
      });
      await login(token, admin);
      router.replace('/(main)/dashboard');
    } catch (err: unknown) {
      const msg = (err as any)?.response?.data?.message
        ?? (err as Error)?.message
        ?? 'Credenciales incorrectas o servidor no disponible.';
      setLoginError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor="#004481" />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'space-between' }}
          keyboardShouldPersistTaps="handled"
        >

          {/* ── Header ── */}
          <View style={s.header}>
            <TouchableOpacity style={s.headerBtn} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <BbvaLogo />
            <TouchableOpacity style={s.headerBtn}>
              <Ionicons name="help-circle-outline" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* ── Cuerpo ── */}
          <View style={s.body}>

            {/* Saludo */}
            <View style={s.welcomeWrap}>
              <Text style={s.welcomeTitle}>Hola, ¿qué tal?</Text>
              <Text style={s.welcomeSub}>
                Inicia sesión para gestionar tus finanzas con total seguridad.
              </Text>
            </View>

            {/* Card animado */}
            <Animated.View style={[s.card, { opacity: cardOpacity, transform: [{ translateY: cardTranslate }] }]}>

              {/* Banner de error inline */}
              {loginError && (
                <View style={s.errorBanner}>
                  <Ionicons name="warning-outline" size={18} color="#ba1a1a" style={{ marginRight: 8, flexShrink: 0 }} />
                  <Text style={s.errorBannerTxt}>{loginError}</Text>
                </View>
              )}

              <Controller control={control} name="email"
                render={({ field: { onChange, onBlur, value } }) => (
                  <FloatingInput
                    label="Correo electrónico"
                    value={value}
                    onChangeText={(v) => { onChange(v); setLoginError(null); }}
                    onBlur={onBlur}
                    keyboardType="email-address"
                    hasError={!!errors.email}
                    errorMsg="Ingresa un correo válido"
                  />
                )} />

              <Controller control={control} name="password"
                render={({ field: { onChange, onBlur, value } }) => (
                  <FloatingInput
                    label="Contraseña"
                    value={value}
                    onChangeText={(v) => { onChange(v); setLoginError(null); }}
                    onBlur={onBlur}
                    secureTextEntry={!showPwd}
                    hasError={!!errors.password}
                    errorMsg="La contraseña es requerida"
                    rightElement={
                      <TouchableOpacity onPress={() => setShowPwd(v => !v)}>
                        <Ionicons
                          name={showPwd ? 'eye-off-outline' : 'eye-outline'}
                          size={20} color="#737781"
                        />
                      </TouchableOpacity>
                    }
                  />
                )} />

              {/* Acceso seguro */}
              <View style={s.secureRow}>
                <Ionicons name="lock-closed" size={16} color="#004481" />
                <Text style={s.secureText}>ACCESO SEGURO</Text>
              </View>

              {/* Botón entrar */}
              <TouchableOpacity
                onPress={handleSubmit(onSubmit)}
                disabled={loading}
                activeOpacity={0.9}
                style={[s.btn, loading && s.btnDisabled]}
              >
                {loading
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={s.btnTxt}>Entrar</Text>
                }
              </TouchableOpacity>

              {/* Links */}
              <TouchableOpacity style={s.forgotWrap}>
                <Text style={s.forgotTxt}>Olvidé mi contraseña</Text>
              </TouchableOpacity>
            </Animated.View>

            {/* Trust */}
            <View style={s.trust}>
              <View style={s.trustIcons}>
                <Ionicons name="shield-checkmark-outline" size={28} color="#004481" />
                <Ionicons name="finger-print-outline"     size={28} color="#004481" />
                <Ionicons name="shield-half-outline"      size={28} color="#004481" />
              </View>
              <Text style={s.trustTxt}>
                Protegido por sistemas de seguridad de nivel bancario global.
              </Text>
            </View>
            <View style={{ flex: 1, minHeight: 40 }} />

          </View>

          {/* Footer */}
          <View style={s.footer}>
            <View style={s.footerLinks}>
              {['Cajeros y Oficinas', 'Atención al cliente', 'Privacidad'].map((l) => (
                <TouchableOpacity key={l}>
                  <Text style={s.footerLink}>{l}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={s.footerCopy}>© 2026 BBVA S.A.</Text>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const s = StyleSheet.create({
  root:        { flex: 1, backgroundColor: '#f9f9f9' },

  header:      { backgroundColor: '#004481', flexDirection: 'row',
                 justifyContent: 'space-between', alignItems: 'center',
                 paddingHorizontal: 16, paddingTop: 48, paddingBottom: 16 },
  headerBtn:   { padding: 8 },

  body:        { paddingHorizontal: 20, paddingTop: 32 },

  welcomeWrap: { marginBottom: 24 },
  welcomeTitle:{ fontSize: 26, fontWeight: '700', color: '#002e5a', marginBottom: 6 },
  welcomeSub:  { fontSize: 15, color: '#5d5f5f', lineHeight: 22 },

  card:        { backgroundColor: '#fff', borderRadius: 16, padding: 24,
                 borderWidth: 1, borderColor: 'rgba(194,198,210,0.5)',
                 shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
                 shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
                 marginBottom: 32 },

  // ── Error banner ──
  errorBanner: { flexDirection: 'row', alignItems: 'flex-start',
                 backgroundColor: '#fff0f0', borderRadius: 10,
                 borderWidth: 1, borderColor: '#fcc', borderLeftWidth: 4,
                 borderLeftColor: '#ba1a1a',
                 padding: 12, marginBottom: 20 },
  errorBannerTxt: { fontSize: 13, color: '#ba1a1a', flex: 1, lineHeight: 18 },

  secureRow:   { flexDirection: 'row', alignItems: 'center', gap: 6,
                 paddingVertical: 12, marginBottom: 8 },
  secureText:  { fontSize: 11, fontWeight: '700', color: '#004481',
                 letterSpacing: 1.5 },

  btn:         { backgroundColor: '#004481', borderRadius: 10,
                 height: 52, alignItems: 'center', justifyContent: 'center',
                 shadowColor: '#004481', shadowOffset: { width: 0, height: 4 },
                 shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  btnDisabled: { backgroundColor: '#7a9bb5' },
  btnTxt:      { fontSize: 15, fontWeight: '700', color: '#fff', letterSpacing: 0.5 },

  forgotWrap:  { alignItems: 'center', paddingVertical: 20 },
  forgotTxt:   { fontSize: 13, fontWeight: '600', color: '#004481' },

  trust:       { alignItems: 'center', marginBottom: 32, opacity: 0.6 },
  trustIcons:  { flexDirection: 'row', gap: 24, marginBottom: 12 },
  trustTxt:    { fontSize: 11, fontWeight: '600', color: '#424750',
                 textAlign: 'center', letterSpacing: 0.3, lineHeight: 16 },

  footer:      { borderTopWidth: 1, borderTopColor: 'rgba(194,198,210,0.3)',
                 paddingHorizontal: 20, paddingVertical: 24 },
  footerLinks: { flexDirection: 'row', justifyContent: 'center',
                 gap: 20, marginBottom: 12, flexWrap: 'wrap' },
  footerLink:  { fontSize: 11, fontWeight: '600', color: '#5d5f5f' },
  footerCopy:  { textAlign: 'center', fontSize: 11, color: '#737781' },
});
