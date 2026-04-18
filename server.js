const express = require("express");
const sqlite3 = require("sqlite3").verbose();

const app = express();

/* 🔥 BANCO */
const db = new sqlite3.Database("./quiz.db");

/* 🔥 GARANTE TABELA COM UNIQUE */
db.run(`
  CREATE TABLE IF NOT EXISTS ranking (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE,
    score INTEGER
  )
`);

app.use(express.json());
app.use(express.static("public"));

/* 🔹 FUNÇÃO PROMISE SQLITE */
function query(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

/* 🔹 QUIZ */
app.get("/quiz", async (req, res) => {
  try {
    const faceis = await query(`
      SELECT * FROM questions
      WHERE category = 'facil'
      ORDER BY RANDOM()
      LIMIT 10
    `);

    const medias = await query(`
      SELECT * FROM questions
      WHERE category = 'medio'
      ORDER BY RANDOM()
      LIMIT 15
    `);

    const dificeis = await query(`
      SELECT * FROM questions
      WHERE category = 'dificil'
      ORDER BY RANDOM()
    `);

    const todas = [...faceis, ...medias, ...dificeis];

    const formatted = todas.map(q => ({
      question: q.question,
      options: [
        q.option1,
        q.option2,
        q.option3,
        q.option4
      ],
      correct: q.correct
    }));

    res.json(formatted);

  } catch (err) {
    console.error("Erro no quiz:", err);
    res.status(500).json({ error: "Erro ao montar quiz" });
  }
});

/* 🔹 LOGIN */
app.post("/login", (req, res) => {
  let { name } = req.body;

  if (!name || name.trim() === "") {
    return res.status(400).json({
      success: false,
      message: "Nome inválido"
    });
  }

  name = name.trim().toLowerCase();

  res.json({ success: true, name });
});

/* 🔥 SALVAR SCORE (UPSERT PERFEITO) */
app.post("/save-score", (req, res) => {
  let { name, score } = req.body;

  if (!name || score === undefined) {
    return res.status(400).json({
      success: false,
      message: "Dados inválidos"
    });
  }

  name = name.trim().toLowerCase();

  db.run(
    `
    INSERT INTO ranking (name, score)
    VALUES (?, ?)
    ON CONFLICT(name)
    DO UPDATE SET score = 
      CASE 
        WHEN excluded.score > ranking.score 
        THEN excluded.score 
        ELSE ranking.score 
      END
    `,
    [name, score],
    (err) => {
      if (err) {
        console.error("Erro ao salvar score:", err);
        return res.status(500).json({ success: false });
      }

      res.json({ success: true });
    }
  );
});

/* 🔥 RANKING */
app.get("/ranking", (req, res) => {
  db.all(
    `
    SELECT name, score
    FROM ranking
    ORDER BY score DESC
    LIMIT 10
    `,
    (err, rows) => {
      if (err) {
        console.error("Erro ao buscar ranking:", err);
        return res.status(500).json({
          error: "Erro ao buscar ranking"
        });
      }

      res.json(rows);
    }
  );
});

/* 🔥 MELHOR SCORE */
app.get("/best/:name", (req, res) => {
  let { name } = req.params;

  name = name.trim().toLowerCase();

  db.get(
    `
    SELECT score as best
    FROM ranking
    WHERE name = ?
    `,
    [name],
    (err, row) => {
      if (err) {
        return res.status(500).json({ error: "Erro ao buscar melhor score" });
      }

      res.json({ best: row ? row.best : 0 });
    }
  );
});

/* 🔹 TESTE */
app.get("/", (req, res) => {
  res.send("🚀 Servidor do Quiz rodando");
});



/* 🔹 START */
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("🚀 Rodando na porta " + PORT);
});