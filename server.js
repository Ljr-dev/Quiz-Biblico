const express = require("express");
const db = require("./db");

const app = express();

app.use(express.json());
app.use(express.static("public"));

/* 🔹 FUNÇÃO PROMISE PRA SQLITE */
function query(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

/* 🔹 QUIZ COMPLETO (PROGRESSIVO) */
app.get("/quiz", async (req, res) => {
  try {

    // 🔹 FÁCIL (10)
    const faceis = await query(`
      SELECT * FROM questions
      WHERE category = 'facil'
      ORDER BY RANDOM()
      LIMIT 10
    `);

    // 🔹 MÉDIO (15)
    const medias = await query(`
      SELECT * FROM questions
      WHERE category = 'medio'
      ORDER BY RANDOM()
      LIMIT 15
    `);

    // 🔹 DIFÍCIL (TODAS)
    const dificeis = await query(`
      SELECT * FROM questions
      WHERE category = 'dificil'
      ORDER BY RANDOM()
    `);

    // 🔹 JUNTA TUDO
    const todas = [...faceis, ...medias, ...dificeis];

    // 🔹 FORMATA PRO FRONT
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

/* 🔹 SALVAR SCORE */
app.post("/save-score", (req, res) => {
  const { name, score } = req.body;

  db.run(
    "INSERT INTO ranking (name, score) VALUES (?, ?)",
    [name, score],
    function (err) {
      if (err) {
        console.error("Erro ao salvar score:", err);
        return res.status(500).json({ error: "Erro ao salvar score" });
      }

      res.json({ success: true });
    }
  );
});

/* 🔹 RANKING */
app.get("/ranking", (req, res) => {
  db.all(
    `SELECT * FROM ranking
     ORDER BY score DESC
     LIMIT 10`,
    (err, rows) => {
      if (err) {
        console.error("Erro ao buscar ranking:", err);
        return res.status(500).json({ error: "Erro ao buscar ranking" });
      }

      res.json(rows);
    }
  );
});

/* 🔹 TESTE */
app.get("/", (req, res) => {
  res.send("Servidor do Quiz rodando 🚀");
});

/* 🔹 START SERVER */
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("🚀 Rodando na porta " + PORT);
});