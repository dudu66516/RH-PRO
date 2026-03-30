const API = "https://script.google.com/macros/s/AKfycbxdqGlqydqKBHC_P0_zN8qK9ren9k07mHuk12vdqyuvYZPUi3a1DUU-CojaArIp3w4DRQ/exec";

let candidatos = [];
let grafico;

/* MENU MOBILE */
function toggleMenu() {
  document.querySelector(".sidebar").classList.toggle("active");
}

/* TROCAR PAGINA */
function mostrarPagina(pagina) {
  document.querySelectorAll(".pagina").forEach(p => p.style.display = "none");
  document.getElementById(pagina).style.display = "block";
}

/* 🔥 BUSCAR DADOS */
async function carregarDados() {
  try {
    const res = await fetch(API);
    candidatos = await res.json();

    atualizarTabela();
    atualizarDashboard();

  } catch (erro) {
    console.error("Erro ao carregar dados:", erro);
  }
}

/* 🔥 TABELA */
function atualizarTabela() {
  const tbody = document.getElementById("tbody");
  tbody.innerHTML = "";

  candidatos.forEach((c, i) => {
    tbody.innerHTML += `
      <tr>
        <td>${c.nome}</td>
        <td>${c.vaga}</td>
        <td>${c.status}</td>
        <td>-</td>
        <td><a href="${c.curriculo}" target="_blank">Ver</a></td>
        <td>
          <button class="btn-analise" onclick="mudarStatus(${i}, 'Em análise')">🟡</button>
          <button class="btn-aprovado" onclick="mudarStatus(${i}, 'Aprovado')">✅</button>
          <button class="btn-reprovado" onclick="mudarStatus(${i}, 'Reprovado')">❌</button>
        </td>
      </tr>
    `;
  });
}

/* 🔥 MUDAR STATUS (SEM DELAY + SEM VOLTAR) */
async function mudarStatus(index, status) {

  // Atualiza na tela IMEDIATO
  candidatos[index].status = status;
  atualizarTabela();
  atualizarDashboard();

  try {
    await fetch(API, {
      method: "POST",
      body: JSON.stringify({
        linha: index + 2,
        status: status
      })
    });

  } catch (erro) {
    console.error("Erro ao salvar:", erro);
  }
}

/* 🔥 DASHBOARD */
function atualizarDashboard() {
  const total = candidatos.length;
  const aprovados = candidatos.filter(c => c.status === "Aprovado").length;
  const analise = candidatos.filter(c => c.status === "Em análise").length;
  const reprovado = candidatos.filter(c => c.status === "Reprovado").length;

  document.getElementById("total").innerText = total;
  document.getElementById("aprovados").innerText = aprovados;

  if (grafico) grafico.destroy();

  grafico = new Chart(document.getElementById("grafico"), {
    type: "doughnut",
    data: {
      labels: ["Em análise", "Aprovado", "Reprovado"],
      datasets: [{
        data: [analise, aprovados, reprovado],
        backgroundColor: ["#facc15", "#22c55e", "#ef4444"]
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false
    }
  });
}

/* INIT */
carregarDados();
