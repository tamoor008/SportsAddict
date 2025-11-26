import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getDatabase, Database } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyCKh8xESZCOE2jDBCUvOcq6DcxPhKBd-ak",
  authDomain: "sportsaddict-2f874.firebaseapp.com",
  projectId: "sportsaddict-2f874",
  storageBucket: "sportsaddict-2f874.firebasestorage.app",
  messagingSenderId: "726517767562",
  appId: "1:726517767562:web:9141cbb5fef5e487413c73",
  measurementId: "G-58E7FX3ZZ3",
  databaseURL: "https://sportsaddict-2f874-default-rtdb.firebaseio.com/"
};

let app: FirebaseApp;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

const auth: Auth = getAuth(app);
const database: Database = getDatabase(app);

export { auth, database, app };

