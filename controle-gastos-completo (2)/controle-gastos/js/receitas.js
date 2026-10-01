/**
 * receitas.js
 * CRUD completo de receitas com busca, filtro por categoria e paginação simulada.
 */

let usuarioAtual = null;
let todasReceitas = [];
let receitasFiltradas = [];
let paginaAtual = 1;
const ITENS_POR_PAGINA = 6;
let idParaExcluir = null;

document.addEventListener('DOMContentLoaded', () => {
  usuarioAtual = App.initPaginaInterna();
  if (!usuarioAtual) return;

  carregarReceitas();
  initFiltros();
  initModalReceita();
  initModalExclusao();
});

function carregarReceitas() {
  todasReceitas = Storage.Receitas.listar(usuarioAtual.id)
    .sort((a, b) => new Date(b.data) - new Date(a.data));
  aplicarFiltros();
}

function initFiltros() {
  const busca = document.getElementById('busca-receitas');
  const filtroCategoria = document.getElementById('filtro-categoria-receita');

  busca.addEventListener('input', Utils.debounce(() => { paginaAtual = 1; aplicarFiltros(); }, 250));
  filtroCategoria.addEventListener('change', () => { paginaAtual = 1; aplicarFiltros(); });
}

function aplicarFiltros() {
  const termo = document.getElementById('busca-receitas').value.trim().toLowerCase();
  const categoria = document.getElementById('filtro-categoria-receita').value;

  receitasFiltradas = todasReceitas.filter(r => {
    const combinaTermo = !termo || r.descricao.toLowerCase().includes(termo);
    const combinaCategoria = !categoria || r.categoria === categoria;
    return combinaTermo && combinaCategoria;
  });

  renderTabela();
  renderPaginacao();
}

function renderTabela() {
  const corpo = document.getElementById('corpo-tabela-receitas');
  const vazio = document.getElementById('estado-vazio-receitas');

  if (receitasFiltradas.length === 0) {
    corpo.innerHTML = '';
    vazio.style.display = 'block';
    return;
  }
  vazio.style.display = 'none';

  const inicio = (paginaAtual - 1) * ITENS_POR_PAGINA;
  const pagina = receitasFiltradas.slice(inicio, inicio + ITENS_POR_PAGINA);

  corpo.innerHTML = pagina.map(r => `
    <tr>
      <td>${r.descricao}</td>
      <td><span class="badge badge--receita">${r.categoria}</span></td>
      <td>${Utils.formatarData(r.data)}</td>
      <td class="valor-monetario" style="color:var(--cor-receita); font-weight:600;">${Utils.formatarMoeda(r.valor)}</td>
      <td>
        <div class="acoes-linha">
          <button class="acao-icone" title="Editar" data-editar="${r.id}">✎</button>
          <button class="acao-icone" title="Excluir" data-excluir="${r.id}">🗑</button>
        </div>
      </td>
    </tr>
  `).join('');

  corpo.querySelectorAll('[data-editar]').forEach(btn =>
    btn.addEventListener('click', () => abrirModalEdicao(btn.dataset.editar)));
  corpo.querySelectorAll('[data-excluir]').forEach(btn =>
    btn.addEventListener('click', () => abrirModalExclusao(btn.dataset.excluir)));
}

function renderPaginacao() {
  const container = document.getElementById('paginacao-receitas');
  const totalPaginas = Math.ceil(receitasFiltradas.length / ITENS_POR_PAGINA);

  if (totalPaginas <= 1) { container.innerHTML = ''; return; }

  let html = '';
  for (let i = 1; i <= totalPaginas; i++) {
    html += `<button class="${i === paginaAtual ? 'ativo' : ''}" data-pagina="${i}">${i}</button>`;
  }
  container.innerHTML = html;

  container.querySelectorAll('[data-pagina]').forEach(btn => {
    btn.addEventListener('click', () => {
      paginaAtual = Number(btn.dataset.pagina);
      renderTabela();
      renderPaginacao();
    });
  });
}

/* ---------- Modal de cadastro/edição ---------- */
function initModalReceita() {
  const modal = document.getElementById('modal-receita');
  const form = document.getElementById('form-receita');

  document.getElementById('botao-nova-receita').addEventListener('click', abrirModalNovo);

  modal.querySelectorAll('[data-fechar-modal]').forEach(btn =>
    btn.addEventListener('click', () => modal.classList.remove('modal-fundo--aberto')));

  form.addEventListener('submit', salvarReceita);
}

function abrirModalNovo() {
  document.getElementById('titulo-modal-receita').textContent = 'Nova receita';
  document.getElementById('form-receita').reset();
  document.getElementById('receita-id').value = '';
  document.getElementById('receita-data').value = Utils.hojeISO();
  document.getElementById('receita-data').max = Utils.hojeISO();
  limparErrosReceita();
  document.getElementById('modal-receita').classList.add('modal-fundo--aberto');
}

function abrirModalEdicao(id) {
  const receita = todasReceitas.find(r => r.id === id);
  if (!receita) return;

  document.getElementById('titulo-modal-receita').textContent = 'Editar receita';
  document.getElementById('receita-id').value = receita.id;
  document.getElementById('receita-descricao').value = receita.descricao;
  document.getElementById('receita-valor').value = receita.valor;
  document.getElementById('receita-data').value = receita.data;
  document.getElementById('receita-data').max = Utils.hojeISO();
  document.getElementById('receita-categoria').value = receita.categoria;
  limparErrosReceita();
  document.getElementById('modal-receita').classList.add('modal-fundo--aberto');
}

function limparErrosReceita() {
  ['campo-receita-descricao', 'campo-receita-valor', 'campo-receita-data', 'campo-receita-categoria']
    .forEach(id => document.getElementById(id).classList.remove('campo--invalido'));
}

function salvarReceita(e) {
  e.preventDefault();

  const id = document.getElementById('receita-id').value;
  const descricao = document.getElementById('receita-descricao').value.trim();
  const valor = parseFloat(document.getElementById('receita-valor').value);
  const data = document.getElementById('receita-data').value;
  const categoria = document.getElementById('receita-categoria').value;

  let valido = true;
  limparErrosReceita();

  if (!descricao) { document.getElementById('campo-receita-descricao').classList.add('campo--invalido'); valido = false; }
  if (!Utils.validarValorPositivo(valor)) { document.getElementById('campo-receita-valor').classList.add('campo--invalido'); valido = false; }
  if (!data || !Utils.validarDataNaoFutura(data)) { document.getElementById('campo-receita-data').classList.add('campo--invalido'); valido = false; }
  if (!categoria) { document.getElementById('campo-receita-categoria').classList.add('campo--invalido'); valido = false; }

  if (!valido) return;

  const dados = { descricao, valor, data, categoria };

  if (id) {
    Storage.Receitas.atualizar(id, dados);
    Utils.mostrarToast('Receita atualizada com sucesso.', 'sucesso');
  } else {
    Storage.Receitas.adicionar(usuarioAtual.id, dados);
    Utils.mostrarToast('Receita cadastrada com sucesso.', 'sucesso');
  }

  document.getElementById('modal-receita').classList.remove('modal-fundo--aberto');
  carregarReceitas();
}

/* ---------- Modal de exclusão ---------- */
function initModalExclusao() {
  const modal = document.getElementById('modal-excluir-receita');
  modal.querySelectorAll('[data-fechar-modal]').forEach(btn =>
    btn.addEventListener('click', () => modal.classList.remove('modal-fundo--aberto')));

  document.getElementById('botao-confirmar-exclusao-receita').addEventListener('click', () => {
    if (!idParaExcluir) return;
    Storage.Receitas.excluir(idParaExcluir);
    modal.classList.remove('modal-fundo--aberto');
    Utils.mostrarToast('Receita excluída.', 'sucesso');
    idParaExcluir = null;
    carregarReceitas();
  });
}

function abrirModalExclusao(id) {
  idParaExcluir = id;
  document.getElementById('modal-excluir-receita').classList.add('modal-fundo--aberto');
}
