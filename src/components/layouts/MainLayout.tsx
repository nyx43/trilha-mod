import { Link } from 'react-router-dom';
import { DevFlip } from '../../devmode/DevFlip';
import { DevModeToggle } from '../../devmode/DevModeControls';
import { getContentVersion, isOfflineApp } from '../../runtime/mode';
import Header from '../Header';

type Props = {
  children?: React.ReactNode;
};

export default function MainLayout({ children }: Props) {
  return (
    <div className="site-shell">
      <a href="#main-content" className="site-skip-link">
        Pular para o conteúdo
      </a>
      <Header />
      <main id="main-content" tabIndex={-1} className="site-main">
        {children}
      </main>
      <DevFlip id="footer">
        <footer className="site-footer">
          <div className="site-footer-inner">
            <div className="site-footer-brand">
              <img src="/logo.png" alt="Trilha Info" />
              <p>
                Trilhas gratuitas em português para estudar tecnologia com referências abertas,
                prática e projetos.
              </p>
            </div>
            <nav aria-label="Rodapé">
              <ul>
                <li>
                  <Link to="/#trilhas">Trilhas</Link>
                </li>
                <li>
                  <Link to="/aulas">Aulas</Link>
                </li>
                <li>
                  <Link to="/estudando">Estudando</Link>
                </li>
                <li>
                  <Link to="/aulas/o-que-estudar">O que estudar</Link>
                </li>
                <li>
                  <Link to="/percurso/api-react-tailwind">Percurso Web</Link>
                </li>
                <li>
                  <Link to="/guias">Guias</Link>
                </li>
                <li>
                  <Link to="/blog">Blog</Link>
                </li>
                <li>
                  <a
                    href="https://github.com/flaviojmendes/trilhainfo"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Código no Github
                  </a>
                </li>
              </ul>
            </nav>
          </div>
          <p className="site-footer-credits">
            Idealizado por{' '}
            <a target="_blank" rel="noreferrer" href="https://youtube.com/flaviojmendes">
              flaviojmendes
            </a>
            .{' '}
            <span className="site-content-version" data-content-version={getContentVersion()}>
              {isOfflineApp() ? 'App offline' : 'Web'} · conteúdo {getContentVersion()}
            </span>
            <DevModeToggle />
          </p>
        </footer>
      </DevFlip>
    </div>
  );
}
