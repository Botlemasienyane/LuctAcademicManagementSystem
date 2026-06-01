import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CLASSES, COURSES, SEEDED_ATTENDANCE, SEEDED_COURSE_OUTLINES, SEEDED_RATINGS, SEEDED_REPORTS } from '../data/seedData';
import { apiFetch } from '../services/apiClient';
import {
  addDocToCollection,
  deleteDocFromCollection,
  subscribeToCollection,
  updateDocFields,
} from '../services/firebaseFirestore';
import { getFirebaseDb } from '../services/firebaseClient';
import { deleteOutlineDocument, uploadOutlineDocument } from '../services/firebaseStorage';
import { useAuth } from './AuthContext';

const DataContext = createContext();
const DEMO_DATA_KEY = '@luct-ams/demo-data';

const INITIAL_STATE = {
  courses: COURSES,
  reports: SEEDED_REPORTS,
  attendance: SEEDED_ATTENDANCE,
  ratings: SEEDED_RATINGS,
  courseOutlines: SEEDED_COURSE_OUTLINES,
};

const buildDefaultDemoState = () => ({
  courses: COURSES,
  reports: SEEDED_REPORTS,
  attendance: SEEDED_ATTENDANCE,
  ratings: SEEDED_RATINGS,
  courseOutlines: SEEDED_COURSE_OUTLINES,
});

const mergeCourseData = (seedCourses, remoteCourses) => {
  const merged = new Map();

  seedCourses.forEach(course => {
    merged.set(course.id || `${course.code}_${course.class}`, course);
  });

  remoteCourses.forEach(course => {
    const key = course.id || `${course.code}_${course.class}`;
    if (course.deletedAt) {
      merged.delete(key);
      return;
    }
    merged.set(key, { ...merged.get(key), ...course });
  });

  return Array.from(merged.values());
};

const mergeCollectionData = (seedItems, remoteItems, keyBuilder) => {
  const merged = new Map();

  seedItems.forEach(item => {
    merged.set(keyBuilder(item), item);
  });

  remoteItems.forEach(item => {
    const key = keyBuilder(item);
    if (item.deletedAt) {
      merged.delete(key);
      return;
    }
    merged.set(key, { ...merged.get(key), ...item });
  });

  return Array.from(merged.values());
};

const getClassFaculty = (classCode) => CLASSES.find(entry => entry.code === classCode)?.faculty || '';

const canManageFaculty = (currentUser, faculty) => {
  if (!currentUser || !faculty) return false;
  if (currentUser.role === 'FMG') return true;
  return currentUser.role === 'PL' && currentUser.faculty === faculty;
};

const assertFacultyManager = (currentUser, faculty, entityLabel) => {
  if (!currentUser) {
    throw new Error(`Sign in to manage ${entityLabel}.`);
  }

  if (!canManageFaculty(currentUser, faculty)) {
    throw new Error(`You are not allowed to manage this ${entityLabel}.`);
  }
};

export const DataProvider = ({ children }) => {
  const { ready: authReady, user, getIdToken } = useAuth();
  const [courses, setCourses] = useState(INITIAL_STATE.courses);
  const [reports, setReports] = useState(INITIAL_STATE.reports);
  const [attendance, setAttendance] = useState(INITIAL_STATE.attendance);
  const [ratings, setRatings] = useState(INITIAL_STATE.ratings);
  const [courseOutlines, setCourseOutlines] = useState(INITIAL_STATE.courseOutlines);
  const [ready, setReady] = useState(false);
  const db = useMemo(() => getFirebaseDb(), []);

  const loadDemoState = async () => {
    try {
      const cached = await AsyncStorage.getItem(DEMO_DATA_KEY);
      if (!cached) return buildDefaultDemoState();
      return { ...buildDefaultDemoState(), ...JSON.parse(cached) };
    } catch (error) {
      return buildDefaultDemoState();
    }
  };

  const persistDemoState = async (nextState) => {
    try {
      await AsyncStorage.setItem(DEMO_DATA_KEY, JSON.stringify(nextState));
    } catch (error) {
      // Ignore local cache persistence errors in demo mode.
    }
  };

  const saveDemoSnapshot = async (overrides = {}) => {
    await persistDemoState({
      courses,
      reports,
      attendance,
      ratings,
      courseOutlines,
      ...overrides,
    });
  };

  const resolveManagedCourse = (course) => {
    const existingMatch = courses.find(
      entry => entry.id === course.id || (entry.code === course.code && entry.class === course.class)
    );
    const classCode = course.class || existingMatch?.class || '';
    const faculty = course.faculty || existingMatch?.faculty || getClassFaculty(classCode);

    if (!classCode || !faculty) {
      throw new Error('This course is missing class or faculty information.');
    }

    assertFacultyManager(user, faculty, 'course');

    return { existingMatch, classCode, faculty };
  };

  const resolveManagedCourseOutline = (outline) => {
    const existingMatch = courseOutlines.find(entry => entry.id === outline.id) || null;
    const classCode = outline.classCode || existingMatch?.classCode || '';
    const faculty = outline.faculty || existingMatch?.faculty || getClassFaculty(classCode);

    if (!classCode || !faculty) {
      throw new Error('This outline is missing class or faculty information.');
    }

    assertFacultyManager(user, faculty, 'course outline');

    return { existingMatch, classCode, faculty };
  };

  useEffect(() => {
    if (!authReady) return undefined;

    if (!user) {
      setCourses(INITIAL_STATE.courses);
      setReports(INITIAL_STATE.reports);
      setAttendance(INITIAL_STATE.attendance);
      setRatings(INITIAL_STATE.ratings);
      setCourseOutlines(INITIAL_STATE.courseOutlines);
      setReady(true);
      return undefined;
    }

    if (user?.isDemoUser) {
      let active = true;

      loadDemoState().then(localState => {
        if (!active) return;
        setCourses(localState.courses || INITIAL_STATE.courses);
        setReports(localState.reports || INITIAL_STATE.reports);
        setAttendance(localState.attendance || INITIAL_STATE.attendance);
        setRatings(localState.ratings || INITIAL_STATE.ratings);
        setCourseOutlines(localState.courseOutlines || INITIAL_STATE.courseOutlines);
        setReady(true);
      });

      return () => {
        active = false;
      };
    }

    setReady(false);

    const pending = new Set(['reports', 'attendance', 'ratings', 'courses', 'courseOutlines']);
    const markReady = (key) => {
      pending.delete(key);
      if (pending.size === 0) {
        setReady(true);
      }
    };

    const subscriptions = [
      subscribeToCollection(
        db,
        'reports',
        { orderByField: 'submittedAt', orderDirection: 'desc', limitCount: 300 },
        items => {
          setReports(mergeCollectionData(SEEDED_REPORTS, items, item => item.id));
          markReady('reports');
        },
        error => {
          console.warn('Realtime reports sync failed', error);
          setReports(SEEDED_REPORTS);
          markReady('reports');
        }
      ),
      subscribeToCollection(
        db,
        'attendance',
        { orderByField: 'date', orderDirection: 'desc', limitCount: 500 },
        items => {
          setAttendance(mergeCollectionData(SEEDED_ATTENDANCE, items, item => item.id));
          markReady('attendance');
        },
        error => {
          console.warn('Realtime attendance sync failed', error);
          setAttendance(SEEDED_ATTENDANCE);
          markReady('attendance');
        }
      ),
      subscribeToCollection(
        db,
        'ratings',
        { orderByField: 'date', orderDirection: 'desc', limitCount: 500 },
        items => {
          setRatings(mergeCollectionData(SEEDED_RATINGS, items, item => item.id));
          markReady('ratings');
        },
        error => {
          console.warn('Realtime ratings sync failed', error);
          setRatings(SEEDED_RATINGS);
          markReady('ratings');
        }
      ),
      subscribeToCollection(
        db,
        'courses',
        {},
        items => {
          setCourses(mergeCourseData(COURSES, items));
          markReady('courses');
        },
        error => {
          console.warn('Realtime courses sync failed', error);
          setCourses(COURSES);
          markReady('courses');
        }
      ),
      subscribeToCollection(
        db,
        'courseOutlines',
        { orderByField: 'updatedAt', orderDirection: 'desc', limitCount: 300 },
        items => {
          setCourseOutlines(mergeCollectionData(SEEDED_COURSE_OUTLINES, items, item => item.id));
          markReady('courseOutlines');
        },
        error => {
          console.warn('Realtime course outline sync failed', error);
          setCourseOutlines(SEEDED_COURSE_OUTLINES);
          markReady('courseOutlines');
        }
      ),
    ];

    return () => {
      subscriptions.forEach(unsubscribe => {
        if (typeof unsubscribe === 'function') {
          unsubscribe();
        }
      });
    };
  }, [authReady, db, user]);

  const addReport = async (report) => {
    const payload = {
      ...report,
      status: report.status || 'submitted',
      feedback: report.feedback || '',
      submittedAt: report.submittedAt || new Date().toISOString(),
      createdByUid: user?.id || '',
    };

    try {
      const token = await getIdToken();
      if (token) {
        const res = await apiFetch('/api/reports', { token, method: 'POST', body: report });
        const savedReport = { ...payload, id: res.id };
        await updateDocFields(db, 'reports', savedReport.id, savedReport);
        return savedReport;
      }
    } catch (error) {
      console.warn('API report submit failed, falling back to direct Firestore write', error);
    }

    if (user?.isDemoUser) {
      const nextReport = { ...payload, id: `report_${Date.now()}` };
      const nextReports = [...reports, nextReport];
      setReports(nextReports);
      await saveDemoSnapshot({ reports: nextReports });
      return nextReport;
    }

    const res = await addDocToCollection(db, 'reports', payload);
    return { ...payload, id: res.id };
  };

  const updateReport = async (reportId, report) => {
    try {
      const token = await getIdToken();
      if (token) {
        await apiFetch(`/api/reports/${reportId}`, { token, method: 'PUT', body: report });
        await updateDocFields(db, 'reports', reportId, report);
        return;
      }
    } catch (error) {
      console.warn('API report update failed, falling back to direct Firestore write', error);
    }

    if (user?.isDemoUser) {
      const nextReports = reports.map(item => (item.id === reportId ? { ...item, ...report } : item));
      setReports(nextReports);
      await saveDemoSnapshot({ reports: nextReports });
      return;
    }

    await updateDocFields(db, 'reports', reportId, report);
  };

  const deleteReport = async (reportId) => {
    try {
      const token = await getIdToken();
      if (token) {
        await apiFetch(`/api/reports/${reportId}`, { token, method: 'DELETE' });
        await deleteDocFromCollection(db, 'reports', reportId);
        return;
      }
    } catch (error) {
      console.warn('API report delete failed, falling back to direct Firestore delete', error);
    }

    if (user?.isDemoUser) {
      const nextReports = reports.filter(item => item.id !== reportId);
      setReports(nextReports);
      await saveDemoSnapshot({ reports: nextReports });
      return;
    }

    await deleteDocFromCollection(db, 'reports', reportId);
  };

  const addFeedback = async (reportId, feedback) => {
    try {
      const token = await getIdToken();
      if (token) {
        await apiFetch(`/api/reports/${reportId}/feedback`, { token, method: 'PATCH', body: { feedback } });
        await updateDocFields(db, 'reports', reportId, {
          feedback,
          status: 'reviewed',
          feedbackByUid: user?.id || '',
          feedbackAt: new Date().toISOString(),
        });
        return;
      }
    } catch (error) {
      console.warn('API feedback update failed, falling back to direct Firestore write', error);
    }

    if (user?.isDemoUser) {
      const nextReports = reports.map(item =>
        item.id === reportId
          ? {
              ...item,
              feedback,
              status: 'reviewed',
              feedbackByUid: user?.id || '',
              feedbackAt: new Date().toISOString(),
            }
          : item
      );
      setReports(nextReports);
      await saveDemoSnapshot({ reports: nextReports });
      return;
    }

    await updateDocFields(db, 'reports', reportId, {
      feedback,
      status: 'reviewed',
      feedbackByUid: user?.id || '',
      feedbackAt: new Date().toISOString(),
    });
  };

  const addAttendance = async (record) => {
    const payload = {
      ...record,
      id: record.id || `attendance_${Date.now()}`,
      createdByUid: user?.id || '',
      createdAt: new Date().toISOString(),
    };

    const previousAttendance = attendance;
    const optimisticAttendance = mergeCollectionData(
      SEEDED_ATTENDANCE,
      [payload, ...attendance.filter(item => item.id !== payload.id)],
      item => item.id
    );

    setAttendance(optimisticAttendance);

    try {
      const token = await getIdToken();
      if (token) {
        const res = await apiFetch('/api/attendance', { token, method: 'POST', body: record });
        const savedAttendance = { ...payload, id: res.id };
        await updateDocFields(db, 'attendance', savedAttendance.id, savedAttendance);
        if (res.id && res.id !== payload.id) {
          setAttendance(current =>
            mergeCollectionData(
              SEEDED_ATTENDANCE,
              [savedAttendance, ...current.filter(item => item.id !== payload.id && item.id !== res.id)],
              item => item.id
            )
          );
        }
        return savedAttendance;
      }
    } catch (error) {
      console.warn('API attendance submit failed, falling back to direct Firestore write', error);
    }

    if (user?.isDemoUser) {
      await saveDemoSnapshot({ attendance: optimisticAttendance });
      return payload;
    }

    try {
      const res = await addDocToCollection(db, 'attendance', payload);
      if (res.id && res.id !== payload.id) {
        const savedAttendance = { ...payload, id: res.id };
        setAttendance(current =>
          mergeCollectionData(
            SEEDED_ATTENDANCE,
            [savedAttendance, ...current.filter(item => item.id !== payload.id && item.id !== res.id)],
            item => item.id
          )
        );
        return savedAttendance;
      }

      return payload;
    } catch (error) {
      setAttendance(previousAttendance);
      throw error;
    }
  };

  const updateAttendance = async (attendanceId, record) => {
    try {
      const token = await getIdToken();
      if (token) {
        await apiFetch(`/api/attendance/${attendanceId}`, { token, method: 'PUT', body: record });
        await updateDocFields(db, 'attendance', attendanceId, record);
        return;
      }
    } catch (error) {
      console.warn('API attendance update failed, falling back to direct Firestore write', error);
    }

    if (user?.isDemoUser) {
      const nextAttendance = attendance.map(item => (item.id === attendanceId ? { ...item, ...record } : item));
      setAttendance(nextAttendance);
      await saveDemoSnapshot({ attendance: nextAttendance });
      return;
    }

    await updateDocFields(db, 'attendance', attendanceId, record);
  };

  const deleteAttendance = async (attendanceId) => {
    const previousAttendance = attendance;
    const optimisticAttendance = attendance.filter(item => item.id !== attendanceId);

    setAttendance(optimisticAttendance);

    try {
      const token = await getIdToken();
      if (token) {
        await apiFetch(`/api/attendance/${attendanceId}`, { token, method: 'DELETE' });
        await deleteDocFromCollection(db, 'attendance', attendanceId);
        return;
      }
    } catch (error) {
      console.warn('API attendance delete failed, falling back to direct Firestore delete', error);
    }

    if (user?.isDemoUser) {
      await saveDemoSnapshot({ attendance: optimisticAttendance });
      return;
    }

    try {
      await deleteDocFromCollection(db, 'attendance', attendanceId);
    } catch (error) {
      setAttendance(previousAttendance);
      throw error;
    }
  };

  const addRating = async (rating) => {
    const payload = {
      ...rating,
      createdByUid: user?.id || '',
      createdAt: new Date().toISOString(),
    };

    try {
      const token = await getIdToken();
      if (token) {
        const res = await apiFetch('/api/ratings', { token, method: 'POST', body: rating });
        const savedRating = { ...payload, id: res.id };
        await updateDocFields(db, 'ratings', savedRating.id, savedRating);
        return savedRating;
      }
    } catch (error) {
      console.warn('API rating submit failed, falling back to direct Firestore write', error);
    }

    if (user?.isDemoUser) {
      const nextRating = { ...payload, id: `rating_${Date.now()}` };
      const nextRatings = [...ratings, nextRating];
      setRatings(nextRatings);
      await saveDemoSnapshot({ ratings: nextRatings });
      return nextRating;
    }

    const res = await addDocToCollection(db, 'ratings', payload);
    return { ...payload, id: res.id };
  };

  const updateRating = async (ratingId, rating) => {
    try {
      const token = await getIdToken();
      if (token) {
        await apiFetch(`/api/ratings/${ratingId}`, { token, method: 'PUT', body: rating });
        await updateDocFields(db, 'ratings', ratingId, rating);
        return;
      }
    } catch (error) {
      console.warn('API rating update failed, falling back to direct Firestore write', error);
    }

    if (user?.isDemoUser) {
      const nextRatings = ratings.map(item => (item.id === ratingId ? { ...item, ...rating } : item));
      setRatings(nextRatings);
      await saveDemoSnapshot({ ratings: nextRatings });
      return;
    }

    await updateDocFields(db, 'ratings', ratingId, rating);
  };

  const deleteRating = async (ratingId) => {
    try {
      const token = await getIdToken();
      if (token) {
        await apiFetch(`/api/ratings/${ratingId}`, { token, method: 'DELETE' });
        await deleteDocFromCollection(db, 'ratings', ratingId);
        return;
      }
    } catch (error) {
      console.warn('API rating delete failed, falling back to direct Firestore delete', error);
    }

    if (user?.isDemoUser) {
      const nextRatings = ratings.filter(rating => rating.id !== ratingId);
      setRatings(nextRatings);
      await saveDemoSnapshot({ ratings: nextRatings });
      return;
    }

    await deleteDocFromCollection(db, 'ratings', ratingId);
  };

  const saveCourse = async (course) => {
    const { existingMatch, classCode, faculty } = resolveManagedCourse(course);

    const normalizedCourse = {
      ...existingMatch,
      ...course,
      class: classCode,
      faculty,
      id: existingMatch?.id || course.id || `crs_${Date.now()}`,
      updatedByUid: user?.id || '',
      updatedAt: new Date().toISOString(),
      deletedAt: null,
    };

    const previousCourses = courses;
    const optimisticCourseId = existingMatch?.id || normalizedCourse.id;
    const optimisticCourses = mergeCourseData(COURSES, [
      ...courses.filter(item => item.id !== optimisticCourseId),
      normalizedCourse,
    ]);

    setCourses(optimisticCourses);

    try {
      const token = await getIdToken();
      if (token) {
        if (existingMatch?.id) {
          await apiFetch(`/api/courses/${existingMatch.id}`, { token, method: 'PUT', body: normalizedCourse });
          await updateDocFields(db, 'courses', normalizedCourse.id, normalizedCourse);
          return normalizedCourse;
        }

        const res = await apiFetch('/api/courses', { token, method: 'POST', body: normalizedCourse });
        const savedCourse = { ...normalizedCourse, id: res.id };
        await updateDocFields(db, 'courses', savedCourse.id, savedCourse);
        if (res.id && res.id !== normalizedCourse.id) {
          setCourses(current =>
            mergeCourseData(COURSES, [
              ...current.filter(item => item.id !== normalizedCourse.id && item.id !== res.id),
              savedCourse,
            ])
          );
        }
        return savedCourse;
      }
    } catch (error) {
      console.warn('API course save failed, falling back to direct Firestore write', error);
    }

    if (user?.isDemoUser) {
      await saveDemoSnapshot({ courses: optimisticCourses });
      return normalizedCourse;
    }

    try {
      await updateDocFields(db, 'courses', normalizedCourse.id, normalizedCourse);
      return normalizedCourse;
    } catch (error) {
      setCourses(previousCourses);
      throw error;
    }
  };

  const deleteCourse = async (courseId) => {
    const existingCourse = courses.find(course => course.id === courseId);

    if (!existingCourse) {
      throw new Error('Course not found.');
    }

    const { classCode, faculty } = resolveManagedCourse(existingCourse);
    const payload = {
      ...existingCourse,
      class: classCode,
      faculty,
      deletedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      updatedByUid: user?.id || '',
    };

    const previousCourses = courses;
    const optimisticCourses = mergeCourseData(COURSES, [
      ...courses.filter(course => course.id !== courseId),
      payload,
    ]);

    setCourses(optimisticCourses);

    try {
      const token = await getIdToken();
      if (token) {
        await apiFetch(`/api/courses/${courseId}`, { token, method: 'DELETE' });
        await updateDocFields(db, 'courses', courseId, payload);
        return;
      }
    } catch (error) {
      console.warn('API course delete failed, falling back to direct Firestore update', error);
    }

    if (user?.isDemoUser) {
      await saveDemoSnapshot({ courses: optimisticCourses });
      return;
    }

    try {
      await updateDocFields(db, 'courses', courseId, payload);
    } catch (error) {
      setCourses(previousCourses);
      throw error;
    }
  };

  const saveCourseOutline = async (outline) => {
    const { existingMatch, classCode, faculty } = resolveManagedCourseOutline(outline);
    const outlineId = outline.id || `outline_${Date.now()}`;
    const uploadedAttachment = outline.selectedFile
      ? await uploadOutlineDocument({ file: outline.selectedFile, outlineId })
      : {};
    const payload = {
      ...existingMatch,
      ...outline,
      ...uploadedAttachment,
      id: outlineId,
      classCode,
      faculty,
      status: outline.status || 'pending',
      updatedAt: new Date().toISOString(),
      updatedByUid: user?.id || '',
      createdByUid: outline.createdByUid || user?.id || '',
      deletedAt: null,
    };

    delete payload.selectedFile;

    const previousCourseOutlines = courseOutlines;
    const optimisticCourseOutlines = mergeCollectionData(
      SEEDED_COURSE_OUTLINES,
      [...courseOutlines.filter(item => item.id !== outlineId), payload],
      item => item.id
    );

    setCourseOutlines(optimisticCourseOutlines);

    try {
      await updateDocFields(db, 'courseOutlines', outlineId, payload);
      return payload;
    } catch (error) {
      if (!user?.isDemoUser) {
        setCourseOutlines(previousCourseOutlines);
        throw error;
      }
    }

    await saveDemoSnapshot({ courseOutlines: optimisticCourseOutlines });
    return payload;
  };

  const deleteCourseOutline = async (outline) => {
    const { existingMatch, classCode, faculty } = resolveManagedCourseOutline(outline);
    const targetOutline = existingMatch || outline;

    const deletedPayload = {
      ...targetOutline,
      classCode,
      faculty,
      deletedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      updatedByUid: user?.id || '',
    };

    const previousCourseOutlines = courseOutlines;
    const optimisticCourseOutlines = mergeCollectionData(
      SEEDED_COURSE_OUTLINES,
      [...courseOutlines.filter(item => item.id !== targetOutline.id), deletedPayload],
      item => item.id
    );

    setCourseOutlines(optimisticCourseOutlines);

    try {
      await updateDocFields(db, 'courseOutlines', targetOutline.id, deletedPayload);
    } catch (error) {
      if (!user?.isDemoUser) {
        setCourseOutlines(previousCourseOutlines);
        throw error;
      }

      await saveDemoSnapshot({ courseOutlines: optimisticCourseOutlines });
      return;
    }

    if (targetOutline?.storagePath) {
      try {
        await deleteOutlineDocument(targetOutline.storagePath);
      } catch (error) {
        console.warn('Course outline file delete failed after record cleanup', error);
      }
    }
  };

  const refresh = async () => {
    // Realtime listeners keep the app up to date.
  };

  return (
    <DataContext.Provider
      value={{
        ready,
        courses,
        reports,
        attendance,
        ratings,
        courseOutlines,
        addReport,
        updateReport,
        deleteReport,
        addFeedback,
        addAttendance,
        updateAttendance,
        deleteAttendance,
        addRating,
        updateRating,
        deleteRating,
        saveCourse,
        deleteCourse,
        saveCourseOutline,
        deleteCourseOutline,
        refresh,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => useContext(DataContext);
