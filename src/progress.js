const KEY = "enade-ec-v1";

const empty = () => ({
  answers: {},
  reads: {},
  reviews: {},
  essays: {},
  plan: {},
  theme: "light",
  bankMode: "treino",
});

export function loadState() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return empty();
    return { ...empty(), ...JSON.parse(raw) };
  } catch {
    return empty();
  }
}

export function saveState(state) {
  localStorage.setItem(KEY, JSON.stringify(state));
}

export function todayISO(offsetDays = 0) {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

export function scheduleReview(prev, grade) {
  const base = prev || { ease: 2.3, interval: 0, reps: 0, lapses: 0 };
  let { ease, interval, reps, lapses } = base;
  if (grade === "wrong") {
    lapses += 1;
    reps = 0;
    interval = 1;
    ease = Math.max(1.3, ease - 0.2);
  } else if (grade === "hard") {
    reps += 1;
    interval = Math.max(1, Math.round((interval || 1) * 1.2));
    ease = Math.max(1.3, ease - 0.05);
  } else if (grade === "good") {
    reps += 1;
    interval = interval < 1 ? 1 : Math.round(interval * ease);
    ease = ease + 0.05;
  } else {
    reps += 1;
    interval = interval < 1 ? 3 : Math.round(interval * ease * 1.3);
    ease = ease + 0.12;
  }
  return { ease, interval, reps, lapses, due: todayISO(interval), grade };
}
