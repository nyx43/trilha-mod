import type { LessonContent } from '../types';

export const content: LessonContent = {
  hook: 'O terminal já consegue mostrar as aulas. Agora uma API e os testes também precisam chamar o filtro. Transforme a regra em biblioteca e deixe a interface pública pequena o bastante para entender olhando a assinatura.',
  sections: [
    {
      id: 'fronteira-da-biblioteca',
      title: 'Identifique a regra e a entrada e saída do programa',
      blocks: [
        {
          type: 'text',
          text: 'Uma regra de catálogo recebe dados e devolve um resultado. O executável lê argumentos, chama a regra e apresenta esse resultado. Quando um pacote Cargo tem `src/lib.rs` e `src/main.rs`, ele produz uma biblioteca e um executável. Dê ao pacote o nome `catalogo` para usar os caminhos dos exemplos.',
        },
        {
          type: 'classify',
          activityId: 'separar-responsabilidades',
          prompt: 'Onde fica cada responsabilidade?',
          buckets: ['Biblioteca', 'Executável'],
          items: [
            { text: 'Selecionar as aulas que cabem no limite', bucket: 0 },
            { text: 'Ler argumentos da linha de comando', bucket: 1 },
            { text: 'Exibir o resultado no terminal', bucket: 1 },
            { text: 'Devolver os títulos na ordem de cadastro', bucket: 0 },
          ],
          explanation:
            'A biblioteca recebe dados e aplica o contrato. O executável transforma argumentos em dados e o resultado em texto.',
        },
      ],
    },
    {
      id: 'modulos-e-visibilidade',
      title: 'Separe os arquivos e exponha a operação pública',
      blocks: [
        {
          type: 'text',
          text: 'Crie um pacote com `cargo new catalogo` em uma pasta de prática. Salve cada aba abaixo no arquivo indicado. `mod filtro` declara o módulo interno. `pub use filtro::titulos_ate` expõe uma função pelo caminho `catalogo::titulos_ate`, que é o caminho usado pelo executável e pelo teste.',
        },
        {
          type: 'codeTabs',
          caption: 'Biblioteca, módulo, executável e teste público',
          tabs: [
            {
              label: 'src/lib.rs',
              language: 'rust',
              code: 'mod filtro;\n\npub use filtro::titulos_ate;',
            },
            {
              label: 'src/filtro.rs',
              language: 'rust',
              code: `pub fn titulos_ate<'a>(aulas: &[(&'a str, u32)], limite: u32) -> Vec<&'a str> {
    aulas.iter()
        .filter(|aula| aula.1 <= limite)
        .map(|aula| aula.0)
        .collect()
}`,
            },
            {
              label: 'src/main.rs',
              language: 'rust',
              code: `use catalogo::titulos_ate;

fn main() {
    let aulas = [("Árvores", 18), ("Filas", 20), ("Redes", 33)];
    for titulo in titulos_ate(&aulas, 20) {
        println!("{titulo}");
    }
}`,
            },
            {
              label: 'tests/contrato.rs',
              language: 'rust',
              code: `use catalogo::titulos_ate;

#[test]
fn inclui_o_limite_em_ordem() {
    let aulas = [("A", 20), ("C", 25), ("B", 19)];
    assert_eq!(titulos_ate(&aulas, 20), vec!["A", "B"]);
}`,
            },
          ],
        },
        {
          type: 'fill',
          activityId: 'importar-pela-interface-publica',
          language: 'rust',
          prompt: 'Complete a importação da função no executável.',
          template: 'use [[catalogo]]::titulos_ate;',
          explanation: 'O pacote disponibiliza a função a partir da raiz da biblioteca.',
        },
        {
          type: 'quiz',
          activityId: 'visibilidade-do-modulo',
          question: 'Qual caminho público o teste usa?',
          options: [
            {
              text: '`catalogo::titulos_ate`',
              correct: true,
              feedback: 'A reexportação coloca a função na interface da biblioteca.',
            },
            {
              text: '`catalogo::filtro::titulos_ate`',
              feedback: 'O módulo filtro é privado. Os chamadores usam o caminho reexportado.',
            },
          ],
        },
      ],
    },
    {
      id: 'verificar-sem-o-terminal',
      title: 'Rode o teste pela mesma interface do consumidor',
      blocks: [
        {
          type: 'text',
          text: '`cargo run` imprime Árvores e Filas. `cargo test --test contrato` chama a função diretamente no teste de integração. O teste é compilado como consumidor da biblioteca e só acessa a API pública. Renomeie um arquivo interno por vez e confira se o caminho público continua igual.',
        },
        {
          type: 'order',
          activityId: 'extrair-uma-regra-da-cli',
          prompt: 'Ordene uma extração que preserve o comportamento.',
          items: [
            'Registrar a saída observada da CLI',
            'Mover a regra e preservar a assinatura usada pelo executável',
            'Rodar o teste do contrato e comparar a saída da CLI',
          ],
          explanation:
            'A comparação antes e depois ajuda a provar que a reorganização preservou o que o usuário observa.',
        },
      ],
    },
  ],
  recap: [
    'Reconheço a biblioteca e o executável em um pacote Cargo.',
    'Crio um módulo interno e exponho uma função pela interface pública.',
    'Uso um teste de integração para exercer a API que os consumidores realmente chamam.',
  ],
  cards: [
    {
      id: 'lib',
      front: 'Que arquivo cria a raiz da biblioteca neste pacote?',
      back: 'src/lib.rs.',
    },
    {
      id: 'mod',
      front: 'O que faz mod filtro?',
      back: 'Declara o módulo interno que contém a implementação.',
    },
    {
      id: 'exportar',
      front: 'O que pub use faz com o caminho da função?',
      back: 'Expõe um caminho de acesso público sem precisar tornar todo o módulo público.',
    },
    {
      id: 'integracao',
      front: 'O que um teste em tests/ consegue acessar?',
      back: 'A interface pública da biblioteca, como outro consumidor do pacote.',
    },
  ],
  mission: {
    title: 'Extraia a regra no seu catálogo',
    text: 'Separe o filtro escrito no nível iniciante e mantenha a experiência no terminal.',
    steps: [
      'Mova a seleção para a biblioteca e faça a CLI usá-la.',
      'Rode o teste de integração e compare o que a CLI imprime antes e depois.',
    ],
  },
  sources: [
    {
      title: 'Rust Book — caminhos, módulos e visibilidade',
      url: 'https://doc.rust-lang.org/book/ch07-03-paths-for-referring-to-an-item-in-the-module-tree.html',
    },
    {
      title: 'Rust Book — organização dos testes',
      url: 'https://doc.rust-lang.org/book/ch11-03-test-organization.html',
    },
  ],
};
