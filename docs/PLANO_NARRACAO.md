# Narração das aulas do Trilha Mod

O objetivo é oferecer leitura sincronizada nas 77 aulas do catálogo atual. A prévia já demonstrou três vozes do Kokoro em português, destaque da palavra, rastro que desaparece, reprodução por parágrafo e velocidade de 0,75× a 2× em passos de 0,05×. O primeiro passo dentro do Trilha Mod é aplicar essa experiência a uma aula real.

## 1. Integrar uma aula piloto

Use **Integração entre front e API** (`integracao-front-e-api`), que já aparece como aula avulsa e no percurso de Web. Importe o conteúdo do catálogo existente e conecte um player compartilhado aos blocos que a aula já renderiza. O percurso usa os mesmos clipes da aula de origem, na ordem das seções selecionadas.

- Oferecer **Ouvir parágrafo** e **Ouvir seções abertas**. Ao usar **Mostrar a aula inteira**, a pessoa pode ouvir todas as seções. Se houver uma atividade no caminho, oferecer pausa até que ela decida retomar. A leitura tem posição própria e segue as regras de progresso que a aula já usa.
- Usar os controles da prévia. Palavra atual em destaque, rastro desligável de 1 a 3 segundos e painel de velocidade com barra, botões de 0,05× e atalhos. Configurações de leitura ficam salvas no navegador.
- Usar as marcações que o Kokoro fornece para o áudio sintético. Na tela, destacar palavras sobre o texto já formatado. Quando o navegador só suportar destaque por bloco, a leitura continua disponível.
- Começar por títulos, abertura, explicações, listas, observações, legendas e fechamento. Em exemplos de código, ler a explicação e a legenda disponíveis. Nos diagramas interativos, tocar as etapas conforme forem exibidas. Separar enunciados e orientações de atividades do gabarito, feedback oculto e verso de cartões.

O piloto fica pronto quando a aula avulsa e o percurso tocam os blocos corretos e a palavra acompanha a voz a 0,75×, 1,35× e 2×. Abrir uma seção por link, pausar numa atividade, trocar de aula e editar um parágrafo são cenários de teste. Conferir a pronúncia e a sincronia com uma amostra de termos como `fetch`, `JSON` e `201`. Conferir que o progresso e as respostas registrados permanecem corretos após usar o player.

## 2. Gerar arquivos a partir do catálogo

1. Um exportador lê as aulas já registradas e extrai texto, ordem, identificadores dos blocos e marcações visíveis. Um léxico permite corrigir a fala de siglas, números e nomes técnicos. `201`, por exemplo, ganha uma única marcação visual para toda a pronúncia de “duzentos e um”. Dividir blocos longos em frases durante a síntese para preservar o texto dentro do limite do Kokoro.
2. O Kokoro roda fora do site e gera **um MP3 por bloco** com os tempos das palavras. A ferramenta produz um índice por aula com os clipes e as marcações. O site carrega o índice sob demanda e toca os arquivos prontos sem chave ou serviço de IA.
3. Cada trecho é identificado por seção e texto. O clipe recebe uma chave calculada com o roteiro, a voz e a versão do gerador. Ao atualizar um parágrafo ou uma pronúncia, só os clipes afetados precisam ser refeitos. Se texto e áudio estiverem em revisões diferentes, o botão daquele trecho fica indisponível até a regeneração.
4. O verificador confere os arquivos, a cobertura e a ordem dos tempos. O relatório indica o que já tem áudio, quais tipos de bloco precisam de uma regra e quais pronúncias precisam de escuta.

## 3. Expandir em lotes

Depois do piloto, gerar primeiro o percurso de Web. Incluir no próximo lote aulas representativas de Python, SQL e outros formatos para testar laboratórios, diagramas, tabelas e atividades. Dar a cada tipo de bloco uma regra clara de leitura e usar o relatório para acompanhar a cobertura. Uma aula entra como pronta quando suas seções narráveis têm clipes coerentes com o texto atual e os termos mais difíceis foram revisados.

Completar o catálogo com uma voz padrão inicial. Usar a prévia para comparar Dora, Alex e Santa. Medir duração e tamanho ao final do lote de Web e decidir onde hospedar os clipes. A estimativa inicial de 6 a 7 horas a 64 kbps equivale a cerca de **173 a 202 MB por voz**, antes do índice. A conclusão da rodada é ter as 77 aulas cobertas e um comando documentado para atualizar apenas uma aula ou os trechos que mudaram.

## Ordem de implementação do piloto

Integrar apenas a narração da aula **Integração entre front e API** à aula avulsa e à etapa correspondente do percurso. Reaproveitar o gerador e o comportamento da [prévia isolada](../../previa-narracao-trilha/index.html). Entregar um pequeno conjunto de MP3s e marcações estáticas, o player compartilhado e os testes da seção 1. Registrar limitações de pronúncia, blocos ainda sem cobertura e o que foi verificado no navegador. Os demais lotes começam a partir do resultado desse piloto.
