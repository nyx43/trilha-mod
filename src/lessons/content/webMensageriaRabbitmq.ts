import { LessonContent } from '../types';

export const content: LessonContent = {
  revision: 2,
  hook: 'Imagine um cliente clicando em "Finalizar Compra" na Black Friday e a requisição HTTP ficar presa 18 segundos esperando o serviço de e-mail, a emissão de nota fiscal na prefeitura e o antifraude responderem em cadeia — e se o servidor de e-mail piscar, a venda inteira falha. **Mensageria assíncrona com RabbitMQ** resolve esse acoplamento temporal, mas traz novos desafios reais: mensagens duplicadas, venenosas e consistência eventual.',
  sections: [
    {
      id: 'sincrono-vs-assincrono-na-vida-real',
      title: 'Quando HTTP síncrono trava — e onde RabbitMQ entra em produção',
      blocks: [
        {
          type: 'text',
          text: 'Na comunicação **síncrona** (REST/HTTP direto), o cliente bloqueia aguardando resposta imediata e todos os serviços da cadeia precisam estar no ar ao mesmo tempo. Na comunicação **assíncrona com broker** (RabbitMQ / AMQP), o produtor publica um evento e responde `202 Accepted` em milissegundos; os consumidores processam no seu próprio ritmo, mesmo sob picos de tráfego ou reinícios.',
        },
        {
          type: 'table',
          caption: 'Onde mensageria é usada de verdade no mercado',
          head: ['Caso real', 'Por que não fazer síncrono?', 'Papel do RabbitMQ'],
          rows: [
            [
              'E-commerce (checkout → nota fiscal + e-mail + estoque)',
              'Prefeitura/SMTP demoram segundos e ficam fora do ar',
              'Desacopla o pagamento imediato das tarefas pós-venda',
            ],
            [
              'Processamento de vídeos/PDFs/relatórios pesados',
              'Estouraria o timeout de 30s do navegador e travaria workers HTTP',
              'Distribui jobs entre múltiplos workers em paralelo (Competing Consumers)',
            ],
            [
              'Notificações multicanal (push + e-mail + auditoria)',
              'O serviço de pedidos não deveria conhecer 5 destinos diferentes',
              'Exchange Fanout ou Topic entrega cópias independentes para cada fila',
            ],
            [
              'Integração entre bancos / sistemas legados com limite de taxa',
              'Pico de tráfego derrubaria o sistema legado',
              'Fila amortece o pico (load leveling) com `prefetch_count` controlado',
            ],
          ],
        },
        {
          type: 'callout',
          tone: 'warning',
          title: 'Nem tudo deve virar fila!',
          text: 'Se o usuário precisa da resposta na hora para continuar (ex.: validar senha no login, consultar saldo atual ou verificar se um cupom existe), use **HTTP síncrono**. Mensageria adiciona complexidade operacional e consistência eventual — só pague esse preço quando desacoplamento, resiliência ou pico de carga justificarem.',
        },
      ],
    },
    {
      id: 'arquitetura-amqp-exchanges-queues',
      title: 'Por dentro do RabbitMQ: Producer, Exchange, Binding, Queue e Consumer',
      blocks: [
        {
          type: 'text',
          text: 'Um erro muito comum de iniciantes é achar que o produtor publica direto numa fila. No protocolo **AMQP (RabbitMQ)**, o produtor **sempre envia para uma Exchange**. Quem decide para qual(is) fila(s) a mensagem vai é o tipo da Exchange combinado com a **routing key** e os **bindings**.',
        },
        {
          type: 'flow',
          caption: 'Caminho de um evento `pedido.pago.pix` dentro do RabbitMQ',
          actors: [
            'API Pedidos (Producer)',
            'Exchange (Topic)',
            'Fila Faturamento',
            'Fila Auditoria',
          ],
          steps: [
            {
              from: 0,
              to: 1,
              label: 'publish("pedido.pago.pix", payload)',
              text: 'Produtor não sabe quantos consumidores existem — só publica o fato ocorrido.',
              tone: 'ok',
            },
            {
              from: 1,
              to: 2,
              label: 'Binding: pedido.pago.*',
              text: 'Casa com 1 palavra após `pedido.pago.` (`pix`), então entrega para Faturamento.',
              tone: 'ok',
            },
            {
              from: 1,
              to: 3,
              label: 'Binding: pedido.#',
              text: '`#` casa com zero ou mais palavras: Auditoria recebe TODOS os eventos de pedido.',
              tone: 'ok',
            },
          ],
        },
        {
          type: 'cards',
          columns: 3,
          items: [
            {
              label: 'Exchange Direct',
              title: 'Casamento exato de routing key',
              text: 'Entrega apenas às filas cujo binding é **idêntico** à routing key (ex.: `email.boas_vindas`). Ideal para roteamento pontual de tarefas.',
            },
            {
              label: 'Exchange Fanout',
              title: 'Broadcast total (ignora routing key)',
              text: 'Envia uma cópia da mensagem para **todas** as filas ligadas a ela. Ideal para pub/sub puro (ex.: evento de mudança de preço para vários serviços).',
            },
            {
              label: 'Exchange Topic',
              title: 'Padrões hierárquicos (`*` e `#`)',
              text: 'Roteia por curingas separados por ponto: `*` substitui exatamente 1 palavra; `#` substitui 0 ou mais palavras (ex.: `pagamento.*.falha`).',
            },
          ],
        },
        {
          type: 'quiz',
          activityId: 'rmq-q1-topic-routing',
          question:
            'Uma Exchange do tipo **Topic** tem três filas ligadas: Q1 (`pedido.*`), Q2 (`pedido.#`), Q3 (`*.pago.pix`). Se o produtor publicar uma mensagem com routing key `pedido.pago.pix`, quais filas recebem a mensagem?',
          options: [
            {
              text: 'Apenas **Q2** e **Q3**.',
              correct: true,
              feedback:
                'Exato! `pedido.*` exige exatamente 2 segmentos (`pedido.<um>`), então NÃO casa com 3 segmentos. `pedido.#` casa com qualquer sufixo após `pedido.`, e `*.pago.pix` casa com 1 palavra antes de `.pago.pix`.',
            },
            {
              text: 'Q1, Q2 e Q3 recebem a mensagem.',
              feedback:
                'Atenção ao curinga `*`: ele substitui **exatamente uma palavra** entre pontos, não várias. Para múltiplas palavras, só `#`.',
            },
            {
              text: 'Apenas Q2 recebe a mensagem.',
              feedback:
                'Q3 (`*.pago.pix`) também casa perfeitamente porque `pedido` substitui o `*` inicial.',
            },
            {
              text: 'Nenhuma fila recebe, pois falta correspondência exata.',
              feedback: 'Correspondência exata é regra da Exchange **Direct**, não da **Topic**.',
            },
          ],
        },
      ],
    },
    {
      id: 'confiabilidade-ack-dlq-idempotencia',
      title: 'O que os slides básicos não contam: ACK, Poison Messages, DLQ e Idempotência',
      blocks: [
        {
          type: 'text',
          text: 'No repositório `UGB-rabbitmq-main`, você vê o fluxo básico de produtor e consumidor. Em produção, três falhas acontecem **todas as semanas** se você não configurar o consumidor corretamente:',
        },
        {
          type: 'steps',
          items: [
            {
              title: '1. Manual ACK em vez de Auto-ACK',
              text: 'Com `auto_ack=True`, o RabbitMQ apaga a mensagem assim que a entrega na rede. Se o worker cair 2 ms depois (OOM/deploy), a mensagem **some para sempre**. Use `auto_ack=False` e só envie `basic_ack` depois de persistir o trabalho.',
            },
            {
              title: '2. Dead Letter Queue (DLQ) contra Poison Messages',
              text: 'Se uma mensagem com JSON corrompido sempre falha e você faz `basic_nack(requeue=True)`, ela entra em **loop infinito**, consumindo 100% da CPU e travando a fila. Limite as tentativas (ex.: 3 retries) e encaminhe falhas permanentes para uma **DLQ** para inspeção humana e reprocessamento.',
            },
            {
              title: '3. Consumidor Idempotente (entrega At-Least-Once)',
              text: 'Se um worker concluir uma cobrança e cair antes do ACK, o RabbitMQ pode reentregar a mensagem. Para um efeito no próprio banco, grave o `event_id` com uma restrição de unicidade e aplique a mudança na mesma transação. Para uma cobrança em serviço externo, envie a mesma chave de idempotência em todas as tentativas, conforme o contrato do provedor. Envie o ACK depois de registrar a conclusão.',
            },
          ],
        },
        {
          type: 'callout',
          tone: 'tip',
          title: 'Regra de ouro em sistemas distribuídos',
          text: 'A entrega **pelo menos uma vez (at-least-once)** admite reentregas. Use confirmações de publicação para saber o que o broker aceitou, filas duráveis e mensagens persistentes quando precisar sobreviver a reinícios, e ACK manual para confirmar o processamento. A idempotência evita repetir o efeito de negócio quando o mesmo evento é processado novamente.',
        },
      ],
    },
    {
      id: 'continuidade-outbox-e-cache',
      title: 'Continuidade: Transactional Outbox, Redis Cache e quando escolher Kafka',
      blocks: [
        {
          type: 'text',
          text: 'Para fechar o arco completo de arquitetura distribuída web além do RabbitMQ básico, domine três conceitos que aparecem em praticamente toda entrevista e projeto real:',
        },
        {
          type: 'table',
          caption: 'Evolução natural após dominar filas com RabbitMQ',
          head: ['Padrão / Ferramenta', 'Problema que resolve', 'Como funciona na prática'],
          rows: [
            [
              'Transactional Outbox',
              'Dual-write bug: gravou o pedido no Postgres, mas a rede caiu antes de publicar no RabbitMQ',
              'Grava o pedido e o evento na tabela `outbox` na **mesma transação SQL**; um relay publica no RabbitMQ e marca como enviado',
            ],
            [
              'Cache-Aside (Redis)',
              'Leituras repetidas de catálogo derrubando o banco relacional',
              'Busca no Redis (TTL definido); se miss, consulta banco, grava no Redis e invalida/expira na escrita',
            ],
            [
              'RabbitMQ × Apache Kafka',
              'Escolher broker de tarefas vs. log distribuído de eventos',
              'RabbitMQ brilha em roteamento complexo e filas de jobs (apaga após ACK); Kafka retém o log por dias permitindo replay e múltiplos leitores em altíssima vazão',
            ],
          ],
        },
        {
          type: 'classify',
          activityId: 'rmq-c1-padroes-distribuidos',
          prompt: 'Classifique cada problema de produção na solução arquitetural correta:',
          buckets: [
            'Manual ACK + Prefetch',
            'Dead Letter Queue (DLQ)',
            'Idempotência por event_id',
            'Transactional Outbox',
          ],
          items: [
            {
              text: 'O worker morreu no meio da emissão da nota fiscal e a mensagem desapareceu porque estava com auto-ack',
              bucket: 0,
            },
            {
              text: 'Um evento com CPF malformado falha há 4 horas seguidas voltando infinitamente para o topo da fila',
              bucket: 1,
            },
            {
              text: 'Um cliente teve o cartão cobrado duas vezes depois que o worker reiniciou antes de confirmar o ACK',
              bucket: 2,
            },
            {
              text: 'O pedido foi salvo no PostgreSQL, mas o RabbitMQ estava indisponível por 2 segundos e o evento nunca foi publicado',
              bucket: 3,
            },
            {
              text: 'Um worker rápido pegou 500 mensagens de uma vez e deixou outros 3 workers ociosos',
              bucket: 0,
            },
          ],
          explanation:
            'ACK manual confirma processamento e `prefetch_count` limita entregas pendentes por consumidor. A DLQ isola falhas permanentes, a idempotência evita repetir efeitos e o Outbox permite retomar uma publicação pendente.',
        },
      ],
    },
    {
      id: 'pratica-progressiva',
      title: 'Prática progressiva: simulador de Exchange Topic e Worker Idempotente com DLQ',
      blocks: [
        {
          type: 'text',
          text: 'Simule o roteamento Topic em Python (**Nível 1**), pratique retries, DLQ e deduplicação em memória durante um lote (**Nível 2**) e ordene as etapas do Transactional Outbox (**Nível 3**).',
        },
        {
          type: 'python',
          activityId: 'rmq-py-n1-topic-matcher',
          title: 'Nível 1 — Motor de roteamento de Exchange Topic (`*` e `#`)',
          task: 'Implemente `casa_topic(padrao, routing_key)` seguindo a especificação AMQP: palavras separadas por `.`, `*` casa exatamente 1 palavra e `#` casa 0 ou mais palavras. Exemplos: `casa_topic("pedido.#", "pedido")` → `True`; `casa_topic("pedido.*", "pedido.pago.pix")` → `False`; `casa_topic("*.pago.#", "pedido.pago.pix.ok")` → `True`.',
          code: `def casa_topic(padrao: str, routing_key: str) -> bool:
    p = padrao.split(".")
    k = routing_key.split(".")
    # TODO: implementar matching recursivo ou com memoização para '*', '#' e palavra exata
    return False

print(casa_topic("pedido.*", "pedido.pago"))
print(casa_topic("pedido.#", "pedido.pago.pix"))
`,
          solution: `def casa_topic(padrao: str, routing_key: str) -> bool:
    p = padrao.split(".")
    k = routing_key.split(".")
    memo = {}

    def match(i: int, j: int) -> bool:
        if (i, j) in memo:
            return memo[(i, j)]
        if i == len(p) and j == len(k):
            res = True
        elif i == len(p):
            res = False
        elif p[i] == "#":
            res = match(i + 1, j) or (j < len(k) and match(i, j + 1))
        elif j < len(k) and (p[i] == "*" or p[i] == k[j]):
            res = match(i + 1, j + 1)
        else:
            res = False
        memo[(i, j)] = res
        return res

    return match(0, 0)

print(casa_topic("pedido.*", "pedido.pago"))
print(casa_topic("pedido.#", "pedido.pago.pix"))
`,
          checks: [
            {
              label: 'Aplica * para exatamente 1 segmento',
              test: `casa_topic("pedido.*", "pedido.pago") is True and casa_topic("pedido.*", "pedido.pago.pix") is False and casa_topic("pedido.*", "pedido") is False`,
            },
            {
              label: 'Aplica # para zero, um ou vários segmentos',
              test: `casa_topic("pedido.#", "pedido") is True and casa_topic("pedido.#", "pedido.pago") is True and casa_topic("pedido.#", "pedido.pago.pix") is True`,
            },
            {
              label: 'Combina * e # no meio do padrão corretamente',
              test: `casa_topic("*.pago.#", "pedido.pago.pix.ok") is True and casa_topic("a.#.z", "a.z") is True and casa_topic("a.#.z", "a.b.c.x") is False`,
            },
          ],
        },
        {
          type: 'python',
          activityId: 'rmq-py-n2-worker-dlq-idempotente',
          title: 'Nível 2 — Worker resiliente com Idempotência, Retries e Dead Letter Queue',
          task: 'Implemente `processar_fila(mensagens, handler, max_tentativas=2)`. Cada mensagem tem `id` e `payload`. Dentro de uma chamada, conte repetições de IDs já processados com sucesso em `duplicadas` e pule o `handler`. Em caso de exceção, repita até `max_tentativas` e mande o ID para `dlq` se todas falharem. Retorne `{"ok": [...ids], "duplicadas": int, "dlq": [...ids]}`. O conjunto em memória simula apenas a deduplicação no mesmo lote.',
          code: `def processar_fila(mensagens: list[dict], handler, max_tentativas: int = 2) -> dict:
    # TODO: rastrear ids já processados, aplicar retry controlado e encaminhar falhas permanentes à DLQ
    return {"ok": [], "duplicadas": 0, "dlq": []}
`,
          solution: `def processar_fila(mensagens: list[dict], handler, max_tentativas: int = 2) -> dict:
    processados = set()
    ok = []
    duplicadas = 0
    dlq = []

    for msg in mensagens:
        msg_id = msg["id"]
        if msg_id in processados:
            duplicadas += 1
            continue
        sucesso = False
        for _ in range(max_tentativas):
            try:
                handler(msg["payload"])
                sucesso = True
                break
            except Exception:
                pass
        if sucesso:
            processados.add(msg_id)
            ok.append(msg_id)
        else:
            dlq.append(msg_id)

    return {"ok": ok, "duplicadas": duplicadas, "dlq": dlq}
`,
          checks: [
            {
              label: 'Ignora mensagens duplicadas sem reexecutar o handler',
              test: `(lambda chamadas: (processar_fila([{"id": "e1", "payload": 10}, {"id": "e1", "payload": 10}], lambda p: chamadas.append(p)) == {"ok": ["e1"], "duplicadas": 1, "dlq": []} and len(chamadas) == 1))([])`,
            },
            {
              label: 'Recupera falha transitória na 2ª tentativa e envia falha permanente à DLQ',
              test: `(lambda estado: processar_fila([{"id": "trans", "payload": "t"}, {"id": "veneno", "payload": "v"}], lambda p: (_ for _ in ()).throw(RuntimeError("boom")) if p == "v" or (p == "t" and estado.append(1) is None and len(estado) == 1) else None, max_tentativas=2) == {"ok": ["trans"], "duplicadas": 0, "dlq": ["veneno"]})([])`,
            },
          ],
        },
        {
          type: 'order',
          activityId: 'rmq-ord-n3-outbox',
          prompt:
            'Nível 3 (Consistência Distribuída): Ordene a sequência exata do padrão **Transactional Outbox** ao confirmar um pedido sem risco de perder o evento:',
          items: [
            'Abrir uma transação SQL no banco de dados de pedidos',
            'Inserir o pedido na tabela `pedidos` e o evento na tabela `outbox` dentro da mesma transação',
            'Executar `COMMIT` garantindo atomicidade entre dado de negócio e evento pendente',
            'Um processo relay lê eventos não publicados da `outbox` e envia para a Exchange do RabbitMQ',
            'Após confirmação do broker, marcar o evento como publicado na `outbox` (com consumidor idempotente na ponta)',
          ],
          explanation:
            'Como não existe transação atômica simples entre PostgreSQL e RabbitMQ, gravar dado e evento juntos no banco elimina o buraco do dual-write; o relay entrega com garantia at-least-once e o consumidor idempotente absorve eventuais reenvios.',
        },
      ],
    },
  ],
  recap: [
    'Mensageria assíncrona desacopla produtores e consumidores no tempo, absorve picos de tráfego e aumenta a resiliência de tarefas não imediatas.',
    'No RabbitMQ, o produtor publica em uma Exchange (Direct, Fanout ou Topic), que roteia para filas via bindings e routing keys.',
    'O ACK manual confirma que o consumidor concluiu o trabalho. Uma DLQ separa falhas permanentes, e a idempotência protege os efeitos de negócio em reentregas.',
    'O padrão Transactional Outbox resolve o problema de dual-write entre banco de dados e broker.',
  ],
  cards: [
    {
      id: 'rmq-exchange-vs-queue',
      front: 'No RabbitMQ, o produtor envia mensagens direto para a fila?',
      back: 'Não. No protocolo AMQP o produtor sempre publica em uma Exchange, que decide para quais filas rotear usando bindings e routing keys.',
    },
    {
      id: 'rmq-topic-curingas',
      front: 'Qual a diferença entre `*` e `#` em uma Exchange Topic do RabbitMQ?',
      back: '`*` substitui exatamente uma palavra entre pontos; `#` substitui zero ou mais palavras.',
    },
    {
      id: 'rmq-auto-ack-perigo',
      front: 'Por que `auto_ack=True` é perigoso em filas críticas?',
      back: 'Porque o broker marca a mensagem como entregue assim que a envia pela rede; se o consumidor cair durante o processamento, a mensagem é perdida definitivamente.',
    },
    {
      id: 'rmq-dlq',
      front: 'Para que serve uma Dead Letter Queue (DLQ)?',
      back: 'Para isolar mensagens que falharam após o limite de tentativas (poison messages), impedindo loops infinitos que travam a fila principal.',
    },
    {
      id: 'rmq-idempotencia',
      front: 'Por que consumidores de fila precisam ser idempotentes?',
      back: 'Se um worker cair após salvar no banco e antes do ACK, o broker pode reentregar o evento. Registre o ID e o efeito local na mesma transação para que o próximo worker possa reconhecer o trabalho já concluído.',
    },
    {
      id: 'rmq-outbox',
      front: 'Qual bug o padrão Transactional Outbox evita?',
      back: 'Evita o dual-write inconsistente (salvar no banco e falhar ao publicar no broker, ou vice-versa), gravando o dado e o evento na mesma transação SQL.',
    },
  ],
  mission: {
    title: 'Desenhe a topologia AMQP e o contrato de falha de um checkout real',
    text: 'Amplie o projeto `UGB-rabbitmq-main` da disciplina com as proteções que faltam para rodar em produção.',
    steps: [
      'Desenhe uma Exchange Topic `pedidos.events` conectando 3 filas: `faturamento` (`pedido.pago.*`), `estoque` (`pedido.criado`), e `auditoria` (`pedido.#`).',
      'Adicione `auto_ack=False`, `prefetch_count=10` e uma fila `faturamento.dlq` para mensagens que falharem 3 vezes.',
      'Para um efeito de negócio local, registre `event_id` com unicidade no banco e aplique o efeito na mesma transação. Se o efeito for uma cobrança externa, reutilize a mesma chave de idempotência no provedor, registre o resultado e só depois confirme a mensagem.',
      'Em um ambiente de teste, simule a parada após o efeito confirmado e antes do ACK. Reinicie o worker e confirme que a reentrega conclui sem repetir o efeito.',
      'Documente em 1 tabela o que ficaria síncrono (HTTP) e o que iria para RabbitMQ no seu sistema.',
    ],
  },
  sources: [
    {
      title: 'RabbitMQ Tutorials — Work Queues, Routing e Topics',
      url: 'https://www.rabbitmq.com/tutorials',
    },
    {
      title: 'RabbitMQ Docs — Consumer Acknowledgements and Publisher Confirms',
      url: 'https://www.rabbitmq.com/docs/confirms',
    },
    {
      title: 'Microservices.io — Transactional Outbox Pattern',
      url: 'https://microservices.io/patterns/data/transactional-outbox.html',
    },
  ],
};
