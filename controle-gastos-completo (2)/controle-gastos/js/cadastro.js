/**
 * cadastro.js
 * Validação e criação de nova conta de usuário.
 */

document.documentElement.setAttribute('data-tema', Storage.getTheme());

const formCadastro = document.getElementById('form-cadastro');
const campoNome = document.getElementById('campo-nome');
const campoEmail = document.getElementById('campo-email');
const campoSenha = document.getElementById('campo-senha');
const campoConfirmar = document.getElementById('campo-confirmar-senha');
const inputSenha = document.getElementById('senha');
const barrasForca = document.querySelectorAll('.forca-senha span');

inputSenha.addEventListener('input', () => {
  const forca = calcularForcaSenha(inputSenha.value);
  barrasForca.forEach((barra, i) => {
    barra.style.background = i < forca ? corForca(forca) : 'var(--cor-borda)';
  });
});

function calcularForcaSenha(senha) {
  let pontos = 0;
  if (senha.length >= 8) pontos++;
  if (/[A-Z]/.test(senha)) pontos++;
  if (/[0-9]/.test(senha)) pontos++;
  if (/[^A-Za-z0-9]/.test(senha)) pontos++;
  return pontos;
}

function corForca(pontos) {
  if (pontos <= 1) return 'var(--cor-despesa)';
  if (pontos <= 2) return 'var(--cor-destaque)';
  return 'var(--cor-receita)';
}

formCadastro.addEventListener('submit', (e) => {
  e.preventDefault();

  const nome = document.getElementById('nome').value.trim();
  const email = document.getElementById('email').value.trim();
  const senha = document.getElementById('senha').value;
  const confirmarSenha = document.getElementById('confirmar-senha').value;

  let valido = true;

  if (!nome) {
    campoNome.classList.add('campo--invalido');
    valido = false;
  } else {
    campoNome.classList.remove('campo--invalido');
  }

  const emailValido = Utils.validarEmail(email);
  const emailDuplicado = emailValido && Storage.findUserByEmail(email);

  if (!emailValido || emailDuplicado) {
    campoEmail.classList.add('campo--invalido');
    campoEmail.querySelector('.campo-erro').textContent = emailDuplicado
      ? 'Este e-mail já está cadastrado.'
      : 'Informe um e-mail válido.';
    valido = false;
  } else {
    campoEmail.classList.remove('campo--invalido');
  }

  if (!Utils.validarSenha(senha)) {
    campoSenha.classList.add('campo--invalido');
    valido = false;
  } else {
    campoSenha.classList.remove('campo--invalido');
  }

  if (senha !== confirmarSenha) {
    campoConfirmar.classList.add('campo--invalido');
    valido = false;
  } else {
    campoConfirmar.classList.remove('campo--invalido');
  }

  if (!valido) return;

  const novoUsuario = Storage.createUser({ nome, email, senha, tipo: 'usuario' });
  Storage.setSession(novoUsuario.id);
  window.location.href = 'dashboard.html';
});
