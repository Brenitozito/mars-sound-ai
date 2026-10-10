import type { TrackSort } from "../types/domain";
import { ROUTES } from "./paths";

export const DISCOVER_PARAMS = {
  query: "q",
  genres: "generos",
  moods: "moods",
  sort: "ordem",
} as const;

const LIST_SEPARATOR = ",";
const DEFAULT_SORT: TrackSort = "popular";
const MAX_FILTER_VALUES = 25;
const MAX_FILTER_VALUE_LENGTH = 40;

export const DISCOVER_SORT_OPTIONS: ReadonlyArray<{ value: TrackSort; label: string; urlValue: string }> = [
  { value: "popular", label: "Populares", urlValue: "populares" },
  { value: "recent", label: "Recentes", urlValue: "recentes" },
];

export interface DiscoverFilters {
  query: string;
  genres: string[];
  moods: string[];
  sort: TrackSort;
}

/** Os valores válidos vivem no banco; aqui só se limita o tamanho do que veio da URL. */
function parseList(rawValue: string | null): string[] {
  if (!rawValue) return [];
  const values = rawValue
    .split(LIST_SEPARATOR)
    .map((value) => value.trim())
    .filter((value) => value.length > 0 && value.length <= MAX_FILTER_VALUE_LENGTH);
  return [...new Set(values)].slice(0, MAX_FILTER_VALUES);
}

/** Descarta valores que não existem mais no catálogo (links antigos ou editados à mão). */
export function keepKnownFilterValues(filters: DiscoverFilters, genres: readonly string[], moods: readonly string[]): DiscoverFilters {
  return {
    ...filters,
    genres: filters.genres.filter((genre) => genres.includes(genre)),
    moods: filters.moods.filter((mood) => moods.includes(mood)),
  };
}

function parseSort(rawValue: string | null): TrackSort {
  return DISCOVER_SORT_OPTIONS.find((option) => option.urlValue === rawValue)?.value ?? DEFAULT_SORT;
}

export function parseDiscoverFilters(searchParams: URLSearchParams): DiscoverFilters {
  return {
    query: (searchParams.get(DISCOVER_PARAMS.query) ?? "").trim(),
    genres: parseList(searchParams.get(DISCOVER_PARAMS.genres)),
    moods: parseList(searchParams.get(DISCOVER_PARAMS.moods)),
    sort: parseSort(searchParams.get(DISCOVER_PARAMS.sort)),
  };
}

export function buildDiscoverSearchParams(filters: Partial<DiscoverFilters>): URLSearchParams {
  const searchParams = new URLSearchParams();
  const query = filters.query?.trim();
  if (query) searchParams.set(DISCOVER_PARAMS.query, query);
  if (filters.genres?.length) searchParams.set(DISCOVER_PARAMS.genres, filters.genres.join(LIST_SEPARATOR));
  if (filters.moods?.length) searchParams.set(DISCOVER_PARAMS.moods, filters.moods.join(LIST_SEPARATOR));
  if (filters.sort && filters.sort !== DEFAULT_SORT) {
    const sortOption = DISCOVER_SORT_OPTIONS.find((option) => option.value === filters.sort);
    if (sortOption) searchParams.set(DISCOVER_PARAMS.sort, sortOption.urlValue);
  }
  return searchParams;
}

export function buildDiscoverPath(filters: Partial<DiscoverFilters> = {}): string {
  const queryString = buildDiscoverSearchParams(filters).toString();
  return queryString ? `${ROUTES.discover}?${queryString}` : ROUTES.discover;
}

export function hasActiveDiscoverFilters(filters: DiscoverFilters): boolean {
  return filters.genres.length > 0 || filters.moods.length > 0;
}
