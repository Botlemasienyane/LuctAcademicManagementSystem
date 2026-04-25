require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { getFirestore, verifyAuth } = require('./firebase');

const app = express();
app.use(cors());
app.use(express.json({ limit: '2mb' }));

const REVIEW_ROLES = ['PRL', 'PL', 'FMG'];
const COURSE_ROLES = ['PL', 'FMG'];
const ATTENDANCE_ROLES = ['Lecturer', 'PRL', 'PL', 'FMG'];

app.get('/health', (req, res) => res.json({ ok: true }));

// All app data routes need a signed-in Firebase user.
app.use('/api', verifyAuth);

function sanitizeString(value, label, { required = true, max = 500 } = {}) {
  const text = String(value ?? '').trim();
  if (required && !text) {
    const error = new Error(`${label} is required`);
    error.status = 400;
    throw error;
  }
  if (!text) return '';
  return text.slice(0, max);
}

function sanitizeNumber(value, label, { min = 0, max = 100000 } = {}) {
  const num = Number(value);
  if (!Number.isFinite(num)) {
    const error = new Error(`${label} must be a number`);
    error.status = 400;
    throw error;
  }
  if (num < min || num > max) {
    const error = new Error(`${label} must be between ${min} and ${max}`);
    error.status = 400;
    throw error;
  }
  return Math.round(num);
}

function sanitizeDate(value, label) {
  const text = sanitizeString(value, label, { max: 20 });
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    const error = new Error(`${label} must be in YYYY-MM-DD format`);
    error.status = 400;
    throw error;
  }
  return text;
}

function sanitizeTimeRange(value, label) {
  const text = sanitizeString(value, label, { max: 30 });
  if (!/^\d{2}:\d{2}-\d{2}:\d{2}$/.test(text)) {
    const error = new Error(`${label} must be in HH:MM-HH:MM format`);
    error.status = 400;
    throw error;
  }
  return text;
}

function sanitizeDay(value) {
  const day = sanitizeString(value, 'Day', { max: 20 });
  const allowed = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  if (!allowed.includes(day)) {
    const error = new Error('Day must be Monday to Friday');
    error.status = 400;
    throw error;
  }
  return day;
}

async function getRequesterProfile(req) {
  if (req.userProfile) return req.userProfile;
  const db = getFirestore();
  const snap = await db.collection('users').doc(req.user.uid).get();
  req.userProfile = snap.exists ? snap.data() : {};
  return req.userProfile;
}

async function requireRoles(req, roles) {
  const profile = await getRequesterProfile(req);
  if (!roles.includes(profile.role)) {
    const error = new Error('Forbidden');
    error.status = 403;
    throw error;
  }
  return profile;
}

async function ensureOwnerOrRole(req, collectionName, id, roles = []) {
  const db = getFirestore();
  const snap = await db.collection(collectionName).doc(id).get();
  if (!snap.exists) {
    const error = new Error('Record not found');
    error.status = 404;
    throw error;
  }

  const profile = await getRequesterProfile(req);
  const data = snap.data() || {};
  const isOwner = data.createdByUid === req.user.uid;
  const hasRole = roles.includes(profile.role);

  if (!isOwner && !hasRole) {
    const error = new Error('Forbidden');
    error.status = 403;
    throw error;
  }

  return { ref: snap.ref, data, profile };
}

function normalizeReport(payload, uid) {
  return {
    facultyName: sanitizeString(payload.facultyName, 'Faculty name', { max: 150 }),
    className: sanitizeString(payload.className, 'Class name', { max: 150 }),
    classCode: sanitizeString(payload.classCode, 'Class code', { max: 40 }),
    week: sanitizeString(payload.week, 'Week of reporting', { max: 40 }),
    dateOfLecture: sanitizeDate(payload.dateOfLecture, 'Date of lecture'),
    courseName: sanitizeString(payload.courseName, 'Course name', { max: 150 }),
    courseCode: sanitizeString(payload.courseCode, 'Course code', { max: 40 }),
    lecturerName: sanitizeString(payload.lecturerName, "Lecturer's name", { max: 120 }),
    actualStudents: sanitizeNumber(payload.actualStudents, 'Actual students present', { min: 0, max: 1000 }),
    totalRegistered: sanitizeNumber(payload.totalRegistered, 'Registered students', { min: 0, max: 1000 }),
    venue: sanitizeString(payload.venue, 'Venue', { max: 80 }),
    scheduledTime: sanitizeTimeRange(payload.scheduledTime, 'Scheduled lecture time'),
    topicTaught: sanitizeString(payload.topicTaught, 'Topic taught', { max: 1500 }),
    learningOutcomes: sanitizeString(payload.learningOutcomes, 'Learning outcomes', { max: 1500 }),
    recommendations: sanitizeString(payload.recommendations, "Lecturer's recommendations", { required: false, max: 1500 }),
    faculty: sanitizeString(payload.faculty, 'Faculty', { required: false, max: 20 }),
    status: 'submitted',
    feedback: '',
    submittedAt: payload.submittedAt || new Date().toISOString(),
    createdByUid: uid,
  };
}

function normalizeAttendance(payload, uid) {
  return {
    classCode: sanitizeString(payload.classCode, 'Class code', { max: 40 }),
    courseCode: sanitizeString(payload.courseCode, 'Course code', { max: 40 }),
    date: sanitizeDate(payload.date, 'Attendance date'),
    present: sanitizeNumber(payload.present, 'Present count', { min: 0, max: 1000 }),
    total: sanitizeNumber(payload.total, 'Registered count', { min: 0, max: 1000 }),
    lecturerName: sanitizeString(payload.lecturerName, 'Lecturer name', { max: 120 }),
    createdByUid: uid,
    createdAt: new Date().toISOString(),
  };
}

function normalizeRating(payload, uid) {
  return {
    lecturerName: sanitizeString(payload.lecturerName, 'Lecturer name', { max: 120 }),
    rating: sanitizeNumber(payload.rating, 'Rating', { min: 1, max: 5 }),
    comment: sanitizeString(payload.comment, 'Comment', { required: false, max: 1000 }),
    submittedBy: sanitizeString(payload.submittedBy || uid, 'Submitted by', { max: 120 }),
    classCode: sanitizeString(payload.classCode, 'Class code', { required: false, max: 40 }),
    date: sanitizeDate(payload.date || new Date().toISOString().slice(0, 10), 'Rating date'),
    createdByUid: uid,
    createdAt: new Date().toISOString(),
  };
}

function normalizeCourse(payload, uid) {
  return {
    class: sanitizeString(payload.class, 'Class', { max: 40 }),
    code: sanitizeString(payload.code, 'Course code', { max: 40 }).toUpperCase(),
    name: sanitizeString(payload.name, 'Course name', { max: 150 }),
    lecturer: sanitizeString(payload.lecturer, 'Lecturer', { max: 120 }),
    venue: sanitizeString(payload.venue, 'Venue', { max: 80 }),
    time: sanitizeTimeRange(payload.time, 'Time'),
    day: sanitizeDay(payload.day),
    updatedAt: new Date().toISOString(),
    updatedByUid: uid,
    deletedAt: payload.deletedAt || null,
  };
}

function handleError(res, error) {
  return res.status(error.status || 500).json({ error: error.message });
}

// Report routes
app.get('/api/reports', async (req, res) => {
  try {
    const db = getFirestore();
    const snap = await db.collection('reports').orderBy('submittedAt', 'desc').limit(300).get();
    const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    return res.json({ items });
  } catch (error) {
    return handleError(res, error);
  }
});

app.post('/api/reports', async (req, res) => {
  try {
    await requireRoles(req, ['Lecturer']);
    const db = getFirestore();
    const payload = normalizeReport(req.body || {}, req.user.uid);
    const docRef = await db.collection('reports').add(payload);
    return res.status(201).json({ id: docRef.id });
  } catch (error) {
    return handleError(res, error);
  }
});

app.put('/api/reports/:id', async (req, res) => {
  try {
    const { ref } = await ensureOwnerOrRole(req, 'reports', req.params.id, REVIEW_ROLES);
    const payload = normalizeReport(req.body || {}, req.user.uid);
    await ref.set(payload, { merge: true });
    return res.json({ ok: true });
  } catch (error) {
    return handleError(res, error);
  }
});

app.patch('/api/reports/:id/feedback', async (req, res) => {
  try {
    await requireRoles(req, REVIEW_ROLES);
    const db = getFirestore();
    const { id } = req.params;
    const feedback = sanitizeString((req.body || {}).feedback, 'Feedback', { max: 1500 });
    await db.collection('reports').doc(id).set(
      {
        feedback,
        status: 'reviewed',
        feedbackByUid: req.user.uid,
        feedbackAt: new Date().toISOString(),
      },
      { merge: true }
    );
    return res.json({ ok: true });
  } catch (error) {
    return handleError(res, error);
  }
});

app.delete('/api/reports/:id', async (req, res) => {
  try {
    const { ref } = await ensureOwnerOrRole(req, 'reports', req.params.id, REVIEW_ROLES);
    await ref.delete();
    return res.json({ ok: true });
  } catch (error) {
    return handleError(res, error);
  }
});

// Attendance routes
app.get('/api/attendance', async (req, res) => {
  try {
    const db = getFirestore();
    const snap = await db.collection('attendance').orderBy('date', 'desc').limit(500).get();
    const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    return res.json({ items });
  } catch (error) {
    return handleError(res, error);
  }
});

app.post('/api/attendance', async (req, res) => {
  try {
    await requireRoles(req, ATTENDANCE_ROLES);
    const db = getFirestore();
    const payload = normalizeAttendance(req.body || {}, req.user.uid);
    const docRef = await db.collection('attendance').add(payload);
    return res.status(201).json({ id: docRef.id });
  } catch (error) {
    return handleError(res, error);
  }
});

app.put('/api/attendance/:id', async (req, res) => {
  try {
    const { ref } = await ensureOwnerOrRole(req, 'attendance', req.params.id, ['PL', 'FMG']);
    const payload = normalizeAttendance(req.body || {}, req.user.uid);
    await ref.set(payload, { merge: true });
    return res.json({ ok: true });
  } catch (error) {
    return handleError(res, error);
  }
});

app.delete('/api/attendance/:id', async (req, res) => {
  try {
    const { ref } = await ensureOwnerOrRole(req, 'attendance', req.params.id, ['PL', 'FMG']);
    await ref.delete();
    return res.json({ ok: true });
  } catch (error) {
    return handleError(res, error);
  }
});

// Rating routes
app.get('/api/ratings', async (req, res) => {
  try {
    const db = getFirestore();
    const snap = await db.collection('ratings').orderBy('date', 'desc').limit(500).get();
    const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    return res.json({ items });
  } catch (error) {
    return handleError(res, error);
  }
});

app.post('/api/ratings', async (req, res) => {
  try {
    await requireRoles(req, ['Student']);
    const db = getFirestore();
    const payload = normalizeRating(req.body || {}, req.user.uid);
    const docRef = await db.collection('ratings').add(payload);
    return res.status(201).json({ id: docRef.id });
  } catch (error) {
    return handleError(res, error);
  }
});

app.put('/api/ratings/:id', async (req, res) => {
  try {
    const { ref } = await ensureOwnerOrRole(req, 'ratings', req.params.id, ['FMG']);
    const payload = normalizeRating(req.body || {}, req.user.uid);
    await ref.set(payload, { merge: true });
    return res.json({ ok: true });
  } catch (error) {
    return handleError(res, error);
  }
});

app.delete('/api/ratings/:id', async (req, res) => {
  try {
    const { ref } = await ensureOwnerOrRole(req, 'ratings', req.params.id, ['FMG']);
    await ref.delete();
    return res.json({ ok: true });
  } catch (error) {
    return handleError(res, error);
  }
});

// Course routes
app.get('/api/courses', async (req, res) => {
  try {
    const db = getFirestore();
    const snap = await db.collection('courses').limit(500).get();
    const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    return res.json({ items });
  } catch (error) {
    return handleError(res, error);
  }
});

app.post('/api/courses', async (req, res) => {
  try {
    await requireRoles(req, COURSE_ROLES);
    const db = getFirestore();
    const payload = normalizeCourse(req.body || {}, req.user.uid);
    const explicitId = sanitizeString((req.body || {}).id, 'Course id', { required: false, max: 120 });

    if (explicitId) {
      await db.collection('courses').doc(explicitId).set(payload, { merge: true });
      return res.status(201).json({ id: explicitId });
    }

    const docRef = await db.collection('courses').add(payload);
    return res.status(201).json({ id: docRef.id });
  } catch (error) {
    return handleError(res, error);
  }
});

app.put('/api/courses/:id', async (req, res) => {
  try {
    await requireRoles(req, COURSE_ROLES);
    const db = getFirestore();
    const payload = normalizeCourse(req.body || {}, req.user.uid);
    await db.collection('courses').doc(req.params.id).set(payload, { merge: true });
    return res.json({ ok: true });
  } catch (error) {
    return handleError(res, error);
  }
});

app.delete('/api/courses/:id', async (req, res) => {
  try {
    await requireRoles(req, COURSE_ROLES);
    const db = getFirestore();
    await db.collection('courses').doc(req.params.id).set(
      {
        deletedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        updatedByUid: req.user.uid,
      },
      { merge: true }
    );
    return res.json({ ok: true });
  } catch (error) {
    return handleError(res, error);
  }
});

const port = parseInt(process.env.PORT || '4000', 10);
app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Backend listening on http://localhost:${port}`);
});
