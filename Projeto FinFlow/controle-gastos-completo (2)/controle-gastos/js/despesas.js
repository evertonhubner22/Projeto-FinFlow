/**
 * despesas.js
 * CRUD completo de despesas com busca, filtros (categoria e forma de pagamento) e paginação simulada.
 */

let usuarioAtual = null;
let todasDespesas = [];
let despesasFiltradas = [];
let paginaAtual = 1;
const ITENS_POR_PAGINA = 6;
let idParaExcluir = null;

document.addEventListener('DOMContentLoaded', () => {
  usuarioAtual = App.initPaginaInterna();
  if (!usuarioAtual) return;

  carregarDespesas();
  initFiltros();
  initModalDespesa();
  initModalExclusao();
});

function carregarDespesas() {
  todasDespesas = Storage.Despesas.listar(usuarioAtual.id)
    .sort((a, b) => new Date(b.data) - new Date(a.data));
  aplicarFiltros();
}

function initFiltros() {
  const busca = document.getElementById('busca-despesas');
  const filtroCategoria = document.getElementById('filtro-categoria-despesa');
  const filtroPagamento = document.getElementById('filtro-pagamento-despesa');

  busca.addEventListener('input', Utils.debounce(() => { paginaAtual = 1; aplicarFiltros(); }, 250));
  filtroCategoria.addEventListener('change', () => { paginaAtual = 1; aplicarFiltros(); });
  filtroPagamento.addEventListener('change', () => { paginaAtual = 1; aplicarFiltros(); });
}

function aplicarFiltros() {
  const termo = document.getElementById('busca-despesas').value.trim().toLowerCase();
  const categoria = document.getElementById('filtro-categoria-despesa').value;
  const pagamento = document.getElementById('filtro-pagamento-despesa').value;

  despesasFiltradas = todasDespesas.filter(d => {
    const combinaTermo = !termo || d.descricao.toLowerCase().includes(termo);
    const combinaCategoria = !categoria || d.categoria === categoria;
    const combinaPagamento = !pagamento || d.formaPagamento === pagamento;
    return combinaTermo && combinaCategoria && combinaPagamento;
  });

  renderTabela();
  renderPaginacao();
}

function renderTabela() {
  const corpo = document.getElementById('corpo-tabela-despesas');
  const vazio = document.getElementById('estado-vazio-despesas');

  if (despesasFiltradas.length === 0) {
    corpo.innerHTML = '';
    vazio.style.display = 'block';
    return;
  }
  vazio.style.display = 'none';

  const inicio = (paginaAtual - 1) * ITENS_POR_PAGINA;
  const pagina = despesasFiltradas.slice(inicio, inicio + ITENS_POR_PAGINA);

  corpo.innerHTML = pagina.map(d => `
    <tr>
      <td>${d.descricao}</td>
      <td><span class="badge badge--despesa">${d.categoria}</span></td>
      <td>${d.formaPagamento}</td>
      <td>${Utils.formatarData(d.data)}</td>
      <td class="valor-monetario" style="color:var(--cor-despesa); font-weight:600;">${Utils.formatarMoeda(d.valor)}</td>
      <td>
        <div class="acoes-linha">
          <button class="acao-icone" title="Editar" data-editar="${d.id}">✎</button>
          <button class="acao-icone" title="Excluir" data-excluir="${d.id}">🗑</button>
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
  const container = document.getElementById('paginacao-despesas');
  const totalPaginas = Math.ceil(despesasFiltradas.length / ITENS_POR_PAGINA);

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
function initModalDespesa() {
  const modal = document.getElementById('modal-despesa');
  const form = document.getElementById('form-despesa');

  document.getElementById('botao-nova-despesa').addEventListener('click', abrirModalNovo);

  modal.querySelectorAll('[data-fechar-modal]').forEach(btn =>
    btn.addEventListener('click', () => modal.classList.remove('modal-fundo--aberto')));

  form.addEventListener('submit', salvarDespesa);
}

function abrirModalNovo() {
  document.getElementById('titulo-modal-despesa').textContent = 'Nova despesa';
  document.getElementById('form-despesa').reset();
  document.getElementById('despesa-id').value = '';
  document.getElementById('despesa-data').value = Utils.hojeISO();
  document.getElementById('despesa-data').max = Utils.hojeISO();
  limparErrosDespesa();
  document.getElementById('modal-despesa').classList.add('modal-fundo--aberto');
}

function abrirModalEdicao(id) {
  const despesa = todasDespesas.find(d => d.id === id);
  if (!despesa) return;

  document.getElementById('titulo-modal-despesa').textContent = 'Editar despesa';
  document.getElementById('despesa-id').value = despesa.id;
  document.getElementById('despesa-descricao').value = despesa.descricao;
  document.getElementById('despesa-valor').value = despesa.valor;
  document.getElementById('despesa-data').value = despesa.data;
  document.getElementById('despesa-data').max = Utils.hojeISO();
  document.getElementById('despesa-categoria').value = despesa.categoria;
  document.getElementById('despesa-pagamento').value = despesa.formaPagamento;
  limparErrosDespesa();
  document.getElementById('modal-despesa').classList.add('modal-fundo--aberto');
}

function limparErrosDespesa() {
  ['campo-despesa-descricao', 'campo-despesa-valor', 'campo-despesa-data', 'campo-despesa-categoria', 'campo-despesa-pagamento']
    .forEach(id => document.getElementById(id).classList.remove('campo--invalido'));
}

function salvarDespesa(e) {
  e.preventDefault();

  const id = document.getElementById('despesa-id').value;
  const descricao = document.getElementById('despesa-descricao').value.trim();
  const valor = parseFloat(document.getElementById('despesa-valor').value);
  const data = document.getElementById('despesa-data').value;
  const categoria = document.getElementById('despesa-categoria').value;
  const formaPagamento = document.getElementById('despesa-pagamento').value;

  let valido = true;
  limparErrosDespesa();

  if (!descricao) { document.getElementById('campo-despesa-descricao').classList.add('campo--invalido'); valido = false; }
  if (!Utils.validarValorPositivo(valor)) { document.getElementById('campo-despesa-valor').classList.add('campo--invalido'); valido = false; }
  if (!data || !Utils.validarDataNaoFutura(data)) { document.getElementById('campo-despesa-data').classList.add('campo--invalido'); valido = false; }
  if (!categoria) { document.getElementById('campo-despesa-categoria').classList.add('campo--invalido'); valido = false; }
  if (!formaPagamento) { document.getElementById('campo-despesa-pagamento').classList.add('campo--invalido'); valido = false; }

  if (!valido) return;

  const dados = { descricao, valor, data, categoria, formaPagamento };

  if (id) {
    Storage.Despesas.atualizar(id, dados);
    Utils.mostrarToast('Despesa atualizada com sucesso.', 'sucesso');
  } else {
    Storage.Despesas.adicionar(usuarioAtual.id, dados);
    Utils.mostrarToast('Despesa cadastrada com sucesso.', 'sucesso');
  }

  document.getElementById('modal-despesa').classList.remove('modal-fundo--aberto');
  carregarDespesas();
}

/* ---------- Modal de exclusão ---------- */
function initModalExclusao() {
  const modal = document.getElementById('modal-excluir-despesa');
  modal.querySelectorAll('[data-fechar-modal]').forEach(btn =>
    btn.addEventListener('click', () => modal.classList.remove('modal-fundo--aberto')));

  document.getElementById('botao-confirmar-exclusao-despesa').addEventListener('click', () => {
    if (!idParaExcluir) return;
    Storage.Despesas.excluir(idParaExcluir);
    modal.classList.remove('modal-fundo--aberto');
    Utils.mostrarToast('Despesa excluída.', 'sucesso');
    idParaExcluir = null;
    carregarDespesas();
  });
}

function abrirModalExclusao(id) {
  idParaExcluir = id;
  document.getElementById('modal-excluir-despesa').classList.add('modal-fundo--aberto');
}
