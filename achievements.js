import { db } from "./firebase-config.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

export const DEFAULT_ACHIEVEMENT_SETTINGS = Object.freeze({
  codingBadgeCount: 25,
  streakBadgeDays: 7,
  pointsBadgeTarget: 500,
  weeklyGoalQuestions: 5,
  updatedAt: null
});

export async function getAchievementSettings() {
  try {
    const snap = await getDoc(doc(db, "appSettings", "achievementSettings"));
    return snap.exists() ? { ...DEFAULT_ACHIEVEMENT_SETTINGS, ...snap.data() } : { ...DEFAULT_ACHIEVEMENT_SETTINGS };
  } catch (error) {
    console.warn("Achievement settings unavailable; using defaults.", error);
    return { ...DEFAULT_ACHIEVEMENT_SETTINGS };
  }
}

const esc = (value) => String(value ?? "").replace(/[&<>\"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[ch]));
const pct = (value, target) => Math.min(100, Math.round((Math.max(0, Number(value) || 0) / Math.max(1, Number(target) || 1)) * 100));

export function renderAchievementPanel(container, { pointsData = {}, streakStats = {}, learningProgress = [], settings = DEFAULT_ACHIEVEMENT_SETTINGS } = {}) {
  if (!container) return;
  const points = Number(pointsData.points || 0);
  const completed = Array.isArray(pointsData.completedCodingQuestionIds) ? pointsData.completedCodingQuestionIds.length : 0;
  const currentStreak = Number(streakStats.currentStreak || 0);
  const bestStreak = Number(streakStats.bestStreak || 0);
  const completedConcepts = (learningProgress || []).reduce((sum, row) => sum + (Array.isArray(row.completedConceptIds) ? row.completedConceptIds.length : 0), 0);
  const weekSolved = (streakStats.last7 || []).filter((day) => day.qualified).length;
  const goals = [
    { icon: "bi-code-slash", title: "Code Warrior", desc: `Solve ${settings.codingBadgeCount} unique coding questions`, value: completed, target: settings.codingBadgeCount, unlocked: completed >= settings.codingBadgeCount, color: "cyan" },
    { icon: "bi-fire", title: "Streak Star", desc: `Maintain a ${settings.streakBadgeDays}-day learning streak`, value: bestStreak, target: settings.streakBadgeDays, unlocked: bestStreak >= settings.streakBadgeDays, color: "orange" },
    { icon: "bi-gem", title: "Special Section Star", desc: "Reach 200 Learning Points", value: points, target: 200, unlocked: points >= 200, color: "violet" },
    { icon: "bi-stars", title: "Pyvanta Legend", desc: `Earn ${settings.pointsBadgeTarget} Learning Points`, value: points, target: settings.pointsBadgeTarget, unlocked: points >= settings.pointsBadgeTarget, color: "gold" },
    { icon: "bi-calendar-check", title: "Weekly Goal", desc: `Solve problems on ${settings.weeklyGoalQuestions} days this week`, value: weekSolved, target: settings.weeklyGoalQuestions, unlocked: weekSolved >= settings.weeklyGoalQuestions, color: "green" },
    { icon: "bi-mortarboard", title: "Learning Starter", desc: "Complete your first learning concept", value: completedConcepts, target: 1, unlocked: completedConcepts > 0, color: "blue" }
  ];
  const unlocked = goals.filter((goal) => goal.unlocked).length;
  container.innerHTML = `
    <div class="achievements-head">
      <div><div class="achievements-kicker"><i class="bi bi-stars me-1"></i>YOUR CODING JOURNEY</div><h5 class="mb-1">Achievements & Goals</h5><div class="text-muted small">Earn stars by learning consistently and solving new problems.</div></div>
      <div class="achievement-count"><i class="bi bi-trophy-fill"></i><strong>${unlocked}/${goals.length}</strong><span>unlocked</span></div>
    </div>
    <div class="achievement-goal-banner"><div class="d-flex justify-content-between align-items-center gap-2"><strong>Next goal: ${esc((goals.find((g) => !g.unlocked) || goals[0]).title)}</strong><span>${Math.round((unlocked / goals.length) * 100)}%</span></div><div class="achievement-track"><span style="width:${Math.round((unlocked / goals.length) * 100)}%"></span></div><div class="small text-muted mt-2">${unlocked === goals.length ? "Amazing! You unlocked every current achievement." : `${goals.length - unlocked} more milestone${goals.length - unlocked === 1 ? "" : "s"} to collect.`}</div></div>
    <div class="achievement-grid">${goals.map((g) => `<article class="achievement-item ${g.unlocked ? "is-unlocked" : "is-locked"}"><div class="achievement-icon ${g.color}"><i class="bi ${g.icon}"></i></div><div class="achievement-content"><div class="d-flex align-items-center justify-content-between gap-2"><strong>${esc(g.title)}</strong><span class="achievement-status">${g.unlocked ? "★ Earned" : "Locked"}</span></div><div class="small text-muted">${esc(g.desc)}</div><div class="achievement-track mt-2"><span style="width:${pct(g.value, g.target)}%"></span></div><div class="achievement-progress">${Math.min(g.value, g.target)} / ${g.target}</div></div></article>`).join("")}</div>`;
}
