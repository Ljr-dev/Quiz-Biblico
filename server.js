const express = require("express");
const db = require("./db");

const app = express();

app.use(express.json());
app.use(express.static("public"));

function query(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

// QUIZ
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
      options: [q.option1, q.option2, q.option3, q.option4],
      correct: q.correct
    }));

    res.json(formatted);
  } catch (err) {
    res.status(500).json({ error: "Erro ao montar quiz" });
  }
});

// SALVAR SCORE (mantém só o melhor)
app.post("/save-score", (req, res) => {
  const { name, score } = req.body;

  db.get("SELECT * FROM ranking WHERE name = ?", [name], (err, row) => {
    if (err) return res.status(500).json({ error: "Erro" });

    if (!row) {
      db.run(
        "INSERT INTO ranking (name, score) VALUES (?, ?)",
        [name, score],
        () => res.json({ success: true })
      );
    } else if (score > row.score) {
      db.run(
        "UPDATE ranking SET score = ? WHERE name = ?",
        [score, name],
        () => res.json({ success: true })
      );
    } else {
      res.json({ success: true });
    }
  });
});

// RANKING (sem duplicados)
app.get("/ranking", (req, res) => {
  db.all(`
    SELECT name, MAX(score) as score
    FROM ranking
    GROUP BY name
    ORDER BY score DESC
    LIMIT 10
  `, (err, rows) => {
    if (err) return res.status(500).json({ error: "Erro" });
    res.json(rows);
  });
});

app.get("/", (req, res) => {
  res.send("Servidor rodando 🚀");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Rodando na porta " + PORT));