import { LessonContent } from '../types';

export const content: LessonContent = {
  revision: 2,
  hook: 'Mais de metade do retrabalho em projetos de software não nasce de bug de código — nasce de **requisitos ambíguos** que cada pessoa interpretou de um jeito. Escrever "o sistema deve ser rápido e seguro" não orienta o desenvolvedor nem permite um teste objetivo. Dominar **elicitação, requisitos testáveis, Casos de Uso UML e Histórias INVEST/BDD** é o que impede você de construir o software perfeito para o problema errado.',
  sections: [
    {
      id: 'custo-do-requisito-errado',
      title: 'Por que Engenharia de Requisitos vale dinheiro na vida real',
      blocks: [
        {
          type: 'text',
          text: 'Vamos usar um fio condutor real presente nas provas e exercícios da disciplina: um **Sistema de Gestão de Academia** (matrículas, catraca/check-in, planos, treinos e cobranças). Quando a recepcionista pede "um controle de entrada prático", o dono pede "evitar inadimplente na catraca" e o aluno quer "não pegar fila às 18h", seu trabalho como engenheiro de requisitos é descobrir o que precisa ser verdade — e torná-lo **verificável**.',
        },
        {
          type: 'table',
          caption: 'Como escolher a técnica de elicitação certa sem perder semanas',
          head: ['Técnica', 'Melhor momento de uso', 'Ponto cego / risco', 'Exemplo na Academia'],
          rows: [
            [
              'Entrevista',
              'Explorar regras de negócio profundas e conflitos com decisores',
              'Viés do entrevistado; caro para dezenas de pessoas',
              'Conversar com dono e financeiro sobre regras de inadimplência',
            ],
            [
              'Observação (Shadowing)',
              'Descobrir atalhos reais e gargalos que ninguém lembra de contar',
              'Efeito Hawthorne (pessoas mudam comportamento sendo observadas)',
              'Ficar 1 hora na recepção às 18h vendo travamentos na catraca',
            ],
            [
              'Questionário',
              'Coletar preferências quantitativas de muitos usuários',
              'Respostas rasas; perguntas mal formuladas distorcem dados',
              'Pesquisa com 400 alunos sobre reserva de aulas coletivas',
            ],
            [
              'Análise documental',
              'Regras legais, contratos, planilhas e sistemas legados já existentes',
              'Documentos podem estar desatualizados frente à prática real',
              'Ler contrato de cancelamento, regras da LGPD e planilha atual',
            ],
            [
              'Brainstorming / Workshop',
              'Gerar ideias rápidas e alinhar áreas conflitantes na mesma sala',
              'Voz mais alta dominar o grupo sem facilitação',
              'Sessão conjunta com recepção, professores e financeiro',
            ],
          ],
        },
        {
          type: 'callout',
          tone: 'tip',
          title: 'Regra de ouro da elicitação',
          text: 'Nunca use uma única técnica! Entrevista revela o que o gestor **acha** que acontece; observação revela o que **realmente** acontece no pico das 18h; análise documental revela o que o **contrato/lei** obriga.',
        },
      ],
    },
    {
      id: 'rf-rnf-e-testabilidade',
      title: 'RF, RNF e Restrições — e o teste decisivo da não ambiguidade',
      blocks: [
        {
          type: 'text',
          text: 'Separar **Requisito Funcional (RF)** (o que o sistema faz), **Requisito Não Funcional (RNF)** (qualidade mensurável: desempenho, segurança, disponibilidade, usabilidade) e **Restrição** (imposição tecnológica, legal ou de prazo) é só o começo. O salto de qualidade real está em eliminar adjetivos vagos ("rápido", "intuitivo", "seguro", "estável") e substituí-los por **critérios mensuráveis e testáveis**.',
        },
        {
          type: 'table',
          caption:
            'Antes e depois: transformando pedidos vagos da Academia em requisitos de engenharia',
          head: ['Pedido vago (não testável)', 'Tipo', 'Requisito testável de produção'],
          rows: [
            [
              '"A catraca precisa ser rápida."',
              'RNF (Desempenho)',
              'O endpoint de validação de acesso da catraca deve responder em até 300 ms no p95 sob carga de 50 check-ins/minuto.',
            ],
            [
              '"Bloquear alunos com problema no pagamento."',
              'RF (Regra de negócio)',
              'O sistema deve negar a liberação da catraca para matrículas com fatura vencida há mais de 5 dias corridos, exibindo o código de motivo `INADIMPLENTE` na recepção.',
            ],
            [
              '"Os dados dos alunos devem ser seguros."',
              'RNF (Segurança)',
              'Senhas devem ser armazenadas com Argon2id ou bcrypt (custo >= 12), sessões trafegar apenas em HTTPS/TLS 1.3 e acessos a dados de saúde registrados em log de auditoria.',
            ],
            [
              '"Rodar no equipamento que já compramos."',
              'Restrição',
              'O módulo de catraca deve integrar via protocolo serial/HTTP local com o leitor biométrico modelo X já instalado na unidade.',
            ],
          ],
        },
        {
          type: 'classify',
          activityId: 'req-c1-rf-rnf-restricao',
          prompt:
            'Classifique cada declaração do Sistema de Academia como **RF**, **RNF** ou **Restrição** (ou **Requisito Ambíguo/Inválido** que ainda precisa ser reescrito):',
          buckets: [
            'Requisito Funcional (RF)',
            'Requisito Não Funcional (RNF)',
            'Restrição',
            'Ambíguo (não testável ainda)',
          ],
          items: [
            {
              text: 'O sistema deve permitir cancelar uma reserva de aula coletiva até 2 horas antes do início',
              bucket: 0,
            },
            {
              text: 'A disponibilidade do serviço de check-in deve ser de no mínimo 99,5% no horário de funcionamento (06h–22h)',
              bucket: 1,
            },
            {
              text: 'O banco de dados deve ser PostgreSQL 16 por política de infraestrutura da rede de academias',
              bucket: 2,
            },
            {
              text: 'A tela de ficha de treino deve ser bonita, moderna e muito fácil de usar',
              bucket: 3,
            },
            {
              text: 'O sistema deve emitir recibo em PDF com número sequencial após confirmação de pagamento',
              bucket: 0,
            },
            {
              text: 'O sistema deve responder rapidamente mesmo quando estiver muito cheio',
              bucket: 3,
            },
          ],
          explanation:
            'RF descreve funcionalidade/regra; RNF define qualidade mensurável (ex.: 99,5%); Restrição impõe tecnologia/lei/prazo fixo; termos como "bonita", "fácil" e "rapidamente" sem métrica são ambíguos e precisam ser refinados.',
        },
      ],
    },
    {
      id: 'casos-de-uso-e-historias-invest',
      title: 'Casos de Uso UML (`<<include>>` × `<<extend>>`) e Histórias INVEST',
      blocks: [
        {
          type: 'text',
          text: 'Duas representações dominam o mercado e a disciplina: **Casos de Uso UML** (visão macro de atores, fronteira do sistema e fluxos alternativos/exceção) e **Histórias de Usuário com INVEST** (recorte ágil entregue em sprints). O erro mais frequente em provas e projetos é inverter `<<include>>` com `<<extend>>` — inclusive a direção da seta!',
        },
        {
          type: 'anatomy',
          caption: 'Anatomia de uma História de Usuário INVEST pronta para sprint',
          language: 'text',
          parts: [
            {
              text: 'Como recepcionista da academia, ',
              label: 'Papel (Quem)',
              note: 'Evite o genérico "Como usuário". O papel define permissões e contexto real.',
            },
            {
              text: 'quero liberar acesso temporário de 1 dia com motivo registrado ',
              label: 'Ação (O quê)',
              note: 'Pequena (Small), independente e negociável na forma de implementação.',
            },
            {
              text: 'para não barrar um aluno que acabou de pagar no PIX antes da compensação bancária.',
              label: 'Valor (Por quê)',
              note: 'Garante o V (Valuable) do INVEST — sem valor claro, a história vira tarefa técnica solta.',
            },
          ],
        },
        {
          type: 'table',
          caption: 'Não erre mais: `<<include>>` vs. `<<extend>>` na UML',
          head: ['Relação', 'Quando usar', 'Direção da seta tracejada', 'Exemplo na Academia'],
          rows: [
            [
              '`<<include>>`',
              'Comportamento **obrigatório** reaproveitado toda vez que o caso base executa',
              'Do Caso Base → para o Caso Incluído',
              '`Realizar Check-in` `<<include>>` → `Verificar Adimplência`',
            ],
            [
              '`<<extend>>`',
              'Comportamento **opcional / condicional** disparado apenas em certos cenários',
              'Do Caso Estendido (opcional) → para o Caso Base',
              '`Liberar Acesso Excepcional` `<<extend>>` → `Realizar Check-in` (apenas se bloqueado)',
            ],
          ],
        },
        {
          type: 'quiz',
          activityId: 'req-q1-include-extend',
          question:
            'No diagrama de Casos de Uso da Academia: toda vez que um aluno reserva uma aula coletiva, o sistema **obrigatoriamente** verifica se há vaga; e **opcionalmente**, caso a turma esteja lotada, oferece entrar na lista de espera. Quais relações e direções estão corretas?',
          options: [
            {
              text: '`Reservar Aula` `<<include>>` → `Verificar Vagas`; e `Entrar na Lista de Espera` `<<extend>>` → `Reservar Aula`.',
              correct: true,
              feedback:
                'Exatamente! `Verificar Vagas` é obrigatório, logo o base inclui ele (`Base --> Incluído`). `Entrar na Lista de Espera` é condicional, logo a extensão aponta para o base (`Extensão --> Base`).',
            },
            {
              text: '`Verificar Vagas` `<<include>>` → `Reservar Aula`; e `Reservar Aula` `<<extend>>` → `Entrar na Lista de Espera`.',
              feedback:
                'Ambas as setas estão invertidas! No `<<include>>`, o caso base aponta para o incluído; no `<<extend>>`, o caso opcional aponta para o base.',
            },
            {
              text: 'Ambos são `<<include>>` saindo de `Reservar Aula`.',
              feedback:
                'A lista de espera só ocorre na condição de turma lotada — comportamento condicional é `<<extend>>`, não `<<include>>`.',
            },
            {
              text: 'Ambos são `<<extend>>` porque o ator pode cancelar a tela.',
              feedback:
                'Cancelar uma ação faz parte do fluxo alternativo, mas verificar vagas é passo obrigatório para concluir qualquer reserva (`<<include>>`).',
            },
          ],
        },
      ],
    },
    {
      id: 'continuidade-bdd-e-revisao-ia',
      title:
        'Continuidade: Critérios BDD (Dado/Quando/Então) e revisão crítica de requisitos por IA',
      blocks: [
        {
          type: 'text',
          text: 'Critérios de aceite descrevem o que o produto deve fazer em situações observáveis. Escreva os cenários BDD em **Gherkin** e associe cada passo a uma definição de teste para executá-los com o Cucumber. No cenário da última vaga, a definição do passo Quando precisa disparar duas solicitações concorrentes. Ao revisar cenários sugeridos por IA, confira também estornos, horários limite e concorrência.',
        },
        {
          type: 'code',
          language: 'text',
          caption:
            'Arquivo Gherkin para a reserva de aula. A execução requer as definições dos passos.',
          code: `# language: pt
Funcionalidade: Reserva de aula coletiva

  Cenário: Reserva com vaga disponível
    Dado que o aluno "Lucas" está adimplente
    E que a aula "Spinning 19h" tem 1 vaga restante
    Quando "Lucas" solicita uma reserva em "Spinning 19h"
    Então a API confirma a reserva com status 201
    E a aula fica com 0 vagas restantes

  Cenário: Duas solicitações para a última vaga
    Dado que a aula "Spinning 19h" tem 1 vaga restante
    Quando dois alunos adimplentes solicitam a última vaga simultaneamente
    Então uma solicitação recebe status 201
    E a outra recebe status 409 com opção de lista de espera
    E a aula fica com 0 vagas restantes`,
        },
        {
          type: 'reveal',
          question:
            'Qual critério do INVEST é quebrado por: "Como sistema, quero migrar todas as tabelas para PostgreSQL e implementar todo o módulo financeiro, catraca e app mobile na sprint 1"?',
          answer:
            'Quebra **quatro critérios ao mesmo tempo**: não tem papel humano/valor de negócio claro (**V**aluable), não é pequena (**S**mall — é um épico gigante), não é estimável com confiança (**E**stimable) e mistura frentes acopladas que não são independentes (**I**ndependent).',
        },
      ],
    },
    {
      id: 'pratica-progressiva',
      title: 'Prática progressiva: auditoria de requisitos ambíguos, INVEST e casos de borda',
      blocks: [
        {
          type: 'text',
          text: 'Em vez de apenas decorar siglas, vamos construir ferramentas reais de qualidade de requisitos em Python e resolver cenários não triviais de elicitação e BDD.',
        },
        {
          type: 'python',
          activityId: 'req-py-n1-triagem-de-redacao',
          title: 'Nível 1 — Triagem de termos vagos em requisitos',
          task: 'Implemente `auditar_requisito(texto)` para retornar uma lista de alertas. Sinalize cada palavra de `TERMOS_VAGOS` presente no texto, ignorando maiúsculas e minúsculas. Inclua um alerta se faltar o verbo `deve`, que também aparece em `não deve`. Uma lista vazia indica apenas que a triagem não encontrou esses sinais. Por exemplo, “O sistema deve funcionar.” passa pela triagem, mas ainda precisa de um resultado observável para virar um requisito testável.',
          code: `TERMOS_VAGOS = ["rápido", "rapidamente", "fácil", "intuitivo", "bonito", "seguro", "adequado", "vários"]

def auditar_requisito(texto: str) -> list[str]:
    # TODO: verificar verbo "deve" e detectar termos vagos presentes no texto
    return []

print(auditar_requisito("O sistema precisa ser rápido e intuitivo."))
print(auditar_requisito("O endpoint de check-in deve responder em até 300 ms no p95."))
`,
          solution: `import re

TERMOS_VAGOS = ["rápido", "rapidamente", "fácil", "intuitivo", "bonito", "seguro", "adequado", "vários"]

def auditar_requisito(texto: str) -> list[str]:
    alertas = []
    palavras = set(re.findall(r"[a-zà-ú]+", texto.lower()))
    if "deve" not in palavras:
        alertas.append("ausência de verbo normativo 'deve'")
    for termo in TERMOS_VAGOS:
        if termo in palavras:
            alertas.append(f"termo vago: {termo}")
    return alertas

print(auditar_requisito("O sistema precisa ser rápido e intuitivo."))
print(auditar_requisito("O endpoint de check-in deve responder em até 300 ms no p95."))
`,
          checks: [
            {
              label: 'Sinaliza a falta de "deve" e os termos vagos, mesmo em maiúsculas',
              test: `(lambda alertas: len(alertas) == 3 and all(any(termo in a.lower() for a in alertas) for termo in ("deve", "rápido", "intuitivo")))(auditar_requisito("O sistema precisa ser RÁPIDO e intuitivo."))`,
            },
            {
              label: 'Devolve só a lista de alertas, sem decidir se o requisito é testável',
              test: `auditar_requisito("O endpoint de check-in deve responder em até 300 ms no p95.") == [] and auditar_requisito("O sistema deve funcionar.") == []`,
            },
            {
              label: 'Sinaliza "adequado" e aceita o verbo na forma negativa',
              test: `any("adequado" in alerta.lower() for alerta in auditar_requisito("O tempo de resposta deve ser adequado.")) and auditar_requisito("A catraca não deve liberar a entrada após 5 dias de atraso.") == []`,
            },
          ],
        },
        {
          type: 'python',
          activityId: 'req-py-n2-validador-invest-bdd',
          title: 'Nível 2 — Validador de prontidão (Definition of Ready) de História INVEST + BDD',
          task: 'Implemente `avaliar_historia(historia: dict) -> list[str]` que devolve a lista de defeitos encontrados (vazia se pronta para sprint). Uma história é pronta apenas se: (1) `papel` não for vazio nem genérico (`"usuário"` ou `"sistema"`); (2) `valor` (o "para que") não for vazio; (3) `pontos` (estimativa) for inteiro entre 1 e 8 (acima de 8 viola Small); (4) `cenarios_bdd` tiver pelo menos 2 cenários, sendo ao menos 1 com `tipo == "feliz"` e ao menos 1 com `tipo == "excecao"`.',
          code: `def avaliar_historia(historia: dict) -> list[str]:
    # TODO: validar papel específico, valor, tamanho <= 8 e cobertura BDD (feliz + excecao)
    return []
`,
          solution: `def avaliar_historia(historia: dict) -> list[str]:
    erros = []
    papel = str(historia.get("papel", "")).strip().lower()
    if not papel or papel in {"usuário", "usuario", "sistema"}:
        erros.append("papel genérico ou ausente")
    if not str(historia.get("valor", "")).strip():
        erros.append("valor de negócio ausente (viola V do INVEST)")
    pontos = historia.get("pontos")
    if not isinstance(pontos, int) or pontos < 1 or pontos > 8:
        erros.append("estimativa fora do limite 1..8 (viola S/E do INVEST)")
    cenarios = historia.get("cenarios_bdd") or []
    tipos = {c.get("tipo") for c in cenarios if isinstance(c, dict)}
    if len(cenarios) < 2 or "feliz" not in tipos or "excecao" not in tipos:
        erros.append("faltam cenários BDD feliz e de exceção (viola T do INVEST)")
    return erros
`,
          checks: [
            {
              label:
                'Aprova história bem escrita com papel específico, valor, <= 8 pontos e BDD completo',
              test: `avaliar_historia({"papel": "Recepcionista", "valor": "evitar fila no pico", "pontos": 3, "cenarios_bdd": [{"tipo": "feliz"}, {"tipo": "excecao"}]}) == []`,
            },
            {
              label: 'Reprova história grande (13 pontos), com papel "sistema" e só caminho feliz',
              test: `len(avaliar_historia({"papel": "sistema", "valor": "melhorar", "pontos": 13, "cenarios_bdd": [{"tipo": "feliz"}]})) == 3`,
            },
            {
              label: 'Detecta ausência de valor de negócio',
              test: `len(avaliar_historia({"papel": "Aluno", "valor": "   ", "pontos": 2, "cenarios_bdd": [{"tipo": "feliz"}, {"tipo": "excecao"}]})) == 1`,
            },
          ],
        },
        {
          type: 'quiz',
          activityId: 'req-q2-n3-revisao-ia',
          question:
            'Nível 3 (Revisão Crítica): Você pediu a uma IA para escrever critérios de aceite para "Cancelamento de plano anual da Academia". Ela devolveu apenas: *"Quando o aluno clicar em Cancelar, o plano muda para Cancelado e envia e-mail."* Qual é a lacuna MAIS crítica que um engenheiro de requisitos precisa apontar antes de aprovar essa especificação?',
          options: [
            {
              text: 'Faltam regras de negócio e exceções críticas: prazo mínimo de aviso, cálculo de multa/estorno proporcional, bloqueio imediato ou ao fim do ciclo já pago, e o que fazer com faturas vencidas ou aulas futuras reservadas.',
              correct: true,
              feedback:
                'Excelente! O caminho feliz é só 20% de um requisito de domínio financeiro. Sem definir estorno, multa, fim de vigência e reservas futuras, cada dev vai inventar uma regra diferente (ou gerar processo judicial).',
            },
            {
              text: 'Faltou especificar a cor hexadecimal do botão Cancelar em CSS.',
              feedback:
                'Estilo visual detalhado pertence ao design system/protótipo, não ao núcleo de regras de negócio do cancelamento.',
            },
            {
              text: 'Faltou dizer em qual linguagem de programação o e-mail será enviado.',
              feedback:
                'Requisitos funcionais devem especificar O QUÊ o sistema precisa cumprir, sem amarrar implementação desnecessária.',
            },
            {
              text: 'Nenhuma lacuna: o critério está enxuto e já cobre todo o fluxo de cancelamento.',
              feedback:
                'Um critério tão raso em operação financeira garante bugs em produção, conflitos com o Código de Defesa do Consumidor e retrabalho certo.',
            },
          ],
        },
        {
          type: 'order',
          activityId: 'req-ord-ciclo-elicitacao',
          prompt:
            'Ordene o fluxo recomendado para transformar uma demanda vaga de cliente em requisitos prontos para desenvolvimento:',
          items: [
            'Mapear stakeholders diretos e indiretos (quem usa, quem paga, quem opera e quem audita)',
            'Combinar técnicas de elicitação (entrevistas, observação no local e análise de documentos)',
            'Separar e redigir RF, RNF mensuráveis e Restrições eliminando termos ambíguos',
            'Modelar Casos de Uso e fatiar em Histórias INVEST com cenários BDD (feliz + exceções)',
            'Validar explicitamente os cenários e regras de borda com os stakeholders antes de codificar',
          ],
          explanation:
            'Pular o mapeamento de stakeholders ou a validação antes do código é a principal causa de descobrir "faltou o perfil do financeiro" no dia da entrega.',
        },
      ],
    },
  ],
  recap: [
    'Combinar entrevistas, observação direta e análise documental revela tanto o processo oficial quanto os gargalos reais do dia a dia.',
    'Requisitos úteis são verificáveis: diferenciam RF, RNF mensurável e Restrições e eliminam adjetivos vagos ("rápido", "seguro", "fácil").',
    'Na UML, `<<include>>` é obrigatório (`Base --> Incluído`) e `<<extend>>` é condicional (`Extensão --> Base`).',
    'Histórias INVEST combinadas com cenários BDD (Dado/Quando/Então) cobrindo caminho feliz e exceções funcionam como contrato direto entre negócio, dev e QA.',
  ],
  cards: [
    {
      id: 'req-elicitacao-combinada',
      front: 'Por que entrevista sozinha não basta na elicitação de requisitos?',
      back: 'Porque entrevistados esquecem exceções do dia a dia ou descrevem o processo ideal; observação direta e análise documental revelam gargalos reais e regras contratuais.',
    },
    {
      id: 'req-rf-vs-rnf',
      front: 'Como diferenciar RF, RNF e Restrição?',
      back: 'RF define O QUE o sistema faz; RNF define QUÃO BEM faz (latência, segurança, disponibilidade mensuráveis); Restrição define limites impostos (stack obrigatória, lei, prazo).',
    },
    {
      id: 'req-include-vs-extend',
      front: 'Qual a diferença de sentido e seta entre `<<include>>` e `<<extend>>`?',
      back: '`<<include>>` é obrigatório e a seta vai do caso base para o incluído. `<<extend>>` é opcional/condicional e a seta vai da extensão para o caso base.',
    },
    {
      id: 'req-invest',
      front: 'O que significa a sigla INVEST para Histórias de Usuário?',
      back: 'Independent (independente), Negotiable (negociável), Valuable (gera valor), Estimable (estimável), Small (pequena) e Testable (testável).',
    },
    {
      id: 'req-bdd-gherkin',
      front: 'Por que adicionar cenários Dado/Quando/Então (BDD) às histórias?',
      back: 'Porque transformam expectativas em exemplos concretos e verificáveis — especialmente para casos de borda, erros e regras de exceção.',
    },
    {
      id: 'req-ia-armadilha',
      front: 'Qual é o maior risco ao aceitar requisitos rascunhados por IA sem revisão humana?',
      back: 'A IA tende a cobrir apenas o caminho feliz com termos vagos e omitir exceções críticas do domínio (estorno, concorrência, permissões e conformidade legal).',
    },
  ],
  mission: {
    title: 'Reescreva um requisito real do seu projeto (ou da Academia) no padrão de produção',
    text: 'Escolha uma funcionalidade crítica (como check-in na catraca ou cancelamento de plano) e produza um pacote mínimo verificável.',
    steps: [
      'Liste 3 stakeholders com interesses potencialmente conflitantes sobre essa funcionalidade.',
      'Escreva 2 RF, 2 RNF com metas numéricas verificáveis e 1 Restrição, garantindo zero adjetivos vagos.',
      'Desenhe um mini diagrama de Casos de Uso com pelo menos um `<<include>>` e um `<<extend>>` com setas na direção correta.',
      'Escreva 1 História INVEST acompanhada de 3 cenários BDD (1 caminho feliz + 2 casos de exceção/concorrência).',
    ],
  },
  sources: [
    {
      title: 'OMG UML — Especificação de Diagramas de Casos de Uso',
      url: 'https://www.omg.org/spec/UML/',
    },
    {
      title: 'Agile Alliance — INVEST in Good Stories',
      url: 'https://www.agilealliance.org/glossary/invest/',
    },
    {
      title: 'Cucumber Docs — Escrevendo cenários BDD em Gherkin',
      url: 'https://cucumber.io/docs/gherkin/reference/',
    },
  ],
};
