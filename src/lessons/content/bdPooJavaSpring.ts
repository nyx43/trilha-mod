import { LessonContent } from '../types';

export const content: LessonContent = {
  hook: 'Na pasta da disciplina, você começa modelando `Lampada`, `ContaCorrente` e `Aluno` em Java orientado a objetos e logo salta para um Web Service Spring Boot (`demo1` com `SoftwareEngineer`). Na vida real — em bancos, fintechs e ERPs corporativos — é exatamente essa ponte entre **POO com invariantes fortes**, **Injeção de Dependências no Spring** e **persistência JPA/transacional** que sustenta sistemas críticos sem transformar o código em espaguete.',
  sections: [
    {
      id: 'poo-que-protege-regras-de-negocio',
      title: 'POO de verdade: encapsular invariantes (não apenas gerar getters e setters)',
      blocks: [
        {
          type: 'text',
          text: 'Um erro clássico ao aprender POO (como nos exercícios `ContaCorrente` e `Aluno` da disciplina) é criar classes "anêmicas": campos `private` seguidos de `getSaldo()` e `setSaldo(double)` públicos. Se qualquer trecho do sistema pode chamar `conta.setSaldo(-99999)`, o encapsulamento foi só teatro! **Encapsular significa expor operações de negócio (`sacar`, `depositar`) que tornam estados inválidos impossíveis.**',
        },
        {
          type: 'codeTabs',
          caption: 'ContaCorrente anêmica vs. ContaCorrente com invariantes reais em Java',
          tabs: [
            {
              label: 'Modelo anêmico (frágil)',
              language: 'java',
              code: `public class ContaCorrente {
    private double saldo;
    private double limiteEspecial;

    // Qualquer controller pode burlar regras de saque e limite!
    public void setSaldo(double saldo) { this.saldo = saldo; }
    public double getSaldo() { return saldo; }
}`,
            },
            {
              label: 'Domínio rico (protegido)',
              language: 'java',
              code: `public class ContaCorrente {
    private final String numero;
    private BigDecimal saldo;
    private final BigDecimal limiteEspecial;

    public ContaCorrente(String numero, BigDecimal saldoInicial, BigDecimal limiteEspecial) {
        if (limiteEspecial.signum() < 0) throw new IllegalArgumentException("Limite negativo");
        this.numero = numero;
        this.saldo = saldoInicial;
        this.limiteEspecial = limiteEspecial;
    }

    public void sacar(BigDecimal valor) {
        if (valor.signum() <= 0) throw new IllegalArgumentException("Valor deve ser positivo");
        BigDecimal disponivel = saldo.add(limiteEspecial);
        if (valor.compareTo(disponivel) > 0) {
            throw new IllegalStateException("Saldo + cheque especial insuficiente");
        }
        this.saldo = this.saldo.subtract(valor);
    }

    public boolean estaUsandoChequeEspecial() { return saldo.signum() < 0; }
}`,
            },
          ],
        },
        {
          type: 'callout',
          tone: 'warning',
          title: 'Detalhe de produção em Java: dinheiro usa BigDecimal, nunca double!',
          text: 'Em ponto flutuante binário (`double`), `0.1 + 0.2 == 0.30000000000000004`. Em `ContaCorrente` real, valores monetários usam `BigDecimal` (ou centavos inteiros em `long`) para nunca perder centavos em conciliação bancária.',
        },
      ],
    },
    {
      id: 'arquitetura-spring-boot-demo1',
      title: 'Spring Boot em camadas: Controller → Service → Repository → Banco',
      blocks: [
        {
          type: 'text',
          text: 'No projeto `demo1` da disciplina (`SoftwareEngineer`), o Spring Boot separa responsabilidades em 4 camadas conectadas por **Inversão de Controle (IoC)** e **Injeção de Dependências (DI)** — o framework cria e injeta os objetos pelo construtor em vez de cada classe dar `new Repository()` acoplado.',
        },
        {
          type: 'flow',
          caption: 'Caminho de `POST /api/v1/software-engineers` no Spring Boot',
          actors: [
            'Cliente HTTP',
            'Controller (@RestController)',
            'Service (@Service)',
            'Repository (JPA) & SQL',
          ],
          steps: [
            {
              from: 0,
              to: 1,
              label: 'POST JSON (Request DTO)',
              text: 'Jackson desserializa o JSON e `@Valid` rejeita campos inválidos com `400 Bad Request`.',
              tone: 'ok',
            },
            {
              from: 1,
              to: 2,
              label: 'service.insertSoftwareEngineer(dto)',
              text: 'Controller NÃO tem regra de negócio nem SQL — apenas traduz HTTP para chamada de serviço.',
              tone: 'ok',
            },
            {
              from: 2,
              to: 3,
              label: 'repository.save(entity) [@Transactional]',
              text: 'Service aplica regras de domínio, abre transação e delega a persistência ao JpaRepository.',
              tone: 'ok',
            },
            {
              from: 1,
              to: 0,
              label: '201 Created (Response DTO)',
              text: 'Retorna DTO de resposta explícito sem expor entidade JPA interna nem campos sigilosos.',
              tone: 'ok',
            },
          ],
        },
        {
          type: 'anatomy',
          caption: 'Injeção por construtor em Spring Boot (testável e imutável)',
          language: 'java',
          parts: [
            {
              text: '@RestController\n@RequestMapping("/api/v1/software-engineers")\n',
              label: 'Anotações Web',
              note: 'Registra a classe como endpoint REST serializando retornos em JSON automaticamente.',
            },
            {
              text: 'public class SoftwareEngineerController {\n    private final SoftwareEngineerService service;\n\n    ',
            },
            {
              text: 'public SoftwareEngineerController(SoftwareEngineerService service) {\n        this.service = service;\n    }',
              label: 'Injeção por construtor',
              note: 'Preferida a `@Autowired` em campo porque permite `final` e facilita passar fakes/mocks em testes unitários sem subir o Spring inteiro.',
            },
            { text: '\n}' },
          ],
        },
        {
          type: 'quiz',
          activityId: 'java-q1-injecao-camadas',
          question:
            'Por que um time experiente de Spring Boot evita colocar regras de transferência bancária e queries SQL diretamente dentro do `@RestController`?',
          options: [
            {
              text: 'Porque acopla regras de negócio ao protocolo HTTP, impede reutilizar a regra em jobs/mensageria, dificulta o controle de `@Transactional` e torna testes unitários lentos e frágeis.',
              correct: true,
              feedback:
                'Exatamente! Separar Controller (HTTP), Service (regra de negócio + transação) e Repository (acesso a dados) permite testar regras de domínio isoladamente e reutilizá-las tanto via REST quanto via filas RabbitMQ.',
            },
            {
              text: 'Porque o compilador Java proíbe chamar repositórios dentro de classes anotadas com `@RestController`.',
              feedback:
                'O compilador permite — é uma decisão arquitetural para evitar código acoplado e difícil de manter.',
            },
            {
              text: 'Porque `@RestController` só suporta requisições `GET` e não aceita `POST`.',
              feedback:
                '`@RestController` suporta todos os verbos HTTP (`@GetMapping`, `@PostMapping`, `@PutMapping`, `@DeleteMapping`).',
            },
            {
              text: 'Porque cada camada extra acelera a latência de rede automaticamente.',
              feedback:
                'Camadas organizam responsabilidade, testabilidade e transações; não reduzem latência de rede por si mesmas.',
            },
          ],
        },
      ],
    },
    {
      id: 'continuidade-jpa-dto-transactional',
      title: 'Continuidade: JPA/Hibernate, DTO vs. Entity, `@Transactional` e armadilhas reais',
      blocks: [
        {
          type: 'text',
          text: 'O `demo1` da aula é um excelente ponto de partida, mas expor diretamente a `@Entity` no `@RestController` é uma das maiores fontes de vulnerabilidades e bugs em produção com Spring Data JPA. Veja as 4 armadilhas que você precisa dominar para ir além do material da faculdade:',
        },
        {
          type: 'table',
          caption: 'Armadilhas reais de Spring Boot + JPA em produção',
          head: ['Armadilha', 'Sintoma em produção', 'Correção padrão de mercado'],
          rows: [
            [
              'Expor `@Entity` direto no Controller',
              'Mass Assignment (cliente injeta `role: "ADMIN"` no JSON) + `LazyInitializationException` na serialização',
              'Usar `record` Java como **Request DTO** e **Response DTO** na borda da API',
            ],
            [
              'Transferência sem `@Transactional`',
              'Debita da conta A, dá erro de rede antes de creditar na conta B → dinheiro desaparece!',
              'Anotar o método do `@Service` com `@Transactional` (garante rollback atômico em `RuntimeException`)',
            ],
            [
              '`FetchType.EAGER` ou N+1 em relações `@OneToMany`',
              'Buscar 100 engenheiros dispara 101 `SELECT`s ou carrega metade do banco na RAM',
              'Usar `LAZY` por padrão e carregar relações sob demanda com `JOIN FETCH` ou `@EntityGraph`',
            ],
            [
              'Usar `ddl-auto=update` em produção',
              'Hibernate altera/quebra colunas silenciosamente sem rollback nem auditoria',
              'Usar `ddl-auto=validate` em produção e migrações versionadas (**Flyway** ou **Liquibase**)',
            ],
          ],
        },
        {
          type: 'classify',
          activityId: 'java-c1-camadas-responsabilidades',
          prompt:
            'Coloque cada responsabilidade na camada correta de uma API Spring Boot bem estruturada:',
          buckets: [
            'Controller / DTO',
            'Service (@Transactional)',
            'Entidade de Domínio (POO)',
            'Repository (JPA / SQL)',
          ],
          items: [
            {
              text: 'Validar formato do JSON recebido (`@Valid`) e mapear retorno para HTTP 201 Created',
              bucket: 0,
            },
            {
              text: 'Orquestrar débito na conta origem + crédito na conta destino numa única transação atômica',
              bucket: 1,
            },
            { text: 'Garantir que `sacar()` nunca ultrapasse `saldo + limiteEspecial`', bucket: 2 },
            { text: 'Executar `SELECT ... JOIN FETCH` parametrizado no banco de dados', bucket: 3 },
            {
              text: 'Garantir que `senhaHash` nunca seja incluída no payload JSON de resposta',
              bucket: 0,
            },
            {
              text: 'Calcular se `Aluno` atingiu média >= 7.0 a partir das suas notas encapsuladas',
              bucket: 2,
            },
          ],
          explanation:
            'Controller/DTO cuida da fronteira HTTP; Service coordena casos de uso e transações; Entidade protege invariantes do negócio; Repository fala com o banco.',
        },
      ],
    },
    {
      id: 'pratica-progressiva',
      title: 'Prática progressiva: persistência SQL real + simulação POO em camadas',
      blocks: [
        {
          type: 'text',
          text: 'Vamos exercitar os dois pilares desta aula sem precisar de um servidor JVM rodando no navegador: primeiro execute consultas e transação real no **SQLite** sobre o schema do `demo1` e `conta_corrente` (**Nível 1**); depois implemente o domínio `ContaCorrente` + camada `TransferenciaService` com rollback em uma **simulação local em Python** aplicando exatamente os mesmos princípios de encapsulamento, DI e DTO do Java/Spring (**Nível 2**) e feche com diagnóstico de bug JPA (**Nível 3**).',
        },
        {
          type: 'sql',
          activityId: 'java-sql-n1-transacao-transferencia',
          title: 'Nível 1 — Persistência real: transferência atômica entre contas no SQLite',
          task: "O banco abaixo tem `conta_corrente` com uma regra `CHECK (saldo >= -limite_especial)` (invariante no banco!). Execute uma transferência de `250.0` da conta `'C-01'` para `'C-02'` usando `UPDATE` dentro de `BEGIN TRANSACTION` ... `COMMIT`, e finalize com `SELECT numero, saldo FROM conta_corrente ORDER BY numero;` para conferir o estado final.",
          setup: `CREATE TABLE conta_corrente (
  numero TEXT PRIMARY KEY,
  titular TEXT NOT NULL,
  saldo REAL NOT NULL,
  limite_especial REAL NOT NULL DEFAULT 0,
  CHECK (saldo >= -limite_especial)
);
INSERT INTO conta_corrente VALUES ('C-01', 'Ana', 200.0, 100.0);
INSERT INTO conta_corrente VALUES ('C-02', 'Bruno', 50.0, 0.0);`,
          query: `-- Transfira 250.0 de C-01 (usará 50 do cheque especial!) para C-02 dentro de uma transação
SELECT numero, saldo FROM conta_corrente ORDER BY numero;`,
          solution: `BEGIN TRANSACTION;
UPDATE conta_corrente SET saldo = saldo - 250.0 WHERE numero = 'C-01';
UPDATE conta_corrente SET saldo = saldo + 250.0 WHERE numero = 'C-02';
COMMIT;
SELECT numero, saldo FROM conta_corrente ORDER BY numero;`,
          checks: [
            {
              label:
                'Debita 250 de C-01 (ficando em -50 dentro do cheque especial) e credita em C-02 (300)',
              test: `if (!result || result.rows.length !== 2) return false;
              return result.rows[0][0] === 'C-01' && Number(result.rows[0][1]) === -50 && result.rows[1][0] === 'C-02' && Number(result.rows[1][1]) === 300;`,
            },
            {
              label: 'Usa transação explícita (BEGIN e COMMIT)',
              test: `return /\\bBEGIN\\b/i.test(query) && /\\bCOMMIT\\b/i.test(query);`,
            },
          ],
        },
        {
          type: 'python',
          activityId: 'java-py-n2-poo-service-dto',
          title: 'Nível 2 — Simulação local de POO + Service/Repository + DTO (padrão Spring)',
          task: 'Nota: esta prática simula em memória os conceitos de Java/Spring Boot. Implemente: (1) `ContaCorrente.sacar(valor)` validando `valor > 0` e `valor <= saldo + limite` (lançando `ValueError` caso contrário); (2) `ContaCorrente.depositar(valor)` validando `valor > 0`; (3) `BancoService.transferir(orig_id, dest_id, valor)` com **atomicidade**: se a conta destino não existir (`KeyError`), o débito na origem NÃO pode ficar aplicado; e retorne um **DTO** `{"origem": orig_id, "destino": dest_id, "saldo_origem": ..., "em_cheque_especial": bool}` sem expor atributos internos como `pin_secreto`.',
          code: `class ContaCorrente:
    def __init__(self, numero: str, saldo: float, limite: float, pin_secreto: str = "9999"):
        self.numero = numero
        self.saldo = saldo
        self.limite = limite
        self.pin_secreto = pin_secreto

    def sacar(self, valor: float) -> None:
        # TODO: validar valor > 0 e saldo + limite suficiente
        pass

    def depositar(self, valor: float) -> None:
        # TODO: validar valor > 0
        pass

class BancoService:
    def __init__(self, repo: dict[str, ContaCorrente]):
        self.repo = repo  # Injeção de dependência pelo construtor

    def transferir(self, orig_id: str, dest_id: str, valor: float) -> dict:
        # TODO: validar existência de ambas ANTES de debitar (evitar débito órfão!) e retornar DTO seguro
        return {}
`,
          solution: `class ContaCorrente:
    def __init__(self, numero: str, saldo: float, limite: float, pin_secreto: str = "9999"):
        self.numero = numero
        self.saldo = saldo
        self.limite = limite
        self.pin_secreto = pin_secreto

    def sacar(self, valor: float) -> None:
        if valor <= 0:
            raise ValueError("valor deve ser positivo")
        if valor > self.saldo + self.limite:
            raise ValueError("saldo e cheque especial insuficientes")
        self.saldo -= valor

    def depositar(self, valor: float) -> None:
        if valor <= 0:
            raise ValueError("valor deve ser positivo")
        self.saldo += valor

class BancoService:
    def __init__(self, repo: dict[str, ContaCorrente]):
        self.repo = repo

    def transferir(self, orig_id: str, dest_id: str, valor: float) -> dict:
        if orig_id not in self.repo or dest_id not in self.repo:
            raise KeyError("conta inexistente")
        orig = self.repo[orig_id]
        dest = self.repo[dest_id]
        orig.sacar(valor)
        dest.depositar(valor)
        return {
            "origem": orig.numero,
            "destino": dest.numero,
            "saldo_origem": orig.saldo,
            "em_cheque_especial": orig.saldo < 0,
        }
`,
          checks: [
            {
              label: 'Transfere usando cheque especial e retorna DTO seguro sem pin_secreto',
              test: `(lambda r: (lambda dto: dto == {"origem": "A", "destino": "B", "saldo_origem": -50.0, "em_cheque_especial": True} and "pin_secreto" not in dto and r["B"].saldo == 300.0)(BancoService(r).transferir("A", "B", 250.0)))({"A": ContaCorrente("A", 200.0, 100.0), "B": ContaCorrente("B", 50.0, 0.0)})`,
            },
            {
              label:
                'Não debita a conta origem se a conta destino não existir (preserva atomicidade)',
              test: `(lambda d: (exec("repo = {'A': ContaCorrente('A', 200.0, 0.0)}\\ntry:\\n BancoService(repo).transferir('A', 'INEXISTENTE', 50.0)\\n d['ok'] = False\\nexcept KeyError:\\n d['ok'] = (repo['A'].saldo == 200.0)", {'ContaCorrente': ContaCorrente, 'BancoService': BancoService, 'd': d}), d['ok'])[1])({})`,
            },
            {
              label: 'Recusa saque acima de saldo + limite especial com ValueError',
              test: `(lambda d: (exec("c = ContaCorrente('A', 100.0, 50.0)\\ntry:\\n c.sacar(151.0)\\n d['ok'] = False\\nexcept ValueError:\\n d['ok'] = (c.saldo == 100.0)", {'ContaCorrente': ContaCorrente, 'd': d}), d['ok'])[1])({})`,
            },
          ],
        },
        {
          type: 'quiz',
          activityId: 'java-q2-n3-transactional-rollback',
          question:
            'Nível 3 (Diagnóstico Spring JPA): Um endpoint `PUT /api/clientes/{id}` recebe diretamente a `@Entity Cliente` no `@RequestBody` e salva via `clienteRepository.save(cliente)`. Um pesquisador de segurança envia `{"nome": "João", "plano": "VIP_ILIMITADO", "isAdmin": true}` e ganha acesso administrativo! Qual é o nome dessa vulnerabilidade e a correção correta?',
          options: [
            {
              text: '**Mass Assignment** (atribuição em massa): corrigir substituindo a entidade no `@RequestBody` por um **Request DTO** explícito contendo apenas os campos que o cliente tem permissão de editar (`nome`, `telefone`).',
              correct: true,
              feedback:
                'Na mosca! Expor `@Entity` no contrato HTTP permite ao atacante sobrescrever qualquer campo que exista na tabela. DTOs explícitos fecham essa brecha por design.',
            },
            {
              text: '**SQL Injection**: corrigir trocando `JpaRepository` por concatenação de string SQL.',
              feedback:
                'Não houve injeção de sintaxe SQL — o ORM montou um `UPDATE` válido, mas usando campos sensíveis vindos direto do JSON sem filtro de DTO.',
            },
            {
              text: '**Problema N+1**: corrigir colocando `FetchType.EAGER` na entidade `Cliente`.',
              feedback:
                'N+1 é problema de desempenho de consultas; aqui temos uma falha grave de autorização/contrato na entrada HTTP.',
            },
            {
              text: '**Deadlock**: corrigir removendo `@Transactional` do serviço.',
              feedback:
                'Deadlock envolve disputa de travas entre transações; remover `@Transactional` não impede o atacante de enviar `isAdmin: true`.',
            },
          ],
        },
      ],
    },
  ],
  recap: [
    'Encapsulamento real protege invariantes de negócio dentro dos métodos da classe (ex.: `sacar`, `depositar`), em vez de expor `setSaldo` livre.',
    'Spring Boot organiza aplicações em Controller (HTTP), Service (regra de negócio + `@Transactional`) e Repository (acesso a dados), conectados por Injeção de Dependências pelo construtor.',
    'Separar Request/Response DTOs de `@Entity` JPA evita vazamento de campos internos, `LazyInitializationException` e ataques de Mass Assignment.',
    'Em produção, transações atômicas, carregamento `LAZY` com `JOIN FETCH` e migrações Flyway/Liquway protegem integridade e performance.',
  ],
  cards: [
    {
      id: 'java-modelo-anemico',
      front:
        'Por que uma classe com apenas campos `private` e getters/setters públicos NÃO garante encapsulamento real?',
      back: 'Porque qualquer caller pode colocar o objeto em estado inválido (ex.: `setSaldo(-9999)`). Encapsulamento real valida regras dentro de métodos de domínio como `sacar()`.',
    },
    {
      id: 'java-bigdecimal',
      front:
        'Por que dinheiro em Java deve usar `BigDecimal` (ou centavos inteiros) e não `double`?',
      back: 'Porque `double` usa ponto flutuante binário que introduz erros de arredondamento (como `0.1 + 0.2 != 0.3`), causando divergências financeiras.',
    },
    {
      id: 'java-di-construtor',
      front:
        'Por que preferir Injeção de Dependências por construtor em vez de `@Autowired` em campo no Spring?',
      back: 'Permite dependências `final` (imutáveis), explicita tudo de que a classe precisa e permite testes unitários diretos com fakes sem subir o contexto do Spring.',
    },
    {
      id: 'java-dto-vs-entity',
      front: 'Quais dois problemas evitamos ao usar DTOs em vez de expor `@Entity` no Controller?',
      back: 'Evitamos Mass Assignment (cliente alterando campos internos como `isAdmin`) e vazamento/acoplamento do schema do banco e proxies lazy do Hibernate na API pública.',
    },
    {
      id: 'java-transactional',
      front: 'O que `@Transactional` garante em um método de transferência bancária no Spring?',
      back: 'Garante atomicidade (tudo ou nada): se o crédito falhar após o débito com uma `RuntimeException`, o Spring executa `ROLLBACK` automático desfazendo o débito.',
    },
    {
      id: 'java-ddl-auto',
      front: 'Por que evitar `spring.jpa.hibernate.ddl-auto=update` em produção?',
      back: 'Porque alterações automáticas do Hibernate não são versionadas, auditáveis nem reversíveis com segurança — em produção usa-se `validate` + Flyway/Liquibase.',
    },
  ],
  mission: {
    title: 'Evolua o projeto `demo1` (`SoftwareEngineer`) para padrão de produção',
    text: 'Pegue a estrutura básica de Spring Boot vista na disciplina e feche as lacunas de produção.',
    steps: [
      'Crie dois Java `record`s (`CreateSoftwareEngineerRequest` e `SoftwareEngineerResponse`) removendo a `@Entity` da assinatura pública do Controller.',
      'Adicione validação de entrada (`@NotBlank`, `@Size`) e um `@RestControllerAdvice` devolvendo JSON padronizado com status 400 e 404.',
      'Escreva um teste unitário do `SoftwareEngineerService` injetando um repositório fake pelo construtor sem subir banco real.',
      'Anote um fluxo multi-escrita com `@Transactional` e documente como o Flyway substituiria `ddl-auto=update`.',
    ],
  },
  sources: [
    {
      title: 'Spring Guides — Building a RESTful Web Service',
      url: 'https://spring.io/guides/gs/rest-service',
    },
    {
      title: 'Spring Data JPA — Reference Documentation',
      url: 'https://docs.spring.io/spring-data/jpa/reference/',
    },
    {
      title:
        'OWASP API Security Top 10 — Broken Object Property Level Authorization (Mass Assignment)',
      url: 'https://owasp.org/API-Security/',
    },
  ],
};
