import { useAuth0 } from '@auth0/auth0-react';
import { ChangeEvent, useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { Bars, ThreeDots } from 'react-loader-spinner';
import { RiCloseCircleFill } from 'react-icons/ri';
import { NoteModel } from '../../entity/NoteModel';
import { getApiAuthHeader } from '../../auth/apiSession';
import { isOfflineApp } from '../../runtime/mode';
import { addLocalNote, deleteLocalNote, listLocalNotes } from '../../offline/localStore';

type Props = {
  id: string;
  title: string;
};

export default function Note(props: Props) {
  const offline = isOfflineApp();
  const { getAccessTokenSilently, user, isAuthenticated, loginWithPopup } = useAuth0();
  const canUseNotes = offline || isAuthenticated;
  const [noteText, setNoteText] = useState('');
  const [notes, setNotes] = useState<NoteModel[]>(() => (offline ? listLocalNotes(props.id) : []));
  const [isSavingNote, setSavingNote] = useState(false);
  const [isLoadingNotes, setLoadingNotes] = useState(false);
  const [isDeletingNote, setDeletingNote] = useState(false);

  const getNotes = useCallback(async () => {
    if (offline) {
      setNotes(listLocalNotes(props.id));
      setLoadingNotes(false);
      return;
    }
    setLoadingNotes(true);
    try {
      const authorization = await getApiAuthHeader(isAuthenticated, getAccessTokenSilently);
      if (!authorization) {
        setNotes([]);
        return;
      }
      const response = await axios.post(
        import.meta.env.VITE_API_URL + `/notes/find` || '',
        { contentId: props.id },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: authorization,
          },
        },
      );

      setNotes(response.data);
    } catch (e) {}
    setLoadingNotes(false);
  }, [getAccessTokenSilently, isAuthenticated, offline, props.id]);

  useEffect(() => {
    if (offline || (isAuthenticated && user)) {
      getNotes();
    }
  }, [offline, isAuthenticated, user, props.id, getNotes]);

  async function handleDeleteComment(commentId: string) {
    const answer = window.confirm('Tem certeza que quer deletar?');
    if (answer) {
      if (offline) {
        deleteLocalNote(commentId);
        setNotes(listLocalNotes(props.id));
        return;
      }
      setDeletingNote(true);
      try {
        const authorization = await getApiAuthHeader(isAuthenticated, getAccessTokenSilently);
        if (!authorization) return;
        await axios.delete(import.meta.env.VITE_API_URL + `/notes/${commentId}` || '', {
          headers: {
            'Content-Type': 'application/json',
            Authorization: authorization,
          },
        });
        getNotes();
      } finally {
        setDeletingNote(false);
      }
    }
  }

  const handleCommentTextChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const inputValue = e.target.value;
    setNoteText(inputValue);
  };

  const saveCommentText = async () => {
    if (!noteText.trim()) return;
    if (offline) {
      addLocalNote(props.id, noteText);
      setNoteText('');
      setNotes(listLocalNotes(props.id));
      return;
    }
    setSavingNote(true);
    try {
      const authorization = await getApiAuthHeader(isAuthenticated, getAccessTokenSilently);
      if (!authorization) return;
      const comment: NoteModel = {
        text: noteText,
        author: user?.nickname,
        createdAt: new Date(),
        contentId: props.id,
      };

      await axios.post(import.meta.env.VITE_API_URL + `/note` || '', comment, {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json',
          Authorization: authorization,
        },
      });
      setNoteText('');
      getNotes();
    } finally {
      setSavingNote(false);
    }
  };

  return (
    <div className="my-8 rounded-lg bg-light-yellow p-4">
      {canUseNotes && (
        <>
          <h2 className="text-center font-title text-xl font-semibold text-dark-brown">
            Minhas Anotações
          </h2>
          {notes.length > 0 && <hr className="m-auto my-4 w-2/3 border-yellow" />}

          {isLoadingNotes && (
            <div className="flex py-4">
              <Bars
                height="40"
                width="40"
                color="#ee8561"
                ariaLabel="bars-loading"
                wrapperStyle={{}}
                wrapperClass="m-auto"
                visible={true}
              />
            </div>
          )}
          {notes.map((note, index) => {
            return (
              <div key={note.id || `${index}-${note.text}`} className="mb-4 ">
                <div className="flex rounded-sm hover:bg-dark-brown hover:bg-opacity-5">
                  <div className="grow flex-col align-middle">
                    <p className="mx-2 mt-2 font-title text-dark-brown">{note.text}</p>
                    <span className="my-auto mb-2 ml-2 inline-block h-fit align-middle font-title text-xs text-red">
                      {/* eslint-disable-next-line @typescript-eslint/no-non-null-assertion */}
                      {new Date(note.createdAt!).toLocaleString()}
                    </span>
                  </div>
                  <button
                    aria-label="Deletar Comentário"
                    onClick={() => handleDeleteComment(note.id || '')}
                    disabled={isDeletingNote}
                    className="rounded-sm bg-red p-1"
                  >
                    <RiCloseCircleFill className="w-3 text-dark-brown " />
                  </button>
                </div>
              </div>
            );
          })}

          <div>
            <textarea
              value={noteText}
              onChange={handleCommentTextChange}
              placeholder="Salve aqui suas anotações para não esquecer!"
              className="min-h-[80px] w-full rounded-sm border-2 border-yellow bg-[transparent] p-2 text-sm leading-snug text-dark-brown outline-none transition-colors focus:border-red"
            />
            <div className="group relative m-auto flex h-fit w-fit">
              <button
                onClick={saveCommentText}
                disabled={isSavingNote}
                className="z-20 mx-auto inline-flex h-10 items-center justify-center rounded-sm bg-brown px-4 font-title leading-tight transition-colors hover:bg-[#E2E8F0] disabled:cursor-not-allowed disabled:bg-opacity-40 disabled:hover:bg-brown disabled:hover:bg-opacity-40"
              >
                {isSavingNote ? (
                  <ThreeDots
                    height="30"
                    width="30"
                    radius="9"
                    color="#d56a47"
                    ariaLabel="three-dots-loading"
                    wrapperStyle={{}}
                    visible={true}
                  />
                ) : (
                  <>Salvar Anotação </>
                )}
              </button>
              <div className="absolute -bottom-1 -right-1 left-1 top-1 z-10 rounded-sm bg-red group-hover:bg-yellow"></div>
            </div>
          </div>
        </>
      )}
      {!canUseNotes && (
        <p className="text-center font-title">
          Adicione anotações de seus estudos 📝. Para isso basta{' '}
          <button
            className="cursor-pointer font-semibold text-red hover:underline"
            onClick={() => handleAuth()}
          >
            fazer login
          </button>
          .
        </p>
      )}
    </div>
  );

  async function handleAuth() {
    (async () => {
      await loginWithPopup();

      const authorization = await getApiAuthHeader(true, getAccessTokenSilently);
      if (!authorization) return;

      try {
        await axios.get(import.meta.env.VITE_API_URL + '/user/' + user?.nickname, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: authorization,
          },
        });
      } catch (e) {
        await axios.post(
          import.meta.env.VITE_API_URL + '/user' || '',
          {
            user_login: user?.nickname,
          },
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: authorization,
            },
          },
        );
      }
      document.location.href = '/';
    })();
  }
}
