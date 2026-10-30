import { db } from "./firebase-config.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getPyvantaPlan } from "./subscription-config.js";

export async function getActiveSubscription(uid) {
  if (!uid) return null;
  const snap = await getDoc(doc(db, "subscriptions", uid));
  if (!snap.exists()) return null;
  const data = snap.data();
  const expiry = data.expiresAt?.toDate?.() || null;
  if (data.status !== "active" || !expiry || expiry <= new Date()) return null;
  const plan = getPyvantaPlan(data.planId);
  return { ...data, expiry, plan, planId: plan?.id || data.planId || "starter" };
}

export function subscriptionCanAccessSpecialSection(subscription) {
  return !!subscription && ["pro", "premium"].includes(subscription.planId);
}

export function subscriptionCanAccessAllSpecialSections(subscription) {
  return !!subscription && subscription.planId === "premium";
}

export function subscriptionCanAccessVisualizations(subscription) {
  return !!subscription && subscription.planId === "premium";
}
