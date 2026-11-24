import { useAuth0 } from '@auth0/auth0-react';
import { FaGithub, FaInstagram } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import {
  Drawer,
  DrawerRoot,
  DrawerTrigger,
  DrawerTitle,
  DrawerDescription,
  DrawerClose,
} from '../Drawer';
import { siteLinks } from '../Header';
import { logoutSession } from '../../auth/apiSession';
import { isOfflineApp } from '../../runtime/mode';

export default function MobileMenu() {
  return (
    <DrawerRoot>
      <DrawerTrigger aria-label="Abrir menu principal" className="site-menu-trigger">
        <span aria-hidden="true" />
        <span aria-hidden="true" />
      </DrawerTrigger>
      <HeaderDrawer />
    </DrawerRoot>
  );
}

const HeaderDrawer = () => {
  const offline = isOfflineApp();
  const { isAuthenticated, user, logout } = useAuth0();

  return (
    <Drawer position="left">
      <DrawerTitle className="sr-only">Menu principal</DrawerTitle>
      <DrawerDescription className="sr-only">
        Navegação e links da comunidade Trilha Info.
      </DrawerDescription>
      <div className="mobile-menu">
        <img className="mobile-menu-logo" src="/logo.png" alt="Trilha Info" />
        {offline ? (
          <div className="mobile-menu-user">
            <DrawerClose asChild>
              <Link to="/profile" className="site-user-button">
                <span>Meu espaço e backup</span>
              </Link>
            </DrawerClose>
          </div>
        ) : (
          isAuthenticated && (
            <div className="mobile-menu-user">
              <DrawerClose asChild>
                <Link to="/profile" className="site-user-button">
                  {user?.picture && <img src={user.picture} alt="" />}
                  <span>{user?.name}</span>
                </Link>
              </DrawerClose>
              <button
                type="button"
                className="site-ghost-button"
                onClick={() => logoutSession(logout)}
              >
                Sair
              </button>
            </div>
          )
        )}
        <nav aria-label="Menu principal">
          <ul className="mobile-menu-links">
            {siteLinks.map((link) => (
              <li key={link.label}>
                <DrawerClose asChild>
                  <Link to={link.to}>{link.label}</Link>
                </DrawerClose>
              </li>
            ))}
          </ul>
        </nav>
        <ul className="mobile-menu-social">
          <li>
            <a target="_blank" href="https://github.com/flaviojmendes/trilhainfo" rel="noreferrer">
              <FaGithub aria-hidden="true" /> Github
            </a>
          </li>
          <li>
            <a target="_blank" href="https://instagram.com/trilhainfo" rel="noreferrer">
              <FaInstagram aria-hidden="true" /> Instagram
            </a>
          </li>
        </ul>
      </div>
    </Drawer>
  );
};
