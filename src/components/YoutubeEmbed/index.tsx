import { isOfflineApp } from '../../runtime/mode';

type Props = {
  embedId: string;
};

export default function YoutubeEmbed({ embedId }: Props) {
  const offline =
    isOfflineApp() || (typeof navigator !== 'undefined' && navigator.onLine === false);

  if (offline) {
    const watchUrl = `https://www.youtube.com/watch?v=${encodeURIComponent(embedId)}`;
    return (
      <div
        role="note"
        className="mx-auto w-full max-w-3xl rounded-lg border border-yellow/40 bg-box-primary p-5 text-left"
      >
        <p className="font-title text-sm font-semibold uppercase tracking-wide text-yellow">
          Vídeo externo · requer internet
        </p>
        <p className="mt-2 text-base text-text-primary">
          Este vídeo está hospedado no YouTube e não pode ser reproduzido em modo avião. Você pode
          continuar pelas aulas interativas e guias locais ou abrir o link quando estiver conectado.
        </p>
        <p className="mt-3 text-sm">
          <a
            href={watchUrl}
            target="_blank"
            rel="noreferrer"
            className="break-all text-yellow underline"
          >
            Abrir vídeo no YouTube ({watchUrl})
          </a>
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl">
      <iframe
        className="aspect-video w-full rounded-sm"
        src={`https://www.youtube.com/embed/${embedId}`}
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        title="Embedded youtube"
      />
    </div>
  );
}
