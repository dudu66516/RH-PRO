const url = "https://script.google.com/macros/s/AKfycbybs1NfUfWZx05jO2tclT4RF8qgnLXx9UnmnlImx_qcNCnIySVyK-wYbv_ncePnfFn4-Q/exec";

let dados = [];
let chart;

// INIT
document.addEventListener("DOMContentLoaded", () => {
  initNavigation();
  initBusca();
  carregarDados();
});

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

  document.querySelectorAll(".sidebar li").forEach(li => li.classList.remove("active"));
  document.querySelector(`[data-page="${pagina}"]`).classList.add("active");
}

// FETCH DADOS
async function carregarDados() {
  try {
    const res = await fetch(url);
    dados = await res.json();

    atualizarKPIs();
    renderTabela(dados);
    atualizarGrafico();

  } catch (err) {
    console.error("Erro ao carregar dados:", err);
  }
}

// KPI ANIMADO
function animarNumero(id, valorFinal) {
  let atual = 0;
  const incremento = Math.ceil(valorFinal / 30) || 1;

  const intervalo = setInterval(() => {
    atual += incremento;
    if (atual >= valorFinal) {
      atual = valorFinal;
      clearInterval(intervalo);
    }
    document.getElementById(id).innerText = atual;
  }, 30);
}

function atualizarKPIs() {
  const aprovados = dados.filter(d => d.Status === "Aprovado");

  animarNumero("total", dados.length);
  animarNumero("aprovados", aprovados.length);
}

// BADGE
function getBadge(status) {
  const map = {
    "Aprovado": "aprovado",
    "Reprovado": "reprovado",
    "Em análise": "analise"
  };
  return `<span class="badge ${map[status] || "pendente"}">${status}</span>`;
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

  // eventos dos botões
  tbody.querySelectorAll("button").forEach(btn => {
    btn.addEventListener("click", () => atualizarStatus(btn));
  });
}

// 🚀 ATUALIZA STATUS (SEM BUG + SEM DELAY)
async function atualizarStatus(btn) {
  const rowIndex = btn.dataset.id;
  const status = btn.dataset.status;

  let nome = "";

  // 🔥 UI instantânea
  dados = dados.map(d => {
    if (String(d.rowIndex) === String(rowIndex)) {
      nome = d.Nome;
      return { ...d, Status: status };
    }
    return d;
  });

  document.getElementById("lastAction").innerText =
    `Última ação: ${nome} → ${status}`;

  atualizarKPIs();
  renderTabela(dados);
  atualizarGrafico();

  btn.innerText = "⏳";

  try {
    // 🔥 AGORA ESPERA RESPOSTA REAL DO BACKEND
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ rowIndex, status })
    });

    const json = await res.json();

    if (json.success) {
      btn.innerText = "✔️";

      // 🔥 sincroniza com dados reais (sem bug)
      await carregarDados();

    } else {
      throw new Error(json.error);
    }

  } catch (err) {
    console.error("Erro ao atualizar:", err);
    btn.innerText = "❌";
  }
}

// GRAFICO
const centerTextPlugin = {
  id: "centerText",
  beforeDraw(chart) {
    const ctx = chart.ctx;
    const total = chart.data.datasets[0].data.reduce((a, b) => a + b, 0);

    ctx.save();
    ctx.font = "bold 24px Arial";
    ctx.fillStyle = "#fff";
    ctx.textAlign = "center";
    ctx.fillText(total, chart.width / 2, chart.height / 2);

    ctx.font = "12px Arial";
    ctx.fillStyle = "#94a3b8";
    ctx.fillText("Candidatos", chart.width / 2, chart.height / 2 + 20);
    ctx.restore();
  }
};

function atualizarGrafico() {
  const contagem = {
    "Em análise": 0,
    "Aprovado": 0,
    "Reprovado": 0
  };

  dados.forEach(d => {
    contagem[d.Status] = (contagem[d.Status] || 0) + 1;
  });

  const data = {
    labels: Object.keys(contagem),
    datasets: [{
      data: Object.values(contagem),
      backgroundColor: ["#facc15", "#22c55e", "#ef4444"]
    }]
  };

  if (!chart) {
    chart = new Chart(document.getElementById("grafico"), {
      type: "doughnut",
      data,
      options: {
        cutout: "70%",
        plugins: {
          legend: {
            labels: { color: "#fff" }
          }
        }
      },
      plugins: [centerTextPlugin]
    });
  } else {
    chart.data = data;
    chart.update();
  }
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