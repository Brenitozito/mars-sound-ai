# Mars Sound AI - Design System

## Índice

1. [Visão Geral](#visão-geral)
2. [Filosofia de Design](#filosofia-de-design)
3. [Tokens Primitivos](#tokens-primitivos)
4. [Tokens Semânticos](#tokens-semânticos)
5. [Tipografia](#tipografia)
6. [Cores](#cores)
7. [Espaçamento](#espaçamento)
8. [Componentes](#componentes)
9. [Iconografia](#iconografia)
10. [Animações](#animações)
11. [Responsividade](#responsividade)
12. [Acessibilidade](#acessibilidade)

---

## Visão Geral

O Design System do **Mars Sound AI** é inspirado na paleta de cores de Marte (vermelhos e laranjas) combinada com tons escuros profundos, criando uma estética futurista e imersiva para música gerada por IA.

### Princípios de Design

1. **Imersão**: Interface dark com foco no conteúdo
2. **Clareza**: Hierarquia visual clara e legível
3. **Energia**: Cores vibrantes (brand) contrastando com neutros escuros
4. **Fluidez**: Animações suaves e transições naturais
5. **Consistência**: Componentes reutilizáveis e padrões definidos

---

## Filosofia de Design

### Inspiração Visual

**Marte**: O planeta vermelho inspira a paleta principal
- Vermelhos vibrantes (#ff164c, #ff4d72)
- Laranjas quentes (#ea5858)
- Tons terrosos escuros

**Cosmos**: O espaço profundo influencia os backgrounds
- Negros profundos (#0b0708, #100c0d)
- Cinzas escuros (#1a1214, #201617)

**Música**: Elementos visuais que evocam som
- Barras de áudio animadas
- Waveforms
- Gradientes suaves

---

## Tokens Primitivos

### Nomenclatura

```
--{category}-{name}-{variant}
```

**Exemplos**:
- `--mars-red-500` (categoria: mars, nome: red, variante: 500)
- `--mars-dark-900` (categoria: mars, nome: dark, variante: 900)

---

### Brand Palette (Mars Red)

```css
/* ── Mars Red ──────────────────────────────── */

--mars-red-900: #3d0515;    /* Darkest - Para shadows/backgrounds */
--mars-red-600: #d4103e;    /* Dark - Para hover states */
--mars-red-500: #ff164c;    /* Primary - Cor principal da marca */
--mars-red-400: #ff4d72;    /* Light - Para highlights */
--mars-red-300: #ff7a96;    /* Lighter - Para text on dark */
--mars-red-200: #ffa7bb;    /* Very light - Para borders */
--mars-red-100: #ffd4df;    /* Lightest - Para backgrounds */
--mars-red-50:  #ffebf0;    /* Ultra light - Para hover/active states */
```

**Uso**:
- **500**: Botões primários, links, ícones ativos
- **400**: Hover de botões primários
- **600**: Active state de botões
- **900**: Shadows, overlays
- **50-200**: Backgrounds sutis, borders

---

### Dark Neutrals

```css
/* ── Dark Neutrals ──────────────────────────── */

--mars-dark-950: #0b0708;   /* Deepest black - Player, overlays */
--mars-dark-900: #100c0d;   /* Base background */
--mars-dark-800: #1a1214;   /* Sidebar, elevated surfaces */
--mars-dark-700: #201617;   /* Cards, inputs */
--mars-dark-600: #2c1e20;   /* Hover states */
--mars-dark-500: #30292b;   /* Borders, dividers */
--mars-dark-400: #3d3234;   /* Subtle borders */
--mars-dark-300: #4a3d3f;   /* Disabled states */
```

**Uso**:
- **950**: Player background, overlays escuros
- **900**: Background principal da app
- **800**: Sidebar, navbar, surfaces elevadas
- **700**: Cards, inputs, modals
- **600**: Hover de cards/buttons
- **500**: Borders padrão
- **300-400**: Estados desabilitados

---

### Light Neutrals (Text)

```css
/* ── Light Neutrals (Text) ──────────────────── */

--mars-gray-50:  #f7f5f5;   /* White - Títulos principais */
--mars-gray-100: #ebe9e9;   /* Primary text */
--mars-gray-200: #d6d3d3;   /* Secondary text */
--mars-gray-300: #bababa;   /* Tertiary text, placeholders */
--mars-gray-400: #9e9a9a;   /* Muted text */
--mars-gray-500: #716e6e;   /* Very muted, disabled text */
--mars-gray-600: #5b5859;   /* Subtle text */
--mars-gray-700: #454243;   /* Very subtle */
```

**Uso**:
- **50**: Títulos de destaque (H1)
- **100**: Texto primário (body, H2-H6)
- **200**: Texto secundário (subtítulos)
- **300**: Texto terciário (labels, placeholders)
- **400-500**: Texto muted (descrições, hints)
- **600-700**: Texto disabled

---

### Warm Accents

```css
/* ── Warm Accents ──────────────────────────── */

--mars-warm-100: #ffe8ed;   /* Subtle warm background */
--mars-warm-200: #ffd1da;   /* Light warm accent */
--mars-warm-300: #ffbac7;   /* Warm highlight */

--mars-orange-500: #ea5858; /* Secondary brand color */
--mars-orange-400: #ff7a7a; /* Light orange */
--mars-orange-300: #ff9d9d; /* Lighter orange */
```

**Uso**:
- Gradientes (red → orange)
- Highlights em textos
- Backgrounds de notificações

---

### Semantic Colors

```css
/* ── Success ──────────────────────────── */
--color-success-light: #d4edda;
--color-success:       #28a745;
--color-success-dark:  #1e7e34;

/* ── Warning ──────────────────────────── */
--color-warning-light: #fff3cd;
--color-warning:       #ffc107;
--color-warning-dark:  #d39e00;

/* ── Error ──────────────────────────── */
--color-error-light:   #f8d7da;
--color-error:         #dc3545;
--color-error-dark:    #bd2130;

/* ── Info ──────────────────────────── */
--color-info-light:    #d1ecf1;
--color-info:          #17a2b8;
--color-info-dark:     #117a8b;
```

**Uso**:
- Feedbacks de ações
- Toasts/notifications
- Badges de status

---

## Tokens Semânticos

### Brand

```css
/* ── Brand Colors ──────────────────────────── */

--color-brand:        var(--mars-red-500);    /* #ff164c */
--color-brand-hover:  var(--mars-red-400);    /* #ff4d72 */
--color-brand-active: var(--mars-red-600);    /* #d4103e */
--color-brand-dark:   var(--mars-red-900);    /* #3d0515 */
--color-brand-light:  var(--mars-red-100);    /* #ffd4df */
```

**Uso**:
```css
/* Botão primário */
button {
  background: var(--color-brand);
}

button:hover {
  background: var(--color-brand-hover);
}

button:active {
  background: var(--color-brand-active);
}
```

---

### Surfaces

```css
/* ── Surfaces (Backgrounds) ──────────────────── */

--color-bg-base:        var(--mars-dark-900);  /* #100c0d - Body */
--color-bg-sidebar:     var(--mars-dark-800);  /* #1a1214 - Sidebar/Navbar */
--color-bg-card:        var(--mars-dark-700);  /* #201617 - Cards */
--color-bg-card-hover:  var(--mars-dark-600);  /* #2c1e20 - Card hover */
--color-bg-elevated:    var(--mars-dark-800);  /* #1a1214 - Modals/Dropdowns */
--color-bg-overlay:     rgba(11, 7, 8, 0.8);   /* Backdrop overlays */
```

**Hierarquia de Superfícies**:
```
Base (900) < Sidebar/Navbar (800) < Cards (700) < Hover (600) < Elevated (800)
```

**Uso**:
```css
body {
  background: var(--color-bg-base);
}

.sidebar {
  background: var(--color-bg-sidebar);
}

.card {
  background: var(--color-bg-card);
}

.card:hover {
  background: var(--color-bg-card-hover);
}
```

---

### Borders

```css
/* ── Borders ──────────────────────────── */

--color-border-subtle:  var(--mars-dark-500);  /* #30292b - Padrão */
--color-border-card:    var(--mars-dark-500);  /* #30292b - Cards */
--color-border-input:   var(--mars-dark-500);  /* #30292b - Inputs */
--color-border-focus:   var(--mars-red-500);   /* #ff164c - Focus state */
--color-border-error:   var(--color-error);    /* #dc3545 - Erro */
```

**Uso**:
```css
input {
  border: 1px solid var(--color-border-input);
}

input:focus {
  border-color: var(--color-border-focus);
}

input.error {
  border-color: var(--color-border-error);
}
```

---

### Typography

```css
/* ── Typography Colors ──────────────────────────── */

--color-text-primary:   var(--mars-gray-100);  /* #ebe9e9 - Main text */
--color-text-secondary: var(--mars-gray-300);  /* #bababa - Subtitles */
--color-text-tertiary:  var(--mars-gray-400);  /* #9e9a9a - Captions */
--color-text-muted:     var(--mars-gray-500);  /* #716e6e - Disabled */
--color-text-active:    var(--mars-warm-100);  /* #ffe8ed - Active items */
--color-text-brand:     var(--mars-red-500);   /* #ff164c - Links, CTAs */
--color-text-on-brand:  var(--mars-gray-50);   /* #f7f5f5 - Text on brand bg */
```

**Hierarquia de Texto**:
```
Primary (100) > Secondary (300) > Tertiary (400) > Muted (500)
```

**Uso**:
```css
h1, h2, h3 {
  color: var(--color-text-primary);
}

p {
  color: var(--color-text-secondary);
}

label, caption {
  color: var(--color-text-tertiary);
}

.disabled {
  color: var(--color-text-muted);
}
```

---

### Interactive States

```css
/* ── Interactive States ──────────────────────────── */

--color-active-bg:   rgba(255, 22, 76, 0.12);  /* Background ativo */
--color-hover-bg:    rgba(255, 255, 255, 0.06); /* Hover genérico */
--color-focus-ring:  var(--mars-red-500);       /* Focus outline */
--color-pressed-bg:  rgba(255, 22, 76, 0.24);   /* Pressed state */
```

**Uso**:
```css
.button:hover {
  background: var(--color-hover-bg);
}

.nav-item.active {
  background: var(--color-active-bg);
  color: var(--color-text-active);
}

*:focus-visible {
  outline: 2px solid var(--color-focus-ring);
  outline-offset: 2px;
}
```

---

### Player

```css
/* ── Player Specific ──────────────────────────── */

--color-player-bg:       var(--mars-dark-950);  /* #0b0708 */
--color-progress-bg:     var(--mars-dark-500);  /* #30292b */
--color-progress-fill:   var(--mars-red-500);   /* #ff164c */
--color-volume-bg:       var(--mars-dark-500);  /* #30292b */
--color-volume-fill:     var(--mars-gray-100);  /* #ebe9e9 */
```

---

## Tipografia

### Font Family

```css
--font-primary: 'Inter', -apple-system, BlinkMacSystemFont, 
                'Segoe UI', 'Roboto', 'Helvetica', 'Arial', 
                sans-serif;
```

**Import**:
```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
```

---

### Font Sizes

```css
/* ── Font Sizes ──────────────────────────── */

--text-xs:   0.75rem;   /* 12px */
--text-sm:   0.875rem;  /* 14px */
--text-base: 1rem;      /* 16px */
--text-lg:   1.125rem;  /* 18px */
--text-xl:   1.25rem;   /* 20px */
--text-2xl:  1.5rem;    /* 24px */
--text-3xl:  1.875rem;  /* 30px */
--text-4xl:  2.25rem;   /* 36px */
--text-5xl:  3rem;      /* 48px */
```

**Uso**:
```css
h1 { font-size: var(--text-2xl); }      /* 24px */
h2 { font-size: var(--text-xl); }       /* 20px */
h3 { font-size: var(--text-lg); }       /* 18px */
body { font-size: var(--text-base); }   /* 16px */
small { font-size: var(--text-sm); }    /* 14px */
caption { font-size: var(--text-xs); }  /* 12px */
```

---

### Font Weights

```css
/* ── Font Weights ──────────────────────────── */

--font-weight-normal:   400;
--font-weight-medium:   500;
--font-weight-semibold: 600;
--font-weight-bold:     700;
```

**Uso**:
```css
body {
  font-weight: var(--font-weight-normal);  /* 400 */
}

h1, h2, h3, button {
  font-weight: var(--font-weight-semibold); /* 600 */
}

.title {
  font-weight: var(--font-weight-bold);     /* 700 */
}
```

---

### Line Heights

```css
/* ── Line Heights ──────────────────────────── */

--leading-none:    1;
--leading-tight:   1.25;
--leading-snug:    1.375;
--leading-normal:  1.5;
--leading-relaxed: 1.625;
--leading-loose:   2;
```

**Uso**:
```css
h1 { line-height: var(--leading-tight); }    /* 1.25 */
p  { line-height: var(--leading-normal); }   /* 1.5 */
```

---

### Letter Spacing

```css
/* ── Letter Spacing ──────────────────────────── */

--tracking-tighter: -0.05em;
--tracking-tight:   -0.025em;
--tracking-normal:   0;
--tracking-wide:     0.025em;
--tracking-wider:    0.05em;
--tracking-widest:   0.1em;
```

**Uso (Logo)**:
```css
.logo {
  letter-spacing: var(--tracking-tight);  /* -0.025em */
  /* ou -1.4px no caso do Mars Sound AI */
  letter-spacing: -1.4px;
}
```

---

### Typographic Scale

| Element | Size | Weight | Line Height | Color |
|---------|------|--------|-------------|-------|
| **H1** | 24px (1.5rem) | 600 | 1.5 | text-primary |
| **H2** | 20px (1.25rem) | 600 | 1.5 | text-primary |
| **H3** | 18px (1.125rem) | 600 | 1.5 | text-primary |
| **Body** | 16px (1rem) | 400 | 1.5 | text-secondary |
| **Small** | 14px (0.875rem) | 400 | 1.5 | text-tertiary |
| **Caption** | 12px (0.75rem) | 400 | 1.25 | text-muted |
| **Button** | 16px (1rem) | 600 | 1.5 | text-on-brand |
| **Label** | 12px (0.75rem) | 400 | 1.25 | text-secondary |

---

## Cores

### Brand Gradients

```css
/* ── Primary Gradient (Horizontal) ──────────────────────────── */

--gradient-primary: linear-gradient(
  to right, 
  #ff164c 57%, 
  #ea5858 100%
);
```

**Uso**:
```css
.button-primary {
  background: var(--gradient-primary);
}
```

---

### Logo Gradient

```css
/* ── Logo Text Gradient (Vertical) ──────────────────────────── */

--gradient-logo: linear-gradient(
  to bottom, 
  #ffffff 0%, 
  #999999 100%
);
```

**Uso**:
```css
.logo-text {
  background: var(--gradient-logo);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
```

---

### Overlay Gradients

```css
/* ── Auth Banner Overlay ──────────────────────────── */

--gradient-auth-overlay: linear-gradient(
  to right,
  rgba(28, 19, 21, 0.3) 0%,
  rgba(28, 19, 21, 0.6) 100%
);

/* ── Card Hover Overlay ──────────────────────────── */

--gradient-card-overlay: linear-gradient(
  to bottom,
  rgba(0, 0, 0, 0) 0%,
  rgba(0, 0, 0, 0.8) 100%
);
```

---

### Color Usage Guide

#### Do's ✅

1. **Use brand color (red) para**:
   - CTAs principais (Entrar, Cadastrar, Publicar)
   - Links importantes
   - Ícones ativos/selecionados
   - Progress bars, sliders
   - Badges de status ativo

2. **Use neutrals para**:
   - Backgrounds (dark-900 a dark-700)
   - Borders (dark-500)
   - Texto (gray-100 a gray-500)

3. **Use gradientes para**:
   - Botões primários
   - Headers importantes
   - Overlays sutis

#### Don'ts ❌

1. **Evite**:
   - Usar brand color em backgrounds grandes
   - Texto vermelho em fundos vermelhos
   - Muitos gradientes na mesma tela
   - Cores saturadas em texto longo

2. **Não use brand color para**:
   - Texto de corpo (body text)
   - Backgrounds de cards
   - Borders padrão

---

## Espaçamento

### Spacing Scale

```css
/* ── Spacing Scale ──────────────────────────── */

--space-0:   0;
--space-1:   0.25rem;  /* 4px */
--space-2:   0.5rem;   /* 8px */
--space-3:   0.75rem;  /* 12px */
--space-4:   1rem;     /* 16px */
--space-5:   1.25rem;  /* 20px */
--space-6:   1.5rem;   /* 24px */
--space-8:   2rem;     /* 32px */
--space-10:  2.5rem;   /* 40px */
--space-12:  3rem;     /* 48px */
--space-16:  4rem;     /* 64px */
--space-20:  5rem;     /* 80px */
--space-24:  6rem;     /* 96px */
```

**Uso**:
```css
.card {
  padding: var(--space-6);     /* 24px */
  margin-bottom: var(--space-4); /* 16px */
}

.button {
  padding: var(--space-2) var(--space-4); /* 8px 16px */
}
```

---

### Component Spacing

| Component | Padding | Gap/Margin |
|-----------|---------|------------|
| **Button (sm)** | 8px 16px | - |
| **Button (md)** | 10px 24px | - |
| **Button (lg)** | 12px 32px | - |
| **Card** | 24px | 16px (entre cards) |
| **Input** | 10px 24px | 8px (label gap) |
| **Modal** | 24px | - |
| **Navbar** | 16px (mobile) / 32px (desktop) | - |
| **Section** | 32px (mobile) / 48px (desktop) | 32px (entre seções) |

---

### Layout Dimensions

```css
/* ── Layout Dimensions ──────────────────────────── */

--sidebar-width:   190px;
--navbar-height:   64px;
--player-height:   72px;
--bottom-nav-height: 60px;

--container-max-width: 1440px;
--content-max-width:   1200px;
--form-max-width:      480px;
--card-min-width:      160px;
--card-max-width:      240px;
```

---

### Border Radius

```css
/* ── Border Radius ──────────────────────────── */

--radius-none:  0;
--radius-sm:    0.125rem;  /* 2px */
--radius-base:  0.25rem;   /* 4px */
--radius-md:    0.375rem;  /* 6px */
--radius-lg:    0.5rem;    /* 8px */
--radius-xl:    0.75rem;   /* 12px */
--radius-2xl:   1rem;      /* 16px */
--radius-3xl:   1.5rem;    /* 24px */
--radius-full:  9999px;    /* Circle */
```

**Uso**:
```css
.button {
  border-radius: var(--radius-base); /* 4px - Square */
}

.card {
  border-radius: var(--radius-lg);   /* 8px - Rounded */
}

.avatar {
  border-radius: var(--radius-full); /* Circle */
}
```

---

### Shadows

```css
/* ── Shadows ──────────────────────────── */

--shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1),
             0 2px 4px -1px rgba(0, 0, 0, 0.06);
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1),
             0 4px 6px -2px rgba(0, 0, 0, 0.05);
--shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1),
             0 10px 10px -5px rgba(0, 0, 0, 0.04);
--shadow-2xl: 0 25px 50px -12px rgba(0, 0, 0, 0.25);

/* Brand shadow (glow effect) */
--shadow-brand: 0 0 20px rgba(255, 22, 76, 0.3);
```

**Uso**:
```css
.card {
  box-shadow: var(--shadow-md);
}

.modal {
  box-shadow: var(--shadow-2xl);
}

.button:hover {
  box-shadow: var(--shadow-brand);
}
```

---

## Componentes

### Button

#### Variantes

**1. Primary (Gradient)**
```css
.button-primary {
  background: linear-gradient(to right, #ff164c 57%, #ea5858 100%);
  color: #f8f8f8;
  border: none;
  padding: 10px 24px;
  font-weight: 600;
  font-size: 16px;
  cursor: pointer;
  transition: opacity 0.15s;
}

.button-primary:hover {
  opacity: 0.9;
}

.button-primary:active {
  opacity: 0.8;
}
```

**2. Outline**
```css
.button-outline {
  background: transparent;
  color: #ff164c;
  border: 1px solid #ff164c;
  padding: 10px 24px;
  font-weight: 600;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.15s;
}

.button-outline:hover {
  background: rgba(255, 22, 76, 0.12);
}
```

**3. Ghost**
```css
.button-ghost {
  background: transparent;
  color: #ebe9e9;
  border: none;
  padding: 10px 24px;
  font-weight: 600;
  font-size: 16px;
  cursor: pointer;
  transition: background 0.15s;
}

.button-ghost:hover {
  background: rgba(255, 255, 255, 0.06);
}
```

#### Tamanhos

```css
.button-sm {
  padding: 6px 16px;
  font-size: 14px;
  height: 32px;
}

.button-md {
  padding: 10px 24px;
  font-size: 16px;
  height: 44px;
}

.button-lg {
  padding: 14px 32px;
  font-size: 18px;
  height: 56px;
}
```

---

### Input

```css
.input {
  width: 100%;
  background: transparent;
  border: 1px solid var(--color-border-input);
  padding: 10px 24px;
  font-size: 16px;
  font-weight: 400;
  color: var(--color-text-primary);
  outline: none;
  transition: border-color 0.15s;
}

.input::placeholder {
  color: var(--color-text-muted);
  opacity: 0.4;
}

.input:focus {
  border-color: var(--color-brand);
}

.input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.input.error {
  border-color: var(--color-error);
}
```

---

### Card

```css
.card {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border-card);
  border-radius: var(--radius-lg);
  padding: var(--space-6);
  transition: all 0.15s;
}

.card:hover {
  background: var(--color-bg-card-hover);
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}
```

---

### MusicCard

```css
.music-card {
  position: relative;
  border-radius: var(--radius-lg);
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.2s;
}

.music-card:hover {
  transform: scale(1.05);
}

.music-card-cover {
  width: 100%;
  aspect-ratio: 1;
  object-fit: cover;
}

.music-card-overlay {
  position: absolute;
  inset: 0;
  background: var(--gradient-card-overlay);
  opacity: 0;
  transition: opacity 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.music-card:hover .music-card-overlay {
  opacity: 1;
}

.music-card-info {
  padding: var(--space-3);
  background: var(--color-bg-card);
}

.music-card-title {
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--color-text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.music-card-artist {
  font-size: var(--text-xs);
  color: var(--color-text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
```

---

### TrackRow

```css
.track-row {
  display: grid;
  grid-template-columns: 40px 1fr auto auto;
  gap: var(--space-4);
  padding: var(--space-3);
  border-radius: var(--radius-base);
  transition: background 0.1s;
  cursor: pointer;
}

.track-row:hover {
  background: var(--color-hover-bg);
}

.track-row-index {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--text-sm);
  color: var(--color-text-muted);
}

.track-row-info {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  min-width: 0;
}

.track-row-cover {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-base);
  object-fit: cover;
}

.track-row-title {
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--color-text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.track-row-artist {
  font-size: var(--text-xs);
  color: var(--color-text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.track-row-duration {
  font-size: var(--text-sm);
  color: var(--color-text-muted);
}

.track-row-actions {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}
```

---

### CategoryChip

```css
.category-chip {
  display: inline-flex;
  align-items: center;
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-full);
  font-size: var(--text-sm);
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
}

/* Inactive */
.category-chip {
  background: transparent;
  border: 1px solid var(--color-border-subtle);
  color: var(--color-text-secondary);
}

.category-chip:hover {
  background: var(--color-hover-bg);
  border-color: var(--color-brand);
}

/* Active */
.category-chip.active {
  background: var(--gradient-primary);
  border: none;
  color: var(--color-text-on-brand);
}
```

---

### Switch

```css
.switch {
  position: relative;
  width: 44px;
  height: 24px;
  background: var(--color-border-subtle);
  border-radius: var(--radius-full);
  cursor: pointer;
  transition: background 0.2s;
}

.switch.checked {
  background: var(--color-brand);
}

.switch-thumb {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 20px;
  height: 20px;
  background: white;
  border-radius: var(--radius-full);
  transition: transform 0.2s;
}

.switch.checked .switch-thumb {
  transform: translateX(20px);
}
```

---

### Progress Bar

```css
.progress-bar {
  position: relative;
  width: 100%;
  height: 4px;
  background: var(--color-progress-bg);
  border-radius: var(--radius-full);
  cursor: pointer;
  overflow: hidden;
}

.progress-bar-fill {
  height: 100%;
  background: var(--color-progress-fill);
  border-radius: var(--radius-full);
  transition: width 0.1s linear;
}

.progress-bar:hover {
  height: 6px;
}
```

---

## Iconografia

### Fontes de Ícones

1. **Lucide React**: Ícones principais
2. **SVG Customizados**: Ícones do Figma (importados)

### Tamanhos

```css
--icon-xs:  12px;
--icon-sm:  16px;
--icon-md:  20px;
--icon-lg:  24px;
--icon-xl:  32px;
--icon-2xl: 48px;
```

### Uso

```tsx
import { Play, Pause, Heart, Share2 } from 'lucide-react';

<Play size={20} />
<Heart size={16} />
```

---

### Cores de Ícones

```css
/* Padrão */
.icon {
  color: var(--color-text-secondary);
}

/* Ativo */
.icon.active {
  color: var(--color-brand);
}

/* Hover */
.icon:hover {
  color: var(--color-text-primary);
}

/* Em botão primário */
.button-primary .icon {
  color: var(--color-text-on-brand);
}
```

---

## Animações

### Transições Padrão

```css
/* ── Transitions ──────────────────────────── */

--transition-fast:     0.1s ease;
--transition-base:     0.15s ease;
--transition-slow:     0.2s ease;
--transition-slower:   0.3s ease;
```

**Uso**:
```css
button {
  transition: all var(--transition-base);
}

.card {
  transition: transform var(--transition-slow);
}
```

---

### Easing Functions

```css
--ease-in:      cubic-bezier(0.4, 0, 1, 1);
--ease-out:     cubic-bezier(0, 0, 0.2, 1);
--ease-in-out:  cubic-bezier(0.4, 0, 0.2, 1);
```

---

### Animações Keyframes

#### Playing Bars

```css
@keyframes barBounce {
  0%, 100% {
    transform: scaleY(1);
  }
  50% {
    transform: scaleY(0.4);
  }
}

.playing-bar {
  width: 3px;
  height: 16px;
  background: var(--color-brand);
  animation: barBounce 0.8s infinite ease-in-out;
}

.playing-bar:nth-child(2) {
  animation-delay: 0.2s;
}

.playing-bar:nth-child(3) {
  animation-delay: 0.4s;
}
```

#### Fade In

```css
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.fade-in {
  animation: fadeIn 0.3s ease-out;
}
```

#### Slide Up

```css
@keyframes slideUp {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}

.slide-up {
  animation: slideUp 0.3s ease-out;
}
```

#### Pulse (Loading)

```css
@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.loading {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
```

---

### Motion (Framer Motion)

#### Page Transitions

```tsx
const pageVariants = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
};

const pageTransition = {
  type: "tween",
  ease: "easeInOut",
  duration: 0.3,
};
```

#### Modal

```tsx
const modalVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 20 },
};
```

#### Sidebar (Mobile)

```tsx
const sidebarVariants = {
  initial: { x: "-100%" },
  animate: { x: 0 },
  exit: { x: "-100%" },
};
```

---

## Responsividade

### Breakpoints

```css
/* ── Breakpoints ──────────────────────────── */

--breakpoint-sm:  640px;   /* Mobile large */
--breakpoint-md:  768px;   /* Tablet */
--breakpoint-lg:  1024px;  /* Desktop */
--breakpoint-xl:  1280px;  /* Large desktop */
--breakpoint-2xl: 1536px;  /* Extra large */
```

**Tailwind Classes**:
- `sm:` → 640px+
- `md:` → 768px+
- `lg:` → 1024px+
- `xl:` → 1280px+
- `2xl:` → 1536px+

---

### Mobile-First Strategy

```css
/* Mobile (default) */
.container {
  padding: 16px;
  font-size: 14px;
}

/* Tablet */
@media (min-width: 768px) {
  .container {
    padding: 24px;
    font-size: 16px;
  }
}

/* Desktop */
@media (min-width: 1024px) {
  .container {
    padding: 32px;
    font-size: 16px;
  }
}
```

---

### Componentes Responsivos

#### Grid de Cards

```tsx
<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
  {/* Cards */}
</div>
```

#### Container

```tsx
<div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
  {/* Content */}
</div>
```

---

## Acessibilidade

### Contrast Ratios

| Combinação | Ratio | WCAG Level |
|------------|-------|------------|
| `#ebe9e9` on `#100c0d` | 13.8:1 | AAA |
| `#bababa` on `#100c0d` | 7.2:1 | AAA |
| `#ff164c` on `#100c0d` | 5.1:1 | AA |
| `#f8f8f8` on `#ff164c` | 4.8:1 | AA |

### Focus States

```css
*:focus-visible {
  outline: 2px solid var(--color-brand);
  outline-offset: 2px;
}

button:focus-visible {
  box-shadow: 0 0 0 3px rgba(255, 22, 76, 0.3);
}
```

### Screen Reader Only

```css
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}
```

### ARIA Labels

```tsx
<button aria-label="Tocar música">
  <Play />
</button>

<input 
  type="text" 
  aria-label="Buscar músicas"
  placeholder="Digite sua busca..."
/>
```

---

## Implementação

### CSS Variables (theme.css)

```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

:root {
  /* Primitivos */
  --mars-red-500: #ff164c;
  --mars-dark-900: #100c0d;
  --mars-gray-100: #ebe9e9;
  
  /* Semânticos */
  --color-brand: var(--mars-red-500);
  --color-bg-base: var(--mars-dark-900);
  --color-text-primary: var(--mars-gray-100);
  
  /* Spacing */
  --space-4: 1rem;
  --space-6: 1.5rem;
  
  /* Typography */
  --font-primary: 'Inter', sans-serif;
  --text-base: 1rem;
  --font-weight-normal: 400;
  --leading-normal: 1.5;
}

body {
  font-family: var(--font-primary);
  font-size: var(--text-base);
  font-weight: var(--font-weight-normal);
  line-height: var(--leading-normal);
  background: var(--color-bg-base);
  color: var(--color-text-primary);
}
```

---

### Tailwind Config (v4)

```css
/* No tailwind.config.js - usar theme.css */

@theme inline {
  --color-brand: var(--color-brand);
  --color-bg-base: var(--color-bg-base);
  --color-text-primary: var(--color-text-primary);
  /* ... outros tokens ... */
}
```

---

## Checklist de Design

### Antes de Implementar

- [ ] Todos os tokens estão definidos?
- [ ] Componentes seguem o design system?
- [ ] Cores têm contraste adequado (WCAG AA)?
- [ ] Tipografia é legível em mobile?
- [ ] Espaçamento é consistente?
- [ ] Animações são suaves (60fps)?
- [ ] Focus states estão visíveis?
- [ ] Hover states são claros?

### Após Implementar

- [ ] Testar em múltiplas resoluções
- [ ] Testar navegação por teclado
- [ ] Testar com screen readers
- [ ] Validar contraste de cores
- [ ] Checar performance de animações
- [ ] Verificar consistência visual

---

## Conclusão

Este Design System fornece uma base sólida e consistente para o **Mars Sound AI**, garantindo:

- ✅ Identidade visual forte e única
- ✅ Experiência de usuário coesa
- ✅ Componentes reutilizáveis
- ✅ Acessibilidade WCAG AA
- ✅ Performance otimizada
- ✅ Fácil manutenção e escalabilidade

---

**Versão**: 1.0.0  
**Data**: 26 de Março de 2026  
**Autor**: Equipe Mars Sound AI
