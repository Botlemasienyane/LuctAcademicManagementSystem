import React, { useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppShell } from '../components/AppShell';
import { PressableCard, SearchBar } from '../components/UI';
import { getRoleTone, useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

const ROLE_MODULES = {
  Student: [
    { title: 'Monitoring', screen: 'Monitoring' },
    { title: 'Rating', screen: 'Rating' },
    { title: 'Attendance', screen: 'Attendance' },
    { title: 'Classes', screen: 'Classes' },
    { title: 'Course Outlines', screen: 'CourseOutlines' },
  ],
  Lecturer: [
    { title: 'Classes', screen: 'Classes' },
    { title: 'Reports', screen: 'Reports' },
    { title: 'Submit Report', screen: 'ReportForm' },
    { title: 'Monitoring', screen: 'Monitoring' },
    { title: 'Rating', screen: 'Rating' },
    { title: 'Attendance', screen: 'Attendance' },
    { title: 'Course Outlines', screen: 'CourseOutlines' },
  ],
  PRL: [
    { title: 'Courses', screen: 'Courses' },
    { title: 'Lectures', screen: 'Lectures' },
    { title: 'Reports', screen: 'Reports' },
    { title: 'Monitoring', screen: 'Monitoring' },
    { title: 'Classes', screen: 'Classes' },
    { title: 'Rating', screen: 'Rating' },
    { title: 'Course Outlines', screen: 'CourseOutlines' },
  ],
  PL: [
    { title: 'Programmes', screen: 'ProgrammeList' },
    { title: 'Courses', screen: 'Courses' },
    { title: 'Lectures', screen: 'Lectures' },
    { title: 'Reports', screen: 'Reports' },
    { title: 'Monitoring', screen: 'Monitoring' },
    { title: 'Rating', screen: 'Rating' },
    { title: 'Classes', screen: 'Classes' },
    { title: 'Course Outlines', screen: 'CourseOutlines' },
  ],
  FMG: [
    { title: 'Faculties', screen: 'Faculties' },
    { title: 'Staff', screen: 'StaffList' },
    { title: 'Reports', screen: 'Reports' },
    { title: 'Monitoring', screen: 'Monitoring' },
    { title: 'Classes', screen: 'Classes' },
    { title: 'Rating', screen: 'Rating' },
    { title: 'Course Outlines', screen: 'CourseOutlines' },
  ],
};

const cardColors = ['#EEF6FF', '#FFF1E8', '#F0ECFF', '#E8F8F0'];
const cardInks = ['#2B6EF2', '#F56A37', '#7C52E8', '#2BAF6A'];

export default function ModulesScreen({ navigation }) {
  const { theme } = useTheme();
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const roleTone = getRoleTone(user?.role);

  const modules = useMemo(() => {
    const roleModules = ROLE_MODULES[user?.role] || ROLE_MODULES.Student;
    if (!search) return roleModules;
    const q = search.toLowerCase();
    return roleModules.filter(module => `${module.title}`.toLowerCase().includes(q));
  }, [search, user?.role]);

  return (
    <AppShell
      navigation={navigation}
      activeTab="home"
      title="Modules"
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
        <SearchBar value={search} onChangeText={setSearch} placeholder="Search modules..." />
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -5 }}>
        {modules.map((module, index) => (
          <PressableCard key={module.title} onPress={() => navigation.navigate(module.screen)} style={{ width: '50%', paddingHorizontal: 5, marginBottom: 10 }}>
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
            </View>
          </PressableCard>
        ))}
      </View>
    </AppShell>
  );
}
