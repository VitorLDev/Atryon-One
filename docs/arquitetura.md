# Arquitetura

## Estado atual

O Atryon One é uma aplicação estática, sem dependências de build. A interface e as regras client-side ficam em `frontend/`; os módulos JavaScript são carregados como ES modules por `frontend/index.html`.

- `frontend/css/style.css`: estilos da interface.
- `frontend/js/app.js`: inicializa os módulos, configura o perfil e conecta os eventos entre chamados e notificações.
- `frontend/js/auth.js`: login demonstrativo, encerramento e restauração da sessão do navegador.
- `frontend/js/tickets.js`: leitura, migração, gravação, listagem e atendimento de chamados.
- `frontend/js/notifications.js`: sino, contador e lista de chamados pendentes para suporte/administração.
- `frontend/js/utils.js`: formatação, compatibilidade com nomes legados e mensagens temporárias.
- `frontend/assets/`: reservado para imagens e outros recursos estáticos.

O navegador mantém a sessão em `sessionStorage` e os chamados em `localStorage`. O evento `storage` atualiza a fila em outras abas, mas não sincroniza dispositivos nem garante exclusão mútua quando atendentes tentam assumir o mesmo chamado ao mesmo tempo.

## Preparação futura

`backend/` e `database/` são apenas scaffolding. A interface não chama uma API, e o backend não deve ser considerado implementado. `database/schema.sql` é uma proposta inicial de persistência; `docs/api.md` descreve endpoints possíveis.

As credenciais embutidas no frontend servem exclusivamente para demonstração. Um backend futuro deve validar identidade e permissões no servidor, armazenar senhas com hashes seguros e proteger as operações por usuário e perfil.
