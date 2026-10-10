# Biblioteca de Componentes — Mars Sound AI

Catálogo dos componentes reutilizáveis **como existem no código** (`src/app/components`). Consulte antes de criar um componente novo: na maioria dos casos, a solução é compor os existentes ou adicionar uma variante.

Arquitetura, rotas, contratos de serviço e integração com o backend estão em [`SYSTEM_DOCUMENTATION.md`](./SYSTEM_DOCUMENTATION.md).

## Índice

1. [Princípios](#1-princípios)
2. [Tokens visuais](#2-tokens-visuais)
3. [Camadas (z-index)](#3-camadas-z-index)
4. [Primitivas de UI](#4-primitivas-de-ui)
5. [Formulários](#5-formulários)
6. [Feedback e estados](#6-feedback-e-estados)
7. [Layout e navegação](#7-layout-e-navegação)
8. [Faixas](#8-faixas)
9. [Player](#9-player)
10. [Playlists](#10-playlists)
11. [Perfil e configurações](#11-perfil-e-configurações)
12. [Descobrir e upload](#12-descobrir-e-upload)
13. [Hooks de UI](#13-hooks-de-ui)
14. [Checklist para novos componentes](#14-checklist-para-novos-componentes)

---

## 1. Princípios

- **Sem acesso direto a dados.** Componentes usam contextos (`useLibrary`, `usePlayer`, `useAuth`) ou hooks (`useTrackSearch`, `useTracksByIds`). Serviços só são importados de `services/index.ts`, e apenas em hooks, contextos e páginas.
- **Composição antes de props booleanas.** Ex.: `ProfileHeader` recebe `actions` e `bannerAction` como `ReactNode` em vez de flags "isOwnProfile".
- **`className` por último.** Componentes aceitam `className` e o aplicam com `cn()` (tailwind-merge). Classes de estado condicionais vêm depois do `className` recebido para não serem sobrescritas por acidente.
- **Acessível por padrão.** Botões de ícone têm `aria-label`; toggles usam `aria-pressed`; todo controle tem foco visível (`focus-visible:ring-2 focus-visible:ring-[#ff164c]/60`).
- **Toque e mouse.** Alvos principais têm 44 px (`size-11` ou `size="touch"`). Ações reveladas no hover usam `pointer-fine:` para continuarem visíveis em telas de toque.
- **Cliques dentro de linhas/cards clicáveis** (que disparam o play) chamam `event.stopPropagation()`. Diálogos abertos a partir dessas áreas são renderizados por providers únicos (ex.: `PlaylistCreationProvider`) para que eventos do portal não borbulhem até a linha.

---

## 2. Tokens visuais

### Cores

| Uso | Valor |
|---|---|
| Marca (ações, ativo, favorito) | `#ff164c` |
| Gradiente primário | `from-[#ff164c] from-[57%] to-[#ea5858]` |
| Fundo da aplicação | `#0a0608` |
| Superfícies (sidebar, player, mini player) | `#1c1315` |
| Superfícies elevadas (menus, diálogos, cards) | `#24191b` |
| Borda padrão | `#30292b` |
| Texto principal | `#f8f8f8` / `#ebe9e9` |
| Texto secundário | `#bababa` / `#bfbbbc` |
| Texto atenuado | `#a19a9b` |
| Texto sutil / trilhas de progresso | `#5b4f51` |

### Forma, espaço e movimento

- **Cantos retos** (`rounded-none`) em botões, inputs, menus, diálogos e capas. Exceções: avatares e chips (`rounded-full`).
- **Espaçamento de página:** `px-4 py-6` → `sm:px-6` → `lg:px-[37px] lg:py-[38px]` (via `PageContainer`).
- **Transições:** `duration-150` para cores; animações de entrada com `motion`. Toda animação não essencial respeita `prefers-reduced-motion` (`useReducedMotion`).
- **Superfícies compartilhadas** em `ui/surfaceStyles.ts`: `MENU_SURFACE_CLASS`, `MENU_ITEM_CLASS`, `MENU_SEPARATOR_CLASS`, `DIALOG_SURFACE_CLASS`. Use-as em vez de repetir classes de menus e diálogos.

---

## 3. Camadas (z-index)

| Camada | z-index |
|---|---|
| Mini player (mobile) | 90 |
| Navegação inferior (mobile) | 95 |
| Player de rodapé (desktop) | 100 |
| Player em tela cheia (mobile) | 110 |
| Dropdowns e selects | 150 |
| Diálogos e overlays | 200 |
| Toasts | 300 |

Novas sobreposições devem se encaixar nesta escala; não use valores arbitrários.

---

## 4. Primitivas de UI

Pasta `components/ui/`. Arquivos em minúsculas (`button.tsx`, `dialog.tsx`, `dropdown-menu.tsx`, `alert-dialog.tsx`, `switch.tsx`, …) são primitivas shadcn/Radix; os em PascalCase são componentes do produto.

### Diálogos e menus: gestão de foco
Os diálogos do produto são controlados por estado (`open`/`onOpenChange`), sem `DialogTrigger`. Por isso:
- `DialogContent` e `AlertDialogContent` aplicam `useReturnFocus`: ao fechar, o foco volta ao elemento que abriu o diálogo. Se ele foi aberto por um item de menu, o foco volta ao botão que abriu o menu.
- `DropdownMenuContent` não devolve o foco ao seu gatilho quando um item abriu um diálogo (o foco já está no diálogo).
- Para escolher o foco inicial de um diálogo, marque o elemento com `data-autofocus`. **Não use `autoFocus`**: ele dispara antes do Radix e apaga a referência de retorno.
- Diálogos montados direto com o primitivo Radix (ex.: `FullscreenPlayer`) devem espalhar `useReturnFocus()` no `Content`.

### `Button` (`ui/button.tsx`)
- `variant`: `primary` (gradiente da marca), `brandOutline` (borda da marca), `destructive`, `ghost`, `outline`, `secondary`, `link`, `default`.
- `size`: `touch` (44 px, padrão do produto), `default`, `sm`, `lg`, `icon`.
- `asChild` para renderizar como `Link`.

```tsx
<Button variant="primary" size="touch" onClick={save}>Salvar</Button>
<Button asChild variant="brandOutline" size="touch"><Link to={ROUTES.home}>Voltar</Link></Button>
```

### `FavoriteButton` (`ui/FavoriteButton.tsx`)
Coração da marca, preenchido quando favoritado. Animação de mola ao alternar (desativada com movimento reduzido); `stopPropagation` embutido.
- Props: `isFavorite`, `onToggle`, `size?: "sm" | "md" | "lg"` (32/36/44 px), `className?`.
- Para faixas, prefira `TrackFavoriteButton`, que já liga ao `LibraryContext`.
- Já vem com tooltip ("Adicionar aos favoritos" / "Remover dos favoritos").

### `IconTooltip` (`ui/IconTooltip.tsx`)
Tooltip da marca para botões só com ícone. Depende do `TooltipProvider` único em `App.tsx`.
- Props: `label`, `children` (um único elemento focável), `side?`, `className?`.
- Mantenha o `aria-label` no botão: o tooltip não abre em telas de toque.

### `CoverImage` (`ui/CoverImage.tsx`)
`<img>` para mídias do Storage. Sem URL ou com falha de carregamento, mostra `fallbackSrc` (padrão: capa da marca; use `DEFAULT_BANNER_URL` para banners). Aceita os atributos de `<img>`; `alt` padrão vazio.

### `CategoryChip` (`ui/CategoryChip.tsx`)
Chip arredondado com `aria-pressed`.
- Props: `label`, `active?`, `disabled?`, `onClick?`, `className?`.

### `SegmentedControl<TValue>` (`ui/SegmentedControl.tsx`)
Grupo de opções exclusivas (ex.: ordenação).
- Props: `options: { value, label }[]`, `value`, `onChange`, `ariaLabel`, `className?`.

### `TabNav<TTabId>` (`ui/TabNav.tsx`)
Abas acessíveis (`role="tablist"`, setas, Home e End).
- Props: `tabs: TabDefinition[]`, `activeTabId`, `onSelect`, `idPrefix`, `ariaLabel`, `className?`.
- `getTabPanelProps(idPrefix, tabId)` devolve `id`, `role` e `aria-labelledby` do painel.
- Combine com `useUrlTab` para manter a aba em `?aba=`.

```tsx
const [activeTab, selectTab] = useUrlTab(["perfil", "conta"] as const, "perfil");
<TabNav tabs={TABS} activeTabId={activeTab} onSelect={selectTab} idPrefix="settings" ariaLabel="Seções" />
<div {...getTabPanelProps("settings", activeTab)}>…</div>
```

---

## 5. Formulários

Pasta `components/forms/FormControls.tsx`.

| Componente | Props principais | Observações |
|---|---|---|
| `FormField` | `id`, `label`, `error?`, `hint?`, `required?`, `labelAction?`, `children`, `className?` | Renderiza label, dica e mensagem de erro com `id` previsível (`getFieldErrorId`) |
| `TextInput` | atributos de `<input>` + `hasError?` | `forwardRef`; liga `aria-invalid` e `aria-describedby` |
| `PasswordInput` | igual ao `TextInput` (sem `type`) | Botão de mostrar/ocultar senha |
| `TextAreaInput` | atributos de `<textarea>` + `hasError?` | Sem redimensionamento manual |
| `FormErrorMessage` | `message: string \| null` | Erro geral do formulário (`role="alert"`) |

Validação reutilizável em `utils/validation.ts` (`validateEmail`, `validateNewPassword`, `validateHandle`, `collectErrors`, `hasErrors`…). Submissões assíncronas usam `useAsyncAction` (ver [Hooks de UI](#13-hooks-de-ui)).

---

## 6. Feedback e estados

| Componente | Uso |
|---|---|
| `LoadingState` (`feedback/StatusViews`) | `label?`, `className?`; spinner com `role="status"` |
| `ErrorState` | `message`, `onRetry?` (botão "Tentar novamente"), `className?` |
| `EmptyState` | `title`, `description?`, `icon?`, `action?`, `className?` |
| `ConfirmDialog` (`feedback/ConfirmDialog`) | Confirmação assíncrona. Props: `open`, `onOpenChange`, `title`, `description`, `confirmLabel`, `pendingLabel`, `errorFallbackMessage`, `onConfirm: () => Promise<void>`, `variant?: "destructive" \| "primary"` (padrão `destructive`). Bloqueia o fechamento enquanto a ação roda e mostra toast em caso de erro |
| `ShareButton` (`feedback/ShareButton`) | `path`, `title`, `label`, `className?`. Usa Web Share API e cai para copiar o link |

Toasts usam `sonner` (`toast.success`, `toast.error`); mensagens de erro vêm de `getErrorMessage(error, fallback)`.

```tsx
<ConfirmDialog
  variant="primary"
  open={isOpen}
  onOpenChange={setIsOpen}
  title="Sair da conta?"
  description="Você precisará entrar novamente neste dispositivo."
  confirmLabel="Sair"
  pendingLabel="Saindo..."
  errorFallbackMessage="Não foi possível sair da conta."
  onConfirm={signOut}
/>
```

---

## 7. Layout e navegação

| Componente | Descrição |
|---|---|
| `AppShell` | Estrutura das rotas autenticadas: providers de biblioteca, criação de playlist e player; Sidebar, Navbar, conteúdo, BottomNav e players |
| `Sidebar` | Fixa no desktop; gaveta no mobile (`isMobileOpen`, `onMobileClose`). Navegação principal e atalho de upload |
| `Navbar` | Busca global (preserva filtros do Descobrir), atalho de upload e avatar que abre o perfil |
| `BottomNav` | Navegação inferior no mobile/tablet |
| `PageContainer` | `width?: "full" \| "narrow"`, `className?`; espaçamento padrão de página |
| `PageHeader` | `title`, `description?`, `actions?`; único `h1` da página |
| `ContentSection` | `title`, `description?`, `seeAllHref?` ("Ver tudo: {título}"), `children`; `section` rotulada pelo título |
| `NavigationIcons` | Ícones SVG da navegação |

---

## 8. Faixas

| Componente | Props | Descrição |
|---|---|---|
| `TrackCard` | `track`, `queue`, `variant?: "card" \| "list"`, `imageAspect?: "square" \| "wide"`, `className?` | Card para carrosséis e grades; tocar inicia `track` dentro de `queue`; indicador de reprodução e ações sobre a capa |
| `TrackTable` | `tracks`, `showAlbum?`, `showDuration?`, `showFavorite?`, `editablePlaylist?: { onRemove, onMove }` | Lista numerada; linha inteira toca a faixa (Enter/Espaço no teclado). Com `editablePlaylist`, o menu ganha mover para cima/baixo e remover |
| `TrackActionsMenu` | `track`, `playlistActions?`, `triggerClassName?` | Menu "⋯": favoritar, adicionar a playlist (com "Nova playlist"), ver perfil do artista e ações de playlist |
| `TrackFavoriteButton` | `trackId`, `size?`, `className?` | `FavoriteButton` ligado ao `LibraryContext` via `useTrackFavorite` |
| `PlayAllButton` | `tracks`, `label?` (padrão "Tocar tudo") | Toca a lista a partir da primeira faixa; alterna pausa se ela já estiver tocando; spinner enquanto carrega |
| `TrackPlaybackIndicator` | `status`, `toneClassName?` | Spinner (carregando), alerta (erro) ou `EqualizerBars` (tocando/pausado). Acompanha `getTrackPlayActionLabel(status, track)` e `hasPlaybackIndicator(status)` |
| `EqualizerBars` | `className?`, `barClassName?` | Indicador animado de "tocando agora" |

---

## 9. Player

| Componente | Descrição |
|---|---|
| `DesktopPlayer` | Rodapé fixo (≥ 1024 px): faixa atual, favoritar, menu, controles, progresso e volume |
| `MiniPlayer` | Barra compacta acima da `BottomNav` (< 1024 px); abre a tela cheia |
| `FullscreenPlayer` | Tela cheia (< 1024 px) em diálogo Radix. Fecha pelo botão, Esc ou arrastando para baixo a partir do cabeçalho/capa (120 px ou gesto rápido). Fecha sozinho se a tela passar para desktop. No celular, os controles ficam no rodapé; a partir de `md`, o conteúdo vira uma coluna centralizada de até 520 px |
| `PlaybackControls` | `variant: "desktop" \| "fullscreen"`; aleatório, anterior, play/pausa, próxima, repetir. Todos os botões têm tooltip; o principal reflete `playbackStatus` |
| `PlaybackStatusGlyph` | `status`, `size?`; ícone do botão principal (spinner, pausa, play ou "tentar de novo"). `getPlaybackActionLabel(status)` dá o rótulo acessível |
| `PlaybackErrorNotice` | `className?`; "Não foi possível reproduzir." + "Tentar de novo" quando `playbackStatus === "error"` (desktop e tela cheia) |
| `PlaybackProgressBar` | `layout: "inline" \| "stacked"`, `className?`; tempo atual, duração e busca |
| `MediaSlider` | `value` (0–100), `label`, `valueText?`, `step?` (padrão 0,5 para arraste suave do progresso; volume usa 5 para o teclado), `disabled?`, `onValueChange`, `onValueCommit?`; slider acessível usado por progresso e volume |
| `PlayerIcons` | Ícones do player (`PlayIcon`, `PauseIcon`, `NextIcon`, `PreviousIcon`, `ShuffleIcon`, `RepeatIcon`, `VolumeIcon`, `VolumeMutedIcon`) |

O estado vem de `usePlayer()` (incluindo `playbackStatus`: `idle`, `loading`, `playing`, `paused`, `error`); o progresso, de `usePlaybackProgress()` (contexto separado para evitar re-render global); o status de uma faixa específica, de `useTrackPlaybackStatus(trackId)`.

---

## 10. Playlists

| Componente | Props | Descrição |
|---|---|---|
| `PlaylistCreationProvider` / `usePlaylistCreation` | — | Diálogo único de criação; `openPlaylistCreation({ trackToAdd? })` |
| `PlaylistCreationButton` | `variant: "primary" \| "brandOutline"`, `children` | Botão que abre a criação |
| `PlaylistFormDialog` | `open`, `onOpenChange`, `mode: "create" \| "edit"`, `initialValues?`, `onSubmit(input: PlaylistInput)` | Título, descrição, pública/privada e capa (via `useEditableImage`, envia `MediaChange`) |
| `AddTracksDialog` | `open`, `onOpenChange`, `playlist` | Busca com debounce; cada resultado mostra "Adicionar" ou "Adicionada" |
| `PlaylistCard` | `playlist`, `playlistTracks` | Card com capa (própria ou da primeira faixa, via `resolvePlaylistCover`) e contagem |
| `PlaylistGrid` | `playlists` | Grade responsiva de `PlaylistCard` resolvendo as faixas necessárias |

---

## 11. Perfil e configurações

| Componente | Props | Descrição |
|---|---|---|
| `ProfileHeader` | `profile`, `stats?`, `bannerAction?`, `actions` | Banner, avatar, nome, @handle, bio e estatísticas (músicas, plays, seguidores, seguindo) |
| `ProfileContentTabs` | `tracksPanel`, `playlistsPanel` | Abas Músicas/Playlists sincronizadas com `?aba=` |
| `PublishedTracksSection` | — | Faixas publicadas com "Tocar tudo" e resumo |
| `OwnProfilePlaylists` / `PublicProfilePlaylists` | — / `ownerId`, `ownerName` | Playlists do próprio usuário (com criação) ou apenas as públicas de outro |
| `UserAvatar` | `profile` (`displayName`, `avatarUrl`), `shape?: "circle" \| "square"`, `className?` | Foto ou iniciais |
| `CreatorCard` | `creator` | Card de criador com link para o perfil |
| `SettingsPanel` / `SettingsRow` | `title`, `description?`, `children` / `title`, `description`, `action` | Blocos da página de configurações |
| `ProfileSettingsForm`, `MusicPreferencesForm`, `AccountSettings` | — | Formulários das abas Perfil e Conta |

---

## 12. Descobrir e upload

| Componente | Props | Descrição |
|---|---|---|
| `FilterChipGroup` | `label`, `options`, `selectedValues`, `onToggle`, `onClear` | Grupo de chips com seleção múltipla e opção "Todos" |
| `GenreCategoryGrid` | `genres` | Grade de categorias que leva ao Descobrir filtrado |
| `FileDropZone` | `title`, `hint`, `accept`, `icon`, `selectLabel`, `error?`, `preview?`, `clearLabel?`, `onFileSelected`, `onClear?` | Arrastar e soltar ou clicar para escolher; a zona inteira abre o seletor, então controles dentro de `preview` devem parar a propagação do clique |
| `AudioPreviewPlayer` | `file` | Pré-escuta local do áudio; pausa o player global ao tocar e é pausada quando ele volta a tocar |
| `TagInput` | `id`, `tags`, `suggestions`, `onChange` | Tags com Enter/vírgula, sugestões e limite de 10 |

---

## 13. Hooks de UI

| Hook | Retorno / uso |
|---|---|
| `usePageMeta(title, description?)` | Atualiza título, `description` e Open Graph da página |
| `useAsyncData(load, deps)` | `{ data, isLoading, errorMessage, reload }` para leituras |
| `useAsyncAction()` | `{ run, isPending, errorMessage, clearError }` para submissões; `run` devolve `true` em caso de sucesso |
| `useTrackSearch(filters)` | Busca paginada: `{ tracks, total, isLoading, isLoadingMore, errorMessage, hasMore, loadMore, reload }` |
| `useTracksByIds(ids)` | Resolve ids em faixas, preservando a ordem |
| `useTrackFavorite(trackId)` | `{ isFavorite, toggle({ announceResult? }) }` |
| `useProfileStats(profileId)` | `ProfileStats \| undefined` (não consulta sem id) |
| `useEditableImage(savedUrl, maxDimension)` | `{ change, previewUrl, errorMessage, isDirty, handleFileInputChange, remove, reset }` — produz `MediaChange` |
| `useObjectUrl(blob)` | Object URL com revogação automática |
| `useUrlTab(tabIds, defaultTabId)` | `[activeTabId, selectTab]` sincronizado com `?aba=` |
| `useDebouncedValue(value, delayMs)` | Valor atrasado para buscas |
| `useReturnFocus({ onOpenAutoFocus?, onCloseAutoFocus? })` | Handlers para o `Content` de diálogos Radix: restaura o foco ao fechar e respeita `data-autofocus` (ver "Diálogos e menus") |

---

## 14. Checklist para novos componentes

1. Já existe algo parecido aqui? Dá para resolver com uma variante ou composição?
2. O componente só recebe dados por props, contexto ou hook (sem importar serviços diretamente)?
3. Usa os tokens e as superfícies compartilhadas desta página?
4. Aceita `className` e o aplica com `cn()`?
5. Tem foco visível, `aria-label` nos botões de ícone e alvo de toque de 44 px nos controles principais?
6. Respeita `prefers-reduced-motion` nas animações?
7. Se fica sobreposto, usa uma camada da tabela de z-index? Se é diálogo, devolve o foco ao fechar e usa `data-autofocus` em vez de `autoFocus`?
8. Está documentado nesta página?
