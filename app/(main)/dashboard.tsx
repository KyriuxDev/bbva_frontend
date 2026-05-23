import { View, Text } from 'react-native';
export default function Dashboard() {
  return (
    <View style={{ flex: 1, backgroundColor: '#004481', alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: '#2DCCCD', fontSize: 24, fontWeight: 'bold' }}>✅ Login exitoso</Text>
      <Text style={{ color: 'white', marginTop: 8 }}>Dashboard próximamente</Text>
    </View>
  );
}
