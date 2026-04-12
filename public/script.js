let current = 0;
let score = 0;
let questions = [];
let playerName = "";

let timeLeft = 10;
let timerInterval;

let lives = 3;

/* 🔹 ATUALIZAR VIDAS */
function updateLives(){
  const livesDiv = document.getElementById("lives");

  let hearts = "";

  for(let i = 0; i < lives; i++){
    hearts += "❤️ ";
  }

  livesDiv.innerText = hearts;

  if(lives === 1){
    livesDiv.style.color = "red";
  } else {
    livesDiv.style.color = "white";
  }
}

/* 🔹 INICIAR JOGO */
async function startGame(){

  playerName = document.getElementById("name").value;

  if(!playerName){
    alert("Digite seu nome");
    return;
  }

  try {
    const res = await fetch("/quiz");
    questions = await res.json();

    current = 0;
    score = 0;
    lives = 3;

    updateLives();

    document.getElementById("start").classList.add("hidden");
    document.getElementById("quiz").classList.remove("hidden");

    loadQuestion();

  } catch (err) {
    console.error(err);
    alert("Erro ao iniciar o jogo");
  }
}

/* 🔹 TIMER */
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

/* 🔹 CARREGAR PERGUNTA */
function loadQuestion(){

  const q = questions[current];

  if(!q){
    finishGame();
    return;
  }

  document.getElementById("question").innerText = q.question;

  const optionsDiv = document.getElementById("options");
  optionsDiv.innerHTML = "";

  q.options.forEach((opt, index) => {

    if(opt){
      const btn = document.createElement("button");
      btn.innerText = opt;
      btn.onclick = () => answer(index, q.correct);
      optionsDiv.appendChild(btn);
    }

  });

  startTimer();
}

/* 🔹 RESPONDER */
function answer(selected, correct){

  clearInterval(timerInterval);

  const buttons = document.querySelectorAll("#options button");

  buttons.forEach((btn, index) => {

    if (index === correct) {
      btn.style.background = "green";
    } else if (index === selected) {
      btn.style.background = "red";
    }

    btn.disabled = true;
  });

  if(selected === correct){
    score += 10;
  } else {
    lives--;
    updateLives();

    if(lives <= 0){
      setTimeout(() => {
        finishGame();
      }, 1000);
      return;
    }
  }

  setTimeout(() => {
    current++;
    loadQuestion();
  }, 1000);
}

/* 🔹 FINALIZAR */
async function finishGame(){

  document.getElementById("quiz").classList.add("hidden");
  document.getElementById("result").classList.remove("hidden");

  document.getElementById("score").innerText = `Pontuação: ${score}`;

  try {
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

  } catch (err) {
    console.error(err);
  }
}

/* 🔹 WHATSAPP */
function compartilharWhatsApp() {

  const mensagem = `🔥 Eu fiz ${score} pontos no Quiz Bíblico!\n\n😱 Duvido você bater minha pontuação!\n👉 Jogue aqui: ${window.location.origin}`;
  const url = `https://wa.me/?text=${encodeURIComponent(mensagem)}`;

  window.open(url, '_blank');
}