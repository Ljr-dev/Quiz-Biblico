const express = require("express");
const db = require("./db");

const app = express();

app.use(express.json());
app.use(express.static("public"));

/* 🔹 PEGAR CATEGORIAS */
app.get("/categories", (req, res) => {
  try {
    const rows = db.prepare("SELECT DISTINCT category FROM questions").all();
    res.json(rows.map(r => r.category));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao buscar categorias" });
  }
});

/* 🔹 PEGAR PERGUNTAS POR CATEGORIA */
app.get("/questions/:category", (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT * FROM questions
      WHERE category = ?
      ORDER BY RANDOM()
      LIMIT 10
    `).all(req.params.category);

    const formatted = rows.map(q => ({
      question: q.question,
      options: [q.option1, q.option2, q.option3, q.option4],
      correct: q.correct
    }));

    res.json(formatted);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao buscar perguntas" });
  }
});

/* 🔹 SALVAR SCORE */
app.post("/save-score", (req, res) => {
  try {
    const { name, score } = req.body;

    db.prepare(
      "INSERT INTO ranking (name, score) VALUES (?, ?)"
    ).run(name, score);

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao salvar score" });
  }
});

/* 🔹 RANKING */
app.get("/ranking", (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT * FROM ranking
      ORDER BY score DESC
      LIMIT 10
    `).all();

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao buscar ranking" });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Rodando na porta " + PORT);
});