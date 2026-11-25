// Original labels used as keys by existing saves and backups. Keep these strings as published.
export const rustMissionLegacyCriteria: Record<string, Record<string, string>> = {
  'rust.fundamentos': {
    'titulos-em-ordem': 'O resultado inclui Rust e Cargo e Empréstimos, nessa ordem.',
    'casos-limite':
      'Um teste cobre a duração de exatamente 20 minutos e outro cobre a lista vazia.',
    evidencia:
      'A evidência mostra o comando, a saída observada e onde a regra do limite é aplicada.',
  },
  'rust.memoria': {
    'titulo-valido': 'Linhas válidas preservam o título, incluindo acentos.',
    'linha-invalida': 'A ausência do separador ou do título é tratada sem panic.',
    evidencia:
      'A evidência mostra um teste que falhava antes, o resultado depois e uma explicação de quem possui o texto.',
  },
  'rust.bibliotecas': {
    'dados-preservados':
      'O ID 7 recebe o novo título e continua estudado. O ID 8 permanece no catálogo.',
    'lote-repetido': 'Importar o mesmo lote duas vezes conserva uma aula por ID.',
    evidencia:
      'A evidência registra o comportamento da proposta, a correção e o resultado de cargo test.',
  },
  'rust.concorrencia': {
    'resultados-equivalentes':
      'Sem cancelamento, as duas versões entregam os mesmos 12 resultados, mesmo que a ordem de execução mude.',
    'limites-e-cancelamento':
      'A fila e o número de workers respeitam os limites e o processo encerra ao cancelar.',
    evidencia:
      'A evidência inclui os comandos, a carga usada, os tempos medidos e a decisão de manter ou descartar a mudança.',
  },
  'rust.backend': {
    'lote-valido': 'Após o lote válido, o ID 7 continua estudado e aparece uma aula com ID 8.',
    'lote-revertido': 'O lote inválido devolve um erro útil e os IDs 9 e 10 não aparecem no banco.',
    evidencia:
      'A evidência liga cada critério a uma requisição, sua resposta e o estado após a execução.',
  },
  'rust.entrega': {
    rastreabilidade:
      'A revisão consegue seguir a entrada até o estado persistido ou a saída e identificar onde o comportamento mudou.',
    'comportamento-e-dados':
      'A entrega demonstra pelo menos um caso de sucesso, uma falha e a preservação dos dados existentes.',
    roteiro:
      'O roteiro contém os comandos, critérios de aceite e resultados observados, com um limite conhecido da solução.',
  },
};
