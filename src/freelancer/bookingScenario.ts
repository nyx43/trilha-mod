export const bookingScenario = {
  client: 'Camila, responsável pelo Espaço Horizonte',
  request: 'Preciso de uma agenda para cadastrar reservas de salas e evitar conflitos de horário.',
  questions: [
    {
      id: 'campos',
      prompt: 'O que preciso informar para fazer uma reserva?',
      answer:
        'Preciso da sala, da data, da hora de início e da hora de fim. Use o horário local do espaço. A reserva começa e termina no mesmo dia, e o fim precisa ser depois do início.',
    },
    {
      id: 'conflito',
      prompt: 'Quais reservas entram em conflito?',
      answer:
        'Se duas reservas ocuparem a mesma sala na mesma data e usarem parte do mesmo horário, recuse a nova. Salas diferentes podem ser usadas ao mesmo tempo.',
    },
    {
      id: 'limite',
      prompt: 'Uma reserva pode começar quando a anterior termina?',
      answer:
        'Sim. Se a Sala A estiver reservada das 14:00 às 15:00, a próxima reserva da Sala A pode começar às 15:00.',
    },
    {
      id: 'resultado',
      prompt: 'O que a equipe deve ver depois de tentar reservar?',
      answer:
        'Quando der certo, mostre a reserva na lista e mantenha os dados ao recarregar. Se der errado, explique o motivo e mantenha a agenda como estava.',
    },
  ],
  deliverables: [
    'Uma tela para cadastrar e listar reservas por sala, data e horário.',
    'Um projeto que possa ser executado seguindo as instruções da entrega.',
    'Evidências dos testes das regras combinadas com o cliente.',
  ],
  changeRequest:
    'A equipe precisa de dez minutos para preparar cada sala. Na mesma sala e data, deixe pelo menos 10 minutos entre o fim de uma reserva e o início da outra. Vale tanto se a nova reserva vier antes quanto se vier depois de uma já cadastrada. Salas diferentes continuam independentes.',
  criteria: {
    initial: [
      {
        id: 'cadastro',
        title: 'Cadastro, lista e persistência',
        hint: 'Cadastre uma reserva com sala, data e horários. Registre a confirmação e confira se ela continua na lista depois de recarregar.',
      },
      {
        id: 'horario-invalido',
        title: 'Validação do horário',
        hint: 'Tente enviar um campo vazio, um fim igual ao início e um fim anterior ao início. Registre as mensagens e confira a lista após cada tentativa.',
      },
      {
        id: 'sobreposicao',
        title: 'Conflito na mesma sala',
        hint: 'Com a Sala A reservada das 14:00 às 15:00, tente cadastrar outra reserva das 14:30 às 15:30 na mesma data. Confira a mensagem e verifique que a agenda ficou intacta.',
      },
      {
        id: 'horario-contiguo',
        title: 'Reservas em horários consecutivos',
        hint: 'Com a Sala A reservada das 14:00 às 15:00, confirme que uma segunda reserva na mesma sala pode começar às 15:00.',
      },
      {
        id: 'salas-e-datas',
        title: 'Salas e datas independentes',
        hint: 'Repita o horário da primeira reserva em outra sala na mesma data e na mesma sala em outra data. Registre os dois cadastros.',
      },
    ],
    revised: [
      {
        id: 'limite-depois',
        title: 'Intervalo após uma reserva',
        hint: 'Com a Sala A reservada das 14:00 às 15:00, confira que 15:00 e 15:09 são recusados e que 15:10 é aceito. Teste cada caso com a mesma agenda de partida.',
      },
      {
        id: 'limite-antes',
        title: 'Intervalo antes de uma reserva',
        hint: 'Na mesma agenda, confira que uma reserva das 13:00 às 13:51 é recusada e que uma das 13:00 às 13:50 é aceita.',
      },
      {
        id: 'salas-e-datas',
        title: 'Salas e datas independentes',
        hint: 'Repita um horário que seria recusado na Sala A e na mesma data. Confira que ele funciona em outra sala ou em outra data.',
      },
      {
        id: 'regressao',
        title: 'Regras anteriores e agenda preservada',
        hint: 'Repita os testes de horário inválido, sobreposição e persistência. Confira que as tentativas recusadas deixam a agenda intacta.',
      },
    ],
  },
  examples: [
    { reservation: 'Sala A, 14:30–15:30', before: 'Bloqueia', after: 'Bloqueia' },
    { reservation: 'Sala A, 15:00–16:00', before: 'Aceita', after: 'Bloqueia' },
    { reservation: 'Sala A, 15:09–16:00', before: 'Aceita', after: 'Bloqueia' },
    { reservation: 'Sala A, 15:10–16:00', before: 'Aceita', after: 'Aceita' },
    { reservation: 'Sala A, 13:00–13:51', before: 'Aceita', after: 'Bloqueia' },
    { reservation: 'Sala A, 13:00–13:50', before: 'Aceita', after: 'Aceita' },
    { reservation: 'Sala B, 14:30–15:30', before: 'Aceita', after: 'Aceita' },
  ],
} as const;
