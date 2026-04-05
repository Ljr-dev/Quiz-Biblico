const express = require("express");
const db = require("./db");

const app = express();

app.use(express.json());
app.use(express.static("public"));

/* 🔹 PEGAR CATEGORIAS */
app.get("/categories", (req, res) => {
  db.all("SELECT DISTINCT category FROM questions", (err, rows) => {
    res.json(rows.map(r => r.category));
  });
});

/* 🔹 PEGAR PERGUNTAS POR CATEGORIA */
app.get("/questions/:category", (req, res) => {
  const category = req.params.category;

  db.all(
    `SELECT * FROM questions WHERE category = ? ORDER BY RANDOM() LIMIT 10`,
    [category],
    (err, rows) => {
      const formatted = rows.map(q => ({
        question: q.question,
        options: [q.option1, q.option2, q.option3, q.option4],
        correct: q.correct
      }));

      res.json(formatted);
    }
  );
});

/* 🔹 SALVAR SCORE */
app.post("/save-score", (req, res) => {
  const { name, score } = req.body;

  db.run(
    "INSERT INTO ranking (name, score) VALUES (?, ?)",
    [name, score],
    () => res.json({ success: true })
  );
});

/* 🔹 RANKING */
app.get("/ranking", (req, res) => {
  db.all(
    "SELECT * FROM ranking ORDER BY score DESC LIMIT 10",
    (err, rows) => res.json(rows)
  );
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Rodando na porta " + PORT));