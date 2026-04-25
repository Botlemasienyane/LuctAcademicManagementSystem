import React, { useMemo, useState } from 'react';
import { Alert, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { AppShell } from '../components/AppShell';
import { Card, SearchBar, EmptyState, Input, Btn, Badge } from '../components/UI';
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
  const { courses } = useData();
  const [search, setSearch] = useState('');
  const filterClass = route?.params?.filterClass;
  const roleTone = getRoleTone(user?.role);

  const classes = filterClass ? [filterClass] : getUserClasses(user, courses);
  const filtered = classes.filter(
    cls =>
      cls.name.toLowerCase().includes(search.toLowerCase()) ||
      cls.code.toLowerCase().includes(search.toLowerCase()) ||
      cls.programme.toLowerCase().includes(search.toLowerCase())
  );

  const studentCount = filtered.reduce((sum, cls) => sum + (cls.totalStudents || 0), 0);

  return (
    <AppShell
      navigation={navigation}
      activeTab="home"
      title="Classes"
      subtitle="Assignment-ready class management"
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
        <Text style={{ color: theme.textMuted, marginTop: 6 }}>
          View classes, related courses, and reports for each class.
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

  const timeIcon = time => {
    const hour = parseInt(time, 10);
    if (hour < 10) return { label: 'AM', bg: '#EEF6FF', ink: '#2B6EF2' };
    if (hour < 12) return { label: 'MID', bg: '#F2ECFF', ink: '#8256F2' };
    if (hour < 14) return { label: 'PM', bg: '#FFF4E8', ink: '#F56A37' };
    return { label: 'LATE', bg: '#EAF8EF', ink: '#2BAF6A' };
  };

  const totalClasses = new Set(filtered.map(course => course.class)).size;

  return (
    <AppShell
      navigation={navigation}
      activeTab="home"
      title={filterClass ? `${filterClass.code} Courses` : 'Courses'}
      subtitle="Course assignment and lecture schedule"
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
            <Text style={{ color: theme.textMuted, marginTop: 6 }}>
              Manage course allocation and review the class timetable.
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
          <MetricTile theme={theme} set={visualSets[2]} label="Days" value={byDay.length} helper="active schedule" />
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
            <Text style={{ color: theme.text, fontSize: 18, fontWeight: '900', marginBottom: 10 }}>{day}</Text>
            {items.map(course => {
              const timeTone = timeIcon(course.time);
              return (
                <Card key={course.id} style={{ borderRadius: 26 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                    <View
                      style={{
                        width: 54,
                        height: 54,
                        borderRadius: 18,
                        backgroundColor: timeTone.bg,
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: 12,
                      }}
                    >
                      <Text style={{ color: timeTone.ink, fontWeight: '900', fontSize: 12 }}>{timeTone.label}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: theme.text, fontWeight: '900', fontSize: 15 }}>{course.name}</Text>
                      <Text style={{ color: theme.textMuted, marginTop: 4, fontSize: 12 }}>
                        {course.code} • {course.lecturer}
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
      subtitle="Teaching schedule and load"
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
        <Text style={{ color: theme.textMuted, marginTop: 6 }}>
          Review scheduled classes, venues, and teaching days.
        </Text>
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

      <Text style={{ color: theme.text, fontSize: 19, fontWeight: '900', marginBottom: 12 }}>Teaching schedule</Text>
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
