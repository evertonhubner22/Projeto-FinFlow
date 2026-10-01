# Razão — Sistema de Controle de Gastos Pessoais

Sistema web front-end para controle financeiro pessoal, desenvolvido como Trabalho de Conclusão de Curso (TCC). Construído inteiramente com **HTML5, CSS3 e JavaScript puro (Vanilla JS)**, sem frameworks, sem back-end e sem banco de dados — todos os dados são persistidos no **LocalStorage** do navegador.

---

## 1. Como executar

Não é necessário instalar nada. Basta:

1. Extrair o arquivo `.zip` do projeto;
2. Abrir o arquivo `index.html` em um navegador moderno (Chrome, Edge, Firefox);
3. Criar uma conta em **Cadastro** ou entrar com a conta de administrador de demonstração:
   - **E-mail:** `admin@razao.com`
   - **Senha:** `admin1234`

> Os dados ficam salvos apenas no navegador utilizado. Limpar o cache/LocalStorage apaga os registros.

---

## 2. Estrutura de pastas

```
/controle-gastos
├── index.html                 → ponto de entrada, redireciona conforme sessão
├── /pages
│   ├── login.html              → autenticação
│   ├── cadastro.html           → criação de conta
│   ├── recuperar-senha.html    → recuperação de senha (interface)
│   ├── dashboard.html          → painel principal com métricas e gráficos
│   ├── receitas.html           → CRUD de receitas
│   ├── despesas.html           → CRUD de despesas
│   ├── metas.html              → CRUD de metas financeiras e aportes
│   ├── relatorios.html         → relatórios analíticos com gráficos
│   ├── perfil.html             → dados da conta e troca de senha
│   └── admin.html              → painel administrativo
├── /css
│   ├── style.css                → reset, tokens de tema, tipografia, layout base
│   ├── login.css                 → telas de autenticação
│   ├── dashboard.css            → grade de gráficos e painel lateral
│   ├── components.css          → botões, formulários, tabelas, modais, badges
│   ├── metas.css, relatorios.css, perfil.css, admin.css → estilos específicos
│   └── responsive.css          → breakpoints (desktop, tablet, smartphone)
├── /js
│   ├── storage.js               → única camada de acesso ao LocalStorage
│   ├── utils.js                  → validações e formatação (moeda, data)
│   ├── app.js                   → tema, proteção de rota, sidebar, logout
│   ├── login.js, cadastro.js
│   ├── dashboard.js, receitas.js, despesas.js, metas.js, relatorios.js
│   ├── perfil.js, admin.js
└── /assets                      → ícones, imagens e logos (reservado)
```

**Princípio de organização:** cada página HTML carrega apenas os scripts que utiliza, mas todas as páginas internas dependem de `storage.js`, `utils.js` e `app.js`, nessa ordem. Nenhum outro arquivo acessa `localStorage` diretamente — tudo passa por `storage.js`, o que facilita manutenção e uma futura migração para uma API real.

---

## 3. Fluxo de navegação

```
                     ┌───────────────┐
                     │  index.html   │
                     └───────┬───────┘
                             │ verifica sessão em storage.js
                 ┌───────────┴────────────┐
                 │                        │
         sem sessão ativa           sessão ativa
                 │                        │
                 ▼                        ▼
          login.html              tipo = admin? ──── sim ──▶ admin.html
                 │                        │
     ┌───────────┼───────────┐            não
     ▼           ▼           ▼             │
cadastro.html  recuperar-  (login ok)      ▼
               senha.html      │      dashboard.html
                                ▼             │
                         dashboard.html   ┌───┼─────────────┬───────────┬────────┐
                                          ▼   ▼             ▼           ▼        ▼
                                    receitas  despesas    metas   relatorios  perfil
```

A sidebar (presente em todas as páginas internas) permite navegar entre Dashboard, Receitas, Despesas, Metas, Relatórios e Perfil a qualquer momento; usuários administradores também veem o item **Painel Admin**. O botão **Sair** limpa a sessão (`Storage.clearSession()`) e retorna à tela de login.

---

## 4. Explicação das páginas

| Página | Função |
|---|---|
| **Login** | Autentica o usuário validando e-mail e senha contra os dados salvos em `cg_users`. |
| **Cadastro** | Cria uma nova conta, com verificação de e-mail duplicado e indicador visual de força da senha. |
| **Recuperar senha** | Simulação de fluxo de recuperação (apenas interface, sem envio real de e-mail). |
| **Dashboard** | Mostra saldo, receitas, despesas e % da renda comprometida do mês; gráficos de categoria e evolução mensal; planejamento financeiro (renda x gastos); resumo de metas; alertas de inteligência financeira. |
| **Receitas** | Cadastro, edição, exclusão, busca e filtro de receitas, com paginação. |
| **Despesas** | Igual às receitas, com campos adicionais de categoria (9 opções) e forma de pagamento (5 opções). |
| **Metas** | Criação de metas com valor alvo, valor já guardado e prazo opcional; permite "aportar" valores incrementalmente; barra de progresso e selo de meta concluída. |
| **Relatórios** | Sete gráficos (barras, linha, pizza, área, indicador de metas) com filtro de período de 6 ou 12 meses. |
| **Perfil** | Edição de nome/e-mail, troca de senha e atalho de tema. |
| **Painel Admin** | Estatísticas gerais do sistema, gerenciamento de usuários (ativar/desativar) e gerenciamento de categorias (interface de demonstração). |

---

## 5. Casos de uso

| # | Ator | Caso de uso | Descrição resumida |
|---|---|---|---|
| CU01 | Usuário | Cadastrar-se | Cria conta informando nome, e-mail e senha. |
| CU02 | Usuário | Entrar no sistema | Autentica-se com e-mail e senha. |
| CU03 | Usuário | Recuperar senha | Solicita redefinição de senha via e-mail (interface). |
| CU04 | Usuário | Cadastrar receita | Registra uma nova entrada financeira. |
| CU05 | Usuário | Editar/excluir receita | Atualiza ou remove uma receita existente. |
| CU06 | Usuário | Cadastrar despesa | Registra uma nova saída financeira, com categoria e forma de pagamento. |
| CU07 | Usuário | Editar/excluir despesa | Atualiza ou remove uma despesa existente. |
| CU08 | Usuário | Criar meta financeira | Define um objetivo com valor alvo e prazo opcional. |
| CU09 | Usuário | Aportar valor em meta | Adiciona um valor ao progresso de uma meta. |
| CU10 | Usuário | Definir renda mensal | Informa a renda para cálculo de planejamento financeiro. |
| CU11 | Usuário | Visualizar dashboard | Consulta saldo, gráficos e alertas financeiros. |
| CU12 | Usuário | Visualizar relatórios | Consulta gráficos analíticos por período. |
| CU13 | Usuário | Editar perfil | Atualiza nome, e-mail ou senha. |
| CU14 | Usuário | Alternar tema | Alterna entre tema claro e escuro. |
| CU15 | Administrador | Visualizar estatísticas gerais | Consulta totais de usuários, receitas, despesas e metas. |
| CU16 | Administrador | Ativar/desativar usuário | Altera o status de acesso de uma conta. |
| CU17 | Administrador | Gerenciar categorias | Adiciona ou remove categorias (interface). |

---

## 6. Requisitos funcionais

- RF01 — O sistema deve permitir cadastro e autenticação de usuários.
- RF02 — O sistema deve impedir cadastro com e-mail duplicado.
- RF03 — O sistema deve validar formato de e-mail e senha com mínimo de 8 caracteres.
- RF04 — O sistema deve permitir CRUD completo de receitas e despesas.
- RF05 — O sistema deve impedir valores negativos ou nulos em lançamentos.
- RF06 — O sistema deve impedir o cadastro de lançamentos com data futura.
- RF07 — O sistema deve permitir busca e filtro de receitas/despesas por descrição, categoria e forma de pagamento.
- RF08 — O sistema deve permitir criação, edição, exclusão e acompanhamento de progresso de metas financeiras.
- RF09 — O sistema deve calcular automaticamente saldo, percentual gasto e economia mensal.
- RF10 — O sistema deve gerar sugestões automáticas de inteligência financeira com base em regras.
- RF11 — O sistema deve apresentar gráficos de categoria, comparativo mensal, evolução e progresso de metas.
- RF12 — O sistema deve permitir alternância entre tema claro e escuro.
- RF13 — O sistema deve oferecer um painel administrativo com estatísticas e gerenciamento de usuários/categorias.
- RF14 — O sistema deve manter os dados persistidos no LocalStorage entre sessões do navegador.

## 7. Requisitos não funcionais

- RNF01 — O sistema deve ser 100% front-end, sem dependência de servidor ou banco de dados.
- RNF02 — O sistema deve ser responsivo, funcionando em desktop, tablet e smartphone.
- RNF03 — O sistema deve funcionar em qualquer navegador moderno, sem instalação.
- RNF04 — O código deve ser modular, separando camadas de dados (storage), utilidades e apresentação.
- RNF05 — A interface deve seguir um sistema de design consistente (cores, tipografia e componentes reutilizáveis).
- RNF06 — O tempo de resposta das operações deve ser imediato, por não depender de rede.

## 8. Regras de negócio

- RN01 — Um e-mail só pode estar associado a uma única conta.
- RN02 — Todo lançamento (receita/despesa) pertence a um único usuário e não é visível a outros usuários comuns.
- RN03 — Uma meta é considerada concluída quando o valor atual atinge ou ultrapassa o valor alvo.
- RN04 — O percentual gasto é calculado sobre a renda mensal informada; se não houver renda definida, utiliza-se o total de receitas do mês como base.
- RN05 — Um usuário do tipo "administrador" não pode ser desativado pelo próprio painel administrativo.
- RN06 — Apenas usuários do tipo "administrador" podem acessar o Painel Admin; usuários comuns são redirecionados ao Dashboard.

---

## 9. Manual de utilização

1. **Criar conta**: acesse "Criar conta" na tela de login, preencha nome, e-mail e senha (mínimo 8 caracteres).
2. **Definir renda mensal**: no Dashboard, clique em "Definir renda mensal" para habilitar o cálculo de planejamento financeiro.
3. **Lançar receitas/despesas**: acesse "Receitas" ou "Despesas" no menu lateral e clique em "+ Nova receita/despesa".
4. **Criar metas**: acesse "Metas", clique em "+ Nova meta" e informe o valor alvo; use "+ Adicionar valor" para registrar avanços.
5. **Consultar relatórios**: acesse "Relatórios" e ajuste o período (6 ou 12 meses) para analisar os gráficos.
6. **Editar perfil**: acesse "Perfil" para atualizar nome, e-mail ou senha.
7. **Alternar tema**: clique no ícone de sol/lua no cabeçalho superior, disponível em qualquer página interna.

---

## 10. Tecnologias utilizadas

- HTML5, CSS3, JavaScript (ES6+)
- [Chart.js](https://www.chartjs.org/) via CDN, exclusivamente para renderização dos gráficos
- LocalStorage API do navegador para persistência de dados

## 11. Limitações conhecidas

- Os dados são armazenados apenas no navegador local; não há sincronização entre dispositivos.
- A recuperação de senha e o gerenciamento de categorias no painel admin são interfaces de demonstração, sem envio real de e-mail ou persistência de categorias.
- Por não haver back-end, a segurança dos dados (ex.: senhas em texto plano no LocalStorage) é adequada apenas para fins acadêmicos/demonstrativos.
