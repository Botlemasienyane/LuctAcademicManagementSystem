import React, { useMemo, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppShell } from '../components/AppShell';
import { SearchBar } from '../components/UI';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

const ROLE_MODULES = {
  Student: [
    { title: 'Insights', screen: 'Monitoring', note: 'View attendance by course.' },
    { title: 'Rating', screen: 'Rating', note: 'Submit lecturer ratings and comments.' },
    { title: 'Attendance', screen: 'Attendance', note: 'Review attendance records.' },
    { title: 'Classes', screen: 'Classes', note: 'See your class information.' },
  ],
  Lecturer: [
    { title: 'Classes', screen: 'Classes', note: 'Open assigned classes.' },
    { title: 'Reports', screen: 'Reports', note: 'Read, filter, and export reports.' },
    { title: 'Submit Report', screen: 'ReportForm', note: 'Create a new lecture report.' },
    { title: 'Insights', screen: 'Monitoring', note: 'View attendance by course.' },
    { title: 'Rating', screen: 'Rating', note: 'See student ratings and comments.' },
    { title: 'Attendance', screen: 'Attendance', note: 'Capture or review attendance.' },
  ],
  PRL: [
    { title: 'Courses', screen: 'Courses', note: 'View programme courses.' },
    { title: 'Lectures', screen: 'Lectures', note: 'View lecture schedules.' },
    { title: 'Reports', screen: 'Reports', note: 'Review lecturer reports and give feedback.' },
    { title: 'Insights', screen: 'Monitoring', note: 'View attendance by course.' },
    { title: 'Classes', screen: 'Classes', note: 'Track classes under your scope.' },
    { title: 'Rating', screen: 'Rating', note: 'View lecturer ratings.' },
  ],
  PL: [
    { title: 'Programmes', screen: 'ProgrammeList', note: 'Browse programme structure.' },
    { title: 'Courses', screen: 'Courses', note: 'Manage course allocation.' },
    { title: 'Lectures', screen: 'Lectures', note: 'View lecture schedules.' },
    { title: 'Reports', screen: 'Reports', note: 'Review reports and feedback.' },
    { title: 'Insights', screen: 'Monitoring', note: 'View attendance by course.' },
    { title: 'Rating', screen: 'Rating', note: 'View lecturer ratings.' },
    { title: 'Classes', screen: 'Classes', note: 'Open class lists.' },
  ],
  FMG: [
    { title: 'Faculties', screen: 'Faculties', note: 'Open faculty structure.' },
    { title: 'Staff', screen: 'StaffList', note: 'View staff and leadership.' },
    { title: 'Reports', screen: 'Reports', note: 'Open the report dashboard.' },
    { title: 'Insights', screen: 'Monitoring', note: 'View attendance by course.' },
    { title: 'Classes', screen: 'Classes', note: 'View all classes.' },
    { title: 'Rating', screen: 'Rating', note: 'View lecturer ratings.' },
  ],
};

const cardColors = ['#EEF6FF', '#FFF1E8', '#F0ECFF', '#E8F8F0'];
const cardInks = ['#2B6EF2', '#F56A37', '#7C52E8', '#2BAF6A'];

export default function ModulesScreen({ navigation }) {
  const { theme } = useTheme();
  const { user } = useAuth();
  const [search, setSearch] = useState('');

  const modules = useMemo(() => {
    const roleModules = ROLE_MODULES[user?.role] || ROLE_MODULES.Student;
    if (!search) return roleModules;
    const q = search.toLowerCase();
    return roleModules.filter(module => `${module.title} ${module.note}`.toLowerCase().includes(q));
  }, [search, user?.role]);

  return (
    <AppShell
      navigation={navigation}
      activeTab="home"
      title="Modules"
      accent={theme.accentDark}
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
        <Text style={{ color: theme.text, fontSize: 23, fontWeight: '900' }}>Everything you can do</Text>
        <Text style={{ color: theme.textMuted, marginTop: 6, marginBottom: 14 }}>Open any page from here.</Text>
        <SearchBar value={search} onChangeText={setSearch} placeholder="Search modules..." />
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -5 }}>
        {modules.map((module, index) => (
          <TouchableOpacity key={module.title} onPress={() => navigation.navigate(module.screen)} style={{ width: '50%', paddingHorizontal: 5, marginBottom: 10 }}>
            <View
              style={{
                backgroundColor: theme.bgCard,
                borderRadius: 26,
                padding: 16,
                minHeight: 170,
                borderWidth: 1,
                borderColor: theme.border,
              }}
            >
              <View
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 18,
                  backgroundColor: cardColors[index % cardColors.length],
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 14,
                }}
              >
                <Ionicons
                  name={index % 2 === 0 ? 'grid-outline' : 'layers-outline'}
                  size={24}
                  color={cardInks[index % cardInks.length]}
                />
              </View>

              <Text style={{ color: theme.text, fontWeight: '900', fontSize: 16 }}>{module.title}</Text>
              <Text style={{ color: theme.textMuted, fontSize: 12, marginTop: 8, lineHeight: 18 }}>{module.note}</Text>

              <View style={{ marginTop: 'auto', paddingTop: 18, flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ color: theme.accentDark, fontWeight: '900' }}>Open</Text>
                <Ionicons name="arrow-forward" size={16} color={theme.accentDark} style={{ marginLeft: 6 }} />
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </AppShell>
  );
}
