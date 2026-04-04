import { Tabs } from 'expo-router';
import { Text, View } from 'react-native';
import { Colors } from '../../src/constants/theme';

function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  const icons: Record<string, string> = {
    Dashboard: '⊞',
    Schedule: '◫',
    Fitness: '◈',
    Learning: '◉',
    Skills: '◎',
    Journal: '▦',
    Finance: '◧',
    Analytics: '▤',
    Settings: '⊙',
  };
  return (
    <View style={{
      width: 36,
      height: 36,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: focused ? 'rgba(99,102,241,0.15)' : 'transparent',
    }}>
      <Text style={{
        fontSize: 18,
        color: focused ? Colors.accentLight : Colors.textMuted,
      }}>
        {icons[label] || '•'}
      </Text>
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: Colors.bg, elevation: 0, shadowOpacity: 0 },
        headerTintColor: Colors.accentLight,
        headerTitleStyle: { fontWeight: '800', fontSize: 16, letterSpacing: -0.3, color: Colors.accent },
        tabBarStyle: {
          backgroundColor: 'rgba(19,19,21,0.95)',
          borderTopColor: 'rgba(255,255,255,0.05)',
          borderTopWidth: 1,
          height: 74,
          paddingTop: 8,
        },
        tabBarActiveTintColor: Colors.accentLight,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarLabelStyle: { fontSize: 9, fontWeight: '700', marginTop: 2, letterSpacing: 0.3 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ focused }) => <TabIcon label="Dashboard" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="schedule"
        options={{
          title: 'Schedule',
          tabBarIcon: ({ focused }) => <TabIcon label="Schedule" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="fitness"
        options={{
          title: 'Fitness',
          tabBarIcon: ({ focused }) => <TabIcon label="Fitness" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="learning"
        options={{
          title: 'Learning',
          tabBarIcon: ({ focused }) => <TabIcon label="Learning" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="skills"
        options={{
          title: 'Skills',
          tabBarIcon: ({ focused }) => <TabIcon label="Skills" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="journal"
        options={{
          title: 'Journal',
          tabBarIcon: ({ focused }) => <TabIcon label="Journal" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="finance"
        options={{
          title: 'Finance',
          tabBarIcon: ({ focused }) => <TabIcon label="Finance" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="analytics"
        options={{
          title: 'Analytics',
          tabBarIcon: ({ focused }) => <TabIcon label="Analytics" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ focused }) => <TabIcon label="Settings" focused={focused} />,
        }}
      />
    </Tabs>
  );
}
