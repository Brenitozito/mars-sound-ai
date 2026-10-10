import type { ProfileUpdate, UserProfile } from "../../types/domain";
import type { UserService } from "../contracts";
import { ServiceError } from "../serviceError";
import { getSupabase } from "./client";
import type { TablesUpdate } from "./database.types";
import { toServiceError, unwrap } from "./supabaseErrors";
import { PROFILE_COLUMNS, toUserProfile } from "./supabaseMappers";
import { MEDIA_BUCKETS, persistWithMediaChanges } from "./supabaseStorage";

const PROFILE_NOT_FOUND_MESSAGE = "Perfil não encontrado ou privado.";
const PROFILE_ERROR_MESSAGES = {
  conflict: "Este @username já está em uso.",
  validation: "Verifique os dados do perfil e tente novamente.",
  unknown: "Não foi possível salvar o perfil. Tente novamente.",
};
const UNIQUE_VIOLATION = "23505";

type EditableProfileColumns = Pick<
  TablesUpdate<"profiles">,
  "display_name" | "handle" | "bio" | "is_public" | "favorite_genres" | "moods" | "avatar_path" | "banner_path"
>;

async function fetchProfileById(userId: string): Promise<UserProfile> {
  const response = await getSupabase().from("profiles").select(PROFILE_COLUMNS).eq("id", userId).maybeSingle();
  const profileRow = unwrap(response);
  if (!profileRow) throw new ServiceError("not_found", PROFILE_NOT_FOUND_MESSAGE);
  return toUserProfile(profileRow);
}

/** Monta o payload apenas com colunas que o papel `authenticated` pode atualizar. */
function toEditableColumns(update: Omit<ProfileUpdate, "avatar" | "banner">): EditableProfileColumns {
  const columns: EditableProfileColumns = {};
  if (update.displayName !== undefined) columns.display_name = update.displayName.trim();
  if (update.handle !== undefined) columns.handle = update.handle.trim().replace(/^@/, "").toLowerCase();
  if (update.bio !== undefined) columns.bio = update.bio.trim();
  if (update.isPublic !== undefined) columns.is_public = update.isPublic;
  if (update.favoriteGenres !== undefined) columns.favorite_genres = [...update.favoriteGenres];
  if (update.moods !== undefined) columns.moods = [...update.moods];
  return columns;
}

export const supabaseUserService: UserService = {
  async getProfileByHandle(handle) {
    const normalizedHandle = handle.trim().replace(/^@/, "").toLowerCase();
    const response = await getSupabase()
      .from("profiles")
      .select(PROFILE_COLUMNS)
      .eq("handle", normalizedHandle)
      .maybeSingle();
    const profileRow = unwrap(response);
    if (!profileRow) throw new ServiceError("not_found", PROFILE_NOT_FOUND_MESSAGE);
    return toUserProfile(profileRow);
  },

  async getProfileStats(userId) {
    const rows = unwrap(await getSupabase().rpc("get_profile_stats", { p_user_id: userId }));
    const [stats] = rows ?? [];
    if (!stats) throw new ServiceError("not_found", PROFILE_NOT_FOUND_MESSAGE);
    return {
      tracksCount: Number(stats.tracks_count),
      totalPlays: Number(stats.total_plays),
      followersCount: stats.followers_count,
      followingCount: stats.following_count,
    };
  },

  async updateProfile(userId, update) {
    const { avatar, banner, ...profileFields } = update;
    const mediaResponse = await getSupabase()
      .from("profiles")
      .select("avatar_path, banner_path")
      .eq("id", userId)
      .maybeSingle();
    const currentMedia = unwrap(mediaResponse);
    if (!currentMedia) throw new ServiceError("not_found", PROFILE_NOT_FOUND_MESSAGE);

    return persistWithMediaChanges(
      MEDIA_BUCKETS.userMedia,
      userId,
      [
        { currentPath: currentMedia.avatar_path, change: avatar, prefix: "avatar" },
        { currentPath: currentMedia.banner_path, change: banner, prefix: "banner" },
      ],
      async ([avatarPath, bannerPath]) => {
        const response = await getSupabase()
          .from("profiles")
          .update({ ...toEditableColumns(profileFields), avatar_path: avatarPath, banner_path: bannerPath })
          .eq("id", userId)
          .select(PROFILE_COLUMNS)
          .maybeSingle();
        const profileRow = unwrap(response, PROFILE_ERROR_MESSAGES);
        if (!profileRow) throw new ServiceError("not_found", PROFILE_NOT_FOUND_MESSAGE);
        return toUserProfile(profileRow);
      },
    );
  },

  async isFollowing(followerId, targetUserId) {
    const { count, error } = await getSupabase()
      .from("follows")
      .select("follower_id", { count: "exact", head: true })
      .eq("follower_id", followerId)
      .eq("followed_id", targetUserId);
    if (error) throw toServiceError(error);
    return (count ?? 0) > 0;
  },

  async setFollowing(followerId, targetUserId, shouldFollow) {
    if (followerId === targetUserId) {
      throw new ServiceError("validation", "Você não pode seguir o próprio perfil.");
    }
    const follows = getSupabase().from("follows");
    const { error } = shouldFollow
      ? await follows.insert({ follower_id: followerId, followed_id: targetUserId })
      : await follows.delete().eq("follower_id", followerId).eq("followed_id", targetUserId);
    // Seguir de novo quem já é seguido é idempotente, como no contrato.
    if (error && error.code !== UNIQUE_VIOLATION) {
      throw toServiceError(error, { unknown: "Não foi possível atualizar o seguimento. Tente novamente." });
    }
    return fetchProfileById(targetUserId);
  },
};
