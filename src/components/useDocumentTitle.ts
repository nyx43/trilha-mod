import { useRef, useEffect } from 'react';

function useDocumentTitle(title: string, prevailOnUnmount = false) {
  const defaultTitle = useRef(document.title);
  const prevailRef = useRef(prevailOnUnmount);
  prevailRef.current = prevailOnUnmount;

  useEffect(() => {
    document.title = title;
  }, [title]);

  useEffect(() => {
    const initialTitle = defaultTitle.current;
    return () => {
      if (!prevailRef.current) {
        document.title = initialTitle;
      }
    };
  }, []);
}

export default useDocumentTitle;
