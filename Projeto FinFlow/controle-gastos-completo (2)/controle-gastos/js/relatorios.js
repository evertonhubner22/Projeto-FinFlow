/**
 * relatorios.js
 * Agrega receitas/despesas por período e renderiza os gráficos analíticos.
 * Períodos: semanal, mensal, trimestral, semestral, anual.
 */

let usuarioAtual = null;
let listaGraficos = [];

document.addEventListener('DOMContentLoaded', () => {
  usuarioAtual = App.initPaginaInterna();
  if (!usuarioAtual) return;

  document.getElementById('filtro-periodo').addEventListener('change', renderizarRelatorios);
  renderizarRelatorios();
});

function mesISO(data) {
  return data.toISOString().slice(0, 7);
}

function filtrarPorMes(lista, anoMes) {
  return lista.filter(item => item.data && item.data.slice(0, 7) === anoMes);
}

function filtrarPorSemana(lista, inicioSemana, fimSemana) {
  return lista.filter(item => {
    if (!item.data) return false;
    const d = item.data;
    return d >= inicioSemana && d <= fimSemana;
  });
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
    meses.push({ chave: mesISO(d), rotulo: `${nomesMes[d.getMonth()]}/${String(d.getFullYear()).slice(2)}` });
  }
  return meses;
}

function ultimasSemanas(qtd) {
  const semanas = [];
  const hoje = new Date();
  const diaSemana = hoje.getDay(); // 0=domingo
  const inicioSemanaAtual = new Date(hoje);
  inicioSemanaAtual.setDate(hoje.getDate() - diaSemana);

  for (let i = qtd - 1; i >= 0; i--) {
    const inicio = new Date(inicioSemanaAtual);
    inicio.setDate(inicioSemanaAtual.getDate() - (i * 7));
    const fim = new Date(inicio);
    fim.setDate(inicio.getDate() + 6);

    const inicioISO = inicio.toISOString().slice(0, 10);
    const fimISO = fim.toISOString().slice(0, 10);
    const rotulo = `Sem. ${String(inicio.getDate()).padStart(2, '0')}/${String(inicio.getMonth() + 1).padStart(2, '0')}`;

    semanas.push({ chave: inicioISO, rotulo, inicio: inicioISO, fim: fimISO });
  }
  return semanas;
}

function obterPeriodos(filtro) {
  switch (filtro) {
    case 'semanal': return ultimasSemanas(8);
    case 'mensal': return ultimosMeses(6);
    case 'trimestral': return ultimosMeses(3);
    case 'semestral': return ultimosMeses(6);
    case 'anual': return ultimosMeses(12);
    default: return ultimosMeses(6);
  }
}

function filtrarPorPeriodo(lista, periodo) {
  if (periodo.inicio && periodo.fim) {
    return filtrarPorSemana(lista, periodo.inicio, periodo.fim);
  }
  return filtrarPorMes(lista, periodo.chave);
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

function destruirGraficos() {
  listaGraficos.forEach(g => g.destroy());
  listaGraficos = [];
}

function renderizarRelatorios() {
  destruirGraficos();

  const filtro = document.getElementById('filtro-periodo').value;
  const periodos = obterPeriodos(filtro);
  const cores = coresGrafico();

  const receitas = Storage.Receitas.listar(usuarioAtual.id);
  const despesas = Storage.Despesas.listar(usuarioAtual.id);
  const metas = Storage.Metas.listar(usuarioAtual.id);

  const receitasPorPeriodo = periodos.map(p => somar(filtrarPorPeriodo(receitas, p)));
  const despesasPorPeriodo = periodos.map(p => somar(filtrarPorPeriodo(despesas, p)));
  const saldoPorPeriodo = receitasPorPeriodo.map((r, i) => r - despesasPorPeriodo[i]);

  // Receitas x Despesas
  listaGraficos.push(new Chart(document.getElementById('grafico-receitas-despesas'), {
    type: 'bar',
    data: {
      labels: periodos.map(p => p.rotulo),
      datasets: [
        { label: 'Receitas', data: receitasPorPeriodo, backgroundColor: cores.receita, borderRadius: 4 },
        { label: 'Despesas', data: despesasPorPeriodo, backgroundColor: cores.despesa, borderRadius: 4 },
      ],
    },
    options: opcoesBase(cores),
  }));

  // Evolução financeira (saldo acumulado)
  let acumulado = 0;
  const saldoAcumulado = saldoPorPeriodo.map(v => (acumulado += v));
  listaGraficos.push(new Chart(document.getElementById('grafico-evolucao'), {
    type: 'line',
    data: {
      labels: periodos.map(p => p.rotulo),
      datasets: [{
        label: 'Saldo acumulado', data: saldoAcumulado, borderColor: cores.receita,
        backgroundColor: 'transparent', tension: 0.3, pointRadius: 3,
      }],
    },
    options: opcoesBase(cores),
  }));

  // Gastos por categoria (período selecionado)
  const despesasPeriodo = despesas.filter(d => periodos.some(p => filtrarPorPeriodo([d], p).length > 0));
  const porCategoria = {};
  despesasPeriodo.forEach(d => { porCategoria[d.categoria] = (porCategoria[d.categoria] || 0) + Number(d.valor); });

  listaGraficos.push(new Chart(document.getElementById('grafico-categoria-pizza'), {
    type: 'pie',
    data: {
      labels: Object.keys(porCategoria),
      datasets: [{ data: Object.values(porCategoria), backgroundColor: PALETA_CATEGORIAS, borderWidth: 0 }],
    },
    options: { responsive: true, plugins: { legend: { position: 'bottom', labels: { color: cores.texto, boxWidth: 10, font: { size: 11 } } } } },
  }));

  // Economia (área)
  listaGraficos.push(new Chart(document.getElementById('grafico-economia-area'), {
    type: 'line',
    data: {
      labels: periodos.map(p => p.rotulo),
      datasets: [{
        label: 'Economia', data: saldoPorPeriodo, borderColor: cores.destaque,
        backgroundColor: hexParaRgba(cores.destaque, 0.18), fill: true, tension: 0.3, pointRadius: 3,
      }],
    },
    options: opcoesBase(cores),
  }));

  // Receitas por período
  listaGraficos.push(new Chart(document.getElementById('grafico-receitas-mes'), {
    type: 'bar',
    data: { labels: periodos.map(p => p.rotulo), datasets: [{ label: 'Receitas', data: receitasPorPeriodo, backgroundColor: cores.receita, borderRadius: 4 }] },
    options: opcoesBase(cores, true),
  }));

  // Despesas por período
  listaGraficos.push(new Chart(document.getElementById('grafico-despesas-mes'), {
    type: 'bar',
    data: { labels: periodos.map(p => p.rotulo), datasets: [{ label: 'Despesas', data: despesasPorPeriodo, backgroundColor: cores.despesa, borderRadius: 4 }] },
    options: opcoesBase(cores, true),
  }));

  // Progresso das metas (indicador)
  const canvasMetas = document.getElementById('grafico-metas-indicador');
  if (metas.length === 0) {
    canvasMetas.getContext('2d').clearRect(0, 0, canvasMetas.width, canvasMetas.height);
  } else {
    const progressos = metas.map(m => Math.min(Math.round((Number(m.valorAtual) / Number(m.valorAlvo)) * 100), 100));
    listaGraficos.push(new Chart(canvasMetas, {
      type: 'bar',
      data: {
        labels: metas.map(m => m.descricao),
        datasets: [{ label: '% concluído', data: progressos, backgroundColor: cores.destaque, borderRadius: 4 }],
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        plugins: { legend: { display: false } },
        scales: {
          x: { max: 100, ticks: { color: cores.texto, callback: v => v + '%' }, grid: { color: cores.borda } },
          y: { ticks: { color: cores.texto }, grid: { display: false } },
        },
      },
    }));
  }
}

function opcoesBase(cores, semLegenda = false) {
  return {
    responsive: true,
    plugins: { legend: { display: !semLegenda, position: 'bottom', labels: { color: cores.texto, boxWidth: 10, font: { size: 11 } } } },
    scales: {
      x: { ticks: { color: cores.texto }, grid: { display: false } },
      y: { ticks: { color: cores.texto }, grid: { color: cores.borda } },
    },
  };
}

function hexParaRgba(hex, alpha) {
  const h = hex.replace('#', '');
  const bigint = parseInt(h, 16);
  const r = (bigint >> 16) & 255, g = (bigint >> 8) & 255, b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
