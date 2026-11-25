import type { LessonContent } from '../types';

export const content: LessonContent = {
  hook: 'Um endpoint pode devolver a mensagem prevista e ainda deixar dados alterados. Automatize o contrato HTTP e a verificação do estado observado depois de cada resposta.',
  sections: [
    {
      id: 'o-que-validar',
      title: 'Cubra a resposta e os efeitos da requisição',
      blocks: [
        {
          type: 'text',
          text: 'Um teste de integração pode chamar o roteador em memória. A requisição percorre o método, a rota, os extratores e o handler. Dê um estado novo para cada teste. Em um caso de sucesso, confira o dado confirmado. Em um lote inválido, compare o estado inteiro com o que já existia.',
        },
        {
          type: 'quiz',
          activityId: 'provar-dados-preservados',
          question:
            'O segundo registro de um lote tem título vazio e a rota devolve 422. O que falta conferir?',
          options: [
            {
              text: 'Se o primeiro registro foi ignorado e os dados anteriores continuam iguais.',
              correct: true,
              feedback:
                'A resposta sinaliza a falha. Consultar o estado mostra se ocorreu uma gravação indevida.',
            },
            {
              text: 'Apenas se o corpo contém um texto de erro.',
              feedback:
                'O corpo ajuda quem usa a API, mas o teste também precisa observar o estado preservado.',
            },
          ],
        },
      ],
    },
    {
      id: 'roteador-em-memoria',
      title: 'Execute requisições contra a configuração real do roteador',
      blocks: [
        {
          type: 'text',
          text: 'Crie o pacote com `cargo new catalogo --lib`. Use `cargo add axum@0.8`, `cargo add serde@1 --features derive`, `cargo add tokio@1 --dev --features macros,rt` e `cargo add tower@0.5 --dev --features util`. Cole o exemplo em `src/lib.rs` e execute `cargo test`. A origem de dados do laboratório é um mapa em memória.',
        },
        {
          type: 'code',
          language: 'rust',
          caption: 'Importação Axum com dois testes de integração do fluxo HTTP',
          code: `use std::{collections::HashMap, sync::{Arc, Mutex}};
use axum::{Json, Router, extract::State, http::StatusCode, routing::post};
use serde::Deserialize;

pub type Catalogo = Arc<Mutex<HashMap<u32, String>>>;

#[derive(Deserialize)]
struct Entrada { id: u32, titulo: String }

async fn importar(State(catalogo): State<Catalogo>, Json(lote): Json<Vec<Entrada>>) -> StatusCode {
    if lote.iter().any(|aula| aula.id == 0 || aula.titulo.trim().is_empty()) {
        return StatusCode::UNPROCESSABLE_ENTITY;
    }
    let Ok(mut aulas) = catalogo.lock() else { return StatusCode::INTERNAL_SERVER_ERROR };
    for aula in lote {
        aulas.insert(aula.id, aula.titulo);
    }
    StatusCode::NO_CONTENT
}

pub fn app(catalogo: Catalogo) -> Router {
    Router::new().route("/importacoes", post(importar)).with_state(catalogo)
}

#[cfg(test)]
mod testes {
    use super::*;
    use axum::{body::Body, http::Request};
    use tower::ServiceExt;

    async fn enviar(app: Router, dados: &'static str) -> StatusCode {
        let request = Request::post("/importacoes")
            .header("content-type", "application/json")
            .body(Body::from(dados)).unwrap();
        app.oneshot(request).await.unwrap().status()
    }

    #[tokio::test]
    async fn confirma_um_lote_valido() {
        let aulas = Arc::new(Mutex::new(HashMap::new()));
        let status = enviar(app(Arc::clone(&aulas)), r#"[{"id":7,"titulo":"Cargo"}]"#).await;
        assert_eq!(status, StatusCode::NO_CONTENT);
        assert_eq!(aulas.lock().unwrap().get(&7).map(String::as_str), Some("Cargo"));
    }

    #[tokio::test]
    async fn preserva_estado_quando_o_segundo_item_e_invalido() {
        let original = HashMap::from([(7, String::from("Original"))]);
        let aulas = Arc::new(Mutex::new(original.clone()));
        let status = enviar(app(Arc::clone(&aulas)),
            r#"[{"id":7,"titulo":"Atualizado"},{"id":8,"titulo":" "}]"#).await;
        assert_eq!(status, StatusCode::UNPROCESSABLE_ENTITY);
        assert_eq!(*aulas.lock().unwrap(), original);
    }
}`,
        },
        {
          type: 'fill',
          activityId: 'despachar-requisicao-sem-rede',
          language: 'rust',
          prompt: 'Complete o método que despacha uma requisição para o roteador.',
          template: 'let resposta = app.[[oneshot]](request).await.unwrap();',
          explanation: 'ServiceExt permite executar a torre de serviços com a requisição do teste.',
        },
        {
          type: 'classify',
          activityId: 'verificacao-por-camada',
          prompt: 'Associe cada pergunta à verificação mais direta.',
          buckets: ['Teste de regra', 'Teste HTTP', 'Teste de persistência'],
          items: [
            { text: 'O filtro de duração inclui exatamente 20?', bucket: 0 },
            { text: 'A requisição inválida recebe 422 nesta rota?', bucket: 1 },
            { text: 'A transação com erro deixou alguma linha gravada?', bucket: 2 },
          ],
          explanation:
            'As camadas respondem perguntas diferentes. Juntas, dão evidência sobre o caminho que o usuário percorre.',
        },
      ],
    },
    {
      id: 'reproduzir-falha-real',
      title: 'Escreva um teste que revele a mudança indevida',
      blocks: [
        {
          type: 'text',
          text: 'Neste exemplo, a validação percorre todo o lote antes de obter o estado mutável. Faça uma mudança temporária para validar e gravar item por item. O teste com a segunda linha inválida deve denunciar a alteração no primeiro ID. Para a versão persistente, use um banco isolado por teste e consulte as linhas depois da resposta.',
        },
        {
          type: 'order',
          activityId: 'montagem-do-teste',
          prompt: 'Ordene o teste para um lote que precisa ser rejeitado por inteiro.',
          items: [
            'Criar o estado inicial com o registro a preservar',
            'Enviar um lote válido no começo e inválido no fim',
            'Verificar o status e comparar o estado final com o inicial',
          ],
          explanation: 'O estado conhecido torna observável qualquer efeito parcial da requisição.',
        },
      ],
    },
  ],
  recap: [
    'Exerço o roteador em memória com requisições HTTP.',
    'Comparo a resposta e os efeitos da operação.',
    'Uso entradas controladas para detectar efeitos parciais.',
  ],
  cards: [
    {
      id: 'oneshot',
      front: 'Como despachar uma requisição ao roteador em memória?',
      back: 'Importe ServiceExt e use oneshot com o Request.',
    },
    {
      id: 'isolamento',
      front: 'Por que criar um estado novo por teste?',
      back: 'Para que uma requisição do teste anterior não influencie o resultado.',
    },
    {
      id: 'efeito',
      front: 'O que verificar além de 422?',
      back: 'Se os dados anteriores continuam iguais e se houve inserção parcial.',
    },
    {
      id: 'contrato',
      front: 'Por que incluir uma linha válida antes da inválida?',
      back: 'Para fazer o teste detectar uma gravação prematura do primeiro item.',
    },
  ],
  mission: {
    title: 'Automatize dois critérios do aceite da API',
    text: 'Escreva um caso de sucesso e outro de rejeição com estado conhecido.',
    steps: [
      'Rode a suíte e registre o resultado de cada teste.',
      'Introduza uma gravação parcial no laboratório e prove que o teste da falha detecta o problema.',
    ],
  },
  sources: [
    {
      title: 'Tower — ServiceExt e oneshot',
      url: 'https://docs.rs/tower/0.5.3/tower/util/trait.ServiceExt.html',
    },
    {
      title: 'Axum — roteador e estado',
      url: 'https://docs.rs/axum/0.8.9/axum/struct.Router.html',
    },
  ],
};
