import { useAuth0 } from '@auth0/auth0-react';
import axios from 'axios';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { User, mapResponseToUser, UserApiResponse } from '../entity/UserModel';
import MainLayout from '../components/layouts/MainLayout';
import { decode } from 'base-64';
import { clearLegacyApiTokenCookie, getApiAccessToken, logoutSession } from '../auth/apiSession';
import { isOfflineApp } from '../runtime/mode';
import UserArea from '../components/UserArea';
import {
  BackupSection,
  FeedbackQueueSection,
  LocalSpaceDashboard,
} from '../components/Offline/LocalSpacePanel';

type ProfileLoadState = 'idle' | 'loading' | 'ready' | 'error';

export default function UserPage() {
  const offline = isOfflineApp();
  const {
    user,
    isAuthenticated,
    isLoading,
    error,
    loginWithRedirect,
    getAccessTokenSilently,
    logout,
  } = useAuth0();
  const [userData, setUserData] = useState<User>();
  const [profileState, setProfileState] = useState<ProfileLoadState>('idle');
  const [actionError, setActionError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (offline) return;
    clearLegacyApiTokenCookie('/profile');
    if (isLoading || error) return;
    if (!isAuthenticated) {
      setUserData(undefined);
      setProfileState('idle');
      return;
    }

    let cancelled = false;
    setProfileState('loading');

    (async () => {
      try {
        const token = await getApiAccessToken(true, getAccessTokenSilently);
        if (cancelled) return;
        if (!token) {
          setProfileState('error');
          return;
        }

        const apiUrl = import.meta.env.VITE_API_URL;
        let email = user?.email;
        const base64Payload = token.split('.')[1];
        if (base64Payload) {
          try {
            const payload = decode(base64Payload);
            const claimEmail = JSON.parse(payload.toString())['https://trilha.info/email'];
            if (typeof claimEmail === 'string' && claimEmail) {
              email = claimEmail;
            }
          } catch {
            // Fall back to user.email when token is opaque or non-standard JWT
          }
        }

        if (!apiUrl || !email) {
          if (!cancelled) setProfileState('ready');
          return;
        }

        const response = await axios.get<UserApiResponse>(
          `${apiUrl}/users/${encodeURIComponent(email)}`,
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
          },
        );
        if (!cancelled) {
          setUserData(mapResponseToUser(response.data));
          setProfileState('ready');
        }
      } catch {
        if (!cancelled) {
          setProfileState('error');
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [attempt, error, getAccessTokenSilently, isAuthenticated, isLoading, offline, user?.email]);

  if (offline) {
    return (
      <MainLayout>
        <LocalSpaceDashboard />
        <UserArea />
      </MainLayout>
    );
  }

  async function handleStartLogin() {
    setActionError(null);
    try {
      await loginWithRedirect({
        redirectUri: `${window.location.origin}/login`,
      });
    } catch {
      setActionError('Não foi possível abrir o provedor de autenticação agora.');
    }
  }

  return (
    <MainLayout>
      {isLoading ? (
        <section className="site-empty" role="status" aria-busy="true">
          <p className="home-eyebrow">Perfil</p>
          <h1>Carregando seu perfil…</h1>
          <p>Verificando sua sessão de acesso.</p>
        </section>
      ) : error || actionError ? (
        <section className="site-empty" role="alert">
          <p className="home-eyebrow">Falha na autenticação</p>
          <h1>Não foi possível verificar sua sessão</h1>
          <p>
            {actionError ||
              'O provedor de autenticação falhou ao carregar seus dados. Tente entrar novamente ou volte para o início.'}
          </p>
          <div className="home-actions">
            <button
              type="button"
              className="home-button home-button-primary"
              onClick={handleStartLogin}
            >
              Tentar entrar novamente
            </button>
            {isAuthenticated && (
              <button type="button" className="home-button" onClick={() => logoutSession(logout)}>
                Sair da sessão
              </button>
            )}
            <Link className="home-button" to="/">
              Voltar para o início
            </Link>
          </div>
        </section>
      ) : !isAuthenticated ? (
        <section className="site-empty">
          <p className="home-eyebrow">Área da conta</p>
          <h1>Entre para acessar seu perfil</h1>
          <p>
            Faça login para consultar seus dados de acesso e gerenciar suas trilhas personalizadas.
          </p>
          <div className="home-actions">
            <button
              type="button"
              className="home-button home-button-primary"
              onClick={handleStartLogin}
            >
              Entrar na conta
            </button>
            <Link className="home-button" to="/">
              Voltar para o início
            </Link>
          </div>
          <div
            style={{
              marginTop: 32,
              textAlign: 'left',
              maxWidth: 680,
              marginInline: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
            }}
          >
            <BackupSection />
            <FeedbackQueueSection />
          </div>
        </section>
      ) : (
        <>
          <div className="flex px-2 md:px-64">
            <div className="my-10 flex">
              <div className="flex w-4 bg-gradient-to-r from-text-secondary via-text-secondary to-black "></div>
              <h1 className="font-title text-3xl font-bold text-text-primary">Perfil</h1>
            </div>
          </div>
          <div className="flex w-full px-2 md:px-64">
            <div className="flex w-full flex-col gap-4 md:w-1/2 lg:w-1/3">
              <div className="flex flex-col items-center rounded-sm bg-box-primary p-6 text-center">
                {user?.picture && (
                  <img
                    src={user.picture}
                    alt={`Avatar de ${user?.name || 'usuário'}`}
                    className="mx-auto mb-4 h-32 w-32 rounded-full"
                  />
                )}
                <h2 className="text-2xl text-text-primary">
                  {user?.name || user?.email || 'Conta conectada'}
                </h2>
                {user?.email && user?.name !== user?.email && (
                  <p className="mt-1 text-sm text-text-secondary">{user.email}</p>
                )}
              </div>
              <div className="flex flex-col items-center gap-3 rounded-sm bg-box-primary p-4 text-center">
                {profileState === 'loading' ? (
                  <p role="status" className="text-base text-text-primary">
                    Carregando dados de acesso…
                  </p>
                ) : profileState === 'error' ? (
                  <div role="alert" className="flex flex-col items-center gap-2">
                    <p className="text-base text-text-primary">
                      Não foi possível carregar o histórico de acesso agora.
                    </p>
                    <button
                      type="button"
                      className="site-ghost-button"
                      onClick={() => setAttempt((value) => value + 1)}
                    >
                      Tentar novamente
                    </button>
                  </div>
                ) : (
                  <p className="text-lg text-text-primary">
                    Último login:{' '}
                    {userData?.lastAccessAt && !Number.isNaN(userData.lastAccessAt.getTime())
                      ? userData.lastAccessAt.toLocaleDateString()
                      : 'Disponível quando conectado à API'}
                  </p>
                )}
                <button
                  type="button"
                  className="site-ghost-button"
                  onClick={() => logoutSession(logout)}
                >
                  Sair
                </button>
              </div>
            </div>
          </div>
          <div className="mx-auto mt-8 flex max-w-4xl flex-col gap-5 px-4">
            <BackupSection />
            <FeedbackQueueSection />
          </div>
        </>
      )}
    </MainLayout>
  );
}
