import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Konfigurasi Firebase untuk web app "pustakaparty"
const firebaseConfig = {
  apiKey: "AIzaSyAA56ywSPQrRwtlsz9hczv6NaDnXNXu0P4",
  authDomain: "pustakaparty.firebaseapp.com",
  projectId: "pustakaparty",
  storageBucket: "pustakaparty.firebasestorage.app",
  messagingSenderId: "660433022558",
  appId: "1:660433022558:web:de4cf89c3edfee0fcf8ecf"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
const db = getFirestore(app);

export { auth, googleProvider, db };