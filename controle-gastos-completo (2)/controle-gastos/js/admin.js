/**
 * admin.js
 * Painel administrativo: estatísticas gerais reais, gerenciamento de usuários
 * (ativar/desativar) e gerenciamento de categorias (interface de demonstração,
 * conforme especificado — não precisa persistir).
 */

let categoriasDespesa = ['Alimentação', 'Transporte', 'Saúde', 'Educação', 'Lazer', 'Moradia', 'Contas', 'Investimentos', 'Outros'];
let categoriasReceita = ['Salário', 'Freelance', 'Investimentos', 'Presente', 'Reembolso', 'Outros'];

document.addEventListener('DOMContentLoaded', () => {
  const usuarioAtual = App.initPaginaInterna({ exigirAdmin: true });
  if (!usuarioAtual) return;

  renderEstatisticas();
  renderUsuarios();
  renderCategorias();
  initAbas();
  initModalCategoria();
});

function renderEstatisticas() {
  const usuarios = Storage.getUsers();
  const totalReceitas = (JSON.parse(localStorage.getItem('cg_receitas')) || []).length;
  const totalDespesas = (JSON.parse(localStorage.getItem('cg_despesas')) || []).length;
  const totalMetas = (JSON.parse(localStorage.getItem('cg_metas')) || []).length;

  document.getElementById('cards-admin').innerHTML = `
    <div class="card card-metrica">
      <div class="rotulo">Usuários cadastrados</div>
      <div class="valor valor-monetario">${usuarios.length}</div>
    </div>
    <div class="card card-metrica">
      <div class="rotulo">Receitas lançadas</div>
      <div class="valor valor-monetario">${totalReceitas}</div>
    </div>
    <div class="card card-metrica">
      <div class="rotulo">Despesas lançadas</div>
      <div class="valor valor-monetario">${totalDespesas}</div>
    </div>
    <div class="card card-metrica">
      <div class="rotulo">Metas criadas</div>
      <div class="valor valor-monetario">${totalMetas}</div>
    </div>
  `;
}

function renderUsuarios() {
  const usuarios = Storage.getUsers();
  const corpo = document.getElementById('corpo-tabela-usuarios');

  corpo.innerHTML = usuarios.map(u => {
    const ativo = u.ativo !== false;
    const criadoEm = u.criadoEm ? new Date(u.criadoEm).toLocaleDateString('pt-BR') : '—';
    return `
      <tr>
        <td>${u.nome}</td>
        <td>${u.email}</td>
        <td><span class="badge ${u.tipo === 'admin' ? 'badge--destaque' : 'badge--receita'}">${u.tipo === 'admin' ? 'Administrador' : 'Usuário'}</span></td>
        <td>${criadoEm}</td>
        <td><span class="badge ${ativo ? 'badge--receita' : 'badge--despesa'}">${ativo ? 'Ativo' : 'Inativo'}</span></td>
        <td>
          <button class="botao botao--secundario" style="padding:6px 12px; font-size:0.78rem;" data-toggle="${u.id}" ${u.tipo === 'admin' ? 'disabled' : ''}>
            ${ativo ? 'Desativar' : 'Ativar'}
          </button>
        </td>
      </tr>
    `;
  }).join('');

  corpo.querySelectorAll('[data-toggle]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.toggle;
      const usuario = usuarios.find(u => u.id === id);
      Storage.updateUser(id, { ativo: usuario.ativo === false });
      renderUsuarios();
      Utils.mostrarToast('Status do usuário atualizado.', 'sucesso');
    });
  });
}

function renderCategorias() {
  document.getElementById('lista-categorias-despesa').innerHTML = categoriasDespesa.map((c, i) => `
    <span class="chip-categoria">${c} <button data-remover="despesa" data-indice="${i}" title="Remover">✕</button></span>
  `).join('');

  document.getElementById('lista-categorias-receita').innerHTML = categoriasReceita.map((c, i) => `
    <span class="chip-categoria">${c} <button data-remover="receita" data-indice="${i}" title="Remover">✕</button></span>
  `).join('');

  document.querySelectorAll('[data-remover]').forEach(btn => {
    btn.addEventListener('click', () => {
      const tipo = btn.dataset.remover;
      const indice = Number(btn.dataset.indice);
      if (tipo === 'despesa') categoriasDespesa.splice(indice, 1);
      else categoriasReceita.splice(indice, 1);
      renderCategorias();
    });
  });
}

function initAbas() {
  const abas = document.querySelectorAll('.aba-admin');
  abas.forEach(aba => {
    aba.addEventListener('click', () => {
      abas.forEach(a => a.classList.remove('aba-admin--ativa'));
      aba.classList.add('aba-admin--ativa');
      document.getElementById('aba-usuarios').style.display = aba.dataset.aba === 'usuarios' ? 'block' : 'none';
      document.getElementById('aba-categorias').style.display = aba.dataset.aba === 'categorias' ? 'block' : 'none';
    });
  });
}

function initModalCategoria() {
  const modal = document.getElementById('modal-categoria');
  document.getElementById('botao-nova-categoria').addEventListener('click', () => modal.classList.add('modal-fundo--aberto'));
  modal.querySelectorAll('[data-fechar-modal]').forEach(btn => btn.addEventListener('click', () => modal.classList.remove('modal-fundo--aberto')));

  document.getElementById('form-categoria').addEventListener('submit', (e) => {
    e.preventDefault();
    const nomeInput = document.getElementById('categoria-nome');
    const nome = nomeInput.value.trim();
    const tipo = document.getElementById('categoria-tipo').value;
    const campo = document.getElementById('campo-categoria-nome');

    if (!nome) { campo.classList.add('campo--invalido'); return; }
    campo.classList.remove('campo--invalido');

    if (tipo === 'despesa') categoriasDespesa.push(nome);
    else categoriasReceita.push(nome);

    renderCategorias();
    modal.classList.remove('modal-fundo--aberto');
    document.getElementById('form-categoria').reset();
    Utils.mostrarToast('Categoria adicionada (demonstração de interface).', 'sucesso');
  });
}
