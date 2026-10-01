/**
 * metas.js
 * CRUD de metas financeiras, aportes (adicionar valor) e cálculo de progresso.
 */

let usuarioAtual = null;
let todasMetas = [];
let idParaExcluir = null;

document.addEventListener('DOMContentLoaded', () => {
  usuarioAtual = App.initPaginaInterna();
  if (!usuarioAtual) return;

  carregarMetas();
  initModalMeta();
  initModalAporte();
  initModalExclusao();
});

function carregarMetas() {
  todasMetas = Storage.Metas.listar(usuarioAtual.id)
    .sort((a, b) => (a.prazo || '9999-99').localeCompare(b.prazo || '9999-99'));
  renderMetas();
}

function diasRestantes(prazo) {
  if (!prazo) return null;
  const diff = new Date(prazo) - new Date(Utils.hojeISO());
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function renderMetas() {
  const grade = document.getElementById('grade-metas');
  const vazio = document.getElementById('estado-vazio-metas');

  if (todasMetas.length === 0) {
    grade.innerHTML = '';
    vazio.style.display = 'block';
    return;
  }
  vazio.style.display = 'none';

  grade.innerHTML = todasMetas.map(meta => {
    const alvo = Number(meta.valorAlvo);
    const atual = Number(meta.valorAtual) || 0;
    const progresso = alvo > 0 ? Math.min(Math.round((atual / alvo) * 100), 100) : 0;
    const concluida = progresso >= 100;
    const dias = diasRestantes(meta.prazo);

    let statusPrazo = '';
    if (meta.prazo) {
      if (concluida) statusPrazo = `Prazo: ${Utils.formatarData(meta.prazo)}`;
      else if (dias < 0) statusPrazo = `Prazo vencido (${Utils.formatarData(meta.prazo)})`;
      else statusPrazo = `${dias} dia(s) até ${Utils.formatarData(meta.prazo)}`;
    }

    return `
      <div class="card card-meta">
        ${concluida ? '<div class="card-meta__percentual"><div class="selo-concluido">OK</div></div>' : ''}
        <div class="card-meta__topo">
          <div>
            <div class="card-meta__nome">${meta.descricao}</div>
            ${statusPrazo ? `<div class="card-meta__prazo">${statusPrazo}</div>` : ''}
          </div>
        </div>

        <div class="barra-progresso">
          <div class="barra-progresso__preenchimento${concluida ? '' : progresso > 80 ? ' barra-progresso__preenchimento--alerta' : ''}" style="width:${progresso}%"></div>
        </div>

        <div class="card-meta__valores">
          <span class="mono">${Utils.formatarMoeda(atual)} <span style="color:var(--cor-texto-suave);">de</span> ${Utils.formatarMoeda(alvo)}</span>
          <strong class="mono" style="color:${concluida ? 'var(--cor-destaque)' : 'var(--cor-receita)'}">${progresso}%</strong>
        </div>

        <div class="card-meta__acoes">
          <button class="botao botao--secundario" style="flex:1; padding:8px; font-size:0.82rem;" data-aporte="${meta.id}" ${concluida ? 'disabled' : ''}>+ Adicionar valor</button>
          <button class="acao-icone" title="Editar" data-editar="${meta.id}">✎</button>
          <button class="acao-icone" title="Excluir" data-excluir="${meta.id}">🗑</button>
        </div>
      </div>
    `;
  }).join('');

  grade.querySelectorAll('[data-editar]').forEach(btn => btn.addEventListener('click', () => abrirModalEdicao(btn.dataset.editar)));
  grade.querySelectorAll('[data-excluir]').forEach(btn => btn.addEventListener('click', () => abrirModalExclusao(btn.dataset.excluir)));
  grade.querySelectorAll('[data-aporte]').forEach(btn => btn.addEventListener('click', () => abrirModalAporte(btn.dataset.aporte)));
}

/* ---------- Modal de cadastro/edição ---------- */
function initModalMeta() {
  const modal = document.getElementById('modal-meta');
  document.getElementById('botao-nova-meta').addEventListener('click', abrirModalNovo);
  modal.querySelectorAll('[data-fechar-modal]').forEach(btn => btn.addEventListener('click', () => modal.classList.remove('modal-fundo--aberto')));
  document.getElementById('form-meta').addEventListener('submit', salvarMeta);
}

function abrirModalNovo() {
  document.getElementById('titulo-modal-meta').textContent = 'Nova meta';
  document.getElementById('form-meta').reset();
  document.getElementById('meta-id').value = '';
  limparErrosMeta();
  document.getElementById('modal-meta').classList.add('modal-fundo--aberto');
}

function abrirModalEdicao(id) {
  const meta = todasMetas.find(m => m.id === id);
  if (!meta) return;

  document.getElementById('titulo-modal-meta').textContent = 'Editar meta';
  document.getElementById('meta-id').value = meta.id;
  document.getElementById('meta-descricao').value = meta.descricao;
  document.getElementById('meta-valor-alvo').value = meta.valorAlvo;
  document.getElementById('meta-valor-atual').value = meta.valorAtual || 0;
  document.getElementById('meta-prazo').value = meta.prazo || '';
  limparErrosMeta();
  document.getElementById('modal-meta').classList.add('modal-fundo--aberto');
}

function limparErrosMeta() {
  ['campo-meta-descricao', 'campo-meta-valor-alvo', 'campo-meta-valor-atual', 'campo-meta-prazo']
    .forEach(id => document.getElementById(id).classList.remove('campo--invalido'));
}

function salvarMeta(e) {
  e.preventDefault();

  const id = document.getElementById('meta-id').value;
  const descricao = document.getElementById('meta-descricao').value.trim();
  const valorAlvo = parseFloat(document.getElementById('meta-valor-alvo').value);
  const valorAtual = parseFloat(document.getElementById('meta-valor-atual').value) || 0;
  const prazo = document.getElementById('meta-prazo').value;

  let valido = true;
  limparErrosMeta();

  if (!descricao) { document.getElementById('campo-meta-descricao').classList.add('campo--invalido'); valido = false; }
  if (!Utils.validarValorPositivo(valorAlvo)) { document.getElementById('campo-meta-valor-alvo').classList.add('campo--invalido'); valido = false; }
  if (valorAtual < 0) { document.getElementById('campo-meta-valor-atual').classList.add('campo--invalido'); valido = false; }

  if (!valido) return;

  const dados = { descricao, valorAlvo, valorAtual, prazo: prazo || null };

  if (id) {
    Storage.Metas.atualizar(id, dados);
    Utils.mostrarToast('Meta atualizada com sucesso.', 'sucesso');
  } else {
    Storage.Metas.adicionar(usuarioAtual.id, dados);
    Utils.mostrarToast('Meta criada com sucesso.', 'sucesso');
  }

  document.getElementById('modal-meta').classList.remove('modal-fundo--aberto');
  carregarMetas();
}

/* ---------- Modal de aporte (adicionar valor) ---------- */
function initModalAporte() {
  const modal = document.getElementById('modal-aporte');
  modal.querySelectorAll('[data-fechar-modal]').forEach(btn => btn.addEventListener('click', () => modal.classList.remove('modal-fundo--aberto')));
  document.getElementById('form-aporte').addEventListener('submit', salvarAporte);
}

function abrirModalAporte(id) {
  document.getElementById('aporte-meta-id').value = id;
  document.getElementById('aporte-valor').value = '';
  document.getElementById('campo-aporte-valor').classList.remove('campo--invalido');
  document.getElementById('modal-aporte').classList.add('modal-fundo--aberto');
}

function salvarAporte(e) {
  e.preventDefault();
  const id = document.getElementById('aporte-meta-id').value;
  const valor = parseFloat(document.getElementById('aporte-valor').value);

  if (!Utils.validarValorPositivo(valor)) {
    document.getElementById('campo-aporte-valor').classList.add('campo--invalido');
    return;
  }

  const meta = todasMetas.find(m => m.id === id);
  const novoValorAtual = (Number(meta.valorAtual) || 0) + valor;
  Storage.Metas.atualizar(id, { valorAtual: novoValorAtual });

  document.getElementById('modal-aporte').classList.remove('modal-fundo--aberto');
  Utils.mostrarToast('Valor adicionado à meta.', 'sucesso');
  carregarMetas();
}

/* ---------- Modal de exclusão ---------- */
function initModalExclusao() {
  const modal = document.getElementById('modal-excluir-meta');
  modal.querySelectorAll('[data-fechar-modal]').forEach(btn => btn.addEventListener('click', () => modal.classList.remove('modal-fundo--aberto')));
  document.getElementById('botao-confirmar-exclusao-meta').addEventListener('click', () => {
    if (!idParaExcluir) return;
    Storage.Metas.excluir(idParaExcluir);
    modal.classList.remove('modal-fundo--aberto');
    Utils.mostrarToast('Meta excluída.', 'sucesso');
    idParaExcluir = null;
    carregarMetas();
  });
}

function abrirModalExclusao(id) {
  idParaExcluir = id;
  document.getElementById('modal-excluir-meta').classList.add('modal-fundo--aberto');
}
