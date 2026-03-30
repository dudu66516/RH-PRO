const API = "https://script.google.com/macros/s/AKfycbxl_32ZS2tOeuHY_bvEpJaVLykpjqPWhOSt9YzEtg_D2C3AAlYAqyYGL6qj_mUVMW5K4Q/exec";

let candidatos = [];
let grafico;

/* MENU */
function toggleMenu() {
  document.querySelector(".sidebar").classList.toggle("active");
}

/* PAGINAS */
function mostrarPagina(pagina) {
  document.querySelectorAll(".pagina").forEach(p => p.style.display = "none");
  document.getElementById(pagina).style.display = "block";
}

/* 🔥 CARREGAR DADOS (AJUSTADO PRA SUA API REAL) */
async function carregarDados() {
  try {
    const res = await fetch(API);
    const dados = await res.json();

    console.log("API DATA:", dados); // 🔥 debug

    // remove header
    const linhas = dados.slice(1);

    candidatos = linhas.map((linha, index) => ({
      nome: linha[1] || "-",
      vaga: linha[3] || "-",
      curriculo: linha[4] || "",
      status: linha[5] || "Em análise",
      linhaReal: index + 2
    }));

    atualizarTabela();
    atualizarDashboard();

  } catch (erro) {
    console.error("Erro ao carregar dados:", erro);
  }
}

/* TABELA */
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

/* 🔥 MUDAR STATUS */
async function mudarStatus(index, status) {

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

/* DASHBOARD */
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

/* BUSCA */
document.addEventListener("DOMContentLoaded", () => {

  carregarDados();

  document.getElementById("busca").addEventListener("input", e => {
    const termo = e.target.value.toLowerCase();

    const filtrado = candidatos.filter(c =>
      c.nome.toLowerCase().includes(termo) ||
      c.vaga.toLowerCase().includes(termo)
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
