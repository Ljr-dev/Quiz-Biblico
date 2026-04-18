let current = 0;
let score = 0;
let questions = [];
let playerName = "";

let timeLeft = 10;
let timerInterval;
let lives = 3;

/* 🔹 AO CARREGAR */
window.onload = async () => {
  const savedName = localStorage.getItem("playerName");
  const logoutBtn = document.querySelector(".btn-logout");

  if (savedName) {
    playerName = savedName;

    logoutBtn.style.display = "block";

    document.getElementById("start").classList.add("hidden");
    document.getElementById("quiz").classList.remove("hidden");

    showUserBasic();
    startGameAuto();
  } else {
    logoutBtn.style.display = "none";
  }
};

/* 🔹 MOSTRA NOME */
function showUserBasic() {
  document.getElementById("user-info").innerText = `👋 ${playerName}`;
}

/* 🔹 ATUALIZA MELHOR SCORE */
async function updateUserInfo() {
  const div = document.getElementById("user-info");

  const localBest = parseInt(localStorage.getItem("bestScore")) || 0;

  if (localBest > 0) {
    div.innerText = `👋 ${playerName} | 🏆 Melhor: ${localBest}`;
  }

  try {
    const res = await fetch(`/best/${playerName}`);
    const data = await res.json();

    if (data.best > localBest) {
      localStorage.setItem("bestScore", data.best);
      div.innerText = `👋 ${playerName} | 🏆 Melhor: ${data.best}`;
    }
  } catch {}
}

/* 🔹 INICIO AUTO */
async function startGameAuto() {
  const res = await fetch("/quiz");
  questions = await res.json();

  resetGame();
  loadQuestion();
}

/* 🔹 INICIO MANUAL */
async function startGame() {
  playerName = document.getElementById("name").value.trim();

  if (!playerName) {
    alert("Digite seu nome");
    return;
  }

  localStorage.setItem("playerName", playerName);

  document.querySelector(".btn-logout").style.display = "block";

  document.getElementById("start").classList.add("hidden");
  document.getElementById("quiz").classList.remove("hidden");

  showUserBasic();

  const res = await fetch("/quiz");
  questions = await res.json();

  resetGame();
  loadQuestion();
}

/* 🔹 RESET */
function resetGame() {
  current = 0;
  score = 0;
  lives = 3;
  updateLives();
}

/* 🔹 VIDAS */
function updateLives() {
  const livesDiv = document.getElementById("lives");
  livesDiv.innerText = "❤️ ".repeat(lives);
}

/* 🔹 TIMER */
function startTimer() {
  clearInterval(timerInterval);

  const bar = document.getElementById("timer-bar");

  timeLeft = 10;
  bar.style.width = "100%";

  timerInterval = setInterval(() => {
    timeLeft--;
    bar.style.width = (timeLeft * 10) + "%";

    if (timeLeft <= 0) {
      clearInterval(timerInterval);

      lives--;
      updateLives();

      if (lives <= 0) {
        finishGame();
        return;
      }

      current++;
      loadQuestion();
    }
  }, 1000);
}

/* 🔹 PERGUNTA */
function loadQuestion() {
  clearInterval(timerInterval);

  const q = questions[current];

  if (!q) {
    finishGame();
    return;
  }

  document.getElementById("question").innerText = q.question;

  const optionsDiv = document.getElementById("options");
  optionsDiv.innerHTML = "";

  const shuffled = q.options
    .map((opt, index) => ({
      text: opt,
      isCorrect: index === q.correct
    }))
    .sort(() => Math.random() - 0.5);

  shuffled.forEach(opt => {
    const btn = document.createElement("button");
    btn.innerText = opt.text;
    btn.onclick = () => answer(opt.isCorrect, btn);
    optionsDiv.appendChild(btn);
  });

  startTimer();
}

/* 🔹 RESPONDER */
function answer(isCorrect, btn) {
  clearInterval(timerInterval);

  document.querySelectorAll("#options button").forEach(b => b.disabled = true);

  if (isCorrect) {
    btn.style.background = "green";
    score += 10;
  } else {
    btn.style.background = "red";
    lives--;
    updateLives();

    if (lives <= 0) {
      setTimeout(finishGame, 800);
      return;
    }
  }

  setTimeout(() => {
    current++;
    loadQuestion();
  }, 800);
}

/* 🔥 FINAL */
async function finishGame() {
  clearInterval(timerInterval);

  document.getElementById("quiz").classList.add("hidden");
  document.getElementById("result").classList.remove("hidden");

  document.getElementById("score").innerText = `Pontuação: ${score}`;

  await fetch("/save-score", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({ name: playerName, score })
  });

  let best = parseInt(localStorage.getItem("bestScore")) || 0;
  if (score > best) {
    localStorage.setItem("bestScore", score);
  }

  await updateUserInfo();

  const res = await fetch("/ranking");
  const ranking = await res.json();

  const list = document.getElementById("ranking");
  list.innerHTML = "";

  ranking.forEach((p, i) => {
    const medal = ["🥇","🥈","🥉"][i] || "";
    const li = document.createElement("li");
    li.innerText = `${medal} ${p.name} - ${p.score}`;
    list.appendChild(li);
  });
}

/* 🔹 RESTART */
function restartGame() {
  document.getElementById("result").classList.add("hidden");
  document.getElementById("quiz").classList.remove("hidden");

  startGameAuto();
}

/* 🔹 LOGOUT (AGORA PROFISSIONAL) */
function logout() {
  localStorage.removeItem("playerName");
  localStorage.removeItem("bestScore");

  playerName = "";

  document.getElementById("quiz").classList.add("hidden");
  document.getElementById("result").classList.add("hidden");
  document.getElementById("start").classList.remove("hidden");

  document.querySelector(".btn-logout").style.display = "none";

  document.getElementById("name").value = "";
}

/* 🔹 WHATSAPP */
function compartilharWhatsApp() {
  const msg = `🔥 Fiz ${score} pontos no Quiz Bíblico!\n👉 ${window.location.origin}`;
  window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`);
}