import { Tabs, useRouter } from 'expo-router';
import { Text, View, TouchableOpacity } from 'react-native';
import { Colors, TAB_COLORS } from '../../src/constants/theme';

// Minimal single-char glyphs — no emoji overload
const TAB_GLYPHS: Record<string, string> = {
  Dashboard: '⊹',
  Tasks:     '◻',
  Fitness:   '◈',
  Learning:  '◎',
  Skills:    '◇',
  Settings:  '⊙',
};

const TAB_ROUTES: Record<string, string> = {
  Dashboard: 'index',
  Tasks:     'tasks',
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
      width: 36,
      height: 28,
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      {focused && (
        <View style={{
          position: 'absolute',
          bottom: 0,
          width: 16,
          height: 2,
          borderRadius: 1,
          backgroundColor: color,
        }} />
      )}
      <Text style={{
        fontSize: 16,
        color: focused ? color : Colors.textMuted,
        lineHeight: 20,
      }}>
        {TAB_GLYPHS[label] || '·'}
      </Text>
    </View>
  );
}

function TimerButton() {
  const router = useRouter();
  return (
    <TouchableOpacity
      onPress={() => router.push('/timer')}
      style={{
        marginRight: 14,
        width: 32,
        height: 32,
        borderRadius: 8,
        backgroundColor: Colors.surface,
        borderWidth: 1,
        borderColor: Colors.border,
        alignItems: 'center',
        justifyContent: 'center',
      }}
      activeOpacity={0.65}
    >
      <Text style={{ fontSize: 14 }}>⏱</Text>
    </TouchableOpacity>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: Colors.bg, elevation: 0, shadowOpacity: 0 },
        headerTintColor: Colors.textSecondary,
        headerTitleStyle: { fontWeight: '600', fontSize: 15, letterSpacing: -0.2, color: Colors.text },
        headerRight: () => <TimerButton />,
        tabBarStyle: {
          backgroundColor: Colors.card,
          borderTopColor: Colors.border,
          borderTopWidth: 1,
          height: 68,
          paddingTop: 8,
          paddingBottom: 8,
        },
        tabBarActiveTintColor: Colors.text,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarLabelStyle: { fontSize: 9, fontWeight: '500', marginTop: 2, letterSpacing: 0.3 },
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
        name="tasks"
        options={{
          title: 'Tasks',
          tabBarIcon: ({ focused }) => <TabIcon label="Tasks" focused={focused} />,
          tabBarActiveTintColor: TAB_COLORS.tasks,
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
      {/* Hidden routes */}
      <Tabs.Screen name="analytics" options={{ href: null }} />
      <Tabs.Screen name="journal" options={{ href: null }} />
      <Tabs.Screen name="finance" options={{ href: null }} />
      <Tabs.Screen name="schedule" options={{ href: null }} />
    </Tabs>
  );
}
