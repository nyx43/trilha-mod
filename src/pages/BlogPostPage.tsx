import { useEffect, useState } from 'react';
import { PiArrowLeft } from 'react-icons/pi';
import { Link, useParams } from 'react-router-dom';
import MainLayout from '../components/layouts/MainLayout';
import Markdown from 'markdown-to-jsx';
import posts from '../../public/posts/posts.json';
import E404Page from './E404Page';
import '../components/Guide/guide.css';

type TitleProps = {
  children: React.ReactNode;
};

const Title = ({ children, ...props }: TitleProps) => (
  <div {...props} className="w-full">
    <h1 className="mt-4 font-title text-3xl text-title-primary sm:text-4xl">{children}</h1>
    <div className="mb-10 mt-3 flex w-full">
      <div className="to-transparent h-1.5 w-48 rounded-full bg-gradient-to-r from-primary"></div>
    </div>
  </div>
);

const SecondaryTitle = ({ children, ...props }: TitleProps) => (
  <h2 {...props} className="mb-3 mt-10 font-title text-2xl text-title-primary">
    {children}
  </h2>
);

const H3Title = ({ children, ...props }: TitleProps) => (
  <h3 {...props} className="mb-2 mt-8 font-title text-xl font-semibold text-text-primary">
    {children}
  </h3>
);

const H4Title = ({ children, ...props }: TitleProps) => (
  <h4 {...props} className="mb-2 mt-6 font-title text-lg font-semibold text-text-primary">
    {children}
  </h4>
);

const Divider = () => (
  <hr className="via-white/15 to-transparent my-10 h-px border-0 bg-gradient-to-r from-primary/60" />
);

export default function BlogPostPage() {
  const { title } = useParams<string>();
  const post = posts.find((item) => item.url === title);
  const [state, setState] = useState<{ title?: string; text?: string; error?: boolean }>({});

  useEffect(() => {
    if (!post) return;
    const controller = new AbortController();
    fetch(`/posts/${title}.md`, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error('Não foi possível carregar a publicação');
        return res.text();
      })
      .then((text) => {
        if (!controller.signal.aborted) setState({ title, text });
      })
      .catch(() => {
        if (!controller.signal.aborted) setState({ title, error: true });
      });
    return () => controller.abort();
  }, [title, post]);

  if (!post)
    return (
      <MainLayout>
        <E404Page />
      </MainLayout>
    );

  return (
    <MainLayout>
      <article className="guide-page" aria-label={post.title}>
        <nav className="guide-crumbs mb-6" aria-label="Você está em">
          <ol>
            <li>
              <Link to="/">Início</Link>
            </li>
            <li>
              <Link to="/blog">Blog</Link>
            </li>
            <li>{post.title}</li>
          </ol>
        </nav>

        <div className="max-w-[760px] leading-relaxed text-text-primary">
          {state.title !== title || (!state.text && !state.error) ? (
            <p role="status">Carregando publicação…</p>
          ) : state.error ? (
            <p role="alert">
              Não foi possível carregar a publicação. Recarregue a página para tentar novamente.
            </p>
          ) : (
            <Markdown
              options={{
                disableParsingRawHTML: true,
                forceWrapper: false,
                overrides: {
                  article: {
                    component: 'article',
                    props: {
                      className: 'flex flex-col',
                    },
                  },
                  p: {
                    component: 'p',
                    props: {
                      className: 'my-4 leading-7 text-[#dce2ee]',
                    },
                  },
                  h1: {
                    component: Title,
                  },
                  h2: {
                    component: SecondaryTitle,
                  },
                  h3: {
                    component: H3Title,
                  },
                  h4: {
                    component: H4Title,
                  },
                  img: {
                    component: 'img',
                    props: {
                      className: 'mx-auto my-6 rounded-xl',
                    },
                  },
                  hr: {
                    component: Divider,
                  },
                  a: {
                    component: 'a',
                    props: {
                      className: 'text-primary hover:underline',
                    },
                  },
                  pre: {
                    component: 'pre',
                    props: {
                      className:
                        'my-6 overflow-x-auto rounded-xl bg-[#0c0e14] p-4 text-left text-sm',
                    },
                  },
                  code: {
                    component: 'code',
                    props: { className: 'font-mono text-sm' },
                  },
                },
              }}
            >
              {state.text || ''}
            </Markdown>
          )}
        </div>

        <footer className="guide-end mt-12 max-w-[760px]">
          <Link className="home-button" to="/blog">
            <PiArrowLeft aria-hidden="true" /> Voltar para o blog
          </Link>
        </footer>
      </article>
    </MainLayout>
  );
}
