const API = "https://script.google.com/macros/s/AKfycbxl_32ZS2tOeuHY_bvEpJaVLykpjqPWhOSt9YzEtg_D2C3AAlYAqyYGL6qj_mUVMW5K4Q/exec";

let candidatos = [];
let grafico;
let salvando = new Set(); // 🔥 controla quem está salvando

/* PAGINA */
function mostrarPagina(p) {
  document.querySelectorAll(".pagina").forEach(el => el.style.display = "none");
  document.getElementById(p).style.display = "block";
}

/* TOAST */
function mostrarToast(msg, cor = "#22c55e") {
  const toast = document.getElementById("toast");
  toast.innerText = msg;
  toast.style.background = cor;
  toast.style.display = "block";

  setTimeout(() => {
    toast.style.display = "none";
  }, 2000);
}

/* CARREGAR */
async function carregarDados() {
  try {
    const res = await fetch(API);
    const dados = await res.json();

    const linhas = dados.slice(1);

    candidatos = linhas.map((l, i) => ({
      nome: l[1],
      vaga: l[3],
      curriculo: l[4],
      status: l[5],
      linha: i + 2
    }));

    render();

  } catch (e) {
    console.error(e);
    mostrarToast("Erro ao carregar dados", "#ef4444");
  }
}

/* RENDER */
function render() {
  renderTabela();
  renderGrafico();
}

/* TABELA */
function renderTabela() {
  const tbody = document.getElementById("tbody");
  tbody.innerHTML = "";

  candidatos.forEach((c, i) => {

    const bloqueado = salvando.has(c.linha);

    tbody.innerHTML += `
      <tr>
        <td>${c.nome}</td>
        <td>${c.vaga}</td>
        <td>${c.status}</td>
        <td>${c.curriculo ? `<a href="${c.curriculo}" target="_blank">Ver</a>` : "-"}</td>
        <td>
          <button ${bloqueado ? "disabled" : ""} onclick="mudarStatus(${i}, 'Em análise')" class="btn-analise">🟡</button>
          <button ${bloqueado ? "disabled" : ""} onclick="mudarStatus(${i}, 'Aprovado')" class="btn-aprovado">✅</button>
          <button ${bloqueado ? "disabled" : ""} onclick="mudarStatus(${i}, 'Reprovado')" class="btn-reprovado">❌</button>
        </td>
      </tr>
    `;
  });
}

/* 🔥 STATUS SEM DELAY REAL */
function mudarStatus(i, status) {

  const c = candidatos[i];

  // 🔒 evita múltiplos cliques
  if (salvando.has(c.linha)) return;

  salvando.add(c.linha);

  // ⚡ atualização instantânea
  c.status = status;
  render();

  mostrarToast("Salvando...", "#facc15");

  // 🚀 FIRE AND FORGET (não espera)
  fetch(API, {
    method: "POST",
    body: JSON.stringify({
      linha: c.linha,
      status: status
    })
  })
  .then(() => {
    mostrarToast("✅ Salvo com sucesso!");
  })
  .catch(() => {
    mostrarToast("Erro ao salvar", "#ef4444");
  })
  .finally(() => {
    salvando.delete(c.linha);
    render(); // reativa botões
  });
}

/* GRAFICO */
function renderGrafico() {

  const counts = {
    "Em análise": 0,
    "Aprovado": 0,
    "Reprovado": 0
  };

  candidatos.forEach(c => counts[c.status]++);

  if (grafico) grafico.destroy();

  grafico = new Chart(document.getElementById("grafico"), {
    type: "doughnut",
    data: {
      labels: Object.keys(counts),
      datasets: [{
        data: Object.values(counts),
        backgroundColor: ["#facc15", "#22c55e", "#ef4444"]
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false
    }
  });

  document.getElementById("total").innerText = candidatos.length;
  document.getElementById("aprovados").innerText = counts["Aprovado"];
}

/* BUSCA */
document.addEventListener("DOMContentLoaded", () => {

  carregarDados();

  document.getElementById("busca").addEventListener("input", e => {
    const t = e.target.value.toLowerCase();

    const filtrado = candidatos.filter(c =>
      c.nome.toLowerCase().includes(t) ||
      c.vaga.toLowerCase().includes(t)
    );

    const tbody = document.getElementById("tbody");
    tbody.innerHTML = "";

    filtrado.forEach((c, i) => {
      tbody.innerHTML += `
        <tr>
          <td>${c.nome}</td>
          <td>${c.vaga}</td>
          <td>${c.status}</td>
          <td>${c.curriculo ? `<a href="${c.curriculo}" target="_blank">Ver</a>` : "-"}</td>
          <td>
            <button onclick="mudarStatus(${i}, 'Em análise')" class="btn-analise">🟡</button>
            <button onclick="mudarStatus(${i}, 'Aprovado')" class="btn-aprovado">✅</button>
            <button onclick="mudarStatus(${i}, 'Reprovado')" class="btn-reprovado">❌</button>
          </td>
        </tr>
      `;
    });
  });

});
