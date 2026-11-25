import type { LessonContent } from '../types';

export const content: LessonContent = {
  hook: 'A CLI, a API e um teste usam o catálogo. Cada consumidor precisa distinguir ausência de falha, e trocar a origem dos dados não deve exigir reescrever a regra. Faça o contrato aparecer na assinatura e verifique compatibilidade a partir do código que já chama a biblioteca.',
  sections: [
    {
      id: 'modelar-resultados',
      title: 'Distinga ausência de falha de operação',
      blocks: [
        {
          type: 'text',
          text: '`Result<Option<Titulo>, Falha>` representa três caminhos: encontrou, consultou com sucesso e o ID estava ausente, ou a consulta falhou. Essa distinção permite mapear ausência para 404 na API e indisponibilidade da origem para uma falha temporária. Uma descrição para o terminal pode usar o mesmo contrato.',
        },
        {
          type: 'classify',
          activityId: 'classificar-a-consulta',
          prompt: 'Associe a observação ao resultado da biblioteca.',
          buckets: ['`Ok(Some(...))`', '`Ok(None)`', '`Err(...)`'],
          items: [
            { text: 'O catálogo respondeu com o título do ID 7', bucket: 0 },
            { text: 'O catálogo respondeu e o ID 9 não foi encontrado', bucket: 1 },
            { text: 'A origem estava indisponível', bucket: 2 },
          ],
          explanation:
            'A busca ausente termina com sucesso. Um erro indica que a resposta sobre aquele ID ainda é desconhecida.',
        },
      ],
    },
    {
      id: 'escolher-despacho',
      title: 'Aceite origens diferentes no mesmo fluxo',
      blocks: [
        {
          type: 'text',
          text: 'Uma função genérica escolhe a implementação pelo tipo de sua chamada. `&dyn Fonte` permite passar referências de implementações diferentes pelo mesmo parâmetro. Neste laboratório, isso permite revisar as duas fontes no mesmo laço. O trait tem uma assinatura que pode ser chamada por um trait object.',
        },
        {
          type: 'code',
          language: 'rust',
          caption: 'A mesma função consulta uma origem ativa e outra indisponível',
          code: `#[derive(Debug, PartialEq)]
#[non_exhaustive]
pub enum Falha {
    Indisponivel,
}

pub trait Fonte {
    fn consultar(&self, id: u32) -> Result<Option<String>, Falha>;
}

struct Memoria;
impl Fonte for Memoria {
    fn consultar(&self, id: u32) -> Result<Option<String>, Falha> {
        Ok((id == 7).then(|| "Cargo".to_owned()))
    }
}

struct ForaDoAr;
impl Fonte for ForaDoAr {
    fn consultar(&self, _id: u32) -> Result<Option<String>, Falha> {
        Err(Falha::Indisponivel)
    }
}

fn descrever(fonte: &dyn Fonte, id: u32) -> Result<String, Falha> {
    Ok(fonte.consultar(id)?.unwrap_or_else(|| "aula ausente".to_owned()))
}

fn main() {
    let fontes: [&dyn Fonte; 2] = [&Memoria, &ForaDoAr];
    for fonte in fontes {
        println!("{:?}", descrever(fonte, 7));
    }
    println!("{:?}", descrever(&Memoria, 9));
}`,
          output: 'Ok("Cargo")\nErr(Indisponivel)\nOk("aula ausente")',
        },
        {
          type: 'fill',
          activityId: 'aceitar-trait-object',
          language: 'rust',
          prompt: 'Complete o tipo para receber um trait object emprestado.',
          template: 'fn descrever(fonte: &[[dyn Fonte]], id: u32) -> Result<String, Falha>',
          explanation:
            'O chamador pode passar uma referência a qualquer implementação que sirva para esse trait object.',
        },
        {
          type: 'quiz',
          activityId: 'propagar-falha-da-origem',
          question: 'O que o operador `?` faz se a fonte estiver indisponível?',
          options: [
            {
              text: 'Devolve Err antes de escolher o texto reservado para ausência.',
              correct: true,
              feedback: 'O caminho da falha sai da função antes da transformação de Option.',
            },
            {
              text: 'Exibe aula ausente como resposta bem-sucedida.',
              feedback: 'O texto reservado é usado quando a consulta termina em Ok(None).',
            },
          ],
        },
      ],
    },
    {
      id: 'compatibilidade-do-consumidor',
      title: 'Revise uma mudança da perspectiva de quem chama',
      blocks: [
        {
          type: 'text',
          text: 'Mudar a assinatura de um método público pode impedir a compilação de clientes existentes. Adicionar um método obrigatório a um trait exige mudanças nas implementações externas. Quando um enum público começa com `#[non_exhaustive]`, código de outro crate precisa cobrir um caso genérico em match. Isso deixa espaço para novas variantes, ainda exigindo avaliar o efeito sobre o comportamento.',
        },
        {
          type: 'quiz',
          activityId: 'revisar-metodo-obrigatorio',
          question: 'Qual mudança exige editar quem já implementa Fonte em outro pacote?',
          options: [
            {
              text: 'Adicionar um método obrigatório ao trait público.',
              correct: true,
              feedback:
                'Implementações existentes precisam fornecer o método para continuar compilando.',
            },
            {
              text: 'Alterar um detalhe privado dentro da implementação de Memoria, preservando o contrato.',
              feedback:
                'Clientes dependem da interface e dos resultados prometidos, que permanecem os mesmos nesta opção.',
            },
          ],
        },
      ],
    },
  ],
  recap: [
    'Faço ausência e indisponibilidade aparecerem em caminhos distintos.',
    'Escolho uma interface que atende à forma de selecionar uma implementação.',
    'Avalio compatibilidade com testes feitos por um consumidor da biblioteca.',
  ],
  cards: [
    {
      id: 'falha',
      front: 'Qual resultado distingue ID inexistente de origem indisponível?',
      back: 'Ok(None) para inexistente e Err para falha da origem.',
    },
    {
      id: 'dinamico',
      front: 'Qual parâmetro aceita implementações distintas pelo mesmo tipo de referência?',
      back: '&dyn Fonte.',
    },
    {
      id: 'enum',
      front: 'O que não exaustivo exige em um match em outro crate?',
      back: 'Um braço genérico que cubra variantes que o consumidor desconhece.',
    },
    {
      id: 'versao',
      front: 'Por que testar um consumidor após alterar uma biblioteca?',
      back: 'Para verificar se o código já existente compila e recebe o comportamento prometido.',
    },
  ],
  mission: {
    title: 'Mantenha uma consulta compatível',
    text: 'Separe o trait em uma biblioteca e use um teste de integração como consumidor.',
    steps: [
      'Implemente um teste para sucesso, ausência e falha.',
      'Proponha uma nova capacidade e mostre o impacto de tornar seu método obrigatório ou mantê-la em outra interface.',
    ],
  },
  sources: [
    {
      title: 'Rust Book — objetos de trait',
      url: 'https://doc.rust-lang.org/book/ch18-02-trait-objects.html',
    },
    {
      title: 'Cargo Book — compatibilidade SemVer',
      url: 'https://doc.rust-lang.org/cargo/reference/semver.html',
    },
  ],
};
