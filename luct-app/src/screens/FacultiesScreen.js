import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StatusBar } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { FACULTIES } from '../data/seedData';
import { Card, SearchBar, SectionHeader } from '../components/UI';

export default function FacultiesScreen({ navigation }) {
  const { theme, isDark } = useTheme();
  const [search, setSearch] = useState('');

  const filtered = FACULTIES.filter(f =>
    f.name.toLowerCase().includes(search.toLowerCase()) ||
    f.shortName.toLowerCase().includes(search.toLowerCase())
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
            <Text style={{ color: theme.bgText || theme.text, fontSize: 22, fontWeight: '800' }}>Faculties</Text>
            <Text style={{ color: theme.bgTextMuted || theme.textMuted, fontSize: 12 }}>LUCT Academic Structure</Text>
          </View>
        </View>

        <SearchBar value={search} onChangeText={setSearch} placeholder="Search faculties..." />
        <SectionHeader title="All Faculties" count={filtered.length} />

        {filtered.map(faculty => (
          <Card key={faculty.id}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 }}>
              <View style={{ width: 46, height: 46, borderRadius: 14, backgroundColor: theme.accent, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                <Text style={{ color: theme.accentText, fontWeight: '900', fontSize: 16 }}>{faculty.shortName[0]}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: theme.text, fontWeight: '800', fontSize: 15 }}>{faculty.shortName}</Text>
                <Text style={{ color: theme.textMuted, fontSize: 12, marginTop: 2 }}>{faculty.name}</Text>
              </View>
            </View>

            <View style={{ backgroundColor: theme.bgSecondary, borderRadius: 10, padding: 10, marginBottom: 12 }}>
              <Text style={{ color: theme.textMuted, fontSize: 11, fontWeight: '700', marginBottom: 4 }}>FMG</Text>
              <Text style={{ color: theme.text, fontSize: 13, fontWeight: '600' }}>{faculty.fmg.name}</Text>
            </View>

            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
              <View style={{ backgroundColor: theme.bgSecondary, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 }}>
                <Text style={{ color: theme.textMuted, fontSize: 11 }}>PL {faculty.pls.length}</Text>
              </View>
              <View style={{ backgroundColor: theme.bgSecondary, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 }}>
                <Text style={{ color: theme.textMuted, fontSize: 11 }}>PRL {faculty.prls.length}</Text>
              </View>
              <View style={{ backgroundColor: theme.bgSecondary, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 }}>
                <Text style={{ color: theme.textMuted, fontSize: 11 }}>Programmes {faculty.programmes.length}</Text>
              </View>
            </View>

            <TouchableOpacity onPress={() => navigation.navigate('FacultyDetail', { faculty })} style={{ backgroundColor: theme.accent, borderRadius: 10, paddingVertical: 10, alignItems: 'center' }}>
              <Text style={{ color: theme.accentText, fontWeight: '700', fontSize: 14 }}>Open Faculty</Text>
            </TouchableOpacity>
          </Card>
        ))}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}
