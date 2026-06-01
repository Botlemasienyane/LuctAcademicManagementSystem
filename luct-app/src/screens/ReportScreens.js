import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StatusBar, Alert, Platform, Modal, Pressable } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as XLSX from 'xlsx';
import { getAttendanceMessage, getRoleTone, useTheme } from '../context/ThemeContext';
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
  const roleTone = getRoleTone(user.role);
  const scopedClasses = getUserClasses(user, courses);
  const scopedClassCodes = new Set(scopedClasses.map(cls => cls.code));
  const scopedClassNames = new Set(scopedClasses.map(cls => cls.name));

  useEffect(() => {
    if (user.role === 'Student') {
      navigation.replace('Attendance');
    }
  }, [navigation, user.role]);

  if (user.role === 'Student') return null;

  let myReports =
    // Each role only sees reports allowed for that role.
    user.role === 'FMG'
      ? reports
      : user.role === 'PL'
      ? reports.filter(report => report.faculty === user.faculty)
      : user.role === 'PRL'
      ? reports.filter(report => scopedClassCodes.has(report.classCode) || scopedClassNames.has(report.className))
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
  const editableCount = filtered.filter(report => report.status !== 'reviewed' && report.createdByUid === user.id).length;
  const reportTitle =
    user.role === 'PRL'
      ? 'Stream Reports'
      : user.role === 'PL'
        ? 'Faculty Reports'
        : user.role === 'Lecturer'
          ? 'My Reports'
          : user.role === 'FMG'
            ? 'University Reports'
            : 'Reports';
  const reportSubtitle =
    user.role === 'PRL'
      ? ''
      : user.role === 'PL'
        ? ''
      : user.role === 'Lecturer'
        ? ''
          : user.role === 'FMG'
            ? ''
            : '';
  const feedbackLabel =
    user.role === 'PRL'
      ? 'PRL Feedback'
      : user.role === 'PL'
        ? 'PL Feedback'
        : user.role === 'FMG'
          ? 'FMG Feedback'
          : 'Feedback';
  const feedbackPlaceholder =
    user.role === 'PRL'
      ? 'Write PRL feedback for this lecturer report'
      : user.role === 'PL'
        ? 'Write programme leader feedback for this report'
        : 'Write review feedback for this lecturer report';

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
      title={reportTitle}
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
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: theme.text, fontSize: 22, fontWeight: '900' }}>{reportTitle}</Text>
            {reportSubtitle ? <Text style={{ color: theme.textMuted, marginTop: 4 }}>{reportSubtitle}</Text> : null}
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
          <StatCard label={user.role === 'Lecturer' ? 'Editable Reports' : 'Reviewed Reports'} value={user.role === 'Lecturer' ? editableCount : reviewedCount} />
        </View>

        <SearchBar
          value={search}
          onChangeText={setSearch}
          placeholder={
            user.role === 'PRL'
              ? 'Search stream reports...'
              : user.role === 'PL'
                ? 'Search faculty reports...'
                : 'Search reports...'
          }
        />

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
          <EmptyState
            icon="REP"
            message={
              user.role === 'Lecturer'
                ? 'No lecturer reports submitted yet'
                : user.role === 'PRL'
                  ? 'No lecturer reports in your stream yet'
                  : user.role === 'PL'
                    ? 'No reports available for your faculty yet'
                    : 'No reports available right now'
            }
          />
        ) : (
          filtered.map(report => (
            <Card key={report.id}>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: theme.text, fontWeight: '700', fontSize: 14 }}>{report.courseName}</Text>
                  <Text style={{ color: theme.textMuted, fontSize: 11, marginTop: 2 }}>
                    {report.courseCode} - {report.week}
                  </Text>
                </View>
                <Badge label={report.status} color={report.status} />
              </View>

              <View style={{ backgroundColor: theme.bgSecondary, borderRadius: 8, padding: 10, marginBottom: 10 }}>
                <Text style={{ color: theme.textMuted, fontSize: 11, fontWeight: '600' }}>CLASS - LECTURER</Text>
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
                  <Text style={{ color: theme.textMuted, fontSize: 10, fontWeight: '600' }}>VENUE - TIME</Text>
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
              ) : user.role === 'Lecturer' && report.createdByUid === user.id && report.status !== 'reviewed' ? (
                <View style={{ alignItems: 'center', justifyContent: 'center', paddingTop: 4 }}>
                  <Text style={{ color: theme.textMuted, fontSize: 12, textAlign: 'center', marginBottom: 10 }}>
                    You can still update this report before it is reviewed.
                  </Text>
                  <Btn title="Edit Report" onPress={() => navigation.navigate('ReportForm', { reportId: report.id })} variant="outline" size="sm" />
                </View>
              ) : user.role === 'PRL' || user.role === 'PL' || user.role === 'FMG' ? (
                <View>
                  <Input
                    label={feedbackLabel}
                    value={feedbackDrafts[report.id] || ''}
                    onChangeText={value => setFeedbackDrafts(current => ({ ...current, [report.id]: value }))}
                    placeholder={feedbackPlaceholder}
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

export function ReportFormScreen({ navigation, route }) {
  const { theme, isDark } = useTheme();
  const { user } = useAuth();
  const { reports, attendance, addReport, updateReport, addAttendance, updateAttendance, courses } = useData();
  const myClasses = getUserClasses(user, courses);
  const myCourses = getUserCourses(user, courses);
  const reportId = route?.params?.reportId;
  const existingReport = reports.find(report => report.id === reportId);
  const linkedAttendance = attendance.find(record => record.reportId === reportId);
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
    if (existingReport) {
      return buildFormState(
        { name: existingReport.className, code: existingReport.classCode, totalStudents: existingReport.totalRegistered },
        {
          name: existingReport.courseName,
          code: existingReport.courseCode,
          venue: existingReport.venue,
          time: existingReport.scheduledTime,
        }
      );
    }
    const initialClass = myClasses[0];
    const initialCourse = myCourses.find(course => course.class === initialClass?.code) || myCourses[0];
    return buildFormState(initialClass, initialCourse);
  });

  useEffect(() => {
    if (!existingReport) return;
    setForm({
      facultyName: existingReport.facultyName || '',
      className: existingReport.className || '',
      classCode: existingReport.classCode || '',
      week: existingReport.week || WEEKS[5],
      dateOfLecture: existingReport.dateOfLecture || new Date().toISOString().split('T')[0],
      courseName: existingReport.courseName || '',
      courseCode: existingReport.courseCode || '',
      lecturerName: existingReport.lecturerName || user.name,
      actualStudents: String(existingReport.actualStudents ?? ''),
      totalRegistered: String(existingReport.totalRegistered ?? ''),
      venue: existingReport.venue || '',
      scheduledTime: existingReport.scheduledTime || '',
      topicTaught: existingReport.topicTaught || '',
      learningOutcomes: existingReport.learningOutcomes || '',
      recommendations: existingReport.recommendations || '',
      faculty: existingReport.faculty || user.faculty,
    });
  }, [existingReport, user.faculty, user.name]);

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

    if (existingReport?.status === 'reviewed') {
      Alert.alert('Locked Report', 'This report has already been reviewed and can no longer be edited.');
      return;
    }

    if (submitting) return;
    setSubmitting(true);

    try {
      const actualStudents = parseInt(form.actualStudents, 10) || 0;
      const totalRegistered = parseInt(form.totalRegistered, 10) || 0;

      // Save the report and also save the attendance record from the same submission.
      const reportPayload = { ...form, actualStudents, totalRegistered };

      if (existingReport) {
        await updateReport(existingReport.id, {
          ...reportPayload,
          updatedAt: new Date().toISOString(),
          updatedByUid: user.id,
        });

        if (linkedAttendance) {
          await updateAttendance(linkedAttendance.id, {
            classCode: form.classCode,
            courseCode: form.courseCode,
            date: form.dateOfLecture,
            present: actualStudents,
            total: totalRegistered,
            lecturerName: user.name,
            updatedAt: new Date().toISOString(),
          });
        }
      } else {
        const createdReport = await addReport(reportPayload);
        await addAttendance({
          classCode: form.classCode,
          courseCode: form.courseCode,
          date: form.dateOfLecture,
          present: actualStudents,
          total: totalRegistered,
          lecturerName: user.name,
          reportId: createdReport.id,
        });
      }

      Alert.alert(existingReport ? 'Updated' : 'Submitted', existingReport ? 'Report updated successfully.' : 'Report submitted successfully.', [
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
            <Text style={{ color: theme.bgTextMuted || theme.textMuted, fontSize: 12 }}>
              {existingReport ? 'Update your report before review' : 'Lecturer Reporting Form'}
            </Text>
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

        <Btn
          title={
            submitting
              ? existingReport
                ? 'Saving...'
                : 'Submitting...'
              : existingReport
                ? 'Save Changes'
                : 'Submit Report'
          }
          onPress={handleSubmit}
          size="lg"
          disabled={submitting || existingReport?.status === 'reviewed'}
        />
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
  const { reports, attendance, ratings, deleteRating, courses } = useData();
  const [search, setSearch] = useState('');
  const [selectedModuleCode, setSelectedModuleCode] = useState('');
  const scopedClasses = getUserClasses(user, courses);
  const scopedClassCodes = new Set(scopedClasses.map(cls => cls.code));
  const isStudent = user.role === 'Student';
  const myCourses = getUserCourses(user, courses);
  const myReports =
    user.role === 'FMG'
      ? reports
      : isStudent
        ? reports.filter(report => report.classCode === user.class)
        : user.role === 'PRL'
          ? reports.filter(report => scopedClassCodes.has(report.classCode))
          : reports.filter(report => report.faculty === user.faculty || lecturerMatchesUser(report.lecturerName, user.name));
  const myAttendance =
    user.role === 'FMG'
      ? attendance
      : isStudent
        ? attendance.filter(record => record.createdByUid === user.id || record.studentName === user.name)
        : user.role === 'Lecturer'
          ? attendance.filter(record => lecturerMatchesUser(record.lecturerName, user.name))
          : attendance.filter(record => scopedClassCodes.has(record.classCode));
  const myRatings =
    isStudent
      ? ratings.filter(rating => rating.submittedBy === user.id)
      : user.role === 'FMG'
        ? ratings
        : ratings.filter(rating => scopedClassCodes.has(rating.classCode) || rating.classCode === user.class);

  const byCourse = myReports.reduce((accumulator, report) => {
    if (search && !`${report.courseName} ${report.courseCode}`.toLowerCase().includes(search.toLowerCase())) {
      return accumulator;
    }

    const key = report.courseName || report.courseCode || 'Course';
    accumulator[key] = accumulator[key] || { count: 0, present: 0, total: 0 };
    accumulator[key].count += 1;
    accumulator[key].present += report.actualStudents || 0;
    accumulator[key].total += report.totalRegistered || 0;
    return accumulator;
  }, {});
  const attendanceRate =
    myAttendance.reduce((sum, record) => sum + (record.total || 0), 0) > 0
      ? Math.round(
          (myAttendance.reduce((sum, record) => sum + (record.present || 0), 0) /
            myAttendance.reduce((sum, record) => sum + (record.total || 0), 0)) *
            100
        )
      : 0;
  const studentModules = myCourses
    .filter(course => !search || `${course.name} ${course.code}`.toLowerCase().includes(search.toLowerCase()))
    .map(course => {
      const moduleRecords = myAttendance
        .filter(record => record.courseCode === course.code && record.classCode === course.class)
        .sort((a, b) => `${a.date || ''}`.localeCompare(`${b.date || ''}`));
      const totalSessions = moduleRecords.length;
      const presentSessions = moduleRecords.filter(record => record.present > 0).length;
      const percentage = totalSessions > 0 ? Math.round((presentSessions / totalSessions) * 100) : 0;
      return {
        ...course,
        totalSessions,
        presentSessions,
        percentage,
        records: moduleRecords,
      };
    });
  const firstStudentModuleCode = studentModules[0]?.code || '';
  const hasSelectedStudentModule = !!selectedModuleCode && studentModules.some(module => module.code === selectedModuleCode);
  const activeStudentModule = studentModules.find(module => module.code === selectedModuleCode) || studentModules[0] || null;
  const studentRatings = myRatings
    .filter(rating => !search || `${rating.lecturerName} ${rating.comment || ''}`.toLowerCase().includes(search.toLowerCase()))
    .slice(0, 6);
  const reviewedCount = myReports.filter(report => report.status === 'reviewed').length;
  const summaryTone = attendanceRate >= 75 ? theme.success : theme.warning;
  const summaryBg = attendanceRate >= 75 ? theme.successSoft : theme.warningSoft;

  useEffect(() => {
    if (!isStudent || !firstStudentModuleCode) return;
    if (!hasSelectedStudentModule) {
      setSelectedModuleCode(firstStudentModuleCode);
    }
  }, [firstStudentModuleCode, hasSelectedStudentModule, isStudent]);

  return (
    <AppShell
      navigation={navigation}
      activeTab="analytics"
      title="Monitoring"
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
        <Text style={{ color: theme.text, fontSize: 22, fontWeight: '900' }}>Monitoring</Text>
        <View style={{ flexDirection: 'row', marginHorizontal: -4, marginBottom: 14 }}>
          <StatCard label={isStudent ? 'Attendance' : 'Reports'} value={isStudent ? `${attendanceRate}%` : myReports.length} />
          <StatCard label={isStudent ? 'Ratings' : 'Reviewed'} value={isStudent ? myRatings.length : reviewedCount} />
        </View>

        <Card style={{ backgroundColor: summaryBg, marginBottom: 14 }}>
          <Text style={{ color: summaryTone, fontSize: 12, fontWeight: '800' }}>Attendance overview</Text>
          <Text style={{ color: summaryTone, fontSize: 24, fontWeight: '900', marginTop: 4 }}>
            {isStudent ? `${attendanceRate}%` : `${Object.keys(byCourse).length} courses`}
          </Text>
          {isStudent ? <Text style={{ color: summaryTone, marginTop: 4 }}>{getAttendanceMessage(attendanceRate)}</Text> : null}
        </Card>

        <SearchBar
          value={search}
          onChangeText={setSearch}
          placeholder={isStudent ? 'Search modules or ratings...' : 'Filter monitoring by course...'}
        />

        {isStudent && studentModules.length > 0 ? (
          <Card>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
              {studentModules.map(module => {
                const active = activeStudentModule?.code === module.code;
                return (
                  <TouchableOpacity
                    key={module.code}
                    onPress={() => setSelectedModuleCode(module.code)}
                    style={{
                      backgroundColor: active ? theme.info : theme.bgSecondary,
                      borderRadius: 16,
                      paddingHorizontal: 14,
                      paddingVertical: 10,
                      marginRight: 8,
                    }}
                  >
                    <Text style={{ color: active ? '#FFFFFF' : theme.text, fontWeight: '800', fontSize: 12 }}>{module.code}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {activeStudentModule ? (
              <View style={{ backgroundColor: theme.bgSecondary, borderRadius: 18, padding: 14 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View style={{ flex: 1, paddingRight: 12 }}>
                    <Text style={{ color: theme.text, fontWeight: '900', fontSize: 16 }}>{activeStudentModule.name}</Text>
                    <Text style={{ color: theme.textMuted, fontSize: 12, marginTop: 4 }}>
                      {activeStudentModule.code} - {activeStudentModule.presentSessions}/{activeStudentModule.totalSessions} saved
                    </Text>
                  </View>
                  <Badge label={`${activeStudentModule.percentage}%`} color={activeStudentModule.percentage >= 75 ? 'reviewed' : 'pending'} />
                </View>
                <View style={{ backgroundColor: theme.bgCard, borderRadius: 999, height: 10, overflow: 'hidden', marginTop: 12 }}>
                  <View
                    style={{
                      backgroundColor: activeStudentModule.percentage >= 75 ? theme.success : theme.warning,
                      width: `${activeStudentModule.percentage}%`,
                      height: '100%',
                    }}
                  />
                </View>
                <Text style={{ color: activeStudentModule.percentage >= 75 ? theme.success : theme.warning, fontWeight: '800', marginTop: 10 }}>
                  {activeStudentModule.totalSessions > 0
                    ? getAttendanceMessage(activeStudentModule.percentage)
                    : 'No attendance has been recorded for this module yet.'}
                </Text>
              </View>
            ) : null}
          </Card>
        ) : null}

        {isStudent ? (
          <Card>
            <Text style={{ color: theme.text, fontWeight: '700', fontSize: 15, marginBottom: 14 }}>Attendance by module</Text>
            {studentModules.length === 0 ? (
              <EmptyState icon="ATT" message="No module attendance has been recorded yet." />
            ) : (
              <View>
                <Text style={{ color: theme.text, fontWeight: '800', fontSize: 14, marginBottom: 12 }}>
                  {activeStudentModule?.name || 'Selected module'}
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={{ flexDirection: 'row' }}>
                    <View style={{ width: 74, paddingTop: 38, marginRight: 10 }}>
                      <View style={{ height: 42, justifyContent: 'center' }}>
                        <Text style={{ color: theme.success, fontWeight: '800', fontSize: 12 }}>Present</Text>
                      </View>
                      <View style={{ height: 42, justifyContent: 'center' }}>
                        <Text style={{ color: theme.danger, fontWeight: '800', fontSize: 12 }}>Absent</Text>
                      </View>
                    </View>

                    {(activeStudentModule?.records || []).map((record, index) => {
                      const present = record.present > 0;
                      return (
                        <View
                          key={record.id}
                          style={{
                            width: 74,
                            backgroundColor: theme.bgSecondary,
                            borderRadius: 18,
                            paddingVertical: 10,
                            paddingHorizontal: 8,
                            marginRight: 10,
                            alignItems: 'center',
                          }}
                        >
                          <Text style={{ color: theme.text, fontWeight: '800', fontSize: 11 }}>
                            W{index + 1}
                          </Text>
                          <Text style={{ color: theme.textMuted, fontSize: 10, marginTop: 4 }}>
                            {record.date?.slice(5) || ''}
                          </Text>

                          <View style={{ height: 42, justifyContent: 'center', alignItems: 'center', marginTop: 10 }}>
                            {present ? (
                              <View
                                style={{
                                  width: 14,
                                  height: 14,
                                  borderRadius: 7,
                                  backgroundColor: theme.success,
                                }}
                              />
                            ) : null}
                          </View>

                          <View style={{ height: 42, justifyContent: 'center', alignItems: 'center' }}>
                            {!present ? (
                              <View
                                style={{
                                  width: 14,
                                  height: 14,
                                  borderRadius: 7,
                                  backgroundColor: theme.danger,
                                }}
                              />
                            ) : null}
                          </View>
                        </View>
                      );
                    })}
                  </View>
                </ScrollView>
              </View>
            )}
          </Card>
        ) : Object.entries(byCourse).length > 0 ? (
          <Card>
            <Text style={{ color: theme.text, fontWeight: '700', fontSize: 15, marginBottom: 14 }}>By course</Text>
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
                    {data.present}/{data.total} - {data.count} session{data.count !== 1 ? 's' : ''}
                  </Text>
                </View>
              );
            })}
          </Card>
        ) : (
          <EmptyState icon="MON" message="No monitoring data is available yet." />
        )}

        {isStudent && (
          <Card>
            <Text style={{ color: theme.text, fontWeight: '700', fontSize: 15, marginBottom: 14 }}>Your ratings</Text>
            {studentRatings.length === 0 ? (
              <EmptyState icon="RATE" message="You have not submitted any ratings yet." />
            ) : (
              studentRatings.map(rating => (
                <View key={rating.id} style={{ backgroundColor: theme.bgSecondary, borderRadius: 16, padding: 12, marginBottom: 10 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <View style={{ flex: 1, paddingRight: 10 }}>
                      <Text style={{ color: theme.text, fontWeight: '800' }}>{rating.lecturerName}</Text>
                      <Text style={{ color: theme.textMuted, fontSize: 12, marginTop: 4 }}>
                        {rating.rating}/5 - {rating.date}
                      </Text>
                      <Text style={{ color: theme.text, fontSize: 12, marginTop: 8 }}>
                        {rating.comment || 'No written comment added.'}
                      </Text>
                    </View>
                    <Btn
                      title="Delete"
                      size="sm"
                      variant="outline"
                      onPress={() =>
                        Alert.alert('Delete rating', `Remove your rating for ${rating.lecturerName}?`, [
                          { text: 'Cancel', style: 'cancel' },
                          {
                            text: 'Delete',
                            style: 'destructive',
                            onPress: async () => {
                              await deleteRating(rating.id);
                            },
                          },
                        ])
                      }
                    />
                  </View>
                </View>
              ))
            )}
          </Card>
        )}

      </View>
    </AppShell>
  );
}


