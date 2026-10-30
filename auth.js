// js/auth.js
// Shared authentication + role-guard helpers.

import { auth, db } from "./firebase-config.js";
import { getDocCached, clearFirestoreCache, watchRemoteCacheChanges } from "./firestore-cache.js";
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  doc,
  getDoc,
  setDoc,
  runTransaction,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

/** Log in with email/password. Returns the Firebase user credential. */
export function loginUser(email, password) {
  return signInWithEmailAndPassword(auth, email, password);
}

/** Log the current user out. */
export async function logoutUser() {
  clearFirestoreCache();
  return signOut(auth);
}

/** Fetch the Firestore profile (users/{uid}) for a given uid. */
export async function getUserProfile(uid) {
  // Always read the canonical UID document directly (never use email as doc ID).
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? { ...snap.data(), uid } : null;
}

/**
 * Recover a missing student profile after successful Firebase Authentication.
 * Firestore rules must allow an owner to create only their own role=student profile.
 * This deliberately never creates or changes an admin role.
 */
export async function getOrRepairUserProfile(user) {
  if (!user?.uid) throw new Error("A signed-in account is required to load the profile.");
  let profile = await getUserProfile(user.uid);
  if (profile) return { ...profile, emailVerified: Boolean(user.emailVerified) };

  const email = String(user.email || "").trim().toLowerCase();
  if (!email) throw new Error("This account has no email address. Contact support.");
  const name = String(user.displayName || email.split("@")[0] || "Student").trim();
  const profileRef = doc(db, "users", user.uid);
  const recovered = {
    uid: user.uid,
    name,
    email,
    role: "student",
    emailVerified: Boolean(user.emailVerified),
    subscriptionStatus: "inactive",
    createdAt: serverTimestamp(),
    profileRecoveredAt: serverTimestamp()
  };
  // Transaction prevents racing login listeners from overwriting a profile
  // created by another request/admin between the initial read and write.
  await runTransaction(db, async (transaction) => {
    const current = await transaction.get(profileRef);
    if (!current.exists()) transaction.set(profileRef, recovered);
  });
  profile = await getUserProfile(user.uid);
  if (!profile) throw new Error("Profile recovery did not complete. Please retry or contact support.");
  return { ...profile, emailVerified: Boolean(user.emailVerified) };
}

/**
 * Guards a page so only signed-in users with the expected role can view it.
 * - Not signed in -> redirect to login.html
 * - Signed in but no Firestore profile -> sign out, redirect to login.html
 * - Signed in with the WRONG role -> redirect to their correct dashboard
 * - Signed in with the RIGHT role -> calls onReady(user, profile)
 */
let lastAuthUid = null;
let stopRemoteCacheWatch = null;

export function requireRole(expectedRole, onReady) {
  onAuthStateChanged(auth, async (user) => {
    if (user && lastAuthUid && lastAuthUid !== user.uid) clearFirestoreCache();
    lastAuthUid = user?.uid || null;
    if (!user) {
      if (stopRemoteCacheWatch) { stopRemoteCacheWatch(); stopRemoteCacheWatch = null; }
      window.location.href = "login.html";
      return;
    }
    if (lastAuthUid && lastAuthUid !== user.uid && stopRemoteCacheWatch) {
      stopRemoteCacheWatch();
      stopRemoteCacheWatch = null;
    }

    let profile;
    try {
      profile = await getOrRepairUserProfile(user);
    } catch (error) {
      console.error("Profile load/recovery failed:", error.code || error.message, error);
      alert(error.code === "permission-denied"
        ? "Your account signed in, but Firestore rules blocked profile recovery. Please contact support."
        : "Your account signed in, but its profile could not be loaded. Please retry; your account has not been deleted.");
      await logoutUser();
      window.location.href = "login.html";
      return;
    }

    if (profile.role !== expectedRole) {
      window.location.href =
        profile.role === "admin" ? "admin-dashboard.html" : "student-dashboard.html";
      return;
    }

    // Keep the dashboard accessible for history and renewal; gate premium learning/exam pages.
    if (profile.role === "student") {
      const currentPage = window.location.pathname.split("/").pop() || "index.html";
      const dashboardPages = new Set(["student-dashboard.html", "subscriptions.html", "my-certificates.html"]);
      if (!dashboardPages.has(currentPage)) {
        try {
          const subscriptionSnap = await getDoc(doc(db, "subscriptions", user.uid));
          const subscription = subscriptionSnap.exists() ? subscriptionSnap.data() : null;
          const expiresAt = subscription?.expiresAt?.toDate ? subscription.expiresAt.toDate() : null;
          if (subscription?.status !== "active" || !expiresAt || expiresAt <= new Date()) {
            window.location.href = "subscriptions.html";
            return;
          }
        } catch (error) {
          console.error("Subscription access check failed:", error);
          window.location.href = "subscriptions.html";
          return;
        }
      }
    }

    if (profile.role === "student" && !stopRemoteCacheWatch) stopRemoteCacheWatch = watchRemoteCacheChanges(db);
    onReady(user, profile);
  });
}

/** Small helper to show a Bootstrap alert element by id. */
export function showError(elId, message) {
  const el = document.getElementById(elId);
  if (!el) return;
  el.textContent = message;
  el.classList.remove("d-none");
}

export function hideError(elId) {
  const el = document.getElementById(elId);
  if (!el) return;
  el.classList.add("d-none");
}

/** Wire up any element with data-logout="true" to sign the user out. */
export function wireLogoutButtons() {
  document.querySelectorAll('[data-logout="true"]').forEach((btn) => {
    btn.addEventListener("click", async () => {
      await logoutUser();
      window.location.href = "login.html";
    });
  });
}
