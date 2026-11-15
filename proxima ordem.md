# Próxima ordem

## Tarefa atual

- [ ] **Testar e aprovar o recomendador “O que preciso estudar?”** na cópia local do Trilha Info antes de iniciar a próxima rodada.

## Como abrir e testar

1. Inicie o servidor local:

```bash
cd '/home/joaovt/Área de trabalho/site estudo/trilhainfo' && npm run dev
```

2. Acesse `http://localhost:5173/aulas` e clique em **Abrir recomendador por enunciado** (ou abra direto `http://localhost:5173/aulas/o-que-estudar`).
3. Teste os principais cenários:
   - Colar: `Enviar link do GitHub da API Node com o GitHub do frontend utilizando Tailwind.` (conferir Node/Express, Tailwind, Git/GitHub, React apenas como apoio e abrir a seção indicada de uma aula).
   - Colar: `Preciso estudar métodos HTTP, erro de CORS e transformada de Fourier.` (conferir indicação de HTTP/CORS, abertura na seção `#cors` e aviso para `transformada de Fourier`).
   - Testar envio vazio, texto sem acentos/maiúsculas, navegação pelo teclado (`Tab`, `Ctrl+Enter`, `Ajustar termos`) e tela estreita em `360 px`.

## Referências

- Detalhes técnicos, validação e limitações: [RELATORIO_RECOMENDADOR.md](docs/RELATORIO_RECOMENDADOR.md)
- Histórico e entrega do percurso de Web: [PERCURSO_WEB.md](docs/PERCURSO_WEB.md)
- Próximas evoluções: [ideias futuras.md](ideias%20futuras.md)
