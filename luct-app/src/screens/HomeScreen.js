import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Image, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { AppShell } from '../components/AppShell';
import { getAttendanceMessage, getProgressTone, getRoleLabel, getRoleTone, useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { FACULTIES } from '../data/seedData';
import { PressableCard } from '../components/UI';
import { getUserClasses, lecturerMatchesUser } from '../utils/scope';

const accentSets = [
  { bg: '#EEF6FF', ink: '#2B6EF2', icon: 'chart-donut-variant' },
  { bg: '#FFF3EC', ink: '#F56A37', icon: 'calendar-check' },
  { bg: '#F1EEFF', ink: '#7C52E8', icon: 'book-open-page-variant' },
  { bg: '#EAF9F2', ink: '#2BAF6A', icon: 'account-group' },
];

export default function HomeScreen({ navigation }) {
  const { theme } = useTheme();
  const { user, profilePhoto } = useAuth();
  const { reports, attendance, courses, ratings } = useData();
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fade, {
      toValue: 1,
      duration: 320,
      useNativeDriver: true,
    }).start();
  }, [fade]);

  const myReports = reports.filter(report =>
    user.role === 'FMG'
      ? true
      : user.role === 'PL' || user.role === 'PRL'
        ? report.faculty === user.faculty
        : user.role === 'Lecturer'
          ? lecturerMatchesUser(report.lecturerName, user.name)
          : report.classCode === user.class
  );

  const myClasses = getUserClasses(user, courses);
  const myFaculty = FACULTIES.find(faculty => faculty.id === user.faculty);
  const roleTone = getRoleTone(user.role);
  const myAttendance = useMemo(() => (
    user.role === 'FMG'
      ? attendance
      : user.role === 'Student'
        ? attendance.filter(record => record.createdByUid === user.id || record.studentName === user.name)
        : user.role === 'Lecturer'
          ? attendance.filter(record => lecturerMatchesUser(record.lecturerName, user.name))
          : attendance.filter(record => myClasses.some(cls => cls.code === record.classCode))
  ), [attendance, myClasses, user.class, user.id, user.name, user.role]);
  const attendanceRate = useMemo(() => {
    const present = myAttendance.reduce((sum, record) => sum + (record.present || 0), 0);
    const total = myAttendance.reduce((sum, record) => sum + (record.total || 0), 0);
    return total > 0 ? Math.round((present / total) * 100) : 0;
  }, [myAttendance]);
  const progressTone = getProgressTone(theme, attendanceRate || 0, 70);
  const pendingCount = myReports.filter(report => report.status === 'submitted').length;
  const reviewedCount = myReports.filter(report => report.status === 'reviewed').length;
  const studentRatings = ratings.filter(rating => rating.submittedBy === user.id);

  const analytics = user.role === 'Student'
    ? [
        {
          label: 'Attendance',
          value: `${attendanceRate}%`,
          helper: getAttendanceMessage(attendanceRate),
          color: accentSets[0],
        },
        {
          label: 'Classes',
          value: myClasses.length,
          helper: myFaculty?.shortName || 'LUCT',
          color: accentSets[1],
        },
        {
          label: 'Courses',
          value: courses.filter(course => course.class === user.class).length,
          helper: 'registered this term',
          color: accentSets[2],
        },
        {
          label: 'Ratings',
          value: studentRatings.length,
          helper: 'feedback submitted',
          color: accentSets[3],
        },
      ]
    : [
        {
          label: 'Reports',
          value: myReports.length,
          helper: `${pendingCount} pending`,
          color: accentSets[0],
        },
        {
          label: 'Attendance',
          value: `${attendanceRate}%`,
          helper: `${myAttendance.length} attendance logs`,
          color: accentSets[1],
        },
        {
          label: user.role === 'FMG' ? 'Faculties' : 'Classes',
          value: user.role === 'FMG' ? FACULTIES.length : myClasses.length,
          helper: myFaculty?.shortName || 'LUCT',
          color: accentSets[2],
        },
        {
          label: 'Reviewed',
          value: reviewedCount,
          helper: 'reviewed reports',
          color: accentSets[3],
        },
      ];

  const quickActions = user.role === 'Student'
    ? [
        { label: 'Attendance', icon: 'calendar-outline', screen: 'Attendance' },
        { label: 'Monitoring', icon: 'stats-chart-outline', screen: 'Monitoring' },
        { label: 'Classes', icon: 'people-outline', screen: 'Classes' },
        { label: 'Rating', icon: 'star-outline', screen: 'Rating' },
      ]
    : [
        { label: 'Reports', icon: 'document-text-outline', screen: 'Reports' },
        { label: 'Monitoring', icon: 'stats-chart-outline', screen: 'Monitoring' },
        { label: 'New Report', icon: 'add-circle-outline', screen: 'ReportForm' },
        { label: 'Rating', icon: 'star-outline', screen: 'Rating' },
      ];

  return (
    <AppShell
      navigation={navigation}
      activeTab="home"
      title="Dashboard"
      accent={roleTone.bg}
    >
      <Animated.View style={{ opacity: fade }}>
        <View
          style={{
            backgroundColor: theme.bgCard,
            borderRadius: 30,
            padding: 18,
            borderWidth: 1,
            borderColor: theme.border,
            marginTop: 18,
            marginBottom: 18,
            shadowColor: theme.cardShadow,
            shadowOpacity: 1,
            shadowRadius: 18,
            shadowOffset: { width: 0, height: 10 },
            elevation: 6,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: theme.textMuted, fontSize: 12, fontWeight: '700' }}>Welcome</Text>
              <Text style={{ color: theme.text, fontSize: 24, fontWeight: '900', marginTop: 2 }} numberOfLines={1}>
                {user.name}
              </Text>
              <Text style={{ color: theme.textMuted, fontSize: 12, marginTop: 3 }}>
                {myFaculty?.name || 'Limkokwing University'}
              </Text>
            </View>

            <TouchableOpacity
              onPress={() => navigation.navigate('Profile')}
              style={{
                width: 58,
                height: 58,
                borderRadius: 20,
                backgroundColor: roleTone.subtle,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {profilePhoto ? (
                <Image source={{ uri: profilePhoto }} style={{ width: 58, height: 58, borderRadius: 20 }} />
              ) : (
                <Text style={{ color: theme.text, fontWeight: '900', fontSize: 22 }}>{user.name.charAt(0)}</Text>
              )}
            </TouchableOpacity>
          </View>

          <View
            style={{
              marginTop: 18,
              borderRadius: 28,
              padding: 18,
              backgroundColor: roleTone.bg,
            }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ flex: 1, paddingRight: 10 }}>
                <Text style={{ color: roleTone.text, opacity: 0.78, fontWeight: '700', fontSize: 12 }}>Role</Text>
                <Text style={{ color: roleTone.text, fontSize: 28, fontWeight: '900', marginTop: 4 }}>
                  {getRoleLabel(user.role)}
                </Text>
                {user.role !== 'Student' && (
                  <Text style={{ color: roleTone.text, opacity: 0.78, marginTop: 4 }}>
                    {pendingCount > 0 ? `${pendingCount} pending` : 'Up to date'}
                  </Text>
                )}
              </View>

              <View style={{ alignItems: 'flex-end' }}>
                <View
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.14)',
                    borderRadius: 16,
                    paddingHorizontal: 12,
                    paddingVertical: 7,
                    marginBottom: 10,
                  }}
                >
                  <Text style={{ color: roleTone.text, fontWeight: '800' }}>{myFaculty?.shortName || 'LUCT'}</Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      </Animated.View>

      <View style={{ marginBottom: 12 }}>
        <Text style={{ color: theme.bgText, fontSize: 19, fontWeight: '900' }}>Overview</Text>
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -5, marginBottom: 10 }}>
        {analytics.map(item => (
          <View key={item.label} style={{ width: '50%', paddingHorizontal: 5, marginBottom: 10 }}>
            <View
              style={{
                backgroundColor: theme.bgCard,
                borderRadius: 18,
                paddingHorizontal: 12,
                paddingVertical: 10,
                borderWidth: 1,
                borderColor: theme.border,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: 10,
                    backgroundColor: item.color.bg,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 10,
                  }}
                >
                  <MaterialCommunityIcons name={item.color.icon} size={16} color={item.color.ink} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: theme.textMuted, fontSize: 10, fontWeight: '700' }}>{item.label}</Text>
                  <Text style={{ color: theme.text, fontSize: 16, fontWeight: '900', marginTop: 2 }}>{item.value}</Text>
                </View>
              </View>
            </View>
          </View>
        ))}
      </View>

      <View
        style={{
          backgroundColor: progressTone.bg,
          borderRadius: 24,
          padding: 16,
          marginBottom: 16,
        }}
      >
        <Text style={{ color: progressTone.text, fontSize: 12, fontWeight: '800' }}>Attendance status</Text>
        <Text style={{ color: progressTone.text, fontSize: 26, fontWeight: '900', marginTop: 4 }}>{attendanceRate}%</Text>
        <Text style={{ color: progressTone.text, marginTop: 4 }}>
          {getAttendanceMessage(attendanceRate, 70)}
        </Text>
      </View>

      <View style={{ marginTop: 8, marginBottom: 12 }}>
        <Text style={{ color: theme.bgText, fontSize: 19, fontWeight: '900' }}>Quick Access</Text>
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -5 }}>
        {quickActions.map(action => (
          <PressableCard key={action.label} onPress={() => navigation.navigate(action.screen)} style={{ width: '50%', paddingHorizontal: 5, marginBottom: 10 }}>
            <View
              style={{
                backgroundColor: roleTone.surface,
                borderRadius: 24,
                padding: 16,
                minHeight: 124,
                borderWidth: 2,
                borderColor: roleTone.tint,
              }}
            >
              <View
                style={{
                  width: 46,
                  height: 46,
                  borderRadius: 16,
                  backgroundColor: roleTone.bg,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 12,
                }}
              >
                <Ionicons name={action.icon} size={22} color={roleTone.text} />
              </View>
              <Text style={{ color: theme.text, fontWeight: '900', fontSize: 16 }}>{action.label}</Text>
            </View>
          </PressableCard>
        ))}
      </View>
    </AppShell>
  );
}
