import React from 'react';
import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppShell } from '../components/AppShell';
import { PressableCard } from '../components/UI';
import { getRoleTone, useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

const CREATE_ITEMS = {
  PL: [
    { title: 'Courses', screen: 'Courses', icon: 'book-outline' },
    { title: 'Course Outlines', screen: 'CourseOutlines', icon: 'attach-outline' },
    { title: 'Reports', screen: 'Reports', icon: 'document-text-outline' },
  ],
  PRL: [
    { title: 'Attendance', screen: 'Attendance', icon: 'calendar-outline' },
    { title: 'Reports', screen: 'Reports', icon: 'document-text-outline' },
  ],
  Lecturer: [
    { title: 'Submit Report', screen: 'ReportForm', icon: 'document-text-outline' },
    { title: 'Attendance', screen: 'Attendance', icon: 'calendar-outline' },
  ],
};

export default function CreateHubScreen({ navigation }) {
  const { theme } = useTheme();
  const { user } = useAuth();
  const roleTone = getRoleTone(user?.role);
  const items = CREATE_ITEMS[user?.role] || [];

  return (
    <AppShell
      navigation={navigation}
      activeTab="create"
      title="Create"
      headerBadge={user?.role || 'User'}
      accent={roleTone.bg}
    >
      <View
        style={{
          marginTop: 18,
          backgroundColor: theme.bgCard,
          borderRadius: 28,
          padding: 18,
          borderWidth: 1,
          borderColor: theme.border,
          marginBottom: 16,
        }}
      >
        <Text style={{ color: theme.text, fontSize: 23, fontWeight: '900' }}>Create</Text>
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -5 }}>
        {items.map(item => (
          <PressableCard key={item.title} onPress={() => navigation.navigate(item.screen)} style={{ width: '50%', paddingHorizontal: 5, marginBottom: 10 }}>
            <View
              style={{
                backgroundColor: roleTone.surface,
                borderRadius: 26,
                padding: 16,
                minHeight: 144,
                borderWidth: 2,
                borderColor: roleTone.tint,
              }}
            >
              <View
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 18,
                  backgroundColor: roleTone.bg,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 14,
                }}
              >
                <Ionicons name={item.icon} size={24} color={roleTone.text} />
              </View>
              <Text style={{ color: theme.text, fontWeight: '900', fontSize: 16 }}>{item.title}</Text>
            </View>
          </PressableCard>
        ))}
      </View>
    </AppShell>
  );
}
