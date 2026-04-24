import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

import LoginScreen from '../screens/LoginScreen';
import HomeScreen from '../screens/HomeScreen';
import FacultiesScreen from '../screens/FacultiesScreen';
import FacultyDetailScreen from '../screens/FacultyDetailScreen';
import { ProgrammeListScreen, ProgrammeDetailScreen, StaffListScreen, StaffDetailScreen } from '../screens/StaffScreens';
import { ClassesScreen, CoursesScreen, LecturesScreen } from '../screens/ClassCourseScreens';
import { ReportsScreen, ReportFormScreen, MonitoringScreen } from '../screens/ReportScreens';
import { AttendanceScreen, RatingScreen } from '../screens/AttendanceRatingScreens';
import ModulesScreen from '../screens/ModulesScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const { user, ready } = useAuth();
  const { theme } = useTheme();

  const screenOptions = {
    headerShown: false,
    contentStyle: { backgroundColor: theme.bg },
    animation: 'fade_from_bottom',
  };

  if (!ready) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.bg }}>
        <ActivityIndicator size="large" color={theme.accent} />
      </View>
    );
  }

  if (!user) {
    return (
      <Stack.Navigator screenOptions={screenOptions}>
        <Stack.Screen name="Login" component={LoginScreen} />
      </Stack.Navigator>
    );
  }

  return (
    // These screens are the main modules required by the assignment brief.
    <Stack.Navigator screenOptions={screenOptions} initialRouteName="Home">
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="Modules" component={ModulesScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="Faculties" component={FacultiesScreen} />
      <Stack.Screen name="FacultyDetail" component={FacultyDetailScreen} />
      <Stack.Screen name="ProgrammeList" component={ProgrammeListScreen} />
      <Stack.Screen name="ProgrammeDetail" component={ProgrammeDetailScreen} />
      <Stack.Screen name="StaffList" component={StaffListScreen} />
      <Stack.Screen name="StaffDetail" component={StaffDetailScreen} />
      <Stack.Screen name="Classes" component={ClassesScreen} />
      <Stack.Screen name="Courses" component={CoursesScreen} />
      <Stack.Screen name="Lectures" component={LecturesScreen} />
      <Stack.Screen name="Reports" component={ReportsScreen} />
      <Stack.Screen name="ReportForm" component={ReportFormScreen} />
      <Stack.Screen name="Monitoring" component={MonitoringScreen} />
      <Stack.Screen name="Attendance" component={AttendanceScreen} />
      <Stack.Screen name="Rating" component={RatingScreen} />
    </Stack.Navigator>
  );
}
