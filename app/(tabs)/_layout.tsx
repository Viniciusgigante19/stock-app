import { Tabs } from 'expo-router';
import React from 'react';
import { View } from 'react-native';
import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAppTheme } from '@/contexts/theme-context';

export default function TabLayout() {
  const { cores, modo } = useAppTheme();

  const corIconeAtivo = '#FFFFFF';
  const corFundoIconeAtivo = modo === 'escuro' ? cores.primaria : '#14293A';

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarActiveTintColor: cores.primaria,

        tabBarStyle: {
          height: 64,
          paddingTop: 8,
          paddingBottom: 8,
          backgroundColor: cores.fundoCartao,
          borderTopWidth: 1,
          borderTopColor: cores.borda,
        },

        tabBarItemStyle: {
          justifyContent: 'center',
          alignItems: 'center',
        },

        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Lojas',
          tabBarIcon: ({ focused }) => (
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: focused ? corFundoIconeAtivo : 'transparent',
              }}
            >
              <IconSymbol
                size={20}
                name="house.fill"
                color={focused ? corIconeAtivo : cores.textoSecundario}
              />
            </View>
          ),
        }}
      />

      <Tabs.Screen
        name="explore"
        options={{
          title: 'Produtos',
          tabBarIcon: ({ focused }) => (
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: focused ? corFundoIconeAtivo : 'transparent',
              }}
            >
              <IconSymbol
                size={20}
                name="paperplane.fill"
                color={focused ? corIconeAtivo : cores.textoSecundario}
              />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}