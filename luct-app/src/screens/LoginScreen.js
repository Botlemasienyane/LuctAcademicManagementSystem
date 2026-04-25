import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Image,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getRoleTone, useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { CLASSES, DEMO_USERS, FACULTIES } from '../data/seedData';
import { Btn, Input } from '../components/UI';

export default function LoginScreen() {
  const { theme, isDark } = useTheme();
  const { authenticate, registerStudent } = useAuth();
  const insets = useSafeAreaInsets();
  const formFade = useRef(new Animated.Value(0)).current;
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [studentName, setStudentName] = useState('');
  const [studentFaculty, setStudentFaculty] = useState(FACULTIES[0]?.id || '');
  const [studentClass, setStudentClass] = useState(CLASSES[0]?.code || '');
  const [loading, setLoading] = useState(false);
  const [showDemo, setShowDemo] = useState(true);

  useEffect(() => {
    Animated.timing(formFade, {
      toValue: 1,
      duration: 480,
      useNativeDriver: true,
    }).start();
  }, [formFade]);

  const groupedUsers = DEMO_USERS.reduce((accumulator, user) => {
    (accumulator[user.role] = accumulator[user.role] || []).push(user);
    return accumulator;
  }, {});

  const availableClasses = CLASSES.filter(cls => cls.faculty === studentFaculty);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Missing details', 'Enter your email and password to continue.');
      return;
    }

    setLoading(true);
    try {
      await authenticate(email, password);
    } catch (error) {
      Alert.alert('Login failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!studentName || !email || !password || !studentFaculty || !studentClass) {
      Alert.alert('Missing details', 'Fill in your name, email, password, faculty, and class.');
      return;
    }

    setLoading(true);
    try {
      await registerStudent({
        name: studentName,
        email,
        password,
        faculty: studentFaculty,
        classCode: studentClass,
      });
    } catch (error) {
      Alert.alert('Registration failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={theme.bg} />
      <View
        style={{
          position: 'absolute',
          top: -110,
          left: -90,
          width: 240,
          height: 240,
          borderRadius: 120,
          backgroundColor: theme.accentLighter,
        }}
      />
      <View
        style={{
          position: 'absolute',
          top: 90,
          right: -80,
          width: 210,
          height: 210,
          borderRadius: 105,
          backgroundColor: theme.infoSoft,
        }}
      />

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: insets.top + 10, paddingBottom: 30 }} keyboardShouldPersistTaps="handled">
        <View
          style={{
            backgroundColor: theme.bgCard,
            borderRadius: 34,
            padding: 14,
            borderWidth: 1,
            borderColor: theme.border,
            shadowColor: theme.cardShadow,
            shadowOpacity: 1,
            shadowRadius: 20,
            shadowOffset: { width: 0, height: 12 },
            elevation: 8,
          }}
        >
          <Image
            source={require('../../assets/luct-logo.png')}
            style={{ width: '100%', height: 250, borderRadius: 24 }}
            resizeMode="cover"
            accessibilityLabel="Limkokwing logo hero"
          />
          <View style={{ marginTop: 18, alignItems: 'center' }}>
            <Text style={{ color: theme.text, fontWeight: '900', fontSize: 28, textAlign: 'center' }}>
              LUCT Academic Monitoring System
            </Text>
            <Text style={{ color: theme.textMuted, marginTop: 6, textAlign: 'center' }}>
              Sign in to continue.
            </Text>
          </View>
        </View>

        <Animated.View style={{ opacity: formFade }}>
          <View
            style={{
              marginTop: 20,
              backgroundColor: theme.bgCard,
              borderRadius: 30,
              padding: 20,
              borderWidth: 1,
              borderColor: theme.border,
            }}
          >
            <View style={{ flexDirection: 'row', backgroundColor: theme.bgSecondary, borderRadius: 14, padding: 4, marginBottom: 16 }}>
              {[
                { key: 'login', label: 'Sign in' },
                { key: 'register', label: 'Register' },
              ].map(item => (
                <TouchableOpacity
                  key={item.key}
                  onPress={() => setMode(item.key)}
                  style={{
                    flex: 1,
                    backgroundColor: mode === item.key ? theme.bgCard : 'transparent',
                    borderRadius: 10,
                    paddingVertical: 10,
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ color: mode === item.key ? theme.text : theme.textMuted, fontWeight: '800' }}>{item.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={{ color: theme.text, fontSize: 22, fontWeight: '900' }}>{mode === 'login' ? 'Sign in' : 'Student registration'}</Text>
            <Text style={{ color: theme.textMuted, marginTop: 6, marginBottom: 16 }}>
              {mode === 'login' ? 'Use your LUCT credentials.' : 'Create a student account for monitoring, rating, and attendance.'}
            </Text>

            {mode === 'register' ? (
              <>
                <Input label="Full Name" value={studentName} onChangeText={setStudentName} placeholder="Enter your name" />
                <Input label="Email" value={email} onChangeText={setEmail} placeholder="student@limkokwing.ac.ls" keyboardType="email-address" autoCapitalize="none" />
                <Input label="Password" value={password} onChangeText={setPassword} placeholder="Create password" secureTextEntry autoCapitalize="none" />

                <Text style={{ color: theme.textSecondary, fontSize: 12, fontWeight: '600', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Faculty
                </Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -4, marginBottom: 14 }}>
                  {FACULTIES.map(faculty => (
                    <TouchableOpacity
                      key={faculty.id}
                      onPress={() => {
                        setStudentFaculty(faculty.id);
                        const nextClass = CLASSES.find(cls => cls.faculty === faculty.id);
                        setStudentClass(nextClass?.code || '');
                      }}
                      style={{
                        backgroundColor: studentFaculty === faculty.id ? theme.accent : theme.bgSecondary,
                        borderRadius: 14,
                        paddingHorizontal: 12,
                        paddingVertical: 10,
                        marginHorizontal: 4,
                        marginBottom: 8,
                      }}
                    >
                      <Text style={{ color: studentFaculty === faculty.id ? theme.accentText : theme.text, fontSize: 12, fontWeight: '800' }}>
                        {faculty.shortName}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={{ color: theme.textSecondary, fontSize: 12, fontWeight: '600', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Class
                </Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -4, marginBottom: 16 }}>
                  {availableClasses.map(cls => (
                    <TouchableOpacity
                      key={cls.id}
                      onPress={() => setStudentClass(cls.code)}
                      style={{
                        backgroundColor: studentClass === cls.code ? theme.accentDark : theme.bgSecondary,
                        borderRadius: 14,
                        paddingHorizontal: 12,
                        paddingVertical: 10,
                        marginHorizontal: 4,
                        marginBottom: 8,
                      }}
                    >
                      <Text style={{ color: studentClass === cls.code ? theme.secondary : theme.text, fontSize: 12, fontWeight: '800' }}>
                        {cls.code}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Btn title={loading ? 'Creating account...' : 'Register'} onPress={handleRegister} size="lg" disabled={loading} />
              </>
            ) : (
              <>
                <Input label="Email" value={email} onChangeText={setEmail} placeholder="your@limkokwing.ac.ls" keyboardType="email-address" autoCapitalize="none" />
                <Input label="Password" value={password} onChangeText={setPassword} placeholder="Enter password" secureTextEntry autoCapitalize="none" />
                <Btn title={loading ? 'Signing in...' : 'Sign in'} onPress={handleLogin} size="lg" disabled={loading} />
              </>
            )}
          </View>
        </Animated.View>

        <TouchableOpacity onPress={() => setShowDemo(value => !value)} style={{ marginTop: 18, marginBottom: 10, flexDirection: 'row', alignItems: 'center' }}>
          <Text style={{ color: theme.text, fontWeight: '900', flex: 1 }}>Demo accounts</Text>
          <Ionicons name={showDemo ? 'chevron-up' : 'chevron-down'} size={18} color={theme.textMuted} />
        </TouchableOpacity>

        {showDemo
          ? Object.entries(groupedUsers).map(([role, users]) => {
              const tone = getRoleTone(role);
              return (
                <View key={role} style={{ marginBottom: 14 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                    <View style={{ backgroundColor: tone.bg, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 }}>
                      <Text style={{ color: tone.text, fontSize: 11, fontWeight: '900' }}>{role}</Text>
                    </View>
                  </View>
                  {users.slice(0, 3).map(userItem => (
                    <TouchableOpacity
                      key={userItem.id}
                      onPress={() => {
                        setEmail(userItem.email);
                        setPassword(userItem.password);
                        setShowDemo(false);
                      }}
                      style={{
                        backgroundColor: theme.bgCard,
                        borderRadius: 20,
                        padding: 14,
                        borderWidth: 1,
                        borderColor: theme.border,
                        flexDirection: 'row',
                        alignItems: 'center',
                        marginBottom: 8,
                      }}
                    >
                      <View style={{ width: 44, height: 44, borderRadius: 16, backgroundColor: tone.bg, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                        <Text style={{ color: tone.text, fontWeight: '900', fontSize: 18 }}>{userItem.name.charAt(0)}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: theme.text, fontWeight: '800' }}>{userItem.name}</Text>
                        <Text style={{ color: theme.textMuted, fontSize: 12, marginTop: 4 }}>{userItem.email}</Text>
                      </View>
                      <Ionicons name="arrow-forward" size={18} color={theme.textMuted} />
                    </TouchableOpacity>
                  ))}
                </View>
              );
            })
          : null}

        <Text style={{ color: theme.textMuted, textAlign: 'center', marginTop: 18 }}>
          Limkokwing University of Creative Technology, Lesotho
        </Text>
      </ScrollView>
    </View>
  );
}
