import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import 'react-native-reanimated';
import { initDatabase } from '@/db/database';
import { AppThemeProvider, useAppTheme } from '@/contexts/theme-context';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const unstable_settings = {
  anchor: '(tabs)',
};

function LayoutInterno() {
  const { modo, cores, pronto } = useAppTheme();

  if (!pronto) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: cores.fundo }}>
        <ActivityIndicator size="large" color={cores.primaria} />
      </View>
    );
  }

  return (
    <ThemeProvider value={modo === 'escuro' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
        <Stack.Screen name="loja/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="categorias" options={{ headerShown: false }} />
        <Stack.Screen name="subcategorias/[categoriaId]" options={{ headerShown: false }} />
        <Stack.Screen name="produtos-ordem/[subcategoriaId]" options={{ headerShown: false }} />
      </Stack>
      <StatusBar style={modo === 'escuro' ? 'light' : 'dark'} />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  const [dbReady, setDbReady] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);

  useEffect(() => {
    initDatabase()
      .then(() => setDbReady(true))
      .catch((err) => setDbError(String(err)));
  }, []);

  if (dbError) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <StatusBar style="auto" />
        <ActivityIndicator size="large" color="red" />
      </View>
    );
  }

  if (!dbReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <AppThemeProvider>
      <LayoutInterno />
    </AppThemeProvider>
  );
}