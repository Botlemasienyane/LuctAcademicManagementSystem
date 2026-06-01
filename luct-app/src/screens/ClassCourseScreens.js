import React, { useMemo, useState } from 'react';
import { Alert, Linking, Platform, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system/legacy';
import * as DocumentPicker from 'expo-document-picker';
import { AppShell } from '../components/AppShell';
import { Card, SearchBar, EmptyState, Input, Btn, Badge, PressableCard } from '../components/UI';
import { getRoleTone, useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { CLASSES, FACULTIES, LECTURERS } from '../data/seedData';
import { getUserClasses, getUserCourses } from '../utils/scope';

const visualSets = [
  { bg: '#EEF6FF', ink: '#2B6EF2', icon: 'google-classroom' },
  { bg: '#FFF4E8', ink: '#F56A37', icon: 'book-open-page-variant' },
  { bg: '#F2ECFF', ink: '#8256F2', icon: 'clock-outline' },
];

const BUNDLED_OUTLINE_DOCUMENTS = {
  '/documents/spm-course-outline.pdf': require('../../public/documents/spm-course-outline.pdf'),
  '/documents/concepts-of-modelling.pdf': require('../../public/documents/concepts-of-modelling.pdf'),
  '/documents/module-document-pack.pdf': require('../../public/documents/module-document-pack.pdf'),
  '/documents/software-design-module-outline.pdf': require('../../public/documents/software-design-module-outline.pdf'),
  '/documents/mobile-device-programming-document.pdf': require('../../public/documents/mobile-device-programming-document.pdf'),
  '/documents/interactive-multimedia-document.pdf': require('../../public/documents/interactive-multimedia-document.pdf'),
};

const getCourseVisual = (course) => {
  const name = `${course?.name || ''} ${course?.code || ''}`.toLowerCase();

  if (name.includes('software') || name.includes('program') || name.includes('mobile') || name.includes('computer')) {
    return { bg: '#EAF4FF', ink: '#2066D3', icon: 'laptop', label: 'Computing' };
  }
  if (name.includes('math') || name.includes('statistics') || name.includes('account')) {
    return { bg: '#EEF9F1', ink: '#23834D', icon: 'calculator-variant-outline', label: 'Analytics' };
  }
  if (name.includes('design') || name.includes('creative') || name.includes('fashion')) {
    return { bg: '#FFF0F4', ink: '#C2386B', icon: 'palette-outline', label: 'Design' };
  }
  if (name.includes('media') || name.includes('journal') || name.includes('broadcast')) {
    return { bg: '#F3EEFF', ink: '#6F42D9', icon: 'microphone-outline', label: 'Media' };
  }
  if (name.includes('business') || name.includes('management') || name.includes('marketing')) {
    return { bg: '#FFF5E8', ink: '#C26D1A', icon: 'briefcase-outline', label: 'Business' };
  }

  return { bg: '#EAF7FB', ink: '#2E9DBB', icon: 'book-education-outline', label: 'Course' };
};

const getScheduleLabel = (time = '') => {
  const hour = parseInt(time, 10);
  if (Number.isNaN(hour)) return 'Scheduled';
  if (hour < 10) return 'Morning';
  if (hour < 13) return 'Midday';
  if (hour < 16) return 'Afternoon';
  return 'Evening';
};

const resolveDocumentUrl = (url) => {
  if (!url) return '';
  if (/^https?:\/\//i.test(url) || /^file:\/\//i.test(url)) return url;
  if (url.startsWith('/')) {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location?.origin) {
      return `${window.location.origin}${url}`;
    }
    return url;
  }
  return url;
};

const openDocumentUrl = async (url) => {
  if (!url) {
    throw new Error('No document is attached to this outline yet.');
  }

  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') {
      window.open(url, '_blank', 'noopener,noreferrer');
      return;
    }

    throw new Error('This document cannot be opened on this device.');
  }

  if (url.startsWith('/')) {
    const bundledModule = BUNDLED_OUTLINE_DOCUMENTS[url];

    if (!bundledModule) {
      throw new Error('This document is not available offline on this device.');
    }

    const asset = Asset.fromModule(bundledModule);
    await asset.downloadAsync();
    const localUrl = asset.localUri || asset.uri;
    const openableUrl =
      Platform.OS === 'android' && localUrl.startsWith('file://')
        ? await FileSystem.getContentUriAsync(localUrl)
        : localUrl;
    await Linking.openURL(openableUrl);
    return;
  }

  const openableUrl =
    Platform.OS === 'android' && url.startsWith('file://')
      ? await FileSystem.getContentUriAsync(url)
      : url;
  await Linking.openURL(openableUrl);
};

function MetricTile({ theme, set, label, value, helper }) {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: theme.bgCard,
        borderRadius: 22,
        padding: 14,
        borderWidth: 1,
        borderColor: theme.border,
      }}
    >
      <View
        style={{
          width: 42,
          height: 42,
          borderRadius: 14,
          backgroundColor: set.bg,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 10,
        }}
      >
        <MaterialCommunityIcons name={set.icon} size={22} color={set.ink} />
      </View>
      <Text style={{ color: theme.text, fontWeight: '900', fontSize: 24 }}>{value}</Text>
      <Text style={{ color: theme.text, fontWeight: '700', marginTop: 4 }}>{label}</Text>
      <Text style={{ color: set.ink, fontSize: 11, marginTop: 6, fontWeight: '800' }}>{helper}</Text>
    </View>
  );
}

export function ClassesScreen({ navigation, route }) {
  const { theme } = useTheme();
  const { user } = useAuth();
  const { courses, attendance } = useData();
  const [search, setSearch] = useState('');
  const [studentTab, setStudentTab] = useState('timetable');
  const filterClass = route?.params?.filterClass;
  const roleTone = getRoleTone(user?.role);
  const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  const classes = filterClass ? [filterClass] : getUserClasses(user, courses);
  const filtered = classes.filter(
    cls =>
      cls.name.toLowerCase().includes(search.toLowerCase()) ||
      cls.code.toLowerCase().includes(search.toLowerCase()) ||
      cls.programme.toLowerCase().includes(search.toLowerCase())
  );
  const studentClass = classes[0] || null;
  const studentTimetable = getUserCourses(user, courses)
    .filter(course =>
      `${course.name} ${course.code} ${course.day} ${course.time} ${course.venue} ${course.lecturer}`
        .toLowerCase()
        .includes(search.toLowerCase())
    )
    .sort((a, b) => {
      const dayDiff = weekDays.indexOf(a.day) - weekDays.indexOf(b.day);
      if (dayDiff !== 0) return dayDiff;
      return `${a.time || ''}`.localeCompare(`${b.time || ''}`);
    });
  const timetableByDay = weekDays
    .map(day => ({ day, items: studentTimetable.filter(course => course.day === day) }))
    .filter(group => group.items.length > 0);
  const studentAttendance = attendance
    .filter(record => record.createdByUid === user?.id || record.studentName === user?.name)
    .sort((a, b) => `${b.date || ''}`.localeCompare(`${a.date || ''}`));
  const moduleAttendanceSummaries = getUserCourses(user, courses).map(course => {
    const records = studentAttendance.filter(record => record.courseCode === course.code && record.classCode === course.class);
    const totalSessions = records.length;
    const presentSessions = records.filter(record => record.present > 0).length;
    const percentage = totalSessions > 0 ? Math.round((presentSessions / totalSessions) * 100) : 0;
    return {
      ...course,
      totalSessions,
      presentSessions,
      percentage,
      lastDate: records[0]?.date || null,
    };
  });

  const studentCount = filtered.reduce((sum, cls) => sum + (cls.totalStudents || 0), 0);
  const selectedModuleSummary =
    moduleAttendanceSummaries.find(module => module.code === (route?.params?.courseCode || '')) || moduleAttendanceSummaries[0] || null;

  if (user?.role === 'Student') {
    return (
      <AppShell
        navigation={navigation}
        activeTab="home"
        title="Classes"
        headerBadge={studentClass?.code || user?.class || 'Student'}
        accent={roleTone.bg}
      >
        <View
          style={{
            backgroundColor: theme.bgCard,
            borderRadius: 32,
            padding: 18,
            borderWidth: 1,
            borderColor: theme.border,
            marginTop: 18,
            marginBottom: 14,
            overflow: 'hidden',
          }}
        >
          <View
            style={{
              position: 'absolute',
              width: 150,
              height: 150,
              borderRadius: 75,
              backgroundColor: roleTone.tint,
              right: -26,
              top: -50,
            }}
          />
          <View
            style={{
              position: 'absolute',
              width: 120,
              height: 120,
              borderRadius: 60,
              backgroundColor: theme.accentLighter,
              left: -26,
              bottom: -34,
            }}
          />
          <View style={{ alignSelf: 'flex-start', backgroundColor: theme.bgSecondary, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 8 }}>
            <Text style={{ color: theme.text, fontSize: 12, fontWeight: '800' }}>{studentClass?.code || user?.class || 'No class'}</Text>
          </View>
          <Text style={{ color: theme.text, fontSize: 30, fontWeight: '900', marginTop: 14 }}>
            {studentClass?.name || 'My classes'}
          </Text>
          {studentClass?.programme ? (
            <Text style={{ color: theme.textMuted, marginTop: 8, fontSize: 13, fontWeight: '700' }}>{studentClass.programme}</Text>
          ) : null}
        </View>

        <View style={{ flexDirection: 'row', marginHorizontal: -5, marginBottom: 12 }}>
          <View style={{ flex: 1, paddingHorizontal: 5 }}>
            <MetricTile theme={theme} set={visualSets[0]} label="Modules" value={studentTimetable.length} helper="on timetable" />
          </View>
          <View style={{ flex: 1, paddingHorizontal: 5 }}>
            <MetricTile theme={theme} set={visualSets[1]} label="Days" value={timetableByDay.length} helper="with classes" />
          </View>
          <View style={{ flex: 1, paddingHorizontal: 5 }}>
            <MetricTile theme={theme} set={visualSets[2]} label="Records" value={studentAttendance.length} helper="attendance saved" />
          </View>
        </View>

        <View
          style={{
            flexDirection: 'row',
            backgroundColor: theme.bgSecondary,
            borderRadius: 22,
            padding: 6,
            marginBottom: 12,
          }}
        >
          {[
            { key: 'timetable', label: 'Timetable' },
            { key: 'attendance', label: 'Attendance' },
          ].map(tab => {
            const active = studentTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                onPress={() => setStudentTab(tab.key)}
                style={{
                  flex: 1,
                  borderRadius: 18,
                  paddingVertical: 12,
                  alignItems: 'center',
                  backgroundColor: active ? roleTone.bg : 'transparent',
                }}
              >
                <Text style={{ color: active ? roleTone.text : theme.textMuted, fontWeight: '900' }}>{tab.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {studentTab === 'timetable' ? (
          <>
            <SearchBar value={search} onChangeText={setSearch} placeholder="Search timetable..." />

            {studentTimetable.length === 0 ? (
              <EmptyState icon="TT" message={user?.class ? 'No timetable found' : 'No class assigned'} />
            ) : (
              timetableByDay.map(group => (
                <View key={group.day} style={{ marginBottom: 16 }}>
                  <View
                    style={{
                      alignSelf: 'flex-start',
                      backgroundColor: roleTone.tint,
                      borderRadius: 18,
                      paddingHorizontal: 14,
                      paddingVertical: 8,
                      marginBottom: 10,
                    }}
                  >
                    <Text style={{ color: roleTone.bg, fontWeight: '900', fontSize: 13 }}>{group.day}</Text>
                  </View>

                  {group.items.map(course => {
                    const courseVisual = getCourseVisual(course);
                    const scheduleLabel = getScheduleLabel(course.time);
                    return (
                      <PressableCard
                        key={course.id}
                        style={{
                          borderRadius: 28,
                          marginBottom: 12,
                          backgroundColor: theme.bgCard,
                          borderWidth: 1,
                          borderColor: theme.border,
                          overflow: 'hidden',
                        }}
                      >
                        <View
                          style={{
                            position: 'absolute',
                            width: 130,
                            height: 130,
                            borderRadius: 65,
                            backgroundColor: courseVisual.bg,
                            right: -34,
                            top: -42,
                          }}
                        />
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                          <View
                            style={{
                              width: 58,
                              height: 58,
                              borderRadius: 20,
                              backgroundColor: courseVisual.bg,
                              alignItems: 'center',
                              justifyContent: 'center',
                              marginRight: 12,
                            }}
                          >
                            <MaterialCommunityIcons name={courseVisual.icon} size={26} color={courseVisual.ink} />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={{ color: theme.text, fontWeight: '900', fontSize: 16 }}>{course.name}</Text>
                            <Text style={{ color: courseVisual.ink, marginTop: 5, fontSize: 11, fontWeight: '800' }}>
                              {courseVisual.label} • {scheduleLabel}
                            </Text>
                            <Text style={{ color: theme.textMuted, marginTop: 5, fontSize: 12 }}>{course.code}</Text>
                          </View>
                        </View>

                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -4 }}>
                          {[
                            { label: 'Time', value: course.time },
                            { label: 'Venue', value: course.venue },
                            { label: 'Lecturer', value: course.lecturer },
                          ].map(item => (
                            <View key={`${course.id}_${item.label}`} style={{ width: item.label === 'Lecturer' ? '100%' : '50%', paddingHorizontal: 4, marginBottom: 8 }}>
                              <View style={{ backgroundColor: theme.bgSecondary, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 10 }}>
                                <Text style={{ color: theme.textMuted, fontSize: 10, fontWeight: '800' }}>{item.label.toUpperCase()}</Text>
                                <Text style={{ color: theme.text, fontWeight: '800', marginTop: 4 }}>{item.value}</Text>
                              </View>
                            </View>
                          ))}
                        </View>
                      </PressableCard>
                    );
                  })}
                </View>
              ))
            )}
          </>
        ) : (
          <>
            {selectedModuleSummary ? (
              <Card style={{ borderRadius: 26, marginBottom: 12, backgroundColor: selectedModuleSummary.percentage >= 75 ? theme.successSoft : theme.warningSoft }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                  <View style={{ flex: 1, paddingRight: 12 }}>
                    <Text style={{ color: theme.text, fontWeight: '900', fontSize: 18 }}>{selectedModuleSummary.name}</Text>
                    <Text style={{ color: theme.textMuted, marginTop: 4, fontSize: 12 }}>
                      {selectedModuleSummary.code} • {selectedModuleSummary.lastDate || 'No attendance saved'}
                    </Text>
                  </View>
                  <Badge label={`${selectedModuleSummary.percentage}%`} color={selectedModuleSummary.percentage >= 75 ? 'reviewed' : 'pending'} />
                </View>
                <View style={{ backgroundColor: theme.bgCard, borderRadius: 999, height: 10, overflow: 'hidden' }}>
                  <View
                    style={{
                      backgroundColor: selectedModuleSummary.percentage >= 75 ? theme.success : theme.warning,
                      width: `${selectedModuleSummary.percentage}%`,
                      height: '100%',
                    }}
                  />
                </View>
                <Text style={{ color: selectedModuleSummary.percentage >= 75 ? theme.success : theme.warning, fontWeight: '800', marginTop: 10 }}>
                  {selectedModuleSummary.totalSessions > 0
                    ? `${selectedModuleSummary.presentSessions}/${selectedModuleSummary.totalSessions} saved • ${selectedModuleSummary.percentage >= 75 ? 'Attendance is looking steady.' : 'Attendance needs follow-up for this module.'}`
                    : 'No attendance has been recorded for this module yet.'}
                </Text>
              </Card>
            ) : null}

            {moduleAttendanceSummaries.length === 0 ? (
              <EmptyState icon="ATT" message="No modules found for this class" />
            ) : (
              moduleAttendanceSummaries.map(module => {
                const tone = module.percentage >= 75 ? theme.success : theme.warning;
                const isSelected = selectedModuleSummary?.code === module.code;
                return (
                  <PressableCard
                    key={module.id}
                    onPress={() => navigation.setParams?.({ courseCode: module.code })}
                    style={{
                      borderRadius: 26,
                      marginBottom: 12,
                      borderWidth: 1,
                      borderColor: isSelected ? roleTone.bg : theme.border,
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                      <View
                        style={{
                          width: 52,
                          height: 52,
                          borderRadius: 18,
                          backgroundColor: isSelected ? roleTone.tint : theme.bgSecondary,
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginRight: 12,
                        }}
                      >
                        <MaterialCommunityIcons name="book-education-outline" size={24} color={roleTone.bg} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: theme.text, fontWeight: '900', fontSize: 15 }}>{module.name}</Text>
                        <Text style={{ color: theme.textMuted, marginTop: 4, fontSize: 12 }}>
                          {module.code} • {module.totalSessions} week{module.totalSessions === 1 ? '' : 's'}
                        </Text>
                      </View>
                      <Badge label={`${module.percentage}%`} color={module.percentage >= 75 ? 'reviewed' : 'pending'} />
                    </View>

                    <View style={{ backgroundColor: theme.bgSecondary, borderRadius: 999, height: 8, overflow: 'hidden', marginBottom: 10 }}>
                      <View style={{ backgroundColor: tone, width: `${module.percentage}%`, height: '100%' }} />
                    </View>

                    <View style={{ flexDirection: 'row', marginHorizontal: -4 }}>
                      <View style={{ flex: 1, paddingHorizontal: 4 }}>
                        <View style={{ backgroundColor: theme.bgSecondary, borderRadius: 16, padding: 12 }}>
                          <Text style={{ color: theme.textMuted, fontSize: 10, fontWeight: '800' }}>STATUS</Text>
                          <Text style={{ color: theme.text, fontWeight: '800', marginTop: 4 }}>
                            {module.percentage >= 75 ? 'Good' : module.totalSessions > 0 ? 'Needs follow-up' : 'No records'}
                          </Text>
                        </View>
                      </View>
                      <View style={{ flex: 1, paddingHorizontal: 4 }}>
                        <View style={{ backgroundColor: theme.bgSecondary, borderRadius: 16, padding: 12 }}>
                          <Text style={{ color: theme.textMuted, fontSize: 10, fontWeight: '800' }}>LAST MARK</Text>
                          <Text style={{ color: theme.text, fontWeight: '800', marginTop: 4 }}>{module.lastDate || 'Not yet'}</Text>
                        </View>
                      </View>
                    </View>

                    <TouchableOpacity
                      onPress={() => navigation.navigate('Attendance', { courseCode: module.code })}
                      style={{
                        marginTop: 12,
                        backgroundColor: roleTone.bg,
                        borderRadius: 16,
                        paddingVertical: 12,
                        alignItems: 'center',
                      }}
                    >
                      <Text style={{ color: roleTone.text, fontWeight: '900' }}>Mark {module.code}</Text>
                    </TouchableOpacity>
                  </PressableCard>
                );
              })
            )}
          </>
        )}
      </AppShell>
    );
  }

  return (
    <AppShell
      navigation={navigation}
      activeTab="home"
      title="Classes"
      headerBadge={`${filtered.length} classes`}
      accent={roleTone.bg}
    >
      <View
        style={{
          backgroundColor: theme.bgCard,
          borderRadius: 30,
          padding: 18,
          borderWidth: 1,
          borderColor: theme.border,
          marginTop: 18,
          marginBottom: 16,
        }}
      >
        <Text style={{ color: theme.textMuted, fontWeight: '800', fontSize: 12 }}>Academic structure</Text>
        <Text style={{ color: theme.text, fontSize: 28, fontWeight: '900', marginTop: 6 }}>
          {filterClass ? filterClass.name : 'Class overview'}
        </Text>
      </View>

      <View style={{ flexDirection: 'row', marginHorizontal: -5, marginBottom: 12 }}>
        <View style={{ flex: 1, paddingHorizontal: 5 }}>
          <MetricTile theme={theme} set={visualSets[0]} label="Classes" value={filtered.length} helper="visible here" />
        </View>
        <View style={{ flex: 1, paddingHorizontal: 5 }}>
          <MetricTile theme={theme} set={visualSets[1]} label="Courses" value={filtered.reduce((sum, cls) => sum + courses.filter(course => course.class === cls.code).length, 0)} helper="attached modules" />
        </View>
        <View style={{ flex: 1, paddingHorizontal: 5 }}>
          <MetricTile theme={theme} set={visualSets[2]} label="Students" value={studentCount} helper="registered seats" />
        </View>
      </View>

      <SearchBar value={search} onChangeText={setSearch} placeholder="Search classes by code, name, programme..." />

      {filtered.length === 0 ? (
        <EmptyState icon="CLS" message="No classes found" />
      ) : (
        filtered.map(cls => {
          const classCourses = courses.filter(course => course.class === cls.code);
          const faculty = FACULTIES.find(entry => entry.id === cls.faculty);
          return (
            <Card key={cls.id} style={{ borderRadius: 26 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                <View
                  style={{
                    width: 54,
                    height: 54,
                    borderRadius: 18,
                    backgroundColor: visualSets[0].bg,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 12,
                  }}
                >
                  <Text style={{ color: visualSets[0].ink, fontWeight: '900', fontSize: 16 }}>{cls.year}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: theme.text, fontWeight: '900', fontSize: 16 }}>{cls.name}</Text>
                  <Text style={{ color: theme.textMuted, marginTop: 4, fontSize: 12 }}>
                    {cls.code} • {faculty?.shortName} • {cls.programme}
                  </Text>
                </View>
                <Badge label={`${cls.totalStudents} students`} color="reviewed" />
              </View>

              <View style={{ flexDirection: 'row', marginHorizontal: -4, marginBottom: 12 }}>
                <View style={{ flex: 1, paddingHorizontal: 4 }}>
                  <View style={{ backgroundColor: theme.bgSecondary, borderRadius: 16, padding: 12 }}>
                    <Text style={{ color: theme.textMuted, fontSize: 11, fontWeight: '800' }}>COURSES</Text>
                    <Text style={{ color: theme.text, fontSize: 22, fontWeight: '900', marginTop: 6 }}>{classCourses.length}</Text>
                  </View>
                </View>
                <View style={{ flex: 1, paddingHorizontal: 4 }}>
                  <View style={{ backgroundColor: theme.bgSecondary, borderRadius: 16, padding: 12 }}>
                    <Text style={{ color: theme.textMuted, fontSize: 11, fontWeight: '800' }}>YEAR</Text>
                    <Text style={{ color: theme.text, fontSize: 22, fontWeight: '900', marginTop: 6 }}>{cls.year}</Text>
                  </View>
                </View>
              </View>

              <View style={{ flexDirection: 'row', marginHorizontal: -4 }}>
                <View style={{ flex: 1, paddingHorizontal: 4 }}>
                  <TouchableOpacity
                    onPress={() => navigation.navigate('Courses', { filterClass: cls })}
                    style={{
                      backgroundColor: theme.bgSecondary,
                      borderRadius: 18,
                      paddingVertical: 14,
                      alignItems: 'center',
                    }}
                  >
                    <Text style={{ color: theme.text, fontWeight: '900' }}>Open Courses</Text>
                  </TouchableOpacity>
                </View>
                {user?.role === 'Student' ? (
                  <View style={{ flex: 1, paddingHorizontal: 4 }}>
                    <TouchableOpacity
                      onPress={() => navigation.navigate('Attendance', { filterClass: cls })}
                      style={{
                        backgroundColor: roleTone.bg,
                        borderRadius: 18,
                        paddingVertical: 14,
                        alignItems: 'center',
                      }}
                    >
                      <Text style={{ color: roleTone.text, fontWeight: '900' }}>Mark Attendance</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={{ flex: 1, paddingHorizontal: 4 }}>
                    <TouchableOpacity
                      onPress={() => navigation.navigate('Reports', { filterClass: cls })}
                      style={{
                        backgroundColor: roleTone.bg,
                        borderRadius: 18,
                        paddingVertical: 14,
                        alignItems: 'center',
                      }}
                    >
                      <Text style={{ color: roleTone.text, fontWeight: '900' }}>Open Reports</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </Card>
          );
        })
      )}
    </AppShell>
  );
}

export function CoursesScreen({ navigation, route }) {
  const { theme } = useTheme();
  const { user } = useAuth();
  const { courses, saveCourse, deleteCourse } = useData();
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const filterClass = route?.params?.filterClass;
  const roleTone = getRoleTone(user?.role);
  const availableClasses = getUserClasses(user, courses);
  const lecturerOptions = LECTURERS.filter(lecturer => lecturer.faculty === user.faculty || user.role === 'FMG');
  const [courseForm, setCourseForm] = useState({
    class: filterClass?.code || availableClasses[0]?.code || '',
    code: '',
    name: '',
    lecturer: lecturerOptions[0]?.name || '',
    venue: '',
    time: '',
    day: 'Monday',
  });

  const visibleCourses = filterClass
    ? courses.filter(course => course.class === filterClass.code)
    : getUserCourses(user, courses);

  const filtered = visibleCourses.filter(
    course =>
      course.name.toLowerCase().includes(search.toLowerCase()) ||
      course.code.toLowerCase().includes(search.toLowerCase()) ||
      course.lecturer.toLowerCase().includes(search.toLowerCase())
  );

  const byDay = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
    .map(day => ({ day, items: filtered.filter(course => course.day === day) }))
    .filter(group => group.items.length > 0);

  const updateCourseForm = (key, value) => {
    setCourseForm(current => ({ ...current, [key]: value }));
  };

  const handleSaveCourse = async () => {
    if (!courseForm.class || !courseForm.code || !courseForm.name || !courseForm.lecturer || !courseForm.venue || !courseForm.time) {
      Alert.alert('Missing details', 'Please fill in class, course name, code, lecturer, venue, and time.');
      return;
    }

    try {
      await saveCourse(courseForm);
      setCourseForm({
        class: filterClass?.code || availableClasses[0]?.code || '',
        code: '',
        name: '',
        lecturer: lecturerOptions[0]?.name || '',
        venue: '',
        time: '',
        day: 'Monday',
      });
      setShowForm(false);
      Alert.alert('Saved', 'Course saved successfully.');
    } catch (error) {
      Alert.alert('Save failed', error.message || 'Could not save the course right now.');
    }
  };

  const totalClasses = new Set(filtered.map(course => course.class)).size;

  return (
    <AppShell
      navigation={navigation}
      activeTab="home"
      title={filterClass ? `${filterClass.code} Courses` : 'Courses'}
      headerBadge={`${filtered.length} courses`}
      accent={roleTone.bg}
    >
      <View
        style={{
          backgroundColor: theme.bgCard,
          borderRadius: 30,
          padding: 18,
          borderWidth: 1,
          borderColor: theme.border,
          marginTop: 18,
          marginBottom: 16,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ flex: 1, paddingRight: 12 }}>
            <Text style={{ color: theme.textMuted, fontWeight: '800', fontSize: 12 }}>Academic planning</Text>
            <Text style={{ color: theme.text, fontSize: 28, fontWeight: '900', marginTop: 6 }}>
              {filterClass ? filterClass.name : 'Courses and assignments'}
            </Text>
          </View>
          {user.role === 'PL' && (
            <TouchableOpacity
              onPress={() => setShowForm(value => !value)}
              style={{
                width: 58,
                height: 58,
                borderRadius: 20,
                backgroundColor: roleTone.bg,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name={showForm ? 'close' : 'add'} size={28} color={roleTone.text} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={{ flexDirection: 'row', marginHorizontal: -5, marginBottom: 12 }}>
        <View style={{ flex: 1, paddingHorizontal: 5 }}>
          <MetricTile theme={theme} set={visualSets[1]} label="Courses" value={filtered.length} helper="shown now" />
        </View>
        <View style={{ flex: 1, paddingHorizontal: 5 }}>
          <MetricTile theme={theme} set={visualSets[0]} label="Classes" value={totalClasses} helper="covered here" />
        </View>
        <View style={{ flex: 1, paddingHorizontal: 5 }}>
          <MetricTile theme={theme} set={visualSets[2]} label="Days" value={byDay.length} helper="teaching days" />
        </View>
      </View>

      <SearchBar value={search} onChangeText={setSearch} placeholder="Search courses, lecturers, codes..." />

      {showForm && user.role === 'PL' ? (
        <Card style={{ borderRadius: 28, borderWidth: 2, borderColor: roleTone.bg, marginBottom: 14 }}>
          <Text style={{ color: theme.text, fontWeight: '900', fontSize: 18, marginBottom: 14 }}>Add or assign course</Text>
          <Text style={{ color: theme.textMuted, fontSize: 12, fontWeight: '800', marginBottom: 8, textTransform: 'uppercase' }}>
            Class
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -4, marginBottom: 10 }}>
            {availableClasses.map(cls => (
              <TouchableOpacity
                key={cls.id}
                onPress={() => updateCourseForm('class', cls.code)}
                style={{
                  backgroundColor: courseForm.class === cls.code ? roleTone.bg : theme.bgSecondary,
                  borderRadius: 14,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  marginHorizontal: 4,
                  marginBottom: 8,
                }}
              >
                <Text style={{ color: courseForm.class === cls.code ? roleTone.text : theme.text, fontSize: 12, fontWeight: '800' }}>
                  {cls.code}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Input label="Course Name" value={courseForm.name} onChangeText={value => updateCourseForm('name', value)} placeholder="e.g. Mobile Device Programming" />
          <Input label="Course Code" value={courseForm.code} onChangeText={value => updateCourseForm('code', value.toUpperCase())} placeholder="e.g. BIMP3210" autoCapitalize="characters" />

          <Text style={{ color: theme.textMuted, fontSize: 12, fontWeight: '800', marginBottom: 8, textTransform: 'uppercase' }}>
            Lecturer
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -4, marginBottom: 10 }}>
            {lecturerOptions.map(lecturer => (
              <TouchableOpacity
                key={lecturer.id}
                onPress={() => updateCourseForm('lecturer', lecturer.name)}
                style={{
                  backgroundColor: courseForm.lecturer === lecturer.name ? roleTone.bg : theme.bgSecondary,
                  borderRadius: 14,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  marginHorizontal: 4,
                  marginBottom: 8,
                }}
              >
                <Text style={{ color: courseForm.lecturer === lecturer.name ? roleTone.text : theme.text, fontSize: 12, fontWeight: '800' }}>
                  {lecturer.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Input label="Venue" value={courseForm.venue} onChangeText={value => updateCourseForm('venue', value)} placeholder="e.g. MM3" />
          <Input label="Time" value={courseForm.time} onChangeText={value => updateCourseForm('time', value)} placeholder="e.g. 08:30-10:30" />

          <Text style={{ color: theme.textMuted, fontSize: 12, fontWeight: '800', marginBottom: 8, textTransform: 'uppercase' }}>
            Day
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -4, marginBottom: 10 }}>
            {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map(day => (
              <TouchableOpacity
                key={day}
                onPress={() => updateCourseForm('day', day)}
                style={{
                  backgroundColor: courseForm.day === day ? roleTone.bg : theme.bgSecondary,
                  borderRadius: 14,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  marginHorizontal: 4,
                  marginBottom: 8,
                }}
              >
                <Text style={{ color: courseForm.day === day ? roleTone.text : theme.text, fontSize: 12, fontWeight: '800' }}>
                  {day}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Btn title="Save Course" onPress={handleSaveCourse} />
        </Card>
      ) : null}

      {filtered.length === 0 ? (
        <EmptyState icon="CRS" message="No courses found" />
      ) : byDay.length > 0 ? (
        byDay.map(({ day, items }) => (
          <View key={day} style={{ marginBottom: 12 }}>
            <Text style={{ color: theme.bgText, fontSize: 18, fontWeight: '900', marginBottom: 10 }}>{day}</Text>
            {items.map(course => {
              const courseVisual = getCourseVisual(course);
              const scheduleLabel = getScheduleLabel(course.time);
              return (
                <Card key={course.id} style={{ borderRadius: 26 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                    <View
                      style={{
                        width: 54,
                        height: 54,
                        borderRadius: 18,
                        backgroundColor: courseVisual.bg,
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: 12,
                      }}
                    >
                      <MaterialCommunityIcons name={courseVisual.icon} size={24} color={courseVisual.ink} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: theme.text, fontWeight: '900', fontSize: 15 }}>{course.name}</Text>
                      <Text style={{ color: courseVisual.ink, marginTop: 4, fontSize: 11, fontWeight: '800' }}>
                        {courseVisual.label} - {scheduleLabel}
                      </Text>
                      <Text style={{ color: theme.textMuted, marginTop: 4, fontSize: 12 }}>
                        {course.code} - {course.lecturer}
                      </Text>
                    </View>
                    <Badge label={course.class} color="reviewed" />
                  </View>

                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -4 }}>
                    {[
                      { label: 'Venue', value: course.venue },
                      { label: 'Time', value: course.time },
                      { label: 'Class', value: course.class },
                    ].map(item => (
                      <View key={`${course.id}_${item.label}`} style={{ paddingHorizontal: 4, marginBottom: 8 }}>
                        <View style={{ backgroundColor: theme.bgSecondary, borderRadius: 14, paddingHorizontal: 10, paddingVertical: 8 }}>
                          <Text style={{ color: theme.textMuted, fontSize: 10, fontWeight: '800' }}>{item.label.toUpperCase()}</Text>
                          <Text style={{ color: theme.text, fontWeight: '700', marginTop: 4 }}>{item.value}</Text>
                        </View>
                      </View>
                    ))}
                  </View>

                  {user.role === 'PL' ? (
                    <TouchableOpacity
                      onPress={() =>
                        Alert.alert('Delete course', `Remove ${course.code} from the schedule?`, [
                          { text: 'Cancel', style: 'cancel' },
                          {
                            text: 'Delete',
                            style: 'destructive',
                            onPress: async () => {
                              try {
                                await deleteCourse(course.id);
                                Alert.alert('Deleted', 'Course removed successfully.');
                              } catch (error) {
                                Alert.alert('Delete failed', error.message || 'Could not remove the course right now.');
                              }
                            },
                          },
                        ])
                      }
                      style={{
                        marginTop: 12,
                        backgroundColor: theme.dangerSoft || '#FCE8E8',
                        borderRadius: 14,
                        paddingVertical: 12,
                        alignItems: 'center',
                      }}
                    >
                      <Text style={{ color: theme.danger, fontWeight: '900' }}>Delete Course</Text>
                    </TouchableOpacity>
                  ) : null}
                </Card>
              );
            })}
          </View>
        ))
      ) : null}
    </AppShell>
  );
}

export function LecturesScreen({ navigation }) {
  const { theme } = useTheme();
  const { user } = useAuth();
  const { courses } = useData();
  const [search, setSearch] = useState('');
  const roleTone = getRoleTone(user?.role);
  const myClasses = getUserClasses(user, courses);
  const myCourses = getUserCourses(user, courses);

  const filteredCourses = myCourses.filter(
    course =>
      course.name.toLowerCase().includes(search.toLowerCase()) ||
      course.code.toLowerCase().includes(search.toLowerCase()) ||
      course.class.toLowerCase().includes(search.toLowerCase())
  );

  const nextByDay = useMemo(
    () =>
      ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map(day => ({
        day,
        count: filteredCourses.filter(course => course.day === day).length,
      })),
    [filteredCourses]
  );

  return (
    <AppShell
      navigation={navigation}
      activeTab="home"
      title="Lectures"
      headerBadge={`${filteredCourses.length} lectures`}
      accent={roleTone.bg}
    >
      <View
        style={{
          backgroundColor: theme.bgCard,
          borderRadius: 30,
          padding: 18,
          borderWidth: 1,
          borderColor: theme.border,
          marginTop: 18,
          marginBottom: 16,
        }}
      >
        <Text style={{ color: theme.textMuted, fontWeight: '800', fontSize: 12 }}>Lecture planning</Text>
        <Text style={{ color: theme.text, fontSize: 28, fontWeight: '900', marginTop: 6 }}>Teaching schedule</Text>
      </View>

      <View style={{ flexDirection: 'row', marginHorizontal: -5, marginBottom: 12 }}>
        <View style={{ flex: 1, paddingHorizontal: 5 }}>
          <MetricTile theme={theme} set={visualSets[0]} label="Classes" value={myClasses.length} helper="assigned to you" />
        </View>
        <View style={{ flex: 1, paddingHorizontal: 5 }}>
          <MetricTile theme={theme} set={visualSets[1]} label="Lectures" value={myCourses.length} helper="total sessions" />
        </View>
        <View style={{ flex: 1, paddingHorizontal: 5 }}>
          <MetricTile theme={theme} set={visualSets[2]} label="Active days" value={nextByDay.filter(item => item.count > 0).length} helper="teaching rhythm" />
        </View>
      </View>

      <SearchBar value={search} onChangeText={setSearch} placeholder="Search lectures, classes, or course codes..." />

      <Card style={{ borderRadius: 28, marginBottom: 14 }}>
        <Text style={{ color: theme.text, fontWeight: '900', fontSize: 17, marginBottom: 12 }}>Weekly spread</Text>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          {nextByDay.map(item => (
            <View key={item.day} style={{ alignItems: 'center', flex: 1 }}>
              <View
                style={{
                  width: 34,
                  height: 34 + item.count * 10,
                  borderRadius: 18,
                  backgroundColor: item.count > 0 ? roleTone.bg : theme.bgSecondary,
                  opacity: item.count > 0 ? 1 : 0.5,
                  justifyContent: 'flex-end',
                  alignItems: 'center',
                  paddingBottom: 8,
                }}
              >
                <Text style={{ color: item.count > 0 ? roleTone.text : theme.textMuted, fontWeight: '900', fontSize: 11 }}>
                  {item.count}
                </Text>
              </View>
              <Text style={{ color: theme.textMuted, fontSize: 11, fontWeight: '700', marginTop: 8 }}>
                {item.day.slice(0, 3)}
              </Text>
            </View>
          ))}
        </View>
      </Card>

      <Text style={{ color: theme.bgText, fontSize: 19, fontWeight: '900', marginBottom: 12 }}>Teaching schedule</Text>
      {filteredCourses.length === 0 ? (
        <EmptyState icon="LEC" message="No lectures scheduled" />
      ) : (
        filteredCourses.map(course => (
          <Card key={course.id} style={{ borderRadius: 26 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
              <View
                style={{
                  width: 50,
                  height: 50,
                  borderRadius: 18,
                  backgroundColor: theme.accentLighter,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 12,
                }}
              >
                <MaterialCommunityIcons name="presentation-play" size={24} color={theme.accentDark} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: theme.text, fontWeight: '900', fontSize: 15 }}>{course.name}</Text>
                <Text style={{ color: theme.textMuted, marginTop: 4, fontSize: 12 }}>{course.code}</Text>
              </View>
              <Badge label={course.day} color="submitted" />
            </View>

            <View style={{ flexDirection: 'row', marginHorizontal: -4 }}>
              {[
                { label: 'Time', value: course.time },
                { label: 'Venue', value: course.venue },
                { label: 'Class', value: course.class },
              ].map(item => (
                <View key={`${course.id}_${item.label}`} style={{ flex: 1, paddingHorizontal: 4 }}>
                  <View style={{ backgroundColor: theme.bgSecondary, borderRadius: 16, padding: 12 }}>
                    <Text style={{ color: theme.textMuted, fontSize: 10, fontWeight: '800' }}>{item.label.toUpperCase()}</Text>
                    <Text style={{ color: theme.text, marginTop: 6, fontWeight: '800' }}>{item.value}</Text>
                  </View>
                </View>
              ))}
            </View>
          </Card>
        ))
      )}
    </AppShell>
  );
}

export function CourseOutlinesScreen({ navigation }) {
  const { theme } = useTheme();
  const { user } = useAuth();
  const { courses, courseOutlines, saveCourseOutline, deleteCourseOutline } = useData();
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const roleTone = getRoleTone(user?.role);
  const myClasses = getUserClasses(user, courses);
  const myCourses = getUserCourses(user, courses);
  const availableClasses = myClasses;
  const [outlineForm, setOutlineForm] = useState({
    classCode: availableClasses[0]?.code || '',
    courseCode: myCourses[0]?.code || '',
    title: '',
    note: '',
    selectedFile: null,
  });

  const canManage = user.role === 'PL' || user.role === 'FMG';
  const visibleOutlines = courseOutlines.filter(outline => !outline?.deletedAt);
  const filteredOutlines = visibleOutlines.filter(outline =>
    `${outline.title} ${outline.courseCode} ${outline.attachmentName || ''}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );
  const selectedCourse = myCourses.find(course => course.code === outlineForm.courseCode && course.class === outlineForm.classCode);

  const updateOutlineForm = (key, value) => {
    setOutlineForm(current => ({ ...current, [key]: value }));
  };

  const pickOutlineDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        multiple: false,
        copyToCacheDirectory: true,
        type: [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ],
      });

      if (result.canceled || !result.assets?.[0]) {
        return;
      }

      const asset = result.assets[0];
      updateOutlineForm('selectedFile', {
        uri: asset.uri,
        name: asset.name,
        mimeType: asset.mimeType,
        size: asset.size,
        file: asset.file,
      });
    } catch (error) {
      Alert.alert('Document failed', error.message || 'Could not open the document picker.');
    }
  };

  const handleSaveOutline = async () => {
    if (!outlineForm.classCode || !outlineForm.courseCode || !outlineForm.title || !outlineForm.selectedFile) {
      Alert.alert('Missing details', 'Please select a class, course, title, and document.');
      return;
    }

    try {
      const course = myCourses.find(item => item.code === outlineForm.courseCode && item.class === outlineForm.classCode);
      await saveCourseOutline({
        ...outlineForm,
        courseName: course?.name || '',
        faculty: user.faculty,
        createdByName: user.name,
      });
      setOutlineForm({
        classCode: availableClasses[0]?.code || '',
        courseCode: myCourses[0]?.code || '',
        title: '',
        note: '',
        selectedFile: null,
      });
      setShowForm(false);
      Alert.alert('Saved', 'Course outline details saved successfully.');
    } catch (error) {
      Alert.alert('Save failed', error.message || 'Could not save the course outline right now.');
    }
  };

  return (
    <AppShell
      navigation={navigation}
      activeTab="home"
      title="Module Outlines"
      headerBadge={`${filteredOutlines.length} outline${filteredOutlines.length === 1 ? '' : 's'}`}
      accent={roleTone.bg}
    >
      <View
        style={{
          backgroundColor: theme.bgCard,
          borderRadius: 30,
          padding: 18,
          borderWidth: 1,
          borderColor: theme.border,
          marginTop: 18,
          marginBottom: 16,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ flex: 1, paddingRight: 12 }}>
            <Text style={{ color: theme.textMuted, fontWeight: '800', fontSize: 12 }}>Academic documents</Text>
            <Text style={{ color: theme.text, fontSize: 28, fontWeight: '900', marginTop: 6 }}>Module outlines</Text>
          </View>
          {canManage ? (
            <TouchableOpacity
              onPress={() => setShowForm(value => !value)}
              style={{
                width: 58,
                height: 58,
                borderRadius: 20,
                backgroundColor: roleTone.bg,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name={showForm ? 'close' : 'attach'} size={24} color={roleTone.text} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      <SearchBar value={search} onChangeText={setSearch} placeholder="Search outlines, modules, or file names..." />

      {showForm && canManage ? (
        <Card style={{ borderRadius: 28, borderWidth: 2, borderColor: roleTone.bg, marginBottom: 14 }}>
          <Text style={{ color: theme.text, fontWeight: '900', fontSize: 18, marginBottom: 14 }}>Attach module outline</Text>

          <Text style={{ color: theme.textMuted, fontSize: 12, fontWeight: '800', marginBottom: 8, textTransform: 'uppercase' }}>
            Class
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -4, marginBottom: 10 }}>
            {availableClasses.map(cls => (
              <TouchableOpacity
                key={cls.id}
                onPress={() => updateOutlineForm('classCode', cls.code)}
                style={{
                  backgroundColor: outlineForm.classCode === cls.code ? roleTone.bg : theme.bgSecondary,
                  borderRadius: 14,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  marginHorizontal: 4,
                  marginBottom: 8,
                }}
              >
                <Text style={{ color: outlineForm.classCode === cls.code ? roleTone.text : theme.text, fontSize: 12, fontWeight: '800' }}>
                  {cls.code}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={{ color: theme.textMuted, fontSize: 12, fontWeight: '800', marginBottom: 8, textTransform: 'uppercase' }}>
            Module
          </Text>
          <View style={{ marginBottom: 10 }}>
            {myCourses
              .filter(course => course.class === outlineForm.classCode)
              .map(course => (
                <TouchableOpacity
                  key={course.id}
                  onPress={() => updateOutlineForm('courseCode', course.code)}
                  style={{
                    backgroundColor: outlineForm.courseCode === course.code ? roleTone.bg : theme.bgSecondary,
                    borderRadius: 16,
                    padding: 14,
                    marginBottom: 8,
                  }}
                >
                  <Text style={{ color: outlineForm.courseCode === course.code ? roleTone.text : theme.text, fontWeight: '800', fontSize: 13 }}>
                    {course.name}
                  </Text>
                  <Text style={{ color: outlineForm.courseCode === course.code ? roleTone.text : theme.textMuted, fontSize: 11, marginTop: 3 }}>
                    {course.code}
                  </Text>
                </TouchableOpacity>
              ))}
          </View>

          <Input label="Outline title" value={outlineForm.title} onChangeText={value => updateOutlineForm('title', value)} placeholder="e.g. Semester 1 Course Outline" />
          <Btn title={outlineForm.selectedFile ? 'Change Document' : 'Choose PDF or Word Document'} onPress={pickOutlineDocument} variant="outline" />
          {outlineForm.selectedFile ? (
            <View style={{ backgroundColor: theme.bgSecondary, borderRadius: 16, padding: 12, marginBottom: 14 }}>
              <Text style={{ color: theme.text, fontWeight: '800' }}>{outlineForm.selectedFile.name}</Text>
              <Text style={{ color: theme.textMuted, fontSize: 12, marginTop: 4 }}>
                {outlineForm.selectedFile.mimeType || 'Document'} • {outlineForm.selectedFile.size ? `${Math.round(outlineForm.selectedFile.size / 1024)} KB` : 'Size unavailable'}
              </Text>
            </View>
          ) : null}
          <Input label="Notes" value={outlineForm.note} onChangeText={value => updateOutlineForm('note', value)} placeholder="Optional note for lecturers and students" multiline numberOfLines={3} />

          <Btn title="Save Outline" onPress={handleSaveOutline} />
        </Card>
      ) : null}

      {filteredOutlines.length === 0 ? (
        <EmptyState icon="CRS" message="No module outlines have been shared yet." />
      ) : (
        filteredOutlines.map(outline => {
          const course = courses.find(entry => entry.code === outline.courseCode && entry.class === outline.classCode) || selectedCourse;
          const courseVisual = getCourseVisual(course);
          const documentUrl = resolveDocumentUrl(outline.attachmentUrl || outline.outlineLink);

          return (
            <Card key={outline.id} style={{ borderRadius: 26 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                <View
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 18,
                    backgroundColor: courseVisual.bg,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 12,
                  }}
                >
                  <MaterialCommunityIcons name={courseVisual.icon} size={24} color={courseVisual.ink} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: theme.text, fontWeight: '900', fontSize: 15 }}>{outline.title}</Text>
                  <Text style={{ color: theme.textMuted, marginTop: 4, fontSize: 12 }}>
                    {outline.courseName || course?.name || outline.courseCode} • {outline.classCode}
                  </Text>
                </View>
                <Badge label={outline.status || outline.courseCode} color={outline.status || 'reviewed'} />
              </View>

              <View style={{ backgroundColor: theme.bgSecondary, borderRadius: 18, padding: 14, marginBottom: 12 }}>
                <Text style={{ color: theme.textMuted, fontSize: 11, fontWeight: '800' }}>ATTACHMENT</Text>
                <Text style={{ color: theme.text, marginTop: 6, fontWeight: '700' }}>
                  {outline.attachmentName || 'Outline document'}
                </Text>
                {outline.note ? (
                  <Text style={{ color: theme.textMuted, marginTop: 6, lineHeight: 18 }}>
                    {outline.note}
                  </Text>
                ) : null}
              </View>

              <View style={{ flexDirection: 'row', marginHorizontal: -4 }}>
                <View style={{ flex: 1, paddingHorizontal: 4 }}>
                  <Btn
                    title="Open Document"
                    onPress={async () => {
                      try {
                        if (!documentUrl) {
                          Alert.alert('Unavailable', 'No document is attached to this outline yet.');
                          return;
                        }
                        await openDocumentUrl(documentUrl);
                      } catch (error) {
                        Alert.alert('Open failed', error.message || 'Could not open this outline right now.');
                      }
                    }}
                  />
                </View>
                {canManage ? (
                  <View style={{ flex: 1, paddingHorizontal: 4 }}>
                    <Btn
                      title="Delete"
                      variant="danger"
                      onPress={() =>
                        Alert.alert('Delete outline', `Remove ${outline.title}?`, [
                          { text: 'Cancel', style: 'cancel' },
                          {
                            text: 'Delete',
                            style: 'destructive',
                            onPress: async () => {
                              try {
                                await deleteCourseOutline(outline);
                                Alert.alert('Deleted', 'Course outline removed successfully.');
                              } catch (error) {
                                Alert.alert('Delete failed', error.message || 'Could not remove this course outline right now.');
                              }
                            },
                          },
                        ])
                      }
                    />
                  </View>
                ) : null}
              </View>
            </Card>
          );
        })
      )}
    </AppShell>
  );
}
