/**
 * login.js
 * Validação e autenticação da tela de login.
 */

(function seedAdmin() {
  // Garante que exista uma conta administrativa de demonstração
  const jaExiste = Storage.getUsers().some(u => u.tipo === 'admin');
  if (!jaExiste) {
    Storage.createUser({
      nome: 'Administrador',
      email: 'admin@razao.com',
      senha: 'admin1234',
      tipo: 'admin',
    });
  }
})();

document.documentElement.setAttribute('data-tema', Storage.getTheme());

const formLogin = document.getElementById('form-login');
const campoEmail = document.getElementById('campo-email');
const campoSenha = document.getElementById('campo-senha');

formLogin.addEventListener('submit', (e) => {
  e.preventDefault();

  const email = document.getElementById('email').value.trim();
  const senha = document.getElementById('senha').value;

  let valido = true;

  if (!Utils.validarEmail(email)) {
    campoEmail.classList.add('campo--invalido');
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

  if (!valido) return;

  const usuario = Storage.findUserByEmail(email);

  if (!usuario || usuario.senha !== senha) {
    campoSenha.classList.add('campo--invalido');
    campoSenha.querySelector('.campo-erro').textContent = 'E-mail ou senha incorretos.';
    return;
  }

  Storage.setSession(usuario.id);
  window.location.href = usuario.tipo === 'admin' ? 'admin.html' : 'dashboard.html';
});
