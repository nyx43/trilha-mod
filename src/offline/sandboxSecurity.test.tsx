import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { buildDocument, Playground, reactScripts } from '../components/Lesson/Playground';
import { buildPythonWorkerSource, pyodideBase } from '../components/Lesson/pythonRunner';
import { LessonContext } from '../components/Lesson/context';

describe('Isolamento de segurança e recursos locais dos executores (Frente 2 · item 3)', () => {
  it('Playground usa bibliotecas locais, CSP sem rede e iframe sandbox sem allow-same-origin', () => {
    for (const src of reactScripts) {
      expect(src).toMatch(/^\/vendor\/playground\//);
      expect(src).not.toContain('cdn.jsdelivr.net');
    }

    const html = buildDocument(
      { html: '<div id="app"></div>', css: '', js: 'console.log(1)' },
      'tok-1',
      'preview',
      [],
      'react',
    );
    expect(html).not.toContain('cdn.jsdelivr.net');
    expect(html).toContain('/vendor/playground/react.development.js');
    expect(html).toContain('Content-Security-Policy');
    expect(html).toContain("connect-src 'none'");

    const { container } = render(
      <LessonContext.Provider value={{ lessonId: 'teste', revision: 1 }}>
        <Playground
          activityId="pg-1"
          block={{
            type: 'playground',
            title: 'Teste isolado',
            html: '<p>Oi</p>',
            js: 'console.log("ok")',
            checks: [{ label: 'Tem p', test: 'Boolean(document.querySelector("p"))' }],
          }}
        />
      </LessonContext.Provider>,
    );

    const iframes = Array.from(container.querySelectorAll('iframe'));
    expect(iframes.length).toBeGreaterThanOrEqual(1);
    for (const frame of iframes) {
      const sandbox = frame.getAttribute('sandbox') || '';
      expect(sandbox).toContain('allow-scripts');
      expect(sandbox).not.toContain('allow-same-origin');
      expect(sandbox).not.toContain('allow-top-navigation');
    }
  });

  it('PythonLab carrega Pyodide localmente e bloqueia fetch/XHR/importScripts após o boot', () => {
    expect(pyodideBase).toBe('/vendor/pyodide/');
    const source = buildPythonWorkerSource('https://localhost/vendor/pyodide/');
    expect(source).not.toContain('cdn.jsdelivr.net');
    expect(source).toContain('https://localhost/vendor/pyodide/pyodide.js');
    expect(source).toContain("Object.defineProperty(self, 'fetch'");
    expect(source).toContain("Object.defineProperty(self, 'XMLHttpRequest'");
    expect(source).toContain("Object.defineProperty(self, 'importScripts'");
  });
});
