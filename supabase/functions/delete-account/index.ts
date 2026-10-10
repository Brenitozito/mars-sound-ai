import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2';

const USER_STORAGE_BUCKETS = ['audio-tracks', 'track-covers', 'user-avatars', 'playlist-covers'] as const;
const STORAGE_BATCH_SIZE = 100;
const DEFAULT_ALLOWED_ORIGIN = 'http://localhost:5173';
const CORS_ALLOWED_HEADERS = 'authorization, x-client-info, apikey, content-type';
const LOG_PREFIX = '[delete-account]';

const MESSAGES = {
  invalidSession: 'Sessão inválida. Entre novamente.',
  methodNotAllowed: 'Método não permitido.',
  originNotAllowed: 'Origem não permitida.',
  storageFailure: 'Não foi possível remover seus arquivos. Tente novamente.',
  deletionFailure: 'Não foi possível excluir sua conta. Tente novamente.',
  unexpected: 'Ocorreu um erro inesperado. Tente novamente mais tarde.',
} as const;

const SERVER_AUTH_OPTIONS = {
  autoRefreshToken: false,
  persistSession: false,
  detectSessionInUrl: false,
} as const;

type BucketName = (typeof USER_STORAGE_BUCKETS)[number];

interface AuthenticatedUser {
  userId: string;
  accessToken: string;
}

class HttpError extends Error {
  constructor(readonly status: number, publicMessage: string, options?: ErrorOptions) {
    super(publicMessage, options);
  }
}

function readSupabaseUrl(): string {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  if (!supabaseUrl) throw new Error('Variável SUPABASE_URL ausente.');
  return supabaseUrl;
}

function readDefaultKeyFromDictionary(variableName: string): string | null {
  const rawDictionary = Deno.env.get(variableName);
  if (!rawDictionary) return null;

  try {
    const defaultKey = JSON.parse(rawDictionary)?.default;
    return typeof defaultKey === 'string' && defaultKey.length > 0 ? defaultKey : null;
  } catch {
    console.error(`${LOG_PREFIX} ${variableName} não contém um JSON válido.`);
    return null;
  }
}

// Prefere as chaves novas (publishable/secret) e recorre às legadas enquanto estiverem ativas.
function readApiKey(dictionaryVariable: string, legacyVariable: string): string {
  const apiKey = readDefaultKeyFromDictionary(dictionaryVariable) ?? Deno.env.get(legacyVariable);
  if (!apiKey) throw new Error(`Variáveis ${dictionaryVariable} e ${legacyVariable} ausentes.`);
  return apiKey;
}

function readAllowedOrigins(): Set<string> {
  const configuredOrigins = (Deno.env.get('ALLOWED_ORIGINS') ?? '')
    .split(',')
    .map((origin) => origin.trim().replace(/\/+$/, ''))
    .filter(Boolean);

  return new Set(configuredOrigins.length > 0 ? configuredOrigins : [DEFAULT_ALLOWED_ORIGIN]);
}

function buildCorsHeaders(allowedOrigin: string | null): Headers {
  const headers = new Headers({ Vary: 'Origin' });
  if (allowedOrigin) {
    headers.set('Access-Control-Allow-Origin', allowedOrigin);
    headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    headers.set('Access-Control-Allow-Headers', CORS_ALLOWED_HEADERS);
    headers.set('Access-Control-Max-Age', '86400');
  }
  return headers;
}

function jsonResponse(
  body: Record<string, unknown>,
  status: number,
  corsHeaders: Headers,
  extraHeaders: Record<string, string> = {},
): Response {
  const headers = new Headers(corsHeaders);
  headers.set('Content-Type', 'application/json; charset=utf-8');
  for (const [name, value] of Object.entries(extraHeaders)) headers.set(name, value);
  return new Response(JSON.stringify(body), { status, headers });
}

function errorResponse(error: unknown, corsHeaders: Headers): Response {
  if (error instanceof HttpError) {
    if (error.status >= 500) console.error(LOG_PREFIX, error.message, error.cause);
    return jsonResponse({ error: error.message }, error.status, corsHeaders);
  }

  console.error(LOG_PREFIX, 'Erro inesperado.', error);
  return jsonResponse({ error: MESSAGES.unexpected }, 500, corsHeaders);
}

function extractBearerToken(request: Request): string | null {
  const match = request.headers.get('Authorization')?.match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : null;
}

async function authenticateUser(request: Request, supabaseUrl: string): Promise<AuthenticatedUser> {
  const accessToken = extractBearerToken(request);
  if (!accessToken) throw new HttpError(401, MESSAGES.invalidSession);

  const userClient = createClient(supabaseUrl, readApiKey('SUPABASE_PUBLISHABLE_KEYS', 'SUPABASE_ANON_KEY'), {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: SERVER_AUTH_OPTIONS,
  });

  const { data, error } = await userClient.auth.getUser(accessToken);
  if (error && (error.status ?? 0) >= 500) {
    throw new Error('Falha ao validar a sessão no Supabase Auth.', { cause: error });
  }
  if (error || !data.user) throw new HttpError(401, MESSAGES.invalidSession);

  return { userId: data.user.id, accessToken };
}

function storageFailure(operation: string, cause: unknown): HttpError {
  return new HttpError(500, MESSAGES.storageFailure, { cause: { operation, cause } });
}

async function collectObjectPaths(
  adminClient: SupabaseClient,
  bucket: BucketName,
  folder: string,
): Promise<string[]> {
  const objectPaths: string[] = [];

  for (let offset = 0; ; offset += STORAGE_BATCH_SIZE) {
    const { data: entries, error } = await adminClient.storage.from(bucket).list(folder, {
      limit: STORAGE_BATCH_SIZE,
      offset,
      sortBy: { column: 'name', order: 'asc' },
    });
    if (error) throw storageFailure(`listar ${bucket}/${folder}`, error);

    for (const entry of entries) {
      const entryPath = `${folder}/${entry.name}`;
      const isFolder = !entry.id;
      if (isFolder) {
        objectPaths.push(...(await collectObjectPaths(adminClient, bucket, entryPath)));
      } else {
        objectPaths.push(entryPath);
      }
    }

    if (entries.length < STORAGE_BATCH_SIZE) return objectPaths;
  }
}

async function removeObjectsInBatches(
  adminClient: SupabaseClient,
  bucket: BucketName,
  objectPaths: string[],
): Promise<void> {
  for (let start = 0; start < objectPaths.length; start += STORAGE_BATCH_SIZE) {
    const batch = objectPaths.slice(start, start + STORAGE_BATCH_SIZE);
    const { error } = await adminClient.storage.from(bucket).remove(batch);
    if (error) throw storageFailure(`remover ${batch.length} objetos de ${bucket}`, error);
  }
}

async function purgeUserStorage(adminClient: SupabaseClient, userId: string): Promise<void> {
  await Promise.all(
    USER_STORAGE_BUCKETS.map(async (bucket) => {
      const objectPaths = await collectObjectPaths(adminClient, bucket, userId);
      await removeObjectsInBatches(adminClient, bucket, objectPaths);
    }),
  );
}

async function revokeAllSessions(adminClient: SupabaseClient, user: AuthenticatedUser): Promise<void> {
  const { error } = await adminClient.auth.admin.signOut(user.accessToken, 'global');
  // deleteUser também remove sessões e refresh tokens; a falha aqui não deve bloquear a exclusão.
  if (error) {
    console.warn(`${LOG_PREFIX} Falha ao encerrar sessões antes da exclusão.`, {
      userId: user.userId,
      status: error.status,
    });
  }
}

async function deleteAuthUser(adminClient: SupabaseClient, userId: string): Promise<void> {
  const { error } = await adminClient.auth.admin.deleteUser(userId);
  if (error) throw new HttpError(500, MESSAGES.deletionFailure, { cause: error });
}

async function deleteAccount(request: Request): Promise<void> {
  const supabaseUrl = readSupabaseUrl();
  const user = await authenticateUser(request, supabaseUrl);

  const adminClient = createClient(supabaseUrl, readApiKey('SUPABASE_SECRET_KEYS', 'SUPABASE_SERVICE_ROLE_KEY'), {
    auth: SERVER_AUTH_OPTIONS,
  });

  await purgeUserStorage(adminClient, user.userId);
  await revokeAllSessions(adminClient, user);
  await deleteAuthUser(adminClient, user.userId);
}

Deno.serve(async (request: Request): Promise<Response> => {
  const requestOrigin = request.headers.get('Origin');
  const isOriginAllowed = requestOrigin === null || readAllowedOrigins().has(requestOrigin);
  const corsHeaders = buildCorsHeaders(isOriginAllowed ? requestOrigin : null);

  if (!isOriginAllowed) {
    return jsonResponse({ error: MESSAGES.originNotAllowed }, 403, corsHeaders);
  }
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }
  if (request.method !== 'POST') {
    return jsonResponse({ error: MESSAGES.methodNotAllowed }, 405, corsHeaders, { Allow: 'POST, OPTIONS' });
  }

  try {
    await deleteAccount(request);
    return jsonResponse({ success: true }, 200, corsHeaders);
  } catch (error) {
    return errorResponse(error, corsHeaders);
  }
});
