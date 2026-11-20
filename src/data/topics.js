export const topics = [
  { id: "fg", name: "Formação geral", group: "Prova" },
  { id: "calculo", name: "Cálculo e equações diferenciais", group: "Matemática" },
  { id: "discreta", name: "Discreta, lógica e grafos", group: "Matemática" },
  { id: "estatistica", name: "Estatística e mínimos quadrados", group: "Matemática" },
  { id: "otimizacao", name: "Otimização e pesquisa operacional", group: "Matemática" },
  { id: "circuitos", name: "Circuitos e eletrônica", group: "Hardware" },
  { id: "materiais", name: "Materiais e grandezas físicas", group: "Hardware" },
  { id: "digitais", name: "Sistemas digitais", group: "Hardware" },
  { id: "embarcados", name: "Sistemas embarcados", group: "Hardware" },
  { id: "sinais", name: "Sinais, amostragem e filtros", group: "Hardware" },
  { id: "controle", name: "Controle", group: "Hardware" },
  { id: "algoritmos", name: "Algoritmos e complexidade", group: "Software" },
  { id: "estruturas", name: "Estruturas de dados", group: "Software" },
  { id: "programacao", name: "Programação", group: "Software" },
  { id: "teoria", name: "Teoria da computação", group: "Software" },
  { id: "arquitetura", name: "Arquitetura e GPU", group: "Sistemas" },
  { id: "so", name: "Sistemas operacionais", group: "Sistemas" },
  { id: "redes", name: "Redes e distribuídos", group: "Sistemas" },
  { id: "bd", name: "Banco de dados", group: "Sistemas" },
  { id: "es", name: "Engenharia de software", group: "Sistemas" },
  { id: "ia", name: "Inteligência artificial", group: "Sistemas" },
  { id: "seguranca", name: "Segurança e legislação", group: "Sistemas" },
  { id: "ihc", name: "IHC e qualidade", group: "Sistemas" },
];

export const topicName = (id) => topics.find((t) => t.id === id)?.name || id;

export function examWeights(year) {
  if (year === 2023) {
    return {
      fgObj: 0.25 * 0.65,
      ceObj: 0.75 * 0.9,
      fgDisc: 0.25 * 0.35,
      ceDisc: 0.75 * 0.1,
      fgCount: 9,
      ceCount: 29,
      label: "2023: 1 discursiva + 9 objetivas de formação geral; 1 discursiva + 29 objetivas específicas (questões 10 a 38).",
    };
  }
  return {
    fgObj: 0.25 * 0.6,
    ceObj: 0.75 * 0.85,
    fgDisc: 0.25 * 0.4,
    ceDisc: 0.75 * 0.15,
    fgCount: 8,
    ceCount: 27,
    label: "2017 e 2019: 2 discursivas + 8 objetivas de formação geral; 3 discursivas + 27 objetivas específicas (questões 9 a 35).",
  };
}

export function objectivePoints(question, correct) {
  if (question.annulled) {
    const w = examWeights(question.year);
    const pool = question.section === "FG" ? w.fgObj : w.ceObj;
    const n = question.section === "FG" ? w.fgCount : w.ceCount;
    return { earned: (pool * 100) / n, max: (pool * 100) / n, annulled: true };
  }
  const w = examWeights(question.year);
  const pool = question.section === "FG" ? w.fgObj : w.ceObj;
  const n = question.section === "FG" ? w.fgCount : w.ceCount;
  const max = (pool * 100) / n;
  return { earned: correct ? max : 0, max, annulled: false };
}
