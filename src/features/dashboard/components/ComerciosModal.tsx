import React, { useState, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, Modal,
  ScrollView, TextInput, FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ComercioCard } from './ComercioCard';
import type { FraudeComercio } from '@/src/features/dashboard/types';
import { fmt, fmtMXN } from '@/src/features/dashboard/helpers/format';

interface Props {
  data:    FraudeComercio[];
  visible: boolean;
  onClose: () => void;
}

export function ComerciosModal({ data, visible, onClose }: Props) {
  const [search,          setSearch]          = useState('');
  const [categoriaActiva, setCategoriaActiva] = useState<string | null>(null);
  const [expandedId,      setExpandedId]      = useState<number | null>(null);

  const categorias = useMemo(() =>
    ['Todas', ...Array.from(new Set(data.map(d => d.categoria)))],
    [data]
  );

  const filtrados = useMemo(() => {
    return data.filter(d => {
      const matchSearch    = d.comercio.toLowerCase().includes(search.toLowerCase());
      const matchCategoria = !categoriaActiva || categoriaActiva === 'Todas'
        ? true : d.categoria === categoriaActiva;
      return matchSearch && matchCategoria;
    });
  }, [data, search, categoriaActiva]);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: '#f4f6fa' }}>

        {/* Header */}
        <View style={{
          backgroundColor: '#fff', paddingHorizontal: 20,
          paddingTop: 20, paddingBottom: 12,
          borderBottomWidth: 1, borderBottomColor: 'rgba(194,198,210,0.3)',
        }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <View>
              <Text style={{ fontSize: 18, fontWeight: '800', color: '#002e5a' }}>
                Comercios con Fraude
              </Text>
              <Text style={{ fontSize: 12, color: '#737781', marginTop: 2 }}>
                {filtrados.length} de {data.length} comercios
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#f0f2f5', alignItems: 'center', justifyContent: 'center' }}
            >
              <Ionicons name="close" size={20} color="#737781" />
            </TouchableOpacity>
          </View>

          {/* Buscador */}
          <View style={{
            flexDirection: 'row', alignItems: 'center', gap: 10,
            backgroundColor: '#f4f6fa', borderRadius: 12,
            paddingHorizontal: 14, paddingVertical: 10, marginBottom: 12,
          }}>
            <Ionicons name="search-outline" size={16} color="#737781" />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Buscar comercio..."
              placeholderTextColor="#aaa"
              style={{ flex: 1, fontSize: 14, color: '#1a1c1c' }}
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')}>
                <Ionicons name="close-circle" size={16} color="#aaa" />
              </TouchableOpacity>
            )}
          </View>

          {/* Filtro por categoría */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 4 }}>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {categorias.map((cat, i) => {
                const isActive = categoriaActiva === cat || (!categoriaActiva && cat === 'Todas');
                return (
                  <TouchableOpacity
                    key={i}
                    onPress={() => setCategoriaActiva(cat === 'Todas' ? null : cat)}
                    style={{
                      paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20,
                      backgroundColor: isActive ? '#004481' : '#f0f2f5',
                    }}
                  >
                    <Text style={{ fontSize: 12, fontWeight: '700', color: isActive ? '#fff' : '#5d5f5f' }}>
                      {cat}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        </View>

        {/* Lista */}
        {filtrados.length > 0 ? (
          <FlatList
            data={filtrados}
            keyExtractor={(_, i) => String(i)}
            contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
            renderItem={({ item, index }) => (
              <ComercioCard
                item={item} idx={index}
                expandedId={expandedId} setExpandedId={setExpandedId}
              />
            )}
          />
        ) : (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <Ionicons name="search-outline" size={40} color="#c2c6d2" />
            <Text style={{ fontSize: 14, fontWeight: '600', color: '#737781' }}>
              Sin resultados para "{search}"
            </Text>
          </View>
        )}
      </View>
    </Modal>
  );
}