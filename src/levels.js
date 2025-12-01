export const levels = [
  {
    id: 1,
    name: "بداية الرحلة",
    description: "تعلم الأساسيات ودافع عن نفسك.",
    enemyCount: 20,
    spawnRate: 1500, // ms
    enemySpeed: 2,
    color: "#3b82f6", // Blue
    unlocked: true,
  },
  {
    id: 2,
    name: "حقل الكويكبات",
    description: "الأعداء أسرع وأكثر عدوانية.",
    enemyCount: 35,
    spawnRate: 1200,
    enemySpeed: 3,
    color: "#a855f7", // Purple
    unlocked: false,
  },
  {
    id: 3,
    name: "المنطقة الحمراء",
    description: "خطر شديد. البقاء للأقوى.",
    enemyCount: 50,
    spawnRate: 800,
    enemySpeed: 4.5,
    color: "#ef4444", // Red
    unlocked: false,
  },
  {
    id: 4,
    name: "قلب الظلام",
    description: "لا أحد يعود من هنا.",
    enemyCount: 100,
    spawnRate: 500,
    enemySpeed: 6,
    color: "#10b981", // Emerald
    unlocked: false,
  },
];

export function saveProgress(levelId) {
  const nextLevelId = levelId + 1;
  if (nextLevelId <= levels.length) {
    const nextLevel = levels.find((l) => l.id === nextLevelId);
    if (nextLevel) {
      nextLevel.unlocked = true;
      localStorage.setItem(
        "neon_vector_progress",
        JSON.stringify(levels.map((l) => ({ id: l.id, unlocked: l.unlocked })))
      );
    }
  }
}

export function loadProgress() {
  const saved = localStorage.getItem("neon_vector_progress");
  if (saved) {
    const parsed = JSON.parse(saved);
    parsed.forEach((p) => {
      const level = levels.find((l) => l.id === p.id);
      if (level) level.unlocked = p.unlocked;
    });
  }
}
