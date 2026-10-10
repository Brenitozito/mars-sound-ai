import { X } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router";
import { useCurrentUser } from "../../context/AuthContext";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";
import { buildDiscoverPath, DISCOVER_PARAMS, parseDiscoverFilters } from "../../routes/discoverFilters";
import { ROUTES } from "../../routes/paths";
import { UserAvatar } from "../profile/UserAvatar";
import { SearchIcon, UploadIcon } from "./NavigationIcons";

const SEARCH_DEBOUNCE_MS = 350;

function useGlobalSearch() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [searchParams] = useSearchParams();
  const isOnDiscover = pathname === ROUTES.discover;
  const urlQuery = isOnDiscover ? (searchParams.get(DISCOVER_PARAMS.query) ?? "") : "";

  const buildSearchPath = (query: string) =>
    buildDiscoverPath(isOnDiscover ? { ...parseDiscoverFilters(searchParams), query } : { query });

  const [searchValue, setSearchValue] = useState(urlQuery);
  const [syncedUrlQuery, setSyncedUrlQuery] = useState(urlQuery);
  if (urlQuery !== syncedUrlQuery) {
    setSyncedUrlQuery(urlQuery);
    setSearchValue(urlQuery);
  }

  const debouncedSearchValue = useDebouncedValue(searchValue, SEARCH_DEBOUNCE_MS);

  // Só reage à digitação (valor com debounce); navegar por outros meios não deve disparar uma nova busca.
  useEffect(() => {
    if (debouncedSearchValue.trim() === urlQuery.trim()) return;
    if (!debouncedSearchValue.trim() && !isOnDiscover) return;
    navigate(buildSearchPath(debouncedSearchValue), { replace: isOnDiscover });
  }, [debouncedSearchValue]);

  const submitSearch = () => {
    if (searchValue.trim() === urlQuery.trim() && isOnDiscover) return;
    navigate(buildSearchPath(searchValue), { replace: isOnDiscover });
  };

  return { searchValue, setSearchValue, submitSearch };
}

interface NavbarProps {
  isSidebarOpen: boolean;
  onMenuToggle: () => void;
}

export function Navbar({ isSidebarOpen, onMenuToggle }: NavbarProps) {
  const currentUser = useCurrentUser();
  const { searchValue, setSearchValue, submitSearch } = useGlobalSearch();

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    submitSearch();
  };

  return (
    <header className="sticky top-0 z-30 flex h-[var(--navbar-height)] items-center gap-3 border-b border-[var(--color-border-subtle)] bg-[var(--color-bg-sidebar)] px-4 lg:px-8">
      <button
        type="button"
        className="flex min-h-[44px] min-w-[44px] shrink-0 flex-col items-center justify-center gap-1 p-2 lg:hidden"
        onClick={onMenuToggle}
        aria-label="Abrir menu"
        aria-expanded={isSidebarOpen}
        aria-controls="app-sidebar"
      >
        <span className="block h-0.5 w-5 rounded bg-[var(--color-text-secondary)]" />
        <span className="block h-0.5 w-5 rounded bg-[var(--color-text-secondary)]" />
        <span className="block h-0.5 w-5 rounded bg-[var(--color-text-secondary)]" />
      </button>

      <form role="search" onSubmit={handleSubmit} className="relative max-w-xl flex-1">
        <label htmlFor="global-search" className="sr-only">
          Buscar músicas ou artistas
        </label>
        <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[var(--color-text-muted)]">
          <SearchIcon />
        </span>
        <input
          id="global-search"
          type="search"
          value={searchValue}
          onChange={(event) => setSearchValue(event.target.value)}
          placeholder="Buscar músicas ou artistas"
          autoComplete="off"
          enterKeyHint="search"
          className="h-11 w-full rounded-md border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] py-2 pr-10 pl-9 text-[14px] text-[var(--color-text-primary)] outline-none transition-colors duration-150 focus:border-[var(--color-brand)] [&::-webkit-search-cancel-button]:hidden"
        />
        {searchValue && (
          <button
            type="button"
            onClick={() => setSearchValue("")}
            aria-label="Limpar busca"
            className="absolute top-1/2 right-1 flex size-9 -translate-y-1/2 items-center justify-center text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
          >
            <X className="size-4" />
          </button>
        )}
      </form>

      <div className="ml-auto flex shrink-0 items-center gap-3">
        <Link
          to={ROUTES.upload}
          className="hidden min-h-[44px] items-center gap-2 rounded-md border border-[var(--color-brand)] px-4 py-2 text-[13px] text-[var(--color-text-primary)] transition-colors duration-150 hover:bg-[var(--color-active-bg)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff164c]/60 sm:flex"
        >
          <UploadIcon />
          Carregar música AI
        </Link>

        <Link
          to={ROUTES.myProfile}
          aria-label="Abrir meu perfil"
          className="size-11 shrink-0 overflow-hidden rounded-full border-2 border-[var(--color-border-subtle)] transition-colors duration-150 hover:border-[var(--color-brand)] focus-visible:border-[var(--color-brand)] focus-visible:outline-none"
        >
          <UserAvatar profile={currentUser} className="size-full text-sm" />
        </Link>
      </div>
    </header>
  );
}
