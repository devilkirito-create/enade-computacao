import { useEffect, useMemo, useState } from "react";
import { official } from "./data/official.js";
import { originals } from "./data/original.js";
import { modules } from "./data/theory.js";
import { essays } from "./data/discursive.js";
import { formulas } from "./data/formulas.js";
import { plan } from "./data/plan.js";
import { topics, topicName, examWeights, objectivePoints } from "./data/topics.js";
import { loadState, saveState, scheduleReview, todayISO } from "./progress.js";

const NAV = [
  ["home", "Início"],
  ["trilhas", "Trilhas"],
  ["banco", "Questões"],
  ["simulado", "Simulados"],
  ["caderno", "Cadernos"],
  ["discursivas", "Discursivas"],
  ["formulas", "Fórmulas"],
  ["revisao", "Revisão"],
  ["plano", "Plano"],
  ["gabarito", "Gabaritos"],
];

const bank = [
  ...official.map((item) => ({ ...item, origin: "oficial" })),
  ...originals.map((item) => ({ ...item, origin: "inedita", year: "Inédita" })),
];

const LETTERS = ["A", "B", "C", "D", "E"];

function pad(n) {
  return String(n).padStart(2, "0");
}
function pageSrc(year, page) {
  return `/provas/${year}/p${pad(page)}.jpg`;
}
function isRight(q, choice) {
  return Boolean(q.annulled) || choice === q.answer;
}
function shuffle(list) {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
function formatClock(ms) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;
  return [h, m, r].map((n) => String(n).padStart(2, "0")).join(":");
}

function gradeSet(questions, choices) {
  const officialOnes = questions.filter((item) => item.origin !== "inedita");
  const fresh = questions.filter((item) => item.origin === "inedita");
  const blocks = { FG: emptyBlock(), CE: emptyBlock() };
  for (const item of officialOnes) {
    const ok = isRight(item, choices[item.id]);
    const pts = objectivePoints(item, ok);
    const bag = blocks[item.section];
    bag.total += 1;
    bag.right += ok ? 1 : 0;
    bag.earned += pts.earned;
    bag.max += pts.max;
  }
  const freshRight = fresh.filter((item) => choices[item.id] === item.answer).length;
  return { blocks, freshRight, freshTotal: fresh.length, official: officialOnes.length > 0 };
}
function emptyBlock() {
  return { total: 0, right: 0, earned: 0, max: 0 };
}

export default function App() {
  const [state, setState] = useState(loadState);
  const [view, setView] = useState({ name: "home" });
  const [zoom, setZoom] = useState(null);
  const [now, setNow] = useState(Date.now());

  useEffect(() => saveState(state), [state]);
  useEffect(() => {
    document.documentElement.dataset.theme = state.theme;
  }, [state.theme]);
  useEffect(() => {
    if (!state.sim || state.sim.finished) return undefined;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [state.sim]);

  const stats = useMemo(() => {
    const answered = official.filter((item) => state.answers[item.id]);
    const right = answered.filter((item) => state.answers[item.id].correct).length;
    const due = Object.entries(state.reviews).filter(([, rev]) => rev.due <= todayISO()).length;
    return {
      answered: answered.length,
      right,
      due,
      read: modules.filter((item) => state.reads[item.id]).length,
    };
  }, [state]);

  function patch(partial) {
    setState((current) => ({ ...current, ...partial }));
  }
  function remember(question, choice) {
    const correct = isRight(question, choice);
    setState((current) => {
      const reviews = { ...current.reviews };
      if (!correct) reviews[question.id] = scheduleReview(reviews[question.id], "wrong");
      return {
        ...current,
        answers: {
          ...current.answers,
          [question.id]: { choice, correct, at: Date.now() },
        },
        reviews,
      };
    });
  }
  function openQuestion(id, list) {
    setView({ name: "questao", id, list: list || bank.map((item) => item.id) });
  }
  function startSim(spec) {
    const questionIds = spec.build().map((item) => item.id);
    patch({
      sim: {
        ...spec.meta,
        questionIds,
        index: 0,
        choices: {},
        startedAt: Date.now(),
        finished: false,
      },
    });
    setView({ name: "simulado-run" });
  }

  const simQuestions = state.sim
    ? state.sim.questionIds.map((id) => bank.find((item) => item.id === id)).filter(Boolean)
    : [];

  return (
    <div className="app">
      <header className="top">
        <div className="brand">
          <b>ENADE Computação</b>
          <span>estúdio de estudo</span>
        </div>
        <nav className="nav">
          {NAV.map(([id, label]) => (
            <button key={id} className={view.name === id || (id === "simulado" && view.name.startsWith("simulado")) ? "active" : ""} onClick={() => setView({ name: id })}>
              {label}
            </button>
          ))}
        </nav>
        <button className="ghost" onClick={() => patch({ theme: state.theme === "dark" ? "light" : "dark" })}>
          {state.theme === "dark" ? "Claro" : "Escuro"}
        </button>
      </header>
      <main className="wrap">
        {view.name === "home" && (
          <Home stats={stats} state={state} onOpen={setView} continueSim={state.sim && !state.sim.finished} />
        )}
        {view.name === "trilhas" && <Trails reads={state.reads} onOpen={(id) => setView({ name: "trilha", id })} />}
        {view.name === "trilha" && (
          <Trail
            module={modules.find((item) => item.id === view.id)}
            read={Boolean(state.reads[view.id])}
            onToggle={() => patch({ reads: { ...state.reads, [view.id]: !state.reads[view.id] } })}
            onBack={() => setView({ name: "trilhas" })}
            onPractice={(topic) => setView({ name: "banco", topic })}
          />
        )}
        {view.name === "banco" && (
          <Bank
            initialTopic={view.topic || "todas"}
            mode={state.bankMode}
            answers={state.answers}
            onMode={(bankMode) => patch({ bankMode })}
            onOpen={(id, list) => openQuestion(id, list)}
          />
        )}
        {view.name === "questao" && (
          <QuestionView
            ids={view.list}
            id={view.id}
            mode={state.bankMode}
            answers={state.answers}
            reviews={state.reviews}
            onAnswer={remember}
            onGrade={(question, grade) => patch({ reviews: { ...state.reviews, [question.id]: scheduleReview(state.reviews[question.id], grade) } })}
            onMove={(id) => setView({ name: "questao", id, list: view.list })}
            onZoom={setZoom}
          />
        )}
        {view.name === "simulado" && <SimMenu onStart={startSim} pending={state.sim && !state.sim.finished} onResume={() => setView({ name: "simulado-run" })} />}
        {view.name === "simulado-run" && state.sim && (
          <SimRun
            sim={state.sim}
            questions={simQuestions}
            now={now}
            onChoose={(id, choice) => patch({ sim: { ...state.sim, choices: { ...state.sim.choices, [id]: choice } } })}
            onIndex={(index) => patch({ sim: { ...state.sim, index } })}
            onFinish={() => {
              const choices = state.sim.choices;
              simQuestions.forEach((item) => {
                if (choices[item.id]) remember(item, choices[item.id]);
              });
              patch({ sim: { ...state.sim, finished: true } });
              setView({ name: "simulado-fim" });
            }}
            onZoom={setZoom}
          />
        )}
        {view.name === "simulado-fim" && state.sim && (
          <SimResult sim={state.sim} questions={simQuestions} onReview={(id) => {
              patch({ bankMode: "treino" });
              openQuestion(id, state.sim.questionIds);
            }} />
        )}
        {view.name === "caderno" && <Caderno onZoom={setZoom} />}
        {view.name === "discursivas" && (
          <Essays
            texts={state.essays}
            onChange={(id, text) => patch({ essays: { ...state.essays, [id]: text } })}
            onZoom={setZoom}
          />
        )}
        {view.name === "formulas" && <Formulas />}
        {view.name === "revisao" && (
          <Review
            reviews={state.reviews}
            answers={state.answers}
            onOpen={(id) => openQuestion(id, Object.keys(state.reviews))}
            onGrade={(id, grade) => patch({ reviews: { ...state.reviews, [id]: scheduleReview(state.reviews[id], grade) } })}
          />
        )}
        {view.name === "plano" && (
          <Plan done={state.plan} onToggle={(id) => patch({ plan: { ...state.plan, [id]: !state.plan[id] } })} />
        )}
        {view.name === "gabarito" && <Keys />}
      </main>
      {zoom && (
        <div className="lightbox" onClick={() => setZoom(null)}>
          <img src={zoom} alt="Página ampliada da prova" />
        </div>
      )}
    </div>
  );
}

function Home({ stats, state, onOpen, continueSim }) {
  const pct = stats.answered ? Math.round((stats.right / stats.answered) * 100) : 0;
  return (
    <>
      <section className="hero">
        <div>
          <div className="kicker">Engenharia de Computação</div>
          <h1>Uma prova só, estudada por inteiro.</h1>
          <p className="lede">
            Cadernos de 2017, 2019 e 2023 na página original, com gabarito do Inep, explicação e questão inédita no mesmo formato. O progresso fica neste navegador.
          </p>
        </div>
        <div className="panel">
          <p className="kicker">Nota</p>
          <p>Formação geral pesa 25%. Específico pesa 75%. Objetiva não é a prova toda: em 2017 e 2019 as objetivas somam no máximo 78,75 pontos. O resto é discursiva.</p>
          <div className="row" style={{ marginTop: 12 }}>
            <button className="primary" onClick={() => onOpen({ name: "simulado" })}>Fazer simulado</button>
            <button className="ghost" onClick={() => onOpen({ name: "trilhas" })}>Abrir trilhas</button>
          </div>
        </div>
      </section>
      <section className="grid stats">
        <article className="card stat"><b>{stats.answered}/{official.length}</b><span>oficiais respondidas</span></article>
        <article className="card stat"><b>{pct}%</b><span>acerto no que você já fez</span></article>
        <article className="card stat"><b>{stats.read}/{modules.length}</b><span>trilhas lidas</span></article>
        <article className="card stat"><b>{stats.due}</b><span>revisões para hoje</span></article>
      </section>
      {continueSim && (
        <div className="panel" style={{ marginBottom: 14 }}>
          Simulado em andamento: {state.sim.title}. <button className="primary" onClick={() => onOpen({ name: "simulado-run" })}>Continuar</button>
        </div>
      )}
      <section className="grid cards">
        {modules.slice(0, 4).map((item) => (
          <article key={item.id} className="card">
            <button className="linkish" onClick={() => onOpen({ name: "trilha", id: item.id })}>
              <p className="kicker">{topicName(item.topic)}</p>
              <h3>{item.title}</h3>
              <p className="muted">{item.minutes} min · {state.reads[item.id] ? "lida" : "não lida"}</p>
            </button>
          </article>
        ))}
      </section>
    </>
  );
}

function Trails({ reads, onOpen }) {
  return (
    <>
      <h1>Trilhas</h1>
      <p className="lede">O conteúdo que a prova pede, na densidade de quem vai resolver questão, não na de um livro de 600 páginas.</p>
      <div className="grid cards" style={{ marginTop: 16 }}>
        {modules.map((item) => (
          <article key={item.id} className="card">
            <button className="linkish" onClick={() => onOpen(item.id)}>
              <p className="kicker">{topicName(item.topic)}</p>
              <h3>{item.title}</h3>
              <p className="muted">{item.lead}</p>
              <p style={{ marginTop: 8 }}>{reads[item.id] ? "Lida" : "Marcar depois de ler"} · {item.minutes} min</p>
            </button>
          </article>
        ))}
      </div>
    </>
  );
}

function Trail({ module, read, onToggle, onBack, onPractice }) {
  if (!module) return null;
  return (
    <article className="prose">
      <button className="ghost" onClick={onBack}>Voltar</button>
      <p className="kicker" style={{ marginTop: 12 }}>{topicName(module.topic)} · {module.minutes} min</p>
      <h1>{module.title}</h1>
      <p className="lede">{module.lead}</p>
      {module.blocks.map((block) => (
        <section key={block.h}>
          <h3>{block.h}</h3>
          {block.p && <p>{block.p}</p>}
          {block.items && <ul>{block.items.map((item) => <li key={item}>{item}</li>)}</ul>}
        </section>
      ))}
      <div className="row" style={{ marginTop: 18 }}>
        <button className="primary" onClick={onToggle}>{read ? "Lida" : "Marcar como lida"}</button>
        <button className="ghost" onClick={() => onPractice(module.topic)}>Questões deste tema</button>
      </div>
    </article>
  );
}

function Bank({ initialTopic, mode, answers, onMode, onOpen }) {
  const [topic, setTopic] = useState(initialTopic);
  const [year, setYear] = useState("todas");
  const [section, setSection] = useState("todas");
  const [status, setStatus] = useState("todas");
  const [text, setText] = useState("");
  const filtered = bank.filter((item) => {
    if (topic !== "todas" && item.topic !== topic) return false;
    if (year !== "todas" && String(item.year) !== String(year)) return false;
    if (section !== "todas" && item.section !== section) return false;
    const rec = answers[item.id];
    if (status === "feitas" && !rec) return false;
    if (status === "abertas" && rec) return false;
    if (status === "erros" && !(rec && !rec.correct)) return false;
    if (text && !`${item.title} ${item.stem || ""} ${item.explanation}`.toLowerCase().includes(text.toLowerCase())) return false;
    return true;
  });
  return (
    <div className="split">
      <aside className="panel filters">
        <h2>Banco</h2>
        <label className="field">Busca<input value={text} onChange={(event) => setText(event.target.value)} placeholder="pid, fila, Nyquist…" /></label>
        <label className="field">Tema
          <select value={topic} onChange={(event) => setTopic(event.target.value)}>
            <option value="todas">Todos</option>
            {topics.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
        </label>
        <label className="field">Ano
          <select value={year} onChange={(event) => setYear(event.target.value)}>
            <option value="todas">Todos</option>
            <option value="2017">2017</option>
            <option value="2019">2019</option>
            <option value="2023">2023</option>
            <option value="Inédita">Inéditas</option>
          </select>
        </label>
        <label className="field">Bloco
          <select value={section} onChange={(event) => setSection(event.target.value)}>
            <option value="todas">Todos</option>
            <option value="FG">Formação geral</option>
            <option value="CE">Específico</option>
          </select>
        </label>
        <label className="field">Estado
          <select value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="todas">Todas</option>
            <option value="abertas">Não feitas</option>
            <option value="feitas">Respondidas</option>
            <option value="erros">Errei</option>
          </select>
        </label>
        <div className="row">
          <button className={mode === "treino" ? "primary" : "ghost"} onClick={() => onMode("treino")}>Treino</button>
          <button className={mode === "prova" ? "primary" : "ghost"} onClick={() => onMode("prova")}>Sem gabarito</button>
        </div>
        <p className="muted" style={{ marginTop: 8 }}>{filtered.length} questões</p>
      </aside>
      <div className="q-list">
        {filtered.map((item) => {
          const rec = answers[item.id];
          return (
            <button key={item.id} className="card q-item linkish" onClick={() => onOpen(item.id, filtered.map((q) => q.id))}>
              <span>
                <strong>{item.origin === "oficial" ? `${item.year} · ${item.section} ${item.num}` : "Inédita"}</strong>
                <span className="muted"> · {item.title}</span>
              </span>
              <span className={rec ? (rec.correct ? "pill ok" : "pill no") : "pill"}>{rec ? (rec.correct ? "certo" : "erro") : topicName(item.topic)}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function QuestionView({ ids, id, mode, answers, reviews, onAnswer, onGrade, onMove, onZoom }) {
  const index = Math.max(0, ids.indexOf(id));
  const question = bank.find((item) => item.id === id);
  const [pick, setPick] = useState(answers[id]?.choice || "");
  useEffect(() => setPick(answers[id]?.choice || ""), [id, answers]);
  if (!question) return null;
  const revealed = mode === "treino" && Boolean(pick);
  const officialMode = question.origin === "oficial";
  return (
    <article>
      <p className="kicker">{officialMode ? `Oficial ${question.year}` : "Inédita"} · {question.section} · {topicName(question.topic)}</p>
      <h1>{officialMode ? `Questão ${question.num}` : question.title}</h1>
      {question.annulled && <p className="callout">O Inep anulou esta questão. Qualquer marcação conta como acerto.</p>}
      {officialMode ? (
        <Pages year={question.year} pages={question.pages} onZoom={onZoom} />
      ) : (
        <OriginalBody question={question} pick={pick} revealed={revealed} onPick={(letter) => { setPick(letter); if (mode === "treino") onAnswer(question, letter); }} />
      )}
      {officialMode && (
        <div className="row" style={{ marginTop: 12 }}>
          {LETTERS.map((letter) => {
            let klass = pick === letter ? "primary" : "ghost";
            if (revealed && (letter === question.answer || (question.annulled && letter === pick))) klass = "choice right";
            else if (revealed && letter === pick) klass = "choice wrong";
            return (
              <button key={letter} className={klass} onClick={() => { setPick(letter); if (mode === "treino") onAnswer(question, letter); }}>
                {letter}
              </button>
            );
          })}
        </div>
      )}
      <div className="pager">
        <button className="ghost" disabled={index === 0} onClick={() => onMove(ids[index - 1])}>Anterior</button>
        <button className="primary" disabled={!pick} onClick={() => onAnswer(question, pick)}>
          {answers[id]?.choice === pick ? "Resposta salva" : "Salvar resposta"}
        </button>
        <button className="ghost" disabled={index === ids.length - 1} onClick={() => onMove(ids[index + 1])}>Próxima</button>
      </div>
      {revealed && <Explanation question={question} pick={pick} />}
      {revealed && (
        <div className="row" style={{ marginTop: 10 }}>
          <span className="muted">Quando revisar?</span>
          {[["wrong", "Errei"], ["hard", "Difícil"], ["good", "Bom"], ["easy", "Fácil"]].map(([grade, label]) => (
            <button key={grade} className="ghost" onClick={() => onGrade(question, grade)}>{label}</button>
          ))}
          {reviews[question.id] && <span className="pill">volta em {reviews[question.id].due}</span>}
        </div>
      )}
      {mode === "prova" && <p className="muted" style={{ marginTop: 8 }}>Modo sem gabarito: a explicação fica guardada para a revisão.</p>}
    </article>
  );
}

function letterClass(letter, pick, question, revealed) {
  if (!revealed) return pick === letter ? "choice selected" : "choice";
  if (letter === question.answer || (question.annulled && letter === pick)) return "choice right";
  if (letter === pick) return "choice wrong";
  return "choice";
}

function Explanation({ question, pick }) {
  const ok = isRight(question, pick);
  return (
    <div className="explain" style={{ marginTop: 14 }}>
      <strong>{question.annulled ? "Anulada." : ok ? "Certa." : `A oficial é ${question.answer}.`}</strong>
      <p>{question.explanation}</p>
    </div>
  );
}

function OriginalBody({ question, pick, revealed, onPick }) {
  return (
    <div>
      <p style={{ whiteSpace: "pre-wrap", margin: "12px 0" }}>{question.stem}</p>
      <div className="grid">
        {question.options.map((option, index) => {
          const letter = LETTERS[index];
          return (
            <button key={letter} className={letterClass(letter, pick, question, revealed)} onClick={() => onPick(letter)}>
              <small>{letter}</small>{option}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Pages({ year, pages, onZoom }) {
  return (
    <div className="grid" style={{ marginTop: 12 }}>
      {pages.map((page) => (
        <img key={page} className="page-shot" src={pageSrc(year, page)} alt={`Prova ${year}, página ${page}`} onClick={() => onZoom(pageSrc(year, page))} />
      ))}
      <p className="muted">Clique na página para ampliar. Se a folha tiver duas questões, responda só a do título.</p>
    </div>
  );
}

function SimMenu({ onStart, pending, onResume }) {
  const specs = [
    specOf("Prova 2017", "35 objetivas · 4 horas", 240, () => official.filter((item) => item.year === 2017)),
    specOf("Prova 2019", "35 objetivas · questão 1 anulada · 4 horas", 240, () => official.filter((item) => item.year === 2019)),
    specOf("Prova 2023", "38 objetivas · 4 horas", 240, () => official.filter((item) => item.year === 2023)),
    specOf("Mini formação geral", "10 questões · 40 min", 40, () => shuffle(bank.filter((item) => item.section === "FG")).slice(0, 10)),
    specOf("Mini específico", "15 questões · 70 min", 70, () => shuffle(bank.filter((item) => item.section === "CE")).slice(0, 15)),
    specOf("Simulado inédito", "as 36 questões novas · 90 min", 90, () => originals.map((item) => ({ ...item, origin: "inedita", year: "Inédita" }))),
    specOf("Misto", "10 oficiais + 10 inéditas · 80 min", 80, () => [
      ...shuffle(official).slice(0, 10).map((item) => ({ ...item, origin: "oficial" })),
      ...shuffle(originals).slice(0, 10).map((item) => ({ ...item, origin: "inedita", year: "Inédita" })),
    ]),
  ];
  return (
    <>
      <h1>Simulados</h1>
      <p className="lede">No modo prova o gabarito só aparece no fim. As discursivas ficam na seção própria: o Inep não as mistura na nota objetiva.</p>
      {pending && <p style={{ marginTop: 12 }}><button className="primary" onClick={onResume}>Retomar o simulado aberto</button></p>}
      <div className="grid cards" style={{ marginTop: 16 }}>
        {specs.map((item) => (
          <article key={item.meta.title} className="card">
            <h3>{item.meta.title}</h3>
            <p className="muted">{item.meta.subtitle}</p>
            <button className="primary" style={{ marginTop: 12 }} onClick={() => onStart(item)}>Começar</button>
          </article>
        ))}
      </div>
    </>
  );
}
function specOf(title, subtitle, minutes, build) {
  return { meta: { title, subtitle, minutes }, build };
}

function SimRun({ sim, questions, now, onChoose, onIndex, onFinish, onZoom }) {
  const question = questions[sim.index];
  const left = sim.startedAt + sim.minutes * 60 * 1000 - now;
  if (!question) return null;
  const picked = sim.choices[question.id] || "";
  return (
    <article>
      <div className="row" style={{ justifyContent: "space-between" }}>
        <p className="kicker">{sim.title}</p>
        <span className="timer">{formatClock(left)}</span>
      </div>
      <h1>{question.origin === "oficial" ? `Questão ${question.num}` : question.title}</h1>
      <p className="muted">{sim.index + 1} de {questions.length} · {question.section}</p>
      {question.origin === "oficial" ? <Pages year={question.year} pages={question.pages} onZoom={onZoom} /> : <OriginalBody question={question} pick={picked} revealed={false} onPick={(letter) => onChoose(question.id, letter)} />}
      {question.origin === "oficial" && (
        <div className="row" style={{ marginTop: 12 }}>
          {LETTERS.map((letter) => (
            <button key={letter} className={picked === letter ? "primary" : "ghost"} onClick={() => onChoose(question.id, letter)}>{letter}</button>
          ))}
        </div>
      )}
      <div className="dots" style={{ marginTop: 16 }}>
        {questions.map((item, index) => (
          <button key={item.id} className={index === sim.index ? "on" : ""} onClick={() => onIndex(index)}>
            {sim.choices[item.id] ? "•" : index + 1}
          </button>
        ))}
      </div>
      <div className="pager">
        <button className="ghost" disabled={sim.index === 0} onClick={() => onIndex(sim.index - 1)}>Anterior</button>
        {sim.index < questions.length - 1 ? (
          <button className="primary" onClick={() => onIndex(sim.index + 1)}>Próxima</button>
        ) : (
          <button className="primary" onClick={onFinish}>Entregar</button>
        )}
      </div>
    </article>
  );
}

function SimResult({ sim, questions, onReview }) {
  const report = gradeSet(questions, sim.choices);
  const weights = questions.find((item) => item.origin === "oficial");
  return (
    <article>
      <p className="kicker">Resultado</p>
      <h1>{sim.title}</h1>
      {report.official && (
        <>
          <div className="grid stats">
            <article className="card stat"><b>{report.blocks.FG.right}/{report.blocks.FG.total || 0}</b><span>formação geral</span></article>
            <article className="card stat"><b>{report.blocks.CE.right}/{report.blocks.CE.total || 0}</b><span>específico</span></article>
            <article className="card stat"><b>{(report.blocks.FG.earned + report.blocks.CE.earned).toFixed(1)}</b><span>pontos objetivos de 100</span></article>
            <article className="card stat"><b>{(report.blocks.FG.max + report.blocks.CE.max).toFixed(1)}</b><span>máximo desta prova objetiva</span></article>
          </div>
          <p className="callout">
            {weights ? examWeights(weights.year).label : ""} A conta usa o peso oficial de cada objetiva. Discursiva não entra. Questão anulada entra como acerto.
          </p>
        </>
      )}
      {report.freshTotal > 0 && <p style={{ marginTop: 10 }}>Inéditas: {report.freshRight} de {report.freshTotal}.</p>}
      <div className="q-list" style={{ marginTop: 16 }}>
        {questions.map((item) => {
          const choice = sim.choices[item.id];
          const ok = choice && isRight(item, choice);
          return (
            <button key={item.id} className="card q-item linkish" onClick={() => onReview(item.id)}>
              <span>{item.origin === "oficial" ? `${item.year} · ${item.num}` : "Inédita"} · {item.title}</span>
              <span className={ok ? "pill ok" : "pill no"}>{choice || "—"} {ok ? "certo" : `oficial ${item.answer}`}</span>
            </button>
          );
        })}
      </div>
    </article>
  );
}

function Caderno({ onZoom }) {
  const [year, setYear] = useState(2023);
  const [page, setPage] = useState(1);
  const total = 40;
  return (
    <article>
      <div className="row">
        <h1>Caderno</h1>
        {[2017, 2019, 2023].map((item) => (
          <button key={item} className={year === item ? "primary" : "ghost"} onClick={() => { setYear(item); setPage(1); }}>{item}</button>
        ))}
      </div>
      <p className="muted">As páginas em branco no fim são o espaço livre do caderno original.</p>
      <img className="page-shot" src={pageSrc(year, page)} alt={`Página ${page}`} onClick={() => onZoom(pageSrc(year, page))} />
      <div className="pager">
        <button className="ghost" disabled={page === 1} onClick={() => setPage(page - 1)}>Página anterior</button>
        <span className="timer">{page} / {total}</span>
        <button className="ghost" disabled={page === total} onClick={() => setPage(page + 1)}>Próxima página</button>
      </div>
    </article>
  );
}

function Essays({ texts, onChange, onZoom }) {
  const [id, setId] = useState(essays[0].id);
  const [show, setShow] = useState(false);
  const essay = essays.find((item) => item.id === id);
  return (
    <div className="split">
      <aside className="q-list">
        {essays.map((item) => (
          <button key={item.id} className="card linkish" onClick={() => { setId(item.id); setShow(false); }}>
            <strong>{item.year} {item.code}</strong>
            <p className="muted">{item.title}</p>
          </button>
        ))}
      </aside>
      <article>
        <p className="kicker">{essay.section === "FG" ? "Formação geral" : "Específico"} · 15 linhas na prova</p>
        <h1>{essay.title}</h1>
        <p style={{ margin: "8px 0 12px" }}>{essay.prompt}</p>
        <Pages year={essay.year} pages={essay.pages} onZoom={onZoom} />
        <label className="field" style={{ marginTop: 12 }}>Sua resposta
          <textarea value={texts[essay.id] || ""} onChange={(event) => onChange(essay.id, event.target.value)} placeholder="Escreva como se o cartão tivesse 15 linhas." />
        </label>
        <button className="primary" onClick={() => setShow((value) => !value)}>{show ? "Esconder padrão" : "Comparar com o padrão"}</button>
        {show && (
          <div style={{ marginTop: 12 }}>
            <h3>O que a banca pontua</h3>
            <ul>{essay.points.map((item) => <li key={item}>{item}</li>)}</ul>
            <h3>Uma resposta que cobriria o padrão</h3>
            <pre>{essay.model}</pre>
          </div>
        )}
      </article>
    </div>
  );
}

function Formulas() {
  const [text, setText] = useState("");
  const list = formulas.filter((item) => `${item.title} ${item.body}`.toLowerCase().includes(text.toLowerCase()));
  return (
    <>
      <h1>Fórmulas e regras</h1>
      <input value={text} onChange={(event) => setText(event.target.value)} placeholder="Filtrar" style={{ margin: "12px 0", width: "min(360px, 100%)" }} />
      <div className="grid">
        {list.map((item) => (
          <article key={item.title} className="card">
            <p className="kicker">{topicName(item.topic)}</p>
            <h3>{item.title}</h3>
            <pre>{item.body}</pre>
          </article>
        ))}
      </div>
    </>
  );
}

function Review({ reviews, answers, onOpen, onGrade }) {
  const today = todayISO();
  const due = Object.entries(reviews).filter(([, rev]) => rev.due <= today);
  const wrong = official.filter((item) => answers[item.id] && !answers[item.id].correct);
  return (
    <>
      <h1>Revisão</h1>
      <p className="lede">Errou na questão: ela volta amanhã. “Bom” espaça, “Fácil” espaça mais, “Errei” traz de volta no dia seguinte.</p>
      <h3 style={{ margin: "16px 0 8px" }}>Para hoje ({due.length})</h3>
      <div className="q-list">
        {due.map(([id, rev]) => {
          const question = bank.find((item) => item.id === id);
          if (!question) return null;
          return (
            <div key={id} className="card q-item">
              <button className="linkish" onClick={() => onOpen(id)}><strong>{question.title}</strong><span className="muted"> · prevista {rev.due}</span></button>
              <span className="row">
                {[["wrong", "Errei"], ["good", "Bom"], ["easy", "Fácil"]].map(([grade, label]) => (
                  <button key={grade} className="ghost" onClick={() => onGrade(id, grade)}>{label}</button>
                ))}
              </span>
            </div>
          );
        })}
        {due.length === 0 && <p className="muted">Nada vencido hoje.</p>}
      </div>
      <h3 style={{ margin: "18px 0 8px" }}>Oficiais que você errou ({wrong.length})</h3>
      <div className="q-list">
        {wrong.map((item) => (
          <button key={item.id} className="card q-item linkish" onClick={() => onOpen(item.id)}>
            <span>{item.year} · {item.num} · {item.title}</span>
            <span className="pill no">sua {answers[item.id].choice} · oficial {item.answer}</span>
          </button>
        ))}
      </div>
    </>
  );
}

function Plan({ done, onToggle }) {
  const all = plan.flatMap((week) => week.days);
  const count = all.filter(([id]) => done[id]).length;
  return (
    <>
      <h1>Plano de quatro semanas</h1>
      <p className="lede">{count} de {all.length} blocos feitos. A última prova oficial fica para o fim, quando o gabarito ainda consegue te surpreender.</p>
      {plan.map((week) => (
        <section key={week.week} style={{ marginTop: 16 }}>
          <h3>{week.week}</h3>
          {week.days.map(([id, label]) => (
            <label key={id} className="check">
              <input type="checkbox" checked={Boolean(done[id])} onChange={() => onToggle(id)} />
              <span>{label}</span>
            </label>
          ))}
        </section>
      ))}
    </>
  );
}

function Keys() {
  const years = [2017, 2019, 2023];
  return (
    <>
      <h1>Gabaritos oficiais</h1>
      <p className="lede">Letras do gabarito definitivo do Inep. A questão 1 de 2019 foi anulada.</p>
      <div className="grid cards" style={{ marginTop: 12 }}>
        {years.map((year) => (
          <article key={year} className="card">
            <h3>{year}</h3>
            <table>
              <tbody>
                {official.filter((item) => item.year === year).map((item) => (
                  <tr key={item.id}><td>{item.num}</td><td>{item.annulled ? "anulada" : item.answer}</td><td className="muted">{item.title}</td></tr>
                ))}
              </tbody>
            </table>
          </article>
        ))}
      </div>
    </>
  );
}
