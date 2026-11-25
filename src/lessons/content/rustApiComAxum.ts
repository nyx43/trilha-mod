import type { LessonContent } from '../types';

export const content: LessonContent = {
  hook: 'O cliente quer consultar aulas e saber se um lote pode ser importado. Você vai traduzir esses pedidos em exemplos de requisição e resposta, implementar rotas locais e conferir o que acontece com dados válidos, ausentes e inválidos.',
  sections: [
    {
      id: 'criterios-do-contrato',
      title: 'Defina a resposta antes de escrever a rota',
      blocks: [
        {
          type: 'text',
          text: 'Combine o método, o caminho, os dados de entrada e o resultado esperado. A consulta deve responder com a aula para um ID conhecido. Um ID numérico ausente e um ID que não pode ser interpretado representam casos diferentes. A segunda rota valida um lote em memória e responde sem corpo quando ele está apto.',
        },
        {
          type: 'table',
          caption: 'Contrato HTTP do laboratório',
          head: ['Requisição', 'Resposta esperada'],
          rows: [
            ['`GET /aulas/7`', '200, com ID e título em JSON'],
            ['`GET /aulas/42`', '404, com mensagem de aula ausente'],
            ['`GET /aulas/abc`', '400, pois a rota exige ID numérico'],
            ['`POST /importacoes/validacao` com título vazio', '422, com a mensagem de validação'],
          ],
        },
        {
          type: 'classify',
          activityId: 'associar-estados-http',
          prompt: 'Associe cada resposta de consulta ao status combinado.',
          buckets: ['200', '400', '404'],
          items: [
            { text: 'Aula 7 foi encontrada', bucket: 0 },
            { text: 'O segmento abc não pode ser convertido em u32', bucket: 1 },
            { text: 'O ID 42 é numérico e está ausente', bucket: 2 },
          ],
          explanation:
            'O status comunica qual caminho foi percorrido e dá ao consumidor uma forma consistente de agir.',
        },
      ],
    },
    {
      id: 'extratores-e-handlers',
      title: 'Use extratores para converter a requisição em dados',
      blocks: [
        {
          type: 'text',
          text: 'Em um projeto Cargo novo, rode `cargo add axum@0.8`, `cargo add tokio@1 --features macros,rt-multi-thread,net` e `cargo add serde@1 --features derive`. `Path<u32>` interpreta o ID e `Json<Vec<Entrada>>` converte o corpo em um lote. Mantenha os estados de domínio explícitos e converta-os em respostas na borda HTTP.',
        },
        {
          type: 'code',
          language: 'rust',
          caption: 'Servidor local com consulta e validação de lote',
          code: `use axum::{
    Json, Router, extract::Path, http::StatusCode, routing::{get, post},
};
use serde::{Deserialize, Serialize};

#[derive(Serialize)]
struct Aula {
    id: u32,
    titulo: &'static str,
}

#[derive(Deserialize)]
struct Entrada {
    id: u32,
    titulo: String,
}

async fn consultar(Path(id): Path<u32>) -> Result<Json<Aula>, (StatusCode, &'static str)> {
    match id {
        7 => Ok(Json(Aula { id, titulo: "Fundamentos" })),
        _ => Err((StatusCode::NOT_FOUND, "aula ausente")),
    }
}

async fn validar(
    Json(lote): Json<Vec<Entrada>>,
) -> Result<StatusCode, (StatusCode, &'static str)> {
    if lote.iter().any(|aula| aula.id == 0 || aula.titulo.trim().is_empty()) {
        return Err((StatusCode::UNPROCESSABLE_ENTITY, "use ID positivo e título preenchido"));
    }
    Ok(StatusCode::NO_CONTENT)
}

#[tokio::main]
async fn main() -> std::io::Result<()> {
    let app = Router::new()
        .route("/aulas/{id}", get(consultar))
        .route("/importacoes/validacao", post(validar));
    let listener = tokio::net::TcpListener::bind("127.0.0.1:3000").await?;
    axum::serve(listener, app).await
}`,
        },
        {
          type: 'fill',
          activityId: 'retornar-aula-em-json',
          language: 'rust',
          prompt: 'Complete o retorno de uma aula encontrada.',
          template: 'Ok([[Json]](Aula { id, titulo: "Fundamentos" }))',
          explanation: 'Json serializa a estrutura com os campos definidos no contrato.',
        },
      ],
    },
    {
      id: 'verificar-em-outro-terminal',
      title: 'Verifique o status e o corpo em outro terminal',
      blocks: [
        {
          type: 'text',
          text: 'Com `cargo run` ativo, execute os comandos abaixo em outro terminal. `-i` mostra os cabeçalhos e a linha de status. No POST, o cabeçalho indica que o corpo enviado usa JSON. Troque o título vazio por um título válido e confirme a resposta 204. A rota de validação mantém o lote em memória durante a requisição. O armazenamento entra na próxima aula.',
        },
        {
          type: 'code',
          language: 'bash',
          caption: 'Casos de consulta e validação',
          code: `curl -i http://127.0.0.1:3000/aulas/7
curl -i http://127.0.0.1:3000/aulas/42
curl -i http://127.0.0.1:3000/aulas/abc
curl -i http://127.0.0.1:3000/importacoes/validacao \\
  -H 'Content-Type: application/json' \\
  -d '[{"id":8,"titulo":""}]'`,
        },
        {
          type: 'quiz',
          activityId: 'validacao-do-lote',
          question: 'Qual teste prova que o handler examina todos os itens?',
          options: [
            {
              text: 'Enviar um lote cuja primeira aula é válida e a segunda tem título vazio.',
              correct: true,
              feedback:
                'A rejeição mostra que o handler conferiu o item posterior antes de aceitar o lote.',
            },
            {
              text: 'Enviar apenas uma aula válida.',
              feedback:
                'Isso verifica um caso de sucesso e pode passar se a implementação examinar apenas o primeiro item.',
            },
          ],
        },
        {
          type: 'order',
          activityId: 'demonstracao-do-contrato-http',
          prompt: 'Coloque a demonstração do contrato em ordem.',
          items: [
            'Anotar a requisição e o resultado que o cliente espera',
            'Chamar a rota e observar status e corpo',
            'Comparar a resposta com o exemplo combinado',
          ],
          explanation:
            'O registro de uma requisição, sua resposta e o critério deixa o aceite reproduzível.',
        },
      ],
    },
  ],
  recap: [
    'Defino entrada e resultado esperado para cada caso do contrato.',
    'Leio parâmetros e corpos usando extratores do Axum.',
    'Comprovo status e corpo da resposta com chamadas reproduzíveis.',
  ],
  cards: [
    {
      id: 'path',
      front: 'O que Path<u32> extrai?',
      back: 'O segmento da URL, convertido em um inteiro u32.',
    },
    {
      id: '404',
      front: 'Como a rota responde para um ID numérico ausente?',
      back: '404, com a mensagem de aula ausente.',
    },
    {
      id: '422',
      front: 'Qual caso do exemplo devolve 422?',
      back: 'O lote chegou em JSON e viola a regra de ID positivo ou título preenchido.',
    },
    {
      id: 'curl',
      front: 'O que curl -i acrescenta à saída?',
      back: 'Os cabeçalhos HTTP da resposta, incluindo a linha de status.',
    },
  ],
  mission: {
    title: 'Escreva o aceite de uma consulta e de um lote',
    text: 'Use os casos da tabela para demonstrar o comportamento da API a outra pessoa.',
    steps: [
      'Registre o status e o corpo para um ID encontrado, um ausente e outro inválido.',
      'Envie um lote com dois itens em que só o segundo viola a regra. Confirme a rejeição e anote a requisição.',
    ],
  },
  sources: [
    { title: 'Axum — rotas e extratores', url: 'https://docs.rs/axum/0.8.9/axum/' },
    {
      title: 'Axum — extração de parâmetros da URL',
      url: 'https://docs.rs/axum/0.8.9/axum/extract/struct.Path.html',
    },
  ],
};
