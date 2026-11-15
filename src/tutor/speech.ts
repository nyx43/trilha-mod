import { useCallback, useEffect, useRef, useState } from 'react';

export function useTutorSpeech(open: boolean) {
  const synthesis = typeof window === 'undefined' ? undefined : window.speechSynthesis;
  const supported = !!synthesis && typeof SpeechSynthesisUtterance !== 'undefined';
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [playing, setPlaying] = useState<number>();
  const [speechError, setSpeechError] = useState('');
  const current = useRef<SpeechSynthesisUtterance>();

  useEffect(() => {
    if (!open || !synthesis || !supported) return;
    const refreshVoices = () => {
      const portuguese = synthesis.getVoices().filter(({ lang }) => /^pt(?:-|_|$)/i.test(lang));
      setVoices(portuguese.sort((a, b) => Number(b.localService) - Number(a.localService)));
    };
    refreshVoices();
    synthesis.addEventListener('voiceschanged', refreshVoices);
    return () => {
      synthesis.removeEventListener('voiceschanged', refreshVoices);
      if (current.current) {
        current.current = undefined;
        synthesis.cancel();
      }
    };
  }, [open, supported, synthesis]);

  const stop = useCallback(() => {
    if (current.current) {
      current.current = undefined;
      synthesis?.cancel();
    }
    setPlaying(undefined);
    setSpeechError('');
  }, [synthesis]);

  function toggle(index: number, text: string, voiceUri?: string) {
    if (!synthesis || !supported) return;
    stop();
    if (playing === index) return;

    // Some browser voices stop before the end of a long utterance.
    const chunks = text
      .trim()
      .replace(/\s+/g, ' ')
      .match(/.{1,220}(?:[.!?](?=\s|$)|\s|$)|\S+/g);
    if (!chunks?.length) return;
    const paragraphs = chunks.filter((chunk) => chunk.trim());
    const voice =
      voices.find(({ voiceURI }) => voiceURI === voiceUri) ??
      voices.find(({ lang, localService }) => localService && /^pt[-_]BR$/i.test(lang)) ??
      voices[0];

    function next() {
      const chunk = paragraphs.shift();
      if (!chunk) {
        current.current = undefined;
        setPlaying(undefined);
        return;
      }
      const utterance = new SpeechSynthesisUtterance(chunk.trim());
      utterance.lang = voice?.lang || 'pt-BR';
      if (voice) utterance.voice = voice;
      utterance.onend = () => {
        if (current.current === utterance) next();
      };
      utterance.onerror = () => {
        if (current.current !== utterance) return;
        current.current = undefined;
        setPlaying(undefined);
        setSpeechError('Não foi possível narrar. Confira se o navegador tem uma voz em português.');
      };
      current.current = utterance;
      synthesis?.speak(utterance);
    }

    setPlaying(index);
    try {
      next();
    } catch {
      stop();
      setSpeechError('Não foi possível iniciar a narração neste navegador.');
    }
  }

  return { supported, voices, playing, speechError, stop, toggle };
}
