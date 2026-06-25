import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCNqeHVscgqUhEOzkDoqtvirvWaXfMkBCw",
  authDomain: "gst-invoice-tool-478db.firebaseapp.com",
  databaseURL: "https://gst-invoice-tool-478db-default-rtdb.firebaseio.com",
  projectId: "gst-invoice-tool-478db",
  storageBucket: "gst-invoice-tool-478db.firebasestorage.app",
  messagingSenderId: "452197123231",
  appId: "1:452197123231:web:dc3c8c4d3ad6066a9d0eaa",
  measurementId: "G-SX28ZRRN88"
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();