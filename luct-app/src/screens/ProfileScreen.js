import React, { useMemo, useState } from 'react';
import { Alert, Image, Switch, Text, TouchableOpacity, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { AppShell } from '../components/AppShell';
import { Card } from '../components/UI';
import { getRoleTone, useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

export default function ProfileScreen({ navigation }) {
  const { theme, isDark, toggleTheme } = useTheme();
  const { user, profilePhoto, updateProfilePhoto, logout } = useAuth();
  const [uploading, setUploading] = useState(false);
  const roleTone = getRoleTone(user?.role);

  const rows = useMemo(
    () => [
      { label: 'Role', value: user?.role || 'N/A' },
      { label: 'Name', value: user?.name || 'N/A' },
      { label: 'Email', value: user?.email || 'N/A' },
      { label: 'Faculty', value: user?.faculty || 'N/A' },
      ...(user?.role === 'Student' ? [{ label: 'Class', value: user?.class || 'N/A' }] : []),
    ],
    [user]
  );

  const shortcuts = [
    { title: 'Modules', note: 'Explore all features', screen: 'Modules', icon: 'grid-outline' },
    { title: 'Reports', note: 'Open reports', screen: 'Reports', icon: 'document-text-outline' },
    { title: 'Monitoring', note: 'Open analytics', screen: 'Monitoring', icon: 'stats-chart-outline' },
    { title: 'Attendance', note: 'View sessions', screen: 'Attendance', icon: 'calendar-outline' },
  ];

  const pickPhoto = async () => {
    setUploading(true);
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission needed', 'Allow gallery access to choose a profile photo.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets?.[0]?.uri) {
        await updateProfilePhoto(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Photo failed', error.message || 'Could not update your profile photo.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <AppShell
      navigation={navigation}
      activeTab="profile"
      title="Profile"
      subtitle="Identity, preferences, shortcuts"
      headerBadge={user?.role || 'User'}
      accent={roleTone.bg}
    >
      <Card
        style={{
          borderRadius: 30,
          padding: 18,
          backgroundColor: theme.bgCard,
        }}
      >
        <View
          style={{
            borderRadius: 28,
            backgroundColor: roleTone.bg,
            padding: 20,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity onPress={pickPhoto} disabled={uploading} style={{ marginRight: 16 }}>
              {profilePhoto ? (
                <Image source={{ uri: profilePhoto }} style={{ width: 92, height: 92, borderRadius: 28, borderWidth: 3, borderColor: 'rgba(255,255,255,0.24)' }} />
              ) : (
                <View
                  style={{
                    width: 92,
                    height: 92,
                    borderRadius: 28,
                    backgroundColor: 'rgba(255,255,255,0.16)',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ color: roleTone.text, fontSize: 34, fontWeight: '900' }}>{(user?.name || 'U').charAt(0)}</Text>
                </View>
              )}
              <View
                style={{
                  position: 'absolute',
                  right: -2,
                  bottom: -2,
                  width: 34,
                  height: 34,
                  borderRadius: 17,
                  backgroundColor: theme.bgCard,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name="camera-outline" size={18} color={theme.text} />
              </View>
            </TouchableOpacity>

            <View style={{ flex: 1 }}>
              <Text style={{ color: roleTone.text, fontSize: 24, fontWeight: '900' }}>{user?.name || 'User'}</Text>
              <Text style={{ color: roleTone.text, opacity: 0.84, marginTop: 4 }}>{user?.email}</Text>
              <Text style={{ color: roleTone.text, opacity: 0.74, marginTop: 10 }}>
                {uploading ? 'Updating photo...' : 'Tap your photo to personalize your workspace.'}
              </Text>
            </View>
          </View>

          <View style={{ flexDirection: 'row', marginTop: 18 }}>
            {[
              { label: 'Role', value: user?.role || 'N/A' },
              { label: 'Faculty', value: user?.faculty || 'N/A' },
            ].map((item, index) => (
              <View
                key={item.label}
                style={{
                  flex: 1,
                  backgroundColor: 'rgba(255,255,255,0.14)',
                  borderRadius: 18,
                  padding: 12,
                  marginRight: index === 0 ? 10 : 0,
                }}
              >
                <Text style={{ color: roleTone.text, opacity: 0.7, fontSize: 11, fontWeight: '800' }}>{item.label}</Text>
                <Text style={{ color: roleTone.text, marginTop: 5, fontWeight: '900', fontSize: 16 }}>{item.value}</Text>
              </View>
            ))}
          </View>
        </View>
      </Card>

      <Card style={{ borderRadius: 28 }}>
        <Text style={{ color: theme.text, fontSize: 18, fontWeight: '900', marginBottom: 12 }}>Profile details</Text>
        {rows.map((row, index) => (
          <View
            key={row.label}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingVertical: 14,
              borderBottomWidth: index === rows.length - 1 ? 0 : 1,
              borderBottomColor: theme.border,
            }}
          >
            <Text style={{ color: theme.textMuted, flex: 1, fontWeight: '700' }}>{row.label}</Text>
            <Text style={{ color: theme.text, flex: 1.3, textAlign: 'right', fontWeight: '900' }}>{row.value}</Text>
          </View>
        ))}
      </Card>

      <Card style={{ borderRadius: 28 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flex: 1, paddingRight: 10 }}>
            <Text style={{ color: theme.text, fontSize: 18, fontWeight: '900' }}>Appearance</Text>
            <Text style={{ color: theme.textMuted, marginTop: 4 }}>
            
            </Text>
          </View>
          <Switch value={isDark} onValueChange={toggleTheme} trackColor={{ false: theme.ashCloud, true: theme.textSecondary }} thumbColor={theme.accent} />
        </View>
      </Card>

      <Text style={{ color: theme.text, fontSize: 19, fontWeight: '900', marginBottom: 12 }}>Fast shortcuts</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -5 }}>
        {shortcuts.map(item => (
          <TouchableOpacity key={item.title} onPress={() => navigation.navigate(item.screen)} style={{ width: '50%', paddingHorizontal: 5, marginBottom: 10 }}>
            <View
              style={{
                backgroundColor: theme.bgCard,
                borderRadius: 24,
                padding: 16,
                minHeight: 122,
                borderWidth: 1,
                borderColor: theme.border,
              }}
            >
              <View
                style={{
                  width: 46,
                  height: 46,
                  borderRadius: 16,
                  backgroundColor: theme.accentLighter,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 12,
                }}
              >
                <Ionicons name={item.icon} size={21} color={theme.accentDark} />
              </View>
              <Text style={{ color: theme.text, fontWeight: '900', fontSize: 15 }}>{item.title}</Text>
              <Text style={{ color: theme.textMuted, fontSize: 12, marginTop: 6 }}>{item.note}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        onPress={logout}
        style={{
          marginTop: 8,
          backgroundColor: theme.bgCard,
          borderRadius: 24,
          paddingVertical: 16,
          alignItems: 'center',
          borderWidth: 1,
          borderColor: theme.border,
        }}
      >
        <Text style={{ color: theme.text, fontWeight: '900', fontSize: 15 }}>Logout</Text>
      </TouchableOpacity>
    </AppShell>
  );
}
