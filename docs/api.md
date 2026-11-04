# API planejada

Não existe uma API implementada nesta versão. Os recursos abaixo são uma referência para a futura camada HTTP em `backend/`.

| Método | Rota | Objetivo |
|---|---|---|
| `POST` | `/api/auth/login` | Autenticar usuário e iniciar sessão segura. |
| `POST` | `/api/auth/logout` | Encerrar a sessão. |
| `GET` | `/api/tickets` | Listar os chamados permitidos ao usuário autenticado. |
| `POST` | `/api/tickets` | Abrir chamado com assunto, descrição e prioridade. |
| `GET` | `/api/tickets/:id` | Consultar os detalhes de um chamado autorizado. |
| `PATCH` | `/api/tickets/:id` | Editar dados ou status conforme as permissões. |
| `POST` | `/api/tickets/:id/claim` | Assumir atomicamente um chamado disponível. |
| `DELETE` | `/api/tickets/:id` | Excluir conforme as permissões. |

O servidor deverá autenticar e autorizar cada operação, validar os campos e responder erros explicitamente. A operação de assumir chamado deverá ser atômica para impedir atribuições concorrentes. Esses contratos ainda precisam ser definidos antes da implementação.
