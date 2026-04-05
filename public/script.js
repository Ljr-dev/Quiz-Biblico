let current = 0;
let score = 0;
let questions = [];
let playerName = "";

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

async function startGame(){
  playerName = document.getElementById("name").value;
  const category = document.getElementById("category").value;

  const res = await fetch(`/questions/${category}`);
  questions = await res.json();

  document.getElementById("start").classList.add("hidden");
  document.getElementById("quiz").classList.remove("hidden");

  loadQuestion();
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

  q.options.forEach((opt, index) => {
    const btn = document.createElement("button");
    btn.innerText = opt;
    btn.onclick = () => answer(index, q.correct);
    optionsDiv.appendChild(btn);
  });
}

function answer(selected, correct){
  if(selected === correct){
    score += 10;
  }

  current++;
  loadQuestion();
}

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

  ranking.forEach(p => {
    const li = document.createElement("li");
    li.innerText = `${p.name} - ${p.score}`;
    list.appendChild(li);
  });
}