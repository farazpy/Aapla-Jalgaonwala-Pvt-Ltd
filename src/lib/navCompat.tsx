import { useNavigate, useLocation, useParams, useSearchParams } from 'react-router-dom';

export function useRouter() {
  const navigate = useNavigate();
  const location = useLocation();

  return {
    push: (path: string) => navigate(path),
    replace: (path: string) => navigate(path, { replace: true }),
    back: () => navigate(-1),
    forward: () => navigate(1),
    refresh: () => window.location.reload(),
    pathname: location.pathname
  };
}

export function usePathname() {
  const location = useLocation();
  return location.pathname;
}

export { useParams, useSearchParams };
