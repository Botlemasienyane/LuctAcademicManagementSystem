import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, createUserWithEmailAndPassword, updateProfile } from '../services/firebaseAuth';
import { doc, getDoc, serverTimestamp, setDoc } from '../services/firebaseFirestore';
import { getFirebaseAuth, getFirebaseDb } from '../services/firebaseClient';
import { DEMO_USERS } from '../data/seedData';

const AuthContext = createContext();

const PROFILE_CACHE_KEY = '@luct-ams/profile-cache';
const PROFILE_PHOTO_KEY = '@luct-ams/profile-photo';

const normalizeEmail = (email = '') => email.trim().toLowerCase();

export const AuthProvider = ({ children }) => {
  const auth = useMemo(() => getFirebaseAuth(), []);
  const db = useMemo(() => getFirebaseDb(), []);
  const [ready, setReady] = useState(false);
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [profilePhoto, setProfilePhoto] = useState(null);
  const tokenCacheRef = useRef(null);

  // Demo accounts are shown on the login screen for testing.
  const users = DEMO_USERS;

  const loadProfile = async (uid) => {
    const ref = doc(db, 'users', uid);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    return { id: uid, ...snap.data() };
  };

  const waitForFirebaseUser = () =>
    new Promise(resolve => {
      const current = auth.currentUser || firebaseUser;
      if (current) {
        resolve(current);
        return;
      }

      let settled = false;
      const timer = setTimeout(() => {
        if (settled) return;
        settled = true;
        resolve(auth.currentUser || firebaseUser || null);
      }, 5000);

      const unsubscribe = onAuthStateChanged(auth, user => {
        if (settled || !user) return;
        settled = true;
        clearTimeout(timer);
        unsubscribe();
        resolve(user);
      });
    });

  useEffect(() => {
    let mounted = true;

    const bootstrap = async () => {
      try {
        const [cached, cachedPhoto] = await Promise.all([
          AsyncStorage.getItem(PROFILE_CACHE_KEY),
          AsyncStorage.getItem(PROFILE_PHOTO_KEY),
        ]);
        if (cached && mounted) {
          setProfile(JSON.parse(cached));
        }
        if (cachedPhoto && mounted) {
          setProfilePhoto(cachedPhoto);
        }
      } catch (e) {
        // Skip cache errors and continue loading.
      }
    };

    bootstrap();

    const unsub = onAuthStateChanged(auth, async (user) => {
      try {
        if (!mounted) return;
        setFirebaseUser(user || null);
        if (!user) {
          setProfile(null);
          setProfilePhoto(null);
          tokenCacheRef.current = null;
          await AsyncStorage.removeItem(PROFILE_CACHE_KEY).catch(() => {});
          await AsyncStorage.removeItem(PROFILE_PHOTO_KEY).catch(() => {});
          setReady(true);
          return;
        }

        try {
          tokenCacheRef.current = await user.getIdToken();
        } catch (e) {
          // If this fails now, the token can still be requested later.
        }

        const p = await loadProfile(user.uid);
        const merged = p
          ? { ...p, email: user.email || p.email || '', name: user.displayName || p.name || '' }
          : { id: user.uid, email: user.email || '', name: user.displayName || '', role: 'Student' };
        setProfile(merged);
        await AsyncStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(merged)).catch(() => {});
        setReady(true);
      } catch (error) {
        console.warn('Failed to load profile', error);
        setReady(true);
      }
    });

    return () => {
      mounted = false;
      unsub();
    };
  }, [auth, db]);

  const authenticate = async (email, password) => {
    const normalized = normalizeEmail(email);
    const cred = await signInWithEmailAndPassword(auth, normalized, password);
    setFirebaseUser(cred.user);
    tokenCacheRef.current = await cred.user.getIdToken();
    const p = await loadProfile(cred.user.uid);
    const merged = p
      ? { id: cred.user.uid, ...p, email: cred.user.email || p.email || '', name: cred.user.displayName || p.name || '' }
      : { id: cred.user.uid, email: cred.user.email || '', name: cred.user.displayName || '', role: 'Student' };
    setProfile(merged);
    await AsyncStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(merged)).catch(() => {});
    return merged;
  };

  const registerStudent = async ({ name, email, password, classCode, faculty }) => {
    const normalized = normalizeEmail(email);
    const cred = await createUserWithEmailAndPassword(auth, normalized, password);
    setFirebaseUser(cred.user);
    tokenCacheRef.current = await cred.user.getIdToken();
    if (name) {
      await updateProfile(cred.user, { displayName: name.trim() });
    }

    const userProfile = {
      role: 'Student',
      name: name.trim(),
      email: normalized,
      faculty,
      class: classCode,
      createdAt: serverTimestamp(),
    };

    await setDoc(doc(db, 'users', cred.user.uid), userProfile, { merge: true });
    const merged = { id: cred.user.uid, ...userProfile };
    setProfile(merged);
    await AsyncStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(merged)).catch(() => {});
    return merged;
  };

  const updateProfilePhoto = async (uri) => {
    setProfilePhoto(uri || null);
    if (uri) {
      await AsyncStorage.setItem(PROFILE_PHOTO_KEY, uri).catch(() => {});
    } else {
      await AsyncStorage.removeItem(PROFILE_PHOTO_KEY).catch(() => {});
    }
  };

  const getIdToken = async () => {
    const user = auth.currentUser || firebaseUser || (await waitForFirebaseUser());
    if (user) {
      try {
        tokenCacheRef.current = await user.getIdToken(true);
        return tokenCacheRef.current;
      } catch (error) {
        try {
          tokenCacheRef.current = await user.getIdToken();
          return tokenCacheRef.current;
        } catch (innerError) {
          // If refresh fails, use the saved token below.
        }
      }
    }

    return tokenCacheRef.current;
  };

  const logout = async () => {
    await signOut(auth);
    setProfile(null);
    tokenCacheRef.current = null;
    await AsyncStorage.removeItem(PROFILE_CACHE_KEY).catch(() => {});
  };

  // Other screens use this user object to decide what each role can see.
  const user = profile;

  return (
    <AuthContext.Provider
      value={{
        ready,
        user,
        profilePhoto,
        users,
        authenticate,
        registerStudent,
        updateProfilePhoto,
        logout,
        getIdToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
