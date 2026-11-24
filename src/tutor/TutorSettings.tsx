import type { TutorModel, TutorProvider } from './types';

interface Props {
  id: string;
  providers: TutorProvider[];
  provider?: TutorProvider;
  model?: TutorModel;
  pending: boolean;
  voices: SpeechSynthesisVoice[];
  voiceUri?: string;
  speechSupported: boolean;
  hosted?: boolean;
  onProvider: (id: string) => void;
  onModel: (id: string) => void;
  onVoice: (uri: string) => void;
}

export function TutorSettings({
  id,
  providers,
  provider,
  model,
  pending,
  voices,
  voiceUri,
  speechSupported,
  hosted = false,
  onProvider,
  onModel,
  onVoice,
}: Props) {
  return (
    <section id={id} className="lesson-tutor-settings" aria-label="Configurações do tutor">
      {provider && (
        <>
          <label>
            Provedor de IA
            <select
              value={provider.id}
              onChange={(event) => onProvider(event.target.value)}
              disabled={pending}
            >
              {providers.map(({ id, label }) => (
                <option key={id} value={id}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          {!!provider.models?.length && (
            <label>
              Modelo de IA
              <select
                value={model?.id ?? ''}
                onChange={(event) => onModel(event.target.value)}
                disabled={pending}
              >
                {provider.models.map(({ id, label }) => (
                  <option key={id} value={id}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
          )}
          <p>Trocar de provedor ou modelo inicia uma nova conversa.</p>
        </>
      )}
      {!hosted && !providers.some(({ id }) => id === 'gemini') && (
        <p>
          Para liberar o Gemini 4 Hydrogen, configure <code>TUTOR_GEMINI_API_KEY</code> no{' '}
          <code>.env.local</code>.{' '}
          <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer">
            Criar chave no Google AI Studio
          </a>
        </p>
      )}
      {speechSupported ? (
        <label>
          Voz do tutor
          <select
            value={voices.some(({ voiceURI }) => voiceURI === voiceUri) ? voiceUri : ''}
            onChange={(event) => onVoice(event.target.value)}
          >
            <option value="">Automática (português)</option>
            {voices.map(({ voiceURI, name }) => (
              <option key={voiceURI} value={voiceURI}>
                {name}
              </option>
            ))}
          </select>
        </label>
      ) : (
        <p>A narração depende das vozes disponíveis no navegador.</p>
      )}
    </section>
  );
}
