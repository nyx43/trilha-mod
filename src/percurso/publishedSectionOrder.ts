// Frozen order for numeric progress saved before the first ID-based version.
export const publishedStageOrder: Record<string, Record<string, string[]>> = {
  'api-react-tailwind': {
    'node-e-express': [
      'javascript-fora-do-navegador',
      'projeto-e-modulos',
      'anatomia-do-servidor',
      'rotas-e-status',
      'middleware-e-erros',
      'mini-roteador',
      'fechamento',
    ],
    'requisicoes-react': [
      'dados-no-efeito',
      'corrida-e-cancelamento',
      'bibliotecas-de-dados',
      'fechamento',
    ],
    'integracao-front-api': [
      'caminho-da-requisicao',
      'fetch-com-corpo',
      'cors',
      'proxy-e-ambientes',
      'estados-e-falhas',
      'atualizacao-otimista',
      'fechamento',
    ],
    'tailwind-na-pratica': [
      'classes-utilitarias',
      'foco-e-estados',
      'layout-responsivo',
      'pratica-no-playground-e-vite',
      'fechamento',
    ],
  },
};
