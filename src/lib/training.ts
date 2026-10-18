export const solfege = ["do", "re", "mi", "fa", "sol", "la", "si"];
export const letters = ["C", "D", "E", "F", "G", "A", "B"];

export type ClefMode = "treble" | "bass";
export type Note = {
  solfege: string;
  letter: string;
  octave: number;
  step: number;
};
export type EndlessQuestion = { note: Note; mode: ClefMode };
export type TrainingPlan = {
  title: string;
  summary: string;
  lessonLead: string;
  lessonRule: string;
  anchors: Note[];
  pool: Note[];
  questionCount: number;
  quizOnly?: boolean;
};

const noteFromStep = (step: number): Note => {
  const scaleIndex = ((step % 7) + 7) % 7;
  return {
    solfege: solfege[scaleIndex],
    letter: letters[scaleIndex],
    octave: 4 + Math.floor(step / 7),
    step,
  };
};

// Diatonic step 0 is C4. The learning cards keep their focused ranges, while
// comprehensive quizzes and endless mode use clef-specific choral ranges:
// treble G3–B5 and bass E2–B3.
export const trebleNotes: Note[] = Array.from({ length: 15 }, (_, index) =>
  noteFromStep(index - 2),
);
export const trebleQuizNotes: Note[] = Array.from({ length: 17 }, (_, index) =>
  noteFromStep(index - 3),
);
export const bassQuizNotes: Note[] = Array.from({ length: 12 }, (_, index) =>
  noteFromStep(index - 12),
);
const bassNotes: Note[] = Array.from({ length: 7 }, (_, index) =>
  noteFromStep(index - 7),
);

const trebleByStep = (step: number) => {
  const note = trebleNotes.find((candidate) => candidate.step === step);
  if (!note) throw new Error(`Unknown treble note step: ${step}`);
  return note;
};
const notesAt = (...steps: number[]) => steps.map(trebleByStep);

// Title, lesson anchors and quiz range intentionally live in one configuration.
// This prevents a lesson from displaying one set of notes while quizzing another
// without telling the learner. Every displayed anchor is also forced into that
// day's generated question set by buildQuestions().
export const dayPlans: TrainingPlan[] = [
  {
    title: "中央 C，旅程从一条加线开始",
    summary: "中央 C 与它上方的 re、mi",
    lessonLead: "先找到谱表下方的第一条加线。",
    lessonRule: "中央 C（do）在下加一线上，re 在它上方的间，mi 在第一线上。",
    anchors: notesAt(0, 1, 2),
    pool: notesAt(0, 1, 2),
    questionCount: 10,
  },
  {
    title: "向上三步：re、mi 与 fa",
    summary: "只练 D4、E4、F4",
    lessonLead: "从中央 C 向上走，线与间交替出现。",
    lessonRule: "今天的三张锚点就是本轮全部出题范围。",
    anchors: notesAt(1, 2, 3),
    pool: notesAt(1, 2, 3),
    questionCount: 10,
  },
  {
    title: "第一组锚点：sol、la、si",
    summary: "只练 G4、A4、B4",
    lessonLead: "把第二线 sol 当作新的起点。",
    lessonRule: "sol 在第二线，la 在第二间，si 在第三线。",
    anchors: notesAt(4, 5, 6),
    pool: notesAt(4, 5, 6),
    questionCount: 10,
  },
  {
    title: "越过高音 do：do、re、mi",
    summary: "只练 C5、D5、E5",
    lessonLead: "第三间的高音 do 是上方音区的新锚点。",
    lessonRule: "从 C5 继续向上，D5 在第四线，E5 在第四间。",
    anchors: notesAt(7, 8, 9),
    pool: notesAt(7, 8, 9),
    questionCount: 10,
  },
  {
    title: "线上的音：E–G–B–D–F",
    summary: "五条谱线上的五个音",
    lessonLead: "从下到上读五条线。",
    lessonRule: "E4–G4–B4–D5–F5；本轮不会出现间上的音。",
    anchors: notesAt(2, 4, 6, 8, 10),
    pool: notesAt(2, 4, 6, 8, 10),
    questionCount: 10,
  },
  {
    title: "间里的音：F–A–C–E",
    summary: "四个谱间里的四个音",
    lessonLead: "从下到上读四个间。",
    lessonRule: "F4–A4–C5–E5；本轮不会出现线上的音。",
    anchors: notesAt(3, 5, 7, 9),
    pool: notesAt(3, 5, 7, 9),
    questionCount: 10,
  },
  {
    title: "随机高音谱号小测 Ⅰ",
    summary: "G3–B5 · 20 题全音域小测",
    lessonLead: "",
    lessonRule: "",
    anchors: [],
    pool: trebleQuizNotes,
    questionCount: 20,
    quizOnly: true,
  },
  {
    title: "随机高音谱号小测 Ⅱ",
    summary: "G3–B5 · 22 题全音域小测",
    lessonLead: "",
    lessonRule: "",
    anchors: [],
    pool: trebleQuizNotes,
    questionCount: 22,
    quizOnly: true,
  },
  {
    title: "随机高音谱号小测 Ⅲ",
    summary: "G3–B5 · 24 题加线音混合",
    lessonLead: "",
    lessonRule: "",
    anchors: [],
    pool: trebleQuizNotes,
    questionCount: 24,
    quizOnly: true,
  },
  {
    title: "随机高音谱号小测 Ⅳ",
    summary: "G3–B5 · 26 题全音域混合",
    lessonLead: "",
    lessonRule: "",
    anchors: [],
    pool: trebleQuizNotes,
    questionCount: 26,
    quizOnly: true,
  },
  {
    title: "随机高音谱号小测 Ⅴ",
    summary: "G3–B5 · 28 题综合巩固",
    lessonLead: "",
    lessonRule: "",
    anchors: [],
    pool: trebleQuizNotes,
    questionCount: 28,
    quizOnly: true,
  },
  {
    title: "随机高音谱号毕业小测",
    summary: "G3–B5 · 30 题毕业挑战",
    lessonLead: "",
    lessonRule: "",
    anchors: [],
    pool: trebleQuizNotes,
    questionCount: 30,
    quizOnly: true,
  },
];

export const days = dayPlans.map((plan) => plan.title);

export const bassPlans: TrainingPlan[] = [
  {
    title: "低音谱号从 C 开始",
    summary: "学习 C3、D3、E3",
    lessonLead: "先找到低音谱表第二间的 C3。",
    lessonRule: "C3 在第二间，D3 在第三线，E3 在第三间。",
    anchors: bassNotes.slice(0, 3),
    pool: bassNotes.slice(0, 3),
    questionCount: 10,
  },
  {
    title: "找到低音谱号的 F",
    summary: "学习 F3、G3、A3",
    lessonLead: "低音谱号的两个点围着第四线 F3。",
    lessonRule: "从 F3 向上依次是第四间 G3、第五线 A3。",
    anchors: bassNotes.slice(3, 6),
    pool: bassNotes.slice(3, 6),
    questionCount: 10,
  },
  {
    title: "补上 B，串起七个音",
    summary: "学习 B3，复习 C3–B3",
    lessonLead: "B3 在谱表上方第一间，把七个音完整串起来。",
    lessonRule: "先用 C3、F3、B3 定位，再判断目标音与锚点的距离。",
    anchors: [bassNotes[0], bassNotes[3], bassNotes[6]],
    pool: bassNotes,
    questionCount: 12,
  },
  {
    title: "低音谱号综合小测",
    summary: "E2–B3 · 20 题全音域小测",
    lessonLead: "",
    lessonRule: "",
    anchors: [],
    pool: bassQuizNotes,
    questionCount: 20,
    quizOnly: true,
  },
];

export function buildQuestions(plan: TrainingPlan) {
  // Quiz-only days begin with the whole pool, so every clef-specific quiz contains
  // every pitch at least once instead of merely making it statistically possible.
  const questions = [...(plan.quizOnly ? plan.pool : plan.anchors)];
  while (questions.length < plan.questionCount) {
    const previous = questions.at(-1);
    const candidates =
      plan.pool.length > 1
        ? plan.pool.filter((note) => note !== previous)
        : plan.pool;
    questions.push(candidates[Math.floor(Math.random() * candidates.length)]);
  }

  for (let index = questions.length - 1; index > 0; index -= 1) {
    const target = Math.floor(Math.random() * (index + 1));
    [questions[index], questions[target]] = [
      questions[target],
      questions[index],
    ];
  }
  return questions;
}

export function buildEndlessQuestion(
  includeBass: boolean,
  previous?: EndlessQuestion,
): EndlessQuestion {
  const pool: EndlessQuestion[] = [
    ...trebleQuizNotes.map((note) => ({ note, mode: "treble" as const })),
    ...(includeBass
      ? bassQuizNotes.map((note) => ({ note, mode: "bass" as const }))
      : []),
  ];
  const candidates =
    previous && pool.length > 1
      ? pool.filter(
          ({ note, mode }) =>
            mode !== previous.mode ||
            note.letter !== previous.note.letter ||
            note.octave !== previous.note.octave,
        )
      : pool;
  return candidates[Math.floor(Math.random() * candidates.length)];
}

export function localDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function persistenceStats(rawDates: string[], now = new Date()) {
  const dates = Array.from(
    new Set(rawDates.filter((date) => /^\d{4}-\d{2}-\d{2}$/.test(date))),
  ).sort();
  const dayNumbers = dates.map((date) => {
    const [year, month, day] = date.split("-").map(Number);
    return Math.floor(Date.UTC(year, month - 1, day) / 86_400_000);
  });
  let longest = 0;
  let run = 0;
  let previous: number | undefined;
  for (const dayNumber of dayNumbers) {
    run = previous !== undefined && dayNumber === previous + 1 ? run + 1 : 1;
    longest = Math.max(longest, run);
    previous = dayNumber;
  }

  const today = localDateKey(now);
  const [year, month, day] = today.split("-").map(Number);
  const todayNumber = Math.floor(Date.UTC(year, month - 1, day) / 86_400_000);
  const last = dayNumbers.at(-1);
  const current = last !== undefined && todayNumber - last <= 1 ? run : 0;
  return { dates, longest, current, todayRecorded: dates.includes(today) };
}
