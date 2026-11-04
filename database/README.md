# Banco de dados

`schema.sql` registra uma proposta inicial de schema SQLite para usuários e chamados. `seed.sql` fica reservado para dados iniciais seguros.

Os arquivos ainda não são executados pelo frontend. Atualmente, sessões e chamados são armazenados no navegador via `sessionStorage` e `localStorage`, respectivamente. Antes de usar o schema em produção, implemente migrações, regras de acesso no servidor e geração segura de hashes de senha.
