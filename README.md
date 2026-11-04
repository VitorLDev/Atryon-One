# Atryon One

Sistema demonstrativo de chamados de TI. A aplicação atual é um frontend estático em HTML, CSS e JavaScript; os chamados e a sessão são mantidos no armazenamento do navegador.

## Executar

Abra `frontend/index.html` em um navegador moderno. Como os scripts usam módulos ES, alguns navegadores exigem servir os arquivos por HTTP local em vez de abrir o HTML diretamente. Nesse caso, use qualquer servidor estático na raiz do projeto e acesse `/frontend/`.

Contas demonstrativas:

- Administrador: `Admin` / `Adm123`
- Suporte: `sup1` / `123456`
- Solicitante: `Teste` / `teste`

Essas credenciais são apenas para demonstração e não constituem autenticação segura.

## Estrutura

- `frontend/`: interface e lógica client-side.
- `backend/`: ponto de partida para uma futura API; não está conectado à aplicação.
- `database/`: proposta inicial de schema e instruções para a futura persistência.
- `docs/`: arquitetura, requisitos, API planejada e roadmap.

Consulte [docs/arquitetura.md](docs/arquitetura.md) para detalhes sobre os módulos e as limitações atuais.
