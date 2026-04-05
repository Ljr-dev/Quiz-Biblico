let current = 0;
let score = 0;
let questions = [];
let playerName = "";

let timeLeft = 10;
let timerInterval;

/* 🔹 CARREGAR CATEGORIAS */
async function loadCategories(){
  const res = await fetch("/categories");
  const data = await res.json();

  const select = document.getElementById("category");

  data.forEach(cat => {
    const option = document.createElement("option");
    option.value = cat;
    option.innerText = cat;
    select.appendChild(option);
  });
}

loadCategories();

/* 🔹 INICIAR JOGO */
async function startGame(){
  playerName = document.getElementById("name").value;
  const category = document.getElementById("category").value;

  const res = await fetch(`/questions/${category}`);
  questions = await res.json();

  document.getElementById("start").classList.add("hidden");
  document.getElementById("quiz").classList.remove("hidden");

  loadQuestion();
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
    const btn = document.createElement("button");
    btn.innerText = opt;
    btn.onclick = () => answer(index, q.correct);
    optionsDiv.appendChild(btn);
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