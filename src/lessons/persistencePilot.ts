export const persistenceLessonId = 'onde-o-dado-mora';
export const persistencePracticeSection = 'provar-persistencia';
export const reservationsPracticeUrl = '/aula/onde-o-dado-mora/reservas';

export interface PilotField {
  label: string;
  options?: string[];
  optional?: boolean;
}

export interface PilotPhase {
  id: string;
  title: string;
  fields: PilotField[];
  submitLabel: string;
  action?: string;
}

export const diagnosticPhases: PilotPhase[] = [
  {
    id: 'diagnostico',
    title: 'Antes da aula',
    submitLabel: 'Registrar hipótese inicial',
    fields: [
      {
        label:
          'Cadastrei um livro, atualizei a página e ele continuou lá. O que isso permite concluir?',
      },
      { label: 'Que teste você faria para descobrir onde o livro foi guardado?' },
      { label: 'Você já sabia como investigar isso?', options: ['Sim', 'Em parte', 'Ainda não'] },
    ],
  },
];

export const guidedPhases: PilotPhase[] = [
  {
    id: 'identificar',
    title: 'Identificar o registro',
    submitLabel: 'Salvar e continuar',
    fields: [
      {
        label: 'Ao cadastrar um livro novo, o que você espera encontrar nas duas consultas à API?',
      },
    ],
    action:
      'Abra o laboratório, cadastre um livro com título único nos quatro painéis e anote o ID que aparece em cada painel da API. Assim você consegue procurar o mesmo registro em cada consulta.',
  },
  {
    id: 'mudar',
    title: 'Mudar uma condição',
    submitLabel: 'Salvar e continuar',
    fields: [
      { label: 'Qual livro você cadastrou e quais IDs observou nas duas APIs?' },
      {
        label:
          'Em quais das duas APIs você prevê encontrar o livro após apenas recarregar a página? Por quê?',
      },
    ],
    action:
      'Recarregue a página. Compare as duas listas da API. O F5 recria a página e deixa o mesmo processo da API rodando.',
  },
  {
    id: 'consultar',
    title: 'Consultar o mesmo registro',
    submitLabel: 'Salvar e continuar',
    fields: [
      { label: 'O que as duas APIs mostraram após o F5?' },
      { label: 'O que você prevê que cada consulta mostrará depois de reiniciar a API?' },
    ],
    action:
      'Pare o servidor com Ctrl+C e rode node servidor.mjs novamente na mesma pasta, mantendo o arquivo de banco. No laboratório, use “Consultar APIs (GET) novamente” e procure o livro pelos IDs e pelo título. A consulta nova verifica o estado do servidor após o reinício.',
  },
  {
    id: 'comparar',
    title: 'Comparar os resultados',
    submitLabel: 'Registrar experimento',
    fields: [
      { label: 'O que mudou após o reinício e como isso se compara às suas previsões?' },
      {
        label: 'Em que passo você precisou de ajuda pela primeira vez?',
        options: [
          'Nenhum',
          'Preparar o ambiente',
          'Identificar o registro',
          'Mudar uma condição',
          'Consultar o mesmo registro',
          'Comparar os resultados',
        ],
      },
      { label: 'Que ajuda permitiu avançar?', optional: true },
    ],
  },
];

export function challengePhases(reservations: boolean): PilotPhase[] {
  return [
    {
      id: 'plano',
      title: 'Planejar o teste',
      submitLabel: 'Salvar previsão e teste',
      fields: [
        { label: 'Qual é sua previsão e por quê?' },
        { label: 'Que teste você escolheu? O que o resultado permitiria distinguir?' },
        ...(reservations
          ? [
              {
                label: 'Você revisou o tema desde a primeira prática?',
                options: ['Não', 'Sim', 'Ainda não fiz a primeira prática'],
              },
            ]
          : []),
      ],
    },
    {
      id: 'evidencia',
      title: 'Registrar o resultado',
      submitLabel: 'Registrar tentativa',
      fields: [
        { label: 'Qual registro você criou? Anote o ID e os dados que o identificam.' },
        { label: 'O que a consulta à API mostrou antes da ação?' },
        { label: 'Que ação você executou e o que a nova consulta mostrou?' },
        { label: 'Que conclusão a evidência sustenta? Até onde ela vale?' },
        {
          label: 'Qual foi a maior ajuda que você buscou fora desta atividade?',
          options: [
            'Nenhuma',
            'Consulta de sintaxe',
            'Dica de estratégia',
            'Solução ou roteiro completo',
          ],
        },
      ],
    },
  ];
}
