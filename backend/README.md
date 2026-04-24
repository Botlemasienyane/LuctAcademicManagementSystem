# Backend Setup (Firebase)

## 1) Download Service Account JSON
Firebase Console → Project settings → Service accounts → Generate new private key.

Save the downloaded file into this folder as:
- `backend/serviceAccountKey.json`

## 2) Create `.env`
Copy `.env.example` to `.env` and set:
- `FIREBASE_PROJECT_ID`
- `FIREBASE_SERVICE_ACCOUNT_PATH=serviceAccountKey.json`

## 3) Run
```bash
npm run dev
```

Health check:
- `GET http://localhost:4000/health`

