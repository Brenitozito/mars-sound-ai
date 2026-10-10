# Mars Sound AI — Documentação do Sistema

Plataforma de streaming de músicas criadas com inteligência artificial: o usuário descobre, ouve, favorita, organiza em playlists, publica as próprias faixas e segue criadores.

Este documento descreve o **front-end como ele existe no código** e o **contrato de integração com o Supabase**. Para componentes visuais e tokens, veja [`COMPONENTS_LIBRARY.md`](./COMPONENTS_LIBRARY.md); para o schema real do Supabase (tabelas, RLS, Storage, RPCs e migrations), veja [`DATABASE_SCHEMA.md`](./DATABASE_SCHEMA.md).

## Índice

1. [Visão do produto](#1-visão-do-produto)
2. [Stack e scripts](#2-stack-e-scripts)
3. [Arquitetura](#3-arquitetura)
4. [Rotas e estado na URL](#4-rotas-e-estado-na-url)
5. [Contextos globais](#5-contextos-globais)
6. [Modelo de domínio](#6-modelo-de-domínio)
7. [Contratos de serviço](#7-contratos-de-serviço)
8. [Estados de interface e feedback](#8-estados-de-interface-e-feedback)
9. [Funcionalidades por página](#9-funcionalidades-por-página)
10. [Regras de produto e decisões](#10-regras-de-produto-e-decisões)
11. [Acessibilidade, responsividade e SEO](#11-acessibilidade-responsividade-e-seo)
12. [Integração com Supabase](#12-integração-com-supabase)
13. [Roadmap](#13-roadmap)

---

## 1. Visão do produto

**Problema:** criadores de música com IA não têm uma plataforma dedicada, com experiência de escuta comparável a Spotify ou Apple Music.

**Solução:** streaming focado em música gerada por IA, com descoberta por gênero e mood, recomendações personalizadas e perfil de criador.

**Público:** criadores de conteúdo digital, músicos experimentais e produtores, entusiastas de IA e quem precisa de trilhas para vídeo e podcast.

**Funcionalidades do MVP (todas conectadas ao Supabase; não existe modo offline nem dado fictício no front):**

| Área | O que o usuário faz |
|---|---|
| Autenticação | Cadastro e login por e-mail/senha ou Google, recuperação de senha, logout com confirmação |
| Player | Tocar, pausar, avançar, voltar, aleatório, repetir, volume e mudo (persistidos), barra de progresso, mini player e tela cheia no mobile com gesto de arrastar para fechar |
| Descoberta | Busca por texto, filtros de gêneros e moods múltiplos, ordenação por popularidade ou data, categorias, recomendações |
| Biblioteca | Favoritos com ordenação e "Tocar todas", playlists com capa, reordenação, busca para adicionar faixas e playlists públicas somente leitura |
| Publicação | Upload de áudio (MP3/WAV) com pré-escuta, capa, título, gênero, até 3 moods, álbum, descrição, tags, gerador de IA e prompt |
| Perfil | Perfil próprio e público com estatísticas (músicas, plays, seguidores, seguindo), abas Músicas/Playlists, seguir e deixar de seguir |
| Configurações | Perfil (avatar, nome, @handle, bio, visibilidade, preferências musicais) e Conta (e-mail, senha, sair, excluir conta) |

---

## 2. Stack e scripts

- **React 18 + TypeScript (strict)**, build com **Vite 6**
- **Tailwind CSS v4** (com variantes `pointer-fine`/`pointer-coarse` para mouse vs. toque)
- **React Router 7** (data router, páginas com lazy loading)
- **motion** para animações, **Radix UI/shadcn** para primitivas acessíveis, **sonner** para toasts, **lucide-react** para ícones

| Script | Uso |
|---|---|
| `npm run dev` | Servidor de desenvolvimento em `http://localhost:5173` |
| `npm run typecheck` | `tsc --noEmit` (deve passar antes de qualquer push) |
| `npm run build` | Build de produção em `dist/` (gera `robots.txt` e, se configurado, `sitemap.xml`) |
| `npm run preview` | Serve o build localmente |

### Variáveis de ambiente

Todas as variáveis ficam num único `.env` na raiz do app, ignorado pelo git e usado tanto no `npm run dev` quanto no `npm run build`. Em produção (Vercel), as mesmas variáveis são cadastradas no painel do projeto.

| Variável | Obrigatória | Descrição |
|---|---|---|
| `VITE_SUPABASE_URL` | Sim | URL do projeto Supabase |
| `VITE_SUPABASE_ANON_KEY` | Sim | Chave pública (anon/publishable). A segurança vem do RLS |
| `VITE_SITE_URL` | Não | URL pública do site; habilita o `sitemap.xml` e serve de `redirectTo` para OAuth e recuperação de senha |

Sem uma das variáveis obrigatórias, `main.tsx` não monta o app: renderiza `ConfigurationErrorScreen` ("Configuração ausente") com o nome das variáveis que faltam (`findMissingSupabaseEnv()` em `services/supabase/client.ts`). `VITE_BACKEND_MODE` deixou de existir; se ainda estiver cadastrada na Vercel, pode ser apagada.

> A chave `service_role` **nunca** vai para o front-end nem para variáveis `VITE_*`. Operações administrativas (ex.: excluir conta) rodam em Edge Functions.

---

## 3. Arquitetura

```
src/
├── main.tsx                   # bootstrap: App ou tela "Configuração ausente"
└── app/
    ├── App.tsx                # providers globais (Auth, Tooltip) + RouterProvider
    ├── routes/                # router, guards, paths e filtros de URL
    ├── pages/                 # uma página por rota (lazy)
    ├── components/            # UI organizada por domínio (ver COMPONENTS_LIBRARY.md)
    ├── context/               # Auth, Library, Player (+ preferências do player)
    ├── hooks/                 # lógica reutilizável de UI (dados assíncronos, opções do catálogo, busca, mídia)
    ├── config/uploadLimits.ts # limites técnicos de upload (tamanho e formatos)
    ├── services/
    │   ├── contracts.ts       # interfaces consumidas pela UI
    │   ├── index.ts           # composition root: exporta a implementação Supabase
    │   ├── serviceError.ts    # ServiceError + getErrorMessage
    │   └── supabase/          # cliente, serviços, mapeadores, Storage e tipos gerados
    ├── types/domain.ts        # modelo de domínio compartilhado
    └── utils/                 # formatação, validação, arquivos, imagens, placeholders
vite/seoFiles.ts               # plugin que gera robots.txt e sitemap.xml
supabase/
├── migrations/                # SQL aplicado no projeto, em ordem (ver DATABASE_SCHEMA.md)
├── functions/delete-account/  # Edge Function de exclusão de conta
└── tests/rls_smoke_test.sql   # testes de RLS/Storage em transação revertida
```

### Camadas e regras de dependência

```
pages / components  ──►  hooks / context  ──►  services (contratos)  ──►  services/supabase
```

- Componentes e contextos importam serviços **somente** de `services/index.ts`. Nenhum componente conhece o cliente Supabase.
- Toda falha esperada é lançada como `ServiceError` com um `code` (`invalid_credentials`, `unauthenticated`, `not_found`, `conflict`, `validation`, `unknown`) e uma mensagem pronta para o usuário. A UI usa `getErrorMessage(error, fallback)` (regras na [seção 8](#8-estados-de-interface-e-feedback)).
- A UI nunca gera URLs definitivas de mídia. Ela envia a intenção (`MediaChange`) e o serviço decide onde guardar.
- Validações de formulário ficam em `utils/validation.ts` (UI) e são repetidas no banco (`CHECK`/RLS). A validação de UI é conveniência; a do backend é a garantia.
- **Nenhum dado de conteúdo é fixo no front.** Gêneros, moods, geradores de IA e tags populares vêm do banco (`catalogService.getCatalogOptions()`, com cache em `useCatalogOptions`). Só ficam no código os limites técnicos de upload (`config/uploadLimits.ts`), espelhados nos buckets.

### Composition root

`services/index.ts` exporta `authService`, `userService`, `catalogService` e `libraryService` da implementação Supabase. Os contratos continuam isolando a UI do SDK: para testes, basta fornecer outra implementação de `AppServices`.

---

## 4. Rotas e estado na URL

Todas as rotas, exceto `/entrar`, exigem sessão (`RequireAuthentication`). `/entrar` exige **não** estar logado (`RequireGuest`). Páginas são carregadas sob demanda.

| Rota | Página | Estado na URL |
|---|---|---|
| `/entrar` | `AuthPage` | — (login, cadastro e recuperação são visões internas) |
| `/` | `HomePage` | — |
| `/descobrir` | `DiscoverPage` | `q` (texto), `generos` e `moods` (separados por vírgula), `ordem` (`populares` \| `recentes`) |
| `/playlists` | `PlaylistsPage` | — |
| `/playlists/:playlistId` | `PlaylistDetailPage` | — |
| `/favoritos` | `FavoritesPage` | `ordem` (`recentes` \| `titulo` \| `artista`) |
| `/perfil` | `MyProfilePage` | `aba` (`musicas` \| `playlists`) |
| `/u/:handle` | `PublicProfilePage` | `aba` (`musicas` \| `playlists`) |
| `/configuracoes` | `SettingsPage` | `aba` (`perfil` \| `conta`) |
| `/carregar-musica` | `UploadMusicPage` | — |
| `*` | `NotFoundPage` | — |

Funções de apoio: `ROUTES`, `ROUTE_PATTERNS`, `buildPlaylistPath`, `buildProfilePath` (`routes/paths.ts`) e `parseDiscoverFilters`, `buildDiscoverPath`, `hasActiveDiscoverFilters` (`routes/discoverFilters.ts`). Filtros na URL tornam o estado compartilhável e preservado no botão voltar; a busca da Navbar mantém os filtros ativos quando o usuário já está em Descobrir.

---

## 5. Contextos globais

Ordem dos providers: `AuthProvider` (em `App.tsx`) → nas rotas autenticadas, `AppShell` monta `LibraryProvider` → `PlaylistCreationProvider` → `PlayerProvider` (este último recebe `onTrackStarted` ligado ao `recordPlay` da biblioteca).

### `AuthContext`
- Estado: `status` (`loading` \| `authenticated` \| `unauthenticated`) e `currentUser: AuthUser | null`.
- Ações: `signIn`, `signUp`, `signInWithGoogle`, `signOut`, `requestPasswordReset`, `completePasswordReset`, `updateProfile`, `refreshCurrentUser`, `updateEmail`, `changePassword`, `deleteAccount`.
- `useCurrentUser()` só pode ser usado dentro de rotas autenticadas (lança erro caso contrário).

### `LibraryContext`
- Estado do usuário logado: `favoriteTrackIds`, `recentlyPlayedTrackIds` (até 20) e `playlists`, além de `isLoading`, `loadErrorMessage` e `reloadLibrary`.
- Ações otimistas com rollback em caso de erro: `toggleFavorite`, `reorderPlaylistTracks`. As demais (`createPlaylist`, `updatePlaylist`, `deletePlaylist`, `addTrackToPlaylist`, `removeTrackFromPlaylist`) atualizam o estado com a resposta do serviço.
- `recordPlay` é chamado pelo player quando o áudio **realmente começa a tocar** (incrementa plays e "tocadas recentemente").

### `PlayerContext`
- Um único `HTMLAudioElement` para o app inteiro, fila (`queue`), aleatório, repetir (`off` → `all` → `one`), volume, mudo e tela cheia.
- `playbackStatus`: `idle` → `loading` (pedido de play ou buffering) → `playing` / `paused`, ou `error` (falha ao carregar o arquivo). `isPlaying` é derivado (`playing` ou `loading`). `useTrackPlaybackStatus(trackId)` dá o status de uma faixa específica para cards e linhas.
- O play só é registrado no primeiro evento `playing` de cada carregamento: faixa que falha ou é trocada antes de tocar não conta.
- Em erro, um toast oferece "Tentar de novo" e os players mostram "Não foi possível reproduzir"; `retryCurrentTrack()` e o botão principal recarregam a faixa. Bloqueio de autoplay do navegador (`NotAllowedError`) vira `paused`, não erro.
- Progresso (`usePlaybackProgress`) fica em contexto separado porque muda várias vezes por segundo e só os players precisam dele.
- Volume e mudo são persistidos em `localStorage` (`mars-sound-ai:player-preferences`) via `context/playerPreferences.ts`, com validação na leitura e falha silenciosa na escrita (modo privado).
- Integra a Media Session API (controles do sistema operacional).
- `pausePlayback()` é usado pela pré-escuta do upload para não tocar dois áudios ao mesmo tempo.

### `PlaylistCreationProvider`
- Expõe `usePlaylistCreation().openPlaylistCreation({ trackToAdd? })`. Um **único** diálogo de criação para o app inteiro, aberto a partir de botões ou do menu de faixa ("Nova playlist" já adiciona a faixa). Ao criar, mostra um toast com a ação "Abrir".

---

## 6. Modelo de domínio

Definido em `src/app/types/domain.ts`. Datas são ISO 8601 em string.

```ts
interface Track {
  id: string; title: string;
  artistId: string; artistHandle: string;
  coverUrl: string; audioUrl: string; durationSeconds: number;
  genre: string; moods: string[];          // até 3 moods
  album?: string; description?: string;
  tags: string[];                           // até 10 tags
  aiGenerator?: string; prompt?: string;
  playCount: number; createdAt: string;
}

interface UserProfile {
  id: string; displayName: string; handle: string;
  avatarUrl: string | null; bannerUrl: string | null; bio: string;
  followersCount: number; followingCount: number;
  isPublic: boolean; favoriteGenres: string[]; moods: string[];
}
interface AuthUser extends UserProfile { email: string }

interface ProfileStats { tracksCount: number; totalPlays: number; followersCount: number; followingCount: number }

interface Playlist {
  id: string; ownerId: string; ownerHandle: string;
  title: string; description: string; coverUrl: string | null; isPublic: boolean;
  trackIds: string[];                       // a ordem do array é a ordem da playlist
  createdAt: string; updatedAt: string;
}

interface HomeFeed {
  topCreators: UserProfile[]; trending: Track[]; recentReleases: Track[];
  weeklyHighlights: Track[]; featuredGenres: string[];
}

type TrackSort = "popular" | "recent";
type MediaChange = { kind: "keep" } | { kind: "remove" } | { kind: "replace"; file: Blob };
```

Entradas de escrita: `ProfileUpdate` (campos parciais + `avatar`/`banner: MediaChange`), `PlaylistInput` (`title`, `description`, `isPublic`, `cover: MediaChange`) e `TrackUploadInput` (metadados + `audioFile: File` + `coverFile: File | null`).

Campos **derivados** (`artistHandle`, `ownerHandle`, `playCount`, URLs de mídia) são resolvidos pelo serviço na leitura; nunca são enviados pela UI.

---

## 7. Contratos de serviço

Definidos em `src/app/services/contracts.ts` e exportados por `services/index.ts`.

| Serviço | Métodos |
|---|---|
| `AuthService` | `getCurrentUser`, `signIn`, `signUp` → `SignUpResult` (`signed_in` ou `confirmation_pending`), `signInWithGoogle` → `AuthUser \| null` (`null` quando redireciona), `signOut`, `requestPasswordReset`, `completePasswordReset(newPassword)` (exige a sessão de recuperação), `changePassword({currentPassword, newPassword})`, `updateEmail` → `{ user, isConfirmationPending }`, `deleteAccount`, `subscribeToAuthChanges(listener)` → função de cancelamento |
| `UserService` | `getProfileByHandle`, `getProfileStats(userId)`, `updateProfile(userId, update)`, `isFollowing`, `setFollowing(followerId, targetId, shouldFollow)` |
| `CatalogService` | `getCatalogOptions` → `{ genres, moods, aiGenerators, popularTags }`, `getHomeFeed`, `getRecommendedTracks(userId, limit?)`, `searchTracks({query, genres, moods, sort, offset, limit})` → `{items, total}`, `getTracksByIds(ids)`, `getTracksByArtist(artistId)`, `publishTrack(artist, input, onProgress?)` |
| `LibraryService` | `getFavoriteTrackIds`, `setFavorite`, `getRecentlyPlayedTrackIds`, `recordPlay`, `getPlaylists(userId)`, `getPublicPlaylists(ownerId)`, `getPlaylistById(viewerId, playlistId)`, `createPlaylist`, `updatePlaylist`, `deletePlaylist`, `addTrackToPlaylist`, `removeTrackFromPlaylist`, `reorderPlaylistTracks(userId, playlistId, orderedTrackIds)` |

Regras que qualquer implementação deve respeitar:

- `getTracksByIds` devolve as faixas **na ordem dos ids recebidos**, ignorando ids inexistentes.
- `getPlaylistById` devolve `not_found` para playlist privada de outro usuário (não revela que ela existe).
- `reorderPlaylistTracks` exige exatamente o mesmo conjunto de faixas; caso contrário, `conflict`.
- `getRecommendedTracks` exclui as faixas do próprio usuário e completa com as mais populares quando faltam preferências.
- `publishTrack` reporta progresso de 0 a 100 e, em caso de falha, remove os arquivos já enviados.
- `changePassword` valida a senha atual (mensagem "A senha atual está incorreta.").

---

## 8. Estados de interface e feedback

Toda tela que depende do banco tem os quatro estados: carregando, conteúdo, vazio e erro com "Tentar novamente" (`components/feedback/StatusViews.tsx`).

- **Dados assíncronos:** `useAsyncData(load, deps, fallbackErrorMessage?)` devolve `data`, `isLoading`, `errorMessage`, `errorCode` e `reload`. O `errorCode` separa "não existe" (`not_found` → página "não encontrada") de falhas recuperáveis (rede, servidor → `ErrorState` com retry). Playlist compartilhada e perfil público usam essa distinção.
- **Mensagens de erro:** `getErrorMessage(error, fallback)` mantém mensagens específicas do serviço (sessão expirada, sem conexão, conflito) e troca o genérico "Algo deu errado" pelo texto contextual da tela ("Não foi possível carregar as músicas.", "...as playlists.", "...o perfil.").
- **Vazios padronizados:** feed sem faixas ("Nenhuma música publicada ainda", com CTA para publicar), busca sem resultado ("Nenhuma música encontrada"), playlist ("Essa playlist está vazia"), biblioteca ("Sua biblioteca está vazia"), favoritos e tocadas recentemente.
- **Biblioteca com falha:** Favoritos e Playlists mostram o erro de carregamento da biblioteca com retry, em vez de um falso estado vazio.
- **Imagens:** `ui/CoverImage` troca qualquer URL ausente ou que falhe ao carregar pela capa padrão (ou pelo banner padrão, via `fallbackSrc`); `UserAvatar` cai para as iniciais.
- **Play:** botões refletem `playbackStatus` com spinner (carregando), pausa, play ou "tentar de novo" (`PlaybackStatusGlyph`, `TrackPlaybackIndicator`); rótulos acessíveis vêm de `getPlaybackActionLabel` e `getTrackPlayActionLabel`.
- **Tooltips:** `ui/IconTooltip` (Radix, um único `TooltipProvider` em `App.tsx`, atraso de 400 ms) em botões só com ícone: controles do player, favoritar e o menu da faixa ("Adicionar à playlist e mais opções"). Complementam o `aria-label`; em toque não abrem.
- **Confirmações:** favoritar pelo menu e adicionar à playlist confirmam com toast; o coração anima ao alternar.

---

## 9. Funcionalidades por página

### Autenticação (`/entrar`)
Login, cadastro, "esqueci minha senha" (solicitação, confirmação e definição de nova senha) e Google. Validação por campo, mensagens de erro do serviço e transições animadas entre as visões.

### Início (`/`)
Saudação por horário, **Recomendados para você** (com dica para ajustar preferências quando o usuário ainda não tem nenhuma), **Top criadores**, **Em alta** (ordenado por plays), **Lançamentos recentes**, **Categorias** (grade de gêneros) e **Destaques da semana**. "Ver tudo" leva ao Descobrir com a ordenação correspondente. Seções sem faixas não aparecem; sem nenhuma faixa publicada, a página mostra "Nenhuma música publicada ainda" com o botão "Publicar música".

### Descobrir (`/descobrir`)
Busca por texto (título, álbum, gênero, tags e @artista), filtros de gêneros e moods (lidos do banco) com seleção múltipla, ordenação Populares/Recentes, "Limpar filtros", paginação por "Carregar mais" e estados de carregamento, vazio e erro com "Tentar novamente". Valores de filtro na URL que não existem no banco são removidos automaticamente.

### Playlists (`/playlists` e `/playlists/:id`)
- Lista com botão "Nova playlist".
- Na própria playlist: editar (título, descrição, capa, pública/privada), excluir com confirmação, "Adicionar músicas" (diálogo com busca), remover faixa e mover para cima/baixo, "Tocar tudo" e compartilhar.
- Playlist de outro usuário: somente leitura, com link para o perfil do dono. Privada de outro usuário aparece como "não encontrada".

### Favoritos (`/favoritos`)
Lista com ordenação (recentes, título, artista — com ordenação alfabética pt-BR) e "Tocar todas".

### Perfil (`/perfil` e `/u/:handle`)
Banner, avatar, nome, @handle, bio e estatísticas (músicas, plays, seguidores, seguindo). Abas **Músicas** e **Playlists** (no perfil público, apenas playlists públicas). No próprio perfil, o banner pode ser trocado ou removido. Ambos podem ser compartilhados. No público: seguir/deixar de seguir. Perfil privado ou inexistente mostra "Perfil não encontrado", sem revelar qual dos dois casos ocorreu.

### Configurações (`/configuracoes`)
- **Perfil:** avatar (redimensionado e comprimido no navegador), nome, @handle, bio, perfil público e preferências musicais (gêneros e moods usados nas recomendações).
- **Conta:** alterar e-mail, alterar senha (exige a atual), sair da conta (com confirmação) e excluir conta (com confirmação destrutiva).

### Carregar música (`/carregar-musica`)
Arrastar ou escolher o áudio (MP3/WAV até 50 MB) com **pré-escuta** antes de publicar, capa opcional (PNG/JPEG até 2 MB), título, gênero, até 3 moods, álbum, descrição, tags (até 10), gerador de IA, prompt e aceite dos termos. Gêneros, moods, sugestões de gerador e tags populares vêm do banco; enquanto carregam, o formulário mostra "Preparando o formulário..." e, em falha, erro com retry. Barra de progresso durante o envio; ao concluir, leva ao perfil.

### Player
- **Desktop (≥ 1024 px):** barra fixa no rodapé com faixa atual, favoritar, menu, controles, progresso e volume.
- **Mobile/tablet:** mini player acima da navegação inferior; ao tocar, abre a tela cheia. A tela cheia fecha pelo botão, pela tecla Esc ou **arrastando para baixo** a partir do cabeçalho/capa (limiar de 120 px ou gesto rápido; desativado com `prefers-reduced-motion`).
- **Menu da faixa** (em todo lugar): favoritar, adicionar a playlist (incluindo "Nova playlist"), ver perfil do artista e, dentro da própria playlist, mover para cima/baixo e remover.

---

## 10. Regras de produto e decisões

Quando a documentação antiga e o código divergiam, prevaleceu a regra **mais segura** e esta documentação foi atualizada:

| Tema | Regra vigente |
|---|---|
| Senha | Mínimo de 8 caracteres, com letras e números |
| Áudio | MP3 ou WAV, até 50 MB |
| Imagens | PNG ou JPEG até 2 MB; o navegador redimensiona (avatar 512 px, capa 800 px, banner 1600 px) e converte para JPEG |
| Artista da faixa | Sempre o usuário logado (não existe campo livre de artista) |
| Moods e tags | Até 3 moods e 10 tags por faixa |
| Logout | Sempre com confirmação |
| Ações destrutivas | Excluir playlist e excluir conta exigem confirmação |
| Playlist privada | Invisível para outros usuários (resposta "não encontrada") |
| Avatar na Navbar | Abre o próprio perfil |
| Handle | 3 a 30 caracteres: letras minúsculas, números, `_` e `.`; único |
| Nome de exibição | 2 a 50 caracteres; bio até 160 |
| Playlist | Título até 60 caracteres; descrição até 300 |
| Faixa | Título até 80, álbum até 80, descrição até 500, prompt até 1000 |

---

## 11. Acessibilidade, responsividade e SEO

- **Breakpoints:** mobile-first; `md` 768 px (tablet) e `lg` 1024 px (desktop, quando aparecem sidebar fixa e player de rodapé).
- **Toque:** alvos de pelo menos 44 × 44 px em controles principais; ações que no desktop aparecem no hover ficam sempre visíveis em telas de toque (`pointer-coarse`).
- **Teclado:** foco visível em todos os controles, abas com setas/Home/End, diálogos com foco preso e retorno de foco, Esc fecha sobreposições.
- **Leitores de tela:** `aria-label` em botões de ícone, `aria-pressed` em toggles, regiões nomeadas (player, navegação), toasts anunciados.
- **Movimento:** animações respeitam `prefers-reduced-motion`.
- **Meta tags:** `usePageMeta(title, description)` atualiza título, `description` e Open Graph de cada página.
- **robots.txt / sitemap.xml:** gerados pelo plugin `vite/seoFiles.ts` a partir de `ROUTES`. O robots libera apenas rotas públicas e bloqueia as autenticadas; o sitemap só é gerado quando `VITE_SITE_URL` está definida.
- **Performance:** páginas com lazy loading, vendors separados em chunks (`vendor-react`, `vendor-motion`, `vendor-supabase`), `tus-js-client` carregado sob demanda, imagens comprimidas antes do upload.

---

## 12. Integração com Supabase

**Status:** integração **implementada e validada** por QA ponta a ponta. O Supabase (projeto `qxnbztrwbiffhthlzrzy`) é o único backend: o modo mock foi removido e o app não funciona sem ele. Nenhum componente conhece o Supabase: tudo passa por `AppServices`.

O schema completo — tabelas, funções, políticas, privilégios, buckets, migrations e configuração manual do painel — está no [`DATABASE_SCHEMA.md`](./DATABASE_SCHEMA.md), que é a fonte única. Esta seção cobre como o front se conecta a ele.

### 12.1 Arquivos e como ativar

| Arquivo (`src/app/services/supabase/`) | Responsabilidade |
|---|---|
| `client.ts` | `getSupabase()` cria o cliente sob demanda, com PKCE, sessão persistida e renovação automática; `findMissingSupabaseEnv()` alimenta a tela "Configuração ausente" e `getSupabaseConfig()` lança erro explícito se faltar variável |
| `supabaseErrors.ts` | `toServiceError` e `unwrap`: traduzem erros de Auth, PostgREST, Storage e rede (seção 12.8) |
| `supabaseMappers.ts` | Colunas selecionadas e conversão de linhas em `UserProfile`, `Track` e `Playlist` (URLs públicas, capa padrão) |
| `supabaseStorage.ts` | Caminhos `<uid>/<prefixo-><uuid>.<ext>`, upload simples, upload resumível (TUS, carregado sob demanda) e `persistWithMediaChanges` (envia mídias novas, persiste, apaga as antigas e desfaz os envios se algo falhar) |
| `supabaseAuthService.ts`, `supabaseUserService.ts`, `supabaseCatalogService.ts`, `supabaseLibraryService.ts` | Implementação dos contratos (seção 12.7) |
| `index.ts` | `supabaseServices`, registrado em `services/index.ts` |
| `database.types.ts` | Tipos gerados; regenerar após cada migration (MCP `generate_typescript_types`) |

Para ativar: concluir o painel ([`DATABASE_SCHEMA.md` §12](./DATABASE_SCHEMA.md#12-configuração-manual-no-painel)), preencher o `.env` (nunca commitado) com `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (chave pública anon ou publishable) e, opcionalmente, `VITE_SITE_URL`, e reiniciar o `npm run dev`. O SDK fica no chunk `vendor-supabase` e o TUS num chunk próprio, baixado só ao publicar uma música.

**Fluxos de Auth no front**

- **Cadastro:** com a confirmação de e-mail ativa, `signUp` devolve `confirmation_pending` e a tela mostra "Confirme seu e-mail"; sem ela, entra direto.
- **Links de e-mail:** na carga, o serviço aceita `?code=` (PKCE) e `?token_hash=&type=` (`verifyOtp`), emite `password_recovery` para links de recuperação e `auth_link_failed` para links inválidos ou expirados (toast), e limpa a URL com `history.replaceState`.
- **Recuperação:** o link aponta para `/entrar?fluxo=recuperacao`; com a sessão de recuperação, o guard de visitante não redireciona e a tela abre direto em "Nova senha".
- **Eventos:** `subscribeToAuthChanges` repassa `signed_in`, `signed_out` (inclusive logout em outra aba), `user_updated`, `password_recovery` e `auth_link_failed`. Os listeners rodam fora do callback do SDK (`setTimeout`), evitando o deadlock conhecido de `onAuthStateChange`.
- **Após logout ou exclusão de conta**, o próximo login vai para a Home, e não para a última rota visitada.

### 12.2 Modelo de dados (resumo)

| Entidade do front | Leitura | Escrita |
|---|---|---|
| `User` / perfil | `profiles` | `profiles` (criado pelo trigger `handle_new_user` no cadastro) |
| Estatísticas do perfil | `rpc('get_profile_stats')` | — (contadores mantidos por trigger) |
| `Track` | View `tracks_with_artist` (já traz `artist_handle` e `moods`) | `tracks` + `track_moods` |
| `Playlist` | View `playlists_with_details` (já traz `owner_handle` e `track_ids` ordenados) | `playlists` e RPCs de playlist |
| Favoritos, seguidores, reproduções | `favorites`, `follows`, `plays` | Mesmas tabelas |
| Opções do catálogo (`getCatalogOptions`) | `genres`, `moods`, `ai_generators` (por `sort_order`) e `rpc('get_popular_tags')` | — (dados de referência mantidos por migration) |

Regras do banco que o serviço precisa respeitar:

- **Somente colunas concedidas.** `authenticated` só escreve as colunas listadas em [`DATABASE_SCHEMA.md` §7](./DATABASE_SCHEMA.md#7-segurança-privilégios-e-rls). Enviar `play_count`, `role`, contadores, `published_at` ou `updated_at` gera `42501`. Os tipos `Insert`/`Update` gerados não refletem essa restrição: monte os payloads explicitamente.
- **Gênero e mood por nome.** São chaves estrangeiras para `genres`/`moods`; valor fora da lista gera `23503`. Preferências do perfil inválidas geram `23514`. Máximo de 3 moods por faixa (`23514`).
- **Status da faixa.** `publishTrack` insere `status = 'published'`. Como o artista enxerga os próprios rascunhos, as listagens públicas (home, populares, recentes) devem filtrar `.eq('status', 'published')`.
- **Caminhos de mídia.** Sempre `<auth.uid()>/<uuid>.<ext>`; o Storage recusa outra pasta e um `CHECK` no banco recusa linhas que apontem para a pasta de outro usuário (`23514`). Nomes únicos evitam cache de CDN desatualizado ao trocar a imagem.
- **URLs públicas.** O banco guarda o caminho (`*_path`); o serviço converte com `storage.from(bucket).getPublicUrl(path)`. Imagem ausente vira `null` (avatar, banner e playlist) ou a capa padrão (faixa); na UI, `CoverImage` e `UserAvatar` também cobrem URLs que falham ao carregar.

### 12.3 Buckets

| Bucket | Conteúdo | Limite | Tipos aceitos |
|---|---|---|---|
| `audio-tracks` | Áudio das faixas (`<uid>/<trackId>.<ext>`) | 50 MB | `audio/mpeg`, `audio/mp3`, `audio/wav`, `audio/x-wav`, `audio/wave` |
| `track-covers` | Capas das faixas | 2 MB | `image/jpeg`, `image/png` |
| `user-avatars` | Avatar e banner (`<uid>/avatar-*.jpg`, `<uid>/banner-*.jpg`) | 2 MB | `image/jpeg`, `image/png` |
| `playlist-covers` | Capas de playlists | 2 MB | `image/jpeg`, `image/png` |

Os buckets são públicos para leitura (streaming sem assinatura): quem conhece a URL acessa o arquivo, inclusive de rascunhos e de capas de playlists privadas. Se isso deixar de ser aceitável, torne o bucket privado e use `createSignedUrl`.

### 12.4 RPCs

| Função | Uso no front |
|---|---|
| `get_profile_stats(p_user_id)` | `tracks_count`, `total_plays`, `followers_count`, `following_count` |
| `search_tracks(p_query, p_genres, p_moods, p_sort, p_offset, p_limit)` | Linhas de `tracks_with_artist` + `total_count`. Ignora acentos e maiúsculas; gêneros com OR; moods com "qualquer um"; `p_sort` = `popular` ou `recent` |
| `get_recommended_tracks(p_limit)` | Usa o usuário da sessão (`auth.uid()`), sem parâmetro de usuário |
| `get_weekly_highlights(p_limit)` | Mais tocadas nos últimos 7 dias |
| `get_recently_played(p_limit)` | `track_id` e `last_played_at`, já sem duplicatas |
| `get_featured_genres(p_limit)` | `genre` e `track_count` dos gêneros com faixas publicadas |
| `get_popular_tags(p_limit)` | `tag` e `track_count` das tags mais usadas em faixas publicadas (sugestões do upload) |
| `add_track_to_playlist(p_playlist_id, p_track_id)` | Adiciona no fim; `PT404` ou `PT409` |
| `remove_track_from_playlist(p_playlist_id, p_track_id)` | Remove e recompacta as posições |
| `reorder_playlist_tracks(p_playlist_id, p_track_ids)` | Exige o mesmo conjunto de faixas; senão `PT409` |

Todas são `security invoker`: o RLS do usuário continua valendo. Os limites são normalizados para 1–50.

### 12.5 Edge Function `delete-account`

`supabase.functions.invoke('delete-account', { method: 'POST' })` com a sessão atual. A função valida o JWT, apaga os arquivos do usuário nos quatro buckets, encerra as sessões e exclui o usuário do Auth (as tabelas caem em cascata). A chave privilegiada existe apenas dentro da função. Depois do sucesso, o front chama `auth.signOut()` localmente e redireciona para a landing.

### 12.6 Limitações conhecidas

- **Busca:** tolera acentos e maiúsculas, mas não erros de digitação ("electrica" não encontra "Eletrônica"). Evolução possível: ordenar por `similarity()` do `pg_trgm`, que já está instalado e indexado.
- **Reproduções:** plays repetidos do mesmo usuário na mesma faixa, dentro da duração dela, contam uma vez só (trigger `collapse_repeated_play`). Contas falsas em massa ainda poderiam inflar a métrica; se ela virar monetização, mover o registro para uma Edge Function com rate limiting por IP e exigir tempo mínimo de escuta.
- **E-mail:** com o SMTP padrão do Supabase, cadastro, recuperação e troca de e-mail só funcionam para membros da equipe e com poucos envios por hora. Configure um SMTP próprio antes de abrir para usuários.
- **Dependências:** `npm audit` aponta 1 alerta *high* já existente no `react-router`; a correção exige atualizar para a 7.18.x fora da faixa atual (`npm audit fix --force`), o que deve ser feito numa mudança separada com regressão das rotas.
- **Google:** o botão verifica `GET /auth/v1/settings` antes de redirecionar; com o provedor desativado no painel, mostra um aviso em vez de abrir a página de erro do Supabase.
- **Tipos gerados:** as colunas da view aparecem como anuláveis e os tipos de escrita ignoram os privilégios por coluna; os mapeadores do serviço devem validar e converter.

### 12.7 Mapeamento dos contratos

**AuthService**

| Método | Supabase |
|---|---|
| `getCurrentUser` | Trata o link de e-mail da URL (uma vez), `auth.getSession()` e `auth.getUser()` (valida o JWT no servidor; se falhar, `signOut` local e `null`) + `profiles` do usuário |
| `signIn` | `auth.signInWithPassword` com e-mail normalizado; credenciais inválidas → `invalid_credentials` |
| `signUp` | `auth.signUp({ email, password, options: { data: { display_name }, emailRedirectTo } })`; o trigger cria o perfil. Retorna `{ kind: 'signed_in', user }` ou `{ kind: 'confirmation_pending', email }`; `identities` vazio (e-mail já cadastrado) → `conflict` |
| `signInWithGoogle` | Confere se o provedor está ativo e chama `auth.signInWithOAuth({ provider: 'google' })`. Retorna `null`: é um redirecionamento e a sessão volta pelos eventos de Auth |
| `signOut` | `auth.signOut({ scope: 'local' })` |
| `requestPasswordReset` | `auth.resetPasswordForEmail(email, { redirectTo: `${siteUrl}/entrar?fluxo=recuperacao` })` |
| `completePasswordReset` | Exige a sessão de recuperação e chama `auth.updateUser({ password })` |
| `changePassword` | Reautentica com `signInWithPassword(email, currentPassword)` (senha errada → "A senha atual está incorreta.") e então `auth.updateUser({ password })` |
| `updateEmail` | `auth.updateUser({ email }, { emailRedirectTo: /configuracoes })`. Retorna `{ user, isConfirmationPending }`; com confirmação pendente a UI mantém o e-mail atual e mostra "Confirme o novo e-mail" |
| `deleteAccount` | `functions.invoke('delete-account', { method: 'POST' })` (seção 12.5); erro da função → `unknown` com a mensagem em pt-BR retornada; depois `signOut` local |
| `subscribeToAuthChanges` | Eventos internos (`password_recovery`, `auth_link_failed`) + `onAuthStateChange`; retorna a função de cancelamento |

**UserService**

| Método | Supabase |
|---|---|
| `getProfileByHandle` | `profiles.select().eq('handle', handle).maybeSingle()`; vazio → `not_found` (RLS já esconde perfis privados) |
| `getProfileStats` | `rpc('get_profile_stats', { p_user_id })`; sem linhas → `not_found` |
| `updateProfile` | Para `MediaChange.replace`, upload em `user-avatars` e remoção do arquivo anterior; para `remove`, remoção e `*_path = null`; depois `profiles.update().eq('id', userId)` apenas com as colunas editáveis. Handle duplicado (`23505`) → `conflict` |
| `isFollowing` | `follows.select('*', { count: 'exact', head: true })` com os dois ids |
| `setFollowing` | `insert`/`delete` em `follows` e releitura do perfil alvo (contadores vêm do trigger) |

**CatalogService**

| Método | Supabase |
|---|---|
| `getCatalogOptions` | Em paralelo: `genres`, `moods` e `ai_generators` ordenados por `sort_order` e nome, mais `rpc('get_popular_tags', { p_limit: 10 })` |
| `getHomeFeed` | Consultas paralelas em `tracks_with_artist` filtrando `status = 'published'`: populares (`play_count desc`) e recentes (`created_at desc`); mais `rpc('get_weekly_highlights')`, `rpc('get_featured_genres')` e criadores por `followers_count` — só perfis públicos com faixa publicada (`tracks!tracks_artist_id_fkey!inner()`), sem o próprio usuário |
| `getRecommendedTracks` | `rpc('get_recommended_tracks', { p_limit })` |
| `searchTracks` | `rpc('search_tracks')` → `{ items, total }`, com `total` vindo de `total_count` da primeira linha (`0` se vazio) |
| `getTracksByIds` | `tracks_with_artist.select().in('id', ids)` e reordenação no cliente pela ordem recebida |
| `getTracksByArtist` | `tracks_with_artist.select().eq('artist_id', id).order('created_at', { ascending: false })` |
| `publishTrack` | Gerar o `trackId` no cliente; upload resumível (TUS) do áudio em `audio-tracks/<uid>/<trackId>.<ext>` reportando progresso; capa em `track-covers`; `insert` em `tracks` (com `status: 'published'`, `file_size_bytes` e `audio_format`) e em `track_moods`. Em qualquer falha, remover os objetos e a faixa já criados antes de relançar o erro |

**LibraryService**

| Método | Supabase |
|---|---|
| `getFavoriteTrackIds` | `favorites.select('track_id').order('created_at', { ascending: false })` |
| `setFavorite` | `insert` (ignorando `23505`) ou `delete` em `favorites` (idempotente) |
| `getRecentlyPlayedTrackIds` | `rpc('get_recently_played', { p_limit: 20 })` → `track_id` na ordem recebida |
| `recordPlay` | `insert` em `plays` (os triggers agrupam repetições e incrementam `play_count`) |
| `getPlaylists` / `getPublicPlaylists` | View `playlists_with_details` ordenada por `created_at desc`; o público filtra `is_public = true` |
| `getPlaylistById` | Mesma view com `.eq('id', id).maybeSingle()`; id inválido ou vazio → `not_found` |
| `createPlaylist` / `updatePlaylist` | Capa em `playlist-covers` via `persistWithMediaChanges`; `insert`/`update` em `playlists` com `.select('id')` para detectar 0 linhas (`not_found`) |
| `deletePlaylist` | `delete` em `playlists` (cascata em `playlist_tracks`) e remoção da capa |
| `addTrackToPlaylist` | `rpc('add_track_to_playlist')` (posição no fim, atômica); `PT409` → `conflict`, `PT404` → `not_found` |
| `removeTrackFromPlaylist` | `rpc('remove_track_from_playlist')` (remove e recompacta `position`) |
| `reorderPlaylistTracks` | `rpc('reorder_playlist_tracks')` |

### 12.8 Tradução de erros

| Origem | `ServiceError.code` |
|---|---|
| Auth `invalid_credentials` / `invalid_grant` | `invalid_credentials` |
| Sessão ausente ou expirada (JWT inválido, `42501` sem sessão) | `unauthenticated` |
| `42501` com sessão ativa (RLS ou coluna sem privilégio: o recurso não pertence ao usuário) | `not_found` |
| PostgREST `PGRST116`, RPC `PT404` ou resultado vazio em leitura por id | `not_found` |
| Postgres `23505` (único) ou RPC `PT409` | `conflict` |
| Postgres `23514` (check/trigger), `23503` (gênero ou mood inexistente), `22001` (tamanho) ou validação de bucket (tamanho/MIME) | `validation` |
| Auth `email_exists`/`user_already_exists` | `conflict` ("Já existe uma conta com este e-mail.") |
| Auth `email_not_confirmed`, `weak_password`, `same_password`, `otp_expired`, limites de envio (`over_email_send_rate_limit`) e e-mail recusado pelo servidor | Mensagens próprias em pt-BR |
| Falha de rede | `unknown` com "Sem conexão com o servidor…" |
| Qualquer outro | `unknown` |

Mensagens em pt-BR geradas pelo banco (`PT404`, `PT409`, triggers) são preservadas; mensagens técnicas (`violates`, `permission denied`, `row-level security`…) são substituídas por texto próprio. Cada chamada pode sobrescrever a mensagem por código (ex.: `conflict` → "Este @username já está em uso.").

---

## 13. Roadmap

- **Fase 2:** comentários, notificações, letras sincronizadas, modo offline, compartilhamento social com pré-visualização (Open Graph por faixa via SSR/edge).
- **Fase 3:** monetização, estatísticas avançadas para criadores, colaborações e API pública.
