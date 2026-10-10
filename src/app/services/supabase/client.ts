import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

const REQUIRED_ENV_NAMES = ["VITE_SUPABASE_URL", "VITE_SUPABASE_ANON_KEY"] as const;

type RequiredEnvName = (typeof REQUIRED_ENV_NAMES)[number];

export interface SupabaseConfig {
  url: string;
  publishableKey: string;
  siteUrl: string;
}

function readEnv(name: RequiredEnvName): string | undefined {
  return import.meta.env[name]?.trim() || undefined;
}

function readRequiredEnv(name: RequiredEnvName): string {
  const value = readEnv(name);
  if (!value) {
    throw new Error(`${name} não está definida. Configure-a no arquivo .env.`);
  }
  return value;
}

/** Usado no boot para mostrar uma tela de configuração em vez de quebrar dentro dos providers. */
export function findMissingSupabaseEnv(): RequiredEnvName[] {
  return REQUIRED_ENV_NAMES.filter((name) => !readEnv(name));
}

function resolveSiteUrl(): string {
  const configuredSiteUrl = import.meta.env.VITE_SITE_URL?.trim();
  return (configuredSiteUrl || window.location.origin).replace(/\/+$/, "");
}

let cachedConfig: SupabaseConfig | null = null;
let cachedClient: SupabaseClient<Database> | null = null;

export function getSupabaseConfig(): SupabaseConfig {
  cachedConfig ??= {
    url: readRequiredEnv("VITE_SUPABASE_URL"),
    publishableKey: readRequiredEnv("VITE_SUPABASE_ANON_KEY"),
    siteUrl: resolveSiteUrl(),
  };
  return cachedConfig;
}

/**
 * Criado sob demanda: a primeira chamada acontece no AuthProvider, a tempo de o
 * `detectSessionInUrl` processar retornos de OAuth e links de e-mail.
 */
export function getSupabase(): SupabaseClient<Database> {
  if (cachedClient) return cachedClient;
  const { url, publishableKey } = getSupabaseConfig();
  cachedClient = createClient<Database>(url, publishableKey, {
    auth: {
      flowType: "pkce",
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
  return cachedClient;
}
