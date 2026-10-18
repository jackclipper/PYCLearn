import { useEffect, useMemo, useRef, useState } from "react";
import { Renderer, Stave, StaveNote, TickContext } from "vexflow";

// 课程、题库与日期统计见 lib/training.ts，便于独立维护及验证。
import {
  solfege,
  letters,
  trebleNotes,
  dayPlans,
  days,
  bassPlans,
  buildQuestions,
  buildEndlessQuestion,
  localDateKey,
  persistenceStats,
  type ClefMode,
  type Note,
  type EndlessQuestion,
} from "./lib/training";

function BrandMark() {
  return (
    <span className="brand-mark" aria-hidden="true">
      <i />
      <b>♪</b>
    </span>
  );
}

function MusicStaff({
  note,
  mode = "treble",
  variant = "training",
  clefOnly = false,
}: {
  note?: Note;
  mode?: ClefMode;
  variant?: "hero" | "training" | "lesson" | "clef";
  clefOnly?: boolean;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const noteKey = note ? `${note.letter.toLowerCase()}/${note.octave}` : "";

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    host.replaceChildren();

    const dimensions =
      variant === "clef"
        ? { width: 190, height: 120, x: 8, y: 12, staveWidth: 174 }
        : variant === "lesson"
          ? { width: 360, height: 220, x: 15, y: 36, staveWidth: 330 }
          : { width: 720, height: 280, x: 38, y: 70, staveWidth: 644 };
    const renderer = new Renderer(host, Renderer.Backends.SVG);
    renderer.resize(dimensions.width, dimensions.height);
    const context = renderer.getContext();
    context.setFillStyle("#142b4f");
    context.setStrokeStyle("#142b4f");

    const stave = new Stave(dimensions.x, dimensions.y, dimensions.staveWidth);
    stave.addClef(mode).setContext(context).draw();

    if (!clefOnly && noteKey) {
      const staveNote = new StaveNote({
        clef: mode,
        keys: [noteKey],
        duration: "q",
      });
      // TickContext positions relative to the stave's note-start offset.
      // These values place the note visually at the center of each exercise.
      const noteX = variant === "hero" ? 316 : variant === "lesson" ? 115 : 338;
      new TickContext().addTickable(staveNote).preFormat().setX(noteX);
      staveNote.setContext(context).setStave(stave).drawWithStyle();
    }

    // VexFlow writes fixed pixel dimensions directly onto the generated SVG.
    // The lesson cards are much narrower than the full quiz staff, so that
    // fixed width made the note sit outside the card's clipped area while the
    // clef remained visible. Keep the musical coordinate system in the
    // viewBox, but let the rendered SVG follow the width of its container.
    const svg = host.querySelector("svg");
    if (svg) {
      svg.style.width = "100%";
      svg.style.height = "auto";
      svg.style.display = "block";
    }
  }, [clefOnly, mode, noteKey, variant]);

  const label = clefOnly
    ? `${mode === "treble" ? "高音" : "低音"}谱号`
    : `${mode === "treble" ? "高音" : "低音"}谱号五线谱上的 ${note?.letter}${note?.octave}`;
  return (
    <div
      className={`music-staff music-staff-${variant}`}
      ref={hostRef}
      role="img"
      aria-label={label}
    />
  );
}

function Staff() {
  return <MusicStaff note={trebleNotes[2]} mode="treble" variant="hero" />;
}

function TrainingStaff({ note, mode }: { note: Note; mode: ClefMode }) {
  return <MusicStaff note={note} mode={mode} variant="training" />;
}

function LessonStaff({ note, mode }: { note: Note; mode: ClefMode }) {
  return <MusicStaff note={note} mode={mode} variant="lesson" />;
}

function ProgressRail({ completed }: { completed: number[] }) {
  const next = Math.min(completed.length + 1, dayPlans.length);
  return (
    <div
      className="progress-card"
      aria-label={`十二天训练进度：已完成 ${completed.length} 天`}
    >
      <div className="progress-card-head">
        <p>
          <strong>{completed.length}</strong> / {dayPlans.length} 天
        </p>
        <span>你的识谱旅程</span>
      </div>
      <div className="progress-rail">
        {days.map((_, index) => (
          <span
            className={
              completed.includes(index + 1)
                ? "done"
                : index + 1 === next
                  ? "active"
                  : ""
            }
            key={index}
          >
            {completed.includes(index + 1) ? "✓" : index + 1}
          </span>
        ))}
      </div>
    </div>
  );
}

function TrainingExperience({
  day,
  mode,
  onExit,
  onFinish,
  onNext,
}: {
  day: number;
  mode: ClefMode;
  onExit: () => void;
  onFinish: (score: number, total: number) => void;
  onNext: () => void;
}) {
  const plans = mode === "treble" ? dayPlans : bassPlans;
  const plan = plans[day - 1];
  const [stage, setStage] = useState<"lesson" | "quiz" | "result">(
    plan.quizOnly ? "quiz" : "lesson",
  );
  const [question, setQuestion] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const questions = useMemo(() => buildQuestions(plan), [plan]);
  const current = questions[question];
  const title = plan.title;
  const percentage = Math.round((score / questions.length) * 100);

  useEffect(() => {
    if (stage !== "quiz") return;
    const handleKey = (event: KeyboardEvent) => {
      const index = Number(event.key) - 1;
      if (!event.repeat && index >= 0 && index < 7 && !selected)
        choose(solfege[index]);
      if (event.key === "Enter" && selected) nextQuestion();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  });

  const choose = (value: string) => {
    if (selected) return;
    setSelected(value);
    if (value === current.solfege) setScore((valueNow) => valueNow + 1);
  };

  function nextQuestion() {
    if (!selected) return;
    if (question === questions.length - 1) {
      setStage("result");
      onFinish(score, questions.length);
      return;
    }
    setQuestion((value) => value + 1);
    setSelected(null);
  }

  const downloadCard = () => {
    const canvas = document.createElement("canvas");
    canvas.width = 1080;
    canvas.height = 1350;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#F6F0E4";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "#D8CDBC";
    ctx.lineWidth = 3;
    ctx.strokeRect(54, 54, 972, 1242);
    ctx.strokeRect(72, 72, 936, 1206);
    ctx.fillStyle = "#142B4F";
    ctx.textAlign = "center";
    ctx.font = "600 42px serif";
    ctx.fillText("北 洋 合 唱 团", 540, 170);
    ctx.fillStyle = "#E76F57";
    ctx.font = "500 30px sans-serif";
    ctx.fillText("十二天识谱计划 · 今日打卡", 540, 255);
    ctx.fillStyle = "#142B4F";
    ctx.font = "700 78px serif";
    ctx.fillText(
      mode === "treble" ? `第 ${day} 天完成` : `低音谱号第 ${day} 天完成`,
      540,
      430,
    );
    ctx.font = "700 190px Georgia";
    ctx.fillText(`${percentage}`, 540, 690);
    ctx.font = "400 36px sans-serif";
    ctx.fillText("正确率", 540, 755);
    ctx.strokeStyle = "#E76F57";
    ctx.beginPath();
    ctx.moveTo(240, 825);
    ctx.lineTo(840, 825);
    ctx.stroke();
    ctx.font = "600 38px serif";
    ctx.fillStyle = "#142B4F";
    ctx.fillText(title.slice(0, 18), 540, 930);
    ctx.font = "400 28px sans-serif";
    ctx.fillStyle = "#566171";
    ctx.fillText("每天五分钟，把五线谱读成一句话", 540, 1030);
    ctx.font = "400 24px sans-serif";
    ctx.fillText(new Date().toLocaleDateString("zh-CN"), 540, 1170);
    const link = document.createElement("a");
    link.download = `北洋合唱团-识谱打卡-${mode === "treble" ? `第${day}天` : `低音谱号第${day}天`}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  return (
    <main className="training-shell">
      <header className="training-header">
        <button className="brand brand-button" onClick={onExit} type="button">
          <BrandMark />
          <span>北洋合唱团</span>
        </button>
        <div className="training-day-label">
          <span>
            {mode === "treble"
              ? `DAY ${String(day).padStart(2, "0")}`
              : `BASS DAY ${String(day).padStart(2, "0")}`}
          </span>
          <strong>{title}</strong>
        </div>
        <button className="quiet-button" onClick={onExit} type="button">
          保存并退出
        </button>
      </header>

      {stage === "lesson" && (
        <section className="lesson-sheet">
          <p className="section-number">今日的 30 秒提示</p>
          <h1>{title}</h1>
          <div className="lesson-rule">
            <span>{plan.lessonLead}</span>
            <strong>{plan.lessonRule}</strong>
          </div>
          <p className="anchor-label">今日锚点 · 本轮一定会出现</p>
          <div className="anchor-notes">
            {plan.anchors.map((note) => (
              <article key={`${note.letter}${note.octave}`}>
                <LessonStaff note={note} mode={mode} />
                <strong>{note.solfege}</strong>
                <span>
                  {note.letter}
                  {note.octave}
                </span>
              </article>
            ))}
          </div>
          <p className="quiz-scope">
            <strong>本轮出题范围：</strong>
            {plan.pool
              .map((note) => `${note.solfege}（${note.letter}${note.octave}）`)
              .join("、")}
          </p>
          <button
            className="primary-button lesson-start"
            onClick={() => setStage("quiz")}
            type="button"
          >
            开始 {plan.questionCount} 题训练 <span>→</span>
          </button>
          <p className="keyboard-hint">
            电脑端可按数字键 1–7 作答，Enter 进入下一题
          </p>
        </section>
      )}

      {stage === "quiz" && (
        <section className="quiz-layout">
          <div className="quiz-progress">
            <span
              style={{ width: `${((question + 1) / questions.length) * 100}%` }}
            />
            <p>
              {question + 1} / {questions.length}
            </p>
          </div>
          <article className="quiz-paper">
            <p>
              {mode === "treble" ? "高音谱号" : "低音谱号"} ·{" "}
              {plan.quizOnly ? "随机小测 · " : ""}请选择固定唱名
            </p>
            <TrainingStaff
              key={`${current.letter}${current.octave}-${question}`}
              note={current}
              mode={mode}
            />
            <div className="quiz-answers">
              {solfege.map((value, index) => (
                <button
                  className={
                    selected === value
                      ? value === current.solfege
                        ? "correct"
                        : "wrong"
                      : selected && value === current.solfege
                        ? "correct reveal"
                        : ""
                  }
                  disabled={Boolean(selected)}
                  key={value}
                  onClick={() => choose(value)}
                  type="button"
                >
                  <small>{index + 1}</small>
                  {value}
                  <span>{letters[index]}</span>
                </button>
              ))}
            </div>
            <div
              className={`quiz-feedback ${selected ? "visible" : ""}`}
              aria-live="polite"
            >
              <p>
                {selected === current.solfege
                  ? "认对了，保持这个速度。"
                  : selected
                    ? `这个音是 ${current.solfege}（${current.letter}${current.octave}）。先记住它的位置。`
                    : "先看位置，再直接反应唱名。"}
              </p>
              <button disabled={!selected} onClick={nextQuestion} type="button">
                {question === questions.length - 1 ? "查看结果" : "下一题"} →
              </button>
            </div>
          </article>
        </section>
      )}

      {stage === "result" && (
        <section className="result-sheet">
          <div className="result-stamp">
            <strong>{percentage}</strong>
            <span>正确率</span>
          </div>
          <p className="section-number">今日训练完成</p>
          <h1>
            {percentage >= 80
              ? "已经读得很顺了。"
              : plan.quizOnly
                ? "再来一轮随机小测。"
                : "锚点正在变熟。"}
          </h1>
          <p>
            {percentage >= 80
              ? "保持每天五分钟，识谱会逐渐变成不需要思考的反应。"
              : plan.quizOnly
                ? "每次题目都会重新抽取，重复练习能更准确地找到薄弱位置。"
                : "不用着急，明天开始前再复习一次今天的锚点。"}
          </p>
          <div className="result-stats">
            <div>
              <strong>{questions.length}</strong>
              <span>完成题数</span>
            </div>
            <div>
              <strong>{score}</strong>
              <span>答对</span>
            </div>
            <div>
              <strong>{questions.length - score}</strong>
              <span>待巩固</span>
            </div>
          </div>
          <div className="result-actions">
            <button
              className="primary-button"
              onClick={downloadCard}
              type="button"
            >
              生成打卡成绩卡 <span>↓</span>
            </button>
            {day < plans.length && (
              <button
                className="text-button plain"
                onClick={onNext}
                type="button"
              >
                看看第 {day + 1} 天 <span>›</span>
              </button>
            )}
            <button className="quiet-button" onClick={onExit} type="button">
              返回首页
            </button>
          </div>
        </section>
      )}
    </main>
  );
}

function EndlessExperience({
  bestStreak,
  persistenceDates,
  onExit,
  onRecord,
  onPlayToday,
}: {
  bestStreak: number;
  persistenceDates: string[];
  onExit: () => void;
  onRecord: (streak: number) => void;
  onPlayToday: () => void;
}) {
  const [stage, setStage] = useState<"setup" | "quiz" | "result">("setup");
  const [includeBass, setIncludeBass] = useState(false);
  const [current, setCurrent] = useState<EndlessQuestion>(() =>
    buildEndlessQuestion(false),
  );
  const [streak, setStreak] = useState(0);
  const [wrongAnswer, setWrongAnswer] = useState<string | null>(null);
  const persistence = persistenceStats(persistenceDates);
  const [, todayMonth, todayDay] = localDateKey().split("-");
  const todayLabel = `${Number(todayMonth)}月${Number(todayDay)}日`;

  const start = () => {
    setCurrent(buildEndlessQuestion(includeBass));
    setStreak(0);
    setWrongAnswer(null);
    setStage("quiz");
  };

  const choose = (value: string) => {
    if (stage !== "quiz") return;
    onPlayToday();
    if (value !== current.note.solfege) {
      setWrongAnswer(value);
      onRecord(streak);
      setStage("result");
      return;
    }
    const nextStreak = streak + 1;
    setStreak(nextStreak);
    onRecord(nextStreak);
    setCurrent((previous) => buildEndlessQuestion(includeBass, previous));
  };

  useEffect(() => {
    if (stage !== "quiz") return;
    const handleKey = (event: KeyboardEvent) => {
      const index = Number(event.key) - 1;
      if (!event.repeat && index >= 0 && index < 7) choose(solfege[index]);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  });

  return (
    <main className="training-shell endless-shell">
      <header className="training-header">
        <button className="brand brand-button" onClick={onExit} type="button">
          <BrandMark />
          <span>北洋合唱团</span>
        </button>
        <div className="training-day-label">
          <span>ENDLESS MODE</span>
          <strong>无尽识谱挑战</strong>
        </div>
        <button
          className="quiet-button"
          onClick={() => {
            onRecord(streak);
            onExit();
          }}
          type="button"
        >
          保存并退出
        </button>
      </header>

      {stage === "setup" && (
        <section className="endless-setup">
          <p className="section-number">无尽模式</p>
          <h1>一次错误，挑战结束。</h1>
          <p className="endless-lead">
            高音谱号覆盖 G3–B5；开启低音谱号后，低音题覆盖
            E2–B3。完成当天的第一次作答后，即按实际日期记录坚持；同一天只记一次。
          </p>
          <div className="endless-records" aria-label="无尽模式历史纪录">
            <div>
              <span>最高连对</span>
              <strong>{bestStreak}</strong>
              <small>题</small>
            </div>
            <div>
              <span>最高坚持</span>
              <strong>{persistence.longest}</strong>
              <small>天</small>
            </div>
          </div>
          <label className="bass-toggle">
            <span>
              <strong>加入低音谱号</strong>
              <small>开启后，高音与低音谱号会随机混合出现</small>
            </span>
            <input
              checked={includeBass}
              onChange={(event) => setIncludeBass(event.target.checked)}
              type="checkbox"
            />
            <i aria-hidden="true" />
          </label>
          <button
            className="primary-button endless-start"
            onClick={start}
            type="button"
          >
            开始无尽挑战 <span>→</span>
          </button>
          <button className="text-button plain" onClick={onExit} type="button">
            返回十二天计划
          </button>
        </section>
      )}

      {stage === "quiz" && (
        <section className="quiz-layout endless-quiz-layout">
          <div className="endless-live-stats">
            <div>
              <span>当前连对</span>
              <strong>{streak}</strong>
            </div>
            <div>
              <span>当前坚持</span>
              <strong>{persistence.current} 天</strong>
            </div>
            <div className="day-progress">
              <span>日期记录</span>
              <strong>
                {persistence.todayRecorded
                  ? `${todayLabel} 已记录`
                  : "首次作答后记录"}
              </strong>
              <small>按自然日计算，同一天只记一次</small>
            </div>
          </div>
          <article className="quiz-paper endless-quiz-paper">
            <p>
              {current.mode === "treble" ? "高音谱号" : "低音谱号"} · 答错即结束
            </p>
            <TrainingStaff
              key={`${current.mode}-${current.note.letter}${current.note.octave}-${streak}`}
              note={current.note}
              mode={current.mode}
            />
            <div className="quiz-answers">
              {solfege.map((value, index) => (
                <button key={value} onClick={() => choose(value)} type="button">
                  <small>{index + 1}</small>
                  {value}
                  <span>{letters[index]}</span>
                </button>
              ))}
            </div>
            <p className="endless-keyboard-hint">
              电脑端可按数字键 1–7 快速作答
            </p>
          </article>
        </section>
      )}

      {stage === "result" && (
        <section className="result-sheet endless-result">
          <div className="result-stamp">
            <strong>{streak}</strong>
            <span>连续答对</span>
          </div>
          <p className="section-number">本轮挑战结束</p>
          <h1>
            {streak >= bestStreak && streak > 0
              ? "新的最高纪录。"
              : "差一点，再来一轮。"}
          </h1>
          <p>
            你选择了 <strong>{wrongAnswer}</strong>，正确答案是{" "}
            <strong>
              {current.note.solfege}（{current.note.letter}
              {current.note.octave}）
            </strong>
            。
          </p>
          <div className="result-stats endless-result-stats">
            <div>
              <strong>{streak}</strong>
              <span>本轮连对</span>
            </div>
            <div>
              <strong>{persistence.longest}</strong>
              <span>最高坚持天数</span>
            </div>
            <div>
              <strong>{Math.max(bestStreak, streak)}</strong>
              <span>最高连对</span>
            </div>
          </div>
          <div className="result-actions">
            <button className="primary-button" onClick={start} type="button">
              再挑战一次 <span>→</span>
            </button>
            <button className="quiet-button" onClick={onExit} type="button">
              返回首页
            </button>
          </div>
        </section>
      )}
    </main>
  );
}

export default function App() {
  const [answer, setAnswer] = useState<string | null>(null);
  const [completed, setCompleted] = useState<number[]>([]);
  const [bassCompleted, setBassCompleted] = useState<number[]>([]);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [experience, setExperience] = useState<{
    day: number;
    mode: ClefMode;
  } | null>(null);
  const [endlessOpen, setEndlessOpen] = useState(false);
  const [endlessBestStreak, setEndlessBestStreak] = useState(0);
  const [endlessDates, setEndlessDates] = useState<string[]>([]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const savedCompleted = JSON.parse(
          localStorage.getItem("beiyang-sightreading-completed") || "[]",
        ) as number[];
        const curriculumVersion = localStorage.getItem(
          "beiyang-sightreading-curriculum-version",
        );
        const savedScores = JSON.parse(
          localStorage.getItem("beiyang-sightreading-scores") || "{}",
        ) as Record<string, number>;
        const version = localStorage.getItem(
          "beiyang-sightreading-score-version",
        );
        const scoreValues =
          version === "2"
            ? savedScores
            : Object.fromEntries(
                Object.entries(savedScores).map(([key, value]) => [
                  key,
                  value * 10,
                ]),
              );
        const migratedCompleted =
          curriculumVersion === "3"
            ? savedCompleted.filter((day) => day >= 1 && day <= dayPlans.length)
            : savedCompleted.filter((day) => day >= 1 && day <= 6);
        const migratedBassCompleted =
          curriculumVersion === "3"
            ? (
                JSON.parse(
                  localStorage.getItem("beiyang-sightreading-bass-completed") ||
                    "[]",
                ) as number[]
              ).filter((day) => day >= 1 && day <= bassPlans.length)
            : [];
        const normalizedScores =
          curriculumVersion === "3"
            ? scoreValues
            : Object.fromEntries(
                Object.entries(scoreValues).filter(([key]) =>
                  /^treble-[1-6]$/.test(key),
                ),
              );
        setCompleted(migratedCompleted);
        setBassCompleted(migratedBassCompleted);
        setScores(normalizedScores);
        const savedEndlessBest = Math.max(
          0,
          Number(localStorage.getItem("beiyang-sightreading-endless-best")) ||
            0,
        );
        const savedEndlessDates = JSON.parse(
          localStorage.getItem("beiyang-sightreading-endless-dates") || "[]",
        ) as string[];
        setEndlessBestStreak(savedEndlessBest);
        setEndlessDates(persistenceStats(savedEndlessDates).dates);
        localStorage.setItem(
          "beiyang-sightreading-completed",
          JSON.stringify(migratedCompleted),
        );
        localStorage.setItem(
          "beiyang-sightreading-bass-completed",
          JSON.stringify(migratedBassCompleted),
        );
        localStorage.setItem(
          "beiyang-sightreading-scores",
          JSON.stringify(normalizedScores),
        );
        localStorage.setItem("beiyang-sightreading-score-version", "2");
        localStorage.setItem("beiyang-sightreading-curriculum-version", "3");
        localStorage.removeItem("beiyang-sightreading-endless-best-days");
      } catch {
        /* A fresh start is fine when local data is unavailable. */
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const currentDay = Math.min(completed.length + 1, dayPlans.length);
  const currentBassDay = Math.min(bassCompleted.length + 1, bassPlans.length);
  const begin = (day = currentDay, mode: ClefMode = "treble") =>
    setExperience({ day, mode });
  const finish = (
    day: number,
    mode: ClefMode,
    score: number,
    total: number,
  ) => {
    const percentage = Math.round((score / total) * 100);
    const nextCompleted =
      mode === "treble"
        ? Array.from(new Set([...completed, day])).sort((a, b) => a - b)
        : completed;
    const nextBassCompleted =
      mode === "bass"
        ? Array.from(new Set([...bassCompleted, day])).sort((a, b) => a - b)
        : bassCompleted;
    const nextScores = {
      ...scores,
      [`${mode}-${day}`]: Math.max(scores[`${mode}-${day}`] || 0, percentage),
    };
    setCompleted(nextCompleted);
    setBassCompleted(nextBassCompleted);
    setScores(nextScores);
    localStorage.setItem(
      "beiyang-sightreading-completed",
      JSON.stringify(nextCompleted),
    );
    localStorage.setItem(
      "beiyang-sightreading-bass-completed",
      JSON.stringify(nextBassCompleted),
    );
    localStorage.setItem(
      "beiyang-sightreading-scores",
      JSON.stringify(nextScores),
    );
    localStorage.setItem("beiyang-sightreading-score-version", "2");
  };

  const recordEndless = (streak: number) => {
    if (streak <= endlessBestStreak) return;
    setEndlessBestStreak(streak);
    localStorage.setItem("beiyang-sightreading-endless-best", String(streak));
  };

  const recordEndlessDay = () => {
    const today = localDateKey();
    setEndlessDates((dates) => {
      if (dates.includes(today)) return dates;
      const nextDates = persistenceStats([...dates, today]).dates;
      localStorage.setItem(
        "beiyang-sightreading-endless-dates",
        JSON.stringify(nextDates),
      );
      return nextDates;
    });
  };

  if (endlessOpen) {
    return (
      <EndlessExperience
        bestStreak={endlessBestStreak}
        persistenceDates={endlessDates}
        onExit={() => setEndlessOpen(false)}
        onRecord={recordEndless}
        onPlayToday={recordEndlessDay}
      />
    );
  }

  if (experience) {
    const planLength =
      experience.mode === "treble" ? dayPlans.length : bassPlans.length;
    return (
      <TrainingExperience
        key={`${experience.mode}-${experience.day}`}
        day={experience.day}
        mode={experience.mode}
        onExit={() => setExperience(null)}
        onFinish={(score, total) =>
          finish(experience.day, experience.mode, score, total)
        }
        onNext={() =>
          setExperience({
            day: Math.min(experience.day + 1, planLength),
            mode: experience.mode,
          })
        }
      />
    );
  }

  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="北洋合唱团识谱计划首页">
          <BrandMark />
          <span>北洋合唱团</span>
        </a>
        <nav aria-label="主导航">
          <a href="#plan">训练计划</a>
          <a href="#method">识谱方法</a>
          <a href="#progress">我的进度</a>
        </nav>
        <a className="profile-dot" href="#progress" aria-label="查看我的进度">
          {completed.length}
          <span>/{dayPlans.length}</span>
        </a>
      </header>

      <section className="hero" id="top">
        <div className="hero-copy">
          <p className="eyebrow">十二天识谱计划</p>
          <h1>
            十二天，
            <br />
            把五线谱读成一句话
          </h1>
          <p className="lede">每天 5 分钟 · 从认音到流畅读谱</p>
          <div className="hero-actions">
            <button
              className="primary-button"
              onClick={() => begin()}
              type="button"
            >
              {completed.length ? `继续第 ${currentDay} 天` : "开始第 1 天"}{" "}
              <span>→</span>
            </button>
            <button
              className="endless-home-button"
              onClick={() => setEndlessOpen(true)}
              type="button"
            >
              <span>∞</span>
              <strong>无尽模式</strong>
              <small>
                最高连对 {endlessBestStreak} · 最高坚持{" "}
                {persistenceStats(endlessDates).longest} 天
              </small>
            </button>
          </div>
          <a className="hero-plan-link" href="#plan">
            先看看训练计划 <span>›</span>
          </a>
          <ProgressRail completed={completed} />
        </div>

        <div className="workbook-wrap" id="try">
          <div className="binding-thread" aria-hidden="true">
            × × ×
          </div>
          <article className="workbook">
            <p className="workbook-kicker">
              <span /> 识谱练习 · DAY 1 <span />
            </p>
            <Staff />
            <div className="annotation">
              中央 C <small>（C4）</small>
            </div>
            <div className="answer-row" aria-label="请选择这个音的唱名">
              {[
                ["do", "C"],
                ["re", "D"],
                ["mi", "E"],
              ].map(([value, name]) => (
                <button
                  className={
                    answer === value
                      ? value === "do"
                        ? "correct"
                        : "wrong"
                      : ""
                  }
                  key={value}
                  onClick={() => setAnswer(value)}
                  type="button"
                >
                  {value}
                  <small>{name}</small>
                </button>
              ))}
            </div>
            <p
              className={`micro-feedback ${answer ? "show" : ""}`}
              aria-live="polite"
            >
              {answer === "do"
                ? "✓ 对了！中央 C 是高音谱表下加一线上的音。"
                : answer
                  ? "再看一眼：中央 C 在谱表下方的短线上。"
                  : "试着认一认这个音"}
            </p>
            <span className="day-stamp" aria-hidden="true">
              12<small>DAYS</small>
            </span>
          </article>
          <button
            className="today-ticket"
            onClick={() => begin()}
            type="button"
          >
            <span>今日 · 第 {currentDay} 天</span>
            <strong>{days[currentDay - 1]}</strong>
            <small>◷ 约 5 分钟</small>
          </button>
        </div>
      </section>

      <section className="method" id="method">
        <div>
          <p className="section-number">01 / 怎么练</p>
          <h2>五分钟，只做一个小闭环</h2>
        </div>
        <div className="method-steps">
          <article>
            <span>30″</span>
            <h3>先认锚点</h3>
            <p>只讲今天真正会用到的两三个音。</p>
          </article>
          <article>
            <span>3′</span>
            <h3>快速反应</h3>
            <p>看音符，直接选择固定唱名，不靠数线。</p>
          </article>
          <article>
            <span>1′</span>
            <h3>完成小测</h3>
            <p>即时纠错，把不熟的音再出现一次。</p>
          </article>
          <article>
            <span>30″</span>
            <h3>留下打卡</h3>
            <p>保存设备内进度，生成当天成绩卡。</p>
          </article>
        </div>
      </section>

      <section className="plan-section" id="plan">
        <div className="section-heading">
          <div>
            <p className="section-number">02 / 训练路线</p>
            <h2>六天学习，六天随机小测</h2>
          </div>
          <p>
            高音谱号是 12 天必修主线。低音谱号另设 3 天学习与 1
            天小测，不影响主线毕业。
          </p>
        </div>
        <div className="days-grid">
          {dayPlans.map((plan, index) => {
            const unlocked =
              index + 1 <= currentDay || completed.includes(index + 1);
            return (
              <button
                className={`day-card ${index + 1 === currentDay ? "today" : ""} ${completed.includes(index + 1) ? "completed" : ""}`}
                disabled={!unlocked}
                key={plan.title}
                onClick={() => begin(index + 1)}
                type="button"
              >
                <span>
                  DAY {String(index + 1).padStart(2, "0")}
                  {completed.includes(index + 1) ? " · 已完成" : ""}
                </span>
                <strong>{plan.title}</strong>
                <small>
                  {scores[`treble-${index + 1}`] !== undefined
                    ? `最好成绩 ${scores[`treble-${index + 1}`]}%`
                    : `${plan.summary} · 约 5 分钟`}
                </small>
              </button>
            );
          })}
        </div>
        <div className="bass-branch">
          <MusicStaff mode="bass" variant="clef" clefOnly />
          <div>
            <span>可选支线 · 4 天</span>
            <h3>低音谱号 · 三天学习，一天小测</h3>
            <p>
              前三天学习 C3–B3，第四天完成覆盖 E2–B3 的 20
              题小测；进度单独保存，不增加主线打卡压力。
            </p>
          </div>
          <button onClick={() => begin(currentBassDay, "bass")} type="button">
            {bassCompleted.length
              ? `继续低音谱号第 ${currentBassDay} 天`
              : "开启低音谱号支线"}
          </button>
          <div className="bass-days-grid">
            {bassPlans.map((plan, index) => {
              const bassDay = index + 1;
              const unlocked =
                bassDay <= currentBassDay || bassCompleted.includes(bassDay);
              return (
                <button
                  className={`bass-day-card ${bassDay === currentBassDay ? "today" : ""} ${bassCompleted.includes(bassDay) ? "completed" : ""}`}
                  disabled={!unlocked}
                  key={plan.title}
                  onClick={() => begin(bassDay, "bass")}
                  type="button"
                >
                  <span>
                    BASS {String(bassDay).padStart(2, "0")}
                    {bassCompleted.includes(bassDay) ? " · 已完成" : ""}
                  </span>
                  <strong>{plan.title}</strong>
                  <small>
                    {scores[`bass-${bassDay}`] !== undefined
                      ? `最好成绩 ${scores[`bass-${bassDay}`]}%`
                      : plan.summary}
                  </small>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <footer id="progress">
        <BrandMark />
        <p>让识谱成为排练前最轻松的五分钟。</p>
        <span>北洋合唱团 · 2026 新生团</span>
      </footer>
    </main>
  );
}
