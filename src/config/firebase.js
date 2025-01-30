// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyB6-ksPOA7Bei5gm4_mHTTLOmxZiM9WQ8M",
  authDomain: "adcrm-a0bf3.firebaseapp.com",
  projectId: "adcrm-a0bf3",
  storageBucket: "adcrm-a0bf3.appspot.com",
  messagingSenderId: "719101108135",
  appId: "1:719101108135:web:ece59bc56406ee6f7ca082",
  measurementId: "G-2LRNDSCHK5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore()

export {auth, db}