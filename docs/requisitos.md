# Requisitos funcionais

## Implementados no frontend demonstrativo

- Entrar e sair com usuário e senha, com perfis de administrador, suporte e solicitante.
- Abrir chamados com assunto, descrição e prioridade baixa, média ou alta.
- Consultar chamados em tabela, com busca e filtro de prioridade.
- Consultar, editar e excluir chamados próprios; o administrador pode gerenciar todos.
- Permitir ao suporte visualizar a fila, assumir um chamado e registrar seu atendimento.
- Exibir o atendente responsável e o status do chamado.
- Mostrar notificações compactas para suporte e administrador quando houver chamados pendentes.
- Persistir sessão e chamados no armazenamento local do navegador.

## Limitações conhecidas

- As contas e validações de demonstração são executadas no cliente e não oferecem controle de acesso seguro.
- Os dados ficam isolados por navegador e não são sincronizados entre dispositivos.
- A atribuição de chamado armazenada em `localStorage` não é atômica; duas sessões concorrentes podem tentar assumir o mesmo chamado.
- O backend e o banco de dados ainda não estão conectados.
