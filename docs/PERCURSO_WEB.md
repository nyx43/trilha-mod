# Percurso Web — entrega e instruções

## Origem, branch e preservação

- **Repositório de origem:** `https://github.com/flaviojmendes/trilhainfo`
- **Commit de origem:** `a90201a6de0669d4e8e93ccbda340a4101ca7ef8` (`Flavio Mendes <flaviojmendes@gmail.com>`)
- **Pasta da cópia:** `/home/joaovt/Área de trabalho/site estudo/trilhainfo`
- **Branch local:** `feat/percurso-api-tailwind` (alterações mantidas locais, sem commit, para você experimentar)
- **Licença e créditos:** preservados (`LICENSE` Apache-2.0, `README.md` e referências ao autor `flaviojmendes`)
- **Estudo ES:** checkout em `/home/joaovt/Área de trabalho/site estudo/site-estudo-feat-plataforma-estudos` e banco `data/estudo.db` preservados sem alterações
- **Nota de execução na revisão original (Node v24 / npm 11):** `npm ci` falhou no ambiente porque o `package-lock.json` original não incluía entradas opcionais `@esbuild/*`; as dependências foram instaladas com `npm install --no-audit --no-fund` e `package-lock.json` / `yarn.lock` foram restaurados para manter o histórico limpo.

## Comando para abrir a cópia

```bash
cd '/home/joaovt/Área de trabalho/site estudo/trilhainfo' && npm run dev
```

*(Caso precise reinstalar dependências depois, use `npm install --no-audit --no-fund`.)*

## Links iniciais do percurso

Com o servidor rodando na porta padrão do Vite (`5173`):

- **Link inicial do percurso:** `http://localhost:5173/percurso/api-react-tailwind`
- **Atalho dentro do catálogo de aulas:** `http://localhost:5173/aulas` (card **Percurso curto · Entrega API + Tailwind**)
- **Aula avulsa criada no formato nativo:** `http://localhost:5173/aula/tailwind-na-pratica`

Etapas incluídas no percurso (`/percurso/api-react-tailwind`):

1. **Node.js e Express** (`/percurso/api-react-tailwind/node-e-express`)
2. **Requisições no React** (`/percurso/api-react-tailwind/requisicoes-react`, apenas as 3 seções de requisições)
3. **Integração entre frontend e API** (`/percurso/api-react-tailwind/integracao-front-api`)
4. **Tailwind na prática** (`/percurso/api-react-tailwind/tailwind-na-pratica`, com exemplo **Painel de Oficinas da Semana**, pergunta inicial, exemplo explicado, atividades com feedback, playground compatível, passos reais para React + Vite + `@tailwindcss/vite`, 6 cartões de revisão e missão)
5. **Missão final: sua entrega (API + React + Tailwind)** (`/percurso/api-react-tailwind/missao-final`, baseada no contrato conferido em `/home/joaovt/Área de trabalho/exercicios/superheroes-api` para `GET /heroes` e `POST /heroes`, com roteiro prático, diagnóstico de falha, checagem mobile em `360px`, critérios de validação e checklist dos 2 links do GitHub)

## Entrega da faculdade

**Sua entrega prática até quarta-feira:** escrever e testar por conta própria a API Node (`GET /heroes`, `POST /heroes`, atenção ao CORS no `src/app.js` ou proxy no Vite) e o frontend React com Tailwind, conferir a tela em `360px` e publicar/validar os dois links do GitHub pedidos pelo professor.

**Versionamento local:** revisar e decidir quando fazer `git commit` na branch `feat/percurso-api-tailwind`.
