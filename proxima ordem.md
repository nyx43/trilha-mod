# Próxima ordem

- [ ] Acompanhar a geração da narração nas 77 aulas e corrigir as falhas identificadas. As vozes são Santa e Dora. A lista de aulas verificadas fica em `src/narration/catalog.json` e os detalhes em `.cache/narration/batch/`.

Para retomar se o processo tiver parado, primeiro confirme que não há outro lote em execução. Depois rode:

```bash
cd '/home/joaovt/Área de trabalho/site estudo/trilhainfo' && npm run narration:batch -- --jobs 4
```

A correção de termos com `@` foi aplicada após três aulas falharem. Conferir especialmente Tailwind, HTML semântico e CSS responsivo após a nova execução. Alguns tipos de blocos interativos ainda precisam de cobertura de narração.
