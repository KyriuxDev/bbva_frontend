// src/features/dashboard/components/ChatIA.tsx
import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  ScrollView, ActivityIndicator, KeyboardAvoidingView,
  Platform, StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '@/src/lib/axios';

interface Mensaje {
  role:    'user' | 'assistant';
  content: string;
}

const SUGERENCIAS = [
  '¿Cuál es el estado general hoy?',
  '¿Qué indicador está más crítico?',
  'Resume el análisis de fraude',
  '¿Qué sucursal debo priorizar?',
];

export function ChatIA() {
  const [mensajes,     setMensajes]     = useState<Mensaje[]>([]);
  const [input,        setInput]        = useState('');
  const [cargando,     setCargando]     = useState(false);
  const [iaDisponible, setIaDisponible] = useState<boolean | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    api.get('/ai/status')
      .then(({ data }) => setIaDisponible(data.disponible))
      .catch(() => setIaDisponible(false));
  }, []);

  const enviar = async () => {
    const texto = input.trim();
    if (!texto || cargando) return;

    const nuevosMensajes: Mensaje[] = [
      ...mensajes,
      { role: 'user', content: texto },
    ];
    setMensajes(nuevosMensajes);
    setInput('');
    setCargando(true);

    try {
      const { data } = await api.post('/ai/chat', {
        mensaje:   texto,
        historial: mensajes.slice(-6),
      });
      setMensajes(prev => [
        ...prev,
        { role: 'assistant', content: data.respuesta },
      ]);
    } catch {
      setMensajes(prev => [
        ...prev,
        { role: 'assistant', content: '⚠️ Error al conectar con la IA. Verifica que Ollama esté corriendo.' },
      ]);
    } finally {
      setCargando(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 150);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* Solo el error va fuera del scroll — siempre visible */}
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
        style={st.scroll}
        contentContainerStyle={[
          st.scrollContent,
          mensajes.length === 0 && st.scrollContentEmpty,
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        onContentSizeChange={() =>
          scrollRef.current?.scrollToEnd({ animated: true })
        }
      >
        {/* ══ ESTADO VACÍO ══ */}
        {mensajes.length === 0 && (
          <View style={st.emptyState}>

            {/* Banner de estado como píldora */}
            {iaDisponible === true && (
              <View style={st.bannerOkInline}>
                <Ionicons name="checkmark-circle-outline" size={13} color="#00a278" />
                <Text style={st.bannerOkTxt}>IA conectada · llama3.1:8b</Text>
              </View>
            )}
            {iaDisponible === null && (
              <View style={st.bannerCheckingInline}>
                <ActivityIndicator size="small" color="#004481" />
                <Text style={st.bannerCheckingTxt}>Conectando...</Text>
              </View>
            )}

            {/* Ícono y título */}
            <View style={st.iaIconBox}>
              <Ionicons name="sparkles" size={28} color="#004481" />
            </View>
            <Text style={st.emptyTitle}>Asistente BBVA</Text>
            <Text style={st.emptySub}>
              Pregúntame sobre KPIs, fraude, clientes o cualquier métrica del dashboard.
            </Text>

            {/* Sugerencias */}
            <View style={st.sugerenciasGrid}>
              {SUGERENCIAS.map((s, i) => (
                <TouchableOpacity
                  key={i}
                  style={st.sugerencia}
                  onPress={() => setInput(s)}
                >
                  <Ionicons name="chatbubble-outline" size={13} color="#004481" />
                  <Text style={st.sugerenciaTxt}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* ══ BURBUJAS DE CONVERSACIÓN ══ */}
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
            <View style={[
              st.bubble,
              msg.role === 'user' ? st.bubbleUser : st.bubbleAI,
            ]}>
              {msg.role === 'assistant' && (
                <Text style={st.aiBadgeTxt}>BBVA IA</Text>
              )}
              <Text style={msg.role === 'user' ? st.txtUser : st.txtAI}>
                {msg.content}
              </Text>
            </View>
          </View>
        ))}

        {/* ══ INDICADOR DE ESCRITURA ══ */}
        {cargando && (
          <View style={[st.bubbleWrap, st.bubbleWrapAI]}>
            <View style={st.avatarIA}>
              <Ionicons name="sparkles" size={13} color="#004481" />
            </View>
            <View style={[st.bubble, st.bubbleAI, st.bubbleTyping]}>
              <ActivityIndicator size="small" color="#004481" />
              <Text style={st.typingTxt}>Analizando datos...</Text>
            </View>
          </View>
        )}

        <View style={{ height: 8 }} />
      </ScrollView>

      {/* ══ INPUT ══ */}
      <View style={st.inputRow}>
        {mensajes.length > 0 && (
          <TouchableOpacity
            style={st.clearBtn}
            onPress={() => setMensajes([])}
          >
            <Ionicons name="trash-outline" size={18} color="#737781" />
          </TouchableOpacity>
        )}
        <TextInput
          style={st.input}
          value={input}
          onChangeText={setInput}
          placeholder="Pregunta sobre el dashboard..."
          placeholderTextColor="#aaa"
          multiline
          maxLength={500}
          editable={!cargando && iaDisponible === true}
        />
        <TouchableOpacity
          style={[
            st.sendBtn,
            (!input.trim() || cargando || !iaDisponible) && st.sendBtnDisabled,
          ]}
          onPress={enviar}
          disabled={!input.trim() || cargando || iaDisponible !== true}
        >
          {cargando
            ? <ActivityIndicator size="small" color="#fff" />
            : <Ionicons name="send" size={18} color="#fff" />
          }
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const st = StyleSheet.create({

  // ── Banners ────────────────────────────────────────────────
  bannerError: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#fff4f4', paddingHorizontal: 16, paddingVertical: 8,
    borderBottomWidth: 1, borderBottomColor: '#fcc',
  },
  bannerErrorTxt: {
    fontSize: 11, color: '#ba1a1a', flex: 1, fontWeight: '600',
  },

  // Banners inline (dentro del scroll, estado vacío)
  bannerOkInline: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#e6f7f0', paddingHorizontal: 14, paddingVertical: 6,
    borderRadius: 20, marginBottom: 20,
    borderWidth: 1, borderColor: '#b7ebd7',
  },
  bannerOkTxt: {
    fontSize: 11, color: '#00a278', fontWeight: '700',
  },
  bannerCheckingInline: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#f0f2f5', paddingHorizontal: 14, paddingVertical: 6,
    borderRadius: 20, marginBottom: 20,
  },
  bannerCheckingTxt: {
    fontSize: 11, color: '#737781',
  },

  // ── Scroll ─────────────────────────────────────────────────
  scroll: {
    flex: 1, backgroundColor: '#f4f6fa',
  },
  scrollContent: {
    padding: 16, flexGrow: 1,
  },
  scrollContentEmpty: {
    justifyContent: 'flex-start',
    paddingTop: 32,
  },

  // ── Estado vacío ───────────────────────────────────────────
  emptyState: {
    alignItems: 'center', paddingVertical: 8,
  },
  iaIconBox: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: '#e8effa',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 20, fontWeight: '800', color: '#002e5a', marginBottom: 6,
  },
  emptySub: {
    fontSize: 13, color: '#737781', textAlign: 'center',
    lineHeight: 20, marginBottom: 24,
    paddingHorizontal: 32, width: '100%',
  },
  sugerenciasGrid: {
    width: '100%', gap: 8,
  },
  sugerencia: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#fff', borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: 'rgba(0,68,129,0.15)',
  },
  sugerenciaTxt: {
    fontSize: 13, color: '#004481', fontWeight: '600', flex: 1,
  },

  // ── Burbujas ───────────────────────────────────────────────
  bubbleWrap: {
    flexDirection: 'row', marginBottom: 12, alignItems: 'flex-end',
  },
  bubbleWrapUser: {
    justifyContent: 'flex-end',
  },
  bubbleWrapAI: {
    justifyContent: 'flex-start', gap: 8,
  },
  avatarIA: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: '#e8effa',
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  bubble: {
    borderRadius: 16, padding: 12, maxWidth: '80%',
  },
  bubbleUser: {
    backgroundColor: '#004481',
    borderBottomRightRadius: 4,
  },
  bubbleAI: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 4,
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
  txtUser: {
    color: '#fff', fontSize: 14, lineHeight: 21,
  },
  txtAI: {
    color: '#1a1c1c', fontSize: 14, lineHeight: 21,
  },
  typingTxt: {
    fontSize: 12, color: '#737781', fontStyle: 'italic',
  },

  // ── Input ──────────────────────────────────────────────────
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
  sendBtnDisabled: {
    backgroundColor: '#b0c8e8',
  },
});