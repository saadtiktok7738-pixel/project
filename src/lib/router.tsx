import { useEffect, useState, useCallback, createContext, useContext, type ReactNode } from 'react';

type RouterContextType = {
  path: string;
  query: URLSearchParams;
  navigate: (to: string, opts?: { replace?: boolean }) => void;
};

const RouterContext = createContext<RouterContextType | null>(null);

function getHashPath(): string {
  const hash = window.location.hash.slice(1);
  if (!hash || hash === '/') return '/';
  return hash;
}

function getQuery(): URLSearchParams {
  const path = getHashPath();
  const idx = path.indexOf('?');
  if (idx === -1) return new URLSearchParams();
  return new URLSearchParams(path.slice(idx + 1));
}

function getPurePath(): string {
  const path = getHashPath();
  const idx = path.indexOf('?');
  if (idx === -1) return path;
  return path.slice(0, idx);
}

export function RouterProvider({ children }: { children: ReactNode }) {
  const [path, setPath] = useState(getPurePath());
  const [query, setQuery] = useState(getQuery());

  useEffect(() => {
    if (!window.location.hash) {
      window.location.hash = '#/';
    }
    const handler = () => {
      setPath(getPurePath());
      setQuery(getQuery());
      window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    };
    window.addEventListener('hashchange', handler);
    return () => window.removeEventListener('hashchange', handler);
  }, []);

  const navigate = useCallback((to: string, opts?: { replace?: boolean }) => {
    const target = to.startsWith('#') ? to : `#${to}`;
    if (opts?.replace) {
      window.location.replace(target);
    } else {
      window.location.hash = target;
    }
  }, []);

  return (
    <RouterContext.Provider value={{ path, query, navigate }}>
      {children}
    </RouterContext.Provider>
  );
}

export function useRouter() {
  const ctx = useContext(RouterContext);
  if (!ctx) throw new Error('useRouter must be used within RouterProvider');
  return ctx;
}

export function Link({ to, children, className, onClick, ...rest }: {
  to: string;
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  'aria-label'?: string;
}) {
  const { navigate } = useRouter();
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    onClick?.();
    navigate(to);
  };
  return (
    <a href={`#${to}`} className={className} onClick={handleClick} {...rest}>
      {children}
    </a>
  );
}
