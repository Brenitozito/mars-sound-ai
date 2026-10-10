import { UPLOAD_LIMITS } from "../../config/uploadLimits";
import type { Track, TrackUploadInput } from "../../types/domain";
import { readAudioDuration } from "../../utils/files";
import type { CatalogService, UploadProgressListener } from "../contracts";
import { ServiceError } from "../serviceError";
import { getSupabase } from "./client";
import { toServiceError, unwrap } from "./supabaseErrors";
import { orderByIds, PROFILE_COLUMNS, toTrack, toUserProfile, TRACK_COLUMNS } from "./supabaseMappers";
import {
  buildObjectPath,
  MEDIA_BUCKETS,
  removeObjectsQuietly,
  resolveFileExtension,
  uploadObject,
  uploadResumable,
} from "./supabaseStorage";

const DEFAULT_PAGE_SIZE = 12;
const HOME_SECTION_SIZE = 14;
const TOP_CREATORS_LIMIT = 12;
const FEATURED_GENRES_LIMIT = 12;
const POPULAR_TAGS_LIMIT = 10;
const DEFAULT_RECOMMENDATION_LIMIT = 14;
/** Mantém a URL de `in (...)` bem abaixo dos limites de proxies (cada uuid ocupa ~37 caracteres). */
const IDS_PER_REQUEST = 100;
/** O áudio domina o tempo de envio; o restante da barra cobre capa e gravação no banco. */
const AUDIO_PROGRESS_SHARE = 90;

const PUBLISH_ERROR_MESSAGES = {
  validation: "Verifique os dados da música e tente novamente.",
  unknown: "Não foi possível publicar a música. Tente novamente.",
};

function publishedTracksQuery() {
  return getSupabase().from("tracks_with_artist").select(TRACK_COLUMNS).eq("status", "published");
}

/** Criadores em destaque: perfis públicos com ao menos uma faixa publicada, exceto o próprio usuário. */
async function topCreatorsQuery() {
  const supabase = getSupabase();
  const { data } = await supabase.auth.getSession();
  const query = supabase
    .from("profiles")
    .select(`${PROFILE_COLUMNS}, tracks!tracks_artist_id_fkey!inner()`)
    .eq("is_public", true)
    .eq("tracks.status", "published")
    .order("followers_count", { ascending: false })
    .order("created_at", { ascending: true })
    .limit(TOP_CREATORS_LIMIT);
  const currentUserId = data.session?.user.id;
  return currentUserId ? query.neq("id", currentUserId) : query;
}

function chunk<TItem>(items: readonly TItem[], size: number): TItem[][] {
  const chunks: TItem[][] = [];
  for (let index = 0; index < items.length; index += size) chunks.push(items.slice(index, index + size));
  return chunks;
}

function toOptionalColumn(value: string): string | null {
  const trimmedValue = value.trim();
  return trimmedValue ? trimmedValue : null;
}

function validateUpload(input: TrackUploadInput): void {
  if (!input.title.trim()) throw new ServiceError("validation", "Informe o título da música.");
  if (!input.genre) throw new ServiceError("validation", "Selecione um gênero.");
  if (input.audioFile.size > UPLOAD_LIMITS.audioMaxBytes) {
    throw new ServiceError("validation", "O arquivo de áudio excede o limite permitido.");
  }
  if (input.coverFile && input.coverFile.size > UPLOAD_LIMITS.imageMaxBytes) {
    throw new ServiceError("validation", "A capa excede o limite de 2 MB.");
  }
}

async function readLocalAudioDuration(audioFile: File): Promise<number> {
  const objectUrl = URL.createObjectURL(audioFile);
  try {
    return await readAudioDuration(objectUrl);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

async function fetchTrackById(trackId: string): Promise<Track> {
  const response = await getSupabase().from("tracks_with_artist").select(TRACK_COLUMNS).eq("id", trackId).maybeSingle();
  const trackRow = unwrap(response);
  if (!trackRow) throw new ServiceError("not_found", "Música não encontrada.");
  return toTrack(trackRow);
}

async function insertTrackRecords(
  trackId: string,
  artistId: string,
  input: TrackUploadInput,
  media: { audioPath: string; coverPath: string | null; durationSeconds: number },
) {
  const supabase = getSupabase();
  unwrap(
    await supabase.from("tracks").insert({
      id: trackId,
      artist_id: artistId,
      title: input.title.trim(),
      genre: input.genre,
      album: toOptionalColumn(input.album),
      description: toOptionalColumn(input.description),
      tags: [...input.tags],
      ai_generator: toOptionalColumn(input.aiGenerator),
      prompt: toOptionalColumn(input.prompt),
      audio_path: media.audioPath,
      cover_path: media.coverPath,
      duration_seconds: media.durationSeconds,
      file_size_bytes: input.audioFile.size,
      audio_format: resolveFileExtension(input.audioFile),
      status: "published",
    }),
    PUBLISH_ERROR_MESSAGES,
  );

  if (input.moods.length > 0) {
    unwrap(
      await supabase.from("track_moods").insert(input.moods.map((mood) => ({ track_id: trackId, mood }))),
      PUBLISH_ERROR_MESSAGES,
    );
  }
}

export const supabaseCatalogService: CatalogService = {
  async getCatalogOptions() {
    const supabase = getSupabase();
    const [genresResponse, moodsResponse, generatorsResponse, tagsResponse] = await Promise.all([
      supabase.from("genres").select("name").order("sort_order").order("name"),
      supabase.from("moods").select("name").order("sort_order").order("name"),
      supabase.from("ai_generators").select("name").order("sort_order").order("name"),
      supabase.rpc("get_popular_tags", { p_limit: POPULAR_TAGS_LIMIT }),
    ]);
    const errorMessages = { unknown: "Não foi possível carregar gêneros, moods e sugestões." };

    return {
      genres: unwrap(genresResponse, errorMessages).map((row) => row.name),
      moods: unwrap(moodsResponse, errorMessages).map((row) => row.name),
      aiGenerators: unwrap(generatorsResponse, errorMessages).map((row) => row.name),
      popularTags: unwrap(tagsResponse, errorMessages).map((row) => row.tag),
    };
  },

  async getHomeFeed() {
    const supabase = getSupabase();
    const [creatorsResponse, trendingResponse, recentResponse, weeklyResponse, genresResponse] = await Promise.all([
      topCreatorsQuery(),
      publishedTracksQuery()
        .order("play_count", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(HOME_SECTION_SIZE),
      publishedTracksQuery().order("created_at", { ascending: false }).limit(HOME_SECTION_SIZE),
      supabase.rpc("get_weekly_highlights", { p_limit: HOME_SECTION_SIZE }),
      supabase.rpc("get_featured_genres", { p_limit: FEATURED_GENRES_LIMIT }),
    ]);

    return {
      topCreators: unwrap(creatorsResponse).map(toUserProfile),
      trending: unwrap(trendingResponse).map(toTrack),
      recentReleases: unwrap(recentResponse).map(toTrack),
      weeklyHighlights: unwrap(weeklyResponse).map(toTrack),
      featuredGenres: unwrap(genresResponse).map((row) => row.genre),
    };
  },

  async getRecommendedTracks(_userId, limit = DEFAULT_RECOMMENDATION_LIMIT) {
    const rows = unwrap(await getSupabase().rpc("get_recommended_tracks", { p_limit: limit }));
    return rows.map(toTrack);
  },

  async searchTracks({ query = "", genres = [], moods = [], sort = "popular", offset = 0, limit = DEFAULT_PAGE_SIZE }) {
    const rows = unwrap(
      await getSupabase().rpc("search_tracks", {
        p_query: query,
        p_genres: [...genres],
        p_moods: [...moods],
        p_sort: sort,
        p_offset: offset,
        p_limit: limit,
      }),
      { unknown: "Não foi possível buscar músicas. Tente novamente." },
    );
    return { items: rows.map(toTrack), total: Number(rows[0]?.total_count ?? 0) };
  },

  async getTracksByIds(trackIds) {
    const uniqueIds = [...new Set(trackIds)];
    if (uniqueIds.length === 0) return [];
    const responses = await Promise.all(
      chunk(uniqueIds, IDS_PER_REQUEST).map((idsChunk) =>
        getSupabase().from("tracks_with_artist").select(TRACK_COLUMNS).in("id", idsChunk),
      ),
    );
    const tracks = responses.flatMap((response) => unwrap(response).map(toTrack));
    return orderByIds(tracks, trackIds);
  },

  async getTracksByArtist(artistId) {
    const rows = unwrap(
      await publishedTracksQuery().eq("artist_id", artistId).order("created_at", { ascending: false }),
    );
    return rows.map(toTrack);
  },

  async publishTrack(artist, input, onProgress?: UploadProgressListener) {
    validateUpload(input);
    const durationSeconds = await readLocalAudioDuration(input.audioFile);
    if (durationSeconds <= 0) {
      throw new ServiceError("validation", "Não foi possível ler a duração do áudio. Verifique se o arquivo não está corrompido.");
    }

    const trackId = crypto.randomUUID();
    const audioPath = buildObjectPath(artist.id, input.audioFile, { fileId: trackId });
    const coverPath = input.coverFile ? buildObjectPath(artist.id, input.coverFile, { fileId: trackId }) : null;
    let hasAttemptedTrackInsert = false;

    try {
      await uploadResumable({
        bucket: MEDIA_BUCKETS.audio,
        path: audioPath,
        file: input.audioFile,
        onProgress: (percentComplete) => onProgress?.(Math.round((percentComplete * AUDIO_PROGRESS_SHARE) / 100)),
      });
      if (input.coverFile && coverPath) await uploadObject(MEDIA_BUCKETS.trackCover, coverPath, input.coverFile);

      hasAttemptedTrackInsert = true;
      await insertTrackRecords(trackId, artist.id, input, { audioPath, coverPath, durationSeconds });
      const publishedTrack = await fetchTrackById(trackId);
      onProgress?.(100);
      return publishedTrack;
    } catch (error) {
      if (hasAttemptedTrackInsert) await getSupabase().from("tracks").delete().eq("id", trackId);
      await Promise.all([
        removeObjectsQuietly(MEDIA_BUCKETS.audio, [audioPath]),
        removeObjectsQuietly(MEDIA_BUCKETS.trackCover, [coverPath]),
      ]);
      throw toServiceError(error, PUBLISH_ERROR_MESSAGES);
    }
  },
};
