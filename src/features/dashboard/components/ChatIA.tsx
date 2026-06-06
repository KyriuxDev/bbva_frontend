// src/features/dashboard/components/ChatIA.tsx
import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  ScrollView, ActivityIndicator, StyleSheet, Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '@/src/lib/axios';

interface Mensaje {
  role:    'user' | 'assistant';
  content: string;
}

interface Props {
  mensajes:     Mensaje[];
  setMensajes:  React.Dispatch<React.SetStateAction<Mensaje[]>>;
  tabBarHeight: number;
}

// ── Sugerencias agrupadas por tema ────────────────────────────────────────────

const SUGERENCIAS: { icono: string; texto: string }[] = [
  // Histórico / crecimiento
  { icono: 'trending-up-outline',      texto: '¿Cuántas cuentas nuevas tuvimos por año?' },
  { icono: 'people-outline',           texto: '¿En qué año captamos más clientes?' },
  { icono: 'bar-chart-outline',        texto: 'Compara transacciones 2022 vs 2023 vs 2024' },
  // Fraude
  { icono: 'shield-outline',           texto: '¿En qué año hubo más fraude y por qué?' },
  { icono: 'analytics-outline',        texto: '¿Cómo evolucionó la tasa de fraude año a año?' },
  // Financiero
  { icono: 'cash-outline',             texto: '¿Cómo crecieron los préstamos otorgados por año?' },
  { icono: 'wallet-outline',           texto: 'Resumen de metas de ahorro: ¿mejoramos o empeoramos?' },
  // Estado actual
  { icono: 'warning-outline',          texto: '¿Cuál es el indicador más crítico hoy?' },
  { icono: 'checkmark-circle-outline', texto: '¿Qué sucursal debo priorizar este trimestre?' },
];

// ── Componente ────────────────────────────────────────────────────────────────

export function ChatIA({ mensajes, setMensajes, tabBarHeight }: Props) {
  const [input,        setInput]        = useState('');
  const [cargando,     setCargando]     = useState(false);
  const [iaDisponible, setIaDisponible] = useState<boolean | null>(null);
  const [modelo,       setModelo]       = useState<string>('');
  const [kbHeight,     setKbHeight]     = useState(0);

  const scrollRef = useRef<ScrollView>(null);

  // Verificar estado de Ollama al montar
  useEffect(() => {
    api.get('/ai/status')
      .then(({ data }) => {
        setIaDisponible(data.disponible);
        if (data.modelo_activo) setModelo(data.modelo_activo);
        else if (data.modelos?.length) setModelo(data.modelos[0]);
      })
      .catch(() => setIaDisponible(false));
  }, []);

  // Ajuste de teclado
  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', (e) => {
      const offset = e.endCoordinates.height - tabBarHeight;
      setKbHeight(offset > 0 ? offset : 0);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    });
    const hide = Keyboard.addListener('keyboardDidHide', () => setKbHeight(0));
    return () => { show.remove(); hide.remove(); };
  }, [tabBarHeight]);

  // Scroll al último mensaje
  useEffect(() => {
    if (mensajes.length > 0) {
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 150);
    }
  }, [mensajes]);

  // Enviar mensaje
  const enviar = async (texto?: string) => {
    const msg = (texto ?? input).trim();
    if (!msg || cargando) return;
    setMensajes(prev => [...prev, { role: 'user', content: msg }]);
    setInput('');
    setCargando(true);
    try {
      const { data } = await api.post('/ai/chat', {
        mensaje:   msg,
        historial: mensajes.slice(-6),
      });
      setMensajes(prev => [...prev, { role: 'assistant', content: data.respuesta }]);
    } catch {
      setMensajes(prev => [
        ...prev,
        { role: 'assistant', content: '⚠️ Error al conectar con la IA. Verifica que Ollama esté corriendo (`ollama serve`).' },
      ]);
    } finally {
      setCargando(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <View style={{ flex: 1, backgroundColor: '#f4f6fa' }}>

      {/* Banner de error si Ollama no responde */}
      {iaDisponible === false && (
        <View style={st.bannerError}>
          <Ionicons name="warning-outline" size={14} color="#ba1a1a" />
          <Text style={st.bannerErrorTxt}>
            Ollama no disponible — ejecuta: ollama serve
          </Text>
        </View>
      )}

      <ScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        contentContainerStyle={[
          st.scrollContent,
          mensajes.length === 0 && st.scrollEmpty,
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >

        {/* ── Estado vacío con sugerencias ── */}
        {mensajes.length === 0 && (
          <View style={st.emptyWrap}>

            {/* Icono y título */}
            <View style={st.iaIconBox}>
              <Ionicons name="sparkles" size={28} color="#004481" />
            </View>
            <Text style={st.emptyTitle}>Asistente BBVA</Text>

            {/* Badge de estado de Ollama */}
            {iaDisponible === true && (
              <View style={st.badgeOk}>
                <View style={st.badgeDot} />
                <Text style={st.badgeOkTxt}>
                  Conectado{modelo ? ` · ${modelo}` : ''}
                </Text>
              </View>
            )}
            {iaDisponible === null && (
              <View style={st.badgeChecking}>
                <ActivityIndicator size="small" color="#004481" style={{ marginRight: 6 }} />
                <Text style={st.badgeCheckingTxt}>Conectando...</Text>
              </View>
            )}

            <Text style={st.emptySub}>
              Tengo acceso a los datos históricos del sistema (2022–2024).{'\n'}
              Pregúntame sobre clientes, fraude, préstamos, pagos o cualquier métrica.
            </Text>

            {/* Grid de sugerencias */}
            <View style={st.sugGrid}>
              {SUGERENCIAS.map((sg, i) => (
                <TouchableOpacity
                  key={i}
                  style={st.sugBtn}
                  onPress={() => enviar(sg.texto)}
                  activeOpacity={0.75}
                >
                  <Ionicons name={sg.icono as any} size={15} color="#004481" style={{ flexShrink: 0 }} />
                  <Text style={st.sugTxt}>{sg.texto}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* ── Mensajes ── */}
        {mensajes.map((msg, i) => (
          <View
            key={i}
            style={[
              st.bubbleWrap,
              msg.role === 'user' ? st.bubbleWrapUser : st.bubbleWrapAI,
            ]}
          >
            {msg.role === 'assistant' && (
              <View style={st.avatarIA}>
                <Ionicons name="sparkles" size={13} color="#004481" />
              </View>
            )}
            <View style={[st.bubble, msg.role === 'user' ? st.bubbleUser : st.bubbleAI]}>
              {msg.role === 'assistant' && (
                <Text style={st.aiBadgeTxt}>BBVA IA</Text>
              )}
              <Text style={msg.role === 'user' ? st.txtUser : st.txtAI}>
                {msg.content}
              </Text>
            </View>
          </View>
        ))}

        {/* Indicador de carga */}
        {cargando && (
          <View style={[st.bubbleWrap, st.bubbleWrapAI]}>
            <View style={st.avatarIA}>
              <Ionicons name="sparkles" size={13} color="#004481" />
            </View>
            <View style={[st.bubble, st.bubbleAI, st.bubbleTyping]}>
              <ActivityIndicator size="small" color="#004481" />
              <Text style={st.typingTxt}>Analizando datos históricos...</Text>
            </View>
          </View>
        )}

        <View style={{ height: 16 }} />
      </ScrollView>

      {/* ── Input bar ── */}
      <View style={[st.inputRow, { marginBottom: kbHeight }]}>
        {mensajes.length > 0 && (
          <TouchableOpacity style={st.clearBtn} onPress={() => setMensajes([])}>
            <Ionicons name="trash-outline" size={18} color="#737781" />
          </TouchableOpacity>
        )}
        <TextInput
          style={st.input}
          value={input}
          onChangeText={setInput}
          placeholder="Pregunta sobre datos históricos o actuales..."
          placeholderTextColor="#aaa"
          multiline
          maxLength={500}
          editable={!cargando && iaDisponible === true}
          onSubmitEditing={() => enviar()}
          returnKeyType="send"
          blurOnSubmit
        />
        <TouchableOpacity
          style={[
            st.sendBtn,
            (!input.trim() || cargando || iaDisponible !== true) && st.sendBtnOff,
          ]}
          onPress={() => enviar()}
          disabled={!input.trim() || cargando || iaDisponible !== true}
        >
          {cargando
            ? <ActivityIndicator size="small" color="#fff" />
            : <Ionicons name="send" size={18} color="#fff" />}
        </TouchableOpacity>
      </View>

    </View>
  );
}

// ── Estilos ───────────────────────────────────────────────────────────────────

const st = StyleSheet.create({
  bannerError: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#fff4f4', paddingHorizontal: 16, paddingVertical: 8,
    borderBottomWidth: 1, borderBottomColor: '#fcc',
  },
  bannerErrorTxt: { fontSize: 11, color: '#ba1a1a', flex: 1, fontWeight: '600' },

  scrollContent: { padding: 16, flexGrow: 1 },
  scrollEmpty:   { justifyContent: 'flex-start' },

  // ── Estado vacío ──
  emptyWrap: { alignItems: 'center', paddingVertical: 8 },
  iaIconBox: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: '#e8effa',
    alignItems: 'center', justifyContent: 'center', marginBottom: 10,
  },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: '#002e5a', marginBottom: 8 },

  badgeOk: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#e6f7f0', paddingHorizontal: 14, paddingVertical: 5,
    borderRadius: 20, marginBottom: 12, borderWidth: 1, borderColor: '#b7ebd7',
  },
  badgeDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#00a278' },
  badgeOkTxt: { fontSize: 11, color: '#00a278', fontWeight: '700' },

  badgeChecking: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#f0f2f5', paddingHorizontal: 14, paddingVertical: 5,
    borderRadius: 20, marginBottom: 12,
  },
  badgeCheckingTxt: { fontSize: 11, color: '#737781' },

  emptySub: {
    fontSize: 13, color: '#737781', textAlign: 'center',
    lineHeight: 20, marginBottom: 20, paddingHorizontal: 16,
  },

  // ── Sugerencias ──
  sugGrid: { width: '100%', gap: 8 },
  sugBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#fff', borderRadius: 12, padding: 13,
    borderWidth: 1, borderColor: 'rgba(0,68,129,0.15)',
  },
  sugTxt: { fontSize: 13, color: '#004481', fontWeight: '600', flex: 1 },

  // ── Burbujas ──
  bubbleWrap:     { flexDirection: 'row', marginBottom: 12, alignItems: 'flex-end' },
  bubbleWrapUser: { justifyContent: 'flex-end' },
  bubbleWrapAI:   { justifyContent: 'flex-start', gap: 8 },
  avatarIA: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: '#e8effa',
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  bubble:       { borderRadius: 16, padding: 12, maxWidth: '82%' },
  bubbleUser:   { backgroundColor: '#004481', borderBottomRightRadius: 4 },
  bubbleAI: {
    backgroundColor: '#fff', borderBottomLeftRadius: 4,
    borderWidth: 1, borderColor: 'rgba(194,198,210,0.4)',
  },
  bubbleTyping: {
    flexDirection: 'row', alignItems: 'center',
    gap: 8, paddingVertical: 10,
  },
  aiBadgeTxt: {
    fontSize: 9, fontWeight: '800', color: '#004481',
    letterSpacing: 0.8, marginBottom: 4,
  },
  txtUser:   { color: '#fff',    fontSize: 14, lineHeight: 21 },
  txtAI:     { color: '#1a1c1c', fontSize: 14, lineHeight: 21 },
  typingTxt: { fontSize: 12, color: '#737781', fontStyle: 'italic' },

  // ── Input ──
  inputRow: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 8,
    padding: 12, backgroundColor: '#fff',
    borderTopWidth: 1, borderTopColor: 'rgba(194,198,210,0.3)',
  },
  clearBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: '#f4f6fa',
    alignItems: 'center', justifyContent: 'center',
  },
  input: {
    flex: 1, backgroundColor: '#f4f6fa', borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 10,
    fontSize: 14, color: '#1a1c1c', maxHeight: 100,
  },
  sendBtn: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: '#004481',
    alignItems: 'center', justifyContent: 'center',
  },
  sendBtnOff: { backgroundColor: '#b0c8e8' },
});