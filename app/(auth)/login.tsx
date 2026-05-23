import {
  View, Text, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ActivityIndicator,
  StatusBar, Alert, ScrollView, StyleSheet,
} from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, type LoginFormValues } from '@/src/features/auth/auth.schema';
import { loginRequest } from '@/src/features/auth/auth.service';
import { useAuthStore } from '@/src/store/auth.store';

export default function LoginScreen() {
  const router  = useRouter();
  const login   = useAuthStore((s) => s.login);
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  const { control, handleSubmit, formState: { errors } } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  // Hora para saludo
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Buenos días' : hour < 19 ? 'Buenas tardes' : 'Buenas noches';

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
      <StatusBar barStyle="light-content" backgroundColor="#072146" />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">

          {/* ── Header ── */}
          <View style={s.header}>
            <Text style={s.bbva}>BBVA</Text>
          </View>

          {/* ── Cuerpo ── */}
          <View style={s.body}>

            {/* Saludo */}
            <Text style={s.greeting}>{greeting}</Text>
            <Text style={s.subtitle}>Panel administrativo</Text>

            {/* Botón principal — lleva al formulario */}
            {/* Formulario */}
            <View style={s.card}>

              {/* Email */}
              <Text style={s.label}>Correo electrónico</Text>
              <Controller control={control} name="email"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={[s.input, errors.email && s.inputError]}
                    onChangeText={onChange} onBlur={onBlur} value={value}
                    placeholder="admin@bbva.com" placeholderTextColor="#8899AA"
                    keyboardType="email-address" autoCapitalize="none" autoCorrect={false}
                  />
                )} />
              {errors.email && <Text style={s.errorTxt}>⚠ {errors.email.message}</Text>}

              {/* Password */}
              <Text style={[s.label, { marginTop: 16 }]}>Contraseña</Text>
              <View>
                <Controller control={control} name="password"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      style={[s.input, { paddingRight: 52 }, errors.password && s.inputError]}
                      onChangeText={onChange} onBlur={onBlur} value={value}
                      placeholder="••••••••" placeholderTextColor="#8899AA"
                      secureTextEntry={!showPwd} autoCapitalize="none"
                    />
                  )} />
                <TouchableOpacity onPress={() => setShowPwd(v => !v)} style={s.eye}>
                  <Text style={{ fontSize: 18 }}>{showPwd ? '🙈' : '👁️'}</Text>
                </TouchableOpacity>
              </View>
              {errors.password && <Text style={s.errorTxt}>⚠ {errors.password.message}</Text>}

              {/* Botón */}
              <TouchableOpacity
                onPress={handleSubmit(onSubmit)}
                disabled={loading}
                activeOpacity={0.9}
                style={[s.btn, loading && s.btnDisabled]}
              >
                {loading
                  ? <ActivityIndicator color="#072146" />
                  : <Text style={s.btnTxt}>Iniciar sesión</Text>
                }
              </TouchableOpacity>
            </View>

            {/* Links inferiores al estilo BBVA */}
            <View style={s.links}>
              <TouchableOpacity>
                <Text style={s.link}>¿Olvidaste tu contraseña?</Text>
              </TouchableOpacity>
            </View>

            {/* Demo credentials */}
            <View style={s.demo}>
              <Text style={s.demoTitle}>ACCESO DEMO</Text>
              <Text style={s.demoTxt}>admin@bbva.com  ·  Admin123!</Text>
            </View>

          </View>

          {/* Footer */}
          <Text style={s.footer}>DSD-2303 · Instituto Tecnológico de Oaxaca</Text>

        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const s = StyleSheet.create({
  root:        { flex: 1, backgroundColor: '#072146' },
  header:      { paddingTop: 56, paddingBottom: 32, alignItems: 'center' },
  bbva:        { fontSize: 28, fontWeight: '900', color: '#FFFFFF', letterSpacing: 4 },

  body:        { flex: 1, paddingHorizontal: 24 },
  greeting:    { fontSize: 32, fontWeight: '800', color: '#FFFFFF', marginBottom: 4 },
  subtitle:    { fontSize: 14, color: '#7A9BB5', marginBottom: 32 },

  card:        { backgroundColor: '#0E2D54', borderRadius: 20, padding: 24,
                 shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
                 shadowOpacity: 0.3, shadowRadius: 16, elevation: 10 },

  label:       { fontSize: 12, fontWeight: '700', color: '#7A9BB5',
                 letterSpacing: 1, marginBottom: 8, textTransform: 'uppercase' },
  input:       { backgroundColor: '#162E4D', borderWidth: 1, borderColor: '#1E3D60',
                 borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14,
                 fontSize: 15, color: '#FFFFFF' },
  inputError:  { borderColor: '#FF5252' },
  errorTxt:    { marginTop: 6, fontSize: 12, color: '#FF5252' },
  eye:         { position: 'absolute', right: 16, top: 14 },

  btn:         { marginTop: 28, backgroundColor: '#FFFFFF', borderRadius: 12,
                 paddingVertical: 16, alignItems: 'center' },
  btnDisabled: { backgroundColor: '#3A5270' },
  btnTxt:      { fontSize: 16, fontWeight: '800', color: '#072146', letterSpacing: 0.5 },

  links:       { marginTop: 24, alignItems: 'center' },
  link:        { fontSize: 13, color: '#2DCCCD', fontWeight: '600' },

  demo:        { marginTop: 32, padding: 16, backgroundColor: '#0E2D54',
                 borderRadius: 12, borderLeftWidth: 3, borderLeftColor: '#2DCCCD',
                 alignItems: 'center' },
  demoTitle:   { fontSize: 10, fontWeight: '800', color: '#2DCCCD',
                 letterSpacing: 2, marginBottom: 6 },
  demoTxt:     { fontSize: 12, color: '#7A9BB5', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },

  footer:      { textAlign: 'center', fontSize: 10, color: '#2A4A6A',
                 paddingVertical: 24 },
});
