import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from '@/src/store/auth.store';

const queryClient = new QueryClient();

function AuthGuard() {
  const router   = useRouter();
  const segments = useSegments();
  const { isAuthenticated, isHydrated } = useAuthStore();

  useEffect(() => {
    if (!isHydrated) return;

    const inAuth = segments[0] === '(auth)';
    const inMain = segments[0] === '(main)';

    // Solo actúa si ya salimos del splash
    if (!inAuth && !inMain) return;

    if (!isAuthenticated && inMain) router.replace('/(auth)/login');
    if (isAuthenticated  && inAuth) router.replace('/(main)/dashboard');
  }, [isAuthenticated, isHydrated, segments]);

  return null;
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthGuard />
      <Stack screenOptions={{ headerShown: false }} />
    </QueryClientProvider>
  );
}
