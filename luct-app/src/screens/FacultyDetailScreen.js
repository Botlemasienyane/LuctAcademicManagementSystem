import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StatusBar } from 'react-native';
import { getRoleTone, useTheme } from '../context/ThemeContext';
import { CLASSES } from '../data/seedData';
import { Card, Badge } from '../components/UI';

export default function FacultyDetailScreen({ navigation, route }) {
  const { theme, isDark } = useTheme();
  const { faculty } = route.params;
  const [activeTab, setActiveTab] = useState('Structure');
  const tabs = ['Structure', 'Programmes', 'Staff'];
  const fmgTone = getRoleTone('FMG');
  const plTone = getRoleTone('PL');
  const prlTone = getRoleTone('PRL');

  const facultyClasses = CLASSES.filter(c => c.faculty === faculty.id);

  const renderStructure = () => (
    <>
      <Card style={{ borderLeftWidth: 4, borderLeftColor: fmgTone.bg }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: fmgTone.bg, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
            <Text style={{ color: fmgTone.text, fontWeight: '900' }}>{faculty.fmg.name[0]}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: theme.text, fontWeight: '700', fontSize: 14 }}>{faculty.fmg.name}</Text>
            <Text style={{ color: theme.textMuted, fontSize: 11 }}>FMG - {faculty.shortName}</Text>
          </View>
          <Badge label="FMG" color="fmg" />
        </View>
      </Card>

      {faculty.pls.map(pl => (
        <View key={pl.id}>
          <Card style={{ borderLeftWidth: 4, borderLeftColor: plTone.bg, marginLeft: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: plTone.bg, alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
                <Text style={{ color: plTone.text, fontWeight: '700' }}>{pl.name[0]}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: theme.text, fontWeight: '600', fontSize: 13 }}>{pl.name}</Text>
                <Text style={{ color: theme.textMuted, fontSize: 11 }}>Programme Leader</Text>
              </View>
              <Badge label="PL" color="pl" />
            </View>
          </Card>

          {faculty.prls.filter(prl => prl.pl === pl.id).map(prl => (
            <View key={prl.id}>
              <Card style={{ borderLeftWidth: 4, borderLeftColor: prlTone.bg, marginLeft: 32 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: prlTone.bg, alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
                    <Text style={{ color: prlTone.text, fontWeight: '700' }}>{prl.name[0]}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: theme.text, fontWeight: '600', fontSize: 13 }}>{prl.name}</Text>
                    <Text style={{ color: theme.textMuted, fontSize: 11 }}>Principal Lecturer</Text>
                  </View>
                  <Badge label="PRL" color="prl" />
                </View>
              </Card>

              {faculty.yls.filter(yl => yl.prl === prl.id).map(yl => (
                <Card key={yl.id} style={{ borderLeftWidth: 4, borderLeftColor: theme.border, marginLeft: 48 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: theme.border, alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
                      <Text style={{ color: theme.text, fontWeight: '700', fontSize: 12 }}>{yl.name[0]}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: theme.text, fontWeight: '600', fontSize: 12 }}>{yl.name}</Text>
                      <Text style={{ color: theme.textMuted, fontSize: 11 }}>Young Lecturer</Text>
                    </View>
                    <Badge label="YL" color="default" />
                  </View>
                </Card>
              ))}
            </View>
          ))}
        </View>
      ))}
    </>
  );

  const renderProgrammes = () => (
    <>
      {faculty.programmes.length === 0 ? (
        <View style={{ alignItems: 'center', paddingVertical: 30 }}>
          <Text style={{ fontSize: 14, fontWeight: '700', color: theme.textMuted, marginBottom: 10 }}>Programmes</Text>
          <Text style={{ color: theme.textMuted }}>No programmes listed</Text>
        </View>
      ) : faculty.programmes.map(prog => {
        const progClasses = facultyClasses.filter(c => c.programme === prog.id);
        return (
          <Card key={prog.id}>
            <Text style={{ color: theme.text, fontWeight: '700', fontSize: 14, marginBottom: 4 }}>{prog.name}</Text>
            <Text style={{ color: theme.textMuted, fontSize: 11, marginBottom: 10 }}>{prog.id} - {prog.years} Year{prog.years !== 1 ? 's' : ''} - {progClasses.length} Active Class{progClasses.length !== 1 ? 'es' : ''}</Text>
            <TouchableOpacity onPress={() => navigation.navigate('ProgrammeDetail', { programme: prog, faculty })} style={{ backgroundColor: theme.accent, borderRadius: 8, paddingVertical: 8, alignItems: 'center' }}>
              <Text style={{ color: theme.accentText, fontWeight: '600', fontSize: 13 }}>Open Programme</Text>
            </TouchableOpacity>
          </Card>
        );
      })}
    </>
  );

  const renderStaff = () => (
    <>
      {[...faculty.pls, ...faculty.prls, ...faculty.yls].map(s => (
        <TouchableOpacity key={s.id} onPress={() => navigation.navigate('StaffDetail', { staff: s, faculty })}>
          <Card>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: theme.bgSecondary, borderWidth: 2, borderColor: theme.border, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                <Text style={{ color: theme.text, fontWeight: '700', fontSize: 16 }}>{s.name[0]}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: theme.text, fontWeight: '600', fontSize: 13 }}>{s.name}</Text>
                <Text style={{ color: theme.textMuted, fontSize: 11 }}>{s.email}</Text>
              </View>
              <Badge label={s.role} color={s.role.toLowerCase()} />
            </View>
          </Card>
        </TouchableOpacity>
      ))}
    </>
  );

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={theme.bg} />
      <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 60 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginRight: 12 }}>
            <Text style={{ color: theme.accent, fontSize: 14, fontWeight: '700' }}>Back</Text>
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={{ color: theme.bgText || theme.text, fontSize: 20, fontWeight: '800' }}>{faculty.shortName}</Text>
            <Text style={{ color: theme.bgTextMuted || theme.textMuted, fontSize: 11 }}>{faculty.name}</Text>
          </View>
        </View>

        <View style={{ flexDirection: 'row', backgroundColor: theme.bgSecondary, borderRadius: 12, padding: 4, marginBottom: 20 }}>
          {tabs.map(tab => (
            <TouchableOpacity key={tab} onPress={() => setActiveTab(tab)} style={{ flex: 1, paddingVertical: 9, borderRadius: 9, alignItems: 'center', backgroundColor: activeTab === tab ? theme.bgCard : 'transparent' }}>
              <Text style={{ color: activeTab === tab ? theme.text : (theme.bgTextMuted || theme.textMuted), fontWeight: activeTab === tab ? '700' : '400', fontSize: 13 }}>{tab}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {activeTab === 'Structure' && renderStructure()}
        {activeTab === 'Programmes' && renderProgrammes()}
        {activeTab === 'Staff' && renderStaff()}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}
