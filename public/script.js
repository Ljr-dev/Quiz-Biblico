let current = 0;
let score = 0;
let questions = [];
let playerName = "";

let timeLeft = 10;
let timerInterval;
let lives = 3;

window.onload = async () => {
  const savedName = localStorage.getItem("playerName");

  if(savedName){
    playerName = savedName;
    document.getElementById("start").classList.add("hidden");
    document.getElementById("quiz").classList.remove("hidden");
    startGameAuto();
  }
};

async function startGameAuto(){
  const res = await fetch("/quiz");
  questions = await res.json();

  current = 0;
  score = 0;
  lives = 3;

  updateLives();
  updateUserInfo();
  loadQuestion();
}

async function startGame(){
  playerName = document.getElementById("name").value;

  if(!playerName){
    alert("Digite seu nome");
    return;
  }

  localStorage.setItem("playerName", playerName);

  const res = await fetch("/quiz");
  questions = await res.json();

  current = 0;
  score = 0;
  lives = 3;

  updateLives();
  updateUserInfo();

  document.getElementById("start").classList.add("hidden");
  document.getElementById("quiz").classList.remove("hidden");

  loadQuestion();
}

function updateUserInfo(){
  const div = document.getElementById("user-info");
  const best = localStorage.getItem("bestScore") || 0;
  div.innerText = `👋 ${playerName} | 🏆 Melhor: ${best}`;
}

function updateLives(){
  const livesDiv = document.getElementById("lives");

  let hearts = "";
  for(let i = 0; i < lives; i++) hearts += "❤️ ";

  livesDiv.innerText = hearts;
}

function startTimer() {
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

      if(lives <= 0){
        finishGame();
        return;
      }

      current++;
      loadQuestion();
    }
  }, 1000);
}

function loadQuestion(){
  const q = questions[current];

  if(!q){
    finishGame();
    return;
  }

  document.getElementById("question").innerText = q.question;

  const optionsDiv = document.getElementById("options");
  optionsDiv.innerHTML = "";

  const shuffled = q.options.map((opt, index) => ({
    text: opt,
    isCorrect: index === q.correct
  })).sort(() => Math.random() - 0.5);

  shuffled.forEach(opt => {
    const btn = document.createElement("button");
    btn.innerText = opt.text;
    btn.onclick = () => answer(opt.isCorrect, btn);
    optionsDiv.appendChild(btn);
  });

  startTimer();
}

function answer(isCorrect, clickedBtn){
  clearInterval(timerInterval);

  const buttons = document.querySelectorAll("#options button");
  buttons.forEach(btn => btn.disabled = true);

  if(isCorrect){
    clickedBtn.style.background = "green";
    score += 10;
  } else {
    clickedBtn.style.background = "red";

    lives--;
    updateLives();

    if(lives <= 0){
      setTimeout(() => finishGame(), 1000);
      return;
    }
  }

  setTimeout(() => {
    current++;
    loadQuestion();
  }, 1000);
}

async function finishGame(){
  document.getElementById("quiz").classList.add("hidden");
  document.getElementById("result").classList.remove("hidden");

  document.getElementById("score").innerText = `Pontuação: ${score}`;

  let best = localStorage.getItem("bestScore") || 0;
  if(score > best){
    localStorage.setItem("bestScore", score);
  }

  await fetch("/save-score", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({ name: playerName, score })
  });

  const res = await fetch("/ranking");
  const ranking = await res.json();

  const list = document.getElementById("ranking");
  list.innerHTML = "";

  ranking.forEach((p, index) => {
    let medal = "";
    if(index === 0) medal = "🥇";
    else if(index === 1) medal = "🥈";
    else if(index === 2) medal = "🥉";

    const li = document.createElement("li");
    li.innerText = `${medal} ${p.name} - ${p.score}`;
    list.appendChild(li);
  });
}

function logout(){
  localStorage.clear();
  location.reload();
}

function compartilharWhatsApp() {
  const mensagem = `🔥 Eu fiz ${score} pontos no Quiz Bíblico!\n👉 ${window.location.origin}`;
  const url = `https://wa.me/?text=${encodeURIComponent(mensagem)}`;
  window.open(url, '_blank');
}