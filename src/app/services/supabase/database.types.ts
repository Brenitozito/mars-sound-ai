export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      ai_generators: {
        Row: {
          created_at: string
          name: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          name: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          name?: string
          sort_order?: number
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          entity: string
          entity_id: string | null
          id: number
          metadata: Json
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          entity: string
          entity_id?: string | null
          id?: never
          metadata?: Json
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          entity?: string
          entity_id?: string | null
          id?: never
          metadata?: Json
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      comments: {
        Row: {
          content: string
          created_at: string
          id: string
          parent_id: string | null
          track_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          parent_id?: string | null
          track_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          parent_id?: string | null
          track_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "tracks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "tracks_with_artist"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      favorites: {
        Row: {
          created_at: string
          track_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          track_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          track_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "tracks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorites_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "tracks_with_artist"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorites_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      follows: {
        Row: {
          created_at: string
          followed_id: string
          follower_id: string
        }
        Insert: {
          created_at?: string
          followed_id: string
          follower_id: string
        }
        Update: {
          created_at?: string
          followed_id?: string
          follower_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "follows_followed_id_fkey"
            columns: ["followed_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follows_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      genres: {
        Row: {
          color: string | null
          created_at: string
          name: string
          slug: string
          sort_order: number
        }
        Insert: {
          color?: string | null
          created_at?: string
          name: string
          slug: string
          sort_order?: number
        }
        Update: {
          color?: string | null
          created_at?: string
          name?: string
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      likes: {
        Row: {
          created_at: string
          track_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          track_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          track_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "likes_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "tracks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "likes_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "tracks_with_artist"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      moods: {
        Row: {
          color: string | null
          created_at: string
          name: string
          slug: string
          sort_order: number
        }
        Insert: {
          color?: string | null
          created_at?: string
          name: string
          slug: string
          sort_order?: number
        }
        Update: {
          color?: string | null
          created_at?: string
          name?: string
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      notifications: {
        Row: {
          actor_id: string | null
          created_at: string
          entity_id: string | null
          entity_type: string | null
          id: string
          is_read: boolean
          message: string
          read_at: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Insert: {
          actor_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          is_read?: boolean
          message: string
          read_at?: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Update: {
          actor_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          is_read?: boolean
          message?: string
          read_at?: string | null
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      playlist_tracks: {
        Row: {
          added_at: string
          playlist_id: string
          position: number
          track_id: string
        }
        Insert: {
          added_at?: string
          playlist_id: string
          position: number
          track_id: string
        }
        Update: {
          added_at?: string
          playlist_id?: string
          position?: number
          track_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "playlist_tracks_playlist_id_fkey"
            columns: ["playlist_id"]
            isOneToOne: false
            referencedRelation: "playlists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "playlist_tracks_playlist_id_fkey"
            columns: ["playlist_id"]
            isOneToOne: false
            referencedRelation: "playlists_with_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "playlist_tracks_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "tracks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "playlist_tracks_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "tracks_with_artist"
            referencedColumns: ["id"]
          },
        ]
      }
      playlists: {
        Row: {
          cover_path: string | null
          created_at: string
          description: string
          id: string
          is_public: boolean
          owner_id: string
          title: string
          updated_at: string
        }
        Insert: {
          cover_path?: string | null
          created_at?: string
          description?: string
          id?: string
          is_public?: boolean
          owner_id: string
          title: string
          updated_at?: string
        }
        Update: {
          cover_path?: string | null
          created_at?: string
          description?: string
          id?: string
          is_public?: boolean
          owner_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "playlists_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      plays: {
        Row: {
          id: number
          played_at: string
          track_id: string
          user_id: string
        }
        Insert: {
          id?: never
          played_at?: string
          track_id: string
          user_id: string
        }
        Update: {
          id?: never
          played_at?: string
          track_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "plays_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "tracks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plays_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "tracks_with_artist"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plays_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_path: string | null
          banner_path: string | null
          bio: string
          created_at: string
          display_name: string
          favorite_genres: string[]
          followers_count: number
          following_count: number
          handle: string
          id: string
          is_public: boolean
          last_login_at: string | null
          moods: string[]
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          avatar_path?: string | null
          banner_path?: string | null
          bio?: string
          created_at?: string
          display_name: string
          favorite_genres?: string[]
          followers_count?: number
          following_count?: number
          handle: string
          id: string
          is_public?: boolean
          last_login_at?: string | null
          moods?: string[]
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          avatar_path?: string | null
          banner_path?: string | null
          bio?: string
          created_at?: string
          display_name?: string
          favorite_genres?: string[]
          followers_count?: number
          following_count?: number
          handle?: string
          id?: string
          is_public?: boolean
          last_login_at?: string | null
          moods?: string[]
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: []
      }
      reports: {
        Row: {
          created_at: string
          description: string | null
          entity_id: string
          entity_type: string
          id: string
          reason: string
          reporter_id: string
          resolved_at: string | null
          resolved_by: string | null
          status: Database["public"]["Enums"]["report_status"]
        }
        Insert: {
          created_at?: string
          description?: string | null
          entity_id: string
          entity_type: string
          id?: string
          reason: string
          reporter_id: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: Database["public"]["Enums"]["report_status"]
        }
        Update: {
          created_at?: string
          description?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
          reason?: string
          reporter_id?: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: Database["public"]["Enums"]["report_status"]
        }
        Relationships: [
          {
            foreignKeyName: "reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      track_moods: {
        Row: {
          mood: string
          track_id: string
        }
        Insert: {
          mood: string
          track_id: string
        }
        Update: {
          mood?: string
          track_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "track_moods_mood_fkey"
            columns: ["mood"]
            isOneToOne: false
            referencedRelation: "moods"
            referencedColumns: ["name"]
          },
          {
            foreignKeyName: "track_moods_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "tracks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "track_moods_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "tracks_with_artist"
            referencedColumns: ["id"]
          },
        ]
      }
      tracks: {
        Row: {
          ai_generator: string | null
          album: string | null
          artist_id: string
          audio_format: string | null
          audio_path: string
          cover_path: string | null
          created_at: string
          description: string | null
          duration_seconds: number
          file_size_bytes: number | null
          genre: string
          id: string
          like_count: number
          play_count: number
          prompt: string | null
          published_at: string | null
          search_document: string | null
          status: Database["public"]["Enums"]["track_status"]
          tags: string[]
          title: string
          updated_at: string
        }
        Insert: {
          ai_generator?: string | null
          album?: string | null
          artist_id: string
          audio_format?: string | null
          audio_path: string
          cover_path?: string | null
          created_at?: string
          description?: string | null
          duration_seconds: number
          file_size_bytes?: number | null
          genre: string
          id?: string
          like_count?: number
          play_count?: number
          prompt?: string | null
          published_at?: string | null
          search_document?: string | null
          status?: Database["public"]["Enums"]["track_status"]
          tags?: string[]
          title: string
          updated_at?: string
        }
        Update: {
          ai_generator?: string | null
          album?: string | null
          artist_id?: string
          audio_format?: string | null
          audio_path?: string
          cover_path?: string | null
          created_at?: string
          description?: string | null
          duration_seconds?: number
          file_size_bytes?: number | null
          genre?: string
          id?: string
          like_count?: number
          play_count?: number
          prompt?: string | null
          published_at?: string | null
          search_document?: string | null
          status?: Database["public"]["Enums"]["track_status"]
          tags?: string[]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tracks_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tracks_genre_fkey"
            columns: ["genre"]
            isOneToOne: false
            referencedRelation: "genres"
            referencedColumns: ["name"]
          },
        ]
      }
    }
    Views: {
      playlists_with_details: {
        Row: {
          cover_path: string | null
          created_at: string | null
          description: string | null
          id: string | null
          is_public: boolean | null
          owner_handle: string | null
          owner_id: string | null
          title: string | null
          track_ids: string[] | null
          updated_at: string | null
        }
        Insert: {
          cover_path?: string | null
          created_at?: string | null
          description?: string | null
          id?: string | null
          is_public?: boolean | null
          owner_handle?: never
          owner_id?: string | null
          title?: string | null
          track_ids?: never
          updated_at?: string | null
        }
        Update: {
          cover_path?: string | null
          created_at?: string | null
          description?: string | null
          id?: string | null
          is_public?: boolean | null
          owner_handle?: never
          owner_id?: string | null
          title?: string | null
          track_ids?: never
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "playlists_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tracks_with_artist: {
        Row: {
          ai_generator: string | null
          album: string | null
          artist_handle: string | null
          artist_id: string | null
          audio_format: string | null
          audio_path: string | null
          cover_path: string | null
          created_at: string | null
          description: string | null
          duration_seconds: number | null
          file_size_bytes: number | null
          genre: string | null
          id: string | null
          like_count: number | null
          moods: string[] | null
          play_count: number | null
          prompt: string | null
          published_at: string | null
          status: Database["public"]["Enums"]["track_status"] | null
          tags: string[] | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          ai_generator?: string | null
          album?: string | null
          artist_handle?: never
          artist_id?: string | null
          audio_format?: string | null
          audio_path?: string | null
          cover_path?: string | null
          created_at?: string | null
          description?: string | null
          duration_seconds?: number | null
          file_size_bytes?: number | null
          genre?: string | null
          id?: string | null
          like_count?: number | null
          moods?: never
          play_count?: number | null
          prompt?: string | null
          published_at?: string | null
          status?: Database["public"]["Enums"]["track_status"] | null
          tags?: string[] | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          ai_generator?: string | null
          album?: string | null
          artist_handle?: never
          artist_id?: string | null
          audio_format?: string | null
          audio_path?: string | null
          cover_path?: string | null
          created_at?: string | null
          description?: string | null
          duration_seconds?: number | null
          file_size_bytes?: number | null
          genre?: string | null
          id?: string | null
          like_count?: number | null
          moods?: never
          play_count?: number | null
          prompt?: string | null
          published_at?: string | null
          status?: Database["public"]["Enums"]["track_status"] | null
          tags?: string[] | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tracks_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tracks_genre_fkey"
            columns: ["genre"]
            isOneToOne: false
            referencedRelation: "genres"
            referencedColumns: ["name"]
          },
        ]
      }
    }
    Functions: {
      add_track_to_playlist: {
        Args: { p_playlist_id: string; p_track_id: string }
        Returns: undefined
      }
      get_featured_genres: {
        Args: { p_limit?: number }
        Returns: {
          genre: string
          track_count: number
        }[]
      }
      get_popular_tags: {
        Args: { p_limit?: number }
        Returns: {
          tag: string
          track_count: number
        }[]
      }
      get_profile_stats: {
        Args: { p_user_id: string }
        Returns: {
          followers_count: number
          following_count: number
          total_plays: number
          tracks_count: number
        }[]
      }
      get_recently_played: {
        Args: { p_limit?: number }
        Returns: {
          last_played_at: string
          track_id: string
        }[]
      }
      get_recommended_tracks: {
        Args: { p_limit?: number }
        Returns: {
          ai_generator: string | null
          album: string | null
          artist_handle: string | null
          artist_id: string | null
          audio_format: string | null
          audio_path: string | null
          cover_path: string | null
          created_at: string | null
          description: string | null
          duration_seconds: number | null
          file_size_bytes: number | null
          genre: string | null
          id: string | null
          like_count: number | null
          moods: string[] | null
          play_count: number | null
          prompt: string | null
          published_at: string | null
          status: Database["public"]["Enums"]["track_status"] | null
          tags: string[] | null
          title: string | null
          updated_at: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "tracks_with_artist"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_weekly_highlights: {
        Args: { p_limit?: number }
        Returns: {
          ai_generator: string | null
          album: string | null
          artist_handle: string | null
          artist_id: string | null
          audio_format: string | null
          audio_path: string | null
          cover_path: string | null
          created_at: string | null
          description: string | null
          duration_seconds: number | null
          file_size_bytes: number | null
          genre: string | null
          id: string | null
          like_count: number | null
          moods: string[] | null
          play_count: number | null
          prompt: string | null
          published_at: string | null
          status: Database["public"]["Enums"]["track_status"] | null
          tags: string[] | null
          title: string | null
          updated_at: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "tracks_with_artist"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      remove_track_from_playlist: {
        Args: { p_playlist_id: string; p_track_id: string }
        Returns: undefined
      }
      reorder_playlist_tracks: {
        Args: { p_playlist_id: string; p_track_ids: string[] }
        Returns: undefined
      }
      search_tracks: {
        Args: {
          p_genres?: string[]
          p_limit?: number
          p_moods?: string[]
          p_offset?: number
          p_query?: string
          p_sort?: string
        }
        Returns: {
          ai_generator: string
          album: string
          artist_handle: string
          artist_id: string
          audio_format: string
          audio_path: string
          cover_path: string
          created_at: string
          description: string
          duration_seconds: number
          file_size_bytes: number
          genre: string
          id: string
          like_count: number
          moods: string[]
          play_count: number
          prompt: string
          published_at: string
          status: Database["public"]["Enums"]["track_status"]
          tags: string[]
          title: string
          total_count: number
          updated_at: string
        }[]
      }
    }
    Enums: {
      notification_type:
        | "like"
        | "comment"
        | "follow"
        | "playlist_add"
        | "new_track"
        | "system"
      report_status: "pending" | "reviewed" | "resolved" | "dismissed"
      track_status:
        | "draft"
        | "processing"
        | "published"
        | "archived"
        | "rejected"
      user_role: "user" | "creator" | "admin" | "moderator"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      notification_type: [
        "like",
        "comment",
        "follow",
        "playlist_add",
        "new_track",
        "system",
      ],
      report_status: ["pending", "reviewed", "resolved", "dismissed"],
      track_status: [
        "draft",
        "processing",
        "published",
        "archived",
        "rejected",
      ],
      user_role: ["user", "creator", "admin", "moderator"],
    },
  },
} as const
