import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { COURSES } from '../data/seedData';
import { apiFetch } from '../services/apiClient';
import { addDocToCollection, updateDocFields } from '../services/firebaseFirestore';
import { getFirebaseDb } from '../services/firebaseClient';
import { useAuth } from './AuthContext';

const DataContext = createContext();

const INITIAL_STATE = {
  courses: COURSES,
  reports: [],
  attendance: [],
  ratings: [],
};

export const DataProvider = ({ children }) => {
  const { ready: authReady, user, getIdToken } = useAuth();
  const [courses, setCourses] = useState(INITIAL_STATE.courses);
  const [reports, setReports] = useState(INITIAL_STATE.reports);
  const [attendance, setAttendance] = useState(INITIAL_STATE.attendance);
  const [ratings, setRatings] = useState(INITIAL_STATE.ratings);
  const [ready, setReady] = useState(false);
  const db = useMemo(() => getFirebaseDb(), []);

  const fetchAll = useMemo(
    () => async () => {
      if (!user) {
        setReports([]);
        setAttendance([]);
        setRatings([]);
        setReady(true);
        return;
      }

      try {
        const token = await getIdToken();
        if (!token) {
          setReady(true);
          return;
        }

        const [rep, att, rat] = await Promise.all([
          apiFetch('/api/reports', { token }),
          apiFetch('/api/attendance', { token }),
          apiFetch('/api/ratings', { token }),
        ]);
        setReports(rep.items || []);
        setAttendance(att.items || []);
        setRatings(rat.items || []);
      } catch (error) {
        console.warn('Failed to load remote data', error);
      } finally {
        setReady(true);
      }
    },
    [getIdToken, user]
  );

  useEffect(() => {
    if (!authReady) return;
    fetchAll();
  }, [authReady, fetchAll, user?.id]);

  const addReport = async (report) => {
    // The brief needs lecturer reports to be saved and shown in the app.
    const payload = {
      ...report,
      status: report.status || 'submitted',
      feedback: report.feedback || '',
      submittedAt: report.submittedAt || new Date().toISOString(),
      createdByUid: user?.id || '',
    };

    let res = null;
    let lastError = null;

    try {
      const token = await getIdToken();
      if (token) {
        res = await apiFetch('/api/reports', { token, method: 'POST', body: report });
      }
    } catch (error) {
      lastError = error;
      console.warn('API report submit failed, falling back to direct Firestore write', error);
    }

    if (!res?.id) {
      // If the backend is slow, save straight to Firebase so the report is not lost.
      try {
        res = await addDocToCollection(db, 'reports', payload);
      } catch (fallbackError) {
        throw fallbackError || lastError || new Error('Unable to submit report right now.');
      }
    }

    const newReport = { ...payload, id: res.id };
    setReports(prev => [newReport, ...prev]);
    return newReport;
  };

  const addFeedback = async (reportId, feedback) => {
    // PRL, PL, and FMG can review reports and save feedback.
    let updated = false;

    try {
      const token = await getIdToken();
      if (token) {
        await apiFetch(`/api/reports/${reportId}/feedback`, { token, method: 'PATCH', body: { feedback } });
        updated = true;
      }
    } catch (error) {
      console.warn('API feedback update failed, falling back to direct Firestore write', error);
    }

    if (!updated) {
      await updateDocFields(db, 'reports', reportId, {
        feedback,
        status: 'reviewed',
        feedbackByUid: user?.id || '',
        feedbackAt: new Date().toISOString(),
      });
    }

    setReports(prev => prev.map(r => (r.id === reportId ? { ...r, feedback, status: 'reviewed' } : r)));
  };

  const addAttendance = async (record) => {
    // Attendance is stored separately so Insights can summarize it by course.
    const payload = {
      ...record,
      createdByUid: user?.id || '',
      createdAt: new Date().toISOString(),
    };

    let res = null;

    try {
      const token = await getIdToken();
      if (token) {
        res = await apiFetch('/api/attendance', { token, method: 'POST', body: record });
      }
    } catch (error) {
      console.warn('API attendance submit failed, falling back to direct Firestore write', error);
    }

    if (!res?.id) {
      res = await addDocToCollection(db, 'attendance', payload);
    }

    setAttendance(prev => [{ ...payload, id: res.id }, ...prev]);
  };

  const addRating = async (rating) => {
    // Student ratings are saved here for the rating module in the brief.
    const payload = {
      ...rating,
      createdByUid: user?.id || '',
      createdAt: new Date().toISOString(),
    };

    let res = null;

    try {
      const token = await getIdToken();
      if (token) {
        res = await apiFetch('/api/ratings', { token, method: 'POST', body: rating });
      }
    } catch (error) {
      console.warn('API rating submit failed, falling back to direct Firestore write', error);
    }

    if (!res?.id) {
      res = await addDocToCollection(db, 'ratings', payload);
    }

    setRatings(prev => [{ ...payload, id: res.id }, ...prev]);
  };

  const saveCourse = (course) => {
    const existingMatch = courses.find(
      entry => entry.id === course.id || (entry.code === course.code && entry.class === course.class)
    );

    const normalizedCourse = {
      ...existingMatch,
      ...course,
      id: existingMatch?.id || course.id || `crs_${Date.now()}`,
    };

    if (existingMatch) {
      setCourses(prev => prev.map(entry => (entry.id === existingMatch.id ? normalizedCourse : entry)));
    } else {
      setCourses(prev => [normalizedCourse, ...prev]);
    }

    return normalizedCourse;
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
        addFeedback,
        addAttendance,
        addRating,
        saveCourse,
        refresh: fetchAll,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => useContext(DataContext);
