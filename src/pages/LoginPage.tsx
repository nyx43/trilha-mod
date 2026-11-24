import { useAuth0 } from '@auth0/auth0-react';
import axios from 'axios';
import { useEffect, useState } from 'react';
import { Grid } from 'react-loader-spinner';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import MainLayout from '../components/layouts/MainLayout';
import { clearLegacyApiTokenCookie, getApiAuthHeader, logoutSession } from '../auth/apiSession';
import { isOfflineApp } from '../runtime/mode';

type LoginFlowStatus = 'idle' | 'syncing' | 'error';

export default function LoginPage() {
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
  const navigate = useNavigate();
  const location = useLocation();
  const [status, setStatus] = useState<LoginFlowStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  const searchParams = new URLSearchParams(location.search);
  const callbackError = searchParams.get('error');
  const callbackErrorDescription = searchParams.get('error_description');

  useEffect(() => {
    if (offline) return;
    clearLegacyApiTokenCookie('/login');
  }, [offline]);

  useEffect(() => {
    if (offline || isLoading || error || callbackError) return;
    if (!isAuthenticated) {
      setStatus('idle');
      return;
    }

    let cancelled = false;
    setStatus('syncing');
    setErrorMessage(null);

    (async () => {
      try {
        const authorization = await getApiAuthHeader(true, getAccessTokenSilently);
        if (cancelled) return;
        if (!authorization) {
          throw new Error('Não foi possível obter a credencial da sessão.');
        }

        const apiUrl = import.meta.env.VITE_API_URL;
        if (apiUrl && user?.email) {
          const headers = {
            'Content-Type': 'application/json',
            Authorization: authorization,
          };
          try {
            await axios.get(`${apiUrl}/user/${encodeURIComponent(user.email)}`, { headers });
          } catch {
            await axios.post(`${apiUrl}/user`, { login: user.email }, { headers });
          }
        }

        if (!cancelled) {
          navigate('/', { replace: true });
        }
      } catch {
        if (!cancelled) {
          setStatus('error');
          setErrorMessage(
            'Não foi possível concluir a autenticação com o provedor ou sincronizar sua conta.',
          );
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    attempt,
    callbackError,
    error,
    getAccessTokenSilently,
    isAuthenticated,
    isLoading,
    navigate,
    offline,
    user?.email,
  ]);

  if (offline) {
    return (
      <MainLayout>
        <section className="site-empty">
          <p className="home-eyebrow">Aplicativo offline</p>
          <h1>Sem login remoto necessário</h1>
          <p>
            Seu perfil, anotações, trilhas pessoais e progresso são salvos diretamente neste
            aparelho, mesmo em modo avião.
          </p>
          <div className="home-actions">
            <Link className="home-button home-button-primary" to="/profile">
              Abrir Meu espaço
            </Link>
            <Link className="home-button" to="/">
              Voltar para o início
            </Link>
          </div>
        </section>
      </MainLayout>
    );
  }

  async function handleStartLogin() {
    setErrorMessage(null);
    setStatus('idle');
    try {
      await loginWithRedirect({
        redirectUri: `${window.location.origin}/login`,
      });
    } catch {
      setStatus('error');
      setErrorMessage('Não foi possível iniciar o login com o provedor de autenticação.');
    }
  }

  const providerErrorText =
    errorMessage ||
    (error ? 'O provedor de autenticação retornou uma falha ao verificar sua sessão.' : null) ||
    (callbackError
      ? callbackErrorDescription || 'O provedor de autenticação recusou ou cancelou o acesso.'
      : null);

  return (
    <MainLayout>
      {isLoading || (isAuthenticated && status === 'syncing') ? (
        <section className="site-empty" role="status" aria-busy="true">
          <div className="mb-4 flex justify-center">
            <Grid
              height="64"
              width="64"
              color="#d56a47"
              ariaLabel="Verificando autenticação"
              radius="12.5"
              visible={true}
            />
          </div>
          <p className="home-eyebrow">Conta</p>
          <h1>{isAuthenticated ? 'Concluindo sua entrada…' : 'Verificando sua sessão…'}</h1>
          <p>Aguarde um instante enquanto confirmamos o acesso.</p>
        </section>
      ) : providerErrorText ? (
        <section className="site-empty" role="alert">
          <p className="home-eyebrow">Falha na autenticação</p>
          <h1>Não foi possível entrar agora</h1>
          <p>{providerErrorText}</p>
          <div className="home-actions">
            {isAuthenticated ? (
              <>
                <button
                  type="button"
                  className="home-button home-button-primary"
                  onClick={() => setAttempt((value) => value + 1)}
                >
                  Tentar novamente
                </button>
                <button type="button" className="home-button" onClick={() => logoutSession(logout)}>
                  Sair da sessão
                </button>
              </>
            ) : (
              <button
                type="button"
                className="home-button home-button-primary"
                onClick={handleStartLogin}
              >
                Tentar entrar novamente
              </button>
            )}
            <Link className="home-button" to="/">
              Voltar para o início
            </Link>
          </div>
        </section>
      ) : !isAuthenticated ? (
        <section className="site-empty">
          <p className="home-eyebrow">Acesso opcional</p>
          <h1>Entrar na sua conta</h1>
          <p>
            Faça login para gerenciar roadmaps personalizados e sincronizar anotações. Você também
            pode estudar todas as trilhas, guias e aulas sem criar conta.
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
              Continuar sem conta
            </Link>
          </div>
        </section>
      ) : (
        <section className="site-empty">
          <p className="home-eyebrow">Sessão ativa</p>
          <h1>Você já está conectado</h1>
          <p>Sua sessão está ativa. Acesse seu perfil ou volte para continuar estudando.</p>
          <div className="home-actions">
            <Link className="home-button home-button-primary" to="/profile">
              Ir para o perfil
            </Link>
            <Link className="home-button" to="/">
              Voltar para o início
            </Link>
          </div>
        </section>
      )}
    </MainLayout>
  );
}
