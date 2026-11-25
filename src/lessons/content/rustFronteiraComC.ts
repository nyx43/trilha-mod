import type { LessonContent } from '../types';

export const content: LessonContent = {
  hook: 'Uma ferramenta legada escrita em C precisa calcular se uma duração cabe no horário. Exponha uma assinatura pequena, com valores simples e uma convenção compartilhada, e comprove que o consumidor consegue chamá-la.',
  sections: [
    {
      id: 'contrato-binario',
      title: 'Defina dados e convenção de chamada',
      blocks: [
        {
          type: 'text',
          text: 'Uma interface de funções estrangeiras, ou FFI, precisa de um contrato binário. `extern "C"` escolhe a convenção de chamada de C para a plataforma. `#[repr(C)]` aplica o layout de C à estrutura. Neste exemplo, use campos de 32 bits sem sinal e envie tudo por valor. Para passar buffers em outra interface, documente explicitamente duração, tamanho e responsabilidade pela liberação.',
        },
        {
          type: 'classify',
          activityId: 'responsabilidades-da-fronteira',
          prompt: 'Associe cada decisão ao mecanismo que a expressa.',
          buckets: ['`extern "C"`', '`#[repr(C)]`', 'Contrato do símbolo'],
          items: [
            { text: 'A convenção para chamar a função', bucket: 0 },
            { text: 'O layout de uma estrutura compartilhada com C', bucket: 1 },
            { text: 'O nome estável e único procurado ao ligar o executável', bucket: 2 },
          ],
          explanation:
            'A chamada, o layout e o nome precisam ser combinados pelos dois lados da fronteira.',
        },
      ],
    },
    {
      id: 'biblioteca-e-consumidor',
      title: 'Compile e chame a biblioteca em um programa C',
      blocks: [
        {
          type: 'text',
          text: 'Salve os dois arquivos em uma pasta de laboratório. Na edição 2024, `#[unsafe(no_mangle)]` torna explícita a responsabilidade pelo símbolo exportado. O nome contém um prefixo do projeto e uma versão. Confirme que ele é único no conjunto de bibliotecas que serão ligadas. Use o compilador C e o alvo Rust da mesma plataforma.',
        },
        {
          type: 'codeTabs',
          caption: 'Biblioteca Rust e consumidor C',
          tabs: [
            {
              label: 'lib.rs',
              language: 'rust',
              code: `#[repr(C)]
pub struct DuracaoV1 {
    pub cabe: u32,
    pub restante: u32,
}

// SAFETY: o exercício liga uma única biblioteca com este símbolo versionado.
#[unsafe(no_mangle)]
pub extern "C" fn trilhainfo_duracao_v1(minutos: u32, limite: u32) -> DuracaoV1 {
    DuracaoV1 {
        cabe: u32::from(minutos <= limite),
        restante: limite.saturating_sub(minutos),
    }
}`,
            },
            {
              label: 'consumidor.c',
              language: 'c',
              code: `#include <inttypes.h>
#include <stdint.h>
#include <stdio.h>

typedef struct {
    uint32_t cabe;
    uint32_t restante;
} DuracaoV1;

extern DuracaoV1 trilhainfo_duracao_v1(uint32_t minutos, uint32_t limite);

int main(void) {
    DuracaoV1 r = trilhainfo_duracao_v1(15, 20);
    printf("cabe=%" PRIu32 " restante=%" PRIu32 "\\n", r.cabe, r.restante);
    return r.cabe == 1 && r.restante == 5 ? 0 : 1;
}`,
            },
          ],
        },
        {
          type: 'code',
          language: 'bash',
          caption: 'Compile e execute em Linux com rustc e um compilador C',
          code: 'rustc --edition=2024 --crate-type cdylib --crate-name catalogo_ffi lib.rs\ncc consumidor.c -L. -lcatalogo_ffi -o consumidor\nLD_LIBRARY_PATH="$PWD" ./consumidor',
          output: 'cabe=1 restante=5',
        },
        {
          type: 'fill',
          activityId: 'layout-compativel',
          language: 'rust',
          prompt: 'Complete o atributo que usa o layout de C para a estrutura.',
          template: '#[repr([[C]])]\npub struct DuracaoV1 { pub cabe: u32, pub restante: u32 }',
          explanation:
            'A representação explícita permite que o consumidor declare os campos com a mesma ordem e tipos correspondentes.',
        },
      ],
    },
    {
      id: 'testar-a-borda',
      title: 'Verifique valores de fronteira com o consumidor real',
      blocks: [
        {
          type: 'text',
          text: 'O contrato devolve `cabe=1` para uma duração que cabe, inclusive no limite. `restante` satura em zero quando a duração supera o limite. Altere o consumidor para exercer os dois casos. Uma mudança no layout ou nos tipos da assinatura precisa de uma interface versionada e de testes com os consumidores existentes.',
        },
        {
          type: 'quiz',
          activityId: 'resultado-da-borda',
          question: 'Que valores a função devolve para uma duração de 25 e um limite de 20?',
          options: [
            {
              text: '`cabe=0` e `restante=0`',
              correct: true,
              feedback: 'A comparação dá falso e a subtração saturada mantém zero.',
            },
            {
              text: '`cabe=0` e `restante=-5`',
              feedback:
                'O resultado é u32. O contrato expõe zero quando a duração supera o limite.',
            },
          ],
        },
        {
          type: 'order',
          activityId: 'verificar-a-abi',
          prompt: 'Ordene a verificação de uma nova versão da interface.',
          items: [
            'Combinar convenção, assinatura, layout e nome',
            'Compilar a biblioteca e ligar o consumidor C',
            'Rodar o consumidor para casos válidos e valores de fronteira',
          ],
          explanation:
            'Testar apenas a função dentro de Rust não percorre a ligação e a chamada pela interface C.',
        },
      ],
    },
  ],
  recap: [
    'Defino o contrato de chamada e de representação na fronteira.',
    'Mantenho símbolos exportados únicos e versionados.',
    'Testo a interface por meio do consumidor que a usa.',
  ],
  cards: [
    {
      id: 'abi',
      front: 'O que extern "C" escolhe?',
      back: 'A convenção de chamada de C na plataforma alvo.',
    },
    { id: 'repr', front: 'Qual atributo dá à estrutura o layout de C?', back: '#[repr(C)].' },
    {
      id: 'simbolo',
      front: 'Que obrigação a exportação sem mangling cria?',
      back: 'Garantir que o símbolo definido não colida com outro símbolo ligado no processo.',
    },
    {
      id: 'teste',
      front: 'Que teste exerce a fronteira de verdade neste laboratório?',
      back: 'O executável C ligado à biblioteca Rust, com casos de fronteira.',
    },
  ],
  mission: {
    title: 'Documente e verifique a interface V1',
    text: 'Use a ferramenta C como consumidora da biblioteca de durações.',
    steps: [
      'Exercite duração abaixo, igual e acima do limite.',
      'Registre a convenção, os tipos e a regra aplicada quando a duração excede o limite.',
    ],
  },
  sources: [
    {
      title: 'Rust Reference — representação C',
      url: 'https://doc.rust-lang.org/reference/type-layout.html#the-c-representation',
    },
    {
      title: 'Rust 2024 — atributos unsafe',
      url: 'https://doc.rust-lang.org/edition-guide/rust-2024/unsafe-attributes.html',
    },
  ],
};
