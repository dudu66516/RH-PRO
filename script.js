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

/* 🔥 CARREGAR DADOS (100% INTELIGENTE) */
async function carregarDados() {
  try {
    const res = await fetch(API);
    const dados = await res.json();

    // 🧠 CASO 1: PLANILHA (array de arrays)
    if (Array.isArray(dados) && Array.isArray(dados[0])) {

      const temHeader = dados[0][1] === "Nome";
      const linhas = temHeader ? dados.slice(1) : dados;

      candidatos = linhas
        .filter(linha => linha[1]) // ignora vazios
        .map((linha, index) => ({
          nome: linha[1] || "-",
          vaga: linha[3] || "-",
          curriculo: linha[4] || "",
          status: linha[5] || "Em análise",
          linhaReal: index + (temHeader ? 2 : 1)
        }));

    }

    // 🧠 CASO 2: JSON (array de objetos)
    else if (Array.isArray(dados)) {

      candidatos = dados.map((item, index) => ({
        nome: item.nome || "-",
        vaga: item.vaga || "-",
        curriculo: item.curriculo || "",
        status: item.status || "Em análise",
        linhaReal: index + 2
      }));

    }

    atualizarTabela();
    atualizarDashboard();

  } catch (erro) {
    console.error("Erro ao carregar dados:", erro);
  }
}

/* 📋 TABELA */
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
        <td>${c.curriculo ? `<a href="${c.curriculo}" target="_blank">Ver</a>` : "-"}</td>
        <td>
          <button class="btn-analise" onclick="mudarStatus(${i}, 'Em análise')">🟡</button>
          <button class="btn-aprovado" onclick="mudarStatus(${i}, 'Aprovado')">✅</button>
          <button class="btn-reprovado" onclick="mudarStatus(${i}, 'Reprovado')">❌</button>
        </td>
      </tr>
    `;
  });
}

/* 🔥 MUDAR STATUS (SEM BUG E SEM DELAY) */
async function mudarStatus(index, status) {

  // Atualiza na tela na hora
  candidatos[index].status = status;
  atualizarTabela();
  atualizarDashboard();

  try {
    await fetch(API, {
      method: "POST",
      body: JSON.stringify({
        linha: candidatos[index].linhaReal,
        status: status
      })
    });

  } catch (erro) {
    console.error("Erro ao salvar:", erro);
  }
}

/* 📊 DASHBOARD */
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

/* 🔍 BUSCA */
document.addEventListener("DOMContentLoaded", () => {

  carregarDados();

  document.getElementById("busca").addEventListener("input", e => {
    const termo = e.target.value.toLowerCase();

    const filtrado = candidatos.filter(c =>
      (c.nome || "").toLowerCase().includes(termo) ||
      (c.vaga || "").toLowerCase().includes(termo)
    );

    const tbody = document.getElementById("tbody");
    tbody.innerHTML = "";

    filtrado.forEach((c, i) => {
      tbody.innerHTML += `
        <tr>
          <td>${c.nome}</td>
          <td>${c.vaga}</td>
          <td>${c.status}</td>
          <td>-</td>
          <td>${c.curriculo ? `<a href="${c.curriculo}" target="_blank">Ver</a>` : "-"}</td>
          <td>
            <button class="btn-analise" onclick="mudarStatus(${i}, 'Em análise')">🟡</button>
            <button class="btn-aprovado" onclick="mudarStatus(${i}, 'Aprovado')">✅</button>
            <button class="btn-reprovado" onclick="mudarStatus(${i}, 'Reprovado')">❌</button>
          </td>
        </tr>
      `;
    });
  });

});
