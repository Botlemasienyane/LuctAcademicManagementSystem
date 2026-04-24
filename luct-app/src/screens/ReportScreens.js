import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StatusBar, Alert, Platform, Modal, Pressable } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as XLSX from 'xlsx';
import { getRoleLabel, useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { FACULTIES, WEEKS } from '../data/seedData';
import { AppShell } from '../components/AppShell';
import { Card, SearchBar, Badge, EmptyState, Input, Btn, StatCard } from '../components/UI';
import { getUserClasses, getUserCourses, lecturerMatchesUser } from '../utils/scope';

const buildCSV = reports => {
  // Reports can be exported for sharing or checking outside the app.
  const header = 'Faculty,Class,Week,Date,Course,Code,Lecturer,Present,Total,Venue,Time,Topic,Outcomes,Recommendations,Status,Feedback\n';
  const escape = value => `"${String(value ?? '').replace(/"/g, '""')}"`;
  const rows = reports
    .map(report =>
      [
        report.facultyName,
        report.className,
        report.week,
        report.dateOfLecture,
        report.courseName,
        report.courseCode,
        report.lecturerName,
        report.actualStudents,
        report.totalRegistered,
        report.venue,
        report.scheduledTime,
        report.topicTaught,
        report.learningOutcomes,
        report.recommendations,
        report.status,
        report.feedback,
      ]
        .map(escape)
        .join(',')
    )
    .join('\n');

  return header + rows;
};

const buildWorkbook = (reports) => {
  const columns = [
    'Faculty',
    'Class',
    'Week',
    'Date',
    'Course',
    'Code',
    'Lecturer',
    'Present',
    'Total',
    'Venue',
    'Time',
    'Topic',
    'Outcomes',
    'Recommendations',
    'Status',
    'Feedback',
  ];

  const data = [
    columns,
    ...reports.map(report => ([
      report.facultyName,
      report.className,
      report.week,
      report.dateOfLecture,
      report.courseName,
      report.courseCode,
      report.lecturerName,
      report.actualStudents,
      report.totalRegistered,
      report.venue,
      report.scheduledTime,
      report.topicTaught,
      report.learningOutcomes,
      report.recommendations,
      report.status,
      report.feedback,
    ])),
  ];

  const worksheet = XLSX.utils.aoa_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Reports');
  return workbook;
};

const FS_UTF8 = FileSystem.EncodingType?.UTF8 || 'utf8';
const FS_BASE64 = FileSystem.EncodingType?.Base64 || 'base64';

export function ReportsScreen({ navigation, route }) {
  const { theme } = useTheme();
  const { user } = useAuth();
  const { reports, addFeedback, courses } = useData();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  const [feedbackDrafts, setFeedbackDrafts] = useState({});
  const filterClass = route?.params?.filterClass;

  let myReports =
    // Each role only sees reports allowed for that role.
    user.role === 'FMG'
      ? reports
      : user.role === 'PL' || user.role === 'PRL'
      ? reports.filter(report => report.faculty === user.faculty)
      : user.role === 'Lecturer'
      ? reports.filter(report => lecturerMatchesUser(report.lecturerName, user.name))
      : reports.filter(report => report.classCode === user.class);

  if (filterClass) {
    myReports = myReports.filter(report => report.classCode === filterClass.code || report.className === filterClass.name);
  }

  const filtered = myReports.filter(report => {
    const matchSearch =
      report.courseName.toLowerCase().includes(search.toLowerCase()) ||
      report.lecturerName.toLowerCase().includes(search.toLowerCase()) ||
      report.className.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'All' || report.status === filter.toLowerCase();
    return matchSearch && matchFilter;
  });

  const reviewedCount = filtered.filter(report => report.status === 'reviewed').length;

  const exportCSV = async () => {
    const csv = buildCSV(filtered);

    try {
      if (Platform.OS === 'web') {
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = `luct-reports-${Date.now()}.csv`;
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);
        URL.revokeObjectURL(url);
        Alert.alert('Export Complete', `Downloaded ${filtered.length} report(s) as CSV.`);
        return;
      }

      const fileUri = `${FileSystem.cacheDirectory}luct-reports-${Date.now()}.csv`;
      await FileSystem.writeAsStringAsync(fileUri, csv, {
        encoding: FS_UTF8,
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'text/csv',
          dialogTitle: 'Share reports CSV',
        });
      } else {
        Alert.alert('Export Complete', `CSV saved to ${fileUri}`);
      }
    } catch (error) {
      Alert.alert('Export Failed', error.message || 'Unable to export reports right now.');
    }
  };

  const exportExcel = async () => {
    const workbook = buildWorkbook(filtered);

    try {
      if (Platform.OS === 'web') {
        const arrayBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([arrayBuffer], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = `luct-reports-${Date.now()}.xlsx`;
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);
        URL.revokeObjectURL(url);
        Alert.alert('Export Complete', `Downloaded ${filtered.length} report(s) as Excel.`);
        return;
      }

      const base64 = XLSX.write(workbook, { bookType: 'xlsx', type: 'base64' });
      const fileUri = `${FileSystem.cacheDirectory}luct-reports-${Date.now()}.xlsx`;
      await FileSystem.writeAsStringAsync(fileUri, base64, {
        encoding: FS_BASE64,
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          dialogTitle: 'Share reports Excel',
        });
      } else {
        Alert.alert('Export Complete', `Excel saved to ${fileUri}`);
      }
    } catch (error) {
      Alert.alert('Export Failed', error.message || 'Unable to export reports right now.');
    }
  };

  const handleExport = () => {
    if (filtered.length === 0) {
      Alert.alert('Nothing to Export', 'No reports match your current filters.');
      return;
    }

    Alert.alert('Export Reports', 'Choose a format:', [
      { text: 'Excel (.xlsx)', onPress: exportExcel },
      { text: 'CSV (.csv)', onPress: exportCSV },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const saveFeedback = report => {
    const text = (feedbackDrafts[report.id] || '').trim();
    if (!text) {
      Alert.alert('Missing Feedback', 'Please enter feedback before saving.');
      return;
    }

    addFeedback(report.id, text);
    setFeedbackDrafts(current => ({ ...current, [report.id]: '' }));
  };

  return (
    <AppShell
      navigation={navigation}
      activeTab="reports"
      title="Reports"
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
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: theme.text, fontSize: 22, fontWeight: '900' }}>Reports</Text>
            <Text style={{ color: theme.textMuted, marginTop: 4 }}>{getRoleLabel(user.role)}</Text>
          </View>
          <TouchableOpacity
            onPress={handleExport}
            style={{
              backgroundColor: theme.accentLighter,
              borderRadius: 16,
              paddingHorizontal: 14,
              paddingVertical: 11,
            }}
          >
            <Text style={{ fontSize: 12, color: theme.accentDark, fontWeight: '900' }}>Export</Text>
          </TouchableOpacity>
        </View>

        <View style={{ flexDirection: 'row', marginBottom: 16, marginHorizontal: -4 }}>
          <StatCard label="Visible Reports" value={filtered.length} />
          <StatCard label="Reviewed Reports" value={reviewedCount} />
        </View>

        <SearchBar value={search} onChangeText={setSearch} placeholder="Search reports..." />

        <View style={{ flexDirection: 'row', backgroundColor: theme.bgSecondary, borderRadius: 12, padding: 4, marginBottom: 16 }}>
          {['All', 'Submitted', 'Reviewed'].map(status => (
            <TouchableOpacity
              key={status}
              onPress={() => setFilter(status)}
              style={{
                flex: 1,
                paddingVertical: 8,
                borderRadius: 9,
                alignItems: 'center',
                backgroundColor: filter === status ? theme.bgCard : 'transparent',
              }}
            >
              <Text style={{ color: filter === status ? theme.text : theme.textMuted, fontWeight: filter === status ? '700' : '400', fontSize: 12 }}>
                {status}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {user.role === 'Lecturer' && (
          <TouchableOpacity
            onPress={() => navigation.navigate('ReportForm')}
            style={{ backgroundColor: theme.accent, borderRadius: 12, padding: 14, alignItems: 'center', marginBottom: 16 }}
          >
            <Text style={{ color: theme.accentText, fontWeight: '700', fontSize: 15 }}>Submit New Report</Text>
          </TouchableOpacity>
        )}

        {filtered.length === 0 ? (
          <EmptyState icon="REP" message="No reports found" />
        ) : (
          filtered.map(report => (
            <Card key={report.id}>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: theme.text, fontWeight: '700', fontSize: 14 }}>{report.courseName}</Text>
                  <Text style={{ color: theme.textMuted, fontSize: 11, marginTop: 2 }}>
                    {report.courseCode} • {report.week}
                  </Text>
                </View>
                <Badge label={report.status} color={report.status} />
              </View>

              <View style={{ backgroundColor: theme.bgSecondary, borderRadius: 8, padding: 10, marginBottom: 10 }}>
                <Text style={{ color: theme.textMuted, fontSize: 11, fontWeight: '600' }}>CLASS • LECTURER</Text>
                <Text style={{ color: theme.text, fontSize: 13, marginTop: 2 }}>{report.className}</Text>
                <Text style={{ color: theme.textMuted, fontSize: 12 }}>{report.lecturerName}</Text>
              </View>

              <View style={{ flexDirection: 'row', marginBottom: 10 }}>
                <View style={{ flex: 1, backgroundColor: theme.bgSecondary, borderRadius: 8, padding: 8, marginRight: 6 }}>
                  <Text style={{ color: theme.textMuted, fontSize: 10, fontWeight: '600' }}>ATTENDANCE</Text>
                  <Text style={{ color: theme.text, fontSize: 18, fontWeight: '800', marginTop: 2 }}>
                    {report.actualStudents}/{report.totalRegistered}
                  </Text>
                </View>
                <View style={{ flex: 1, backgroundColor: theme.bgSecondary, borderRadius: 8, padding: 8 }}>
                  <Text style={{ color: theme.textMuted, fontSize: 10, fontWeight: '600' }}>VENUE • TIME</Text>
                  <Text style={{ color: theme.text, fontSize: 12, fontWeight: '700', marginTop: 2 }}>{report.venue}</Text>
                  <Text style={{ color: theme.textMuted, fontSize: 11 }}>{report.scheduledTime}</Text>
                </View>
              </View>

              <View style={{ marginBottom: 10 }}>
                <Text style={{ color: theme.textMuted, fontSize: 11, fontWeight: '600', marginBottom: 3 }}>TOPIC</Text>
                <Text style={{ color: theme.text, fontSize: 13 }}>{report.topicTaught}</Text>
              </View>
              <View style={{ marginBottom: 10 }}>
                <Text style={{ color: theme.textMuted, fontSize: 11, fontWeight: '600', marginBottom: 3 }}>LEARNING OUTCOMES</Text>
                <Text style={{ color: theme.text, fontSize: 13 }}>{report.learningOutcomes}</Text>
              </View>
              <View style={{ marginBottom: 10 }}>
                <Text style={{ color: theme.textMuted, fontSize: 11, fontWeight: '600', marginBottom: 3 }}>RECOMMENDATIONS</Text>
                <Text style={{ color: theme.text, fontSize: 13 }}>{report.recommendations}</Text>
              </View>

              {report.feedback ? (
                <View style={{ backgroundColor: theme.bgSecondary, borderRadius: 8, padding: 10, borderLeftWidth: 3, borderLeftColor: theme.accent }}>
                  <Text style={{ color: theme.textMuted, fontSize: 10, fontWeight: '700' }}>REVIEW FEEDBACK</Text>
                  <Text style={{ color: theme.text, fontSize: 13, marginTop: 3 }}>{report.feedback}</Text>
                </View>
              ) : user.role === 'PRL' || user.role === 'PL' || user.role === 'FMG' ? (
                <View>
                  <Input
                    label="Add Feedback"
                    value={feedbackDrafts[report.id] || ''}
                    onChangeText={value => setFeedbackDrafts(current => ({ ...current, [report.id]: value }))}
                    placeholder="Write review feedback for this lecturer report"
                    multiline
                    numberOfLines={3}
                  />
                  <Btn title="Save Feedback" onPress={() => saveFeedback(report)} variant="outline" size="sm" />
                </View>
              ) : null}
            </Card>
          ))
        )}

      </View>
    </AppShell>
  );
}

export function ReportFormScreen({ navigation }) {
  const { theme, isDark } = useTheme();
  const { user } = useAuth();
  const { addReport, addAttendance, courses } = useData();
  const myClasses = getUserClasses(user, courses);
  const myCourses = getUserCourses(user, courses);
  const [picker, setPicker] = useState({ open: false, title: '', items: [], getLabel: null, onPick: null });
  const [pickerSearch, setPickerSearch] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const buildFormState = (selectedClass, selectedCourse) => ({
    // These fields match the lecturer report form from the brief.
    facultyName: FACULTIES.find(faculty => faculty.id === user.faculty)?.name || '',
    className: selectedClass?.name || '',
    classCode: selectedClass?.code || '',
    week: WEEKS[5],
    dateOfLecture: new Date().toISOString().split('T')[0],
    courseName: selectedCourse?.name || '',
    courseCode: selectedCourse?.code || '',
    lecturerName: user.name,
    actualStudents: '',
    totalRegistered: selectedClass?.totalStudents?.toString() || '',
    venue: selectedCourse?.venue || '',
    scheduledTime: selectedCourse?.time || '',
    topicTaught: '',
    learningOutcomes: '',
    recommendations: '',
    faculty: user.faculty,
  });

  const [form, setForm] = useState(() => {
    const initialClass = myClasses[0];
    const initialCourse = myCourses.find(course => course.class === initialClass?.code) || myCourses[0];
    return buildFormState(initialClass, initialCourse);
  });

  const availableCourses = useMemo(
    () => myCourses.filter(course => course.class === form.classCode),
    [form.classCode, myCourses]
  );

  const update = (key, value) => setForm(current => ({ ...current, [key]: value }));

  const applyClass = (selectedClass) => {
    const classCourses = myCourses.filter(course => course.class === selectedClass.code);
    const selectedCourse = classCourses[0];
    setForm(current => ({
      ...current,
      className: selectedClass.name,
      classCode: selectedClass.code,
      totalRegistered: selectedClass.totalStudents.toString(),
      courseName: selectedCourse?.name || '',
      courseCode: selectedCourse?.code || '',
      venue: selectedCourse?.venue || '',
      scheduledTime: selectedCourse?.time || '',
    }));
  };

  const applyCourse = (selectedCourse) => {
    setForm(current => ({
      ...current,
      courseName: selectedCourse.name,
      courseCode: selectedCourse.code,
      venue: selectedCourse.venue,
      scheduledTime: selectedCourse.time,
    }));
  };

  const openPicker = ({ title, items, getLabel, onPick }) => {
    setPickerSearch('');
    setPicker({ open: true, title, items, getLabel, onPick });
  };

  const closePicker = () => setPicker(current => ({ ...current, open: false }));

  const filteredPickerItems = useMemo(() => {
    if (!picker.open) return [];
    if (!pickerSearch) return picker.items;
    const q = pickerSearch.toLowerCase();
    return picker.items.filter(item => (picker.getLabel?.(item) || '').toLowerCase().includes(q));
  }, [picker, pickerSearch]);

  const handleSubmit = async () => {
    if (!form.classCode || !form.courseCode || !form.topicTaught || !form.actualStudents || !form.learningOutcomes) {
      Alert.alert('Missing Fields', 'Please fill in class, course, topic, attendance, and learning outcomes.');
      return;
    }

    if (submitting) return;
    setSubmitting(true);

    try {
      const actualStudents = parseInt(form.actualStudents, 10) || 0;
      const totalRegistered = parseInt(form.totalRegistered, 10) || 0;

      // Save the report and also save the attendance record from the same submission.
      await addReport({ ...form, actualStudents, totalRegistered });
      await addAttendance({
        classCode: form.classCode,
        courseCode: form.courseCode,
        date: form.dateOfLecture,
        present: actualStudents,
        total: totalRegistered,
        lecturerName: user.name,
      });

      Alert.alert('Submitted', 'Report submitted successfully.', [
        { text: 'Open Reports', onPress: () => navigation.navigate('Reports') },
      ]);
    } catch (error) {
      Alert.alert('Submit Failed', error.message || 'Could not submit the report. Check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={theme.bg} />
      <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 60 }} keyboardShouldPersistTaps="handled">
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginRight: 12 }}>
            <Text style={{ color: theme.accent, fontSize: 14, fontWeight: '700' }}>Back</Text>
          </TouchableOpacity>
          <View>
            <Text style={{ color: theme.bgText || theme.text, fontSize: 22, fontWeight: '800' }}>Submit Report</Text>
            <Text style={{ color: theme.bgTextMuted || theme.textMuted, fontSize: 12 }}>Lecturer Reporting Form</Text>
          </View>
        </View>

        <Card>
          <Text style={{ color: theme.text, fontWeight: '700', fontSize: 15, marginBottom: 14 }}>Report Details</Text>
          <Input label="Faculty Name" value={form.facultyName} onChangeText={value => update('facultyName', value)} editable={false} />

          <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 10 }}>
            <View style={{ flex: 1 }}>
              <Input label="Class Name" value={form.className} onChangeText={() => {}} editable={false} />
            </View>
            <Btn
              title="Choose"
              variant="outline"
              size="sm"
              onPress={() =>
                openPicker({
                  title: 'Choose Class',
                  items: myClasses,
                  getLabel: (cls) => `${cls.name} (${cls.code})`,
                  onPick: (cls) => applyClass(cls),
                })
              }
              disabled={myClasses.length === 0}
            />
          </View>

          <Text style={{ color: theme.textSecondary, fontSize: 12, fontWeight: '600', marginBottom: 5, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Week of Reporting
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
            {WEEKS.map(week => (
              <TouchableOpacity
                key={week}
                onPress={() => update('week', week)}
                style={{ backgroundColor: form.week === week ? theme.accent : theme.bgSecondary, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 }}
              >
                <Text style={{ color: form.week === week ? theme.accentText : theme.textMuted, fontSize: 12, fontWeight: '600' }}>
                  {week}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 10 }}>
            <View style={{ flex: 1 }}>
              <Input label="Date of Lecture" value={form.dateOfLecture} onChangeText={value => update('dateOfLecture', value)} placeholder="YYYY-MM-DD" autoCapitalize="none" />
            </View>
            <Btn
              title="Today"
              variant="outline"
              size="sm"
              onPress={() => update('dateOfLecture', new Date().toISOString().split('T')[0])}
            />
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 10 }}>
            <View style={{ flex: 1 }}>
              <Input label="Course Name" value={form.courseName} onChangeText={() => {}} editable={false} />
            </View>
            <Btn
              title="Choose"
              variant="outline"
              size="sm"
              onPress={() =>
                openPicker({
                  title: 'Choose Course',
                  items: availableCourses,
                  getLabel: (c) => `${c.name} (${c.code}) · ${c.day} ${c.time}`,
                  onPick: (c) => applyCourse(c),
                })
              }
              disabled={availableCourses.length === 0}
            />
          </View>

          <Input label="Course Code" value={form.courseCode} onChangeText={value => update('courseCode', value)} editable={false} />
          <Input label="Lecturer's Name" value={form.lecturerName} onChangeText={value => update('lecturerName', value)} editable={false} />
          <Input label="Actual Students Present" value={form.actualStudents} onChangeText={value => update('actualStudents', value)} keyboardType="numeric" placeholder="e.g. 22" />
          <Input label="Total Registered Students" value={form.totalRegistered} onChangeText={value => update('totalRegistered', value)} keyboardType="numeric" editable={false} />
          <Input label="Venue of Class" value={form.venue} onChangeText={value => update('venue', value)} editable={false} />
          <Input label="Scheduled Lecture Time" value={form.scheduledTime} onChangeText={value => update('scheduledTime', value)} editable={false} />
        </Card>

        <Card>
          <Text style={{ color: theme.text, fontWeight: '700', fontSize: 15, marginBottom: 14 }}>Lecture Content</Text>
          <Input label="Topic Taught" value={form.topicTaught} onChangeText={value => update('topicTaught', value)} placeholder="What was covered in this lecture?" multiline numberOfLines={3} />
          <Input label="Learning Outcomes" value={form.learningOutcomes} onChangeText={value => update('learningOutcomes', value)} placeholder="What should students be able to do?" multiline numberOfLines={4} />
          <Input label="Lecturer's Recommendations" value={form.recommendations} onChangeText={value => update('recommendations', value)} placeholder="Any suggestions or improvements?" multiline numberOfLines={3} />
        </Card>

        <Btn title={submitting ? 'Submitting...' : 'Submit Report'} onPress={handleSubmit} size="lg" disabled={submitting} />
        <View style={{ height: 40 }} />
      </ScrollView>

      <Modal visible={picker.open} transparent animationType="fade" onRequestClose={closePicker}>
        <Pressable onPress={closePicker} style={{ flex: 1, backgroundColor: theme.overlay || 'rgba(0,0,0,0.32)', padding: 20, justifyContent: 'center' }}>
          <Pressable
            onPress={() => {}}
            style={{
              backgroundColor: theme.bgCard,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: theme.border,
              padding: 16,
              maxHeight: '80%',
            }}
          >
            <Text style={{ color: theme.text, fontSize: 16, fontWeight: '800', marginBottom: 10 }}>{picker.title}</Text>
            <SearchBar value={pickerSearch} onChangeText={setPickerSearch} placeholder="Search..." />
            <ScrollView>
              {filteredPickerItems.length === 0 ? (
                <EmptyState icon="INFO" message="No options found" />
              ) : (
                filteredPickerItems.map((item, index) => (
                  <TouchableOpacity
                    key={`${picker.title}_${index}`}
                    onPress={() => {
                      picker.onPick?.(item);
                      closePicker();
                    }}
                    style={{ backgroundColor: theme.bgSecondary, borderRadius: 12, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: theme.border }}
                  >
                    <Text style={{ color: theme.text, fontWeight: '700', fontSize: 13 }}>{picker.getLabel?.(item) || 'Option'}</Text>
                  </TouchableOpacity>
                ))
              )}
              <View style={{ height: 6 }} />
            </ScrollView>
            <Btn title="Close" variant="outline" onPress={closePicker} />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

export function MonitoringScreen({ navigation }) {
  const { theme } = useTheme();
  const { user } = useAuth();
  const { reports, courses } = useData();
  const [search, setSearch] = useState('');
  const myReports =
    user.role === 'FMG'
      ? reports
      : user.role === 'Student'
      ? reports.filter(report => report.classCode === user.class)
      : reports.filter(report => report.faculty === user.faculty || lecturerMatchesUser(report.lecturerName, user.name));
  const byCourse = myReports.reduce((accumulator, report) => {
    if (search && !report.courseName.toLowerCase().includes(search.toLowerCase())) {
      return accumulator;
    }

    accumulator[report.courseName] = accumulator[report.courseName] || { count: 0, present: 0, total: 0 };
    accumulator[report.courseName].count += 1;
    accumulator[report.courseName].present += report.actualStudents || 0;
    accumulator[report.courseName].total += report.totalRegistered || 0;
    return accumulator;
  }, {});

  return (
    <AppShell
      navigation={navigation}
      activeTab="analytics"
      title="Insights"
      accent={theme.info}
    >
      <View
        style={{
          marginTop: 18,
          backgroundColor: theme.bgCard,
          borderRadius: 28,
          padding: 18,
          borderWidth: 1,
          borderColor: theme.border,
          marginBottom: 18,
        }}
      >
        <Text style={{ color: theme.text, fontSize: 22, fontWeight: '900' }}>Insights</Text>
        <Text style={{ color: theme.textMuted, marginTop: 6, marginBottom: 14 }}>
          Attendance summary by course.
        </Text>
        <Text style={{ color: theme.textMuted, fontSize: 12, marginBottom: 14 }}>
          This screen covers the monitoring view required by the brief.
        </Text>

        <SearchBar value={search} onChangeText={setSearch} placeholder="Filter monitoring by course..." />

        {Object.entries(byCourse).length > 0 && (
          <Card>
            <Text style={{ color: theme.text, fontWeight: '700', fontSize: 15, marginBottom: 14 }}>By Course</Text>
            {Object.entries(byCourse).map(([name, data]) => {
              const rate = data.total > 0 ? Math.round((data.present / data.total) * 100) : 0;
              return (
                <View key={name} style={{ marginBottom: 14 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                    <Text style={{ color: theme.text, fontSize: 12, fontWeight: '600', flex: 1 }} numberOfLines={1}>
                      {name}
                    </Text>
                    <Text style={{ color: theme.text, fontSize: 12, fontWeight: '700' }}>{rate}%</Text>
                  </View>
                  <View style={{ backgroundColor: theme.bgSecondary, borderRadius: 6, height: 6, overflow: 'hidden' }}>
                    <View style={{ backgroundColor: theme.accent, width: `${rate}%`, height: '100%' }} />
                  </View>
                  <Text style={{ color: theme.textMuted, fontSize: 10, marginTop: 2 }}>
                    {data.present}/{data.total} • {data.count} session{data.count !== 1 ? 's' : ''}
                  </Text>
                </View>
              );
            })}
          </Card>
        )}

      </View>
    </AppShell>
  );
}
