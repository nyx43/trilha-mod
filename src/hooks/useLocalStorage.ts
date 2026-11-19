import { useCallback, useEffect, useRef, useState } from 'react';

type UpdaterFn<TState> = (currentState: TState) => TState;

type Result<TState> = [
  state: TState,
  wrappedSetState: (update: TState | UpdaterFn<TState>) => void,
];

type Options<TState> = {
  serializer?: (value: TState) => string;
  deserializer?: (value: string) => TState;
};

type StorageState<TState> = {
  key: string;
  value: TState;
  serialized: string | null;
};

function safeSerialize<TState>(
  value: TState,
  serializer: (value: TState) => string,
): string | null {
  try {
    return serializer(value);
  } catch {
    return null;
  }
}

function readStorageState<TState>(
  key: string,
  initialValue: TState,
  serializer: (value: TState) => string,
  deserializer: (value: string) => TState,
): StorageState<TState> {
  try {
    const item = window.localStorage.getItem(key);
    if (item !== null) {
      const parsed = deserializer(item);
      return {
        key,
        value: parsed,
        serialized: safeSerialize(parsed, serializer) ?? item,
      };
    }
  } catch (error) {
    console.error(error);
  }

  return {
    key,
    value: initialValue,
    serialized: safeSerialize(initialValue, serializer),
  };
}

function cloneMutatedValue<TState>(value: TState): TState {
  if (Array.isArray(value)) {
    return [...value] as unknown as TState;
  }
  if (value instanceof Map) {
    return new Map(value) as unknown as TState;
  }
  if (value instanceof Set) {
    return new Set(value) as unknown as TState;
  }
  if (value !== null && typeof value === 'object') {
    return { ...value };
  }
  return value;
}

export function useLocalStorage<TState>(
  key: string,
  initialValue: TState,
  options?: Options<TState>,
): Result<TState> {
  const serializer = options?.serializer ?? JSON.stringify;
  const deserializer = options?.deserializer ?? JSON.parse;
  const serializerRef = useRef(serializer);
  const deserializerRef = useRef(deserializer);
  const initialValueRef = useRef(initialValue);

  serializerRef.current = serializer;
  deserializerRef.current = deserializer;
  initialValueRef.current = initialValue;

  const [storageState, setStorageState] = useState<StorageState<TState>>(() =>
    readStorageState(key, initialValue, serializer, deserializer),
  );

  useEffect(() => {
    setStorageState((current) => {
      if (current.key === key) return current;
      return readStorageState(
        key,
        initialValueRef.current,
        serializerRef.current,
        deserializerRef.current,
      );
    });
  }, [key]);

  const activeValue =
    storageState.key === key
      ? storageState.value
      : readStorageState(key, initialValue, serializer, deserializer).value;

  const wrappedSetState = useCallback(
    (update: TState | UpdaterFn<TState>) => {
      try {
        setStorageState((current) => {
          const base =
            current.key === key
              ? current
              : readStorageState(
                  key,
                  initialValueRef.current,
                  serializerRef.current,
                  deserializerRef.current,
                );

          const nextValue =
            typeof update === 'function' ? (update as UpdaterFn<TState>)(base.value) : update;

          const nextSerialized = serializerRef.current(nextValue);
          const sameReference = Object.is(nextValue, base.value);

          if (sameReference && nextSerialized === base.serialized) {
            return current.key === key ? current : base;
          }

          try {
            if (window.localStorage.getItem(key) !== nextSerialized) {
              window.localStorage.setItem(key, nextSerialized);
            }
          } catch (error) {
            console.error(error);
          }

          const committedValue = sameReference ? cloneMutatedValue(nextValue) : nextValue;
          return {
            key,
            value: committedValue,
            serialized: nextSerialized,
          };
        });
      } catch (error) {
        console.error(error);
      }
    },
    [key],
  );

  return [activeValue, wrappedSetState];
}
