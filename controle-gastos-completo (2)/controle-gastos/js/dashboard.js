/**
 * dashboard.js
 * Calcula métricas, renderiza gráficos (Chart.js) e gera
 * as sugestões automáticas de inteligência financeira.
 */

let usuarioAtual = null;
let graficoCategorias = null;
let graficoMensal = null;

document.addEventListener('DOMContentLoaded', () => {
  usuarioAtual = App.initPaginaInterna();
  if (!usuarioAtual) return;

  // Inicializa o modal primeiro para garantir que ele funcione
  // mesmo se os gráficos falharem (ex: sem dados cadastrados)
  initModalRenda();

  try {
    renderizarTudo();
  } catch (e) {
    console.error('Erro ao renderizar dashboard:', e);
  }
});

function mesAtualISO(data = new Date()) {
  return data.toISOString().slice(0, 7); // YYYY-MM
}

function filtrarPorMes(lista, anoMes) {
  return lista.filter(item => item.data && item.data.slice(0, 7) === anoMes);
}

function somar(lista) {
  return lista.reduce((total, item) => total + Number(item.valor || 0), 0);
}

function ultimosMeses(qtd) {
  const meses = [];
  const nomesMes = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const hoje = new Date();
  for (let i = qtd - 1; i >= 0; i--) {
    const d = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
    meses.push({ chave: mesAtualISO(d), rotulo: nomesMes[d.getMonth()] });
  }
  return meses;
}

function renderizarTudo() {
  const receitas = Storage.Receitas.listar(usuarioAtual.id);
  const despesas = Storage.Despesas.listar(usuarioAtual.id);
  const metas = Storage.Metas.listar(usuarioAtual.id);
  const renda = Storage.getRenda(usuarioAtual.id);

  const mesAtual = mesAtualISO();
  const mesPassado = mesAtualISO(new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1));

  const receitasMes = filtrarPorMes(receitas, mesAtual);
  const despesasMes = filtrarPorMes(despesas, mesAtual);
  const despesasMesPassado = filtrarPorMes(despesas, mesPassado);
  const receitasMesPassado = filtrarPorMes(receitas, mesPassado);

  const totalReceitas = somar(receitasMes);
  const totalDespesas = somar(despesasMes);
  const saldo = totalReceitas - totalDespesas;
  const economiaMes = saldo;
  const economiaMesPassado = somar(receitasMesPassado) - somar(despesasMesPassado);

  const baseParaPercentual = renda > 0 ? renda : totalReceitas;
  const percentualGasto = baseParaPercentual > 0 ? Math.round((totalDespesas / baseParaPercentual) * 100) : 0;

  renderCards({ saldo, totalReceitas, totalDespesas, economiaMes, percentualGasto });
  renderPlanejamento({ renda, totalReceitas, totalDespesas, percentualGasto });
  renderGraficoCategorias(despesasMes);
  renderGraficoMensal(receitas, despesas);
  renderMetasResumo(metas);
  renderInsights({ despesasMes, totalDespesas, totalReceitas, economiaMes, economiaMesPassado, percentualGasto, renda });
}

function renderCards({ saldo, totalReceitas, totalDespesas, economiaMes, percentualGasto }) {
  const container = document.getElementById('cards-metricas');
  container.innerHTML = `
    <div class="card card-metrica">
      <div class="rotulo">Saldo atual (mês)</div>
      <div class="valor valor-monetario">${Utils.formatarMoeda(saldo)}</div>
      <div class="variacao ${saldo >= 0 ? 'variacao--positiva' : 'variacao--negativa'}">${saldo >= 0 ? 'Positivo' : 'Negativo'} neste mês</div>
    </div>
    <div class="card card-metrica">
      <div class="rotulo">Total de receitas</div>
      <div class="valor valor-monetario">${Utils.formatarMoeda(totalReceitas)}</div>
      <div class="variacao">Referente ao mês atual</div>
    </div>
    <div class="card card-metrica">
      <div class="rotulo">Total de despesas</div>
      <div class="valor valor-monetario">${Utils.formatarMoeda(totalDespesas)}</div>
      <div class="variacao">Referente ao mês atual</div>
    </div>
    <div class="card card-metrica">
      <div class="rotulo">% da renda comprometida</div>
      <div class="valor valor-monetario">${percentualGasto}%</div>
      <div class="variacao ${percentualGasto > 90 ? 'variacao--negativa' : 'variacao--positiva'}">${percentualGasto > 90 ? 'Atenção ao limite' : 'Dentro do esperado'}</div>
    </div>
  `;
}

function renderPlanejamento({ renda, totalReceitas, totalDespesas, percentualGasto }) {
  const base = renda > 0 ? renda : totalReceitas;
  const disponivel = base - totalDespesas;
  const sugestaoEconomia = base * 0.2;
  const container = document.getElementById('conteudo-planejamento');

  if (base === 0) {
    container.innerHTML = `<div class="estado-vazio" style="padding:20px 0;">
      <h3>Nenhuma renda ou receita registrada</h3>
      <p>Defina sua renda mensal ou cadastre receitas para ver o planejamento.</p>
    </div>`;
    return;
  }

  container.innerHTML = `
    <div class="linha-campos" style="margin-bottom:16px;">
      <div>
        <div style="font-size:0.8rem; color:var(--cor-texto-suave); margin-bottom:4px;">${renda > 0 ? 'Renda informada' : 'Baseado em receitas'}</div>
        <div class="valor-monetario" style="font-size:1.1rem; font-weight:600;">${Utils.formatarMoeda(base)}</div>
      </div>
      <div>
        <div style="font-size:0.8rem; color:var(--cor-texto-suave); margin-bottom:4px;">Saldo disponível</div>
        <div class="valor-monetario" style="font-size:1.1rem; font-weight:600; color:${disponivel >= 0 ? 'var(--cor-receita)' : 'var(--cor-despesa)'}">${Utils.formatarMoeda(disponivel)}</div>
      </div>
    </div>
    <div style="margin-bottom:6px; display:flex; justify-content:space-between; font-size:0.82rem;">
      <span>Percentual gasto</span><span class="mono">${percentualGasto}%</span>
    </div>
    <div class="barra-progresso">
      <div class="barra-progresso__preenchimento${percentualGasto > 100 ? ' barra-progresso__preenchimento--excedido' : percentualGasto > 80 ? ' barra-progresso__preenchimento--alerta' : ''}" style="width:${Math.min(percentualGasto, 100)}%"></div>
    </div>
    <p style="font-size:0.82rem; color:var(--cor-texto-suave); margin-top:12px;">
      Você ainda pode gastar <strong class="mono">${Utils.formatarMoeda(Math.max(disponivel, 0))}</strong> este mês.
      Para manter uma reserva saudável, considere economizar ao menos <strong class="mono">${Utils.formatarMoeda(sugestaoEconomia)}</strong> (20% da base).
    </p>
  `;
}

function coresGrafico() {
  const estilo = getComputedStyle(document.documentElement);
  return {
    texto: estilo.getPropertyValue('--cor-texto-suave').trim(),
    borda: estilo.getPropertyValue('--cor-borda').trim(),
    receita: estilo.getPropertyValue('--cor-receita').trim(),
    despesa: estilo.getPropertyValue('--cor-despesa').trim(),
    destaque: estilo.getPropertyValue('--cor-destaque').trim(),
  };
}

const PALETA_CATEGORIAS = ['#2F6F4E', '#B8860B', '#5B7FA6', '#8B3A3A', '#6B5B95', '#4E8098', '#A66B4E', '#7A8B5B', '#9C6B9C'];

function renderGraficoCategorias(despesasMes) {
  const porCategoria = {};
  despesasMes.forEach(d => {
    porCategoria[d.categoria] = (porCategoria[d.categoria] || 0) + Number(d.valor);
  });

  const categorias = Object.keys(porCategoria);
  const valores = Object.values(porCategoria);
  const ctx = document.getElementById('grafico-categorias');
  const cores = coresGrafico();

  if (graficoCategorias) graficoCategorias.destroy();

  if (categorias.length === 0) {
    ctx.getContext('2d').clearRect(0, 0, ctx.width, ctx.height);
    return;
  }

  graficoCategorias = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: categorias,
      datasets: [{ data: valores, backgroundColor: PALETA_CATEGORIAS, borderWidth: 0 }],
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: 'bottom', labels: { color: cores.texto, boxWidth: 10, padding: 12, font: { size: 11 } } },
      },
    },
  });
}

function renderGraficoMensal(receitas, despesas) {
  const meses = ultimosMeses(6);
  const cores = coresGrafico();
  const dadosReceitas = meses.map(m => somar(filtrarPorMes(receitas, m.chave)));
  const dadosDespesas = meses.map(m => somar(filtrarPorMes(despesas, m.chave)));

  const ctx = document.getElementById('grafico-mensal');
  if (graficoMensal) graficoMensal.destroy();

  graficoMensal = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: meses.map(m => m.rotulo),
      datasets: [
        { label: 'Receitas', data: dadosReceitas, backgroundColor: cores.receita, borderRadius: 4 },
        { label: 'Despesas', data: dadosDespesas, backgroundColor: cores.despesa, borderRadius: 4 },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: 'bottom', labels: { color: cores.texto, boxWidth: 10, padding: 12, font: { size: 11 } } },
      },
      scales: {
        x: { ticks: { color: cores.texto }, grid: { display: false } },
        y: { ticks: { color: cores.texto }, grid: { color: cores.borda } },
      },
    },
  });
}

function renderMetasResumo(metas) {
  const container = document.getElementById('lista-metas-resumo');

  if (metas.length === 0) {
    container.innerHTML = `<div class="estado-vazio" style="padding:16px 0;"><p>Nenhuma meta criada ainda.</p></div>`;
    return;
  }

  container.innerHTML = metas.slice(0, 3).map(meta => {
    const progresso = Math.min(Math.round((Number(meta.valorAtual) / Number(meta.valorAlvo)) * 100), 100);
    const concluida = progresso >= 100;
    return `
      <div class="mini-meta">
        <div class="mini-meta__info">
          <div class="mini-meta__topo">
            <span class="mini-meta__nome">${meta.descricao}</span>
            <span class="mono">${progresso}%</span>
          </div>
          <div class="barra-progresso">
            <div class="barra-progresso__preenchimento${concluida ? '' : progresso > 80 ? ' barra-progresso__preenchimento--alerta' : ''}" style="width:${progresso}%"></div>
          </div>
        </div>
        ${concluida ? '<div class="selo-concluido" style="width:32px;height:32px;font-size:0.55rem;">OK</div>' : ''}
      </div>
    `;
  }).join('');
}

function renderInsights({ despesasMes, totalDespesas, totalReceitas, economiaMes, economiaMesPassado, percentualGasto, renda }) {
  const container = document.getElementById('lista-insights');
  const insights = [];

  if (percentualGasto > 0) {
    insights.push({ icone: '◎', texto: `Você utilizou ${percentualGasto}% da sua ${renda > 0 ? 'renda' : 'receita'} este mês.` });
  }

  if (percentualGasto >= 90) {
    insights.push({ icone: '⚠', texto: 'Você está próximo do limite. Evite novos gastos até o fim do mês.' });
  }

  if (economiaMes > economiaMesPassado) {
    insights.push({ icone: '↑', texto: 'Você economizou mais que no mês anterior. Continue assim.' });
  } else if (economiaMesPassado > 0 && economiaMes < economiaMesPassado) {
    insights.push({ icone: '↓', texto: 'Sua economia caiu em relação ao mês anterior.' });
  }

  if (despesasMes.length > 0) {
    const porCategoria = {};
    despesasMes.forEach(d => { porCategoria[d.categoria] = (porCategoria[d.categoria] || 0) + Number(d.valor); });
    const [maiorCategoria, maiorValor] = Object.entries(porCategoria).sort((a, b) => b[1] - a[1])[0];
    insights.push({ icone: '▤', texto: `Seu maior gasto foi com ${maiorCategoria} (${Utils.formatarMoeda(maiorValor)}).` });

    if (porCategoria['Lazer'] && porCategoria['Lazer'] / totalDespesas > 0.15) {
      insights.push({ icone: '◐', texto: 'Você pode economizar reduzindo gastos com Lazer este mês.' });
    }
  }

  if (insights.length === 0) {
    container.innerHTML = `<div class="estado-vazio" style="padding:10px 0;"><p>Cadastre receitas e despesas para receber sugestões personalizadas.</p></div>`;
    return;
  }

  container.innerHTML = insights.map(i => `
    <div class="alerta-insight">
      <span class="alerta-insight__icone">${i.icone}</span>
      <span>${i.texto}</span>
    </div>
  `).join('');
}

function initModalRenda() {
  const modal = document.getElementById('modal-renda');
  const botaoAbrir = document.getElementById('botao-definir-renda');
  const inputRenda = document.getElementById('input-renda');
  const campoRenda = document.getElementById('campo-renda');
  const form = document.getElementById('form-renda');

  botaoAbrir.addEventListener('click', () => {
    inputRenda.value = Storage.getRenda(usuarioAtual.id) || '';
    modal.classList.add('modal-fundo--aberto');
  });

  modal.querySelectorAll('[data-fechar-modal]').forEach(btn => {
    btn.addEventListener('click', () => modal.classList.remove('modal-fundo--aberto'));
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const valor = parseFloat(inputRenda.value);
    if (!Utils.validarValorPositivo(valor)) {
      campoRenda.classList.add('campo--invalido');
      return;
    }
    campoRenda.classList.remove('campo--invalido');
    Storage.setRenda(usuarioAtual.id, valor);
    modal.classList.remove('modal-fundo--aberto');
    Utils.mostrarToast('Renda mensal atualizada.', 'sucesso');
    renderizarTudo();
  });
}
