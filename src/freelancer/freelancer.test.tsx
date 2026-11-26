import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import type { ReviewCriterion } from '../components/DeliveryReview';
import FreelancerPage from '../pages/FreelancerPage';
import LessonsPage from '../pages/LessonsPage';
import { bookingScenario } from './bookingScenario';
import { bookingPath } from './progress';

function renderScenario(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/aulas" element={<LessonsPage />} />
        <Route path={bookingPath} element={<FreelancerPage />} />
        <Route path={`${bookingPath}/:etapa`} element={<FreelancerPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

function writeNote(label: RegExp, value: string) {
  fireEvent.change(screen.getByRole('textbox', { name: label }), { target: { value } });
}

function evidenceFields(criterion: string) {
  return within(screen.getByRole('group', { name: criterion }));
}

function recordEvidence(criteria: readonly ReviewCriterion[], evidence: string) {
  for (const { title } of criteria) {
    const fields = evidenceFields(title);
    fireEvent.change(fields.getByLabelText('Resultado'), { target: { value: 'tested' } });
    fireEvent.change(fields.getByLabelText('Evidência'), { target: { value: evidence } });
  }
}

describe('Simulação freelancer de reservas', () => {
  beforeEach(() => localStorage.clear());

  it('redireciona um link bloqueado para a primeira etapa disponível', async () => {
    renderScenario(`${bookingPath}/entrega-final`);
    expect(await screen.findByRole('heading', { name: 'Conversa com o cliente' })).toBeVisible();
    expect(screen.queryByRole('heading', { name: 'Entrega final' })).not.toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: 'Novo pedido do cliente' }),
    ).not.toBeInTheDocument();
  });

  it('desbloqueia a mudança com evidências e retoma sem perder a primeira entrega', async () => {
    const entry = renderScenario('/aulas');
    fireEvent.click(screen.getByRole('link', { name: 'Começar simulação' }));
    expect(await screen.findByRole('heading', { name: 'Conversa com o cliente' })).toBeVisible();
    const confirm = screen.getByRole('button', { name: 'Confirmar escopo' });
    writeNote(/Combinados com o cliente/, 'Impedir horários sobrepostos na mesma sala e data.');
    expect(confirm).toBeDisabled();

    for (const { prompt, answer } of bookingScenario.questions) {
      expect(screen.queryByText(answer)).not.toBeInTheDocument();
      fireEvent.click(screen.getByRole('button', { name: prompt }));
      expect(screen.getByText(answer)).toBeVisible();
    }

    fireEvent.click(confirm);
    expect(await screen.findByRole('heading', { name: 'Primeira entrega' })).toBeVisible();
    const sharedCriterion = 'Salas e datas independentes';
    const firstEvidence = 'A mesma hora foi aceita em outra sala na versão inicial.';
    const finalEvidence = 'A mesma hora foi aceita em outra sala após adicionar o intervalo.';
    writeNote(/Como rodar o projeto/, 'Execute npm run dev e npm test.');
    const firstSubmission = screen.getByRole('button', { name: 'Registrar primeira entrega' });
    fireEvent.click(firstSubmission);
    expect(screen.getByRole('alert')).toHaveTextContent('Registre o resultado e a evidência');
    expect(screen.queryByRole('link', { name: 'Mudança de escopo' })).not.toBeInTheDocument();

    recordEvidence(bookingScenario.criteria.initial, firstEvidence);
    const initialField = evidenceFields(sharedCriterion).getByLabelText('Evidência');
    fireEvent.change(initialField, { target: { value: '   ' } });
    fireEvent.click(firstSubmission);
    expect(screen.getByRole('alert')).toHaveTextContent(sharedCriterion);
    fireEvent.change(initialField, { target: { value: firstEvidence } });
    fireEvent.click(firstSubmission);
    expect(await screen.findByRole('heading', { name: 'Mudança de escopo' })).toBeVisible();
    expect(screen.getByText(bookingScenario.changeRequest)).toBeVisible();
    const table = within(screen.getByRole('table'));
    for (const [name, after] of [
      [/15:09/, 'Bloqueia'],
      [/15:10/, 'Aceita'],
      [/Sala B/, 'Aceita'],
    ] as const) {
      const row = within(table.getByRole('row', { name }));
      expect(row.getAllByRole('cell').map(({ textContent }) => textContent)).toEqual([
        'Aceita',
        after,
      ]);
    }
    writeNote(/Impacto da mudança/, 'Adicionar dez minutos no cálculo de conflito da sala.');
    entry.unmount();

    renderScenario(bookingPath);
    expect(await screen.findByRole('heading', { name: 'Mudança de escopo' })).toBeVisible();
    expect(screen.getByRole('textbox', { name: /Impacto da mudança/ })).toHaveValue(
      'Adicionar dez minutos no cálculo de conflito da sala.',
    );
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar mudança' }));
    expect(await screen.findByRole('heading', { name: 'Entrega final' })).toBeVisible();
    expect(evidenceFields(sharedCriterion).getByLabelText('Evidência')).toHaveValue('');
    writeNote(
      /Mensagem final ao cliente/,
      'Agora a mesma sala pode receber reservas a partir de 15:10.',
    );
    recordEvidence(bookingScenario.criteria.revised, finalEvidence);
    fireEvent.click(screen.getByRole('button', { name: 'Registrar entrega final' }));
    expect(await screen.findByText('Entrega registrada')).toBeVisible();

    fireEvent.click(screen.getByRole('link', { name: 'Primeira entrega' }));
    const originalEvidence = evidenceFields(sharedCriterion).getByLabelText('Evidência');
    expect(originalEvidence).toBeDisabled();
    expect(originalEvidence).toHaveValue(firstEvidence);
    fireEvent.click(screen.getByRole('link', { name: 'Entrega final' }));
    expect(evidenceFields(sharedCriterion).getByLabelText('Evidência')).toHaveValue(finalEvidence);
  });
});
