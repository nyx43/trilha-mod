import { LessonContent } from '../types';

export const content: LessonContent = {
  hook: 'Requisitos nunca ficam congelados depois da primeira reunião. No meio do semestre — ou na véspera do lançamento — o cliente muda uma regra tributária, o financeiro briga com o marketing por prioridade e ninguém sabe quais telas, endpoints e testes serão quebrados pela mudança. **Especificação IEEE 830/29148, Prototipagem, Matriz de Rastreabilidade, Gestão de Mudanças e Priorização** são o sistema nervoso que mantém o projeto sob controle.',
  sections: [
    {
      id: 'srs-e-prototipagem-antes-do-codigo',
      title: 'Especificação SRS (IEEE 830 / ISO 29148) e Prototipagem que economiza meses',
      blocks: [
        {
          type: 'text',
          text: 'Documentar requisitos não significa escrever uma apostila de 200 páginas que ninguém lê. A norma **IEEE 830** (evoluída na **ISO/IEC/IEEE 29148**) existe como um **checklist de completude**: garante que você não esqueceu escopo, perfis de usuário, interfaces externas, RNFs nem premissas. Combinada com **prototipagem rápida**, ela valida o entendimento antes de gastar uma única sprint de backend.',
        },
        {
          type: 'table',
          caption: 'Qual nível de protótipo escolher em cada fase do projeto?',
          head: [
            'Tipo de protótipo',
            'Custo / Velocidade',
            'O que valida melhor',
            'Quando NÃO usar',
          ],
          rows: [
            [
              'Papel / Sketch',
              'Minutos · custo quase zero',
              'Fluxo de telas, ausência de campos críticos e compreensão inicial',
              'Quando precisa testar microinterações complexas ou acessibilidade',
            ],
            [
              'Baixa fidelidade (Wireframe)',
              'Horas · cinza e sem branding',
              'Hierarquia de informação e navegação sem distrair com cores',
              'Quando stakeholders precisam aprovar identidade visual final',
            ],
            [
              'Alta fidelidade (Figma / HTML clicável)',
              'Dias · próximo do produto real',
              'Testes de usabilidade com usuários reais, responsividade e validação fina de fluxos',
              'Antes de validar as regras de negócio (gasta tempo polindo tela errada!)',
            ],
          ],
        },
        {
          type: 'callout',
          tone: 'warning',
          title: 'Protótipo descartável vs. evolutivo: o perigo do "já está pronto!"',
          text: 'Um risco real da prototipagem em alta fidelidade é o cliente olhar uma tela bonita em HTML/Figma e achar que o sistema inteiro já está 80% pronto — ignorando banco, autenticação, integrações e regras de exceção. Deixe explícito desde o primeiro minuto se o protótipo é **descartável** (só para validar UX) ou **evolutivo**.',
        },
      ],
    },
    {
      id: 'rastreabilidade-e-gestao-de-mudancas',
      title: 'Matriz de Rastreabilidade e Controle de Mudanças (Change Request)',
      blocks: [
        {
          type: 'text',
          text: 'Quando o dono da academia pede *"muda o prazo de tolerância de inadimplência de 5 para 10 dias e manda aviso no WhatsApp"*, como o time estima o impacto sem esquecer um teste ou uma tela? Com uma **Matriz de Rastreabilidade** ligando cada requisito (`RF-04`) à origem de negócio, aos módulos de código, endpoints e casos de teste!',
        },
        {
          type: 'table',
          caption: 'Exemplo real de Matriz de Rastreabilidade (Sistema de Academia)',
          head: [
            'ID Req',
            'Origem / Stakeholder',
            'Módulos / Endpoints impactados',
            'Casos de Teste',
            'Prioridade',
          ],
          rows: [
            [
              'RF-01',
              'Recepção · Entrevista #1',
              '`POST /api/checkin`, Tela Catraca',
              'CT-01, CT-02 (adimplente/bloqueado)',
              'Must',
            ],
            [
              'RF-04',
              'Financeiro · Contrato §4',
              '`billing.service`, Job Notificação, `POST /api/checkin`',
              'CT-08 (5 dias), CT-09 (alerta)',
              'Must',
            ],
            [
              'RNF-01',
              'Operação · Observação 18h',
              'Índice SQL `matriculas(cpf)`, Cache Redis',
              'CT-PERF-01 (p95 <= 300ms)',
              'Must',
            ],
            [
              'RF-12',
              'Professores · Workshop',
              'App Aluno (`TreinoCard`), `GET /api/treinos`',
              'CT-21 (exibição offline)',
              'Should',
            ],
          ],
        },
        {
          type: 'flow',
          caption: 'Fluxo disciplinado de uma Solicitação de Mudança (Change Request / CCB)',
          actors: ['Stakeholder', 'Analista / Eng. Req', 'Análise de Impacto', 'Comitê (CCB) / PO'],
          steps: [
            {
              from: 0,
              to: 1,
              label: 'Abre Change Request (CR-14)',
              text: 'Registra o pedido, justificativa de negócio e urgência — sem alterar código por mensagem informal.',
              tone: 'ok',
            },
            {
              from: 1,
              to: 2,
              label: 'Consulta Matriz de Rastreabilidade',
              text: 'Identifica todos os RFs, RNFs, telas, APIs, testes e prazos afetados por CR-14.',
              tone: 'ok',
            },
            {
              from: 2,
              to: 3,
              label: 'Relatório de custo, risco e prazo',
              text: 'Apresenta opções claras: absorver tirando outro item (trade-off), estender prazo ou adiar para v2.',
              tone: 'ok',
            },
            {
              from: 3,
              to: 1,
              label: 'Aprovada / Adiada / Rejeitada',
              text: 'Se aprovada, atualiza a versão da baseline de requisitos e registra no histórico (nunca muda silenciosamente).',
              tone: 'ok',
            },
          ],
        },
      ],
    },
    {
      id: 'priorizacao-e-negociacao-de-conflitos',
      title: 'Priorização (MoSCoW, 100 Pontos, Kano) e Negociação de Conflitos',
      blocks: [
        {
          type: 'text',
          text: 'Se você perguntar ao cliente qual requisito é prioridade, a resposta padrão será **"todos são urgentes"**. Técnicas formais de priorização forçam **escolhas sob escassez real** — e resolvem conflitos entre áreas com critérios transparentes.',
        },
        {
          type: 'cards',
          columns: 3,
          items: [
            {
              label: 'MoSCoW',
              title: "Must · Should · Could · Won't (agora)",
              text: "Classifica o que é obrigatório para ir ao ar (`Must`), importante (`Should`), desejável (`Could`) e explicitamente fora desta entrega (`Won't`). Regra saudável: `Must` não deve passar de ~60% do esforço!",
            },
            {
              label: '100 Pontos (Votação Cumulativa)',
              title: 'Orçamento fixo elimina "tudo é alta"',
              text: 'Cada stakeholder recebe exatamente 100 pontos para distribuir entre os requisitos. Se alguém quer 70 pontos no financeiro, só sobram 30 para o resto — o trade-off fica visível na hora.',
            },
            {
              label: 'Modelo de Kano',
              title: 'Básico · Desempenho · Encantador',
              text: '**Básico** (catraca funcionar): ausência gera revolta, presença é obrigação. **Desempenho** (velocidade): quanto melhor, mais satisfação. **Encantador** (sugestão inteligente de treino): surpreende positivamente.',
            },
          ],
        },
        {
          type: 'quiz',
          activityId: 'req2-q1-conflito-stakeholders',
          question:
            'Na Academia, há um conflito direto: o **Financeiro** exige bloquear o aluno imediatamente após 1 dia de atraso para reduzir inadimplência; a **Recepção** quer liberar sempre para evitar discussões e filas às 18h. Como um engenheiro de requisitos resolve esse conflito de forma profissional?',
          options: [
            {
              text: 'Tornar o conflito explícito em uma negociação baseada em dados e propor um compromisso verificável: ex. aviso amigável do dia 1 ao 5 no app/catraca, bloqueio automático no dia 6 e botão auditado de liberação única pela recepção.',
              correct: true,
              feedback:
                'Excelente mediação! Negociação de requisitos busca atender aos interesses reais de ambos (reduzir inadimplência E evitar atrito desnecessário na fila) com regra objetiva, mensurável e auditável.',
            },
            {
              text: 'Implementar a regra do Financeiro em segredo porque é quem assina o cheque do projeto.',
              feedback:
                'Ignorar a operação da recepção gera gambiarras em produção (como desligar a catraca às 18h), destruindo o próprio controle financeiro.',
            },
            {
              text: 'Deixar os dois comportamentos como código comentado para o desenvolvedor decidir na hora do deploy.',
              feedback:
                'Transferir conflito de negócio não resolvido para o desenvolvedor é a receita certa para retrabalho e desgaste político.',
            },
            {
              text: 'Classificar os dois requisitos como `Must` no SRS sem discutir a contradição.',
              feedback:
                'Requisitos contraditórios violam diretamente a propriedade de **consistência** exigida pela IEEE 830 / ISO 29148.',
            },
          ],
        },
      ],
    },
    {
      id: 'continuidade-iso29148-e-adrs',
      title: 'Continuidade: ISO/IEC/IEEE 29148, ADRs e requisitos vivos no Git',
      blocks: [
        {
          type: 'text',
          text: 'A disciplina apresenta a clássica IEEE 830 (1998), mas no mercado atual ela foi sucedida pela **ISO/IEC/IEEE 29148** e complementada em times ágeis por **docs-as-code** (requisitos, cenários BDD e **ADRs — Architecture Decision Records** versionados no mesmo repositório Git do código). Assim, toda alteração de requisito gera Pull Request revisado, histórico imutável (`git blame`) e rastreabilidade direta até o commit e teste que a implementaram.',
        },
        {
          type: 'classify',
          activityId: 'req2-c1-kano-moscow',
          prompt:
            'Classifique cada funcionalidade do Sistema de Academia na categoria correta do **Modelo de Kano**:',
          buckets: [
            'Atributo Básico (Must-be)',
            'Atributo de Desempenho (Linear)',
            'Atributo Encantador (Delighter)',
          ],
          items: [
            {
              text: 'Catraca liberar acesso corretamente para aluno ativo e adimplente',
              bucket: 0,
            },
            { text: 'Não cobrar duas vezes o cartão de crédito do mesmo aluno no mês', bucket: 0 },
            {
              text: 'Reduzir o tempo de validação da biometria de 2 segundos para 0,2 segundo',
              bucket: 1,
            },
            {
              text: 'Aumentar o percentual de aulas coletivas disponíveis para reserva online',
              bucket: 1,
            },
            {
              text: 'Sugerir automaticamente horários menos lotados com base no histórico do aluno',
              bucket: 2,
            },
            {
              text: 'Gerar retrospectiva animada de metas batidas no fim do ano no app',
              bucket: 2,
            },
          ],
          explanation:
            'Atributos básicos não dão aplauso quando funcionam, mas geram cancelamento imediato se falharem; desempenho aumenta satisfação proporcionalmente; encantadores diferenciam o produto, mas nunca devem furar a fila dos básicos.',
        },
      ],
    },
    {
      id: 'pratica-progressiva',
      title: 'Prática progressiva: protótipo de validação, rastreabilidade de impacto e 100 Pontos',
      blocks: [
        {
          type: 'text',
          text: 'Combine validação visual com engenharia quantitativa: prototipe um fluxo interativo de check-in da Academia (**Nível 1**), construa um motor de análise de impacto via matriz de rastreabilidade + priorização 100 Pontos (**Nível 2**) e resolva um dilema real de mudança de escopo (**Nível 3**).',
        },
        {
          type: 'playground',
          activityId: 'req2-pg-n1-prototipo-catraca',
          title: 'Nível 1 — Protótipo clicável de alta fidelidade (validação de regra da catraca)',
          task: 'Valide a regra negociada entre Financeiro e Recepção no protótipo: complete a função `validarCheckin()` para que: `diasAtraso === 0` mostre `"LIBERADO"` com classe `ok`; `diasAtraso` entre `1` e `5` mostre `"LIBERADO COM AVISO"` com classe `warn`; `diasAtraso >= 6` mostre `"BLOQUEADO"` com classe `block` e exiba o botão `#btn-excecao`.',
          height: 260,
          html: `<main class="card">
  <h3>Protótipo · Catraca Academia</h3>
  <label for="atraso">Dias de atraso da fatura:</label>
  <input id="atraso" type="number" min="0" value="0" />
  <button id="btn-testar" type="button">Simular leitura</button>
  <p id="status" class="ok">Aguardando leitura...</p>
  <button id="btn-excecao" type="button" hidden>Liberar exceção (1 dia · auditado)</button>
</main>`,
          css: `body { font-family: system-ui, sans-serif; background: #0f172a; color: #e2e8f0; padding: 14px; }
.card { background: #1e293b; padding: 14px; border-radius: 10px; max-width: 420px; }
input, button { padding: 6px 10px; border-radius: 6px; border: 1px solid #475569; margin: 6px 4px 6px 0; }
button { background: #2563eb; color: #fff; border: none; cursor: pointer; }
.ok { color: #4ade80; font-weight: 700; }
.warn { color: #fbbf24; font-weight: 700; }
.block { color: #f87171; font-weight: 700; }`,
          js: `function validarCheckin() {
  const dias = Number(document.getElementById('atraso').value || 0);
  const status = document.getElementById('status');
  const btnExcecao = document.getElementById('btn-excecao');
  // TODO: aplicar as 3 faixas (0, 1..5, >= 6) atualizando texto, className e btnExcecao.hidden
}
document.getElementById('btn-testar').addEventListener('click', validarCheckin);`,
          solution: {
            js: `function validarCheckin() {
  const dias = Number(document.getElementById('atraso').value || 0);
  const status = document.getElementById('status');
  const btnExcecao = document.getElementById('btn-excecao');
  if (dias <= 0) {
    status.textContent = 'LIBERADO';
    status.className = 'ok';
    btnExcecao.hidden = true;
  } else if (dias <= 5) {
    status.textContent = 'LIBERADO COM AVISO';
    status.className = 'warn';
    btnExcecao.hidden = true;
  } else {
    status.textContent = 'BLOQUEADO';
    status.className = 'block';
    btnExcecao.hidden = false;
  }
}
document.getElementById('btn-testar').addEventListener('click', validarCheckin);`,
          },
          checks: [
            {
              label:
                'Atraso de 3 dias exibe "LIBERADO COM AVISO" (classe warn) e mantém botão exceção oculto',
              test: `const inp = document.getElementById('atraso');
              const btn = document.getElementById('btn-testar');
              const st = document.getElementById('status');
              const exc = document.getElementById('btn-excecao');
              inp.value = '3'; btn.click();
              return st.textContent.includes('AVISO') && st.className === 'warn' && exc.hidden === true;`,
            },
            {
              label:
                'Atraso de 7 dias exibe "BLOQUEADO" (classe block) e revela o botão de exceção auditada',
              test: `const inp = document.getElementById('atraso');
              const btn = document.getElementById('btn-testar');
              const st = document.getElementById('status');
              const exc = document.getElementById('btn-excecao');
              inp.value = '7'; btn.click();
              return st.textContent.includes('BLOQUEADO') && st.className === 'block' && exc.hidden === false;`,
            },
          ],
        },
        {
          type: 'python',
          activityId: 'req2-py-n2-impacto-e-100pontos',
          title: 'Nível 2 — Análise de impacto na Matriz de Rastreabilidade + Votação 100 Pontos',
          task: 'Implemente duas funções: (1) `analisar_impacto(matriz, req_alterado)` que retorna `{"modulos": sorted_list, "testes": sorted_list, "dependentes": sorted_list}` incluindo todos os requisitos que listam `req_alterado` em `depende_de` (1 nível) e a união dos módulos e testes afetados; (2) `apurar_100_pontos(votos_por_stakeholder)` que **rejeita com `ValueError`** qualquer stakeholder cuja soma de pontos seja `!= 100` e retorna o ranking `[(req_id, total), ...]` ordenado por total decrescente e `req_id` crescente.',
          code: `def analisar_impacto(matriz: dict, req_alterado: str) -> dict:
    # TODO: coletar módulos e testes do requisito alterado + de todos que dependem dele
    return {"modulos": [], "testes": [], "dependentes": []}

def apurar_100_pontos(votos: dict[str, dict[str, int]]) -> list[tuple[str, int]]:
    # TODO: validar soma == 100 por stakeholder (raise ValueError) e consolidar ranking
    return []
`,
          solution: `def analisar_impacto(matriz: dict, req_alterado: str) -> dict:
    alvo = matriz[req_alterado]
    modulos = set(alvo.get("modulos", []))
    testes = set(alvo.get("testes", []))
    dependentes = []
    for req_id, info in matriz.items():
        if req_alterado in info.get("depende_de", []):
            dependentes.append(req_id)
            modulos.update(info.get("modulos", []))
            testes.update(info.get("testes", []))
    return {
        "modulos": sorted(modulos),
        "testes": sorted(testes),
        "dependentes": sorted(dependentes),
    }

def apurar_100_pontos(votos: dict[str, dict[str, int]]) -> list[tuple[str, int]]:
    totais = {}
    for pessoa, dist in votos.items():
        if sum(dist.values()) != 100 or any(v < 0 for v in dist.values()):
            raise ValueError(f"Voto inválido de {pessoa}: deve somar exatamente 100")
        for req_id, pts in dist.items():
            totais[req_id] = totais.get(req_id, 0) + pts
    return sorted(totais.items(), key=lambda x: (-x[1], x[0]))
`,
          checks: [
            {
              label: 'Propaga impacto para dependentes, módulos e testes sem duplicatas',
              test: `analisar_impacto({"RF-04": {"modulos": ["billing"], "testes": ["CT-08"], "depende_de": []}, "RF-01": {"modulos": ["catraca"], "testes": ["CT-01", "CT-08"], "depende_de": ["RF-04"]}, "RF-12": {"modulos": ["app"], "testes": ["CT-21"], "depende_de": []}}, "RF-04") == {"modulos": ["billing", "catraca"], "testes": ["CT-01", "CT-08"], "dependentes": ["RF-01"]}`,
            },
            {
              label: 'Consolida votação 100 Pontos na ordem correta',
              test: `apurar_100_pontos({"Dono": {"RF-04": 60, "RF-01": 40}, "Recepcao": {"RF-01": 70, "RF-04": 30}}) == [("RF-01", 110), ("RF-04", 90)]`,
            },
            {
              label:
                'Recusa com ValueError quando um stakeholder tenta distribuir mais ou menos que 100 pontos',
              test: `(lambda d: (exec("try:\\n apurar_100_pontos({'Dono': {'RF-01': 120}})\\n d['ok'] = False\\nexcept ValueError:\\n d['ok'] = True", {'apurar_100_pontos': apurar_100_pontos, 'd': d}), d['ok'])[1])({})`,
            },
          ],
        },
        {
          type: 'quiz',
          activityId: 'req2-q2-n3-scope-creep',
          question:
            'Nível 3 (Gestão de Mudanças): Faltando 10 dias para a entrega da v1, o cliente envia uma mensagem no WhatsApp pedindo "só um relatoriozinho de comissão por personal trainer". A matriz mostra que esse pedido toca 2 tabelas novas, regras fiscais e 6 casos de teste (estimados em 7 dias). Qual é a ação correta do time?',
          options: [
            {
              text: 'Formalizar uma Change Request com a análise de impacto (7 dias + risco de regressão) e apresentar ao decisor duas opções claras: adiar o relatório para a v1.1 ou retirar um item de menor prioridade da v1 mantendo a qualidade.',
              correct: true,
              feedback:
                'Postura sênior! Absorver escopo informal (scope creep) sem negociar prazo ou cortes destrói testes e compromete o lançamento inteiro.',
            },
            {
              text: 'Aceitar direto pelo WhatsApp e cortar os testes automatizados dos outros módulos para caber nos 10 dias.',
              feedback:
                'Cortar testes em véspera de release para absorver scope creep gera bugs em produção nos fluxos principais.',
            },
            {
              text: 'Recusar automaticamente sem explicar impacto, dizendo que o documento IEEE 830 não pode mudar nunca.',
              feedback:
                'Requisitos mudam em projetos reais; gestão de mudanças existe para **decidir com transparência**, não para proibir mudanças.',
            },
            {
              text: 'Implementar apenas uma tela estática falsa no frontend sem avisar o cliente.',
              feedback:
                'Entregar funcionalidade falsa quebra a confiança do cliente e cria dívida técnica imediata.',
            },
          ],
        },
      ],
    },
  ],
  recap: [
    'O padrão IEEE 830 / ISO 29148 organiza a especificação garantindo completude, consistência, rastreabilidade e ausência de ambiguidade.',
    'Prototipagem valida fluxos e regras cedo por uma fração do custo de reescrever backend e banco.',
    'A Matriz de Rastreabilidade conecta requisitos a código e testes, permitindo estimar o impacto real de qualquer Change Request.',
    'Técnicas como MoSCoW, 100 Pontos e Modelo de Kano transformam disputas políticas entre stakeholders em decisões objetivas sob escassez.',
  ],
  cards: [
    {
      id: 'req2-ieee-830',
      front: 'Qual o objetivo prático da norma IEEE 830 / ISO 29148 em um projeto moderno?',
      back: 'Servir como estrutura e checklist de qualidade (completude, consistência, verificabilidade e rastreabilidade) para a Especificação de Requisitos de Software (SRS).',
    },
    {
      id: 'req2-prototipo-fidelidade',
      front: 'Por que começar por protótipo de papel ou baixa fidelidade antes de alta fidelidade?',
      back: 'Porque valida fluxos e regras em minutos/horas sem desperdiçar esforço polindo interface de uma ideia que ainda vai mudar.',
    },
    {
      id: 'req2-rastreabilidade',
      front: 'O que uma Matriz de Rastreabilidade responde durante uma mudança de requisito?',
      back: 'Responde exatamente qual stakeholder pediu o requisito (rastreabilidade para trás) e quais módulos, endpoints e testes serão afetados se ele mudar (para frente).',
    },
    {
      id: 'req2-moscow-regra',
      front: 'Por que evitar classificar 100% dos requisitos como `Must` no MoSCoW?',
      back: 'Porque sem margem em `Should` e `Could`, qualquer imprevisto no projeto compromete a entrega mínima viável — recomenda-se manter `Must` em até ~60% do esforço.',
    },
    {
      id: 'req2-100-pontos',
      front: 'Como a técnica dos 100 Pontos combate o problema do "tudo é prioridade máxima"?',
      back: 'Ela impõe um orçamento fixo de exatamente 100 pontos por stakeholder, forçando escolhas explícitas e mensuráveis entre requisitos concorrentes.',
    },
    {
      id: 'req2-kano',
      front: 'No Modelo de Kano, qual a diferença entre atributo Básico e Encantador?',
      back: 'Básico é obrigatório (se faltar, gera revolta; se existir, é o mínimo esperado). Encantador surpreende quando presente, mas não gera reclamação se ausente na v1.',
    },
  ],
  mission: {
    title: 'Conduza uma simulação real de Change Request e priorização',
    text: 'Aplique os artefatos desta aula sobre um sistema real (como o Sistema de Academia da disciplina).',
    steps: [
      'Monte uma Matriz de Rastreabilidade com 6 requisitos ligando Origem, Módulo/Endpoint e Caso de Teste.',
      'Simule uma Change Request que altera uma regra central e liste todos os artefatos afetados usando sua matriz.',
      'Aplique a técnica dos 100 Pontos com dois papéis opostos (ex.: Financeiro e Recepção) e registre o ranking consolidado.',
      'Escreva um ADR curto (10 linhas) no Git documentando a decisão tomada e os trade-offs aceitos.',
    ],
  },
  sources: [
    {
      title: 'ISO/IEC/IEEE 29148 — Systems and software engineering — Requirements engineering',
      url: 'https://www.iso.org/standard/72089.html',
    },
    {
      title: 'Architecture Decision Records (ADRs) — GitHub Documentation',
      url: 'https://adr.github.io/',
    },
    {
      title: 'BSTQB — Syllabus de Fundamentos e Engenharia de Testes/Requisitos',
      url: 'https://bstqb.org.br/b9/sobre/syllabus',
    },
  ],
};
