import { Level, Link, LinkContentType, LinkType } from '../entity/RoadmapModel';
import { withAILearning } from './aiLearning';
import { career, project, topic } from './curriculum';

const read = (label: string, url: string): Link => ({
  label,
  url,
  type: LinkType.FREE,
  contentType: LinkContentType.READ,
});

const book = read('The Rust Programming Language (inglês)', 'https://doc.rust-lang.org/book/');
const cargo = read('Cargo Book (inglês)', 'https://doc.rust-lang.org/cargo/');
const comprehensive = read(
  'Comprehensive Rust (português)',
  'https://google.github.io/comprehensive-rust/pt-BR/index.html',
);
const tokio = read('Tutorial do Tokio (inglês)', 'https://tokio.rs/tokio/tutorial');
const axum = read('Axum (inglês)', 'https://github.com/tokio-rs/axum');
const sqlx = read('SQLx (inglês)', 'https://github.com/transact-rs/sqlx');

export const data: Level[] = withAILearning(
  [
    {
      id: 'rust.fundamentos',
      label: 'Fundamentos de Rust',
      description: 'Iniciante · 10 aulas para criar, testar e entregar um catálogo no terminal.',
      items: [
        topic(
          'Cargo e o primeiro programa',
          'Cargo organiza o projeto a partir do Cargo.toml. Use cargo check para checar o código, cargo run para executar e cargo test para rodar os testes. Leia o primeiro erro do compilador antes de editar.',
          [cargo, book, comprehensive],
          'Crie um projeto com cargo new, imprima uma mensagem e corrija um erro de tipo. Anote a linha apontada pelo compilador e o motivo.',
          'rust.cargo',
        ),
        topic(
          'Variáveis e tipos de dados',
          'Represente durações, decisões e proporções com tipos que expressem os valores válidos.',
          [book, comprehensive],
          'Some as durações de duas aulas e calcule a proporção da sessão que elas ocupam.',
          'rust.valores',
        ),
        topic(
          'Decisões, laços e funções',
          'Expresse uma regra com funções pequenas, condições booleanas e repetição.',
          [book, comprehensive],
          'Filtre durações com uma função e explique o resultado para valores antes, no limite e depois dele.',
          'rust.controle',
        ),
        topic(
          'Texto e entrada do usuário',
          'Leia de um terminal, valide títulos vazios e conte texto UTF-8 na unidade do requisito.',
          [book, comprehensive],
          'Confira o resultado para um título com acento, uma linha vazia e outra preenchida com espaços.',
          'rust.texto',
        ),
        topic(
          'Escopo e posse dos valores',
          'Acompanhe a posse de uma String quando ela passa entre variáveis e funções.',
          [book, comprehensive],
          'Reproduza um erro de uso após move e identifique onde a posse passou para o outro nome.',
          'rust.posse',
        ),
        topic(
          'Referências e fatias',
          'Expresse na assinatura se a função precisa ler ou editar os dados do chamador.',
          [book, comprehensive],
          'Demonstre uma leitura com &str, uma edição com &mut String e a soma de parte de um array.',
          'rust.referencias',
        ),
        topic(
          'Modelagem com structs e enums',
          'Agrupe os dados de uma aula em uma struct e modele seus estados possíveis com um enum.',
          [book, comprehensive],
          'Modele Aula com título e duração. Liste os títulos com até 20 minutos e teste o limite exato e a lista vazia.',
          'rust.tipos',
        ),
        topic(
          'Ausência de dados e erros recuperáveis',
          'Use Option para ausência e Result para devolver um motivo de falha ao chamador.',
          [book, comprehensive],
          'Leia uma duração e demonstre o caminho de sucesso, a falha de conversão e um valor fora da regra.',
          'rust.erros',
        ),
        topic(
          'Vetores, mapas e busca de dados',
          'Mantenha a ordem de cadastro e consulte aulas pela chave usada pelo catálogo.',
          [book, comprehensive],
          'Liste aulas na ordem de entrada e teste a busca para um ID presente, outro ausente e uma chave repetida.',
          'rust.colecoes',
        ),
        topic(
          'Entrega e verificação no terminal',
          'Combine o aceite, separe a interface da regra e forneça um roteiro de execução para outra pessoa.',
          [cargo, book],
          'Execute a CLI com um limite válido, com resultado vazio e com entrada inválida. Registre testes e saídas.',
          'rust.entrega-cli',
        ),
      ],
    },
    {
      ...project(
        'Diagnóstico de um catálogo legado',
        'Siga uma linha de entrada do leitor até a saída. Use &str para emprestar o texto e Result para devolver uma falha esperada. Explique por quanto tempo a fatia do título é válida.',
        'Reproduza a falha, explique ownership e referências no trecho alterado e entregue um teste que passe depois da correção.',
        [book, comprehensive],
        'rust.projeto-memoria',
      ),
      id: 'rust.memoria',
      description: 'Intermediário · 2 aulas para rastrear e corrigir um importador legado.',
    },
    {
      id: 'rust.bibliotecas',
      label: 'Bibliotecas, testes e revisão',
      description: 'Intermediário · 3 aulas sobre bibliotecas, iteradores e revisão com testes.',
      items: [
        topic(
          'Módulos, traits e iteradores',
          'Organize a API pública do catálogo e mantenha a importação na biblioteca. Use iteradores para transformar coleções e traits para descrever as operações de armazenamento.',
          [book, cargo],
          'Extraia a regra de importação da CLI e teste a biblioteca com um catálogo em memória.',
          'rust.modulos',
        ),
        topic(
          'Testes de regressão e revisão de diffs',
          'Use um exemplo pequeno para provar o contrato antes de alterá-lo. Na revisão, confira entradas, saídas, mutações e erros apresentados ao chamador.',
          [book, cargo],
          'Crie um teste que falha quando o importador perde progresso. Leia o diff da correção e confirme que cada mudança atende ao teste.',
          'rust.testes',
        ),
      ],
    },
    {
      id: 'rust.concorrencia',
      label: 'Concorrência e desempenho',
      description: 'Intermediário · 3 aulas sobre filas, cancelamento e medição de desempenho.',
      items: [
        topic(
          'Threads, canais e filas limitadas',
          'Use threads para trabalho em paralelo e canais para transferir mensagens. Defina o que acontece quando a fila enche e aguarde o encerramento dos workers.',
          [book, tokio],
          'Processe a mesma entrada de forma sequencial e concorrente. Compare a saída e teste a fila cheia sem depender da ordem de execução.',
          'rust.threads',
        ),
        topic(
          'Tokio, prazos e cancelamento',
          'Separe espera de I/O de trabalho bloqueante e verifique o estado ao expirar uma operação.',
          [tokio, cargo],
          'Execute uma operação que termina no prazo e outra que expira. Mostre o estado deixado no catálogo.',
          'rust.async',
        ),
        topic(
          'Medição e equivalência de resultados',
          'Compare versões sob a mesma carga e verifique a saída antes de interpretar os tempos.',
          [book, cargo],
          'Meça o processamento sequencial e concorrente com o mesmo lote e explique quando a diferença compensa.',
          'rust.medicao',
        ),
      ],
    },
    {
      id: 'rust.backend',
      label: 'API, banco e critérios de aceite',
      description:
        'Intermediário · 2 aulas para demonstrar o contrato HTTP e a integridade dos dados.',
      items: [
        topic(
          'Contratos HTTP com Axum',
          'Separe a conversão de requisições HTTP da regra de importação. Defina formatos de resposta, critérios de cadastro e casos de erro antes de escrever o handler.',
          [axum, tokio],
          'Implemente uma consulta do catálogo e escreva testes para um ID existente e outro ausente.',
          'rust.http',
        ),
        topic(
          'SQLite, migrações e transações',
          'Use unicidade para proteger os IDs e transações para agrupar escritas que precisam acontecer juntas. Confirme a regra consultando o estado do banco após a tentativa.',
          [sqlx, book],
          'Importe duas linhas e force uma falha na segunda. Confira o rollback e execute a importação válida duas vezes para testar duplicatas.',
          'rust.persistencia',
        ),
      ],
    },
    {
      id: 'rust.apis-avancadas',
      label: 'APIs estáveis e interoperabilidade',
      description:
        'Avançado · 3 aulas sobre posse de dados, contratos de bibliotecas e interfaces com C.',
      items: [
        topic(
          'APIs de dados emprestados',
          'Exponha quem possui os dados ao devolver uma fatia, um valor próprio ou Cow.',
          [book, cargo],
          'Teste os dois caminhos de normalização e explique onde o chamador precisa materializar a posse.',
          'rust.dados-emprestados',
        ),
        topic(
          'Compatibilidade de contratos públicos',
          'Separe falha de ausência, escolha uma interface para diferentes origens e verifique quem já usa a biblioteca.',
          [book, cargo],
          'Prove três resultados de consulta com um teste de consumidor e avalie a alteração de um trait público.',
          'rust.contratos-publicos',
        ),
        topic(
          'Fronteiras entre Rust e C',
          'Combine a convenção de chamada, os tipos e o layout compartilhado em uma interface que possa ser verificada.',
          [
            book,
            read(
              'Rust 2024: atributos unsafe (inglês)',
              'https://doc.rust-lang.org/edition-guide/rust-2024/unsafe-attributes.html',
            ),
          ],
          'Compile um consumidor C e confira a assinatura para valores abaixo, no limite e acima dele.',
          'rust.fronteira-c',
        ),
      ],
    },
    {
      id: 'rust.operacao-concorrente',
      label: 'Concorrência, observabilidade e desempenho',
      description:
        'Avançado · 3 aulas para limitar trabalho, investigar execuções e justificar otimizações.',
      items: [
        topic(
          'Processamento assíncrono e drenagem',
          'Limite a fila e o trabalho iniciado e decida o que deve acontecer no encerramento.',
          [tokio, book],
          'Prove a drenagem de todas as tarefas aceitas e registre o pico de trabalhos aguardando coleta.',
          'rust.pool-assincrono',
        ),
        topic(
          'Observabilidade do importador',
          'Relacione eventos a um lote e registre tempo e resultados com campos estruturados.',
          [
            tokio,
            read('Tracing: spans e eventos (inglês)', 'https://docs.rs/tracing/latest/tracing/'),
          ],
          'Investigue uma rejeição usando o identificador e as contagens e confira que o conteúdo da linha ficou fora dos logs.',
          'rust.observabilidade',
        ),
        topic(
          'Desempenho de buscas e índices',
          'Compare algoritmos com a mesma entrada e separe custo de preparação de custo de consulta.',
          [book, cargo],
          'Compare tempo, ordem e ausências e registre quando o índice compensa para as cargas medidas.',
          'rust.perfil-desempenho',
        ),
      ],
    },
    {
      id: 'rust.integridade-em-producao',
      label: 'Integridade, testes de API e migrações',
      description:
        'Avançado · 3 aulas para preservar dados durante falhas, repetições e mudanças de versão.',
      items: [
        topic(
          'Repetição segura e recuperação',
          'Vincule a chave de uma operação aos dados processados e confirme os efeitos juntos.',
          [sqlx, axum],
          'Verifique a primeira aplicação, a repetição, o conflito e a ausência de uma reserva depois do rollback.',
          'rust.reprocessamento',
        ),
        topic(
          'Testes de contrato HTTP',
          'Exerça as rotas contra estados controlados e confira a resposta junto com os efeitos da requisição.',
          [axum, cargo],
          'Envie um lote com o segundo registro inválido e prove que o primeiro registro não foi gravado.',
          'rust.teste-de-api',
        ),
        topic(
          'Migrações e compatibilidade entre versões',
          'Expanda o esquema, verifique a paridade e combine a volta antes de remover campos.',
          [
            sqlx,
            read('SQLite: ALTER TABLE (inglês)', 'https://www.sqlite.org/lang_altertable.html'),
          ],
          'No laboratório, simule a última escrita da versão antiga e compare o catálogo depois do preenchimento.',
          'rust.migracoes-compativeis',
        ),
      ],
    },
    {
      ...project(
        'Entrega do catálogo de estudos',
        'Entregue uma melhoria verificável na CLI ou API existente, com testes, justificativa e demonstração do resultado.',
        'Preserve dados anteriores, registre como rodar a solução e demonstre o critério de aceite a outra pessoa.',
        [book, cargo, axum],
        'rust.projeto-entrega',
      ),
      id: 'rust.entrega',
      description:
        'Avançado · projeto final com automação de testes, roteiro de volta e demonstração de aceite.',
    },
    career,
    {
      id: 'rust.opcional',
      label: 'Aprofundamento opcional',
      optional: true,
      items: [
        topic(
          'Interoperabilidade e contratos de segurança',
          'Estude o que uma interface com código externo precisa garantir e documente as precondições antes de expor uma função em Rust.',
          [
            read(
              'Rust Reference: unsafe (inglês)',
              'https://doc.rust-lang.org/reference/unsafe-keyword.html',
            ),
          ],
          'Leia uma interface existente e escreva quais invariantes são responsabilidade de quem a chama.',
          'rust.interoperabilidade',
        ),
      ],
    },
  ],
  'rust',
);
