const express = require("express");
const db = require("./db");

const app = express();

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

/* 🔹 LOGIN (SÓ VALIDA) */
app.post("/login", (req, res) => {
  const { name } = req.body;

  if (!name || name.trim() === "") {
    return res.status(400).json({
      success: false,
      message: "Nome inválido"
    });
  }

  res.json({ success: true });
});

/* 🔥 SALVAR SCORE (COMPATÍVEL COM UNIQUE) */
app.post("/save-score", (req, res) => {
  const { name, score } = req.body;

  if (!name || score === undefined) {
    return res.status(400).json({
      success: false,
      message: "Dados inválidos"
    });
  }

  db.get(
    "SELECT score FROM ranking WHERE name = ?",
    [name],
    (err, row) => {

      if (err) {
        console.error(err);
        return res.status(500).json({ success: false });
      }

      // 👉 não existe → cria
      if (!row) {
        db.run(
          "INSERT INTO ranking (name, score) VALUES (?, ?)",
          [name, score],
          (err) => {
            if (err) return res.status(500).json({ success: false });
            res.json({ success: true });
          }
        );
      } 
      // 👉 existe → atualiza só se for maior
      else if (score > row.score) {
        db.run(
          "UPDATE ranking SET score = ? WHERE name = ?",
          [score, name],
          (err) => {
            if (err) return res.status(500).json({ success: false });
            res.json({ success: true });
          }
        );
      } 
      // 👉 menor → ignora
      else {
        res.json({ success: true });
      }
    }
  );
});

/* 🔥 RANKING (AGORA SIMPLES E CORRETO) */
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

/* 🔥 MELHOR SCORE INDIVIDUAL */
app.get("/best/:name", (req, res) => {
  const { name } = req.params;

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

/* 🔹 START SERVER */
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("🚀 Rodando na porta " + PORT);
});
