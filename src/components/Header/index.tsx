import { useAuth0 } from '@auth0/auth0-react';
import { FaGithub, FaInstagram } from 'react-icons/fa';
import { Link, NavLink } from 'react-router-dom';
import Logo from '../Logo';
import MobileMenu from '../MobileMenu';
import { MdArrowDropDown } from 'react-icons/md';
import { DevFlip } from '../../devmode/DevFlip';
import { logoutSession } from '../../auth/apiSession';
import { isOfflineApp } from '../../runtime/mode';

export const siteLinks: Array<{ label: string; to: string; end?: boolean }> = [
  { label: 'Trilhas', to: '/#trilhas' },
  { label: 'Aulas', to: '/aulas', end: true },
  { label: 'Estudando', to: '/estudando' },
  { label: 'O que estudar', to: '/aulas/o-que-estudar' },
  { label: 'Percurso Web', to: '/percurso/api-react-tailwind' },
  { label: 'Guias', to: '/guias' },
  { label: 'Blog', to: '/blog' },
];

export default function Header() {
  const offline = isOfflineApp();
  const { user, isAuthenticated, isLoading, logout } = useAuth0();

  return (
    <header className="site-header">
      <DevFlip
        id="header"
        variant="dialog"
        data={{ siteLinks, isAuthenticated, isLoading, user: user?.name }}
      >
        <div className="site-header-inner">
          <Logo />
          <nav className="site-nav" aria-label="navegação principal">
            <ul>
              {siteLinks.map((link) => (
                <li key={link.label}>
                  {link.to.includes('#') ? (
                    <Link to={link.to}>{link.label}</Link>
                  ) : (
                    <NavLink to={link.to} end={link.end}>
                      {link.label}
                    </NavLink>
                  )}
                </li>
              ))}
            </ul>
          </nav>
          <div className="site-header-actions">
            {offline ? (
              <Link to="/profile" className="site-user-button">
                <span>Meu espaço</span>
              </Link>
            ) : (
              <>
                <a
                  target="_blank"
                  className="site-icon-link"
                  href="https://github.com/flaviojmendes/trilhainfo"
                  rel="noreferrer"
                  aria-label="Github"
                >
                  <FaGithub aria-hidden="true" />
                </a>
                <a
                  target="_blank"
                  className="site-icon-link"
                  href="https://instagram.com/trilhainfo"
                  rel="noreferrer"
                  aria-label="Instagram"
                >
                  <FaInstagram aria-hidden="true" />
                </a>
                {isAuthenticated && (
                  <div className="site-user">
                    <Link to="/profile" className="site-user-button">
                      {user?.picture && <img src={user.picture} alt="" />}
                      <span>{user?.name}</span>
                      <MdArrowDropDown aria-hidden="true" />
                    </Link>
                    <button
                      type="button"
                      className="site-ghost-button"
                      onClick={() => logoutSession(logout)}
                    >
                      Sair
                    </button>
                  </div>
                )}
                {isLoading && (
                  <span
                    role="status"
                    aria-label="Carregando sessão"
                    className="m-auto inline-flex items-center"
                  >
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 120 30"
                      fill="#FF8AB5"
                      aria-hidden="true"
                    >
                      <circle cx="15" cy="15" r="12">
                        <animate
                          attributeName="opacity"
                          values="0.35;1;0.35"
                          dur="0.9s"
                          repeatCount="indefinite"
                          begin="0s"
                        />
                      </circle>
                      <circle cx="60" cy="15" r="12">
                        <animate
                          attributeName="opacity"
                          values="0.35;1;0.35"
                          dur="0.9s"
                          repeatCount="indefinite"
                          begin="0.2s"
                        />
                      </circle>
                      <circle cx="105" cy="15" r="12">
                        <animate
                          attributeName="opacity"
                          values="0.35;1;0.35"
                          dur="0.9s"
                          repeatCount="indefinite"
                          begin="0.4s"
                        />
                      </circle>
                    </svg>
                  </span>
                )}
              </>
            )}
          </div>
          <MobileMenu />
        </div>
      </DevFlip>
    </header>
  );
}
