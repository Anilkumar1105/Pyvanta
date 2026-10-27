// js/firebase-config.js
// Central place to initialize Firebase. All other JS files import
// `auth`, `db`, and `secondaryAuth` from here.

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// TODO: Replace with your own Firebase project config
// (Firebase Console -> Project Settings -> General -> Your apps -> SDK setup)
// Firebase configuration for the Pyvanta project
const firebaseConfig = {
  apiKey: "AIzaSyC7UIZD_NLKGJbdHylRqwKILPIoRjS4O6c",
  authDomain: "pyvanta-cae84.firebaseapp.com",
  projectId: "pyvanta-cae84",
  storageBucket: "pyvanta-cae84.firebasestorage.app",
  messagingSenderId: "266779209954",
  appId: "1:266779209954:web:ab7983e489cc1749ce6ebb",
  measurementId: "G-JDVXNJDV62"
};

// Primary app: used for the currently logged-in user (admin or student)
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Secondary app instance: lets an admin create a Firebase Auth account
// for a new student WITHOUT signing the admin out of their own session
// (createUserWithEmailAndPassword normally signs the new user in on the
// app instance it's called on).
export const secondaryApp = initializeApp(firebaseConfig, "Secondary");
export const secondaryAuth = getAuth(secondaryApp);
