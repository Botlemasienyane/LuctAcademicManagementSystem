import React, { useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { AppShell } from '../components/AppShell';
import { Card, EmptyState, Input, SearchBar, Btn, Badge } from '../components/UI';
import { getAttendanceMessage, getProgressTone, getRatingTone, getRoleTone, useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { CLASSES } from '../data/seedData';
import { getUserClasses, getUserCourses, lecturerMatchesUser } from '../utils/scope';

const metricPalettes = [
  { bg: '#EEF6FF', ink: '#2B6EF2', icon: 'chart-line' },
  { bg: '#FFF4E8', ink: '#F56A37', icon: 'account-group' },
  { bg: '#F2ECFF', ink: '#8256F2', icon: 'calendar-check' },
];

function HeroStat({ theme, palette, label, value, helper }) {
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
          backgroundColor: palette.bg,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 10,
        }}
      >
        <MaterialCommunityIcons name={palette.icon} size={22} color={palette.ink} />
      </View>
      <Text style={{ color: theme.text, fontWeight: '900', fontSize: 24 }}>{value}</Text>
      <Text style={{ color: theme.text, fontWeight: '700', marginTop: 4 }}>{label}</Text>
      <Text style={{ color: palette.ink, fontSize: 11, marginTop: 6, fontWeight: '800' }}>{helper}</Text>
    </View>
  );
}

export function AttendanceScreen({ navigation, route }) {
  const { theme } = useTheme();
  const { user } = useAuth();
  const { attendance, addAttendance, deleteAttendance, courses } = useData();
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    classCode: '',
    courseCode: '',
    date: new Date().toISOString().split('T')[0],
    present: '',
    total: '',
  });

  const roleTone = getRoleTone(user?.role);
  const update = (key, value) => setForm(current => ({ ...current, [key]: value }));
  const myClasses = getUserClasses(user, courses);
  const myCourses = getUserCourses(user, courses);
  const classCourses = myCourses.filter(course => course.class === form.classCode);
  const isStudent = user.role === 'Student';
  const studentClass = myClasses[0] || null;
  const studentClassCode = studentClass?.code || '';
  const routeCourseCode = route?.params?.courseCode || '';
  const preferredStudentCourseCode =
    myCourses.find(course => course.code === routeCourseCode && course.class === studentClassCode)?.code ||
    myCourses.find(course => course.class === studentClassCode)?.code ||
    '';

  const myAttendance =
    // Attendance records are filtered by role so each user sees only their own area.
    isStudent
      ? attendance.filter(record => record.createdByUid === user.id || record.studentName === user.name)
      : user.role === 'Lecturer'
        ? attendance.filter(record => lecturerMatchesUser(record.lecturerName, user.name))
        : attendance.filter(record => myClasses.some(cls => cls.code === record.classCode));
  const sortedAttendance = [...myAttendance].sort((a, b) => {
    const left = `${b.date || ''}T${b.createdAt || ''}`;
    const right = `${a.date || ''}T${a.createdAt || ''}`;
    return left.localeCompare(right);
  });

  const studentMarks = sortedAttendance.filter(record => record.createdByUid === user.id);
  const studentMarkedToday = studentMarks.some(
    record => record.date === form.date && record.courseCode === form.courseCode && record.classCode === form.classCode
  );
  const studentModuleCards = useMemo(
    () =>
      myCourses.map(course => {
        const moduleRecords = sortedAttendance.filter(record => record.courseCode === course.code && record.classCode === course.class);
        const totalSessions = moduleRecords.length;
        const presentSessions = moduleRecords.filter(record => record.present > 0).length;
        return {
          ...course,
          totalSessions,
          presentSessions,
          percentage: totalSessions > 0 ? Math.round((presentSessions / totalSessions) * 100) : 0,
          lastDate: moduleRecords[0]?.date || null,
        };
      }),
    [myCourses, sortedAttendance]
  );

  const filteredAttendance = sortedAttendance.filter(record => {
    if (!search) return true;
    const cls = CLASSES.find(entry => entry.code === record.classCode);
    const course = courses.find(entry => entry.code === record.courseCode && entry.class === record.classCode);
    const haystack = [
      record.date,
      record.classCode,
      cls?.name,
      record.courseCode,
      course?.name,
      record.lecturerName,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    return haystack.includes(search.toLowerCase());
  });

  const averageRate =
    myAttendance.length > 0
      ? Math.round(
          sortedAttendance.reduce((sum, record) => sum + (record.total > 0 ? (record.present / record.total) * 100 : 0), 0) /
            sortedAttendance.length
        )
      : 0;
  const totalPresent = sortedAttendance.reduce((sum, record) => sum + (record.present || 0), 0);
  const totalRegistered = sortedAttendance.reduce((sum, record) => sum + (record.total || 0), 0);
  const averageTone = getProgressTone(theme, averageRate);

  const handleSelectClass = selectedClass => {
    const selectedCourse = myCourses.find(course => course.class === selectedClass.code);
    setForm({
      classCode: selectedClass.code,
      courseCode: selectedCourse?.code || '',
      date: new Date().toISOString().split('T')[0],
      present: isStudent ? '1' : '',
      total: isStudent ? '1' : selectedClass.totalStudents.toString(),
    });
  };

  const handleSubmit = async () => {
    if (!form.classCode || !form.courseCode) {
      Alert.alert('Missing details', 'Please select a class and a course.');
      return;
    }

    if (!isStudent && !form.present) {
      Alert.alert('Missing details', 'Please enter the number of students present.');
      return;
    }

    if (isStudent && studentMarkedToday) {
      Alert.alert('Already marked', 'You have already marked yourself present for today.');
      return;
    }

    await addAttendance({
      ...form,
      present: isStudent ? 1 : parseInt(form.present, 10),
      total: isStudent ? 1 : parseInt(form.total, 10),
      lecturerName: isStudent ? '' : user.name,
      studentName: isStudent ? user.name : '',
      source: isStudent ? 'student-self-mark' : 'staff-roll-call',
    });
    setForm({
      classCode: isStudent ? studentClass?.code || '' : '',
      courseCode: isStudent ? form.courseCode : '',
      date: new Date().toISOString().split('T')[0],
      present: isStudent ? '1' : '',
      total: isStudent ? '1' : '',
    });

    Alert.alert(
      isStudent ? 'Marked Present' : 'Attendance Saved',
      isStudent ? 'Your attendance has been recorded.' : 'Attendance recorded successfully.'
    );
  };

  useEffect(() => {
    if (!studentClassCode || !isStudent) return;
    setForm(current => {
      const nextClassCode = current.classCode || studentClassCode;
      const nextCourseCode = current.courseCode || preferredStudentCourseCode;
      const nextPresent = '1';
      const nextTotal = '1';

      if (
        current.classCode === nextClassCode &&
        current.courseCode === nextCourseCode &&
        current.present === nextPresent &&
        current.total === nextTotal
      ) {
        return current;
      }

      return {
        ...current,
        classCode: nextClassCode,
        courseCode: nextCourseCode,
        present: nextPresent,
        total: nextTotal,
      };
    });
  }, [isStudent, preferredStudentCourseCode, studentClassCode]);

  return (
    <AppShell
      navigation={navigation}
      activeTab="analytics"
      title="Attendance"
      headerBadge={isStudent ? `${studentMarks.length} mark${studentMarks.length === 1 ? '' : 's'}` : `${filteredAttendance.length} logs`}
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
            <Text style={{ color: theme.textMuted, fontWeight: '800', fontSize: 12 }}>Attendance</Text>
            <Text style={{ color: theme.text, fontSize: 28, fontWeight: '900', marginTop: 6 }}>
              {isStudent ? 'Mark attendance' : 'Attendance analytics'}
            </Text>
          </View>
          {!isStudent && (user.role === 'Lecturer' || user.role === 'PRL') && (
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
          <HeroStat
            theme={theme}
            palette={metricPalettes[0]}
            label={isStudent ? 'Modules' : 'Sessions'}
            value={isStudent ? studentModuleCards.length : myAttendance.length}
            helper={isStudent ? 'on your register' : 'captured records'}
          />
        </View>
        <View style={{ flex: 1, paddingHorizontal: 5 }}>
          <HeroStat
            theme={theme}
            palette={metricPalettes[1]}
            label={isStudent ? 'Today' : 'Present'}
            value={isStudent ? (studentMarkedToday ? 'Yes' : 'No') : totalPresent}
            helper={isStudent ? 'marked for today' : `${totalRegistered || 0} seats tracked`}
          />
        </View>
        <View style={{ flex: 1, paddingHorizontal: 5 }}>
          <HeroStat
            theme={theme}
            palette={metricPalettes[2]}
            label={isStudent ? 'Class' : 'Average'}
            value={isStudent ? (studentClass?.code || 'N/A') : `${averageRate}%`}
            helper={isStudent ? 'your registered class' : getAttendanceMessage(averageRate)}
          />
        </View>
      </View>

      <Card style={{ borderRadius: 24, marginBottom: 14, backgroundColor: averageTone.bg }}>
        <Text style={{ color: averageTone.text, fontSize: 12, fontWeight: '800' }}>
          {isStudent ? 'Attendance status' : 'Attendance status'}
        </Text>
        <Text style={{ color: averageTone.text, fontSize: 24, fontWeight: '900', marginTop: 4 }}>
          {isStudent ? (studentMarkedToday ? 'Present' : 'Pending') : `${averageRate}%`}
        </Text>
        <Text style={{ color: averageTone.text, marginTop: 4 }}>
          {isStudent
            ? studentMarkedToday
              ? 'Your attendance has already been recorded for this date.'
              : 'You can still mark yourself present for this date.'
            : getAttendanceMessage(averageRate)}
        </Text>
      </Card>

      {isStudent ? (
        <Card style={{ borderRadius: 24, marginBottom: 14 }}>
          <Text style={{ color: theme.text, fontWeight: '900', fontSize: 16, marginBottom: 12 }}>Module attendance</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 36 }}>
            {studentModuleCards.map((module, index) => {
              const tone = getProgressTone(theme, module.percentage);
              const isSelected = form.courseCode === module.code;
              return (
                <TouchableOpacity
                  key={module.id}
                  onPress={() =>
                    setForm(current => ({
                      ...current,
                      classCode: module.class,
                      courseCode: module.code,
                      present: '1',
                      total: '1',
                    }))
                  }
                  style={{
                    width: 236,
                    backgroundColor: isSelected ? roleTone.tint : theme.bgSecondary,
                    borderRadius: 18,
                    padding: 14,
                    marginRight: index === studentModuleCards.length - 1 ? 0 : 12,
                    borderWidth: 1,
                    borderColor: isSelected ? roleTone.bg : theme.border,
                  }}
                >
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <View style={{ flex: 1, paddingRight: 12 }}>
                      <Text style={{ color: theme.text, fontWeight: '900', fontSize: 14 }}>{module.name}</Text>
                      <Text style={{ color: theme.textMuted, fontSize: 12, marginTop: 4 }}>
                        {module.code} • {module.lastDate || 'No attendance saved'}
                      </Text>
                    </View>
                    <Badge label={`${module.percentage}%`} color={module.percentage >= 75 ? 'reviewed' : 'pending'} />
                  </View>
                  <View style={{ backgroundColor: theme.bgCard, borderRadius: 999, height: 8, overflow: 'hidden' }}>
                    <View style={{ backgroundColor: tone.fill, width: `${module.percentage}%`, height: '100%' }} />
                  </View>
                  <Text style={{ color: tone.text, fontSize: 12, fontWeight: '800', marginTop: 8 }}>
                    {module.totalSessions > 0 ? getAttendanceMessage(module.percentage) : 'No attendance has been recorded for this module yet.'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </Card>
      ) : null}

      {isStudent ? (
        <Card style={{ borderRadius: 24, marginBottom: 14 }}>
          <Text style={{ color: theme.text, fontWeight: '900', fontSize: 16, marginBottom: 12 }}>Recent attendance</Text>
          {studentMarks.length === 0 ? (
            <EmptyState icon="ATT" message="Your saved attendance will appear here" />
          ) : (
            studentMarks.slice(0, 5).map(record => {
              const course = courses.find(entry => entry.code === record.courseCode && entry.class === record.classCode);
              const rate = record.total > 0 ? Math.round((record.present / record.total) * 100) : 0;
              const rateTone = getProgressTone(theme, rate);

              return (
                <View
                  key={record.id}
                  style={{
                    backgroundColor: theme.bgSecondary,
                    borderRadius: 18,
                    padding: 14,
                    marginBottom: 10,
                    borderWidth: 1,
                    borderColor: theme.border,
                  }}
                >
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <View style={{ flex: 1, paddingRight: 12 }}>
                      <Text style={{ color: theme.text, fontWeight: '900', fontSize: 14 }}>
                        {course?.name || record.courseCode}
                      </Text>
                      <Text style={{ color: theme.textMuted, fontSize: 12, marginTop: 4 }}>
                        {record.courseCode} | {record.classCode}
                      </Text>
                    </View>
                    <Badge label={record.date} color="submitted" />
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, alignItems: 'center' }}>
                    <Text style={{ color: rateTone.text, fontWeight: '800' }}>
                      {record.present}/{record.total} present
                    </Text>
                    <Text style={{ color: rateTone.text, fontWeight: '900' }}>{rate}%</Text>
                  </View>
                </View>
              );
            })
          )}
        </Card>
      ) : null}

      {(isStudent || showForm) ? (
        <Card style={{ borderRadius: 28, borderWidth: 2, borderColor: roleTone.bg, marginBottom: 14 }}>
          <Text style={{ color: theme.text, fontWeight: '900', fontSize: 18, marginBottom: 14 }}>
            {isStudent ? 'Mark myself present' : 'Record class attendance'}
          </Text>
          <Text style={{ color: theme.textMuted, fontSize: 12, fontWeight: '800', marginBottom: 8, textTransform: 'uppercase' }}>
            {isStudent ? 'Your class' : 'Select class'}
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -4, marginBottom: 10 }}>
            {myClasses.map(cls => (
              <TouchableOpacity
                key={cls.id}
                onPress={() => handleSelectClass(cls)}
                style={{
                  backgroundColor: form.classCode === cls.code ? roleTone.bg : theme.bgSecondary,
                  borderRadius: 14,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  marginHorizontal: 4,
                  marginBottom: 8,
                }}
              >
                <Text style={{ color: form.classCode === cls.code ? roleTone.text : theme.text, fontSize: 12, fontWeight: '800' }}>
                  {cls.code}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {form.classCode ? (
            <>
              <Text style={{ color: theme.textMuted, fontSize: 12, fontWeight: '800', marginBottom: 8, textTransform: 'uppercase' }}>
                Select module
              </Text>
              <View style={{ marginBottom: 10 }}>
                {classCourses.map(course => (
                  <TouchableOpacity
                    key={course.id}
                    onPress={() => update('courseCode', course.code)}
                    style={{
                      backgroundColor: form.courseCode === course.code ? roleTone.bg : theme.bgSecondary,
                      borderRadius: 16,
                      padding: 14,
                      marginBottom: 8,
                    }}
                  >
                    <Text style={{ color: form.courseCode === course.code ? roleTone.text : theme.text, fontWeight: '800', fontSize: 13 }}>
                      {course.name}
                    </Text>
                    <Text style={{ color: form.courseCode === course.code ? roleTone.text : theme.textMuted, fontSize: 11, marginTop: 3 }}>
                      {course.code}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          ) : null}

          <Input label="Date of lecture" value={form.date} onChangeText={value => update('date', value)} placeholder="YYYY-MM-DD" />
          {!isStudent ? (
            <>
              <Input label="Students present" value={form.present} onChangeText={value => update('present', value)} keyboardType="numeric" placeholder="e.g. 22" />
              <Input label="Registered students" value={form.total} onChangeText={value => update('total', value)} keyboardType="numeric" editable={false} />
            </>
          ) : null}
          <Btn title={isStudent ? 'Save Module Attendance' : 'Save Attendance'} onPress={handleSubmit} disabled={isStudent && studentMarkedToday} />
        </Card>
      ) : null}

      {!isStudent ? (
        <>
          <SearchBar value={search} onChangeText={setSearch} placeholder="Search attendance by class, course, date, lecturer..." />

          <Text style={{ color: theme.bgText, fontSize: 19, fontWeight: '900', marginBottom: 12 }}>Attendance records</Text>
          {filteredAttendance.length === 0 ? (
            <EmptyState icon="ATT" message="No attendance records in this view yet" />
          ) : (
            filteredAttendance.map(record => {
          const rate = record.total > 0 ? Math.round((record.present / record.total) * 100) : 0;
          const cls = CLASSES.find(entry => entry.code === record.classCode);
          const course = courses.find(entry => entry.code === record.courseCode && entry.class === record.classCode);
          const rateTone = getProgressTone(theme, rate);

          return (
            <Card key={record.id} style={{ borderRadius: 26 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                <View
                  style={{
                    width: 50,
                    height: 50,
                    borderRadius: 18,
                    backgroundColor: rateTone.bg,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 12,
                  }}
                >
                  <MaterialCommunityIcons name="calendar-check" size={24} color={rateTone.text} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: theme.text, fontWeight: '900', fontSize: 15 }}>{cls?.name || record.classCode}</Text>
                  <Text style={{ color: theme.textMuted, marginTop: 4, fontSize: 12 }}>
                    {course?.name || record.courseCode} | {record.lecturerName || 'LUCT'}
                  </Text>
                </View>
                <Text style={{ color: theme.textMuted, fontWeight: '700', fontSize: 12 }}>{record.date}</Text>
              </View>

              <View style={{ flexDirection: 'row', marginHorizontal: -4, marginBottom: 12 }}>
                <View style={{ flex: 1, paddingHorizontal: 4 }}>
                  <View style={{ backgroundColor: theme.bgSecondary, borderRadius: 16, padding: 12 }}>
                    <Text style={{ color: theme.textMuted, fontSize: 11, fontWeight: '800' }}>PRESENT</Text>
                    <Text style={{ color: theme.text, fontSize: 20, fontWeight: '900', marginTop: 6 }}>{record.present}</Text>
                  </View>
                </View>
                <View style={{ flex: 1, paddingHorizontal: 4 }}>
                  <View style={{ backgroundColor: theme.bgSecondary, borderRadius: 16, padding: 12 }}>
                    <Text style={{ color: theme.textMuted, fontSize: 11, fontWeight: '800' }}>REGISTERED</Text>
                    <Text style={{ color: theme.text, fontSize: 20, fontWeight: '900', marginTop: 6 }}>{record.total}</Text>
                  </View>
                </View>
                <View style={{ flex: 1, paddingHorizontal: 4 }}>
                  <View style={{ backgroundColor: rateTone.bg, borderRadius: 16, padding: 12 }}>
                    <Text style={{ color: rateTone.text, fontSize: 11, fontWeight: '800' }}>RATE</Text>
                    <Text style={{ color: rateTone.text, fontSize: 20, fontWeight: '900', marginTop: 6 }}>{rate}%</Text>
                  </View>
                </View>
              </View>

              <View style={{ backgroundColor: theme.bgSecondary, borderRadius: 999, height: 8, overflow: 'hidden' }}>
                <View style={{ backgroundColor: rateTone.fill, width: `${rate}%`, height: '100%' }} />
              </View>

              {(record.createdByUid === user.id || user.role === 'PL' || user.role === 'FMG') ? (
                <TouchableOpacity
                  onPress={() =>
                    Alert.alert('Delete attendance', `Remove attendance for ${record.courseCode}?`, [
                      { text: 'Cancel', style: 'cancel' },
                      {
                        text: 'Delete',
                        style: 'destructive',
                        onPress: async () => {
                          try {
                            await deleteAttendance(record.id);
                            Alert.alert('Deleted', 'Attendance removed successfully.');
                          } catch (error) {
                            Alert.alert('Delete failed', error.message || 'Could not delete attendance right now.');
                          }
                        },
                      },
                    ])
                  }
                  style={{
                    marginTop: 12,
                    backgroundColor: theme.dangerSoft || 'rgba(220,38,38,0.12)',
                    borderRadius: 14,
                    paddingVertical: 11,
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ color: theme.danger, fontWeight: '900' }}>Delete Attendance</Text>
                </TouchableOpacity>
              ) : null}
            </Card>
          );
            })
          )}
        </>
      ) : null}
    </AppShell>
  );
}

export function RatingScreen({ navigation }) {
  const { theme } = useTheme();
  const { user } = useAuth();
  const { ratings, addRating, deleteRating, courses } = useData();
  const [selectedLecturer, setSelectedLecturer] = useState('');
  const [selectedRating, setSelectedRating] = useState(0);
  const [comment, setComment] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const ratingTone = getRatingTone(theme);
  const roleTone = getRoleTone(user?.role);

  const myClasses = getUserClasses(user, courses);
  const classLecturers = [
    ...new Set(
      myClasses.flatMap(cls => courses.filter(course => course.class === cls.code).map(course => course.lecturer))
    ),
  ].filter(Boolean);
  const myRatings = user.role === 'Student' ? ratings.filter(rating => rating.submittedBy === user.id) : ratings;

  const filteredRatings = myRatings.filter(
    rating =>
      rating.lecturerName.toLowerCase().includes(search.toLowerCase()) ||
      (rating.comment || '').toLowerCase().includes(search.toLowerCase())
  );

  const handleSubmit = () => {
    if (!selectedLecturer || !selectedRating) {
      Alert.alert('Error', 'Please select a lecturer and rating.');
      return;
    }

    // Students submit ratings here and staff can review the saved feedback.
    addRating({
      lecturerName: selectedLecturer,
      rating: selectedRating,
      comment,
      submittedBy: user.id,
      classCode: user.class,
      date: new Date().toISOString().split('T')[0],
    });
    setSelectedLecturer('');
    setSelectedRating(0);
    setComment('');
    setShowForm(false);
    Alert.alert('Submitted', 'Thank you for your feedback.');
  };

  const avgByLecturer = filteredRatings.reduce((accumulator, rating) => {
    if (!accumulator[rating.lecturerName]) {
      accumulator[rating.lecturerName] = { total: 0, count: 0 };
    }
    accumulator[rating.lecturerName].total += rating.rating;
    accumulator[rating.lecturerName].count += 1;
    return accumulator;
  }, {});

  const featuredLecturers = Object.entries(avgByLecturer)
    .map(([name, data]) => ({
      name,
      average: data.total / data.count,
      count: data.count,
    }))
    .sort((a, b) => b.average - a.average)
    .slice(0, 3);

  return (
    <AppShell
      navigation={navigation}
      activeTab="analytics"
      title="Ratings"
      headerBadge={`${filteredRatings.length} reviews`}
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
            <Text style={{ color: theme.textMuted, fontWeight: '800', fontSize: 12 }}>Rating</Text>
            <Text style={{ color: theme.text, fontSize: 28, fontWeight: '900', marginTop: 6 }}>Rating and feedback</Text>
          </View>
          {user.role === 'Student' && (
            <TouchableOpacity
              onPress={() => setShowForm(value => !value)}
              style={{
                width: 58,
                height: 58,
                borderRadius: 20,
                backgroundColor: theme.warning,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name={showForm ? 'close' : 'star'} size={26} color="#FFFFFF" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={{ flexDirection: 'row', marginHorizontal: -5, marginBottom: 12 }}>
        <View style={{ flex: 1, paddingHorizontal: 5 }}>
          <HeroStat theme={theme} palette={{ bg: '#FFF4E8', ink: '#D97706', icon: 'star-circle' }} label="Reviews" value={filteredRatings.length} helper="feedback entries" />
        </View>
        <View style={{ flex: 1, paddingHorizontal: 5 }}>
          <HeroStat theme={theme} palette={{ bg: '#EEF6FF', ink: '#2B6EF2', icon: 'account-tie' }} label="Lecturers" value={Object.keys(avgByLecturer).length} helper="rated people" />
        </View>
        <View style={{ flex: 1, paddingHorizontal: 5 }}>
          <HeroStat theme={theme} palette={{ bg: '#F2ECFF', ink: '#8256F2', icon: 'message-draw' }} label="Commented" value={filteredRatings.filter(item => item.comment).length} helper="with written notes" />
        </View>
      </View>

      <Card style={{ borderRadius: 28, marginBottom: 14 }}>
        <Text style={{ color: theme.text, fontWeight: '900', fontSize: 17, marginBottom: 6 }}>Rating guide</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -4 }}>
          {[
            '1 Star - Poor',
            '2 Stars - Fair',
            '3 Stars - Good',
            '4 Stars - Very Good',
            '5 Stars - Excellent',
          ].map(item => (
            <View key={item} style={{ paddingHorizontal: 4, marginBottom: 8 }}>
              <View style={{ backgroundColor: theme.bgSecondary, borderRadius: 14, paddingHorizontal: 10, paddingVertical: 8 }}>
                <Text style={{ color: theme.text, fontWeight: '800', fontSize: 12 }}>{item}</Text>
              </View>
            </View>
          ))}
        </View>
      </Card>

      <SearchBar value={search} onChangeText={setSearch} placeholder="Search by lecturer or review comment..." />

      {showForm ? (
        <Card style={{ borderRadius: 28, borderWidth: 2, borderColor: theme.warning, marginBottom: 14 }}>
          <Text style={{ color: theme.text, fontWeight: '900', fontSize: 18, marginBottom: 14 }}>Rate a lecturer</Text>
          <Text style={{ color: theme.textMuted, fontSize: 12, fontWeight: '800', marginBottom: 8, textTransform: 'uppercase' }}>
            Select lecturer
          </Text>
          {classLecturers.length === 0 ? (
            <Text style={{ color: theme.textMuted, marginBottom: 12 }}>No lecturers found for your class.</Text>
          ) : (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -4, marginBottom: 8 }}>
              {classLecturers.map(lecturer => (
                <TouchableOpacity
                  key={lecturer}
                  onPress={() => setSelectedLecturer(lecturer)}
                  style={{
                    backgroundColor: selectedLecturer === lecturer ? theme.warning : theme.bgSecondary,
                    borderRadius: 16,
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    marginHorizontal: 4,
                    marginBottom: 8,
                  }}
                >
                  <Text style={{ color: selectedLecturer === lecturer ? '#FFFFFF' : theme.text, fontWeight: '800', fontSize: 12 }}>
                    {lecturer}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <Text style={{ color: theme.textMuted, fontSize: 12, fontWeight: '800', marginBottom: 10, textTransform: 'uppercase' }}>
            Rating
          </Text>
          <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 14 }}>
            {[1, 2, 3, 4, 5].map(value => (
              <TouchableOpacity key={value} onPress={() => setSelectedRating(value)} style={{ padding: 8 }}>
                <Ionicons
                  name={selectedRating >= value ? 'star' : 'star-outline'}
                  size={28}
                  color={selectedRating >= value ? ratingTone.text : theme.borderDark}
                />
              </TouchableOpacity>
            ))}
          </View>
          <Input
            label="Comment (optional)"
            value={comment}
            onChangeText={setComment}
            placeholder="Share your experience..."
            multiline
            numberOfLines={3}
          />
          <Btn title="Submit Rating" onPress={handleSubmit} />
        </Card>
      ) : null}

      {featuredLecturers.length > 0 ? (
        <Card style={{ borderRadius: 28, marginBottom: 14 }}>
          <Text style={{ color: theme.text, fontWeight: '900', fontSize: 17, marginBottom: 4 }}>Top rated lecturers</Text>
          {featuredLecturers.map((item, index) => (
            <View
              key={item.name}
              style={{
                backgroundColor: index === 0 ? ratingTone.bg : theme.bgSecondary,
                borderRadius: 18,
                padding: 14,
                marginBottom: 10,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: theme.text, fontWeight: '800' }}>{item.name}</Text>
                  <Text style={{ color: theme.textMuted, marginTop: 4, fontSize: 12 }}>
                    {item.count} review{item.count !== 1 ? 's' : ''}
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name="star" size={16} color={ratingTone.text} />
                  <Text style={{ color: ratingTone.text, fontWeight: '900', marginLeft: 4 }}>{item.average.toFixed(1)}</Text>
                </View>
              </View>
            </View>
          ))}
        </Card>
      ) : null}

      <Text style={{ color: theme.bgText, fontSize: 19, fontWeight: '900', marginBottom: 12 }}>All reviews</Text>
      {filteredRatings.length === 0 ? (
        <EmptyState icon="RATE" message="No reviews yet" />
      ) : (
        filteredRatings.map(rating => (
          <Card key={rating.id} style={{ borderRadius: 26 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
              <View
                style={{
                  width: 50,
                  height: 50,
                  borderRadius: 18,
                  backgroundColor: ratingTone.bg,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 12,
                }}
              >
                <Ionicons name="star" size={22} color={ratingTone.text} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: theme.text, fontWeight: '900', fontSize: 15 }}>{rating.lecturerName}</Text>
                <Text style={{ color: theme.textMuted, marginTop: 4, fontSize: 12 }}>{rating.date}</Text>
              </View>
              <Badge label={`${rating.rating}/5`} color="submitted" />
            </View>

            <View style={{ flexDirection: 'row', marginBottom: 12 }}>
              {[1, 2, 3, 4, 5].map(value => (
                <Ionicons
                  key={value}
                  name={rating.rating >= value ? 'star' : 'star-outline'}
                  size={18}
                  color={rating.rating >= value ? ratingTone.text : theme.borderDark}
                  style={{ marginRight: 4 }}
                />
              ))}
            </View>

            <View style={{ backgroundColor: theme.bgSecondary, borderRadius: 18, padding: 14 }}>
              <Text style={{ color: theme.textMuted, fontSize: 11, fontWeight: '800' }}>COMMENT</Text>
              <Text style={{ color: theme.text, marginTop: 8, lineHeight: 20 }}>
                {rating.comment || 'No written comment was added for this rating.'}
              </Text>
            </View>

            {(rating.createdByUid === user.id || user.role === 'FMG') ? (
              <TouchableOpacity
                onPress={() =>
                  Alert.alert('Delete rating', `Remove the rating for ${rating.lecturerName}?`, [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Delete',
                      style: 'destructive',
                      onPress: async () => {
                        try {
                          await deleteRating(rating.id);
                          Alert.alert('Deleted', 'Rating removed successfully.');
                        } catch (error) {
                          Alert.alert('Delete failed', error.message || 'Could not delete this rating right now.');
                        }
                      },
                    },
                  ])
                }
                style={{
                  marginTop: 12,
                  backgroundColor: theme.dangerSoft || 'rgba(220,38,38,0.12)',
                  borderRadius: 14,
                  paddingVertical: 11,
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: theme.danger, fontWeight: '900' }}>Delete Rating</Text>
              </TouchableOpacity>
            ) : null}
          </Card>
        ))
      )}
    </AppShell>
  );
}
