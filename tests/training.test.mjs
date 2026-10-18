import assert from "node:assert/strict";
import test from "node:test";
import {
  trebleQuizNotes,
  bassQuizNotes,
  dayPlans,
  bassPlans,
  buildQuestions,
  buildEndlessQuestion,
  localDateKey,
  persistenceStats,
} from "../src/lib/training.ts";

const name = (note) => `${note.letter}${note.octave}`;

test("两个谱号具有各自完整且连续的自然音范围", () => {
  assert.deepEqual(trebleQuizNotes.map(name), [
    "G3",
    "A3",
    "B3",
    "C4",
    "D4",
    "E4",
    "F4",
    "G4",
    "A4",
    "B4",
    "C5",
    "D5",
    "E5",
    "F5",
    "G5",
    "A5",
    "B5",
  ]);
  assert.deepEqual(bassQuizNotes.map(name), [
    "E2",
    "F2",
    "G2",
    "A2",
    "B2",
    "C3",
    "D3",
    "E3",
    "F3",
    "G3",
    "A3",
    "B3",
  ]);
});

test("课程结构与题量符合十二天主线及四天低音支线", () => {
  assert.equal(dayPlans.length, 12);
  assert.ok(dayPlans.slice(0, 6).every((plan) => !plan.quizOnly));
  assert.ok(dayPlans.slice(6).every((plan) => plan.quizOnly));
  assert.deepEqual(
    dayPlans.slice(6).map((plan) => plan.questionCount),
    [20, 22, 24, 26, 28, 30],
  );
  assert.equal(bassPlans.length, 4);
  assert.ok(bassPlans.slice(0, 3).every((plan) => !plan.quizOnly));
  assert.equal(bassPlans[3].questionCount, 20);
  assert.equal(bassPlans[3].quizOnly, true);
});

test("每次抽题覆盖必考锚点或完整小测音域，且不会超出范围", () => {
  for (const plan of [...dayPlans, ...bassPlans]) {
    for (let round = 0; round < 20; round += 1) {
      const questions = buildQuestions(plan);
      assert.equal(questions.length, plan.questionCount);
      const names = new Set(questions.map(name));
      for (const note of plan.quizOnly ? plan.pool : plan.anchors)
        assert.ok(names.has(name(note)));
      for (const note of questions) assert.ok(plan.pool.includes(note));
    }
  }
});

test("无尽模式关低音时只出高音，混合时按各谱号音域且不重复相邻同题", () => {
  let previous;
  for (let index = 0; index < 200; index += 1) {
    const treble = buildEndlessQuestion(false);
    assert.equal(treble.mode, "treble");
    assert.ok(trebleQuizNotes.includes(treble.note));
    const question = buildEndlessQuestion(true, previous);
    const pool = question.mode === "treble" ? trebleQuizNotes : bassQuizNotes;
    assert.ok(pool.includes(question.note));
    if (previous)
      assert.notEqual(
        `${question.mode}:${name(question.note)}`,
        `${previous.mode}:${name(previous.note)}`,
      );
    previous = question;
  }
});

test("坚持天数按自然日期去重，跨月跨年连续，间断后重新累计", () => {
  const now = new Date(2026, 0, 2, 12);
  assert.equal(localDateKey(now), "2026-01-02");
  const stats = persistenceStats(
    ["2025-12-31", "2025-12-30", "2026-01-01", "2026-01-01", "invalid"],
    now,
  );
  assert.equal(stats.dates.length, 3);
  assert.equal(stats.longest, 3);
  assert.equal(stats.current, 3);
  assert.equal(stats.todayRecorded, false);
  assert.equal(
    persistenceStats([...stats.dates, "2026-01-02"], now).current,
    4,
  );
  assert.equal(
    persistenceStats(stats.dates, new Date(2026, 0, 3, 12)).current,
    0,
  );
  assert.equal(persistenceStats([], now).longest, 0);
});
