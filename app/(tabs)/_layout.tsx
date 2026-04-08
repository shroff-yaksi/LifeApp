import { Tabs } from 'expo-router';
import { Text, View } from 'react-native';
import { Colors, TAB_COLORS } from '../../src/constants/theme';

const TAB_EMOJIS: Record<string, string> = {
  Dashboard: '⚡',
  Schedule:  '📅',
  Fitness:   '💪',
  Learning:  '📚',
  Skills:    '🎸',
  Settings:  '⚙️',
};

const TAB_ROUTES: Record<string, string> = {
  Dashboard: 'index',
  Schedule:  'schedule',
  Fitness:   'fitness',
  Learning:  'learning',
  Skills:    'skills',
  Settings:  'settings',
};

function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  const route = TAB_ROUTES[label];
  const color = TAB_COLORS[route] || Colors.accent;
  return (
    <View style={{
      width: 40,
      height: 40,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: focused ? color + '20' : 'transparent',
    }}>
      <Text style={{ fontSize: 19 }}>{TAB_EMOJIS[label] || '•'}</Text>
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: Colors.bg, elevation: 0, shadowOpacity: 0 },
        headerTintColor: Colors.accentLight,
        headerTitleStyle: { fontWeight: '800', fontSize: 17, letterSpacing: -0.3, color: Colors.text },
        tabBarStyle: {
          backgroundColor: Colors.card,
          borderTopColor: Colors.border,
          borderTopWidth: 1,
          height: 78,
          paddingTop: 6,
          paddingBottom: 6,
        },
        tabBarActiveTintColor: Colors.text,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarLabelStyle: { fontSize: 9, fontWeight: '700', marginTop: 1, letterSpacing: 0.2 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ focused }) => <TabIcon label="Dashboard" focused={focused} />,
          tabBarActiveTintColor: TAB_COLORS.index,
        }}
      />
      <Tabs.Screen
        name="schedule"
        options={{
          title: 'Schedule',
          tabBarIcon: ({ focused }) => <TabIcon label="Schedule" focused={focused} />,
          tabBarActiveTintColor: TAB_COLORS.schedule,
        }}
      />
      <Tabs.Screen
        name="fitness"
        options={{
          title: 'Fitness',
          tabBarIcon: ({ focused }) => <TabIcon label="Fitness" focused={focused} />,
          tabBarActiveTintColor: TAB_COLORS.fitness,
        }}
      />
      <Tabs.Screen
        name="learning"
        options={{
          title: 'Learning',
          tabBarIcon: ({ focused }) => <TabIcon label="Learning" focused={focused} />,
          tabBarActiveTintColor: TAB_COLORS.learning,
        }}
      />
      <Tabs.Screen
        name="skills"
        options={{
          title: 'Skills',
          tabBarIcon: ({ focused }) => <TabIcon label="Skills" focused={focused} />,
          tabBarActiveTintColor: TAB_COLORS.skills,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ focused }) => <TabIcon label="Settings" focused={focused} />,
          tabBarActiveTintColor: TAB_COLORS.settings,
        }}
      />
      {/* Hidden routes — not in tab bar */}
      <Tabs.Screen name="analytics" options={{ href: null }} />
      <Tabs.Screen name="journal" options={{ href: null }} />
      <Tabs.Screen name="finance" options={{ href: null }} />
    </Tabs>
  );
}
