/**
 * utils.js
 * Funções puras reutilizáveis: validação e formatação.
 */

const Utils = (() => {
  function formatarMoeda(valor) {
    const numero = Number(valor) || 0;
    return numero.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  function formatarData(dataISO) {
    if (!dataISO) return '';
    const [ano, mes, dia] = dataISO.split('-');
    return `${dia}/${mes}/${ano}`;
  }

  function hojeISO() {
    const d = new Date();
    return d.toISOString().slice(0, 10);
  }

  function validarEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function validarSenha(senha) {
    return typeof senha === 'string' && senha.length >= 8;
  }

  function validarValorPositivo(valor) {
    return !isNaN(valor) && Number(valor) > 0;
  }

  function validarDataNaoFutura(dataISO) {
    if (!dataISO) return false;
    return new Date(dataISO) <= new Date(hojeISO() + 'T23:59:59');
  }

  function gerarIniciais(nome) {
    if (!nome) return '?';
    const partes = nome.trim().split(' ');
    if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
    return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
  }

  function mostrarToast(mensagem, tipo = 'info') {
    const container = document.getElementById('toast-container') || (() => {
      const div = document.createElement('div');
      div.id = 'toast-container';
      document.body.appendChild(div);
      return div;
    })();

    const toast = document.createElement('div');
    toast.className = `toast toast--${tipo}`;
    toast.textContent = mensagem;
    container.appendChild(toast);

    requestAnimationFrame(() => toast.classList.add('toast--visivel'));

    setTimeout(() => {
      toast.classList.remove('toast--visivel');
      setTimeout(() => toast.remove(), 300);
    }, 3200);
  }

  function debounce(fn, delay = 300) {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), delay);
    };
  }

  return {
    formatarMoeda, formatarData, hojeISO,
    validarEmail, validarSenha, validarValorPositivo, validarDataNaoFutura,
    gerarIniciais, mostrarToast, debounce,
  };
})();
