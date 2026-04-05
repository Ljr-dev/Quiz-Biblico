const sqlite3 = require("sqlite3").verbose();

const db = new sqlite3.Database("./quiz.db");

const categories = [
  "Antigo Testamento",
  "Novo Testamento",
  "Personagens",
  "Versículos"
];

// base de perguntas (modelo)
const baseQuestions = [
  {
    question: "Quem construiu a arca?",
    options: ["Moisés", "Noé", "Davi", "Abraão"],
    correct: 1,
    category: "Antigo Testamento"
  },
  {
    question: "Quem enfrentou Golias?",
    options: ["Davi", "Sansão", "Pedro", "Paulo"],
    correct: 0,
    category: "Antigo Testamento"
  },
  {
    question: "Quem traiu Jesus?",
    options: ["Pedro", "Judas", "João", "Tiago"],
    correct: 1,
    category: "Novo Testamento"
  },
  {
    question: "Quem negou Jesus 3 vezes?",
    options: ["Pedro", "Judas", "João", "Tiago"],
    correct: 0,
    category: "Novo Testamento"
  },
  {
    question: "Quem foi o homem mais forte da Bíblia?",
    options: ["Davi", "Sansão", "Golias", "Moisés"],
    correct: 1,
    category: "Personagens"
  },
  {
    question: "Complete: 'Tudo posso naquele que me...'",
    options: ["fortalece", "ama", "guia", "ensina"],
    correct: 0,
    category: "Versículos"
  }
];

db.serialize(() => {
  console.log("Criando tabelas...");

  db.run("DROP TABLE IF EXISTS questions");
  db.run("DROP TABLE IF EXISTS ranking");

  db.run(`
    CREATE TABLE questions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category TEXT,
      question TEXT,
      option1 TEXT,
      option2 TEXT,
      option3 TEXT,
      option4 TEXT,
      correct INTEGER
    )
  `);

  db.run(`
    CREATE TABLE ranking (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      score INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  console.log("Inserindo perguntas...");

  const stmt = db.prepare(`
    INSERT INTO questions (category, question, option1, option2, option3, option4, correct)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  let count = 0;

  // gera ~200 perguntas repetindo base com variações
  for (let i = 0; i < 200; i++) {
    const base = baseQuestions[i % baseQuestions.length];

    stmt.run(
      base.category,
      base.question + " #" + (i + 1),
      base.options[0],
      base.options[1],
      base.options[2],
      base.options[3],
      base.correct
    );

    count++;
  }

  stmt.finalize();

  console.log(`✅ ${count} perguntas inseridas!`);
});

db.close();