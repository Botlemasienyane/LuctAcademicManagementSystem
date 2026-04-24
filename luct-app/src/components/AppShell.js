import React, { useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Image,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getRoleLabel, getRoleTone, useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

// Drawer items are grouped by role to match the assignment access levels.
const ALL_MENU_ITEMS = {
  Student: [
    { label: 'Home', icon: 'home-outline', screen: 'Home' },
    { label: 'Reports', icon: 'document-text-outline', screen: 'Reports' },
    { label: 'Monitoring', icon: 'stats-chart-outline', screen: 'Monitoring' },
    { label: 'Attendance', icon: 'calendar-outline', screen: 'Attendance' },
    { label: 'Rating', icon: 'star-outline', screen: 'Rating' },
    { label: 'Modules', icon: 'grid-outline', screen: 'Modules' },
    { label: 'Profile', icon: 'person-outline', screen: 'Profile' },
  ],
  Lecturer: [
    { label: 'Home', icon: 'home-outline', screen: 'Home' },
    { label: 'Reports', icon: 'document-text-outline', screen: 'Reports' },
    { label: 'Submit Report', icon: 'add-circle-outline', screen: 'ReportForm' },
    { label: 'Monitoring', icon: 'stats-chart-outline', screen: 'Monitoring' },
    { label: 'Rating', icon: 'star-outline', screen: 'Rating' },
    { label: 'Classes', icon: 'people-outline', screen: 'Classes' },
    { label: 'Attendance', icon: 'calendar-outline', screen: 'Attendance' },
    { label: 'Modules', icon: 'grid-outline', screen: 'Modules' },
    { label: 'Profile', icon: 'person-outline', screen: 'Profile' },
  ],
  PRL: [
    { label: 'Home', icon: 'home-outline', screen: 'Home' },
    { label: 'Reports', icon: 'document-text-outline', screen: 'Reports' },
    { label: 'Monitoring', icon: 'stats-chart-outline', screen: 'Monitoring' },
    { label: 'Rating', icon: 'star-outline', screen: 'Rating' },
    { label: 'Classes', icon: 'people-outline', screen: 'Classes' },
    { label: 'Courses', icon: 'book-outline', screen: 'Courses' },
    { label: 'Modules', icon: 'grid-outline', screen: 'Modules' },
    { label: 'Profile', icon: 'person-outline', screen: 'Profile' },
  ],
  PL: [
    { label: 'Home', icon: 'home-outline', screen: 'Home' },
    { label: 'Reports', icon: 'document-text-outline', screen: 'Reports' },
    { label: 'Monitoring', icon: 'stats-chart-outline', screen: 'Monitoring' },
    { label: 'Rating', icon: 'star-outline', screen: 'Rating' },
    { label: 'Programmes', icon: 'layers-outline', screen: 'ProgrammeList' },
    { label: 'Courses', icon: 'book-outline', screen: 'Courses' },
    { label: 'Modules', icon: 'grid-outline', screen: 'Modules' },
    { label: 'Profile', icon: 'person-outline', screen: 'Profile' },
  ],
  FMG: [
    { label: 'Home', icon: 'home-outline', screen: 'Home' },
    { label: 'Faculties', icon: 'business-outline', screen: 'Faculties' },
    { label: 'Reports', icon: 'document-text-outline', screen: 'Reports' },
    { label: 'Monitoring', icon: 'stats-chart-outline', screen: 'Monitoring' },
    { label: 'Rating', icon: 'star-outline', screen: 'Rating' },
    { label: 'Staff', icon: 'people-outline', screen: 'StaffList' },
    { label: 'Modules', icon: 'grid-outline', screen: 'Modules' },
    { label: 'Profile', icon: 'person-outline', screen: 'Profile' },
  ],
};

// Bottom navigation keeps the main pages easy to reach.
const bottomTabs = [
  { key: 'home', label: 'Home', screen: 'Home', icon: 'home-outline', activeIcon: 'home' },
  { key: 'reports', label: 'Reports', screen: 'Reports', icon: 'document-text-outline', activeIcon: 'document-text' },
  { key: 'analytics', label: 'Insights', screen: 'Monitoring', icon: 'stats-chart-outline', activeIcon: 'stats-chart' },
  { key: 'profile', label: 'Profile', screen: 'Profile', icon: 'person-outline', activeIcon: 'person' },
];

export function AppShell({
  navigation,
  activeTab,
  title,
  subtitle,
  children,
  scroll = true,
  contentContainerStyle,
  accent,
  floatingAction,
  headerBadge,
  onHeaderLogoPress,
}) {
  const { theme } = useTheme();
  const { user, profilePhoto, logout } = useAuth();
  const insets = useSafeAreaInsets();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const drawerX = useRef(new Animated.Value(-320)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const roleTone = getRoleTone(user?.role);

  const menuItems = useMemo(() => ALL_MENU_ITEMS[user?.role] || ALL_MENU_ITEMS.Student, [user?.role]);
  const shellAccent = accent || theme.accent;

  const openDrawer = () => {
    setDrawerOpen(true);
    Animated.parallel([
      Animated.timing(drawerX, {
        toValue: 0,
        duration: 240,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(overlayOpacity, {
        toValue: 1,
        duration: 240,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const closeDrawer = (callback) => {
    Animated.parallel([
      Animated.timing(drawerX, {
        toValue: -320,
        duration: 200,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setDrawerOpen(false);
      if (callback) callback();
    });
  };

  const action =
    floatingAction ||
    (user?.role === 'Student'
      ? { label: 'Attend', screen: 'Attendance', icon: 'calendar-check-outline' }
      : { label: 'Create', screen: 'ReportForm', icon: 'plus' });

  const content = scroll ? (
    <ScrollView
      contentContainerStyle={[
        {
          paddingTop: insets.top + 18,
          paddingHorizontal: 18,
          paddingBottom: 132 + Math.max(insets.bottom, 12),
        },
        contentContainerStyle,
      ]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  ) : (
    <View
      style={[
        {
          flex: 1,
          paddingTop: insets.top + 18,
          paddingHorizontal: 18,
          paddingBottom: 132 + Math.max(insets.bottom, 12),
        },
        contentContainerStyle,
      ]}
    >
      {children}
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <View
        style={{
          position: 'absolute',
          top: -120,
          right: -110,
          width: 280,
          height: 280,
          borderRadius: 140,
          backgroundColor: theme.accentLighter,
          opacity: 0.9,
        }}
      />
      <View
        style={{
          position: 'absolute',
          top: 110,
          left: -90,
          width: 210,
          height: 210,
          borderRadius: 105,
          backgroundColor: roleTone.subtle,
          opacity: 0.35,
        }}
      />

      <View style={{ paddingTop: insets.top + 12, paddingHorizontal: 18, zIndex: 2 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity
            onPress={openDrawer}
            style={{
              width: 54,
              height: 54,
              borderRadius: 18,
              backgroundColor: theme.bgCard,
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 1,
              borderColor: theme.border,
              shadowColor: theme.cardShadow,
              shadowOpacity: 1,
              shadowRadius: 14,
              shadowOffset: { width: 0, height: 8 },
              elevation: 4,
            }}
          >
            <Ionicons name="menu-outline" size={24} color={theme.text} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onHeaderLogoPress}
            activeOpacity={onHeaderLogoPress ? 0.8 : 1}
            style={{
              flex: 1,
              marginHorizontal: 12,
              backgroundColor: theme.bgCard,
              borderRadius: 24,
              paddingVertical: 10,
              paddingHorizontal: 14,
              borderWidth: 1,
              borderColor: theme.border,
              alignItems: 'center',
              justifyContent: 'center',
              shadowColor: theme.cardShadow,
              shadowOpacity: 1,
              shadowRadius: 12,
              shadowOffset: { width: 0, height: 8 },
              elevation: 3,
            }}
          >
            <Text style={{ color: theme.textMuted, fontWeight: '800', fontSize: 10, letterSpacing: 1.4 }}>
              LUCT AMS
            </Text>
            <Text numberOfLines={1} style={{ color: theme.text, fontWeight: '900', fontSize: 18, textAlign: 'center', marginTop: 2 }}>
              {title}
            </Text>
            {subtitle ? (
              <Text numberOfLines={1} style={{ color: theme.textMuted, fontSize: 11, textAlign: 'center', marginTop: 2 }}>
                {subtitle}
              </Text>
            ) : null}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate('Profile')}
            style={{
              width: 54,
              height: 54,
              borderRadius: 18,
              backgroundColor: theme.bgCard,
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 1,
              borderColor: theme.border,
            }}
          >
            {profilePhoto ? (
              <Image source={{ uri: profilePhoto }} style={{ width: 46, height: 46, borderRadius: 15 }} />
            ) : (
              <Text style={{ color: theme.text, fontWeight: '900', fontSize: 18 }}>
                {(user?.name || 'U').charAt(0)}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {content}

      <View
        style={{
          position: 'absolute',
          left: 18,
          right: 18,
          bottom: Math.max(insets.bottom, 10),
          backgroundColor: theme.bgCard,
          borderRadius: 28,
          borderWidth: 1,
          borderColor: theme.border,
          paddingHorizontal: 16,
          paddingVertical: 10,
          flexDirection: 'row',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          shadowColor: theme.cardShadow,
          shadowOpacity: 1,
          shadowRadius: 20,
          shadowOffset: { width: 0, height: 12 },
          elevation: 10,
        }}
      >
        {bottomTabs.slice(0, 2).map(tab => {
          const focused = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              onPress={() => navigation.navigate(tab.screen)}
              style={{ alignItems: 'center', width: 58 }}
            >
              <Ionicons name={focused ? tab.activeIcon : tab.icon} size={22} color={focused ? shellAccent : theme.textMuted} />
              <Text style={{ fontSize: 11, fontWeight: focused ? '800' : '600', color: focused ? theme.text : theme.textMuted, marginTop: 5 }}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}

        <TouchableOpacity
          onPress={() => navigation.navigate(action.screen)}
          style={{
            marginTop: -34,
            width: 72,
            height: 72,
            borderRadius: 36,
            backgroundColor: shellAccent,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 6,
            borderColor: theme.bg,
            shadowColor: shellAccent,
            shadowOpacity: 0.45,
            shadowRadius: 18,
            shadowOffset: { width: 0, height: 10 },
            elevation: 12,
          }}
        >
          <MaterialCommunityIcons name={action.icon} size={30} color={theme.accentText} />
        </TouchableOpacity>

        {bottomTabs.slice(2).map(tab => {
          const focused = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              onPress={() => navigation.navigate(tab.screen)}
              style={{ alignItems: 'center', width: 58 }}
            >
              <Ionicons name={focused ? tab.activeIcon : tab.icon} size={22} color={focused ? shellAccent : theme.textMuted} />
              <Text style={{ fontSize: 11, fontWeight: focused ? '800' : '600', color: focused ? theme.text : theme.textMuted, marginTop: 5 }}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Modal visible={drawerOpen} transparent animationType="none" onRequestClose={() => closeDrawer()}>
        <View style={{ flex: 1 }}>
          <Animated.View style={{ flex: 1, backgroundColor: theme.overlay, opacity: overlayOpacity }}>
            <Pressable style={{ flex: 1 }} onPress={() => closeDrawer()} />
          </Animated.View>
          <Animated.View
            style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              left: 0,
              width: 316,
              transform: [{ translateX: drawerX }],
              backgroundColor: theme.bgCard,
              borderTopRightRadius: 28,
              borderBottomRightRadius: 28,
              paddingTop: insets.top + 18,
              paddingHorizontal: 18,
              paddingBottom: 24,
            }}
          >
            <View
              style={{
                backgroundColor: shellAccent,
                borderRadius: 28,
                padding: 18,
                marginBottom: 20,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                {profilePhoto ? (
                  <Image source={{ uri: profilePhoto }} style={{ width: 58, height: 58, borderRadius: 20, marginRight: 12 }} />
                ) : (
                  <View style={{ width: 58, height: 58, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                    <Text style={{ color: theme.accentText, fontSize: 24, fontWeight: '900' }}>{(user?.name || 'U').charAt(0)}</Text>
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <Text style={{ color: theme.accentText, fontWeight: '900', fontSize: 20 }} numberOfLines={1}>
                    {user?.name}
                  </Text>
                  <Text style={{ color: theme.accentText, opacity: 0.8, marginTop: 4 }}>
                    {getRoleLabel(user?.role)}
                  </Text>
                  <Text style={{ color: theme.accentText, opacity: 0.74, marginTop: 2 }} numberOfLines={1}>
                    {user?.email}
                  </Text>
                </View>
              </View>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {menuItems.map(item => (
                <TouchableOpacity
                  key={item.label}
                  onPress={() => closeDrawer(() => navigation.navigate(item.screen))}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingVertical: 14,
                    paddingHorizontal: 12,
                    borderRadius: 16,
                    marginBottom: 6,
                    backgroundColor: item.screen === title ? theme.bgSecondary : 'transparent',
                  }}
                >
                  <Ionicons name={item.icon} size={22} color={theme.text} />
                  <Text style={{ color: theme.text, fontSize: 15, fontWeight: '700', marginLeft: 12 }}>{item.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity
              onPress={() => closeDrawer(logout)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                marginTop: 12,
                backgroundColor: theme.bgSecondary,
                borderRadius: 18,
                paddingVertical: 14,
              }}
            >
              <Ionicons name="log-out-outline" size={20} color={theme.text} />
              <Text style={{ color: theme.text, fontWeight: '800', marginLeft: 8 }}>Logout</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}
