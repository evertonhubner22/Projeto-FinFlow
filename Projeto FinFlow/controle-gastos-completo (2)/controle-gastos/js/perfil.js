/**
 * perfil.js
 * Edição de dados pessoais, troca de senha e upload de foto de perfil.
 */

let usuarioAtual = null;
const TAMANHO_MAX_FOTO_MB = 2;
const DIMENSAO_MAX_FOTO = 200;

document.addEventListener('DOMContentLoaded', () => {
  usuarioAtual = App.initPaginaInterna();
  if (!usuarioAtual) return;

  preencherDados();
  initFormPerfil();
  initFormSenha();
  initBotaoTema();
  initUploadFoto();
});

function preencherDados() {
  document.getElementById('perfil-nome').value = usuarioAtual.nome;
  document.getElementById('perfil-email').value = usuarioAtual.email;
  document.getElementById('perfil-nome-exibicao').textContent = usuarioAtual.nome;
  document.getElementById('perfil-email-exibicao').textContent = usuarioAtual.email;

  const criadoEm = usuarioAtual.criadoEm ? new Date(usuarioAtual.criadoEm) : null;
  document.getElementById('perfil-membro-desde').textContent = criadoEm
    ? `Membro desde ${criadoEm.toLocaleDateString('pt-BR')}`
    : '';

  atualizarAvatar();
}

function atualizarAvatar() {
  const foto = document.getElementById('perfil-foto');
  const iniciais = document.getElementById('perfil-iniciais');
  const botaoRemover = document.getElementById('botao-remover-foto');

  if (usuarioAtual.foto) {
    foto.src = usuarioAtual.foto;
    foto.style.display = 'block';
    iniciais.style.display = 'none';
    botaoRemover.style.display = 'inline-flex';
  } else {
    foto.style.display = 'none';
    foto.src = '';
    iniciais.textContent = Utils.gerarIniciais(usuarioAtual.nome);
    iniciais.style.display = 'flex';
    botaoRemover.style.display = 'none';
  }
}

function initFormPerfil() {
  const form = document.getElementById('form-perfil');
  const campoNome = document.getElementById('campo-perfil-nome');
  const campoEmail = document.getElementById('campo-perfil-email');

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const nome = document.getElementById('perfil-nome').value.trim();
    const email = document.getElementById('perfil-email').value.trim();

    let valido = true;
    campoNome.classList.remove('campo--invalido');
    campoEmail.classList.remove('campo--invalido');

    if (!nome) { campoNome.classList.add('campo--invalido'); valido = false; }

    const emailValido = Utils.validarEmail(email);
    const emailEmUso = emailValido && Storage.findUserByEmail(email) && Storage.findUserByEmail(email).id !== usuarioAtual.id;

    if (!emailValido || emailEmUso) { campoEmail.classList.add('campo--invalido'); valido = false; }

    if (!valido) return;

    usuarioAtual = Storage.updateUser(usuarioAtual.id, { nome, email });
    preencherDados();
    Utils.mostrarToast('Dados atualizados com sucesso.', 'sucesso');
  });
}

function initFormSenha() {
  const form = document.getElementById('form-senha');
  const campoAtual = document.getElementById('campo-senha-atual');
  const campoNova = document.getElementById('campo-nova-senha');
  const campoConfirmar = document.getElementById('campo-confirmar-nova-senha');

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const atual = document.getElementById('senha-atual').value;
    const nova = document.getElementById('nova-senha').value;
    const confirmar = document.getElementById('confirmar-nova-senha').value;

    let valido = true;
    [campoAtual, campoNova, campoConfirmar].forEach(c => c.classList.remove('campo--invalido'));

    if (atual !== usuarioAtual.senha) { campoAtual.classList.add('campo--invalido'); valido = false; }
    if (!Utils.validarSenha(nova)) { campoNova.classList.add('campo--invalido'); valido = false; }
    if (nova !== confirmar) { campoConfirmar.classList.add('campo--invalido'); valido = false; }

    if (!valido) return;

    usuarioAtual = Storage.updateUser(usuarioAtual.id, { senha: nova });
    form.reset();
    Utils.mostrarToast('Senha atualizada com sucesso.', 'sucesso');
  });
}

function initBotaoTema() {
  document.getElementById('botao-alternar-tema-perfil').addEventListener('click', App.alternarTema);
}

/* ---------- Upload de foto de perfil ---------- */

function initUploadFoto() {
  const input = document.getElementById('input-foto-perfil');
  const botaoRemover = document.getElementById('botao-remover-foto');

  input.addEventListener('change', (e) => {
    const arquivo = e.target.files[0];
    if (!arquivo) return;

    if (!validarArquivo(arquivo)) {
      input.value = '';
      return;
    }

    processarImagem(arquivo);
    input.value = '';
  });

  botaoRemover.addEventListener('click', () => {
    usuarioAtual = Storage.updateUser(usuarioAtual.id, { foto: null });
    atualizarAvatar();
    Utils.mostrarToast('Foto removida.', 'sucesso');
  });
}

function validarArquivo(arquivo) {
  const tiposPermitidos = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (!tiposPermitidos.includes(arquivo.type)) {
    Utils.mostrarToast('Apenas arquivos de imagem são permitidos (JPG, PNG, GIF, WebP).', 'erro');
    return false;
  }

  if (arquivo.size > TAMANHO_MAX_FOTO_MB * 1024 * 1024) {
    Utils.mostrarToast(`A imagem deve ter no máximo ${TAMANHO_MAX_FOTO_MB}MB.`, 'erro');
    return false;
  }

  return true;
}

function processarImagem(arquivo) {
  const reader = new FileReader();

  reader.onload = (e) => {
    const img = new Image();

    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      // Calcula as novas dimensões mantendo a proporção
      let { width, height } = img;
      if (width > height) {
        if (width > DIMENSAO_MAX_FOTO) {
          height = Math.round((height * DIMENSAO_MAX_FOTO) / width);
          width = DIMENSAO_MAX_FOTO;
        }
      } else {
        if (height > DIMENSAO_MAX_FOTO) {
          width = Math.round((width * DIMENSAO_MAX_FOTO) / height);
          height = DIMENSAO_MAX_FOTO;
        }
      }

      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);

      // Converte para JPEG com qualidade reduzida
      const base64 = canvas.toDataURL('image/jpeg', 0.7);

      usuarioAtual = Storage.updateUser(usuarioAtual.id, { foto: base64 });
      atualizarAvatar();
      Utils.mostrarToast('Foto atualizada com sucesso.', 'sucesso');
    };

    img.onerror = () => {
      Utils.mostrarToast('Erro ao processar a imagem.', 'erro');
    };

    img.src = e.target.result;
  };

  reader.onerror = () => {
    Utils.mostrarToast('Erro ao ler o arquivo.', 'erro');
  };

  reader.readAsDataURL(arquivo);
}
