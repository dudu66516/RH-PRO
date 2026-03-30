const url = "https://script.google.com/macros/s/AKfycbxdqGlqydqKBHC_P0_zN8qK9ren9k07mHuk12vdqyuvYZPUi3a1DUU-CojaArIp3w4DRQ/exec";

let dados = [];
let chart;

// INIT
document.addEventListener("DOMContentLoaded", () => {
  initNavigation();
  initBusca();
  carregarDados();
});

// MENU MOBILE
function toggleMenu() {
  document.querySelector(".sidebar").classList.toggle("active");
}

// NAV
function initNavigation() {
  document.querySelectorAll("[data-page]").forEach(item => {
    item.addEventListener("click", () => {
      mostrarPagina(item.dataset.page);
    });
  });
}

function mostrarPagina(pagina) {
  document.querySelectorAll(".pagina").forEach(p => p.style.display = "none");
  document.getElementById(pagina).style.display = "block";
}

// FETCH
async function carregarDados() {
  const res = await fetch(url);
  dados = await res.json();

  atualizarKPIs();
  renderTabela(dados);
  atualizarGrafico();
}

// KPI
function atualizarKPIs() {
  document.getElementById("total").innerText = dados.length;
  document.getElementById("aprovados").innerText =
    dados.filter(d => d.Status === "Aprovado").length;
}

// BADGE
function getBadge(status) {
  return `<span class="badge ${status === "Aprovado" ? "aprovado" :
    status === "Reprovado" ? "reprovado" : "analise"}">${status}</span>`;
}

// TABELA
function renderTabela(lista) {
  const tbody = document.getElementById("tbody");

  tbody.innerHTML = lista.map(item => `
    <tr>
      <td>${item.Nome}</td>
      <td>${item.Vaga}</td>
      <td>${getBadge(item.Status)}</td>
      <td>-</td>
      <td>${item.Curriculo ? `<a href="${item.Curriculo}" target="_blank">📄 Ver</a>` : "-"}</td>
      <td>
        <button class="btn-analise" data-id="${item.rowIndex}" data-status="Em análise">🟡</button>
        <button class="btn-aprovado" data-id="${item.rowIndex}" data-status="Aprovado">✅</button>
        <button class="btn-reprovado" data-id="${item.rowIndex}" data-status="Reprovado">❌</button>
      </td>
    </tr>
  `).join("");

  tbody.querySelectorAll("button").forEach(btn => {
    btn.addEventListener("click", () => atualizarStatus(btn));
  });
}

// UPDATE STATUS
async function atualizarStatus(btn) {
  const rowIndex = btn.dataset.id;
  const status = btn.dataset.status;

  dados = dados.map(d => {
    if (String(d.rowIndex) === String(rowIndex)) {
      return { ...d, Status: status };
    }
    return d;
  });

  atualizarKPIs();
  renderTabela(dados);
  atualizarGrafico();

  try {
    await fetch(url, {
      method: "POST",
      body: JSON.stringify({ rowIndex, status })
    });

    await carregarDados();

  } catch (err) {
    console.error(err);
  }
}

// GRAFICO
function atualizarGrafico() {
  const contagem = { "Em análise": 0, "Aprovado": 0, "Reprovado": 0 };

  dados.forEach(d => {
    contagem[d.Status]++;
  });

  if (chart) chart.destroy();

  chart = new Chart(document.getElementById("grafico"), {
    type: "doughnut",
    data: {
      labels: Object.keys(contagem),
      datasets: [{
        data: Object.values(contagem),
        backgroundColor: ["#facc15", "#22c55e", "#ef4444"]
      }]
    }
  });
}

// BUSCA
function initBusca() {
  document.getElementById("busca").addEventListener("input", e => {
    const termo = e.target.value.toLowerCase();

    const filtrado = dados.filter(d =>
      d.Nome.toLowerCase().includes(termo) ||
      d.Vaga.toLowerCase().includes(termo)
    );

    renderTabela(filtrado);
  });
}
