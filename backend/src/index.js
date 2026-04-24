require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { getFirestore, verifyAuth } = require('./firebase');

const app = express();
app.use(cors());
app.use(express.json({ limit: '2mb' }));

app.get('/health', (req, res) => res.json({ ok: true }));

// All app data routes need a signed-in Firebase user.
app.use('/api', verifyAuth);

// Report routes
app.get('/api/reports', async (req, res) => {
  try {
    const db = getFirestore();
    const snap = await db.collection('reports').orderBy('submittedAt', 'desc').limit(200).get();
    const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    return res.json({ items });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

app.post('/api/reports', async (req, res) => {
  try {
    const db = getFirestore();
    const payload = req.body || {};
    const now = new Date().toISOString();
    const doc = await db.collection('reports').add({
      ...payload,
      status: payload.status || 'submitted',
      feedback: payload.feedback || '',
      submittedAt: payload.submittedAt || now,
      createdByUid: req.user.uid,
    });
    return res.status(201).json({ id: doc.id });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

app.patch('/api/reports/:id/feedback', async (req, res) => {
  try {
    const db = getFirestore();
    const { id } = req.params;
    const { feedback } = req.body || {};
    if (!feedback) return res.status(400).json({ error: 'Missing feedback' });
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
    return res.status(500).json({ error: error.message });
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
    return res.status(500).json({ error: error.message });
  }
});

app.post('/api/attendance', async (req, res) => {
  try {
    const db = getFirestore();
    const payload = req.body || {};
    const doc = await db.collection('attendance').add({
      ...payload,
      createdByUid: req.user.uid,
      createdAt: new Date().toISOString(),
    });
    return res.status(201).json({ id: doc.id });
  } catch (error) {
    return res.status(500).json({ error: error.message });
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
    return res.status(500).json({ error: error.message });
  }
});

app.post('/api/ratings', async (req, res) => {
  try {
    const db = getFirestore();
    const payload = req.body || {};
    const doc = await db.collection('ratings').add({
      ...payload,
      createdByUid: req.user.uid,
      createdAt: new Date().toISOString(),
    });
    return res.status(201).json({ id: doc.id });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

const port = parseInt(process.env.PORT || '4000', 10);
app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Backend listening on http://localhost:${port}`);
});
