import { useEffect, useRef } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from '@/src/store/auth.store';

const queryClient = new QueryClient();

function AuthGuard() {
  const router   = useRouter();
  const segments = useSegments();
  const { isAuthenticated, isHydrated, isLocked } = useAuthStore();
  const navigating = useRef(false);

  useEffect(() => {
    if (!isHydrated)        return;
    if (navigating.current) return;

    const inAuth = segments[0] === '(auth)';
    const inMain = segments[0] === '(main)';
    if (!inAuth && !inMain) return;

    let target: string | null = null;

    if (isAuthenticated && inAuth)           target = '/(main)/dashboard'; // autenticado → dashboard
    else if (!isAuthenticated && inMain && !isLocked) target = '/(auth)/login';    // sin sesión → login
    else if (isLocked && inMain)             target = '/(auth)/login';    // bloqueado → login

    if (target) {
      navigating.current = true;
      router.replace(target as any);
      setTimeout(() => { navigating.current = false; }, 1000);
    }
  }, [isAuthenticated, isHydrated, isLocked, segments]);

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