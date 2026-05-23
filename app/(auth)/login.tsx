import {
  View, Text, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ActivityIndicator,
  StatusBar, Alert, ScrollView, StyleSheet, Animated,
} from 'react-native';
import { useState, useRef } from 'react';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, type LoginFormValues } from '@/src/features/auth/auth.schema';
import { loginRequest } from '@/src/features/auth/auth.service';
import { useAuthStore } from '@/src/store/auth.store';
import { Ionicons } from '@expo/vector-icons';

// ── Label flotante ───────────────────────────────────────────
function FloatingInput({
  label, value, onChangeText, onBlur,
  secureTextEntry, keyboardType, hasError, rightElement,
}: {
  label: string; value: string;
  onChangeText: (v: string) => void; onBlur?: () => void;
  secureTextEntry?: boolean; keyboardType?: any;
  hasError?: boolean; rightElement?: React.ReactNode;
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
      {hasError && <Text style={fi.error}>Campo requerido</Text>}
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
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  const { control, handleSubmit, formState: { errors } } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (values: LoginFormValues) => {
    try {
      setLoading(true);
      const { token, admin } = await loginRequest(values);
      await login(token, admin);
      router.replace('/(main)/dashboard');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message ?? 'Credenciales incorrectas.';
      Alert.alert('Error de acceso', msg);
    } finally { setLoading(false); }
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
            <TouchableOpacity style={s.headerBtn}>
              <Ionicons name="menu" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={s.headerTitle}>BBVA</Text>
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

            {/* Card */}
            <View style={s.card}>
              <Controller control={control} name="email"
                render={({ field: { onChange, onBlur, value } }) => (
                  <FloatingInput
                    label="Correo electrónico"
                    value={value} onChangeText={onChange} onBlur={onBlur}
                    keyboardType="email-address" hasError={!!errors.email}
                  />
                )} />

              <Controller control={control} name="password"
                render={({ field: { onChange, onBlur, value } }) => (
                  <FloatingInput
                    label="Contraseña"
                    value={value} onChangeText={onChange} onBlur={onBlur}
                    secureTextEntry={!showPwd} hasError={!!errors.password}
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
            </View>

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
            {/* Spacer para empujar el footer abajo */}
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
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#fff', letterSpacing: 0.5 },

  body:        { paddingHorizontal: 20, paddingTop: 32 },

  welcomeWrap: { marginBottom: 24 },
  welcomeTitle:{ fontSize: 26, fontWeight: '700', color: '#002e5a', marginBottom: 6 },
  welcomeSub:  { fontSize: 15, color: '#5d5f5f', lineHeight: 22 },

  card:        { backgroundColor: '#fff', borderRadius: 16, padding: 24,
                 borderWidth: 1, borderColor: 'rgba(194,198,210,0.5)',
                 shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
                 shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
                 marginBottom: 32 },

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

  divider:     { height: 1, backgroundColor: '#e2e2e2', marginBottom: 20 },

  noAccount:   { fontSize: 13, color: '#5d5f5f', textAlign: 'center', marginBottom: 12 },
  clienteBtn:  { borderWidth: 2, borderColor: '#004481', borderRadius: 10,
                 height: 52, alignItems: 'center', justifyContent: 'center' },
  clienteTxt:  { fontSize: 14, fontWeight: '700', color: '#004481' },

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