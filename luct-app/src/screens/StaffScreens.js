import React, { useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { AppShell } from '../components/AppShell';
import { Card, Badge, EmptyState, SearchBar } from '../components/UI';
import { getRoleTone, useTheme } from '../context/ThemeContext';
import { useData } from '../context/DataContext';
import { CLASSES, FACULTIES } from '../data/seedData';

const tones = [
  { bg: '#EEF6FF', ink: '#2B6EF2', icon: 'office-building' },
  { bg: '#FFF4E8', ink: '#F56A37', icon: 'account-group' },
  { bg: '#F2ECFF', ink: '#8256F2', icon: 'file-chart' },
];

function Tile({ theme, tone, label, value, helper }) {
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
          backgroundColor: tone.bg,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 10,
        }}
      >
        <MaterialCommunityIcons name={tone.icon} size={22} color={tone.ink} />
      </View>
      <Text style={{ color: theme.text, fontWeight: '900', fontSize: 24 }}>{value}</Text>
      <Text style={{ color: theme.text, fontWeight: '700', marginTop: 4 }}>{label}</Text>
      <Text style={{ color: tone.ink, fontSize: 11, marginTop: 6, fontWeight: '800' }}>{helper}</Text>
    </View>
  );
}

export function ProgrammeListScreen({ navigation }) {
  const { theme } = useTheme();
  const [search, setSearch] = useState('');
  const roleTone = getRoleTone('PL');
  const allPrograms = FACULTIES.flatMap(f =>
    f.programmes.map(programme => ({
      ...programme,
      facultyName: f.shortName,
      facultyId: f.id,
      faculty: f,
    }))
  );
  const filtered = allPrograms.filter(
    programme =>
      programme.name.toLowerCase().includes(search.toLowerCase()) ||
      programme.id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppShell
      navigation={navigation}
      activeTab="home"
      title="Programmes"
      subtitle="Programme-level academic structure"
      headerBadge={`${filtered.length} programmes`}
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
        <Text style={{ color: theme.textMuted, fontWeight: '800', fontSize: 12 }}>Programme control</Text>
        <Text style={{ color: theme.text, fontSize: 28, fontWeight: '900', marginTop: 6 }}>Academic programmes</Text>
        <Text style={{ color: theme.textMuted, marginTop: 6 }}>
          Browse programmes and open their classes, courses, and reports.
        </Text>
      </View>

      <View style={{ flexDirection: 'row', marginHorizontal: -5, marginBottom: 12 }}>
        <View style={{ flex: 1, paddingHorizontal: 5 }}>
          <Tile theme={theme} tone={tones[0]} label="Faculties" value={FACULTIES.length} helper="school units" />
        </View>
        <View style={{ flex: 1, paddingHorizontal: 5 }}>
          <Tile theme={theme} tone={tones[1]} label="Programmes" value={filtered.length} helper="search results" />
        </View>
        <View style={{ flex: 1, paddingHorizontal: 5 }}>
          <Tile
            theme={theme}
            tone={tones[2]}
            label="Classes"
            value={CLASSES.filter(cls => filtered.some(programme => programme.id === cls.programme)).length}
            helper="linked cohorts"
          />
        </View>
      </View>

      <SearchBar value={search} onChangeText={setSearch} placeholder="Search programmes by name or code..." />

      {filtered.length === 0 ? (
        <EmptyState icon="CLS" message="No programmes found" />
      ) : (
        filtered.map(programme => (
          <Card key={`${programme.id}_${programme.facultyId}`} style={{ borderRadius: 26 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
              <View
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 18,
                  backgroundColor: tones[0].bg,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 12,
                }}
              >
                <MaterialCommunityIcons name="layers-triple-outline" size={24} color={tones[0].ink} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: theme.text, fontWeight: '900', fontSize: 16 }}>{programme.name}</Text>
                <Text style={{ color: theme.textMuted, marginTop: 4, fontSize: 12 }}>
                  {programme.id} • {programme.facultyName} • {programme.years} years
                </Text>
              </View>
              <Badge label={programme.facultyName} color="reviewed" />
            </View>

            <TouchableOpacity
              onPress={() => navigation.navigate('ProgrammeDetail', { programme, faculty: programme.faculty })}
              style={{
                backgroundColor: roleTone.bg,
                borderRadius: 18,
                paddingVertical: 14,
                alignItems: 'center',
              }}
            >
              <Text style={{ color: roleTone.text, fontWeight: '900' }}>Open Programme</Text>
            </TouchableOpacity>
          </Card>
        ))
      )}
    </AppShell>
  );
}

export function ProgrammeDetailScreen({ navigation, route }) {
  const { theme } = useTheme();
  const { programme, faculty } = route.params;
  const { reports, courses } = useData();
  const [activeTab, setActiveTab] = useState('Classes');
  const tabs = ['Classes', 'Courses', 'Reports'];
  const programmeClasses = CLASSES.filter(cls => cls.programme === programme.id);
  const programmeCourses = courses.filter(course => programmeClasses.some(cls => cls.code === course.class));
  const programmeReports = reports.filter(report =>
    programmeClasses.some(cls => cls.name === report.className || cls.code === report.classCode)
  );
  const roleTone = getRoleTone('PL');

  return (
    <AppShell
      navigation={navigation}
      activeTab="home"
      title={programme.name}
      subtitle={`${programme.id} • ${faculty?.shortName}`}
      headerBadge={`${programme.years} yrs`}
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
        <Text style={{ color: theme.textMuted, fontWeight: '800', fontSize: 12 }}>Programme detail</Text>
        <Text style={{ color: theme.text, fontSize: 28, fontWeight: '900', marginTop: 6 }}>{programme.name}</Text>
        <Text style={{ color: theme.textMuted, marginTop: 6 }}>
          {faculty?.name} • {programme.id} • {programme.years} academic years
        </Text>
      </View>

      <View style={{ flexDirection: 'row', marginHorizontal: -5, marginBottom: 12 }}>
        <View style={{ flex: 1, paddingHorizontal: 5 }}>
          <Tile theme={theme} tone={tones[0]} label="Classes" value={programmeClasses.length} helper="inside programme" />
        </View>
        <View style={{ flex: 1, paddingHorizontal: 5 }}>
          <Tile theme={theme} tone={tones[1]} label="Courses" value={programmeCourses.length} helper="teaching load" />
        </View>
        <View style={{ flex: 1, paddingHorizontal: 5 }}>
          <Tile theme={theme} tone={tones[2]} label="Reports" value={programmeReports.length} helper="submitted stream" />
        </View>
      </View>

      <View style={{ flexDirection: 'row', backgroundColor: theme.bgCard, borderRadius: 22, padding: 6, borderWidth: 1, borderColor: theme.border, marginBottom: 16 }}>
        {tabs.map(tab => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={{
              flex: 1,
              paddingVertical: 12,
              borderRadius: 16,
              alignItems: 'center',
              backgroundColor: activeTab === tab ? roleTone.bg : 'transparent',
            }}
          >
            <Text style={{ color: activeTab === tab ? roleTone.text : theme.textMuted, fontWeight: '900' }}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {activeTab === 'Classes' &&
        (programmeClasses.length === 0 ? (
          <EmptyState icon="CLS" message="No classes found" />
        ) : (
          programmeClasses.map(cls => (
            <Card key={cls.id} style={{ borderRadius: 26 }}>
              <Text style={{ color: theme.text, fontWeight: '900', fontSize: 16 }}>{cls.name}</Text>
              <Text style={{ color: theme.textMuted, marginTop: 4, fontSize: 12 }}>
                {cls.code} • Year {cls.year} • {cls.totalStudents} students
              </Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('Classes', { filterClass: cls })}
                style={{
                  backgroundColor: theme.bgSecondary,
                  borderRadius: 18,
                  paddingVertical: 14,
                  alignItems: 'center',
                  marginTop: 14,
                }}
              >
                <Text style={{ color: theme.text, fontWeight: '900' }}>Open Class</Text>
              </TouchableOpacity>
            </Card>
          ))
        ))}

      {activeTab === 'Courses' &&
        (programmeCourses.length === 0 ? (
          <EmptyState icon="CRS" message="No courses found" />
        ) : (
          programmeCourses.map(course => (
            <Card key={course.id} style={{ borderRadius: 26 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: theme.text, fontWeight: '900', fontSize: 15 }}>{course.name}</Text>
                  <Text style={{ color: theme.textMuted, marginTop: 4, fontSize: 12 }}>
                    {course.code} • {course.lecturer}
                  </Text>
                </View>
                <Badge label={course.class} color="submitted" />
              </View>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                {[`Day ${course.day}`, `Time ${course.time}`, `Venue ${course.venue}`].map(item => (
                  <View key={`${course.id}_${item}`} style={{ marginRight: 8, marginBottom: 8 }}>
                    <View style={{ backgroundColor: theme.bgSecondary, borderRadius: 14, paddingHorizontal: 10, paddingVertical: 8 }}>
                      <Text style={{ color: theme.text, fontWeight: '700', fontSize: 12 }}>{item}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </Card>
          ))
        ))}

      {activeTab === 'Reports' &&
        (programmeReports.length === 0 ? (
          <EmptyState icon="REP" message="No reports yet" />
        ) : (
          programmeReports.map(report => (
            <Card key={report.id} style={{ borderRadius: 26 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: theme.text, fontWeight: '900', fontSize: 15 }}>{report.courseName}</Text>
                  <Text style={{ color: theme.textMuted, marginTop: 4, fontSize: 12 }}>
                    {report.lecturerName} • {report.week}
                  </Text>
                </View>
                <Badge label={report.status} color={report.status} />
              </View>
            </Card>
          ))
        ))}
    </AppShell>
  );
}

export function StaffListScreen({ navigation }) {
  const { theme } = useTheme();
  const [search, setSearch] = useState('');
  const roleTone = getRoleTone('FMG');
  const allStaff = FACULTIES.flatMap(faculty => [
    { ...faculty.fmg, id: `fmg_${faculty.id}`, faculty: faculty.shortName, facultyObj: faculty },
    ...faculty.pls.map(staff => ({ ...staff, faculty: faculty.shortName, facultyObj: faculty })),
    ...faculty.prls.map(staff => ({ ...staff, faculty: faculty.shortName, facultyObj: faculty })),
    ...faculty.yls.map(staff => ({ ...staff, faculty: faculty.shortName, facultyObj: faculty })),
  ]);
  const filtered = allStaff.filter(
    staff =>
      staff.name.toLowerCase().includes(search.toLowerCase()) ||
      staff.faculty.toLowerCase().includes(search.toLowerCase()) ||
      (staff.role || '').toLowerCase().includes(search.toLowerCase())
  );
  const roleOrder = { FMG: 0, PL: 1, PRL: 2, YL: 3 };

  return (
    <AppShell
      navigation={navigation}
      activeTab="home"
      title="Staff"
      subtitle="Faculty and academic leadership"
      headerBadge={`${filtered.length} staff`}
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
        <Text style={{ color: theme.textMuted, fontWeight: '800', fontSize: 12 }}>People overview</Text>
        <Text style={{ color: theme.text, fontSize: 28, fontWeight: '900', marginTop: 6 }}>Academic staff</Text>
        <Text style={{ color: theme.textMuted, marginTop: 6 }}>
          Browse staff by faculty and role.
        </Text>
      </View>

      <View style={{ flexDirection: 'row', marginHorizontal: -5, marginBottom: 12 }}>
        <View style={{ flex: 1, paddingHorizontal: 5 }}>
          <Tile theme={theme} tone={tones[0]} label="Faculties" value={FACULTIES.length} helper="leadership areas" />
        </View>
        <View style={{ flex: 1, paddingHorizontal: 5 }}>
          <Tile theme={theme} tone={tones[1]} label="Staff" value={filtered.length} helper="search results" />
        </View>
        <View style={{ flex: 1, paddingHorizontal: 5 }}>
          <Tile
            theme={theme}
            tone={tones[2]}
            label="Managers"
            value={filtered.filter(member => member.role === 'FMG' || member.role === 'PL' || member.role === 'PRL').length}
            helper="oversight roles"
          />
        </View>
      </View>

      <SearchBar value={search} onChangeText={setSearch} placeholder="Search staff by name, faculty, or role..." />

      {filtered.length === 0 ? (
        <EmptyState icon="CLS" message="No staff found" />
      ) : (
        filtered
          .sort((a, b) => (roleOrder[a.role] || 9) - (roleOrder[b.role] || 9))
          .map(staff => (
            <TouchableOpacity
              key={staff.id}
              onPress={() => navigation.navigate('StaffDetail', { staff, faculty: staff.facultyObj })}
            >
              <Card style={{ borderRadius: 26 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: 20,
                      backgroundColor: roleTone.bg,
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: 12,
                    }}
                  >
                    <Text style={{ color: roleTone.text, fontWeight: '900', fontSize: 20 }}>{staff.name[0]}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: theme.text, fontWeight: '900', fontSize: 15 }}>{staff.name}</Text>
                    <Text style={{ color: theme.textMuted, marginTop: 4, fontSize: 12 }}>{staff.faculty}</Text>
                  </View>
                  <Badge label={staff.role} color={(staff.role || '').toLowerCase()} />
                </View>
              </Card>
            </TouchableOpacity>
          ))
      )}
    </AppShell>
  );
}

export function StaffDetailScreen({ navigation, route }) {
  const { theme } = useTheme();
  const { staff, faculty } = route.params;
  const { reports } = useData();
  const roleTone = getRoleTone(staff.role);
  const staffReports = reports.filter(report => report.lecturerName === staff.name);

  return (
    <AppShell
      navigation={navigation}
      activeTab="profile"
      title="Staff Profile"
      subtitle={staff.role}
      headerBadge={faculty?.shortName || 'LUCT'}
      accent={roleTone.bg}
    >
      <Card style={{ borderRadius: 30, marginTop: 18 }}>
        <View style={{ alignItems: 'center', paddingVertical: 10 }}>
          <View
            style={{
              width: 88,
              height: 88,
              borderRadius: 28,
              backgroundColor: roleTone.bg,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 14,
            }}
          >
            <Text style={{ color: roleTone.text, fontSize: 34, fontWeight: '900' }}>{staff.name[0]}</Text>
          </View>
          <Text style={{ color: theme.text, fontSize: 22, fontWeight: '900', textAlign: 'center' }}>{staff.name}</Text>
          <Text style={{ color: theme.textMuted, fontSize: 13, marginTop: 6 }}>
            {staff.email || `${staff.name.toLowerCase().replace(/\s/g, '.')}@limkokwing.ac.ls`}
          </Text>
          <View style={{ marginTop: 12 }}>
            <Badge label={staff.role} color={(staff.role || '').toLowerCase()} />
          </View>
        </View>
      </Card>

      <View style={{ flexDirection: 'row', marginHorizontal: -5, marginBottom: 12 }}>
        <View style={{ flex: 1, paddingHorizontal: 5 }}>
          <Tile theme={theme} tone={tones[0]} label="Faculty" value={faculty?.shortName || 'LUCT'} helper="current unit" />
        </View>
        <View style={{ flex: 1, paddingHorizontal: 5 }}>
          <Tile theme={theme} tone={tones[1]} label="Reports" value={staffReports.length} helper="submitted count" />
        </View>
        <View style={{ flex: 1, paddingHorizontal: 5 }}>
          <Tile theme={theme} tone={tones[2]} label="Role" value={staff.role} helper="position type" />
        </View>
      </View>

      <Card style={{ borderRadius: 26 }}>
        <Text style={{ color: theme.text, fontWeight: '900', fontSize: 18, marginBottom: 10 }}>Faculty detail</Text>
        <Text style={{ color: theme.text, fontSize: 15, fontWeight: '800' }}>{faculty?.name || 'N/A'}</Text>
        <Text style={{ color: theme.textMuted, marginTop: 6 }}>{faculty?.shortName}</Text>
      </Card>

      {staffReports.length > 0 ? (
        <Card style={{ borderRadius: 26 }}>
          <Text style={{ color: theme.text, fontWeight: '900', fontSize: 18, marginBottom: 12 }}>
            Reports submitted
          </Text>
          {staffReports.map(report => (
            <View
              key={report.id}
              style={{
                backgroundColor: theme.bgSecondary,
                borderRadius: 18,
                padding: 14,
                marginBottom: 10,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: theme.text, fontWeight: '800' }}>{report.courseName}</Text>
                  <Text style={{ color: theme.textMuted, marginTop: 4, fontSize: 12 }}>
                    {report.week} • {report.className}
                  </Text>
                </View>
                <Badge label={report.status} color={report.status} />
              </View>
            </View>
          ))}
        </Card>
      ) : (
        <EmptyState icon="REP" message="No reports submitted yet" />
      )}
    </AppShell>
  );
}
