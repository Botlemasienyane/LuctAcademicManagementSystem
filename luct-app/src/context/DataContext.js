import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { COURSES } from '../data/seedData';
import { apiFetch } from '../services/apiClient';
import {
  addDocToCollection,
  deleteDocFromCollection,
  subscribeToCollection,
  updateDocFields,
} from '../services/firebaseFirestore';
import { getFirebaseDb } from '../services/firebaseClient';
import { useAuth } from './AuthContext';

const DataContext = createContext();

const INITIAL_STATE = {
  courses: COURSES,
  reports: [],
  attendance: [],
  ratings: [],
};

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

export const DataProvider = ({ children }) => {
  const { ready: authReady, user, getIdToken } = useAuth();
  const [courses, setCourses] = useState(INITIAL_STATE.courses);
  const [reports, setReports] = useState(INITIAL_STATE.reports);
  const [attendance, setAttendance] = useState(INITIAL_STATE.attendance);
  const [ratings, setRatings] = useState(INITIAL_STATE.ratings);
  const [ready, setReady] = useState(false);
  const db = useMemo(() => getFirebaseDb(), []);

  useEffect(() => {
    if (!authReady) return undefined;

    if (!user) {
      setCourses(INITIAL_STATE.courses);
      setReports([]);
      setAttendance([]);
      setRatings([]);
      setReady(true);
      return undefined;
    }

    setReady(false);

    const pending = new Set(['reports', 'attendance', 'ratings', 'courses']);
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
          setReports(items);
          markReady('reports');
        },
        error => {
          console.warn('Realtime reports sync failed', error);
          markReady('reports');
        }
      ),
      subscribeToCollection(
        db,
        'attendance',
        { orderByField: 'date', orderDirection: 'desc', limitCount: 500 },
        items => {
          setAttendance(items);
          markReady('attendance');
        },
        error => {
          console.warn('Realtime attendance sync failed', error);
          markReady('attendance');
        }
      ),
      subscribeToCollection(
        db,
        'ratings',
        { orderByField: 'date', orderDirection: 'desc', limitCount: 500 },
        items => {
          setRatings(items);
          markReady('ratings');
        },
        error => {
          console.warn('Realtime ratings sync failed', error);
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
        return { ...payload, id: res.id };
      }
    } catch (error) {
      console.warn('API report submit failed, falling back to direct Firestore write', error);
    }

    const res = await addDocToCollection(db, 'reports', payload);
    return { ...payload, id: res.id };
  };

  const updateReport = async (reportId, report) => {
    try {
      const token = await getIdToken();
      if (token) {
        await apiFetch(`/api/reports/${reportId}`, { token, method: 'PUT', body: report });
        return;
      }
    } catch (error) {
      console.warn('API report update failed, falling back to direct Firestore write', error);
    }

    await updateDocFields(db, 'reports', reportId, report);
  };

  const deleteReport = async (reportId) => {
    try {
      const token = await getIdToken();
      if (token) {
        await apiFetch(`/api/reports/${reportId}`, { token, method: 'DELETE' });
        return;
      }
    } catch (error) {
      console.warn('API report delete failed, falling back to direct Firestore delete', error);
    }

    await deleteDocFromCollection(db, 'reports', reportId);
  };

  const addFeedback = async (reportId, feedback) => {
    try {
      const token = await getIdToken();
      if (token) {
        await apiFetch(`/api/reports/${reportId}/feedback`, { token, method: 'PATCH', body: { feedback } });
        return;
      }
    } catch (error) {
      console.warn('API feedback update failed, falling back to direct Firestore write', error);
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
      createdByUid: user?.id || '',
      createdAt: new Date().toISOString(),
    };

    try {
      const token = await getIdToken();
      if (token) {
        const res = await apiFetch('/api/attendance', { token, method: 'POST', body: record });
        return { ...payload, id: res.id };
      }
    } catch (error) {
      console.warn('API attendance submit failed, falling back to direct Firestore write', error);
    }

    const res = await addDocToCollection(db, 'attendance', payload);
    return { ...payload, id: res.id };
  };

  const updateAttendance = async (attendanceId, record) => {
    try {
      const token = await getIdToken();
      if (token) {
        await apiFetch(`/api/attendance/${attendanceId}`, { token, method: 'PUT', body: record });
        return;
      }
    } catch (error) {
      console.warn('API attendance update failed, falling back to direct Firestore write', error);
    }

    await updateDocFields(db, 'attendance', attendanceId, record);
  };

  const deleteAttendance = async (attendanceId) => {
    try {
      const token = await getIdToken();
      if (token) {
        await apiFetch(`/api/attendance/${attendanceId}`, { token, method: 'DELETE' });
        return;
      }
    } catch (error) {
      console.warn('API attendance delete failed, falling back to direct Firestore delete', error);
    }

    await deleteDocFromCollection(db, 'attendance', attendanceId);
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
        return { ...payload, id: res.id };
      }
    } catch (error) {
      console.warn('API rating submit failed, falling back to direct Firestore write', error);
    }

    const res = await addDocToCollection(db, 'ratings', payload);
    return { ...payload, id: res.id };
  };

  const updateRating = async (ratingId, rating) => {
    try {
      const token = await getIdToken();
      if (token) {
        await apiFetch(`/api/ratings/${ratingId}`, { token, method: 'PUT', body: rating });
        return;
      }
    } catch (error) {
      console.warn('API rating update failed, falling back to direct Firestore write', error);
    }

    await updateDocFields(db, 'ratings', ratingId, rating);
  };

  const deleteRating = async (ratingId) => {
    try {
      const token = await getIdToken();
      if (token) {
        await apiFetch(`/api/ratings/${ratingId}`, { token, method: 'DELETE' });
        return;
      }
    } catch (error) {
      console.warn('API rating delete failed, falling back to direct Firestore delete', error);
    }

    await deleteDocFromCollection(db, 'ratings', ratingId);
  };

  const saveCourse = async (course) => {
    const existingMatch = courses.find(
      entry => entry.id === course.id || (entry.code === course.code && entry.class === course.class)
    );

    const normalizedCourse = {
      ...existingMatch,
      ...course,
      id: existingMatch?.id || course.id || `crs_${Date.now()}`,
      updatedByUid: user?.id || '',
      updatedAt: new Date().toISOString(),
      deletedAt: null,
    };

    try {
      const token = await getIdToken();
      if (token) {
        if (existingMatch?.id) {
          await apiFetch(`/api/courses/${existingMatch.id}`, { token, method: 'PUT', body: normalizedCourse });
          return normalizedCourse;
        }

        const res = await apiFetch('/api/courses', { token, method: 'POST', body: normalizedCourse });
        return { ...normalizedCourse, id: res.id };
      }
    } catch (error) {
      console.warn('API course save failed, falling back to direct Firestore write', error);
    }

    await updateDocFields(db, 'courses', normalizedCourse.id, normalizedCourse);
    return normalizedCourse;
  };

  const deleteCourse = async (courseId) => {
    const payload = {
      deletedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      updatedByUid: user?.id || '',
    };

    try {
      const token = await getIdToken();
      if (token) {
        await apiFetch(`/api/courses/${courseId}`, { token, method: 'DELETE' });
        return;
      }
    } catch (error) {
      console.warn('API course delete failed, falling back to direct Firestore update', error);
    }

    await updateDocFields(db, 'courses', courseId, payload);
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
        refresh,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => useContext(DataContext);
