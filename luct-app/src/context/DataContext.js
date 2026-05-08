import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
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

const INITIAL_STATE = {
  courses: COURSES,
  reports: SEEDED_REPORTS,
  attendance: SEEDED_ATTENDANCE,
  ratings: SEEDED_RATINGS,
  courseOutlines: SEEDED_COURSE_OUTLINES,
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

    await updateDocFields(db, 'courseOutlines', outlineId, payload);
    return payload;
  };

  const deleteCourseOutline = async (outline) => {
    const { existingMatch, classCode, faculty } = resolveManagedCourseOutline(outline);
    const targetOutline = existingMatch || outline;

    await updateDocFields(db, 'courseOutlines', targetOutline.id, {
      ...targetOutline,
      classCode,
      faculty,
      deletedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      updatedByUid: user?.id || '',
    });

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
