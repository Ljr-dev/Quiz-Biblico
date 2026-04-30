
  let current = 0;
let score = 0;
let questions = [];
let playerName = "";

let timeLeft = 10;
let timerInterval;
let lives = 3;

function formatName(name){
  return name
    .split(" ")
    .map(n => n.charAt(0).toUpperCase() + n.slice(1))
    .join(" ");
}

window.onload = async () => {
  const savedName = localStorage.getItem("playerName");
  const logoutBtn = document.querySelector(".btn-logout");

  if (savedName) {
    playerName = savedName;

    logoutBtn.style.display = "block";

    document.getElementById("start").classList.add("hidden");
    document.getElementById("quiz").classList.remove("hidden");

    await updateUserInfo();
    startGameAuto();
  } else {
    logoutBtn.style.display = "none";
  }
};

function showUserBasic() {
  document.getElementById("user-info").innerText = `👋 ${formatName(playerName)}`;
}

async function updateUserInfo() {
  const div = document.getElementById("user-info");

  div.innerText = `👋 ${formatName(playerName)}`;

  try {
    const res = await fetch(`best/${playerName}`);
    const data = await res.json();

    const best = data.best || 0;

    localStorage.setItem("bestScore", best);

    if (best > 0) {
      div.innerText = `👋 ${formatName(playerName)} | 🏆 Melhor: ${best}`;
    }
  } catch {
    console.log("Erro ao buscar score");
  }
}

async function startGameAuto() {
  const res = await fetch("quiz");
  questions = await res.json();

  resetGame();
  loadQuestion();
}

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

  await updateUserInfo();

  const res = await fetch("quiz");
  questions = await res.json();

  resetGame();
  loadQuestion();
}

function resetGame() {
  current = 0;
  score = 0;
  lives = 3;
  updateLives();
}

function updateLives() {
  const livesDiv = document.getElementById("lives");
  livesDiv.innerText = "❤️ ".repeat(lives);
}

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

async function finishGame() {
  clearInterval(timerInterval);

  document.getElementById("quiz").classList.add("hidden");
  document.getElementById("result").classList.remove("hidden");

  document.getElementById("score").innerText = `Pontuação: ${score}`;

  await fetch("save-score", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({ name: playerName, score })
  });

  await updateUserInfo();

  const res = await fetch("ranking");
  const ranking = await res.json();

  const list = document.getElementById("ranking");
  list.innerHTML = "";

  ranking.forEach((p, i) => {
    const medal = ["🥇","🥈","🥉"][i] || "";
    const li = document.createElement("li");

    li.innerText = `${medal} ${formatName(p.name)} - ${p.score}`;

    list.appendChild(li);
  });
}

function restartGame() {
  document.getElementById("result").classList.add("hidden");
  document.getElementById("quiz").classList.remove("hidden");

  startGameAuto();
}

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

function compartilharWhatsApp() {
  const msg = `🔥 Fiz ${score} pontos no Quiz Bíblico!\n👉 ${window.location.href}`;
  window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`);
}  
