import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/src/store/auth.store';

export default function Dashboard() {
  const router = useRouter();
  const logout = useAuthStore((s) => s.logout);

  const handleLogout = async () => {
    await logout();
    router.replace('/(auth)/welcome');
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#004481', alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: 'white', marginTop: 8 }}>Dashboard próximamente</Text>

      <TouchableOpacity
        onPress={handleLogout}
        style={{ marginTop: 32, backgroundColor: '#FFFFFF', borderRadius: 8, paddingHorizontal: 24, paddingVertical: 12 }}
      >
        <Text style={{ color: '#004481', fontWeight: '800' }}>Cerrar sesión</Text>
      </TouchableOpacity>
    </View>
  );
}