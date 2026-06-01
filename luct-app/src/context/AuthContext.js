import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, createUserWithEmailAndPassword, updateProfile } from '../services/firebaseAuth';
import { doc, getDoc, serverTimestamp, setDoc } from '../services/firebaseFirestore';
import { getFirebaseAuth, getFirebaseDb } from '../services/firebaseClient';
import { deleteUserProfilePhoto, uploadUserProfilePhoto } from '../services/firebaseStorage';
import { CLASSES, DEMO_USERS, FACULTIES } from '../data/seedData';

const AuthContext = createContext();

const PROFILE_CACHE_KEY = '@luct-ams/profile-cache';
const PROFILE_PHOTO_KEY = '@luct-ams/profile-photo';
const DEMO_SESSION_KEY = '@luct-ams/demo-session';

const normalizeEmail = (email = '') => email.trim().toLowerCase();
const normalizeName = (name = '') => name.trim().replace(/\s+/g, ' ');

const getStudentClass = (classCode) => CLASSES.find(entry => entry.code === classCode);
const getFaculty = (facultyId) => FACULTIES.find(entry => entry.id === facultyId);

const buildStoredDemoProfile = (demoUser) => ({
  ...demoUser,
  email: normalizeEmail(demoUser.email),
  isDemoUser: true,
});

export const AuthProvider = ({ children }) => {
  const auth = useMemo(() => getFirebaseAuth(), []);
  const db = useMemo(() => getFirebaseDb(), []);
  const [ready, setReady] = useState(false);
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [profilePhoto, setProfilePhoto] = useState(null);
  const tokenCacheRef = useRef(null);
  const pendingProfileRef = useRef(null);
  const profileWriteInProgressRef = useRef(false);

  // Demo accounts are shown on the login screen for testing.
  const users = DEMO_USERS;

  const loadProfile = async (uid) => {
    const ref = doc(db, 'users', uid);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    return { id: uid, ...snap.data() };
  };

  const storeAuthenticatedProfile = async (merged) => {
    setProfile(merged);
    setProfilePhoto(merged.profilePhotoUrl || null);
    await AsyncStorage.removeItem(DEMO_SESSION_KEY).catch(() => {});
    await AsyncStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(merged)).catch(() => {});
    if (merged.profilePhotoUrl) {
      await AsyncStorage.setItem(PROFILE_PHOTO_KEY, merged.profilePhotoUrl).catch(() => {});
    } else {
      await AsyncStorage.removeItem(PROFILE_PHOTO_KEY).catch(() => {});
    }
  };

  const signInDemoUserLocally = async (demoUser) => {
    const merged = buildStoredDemoProfile(demoUser);
    setFirebaseUser(null);
    tokenCacheRef.current = null;
    setProfile(merged);
    setProfilePhoto(null);
    await AsyncStorage.setItem(DEMO_SESSION_KEY, JSON.stringify(merged)).catch(() => {});
    await AsyncStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(merged)).catch(() => {});
    await AsyncStorage.removeItem(PROFILE_PHOTO_KEY).catch(() => {});
    return merged;
  };

  const createDemoUserInFirebase = async (demoUser) => {
    const normalized = normalizeEmail(demoUser.email);
    const cred = await createUserWithEmailAndPassword(auth, normalized, demoUser.password);
    setFirebaseUser(cred.user);
    tokenCacheRef.current = await cred.user.getIdToken();
    await updateProfile(cred.user, { displayName: demoUser.name });

    const { password: omittedPassword, id: localId, isDemoUser: omittedDemoFlag, ...profileFields } = demoUser;
    const userProfile = {
      ...profileFields,
      name: demoUser.name,
      email: normalized,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await setDoc(doc(db, 'users', cred.user.uid), userProfile, { merge: true });

    const merged = { id: cred.user.uid, ...userProfile };
    await storeAuthenticatedProfile(merged);
    return merged;
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
        const [cached, cachedPhoto, demoSession] = await Promise.all([
          AsyncStorage.getItem(PROFILE_CACHE_KEY),
          AsyncStorage.getItem(PROFILE_PHOTO_KEY),
          AsyncStorage.getItem(DEMO_SESSION_KEY),
        ]);
        if (cached && mounted) {
          setProfile(JSON.parse(cached));
        }
        if (cachedPhoto && mounted) {
          setProfilePhoto(cachedPhoto);
        }
        if (demoSession && mounted) {
          setProfile(JSON.parse(demoSession));
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
          tokenCacheRef.current = null;
          const demoSession = await AsyncStorage.getItem(DEMO_SESSION_KEY).catch(() => null);
          if (demoSession) {
            const parsedDemo = JSON.parse(demoSession);
            setProfile(parsedDemo);
            setProfilePhoto(parsedDemo.profilePhotoUrl || null);
            await AsyncStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(parsedDemo)).catch(() => {});
            setReady(true);
            return;
          }

          setProfile(null);
          setProfilePhoto(null);
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
        if (!p && profileWriteInProgressRef.current) {
          if (pendingProfileRef.current?.id === user.uid) {
            await storeAuthenticatedProfile(pendingProfileRef.current);
          }
          setReady(true);
          return;
        }

        if (!p && pendingProfileRef.current?.id === user.uid) {
          await storeAuthenticatedProfile(pendingProfileRef.current);
          setReady(true);
          return;
        }

        const merged = p
          ? { ...p, email: user.email || p.email || '', name: user.displayName || p.name || '' }
          : { id: user.uid, email: user.email || '', name: user.displayName || '', role: 'Student' };
        await storeAuthenticatedProfile(merged);
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
    try {
      const cred = await signInWithEmailAndPassword(auth, normalized, password);
      setFirebaseUser(cred.user);
      tokenCacheRef.current = await cred.user.getIdToken();
      const p = await loadProfile(cred.user.uid);
      const merged = p
        ? { id: cred.user.uid, ...p, email: cred.user.email || p.email || '', name: cred.user.displayName || p.name || '' }
        : { id: cred.user.uid, email: cred.user.email || '', name: cred.user.displayName || '', role: 'Student' };
      await storeAuthenticatedProfile(merged);
      return merged;
    } catch (error) {
      const demoUser = users.find(
        candidate =>
          normalizeEmail(candidate.email) === normalized &&
          candidate.password === password
      );

      if (!demoUser) {
        throw error;
      }

      try {
        return await createDemoUserInFirebase(demoUser);
      } catch (createError) {
        console.warn('Firebase demo account bootstrap failed, using local demo session', createError);
        return signInDemoUserLocally(demoUser);
      }
    }
  };

  const registerStudent = async ({ name, email, password, classCode, faculty }) => {
    const normalized = normalizeEmail(email);
    const cleanedName = normalizeName(name);
    const selectedClass = getStudentClass(classCode);
    const selectedFaculty = getFaculty(faculty);

    if (!cleanedName) {
      throw new Error('Full name is required.');
    }

    if (!normalized) {
      throw new Error('Email is required.');
    }

    if (!password || password.length < 6) {
      throw new Error('Password must be at least 6 characters.');
    }

    if (!selectedFaculty) {
      throw new Error('Choose a valid faculty.');
    }

    if (!selectedClass || selectedClass.faculty !== selectedFaculty.id) {
      throw new Error('Choose a valid class for the selected faculty.');
    }

    profileWriteInProgressRef.current = true;

    try {
      const cred = await createUserWithEmailAndPassword(auth, normalized, password);
      tokenCacheRef.current = await cred.user.getIdToken();
      await updateProfile(cred.user, { displayName: cleanedName });

      const now = new Date().toISOString();
      const localProfile = {
        id: cred.user.uid,
        role: 'Student',
        name: cleanedName,
        email: normalized,
        faculty: selectedFaculty.id,
        facultyName: selectedFaculty.name,
        class: selectedClass.code,
        className: selectedClass.name,
        programme: selectedClass.programme,
        year: selectedClass.year,
        authProvider: 'firebase',
        status: 'active',
        createdAt: now,
        updatedAt: now,
      };

      const userProfile = {
        ...localProfile,
        id: undefined,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      delete userProfile.id;

      pendingProfileRef.current = localProfile;
      setFirebaseUser(cred.user);

      await setDoc(doc(db, 'users', cred.user.uid), userProfile, { merge: true });
      await setDoc(doc(db, 'students', cred.user.uid), {
        ...userProfile,
        userId: cred.user.uid,
        role: 'Student',
      }, { merge: true });

      pendingProfileRef.current = null;
      profileWriteInProgressRef.current = false;
      await storeAuthenticatedProfile(localProfile);
      return localProfile;
    } catch (error) {
      pendingProfileRef.current = null;
      profileWriteInProgressRef.current = false;
      throw error;
    }
  };

  const updateProfilePhoto = async (file) => {
    const user = auth.currentUser || firebaseUser;
    if (!user) {
      throw new Error('You need to be signed in to update your profile photo.');
    }

    if (!file?.uri) {
      setProfilePhoto(null);
      await AsyncStorage.removeItem(PROFILE_PHOTO_KEY).catch(() => {});
      return;
    }

    const currentProfile = profile || {};
    const uploaded = await uploadUserProfilePhoto({ file, uid: user.uid });
    const nextProfile = {
      ...currentProfile,
      id: currentProfile.id || user.uid,
      profilePhotoUrl: uploaded.downloadUrl,
      profilePhotoStoragePath: uploaded.storagePath,
    };

    await setDoc(
      doc(db, 'users', user.uid),
      {
        profilePhotoUrl: uploaded.downloadUrl,
        profilePhotoStoragePath: uploaded.storagePath,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    if (currentProfile.profilePhotoStoragePath && currentProfile.profilePhotoStoragePath !== uploaded.storagePath) {
      await deleteUserProfilePhoto(currentProfile.profilePhotoStoragePath).catch(() => {});
    }

    setProfile(nextProfile);
    setProfilePhoto(uploaded.downloadUrl);
    await AsyncStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(nextProfile)).catch(() => {});
    await AsyncStorage.setItem(PROFILE_PHOTO_KEY, uploaded.downloadUrl).catch(() => {});
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
    if (auth.currentUser) {
      await signOut(auth);
    }
    setFirebaseUser(null);
    setProfile(null);
    setProfilePhoto(null);
    tokenCacheRef.current = null;
    await AsyncStorage.removeItem(DEMO_SESSION_KEY).catch(() => {});
    await AsyncStorage.removeItem(PROFILE_CACHE_KEY).catch(() => {});
    await AsyncStorage.removeItem(PROFILE_PHOTO_KEY).catch(() => {});
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
