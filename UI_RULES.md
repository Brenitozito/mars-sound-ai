# Regras de UI/UX - Mars Sound AI

## Hierarquia de Layout (Auto Layout)

### Estrutura Principal

```
Root Container (h-screen, relative)
├── Background Image (z-0, fixed)
├── Horizontal Layout Container (z-10, flex)
│   ├── Sidebar (Left - Fixed Width, shrink-0)
│   │   ├── Logo (h-80px, shrink-0)
│   │   └── Navigation (flex-1, overflow-y-auto)
│   └── Main Content (Right - Fill Container, flex-1)
│       ├── Navbar (Top - Fill Width)
│       └── Body (Scrollable Content - Fill Container, overflow-y-auto)
├── Bottom Navigation (z-50, fixed, mobile only)
└── Music Player (z-100, fixed, absolute position)
```

### Comportamento Responsivo

**Desktop (lg):**

- Sidebar: Posição relativa (parte do flex layout), largura fixa, height 100%
- Main Content: Preenche o espaço restante (flex-1)
- Bottom Nav: Oculto

**Mobile:**

- Sidebar: Posição fixa com animação de slide (translate-x)
- Main Content: Ocupa 100% da largura
- Bottom Nav: Visível, fixo no rodapé (acima do player)

### Z-Index Hierarchy

- Background: z-0
- Main Layout: z-10
- Mobile Overlay (Sidebar): z-40
- Sidebar Mobile: z-50
- Bottom Nav: z-50
- Music Player: z-100 (Top Layer - sobrepõe tudo)

## Scroll Behavior

### Barras de Scroll Vertical

- ❌ **NUNCA** exibir barras de scroll vertical visíveis em nenhum lugar da aplicação
- ✅ Manter a funcionalidade de scroll (usuário pode scrollar com mouse/touch)
- ✅ Esconder as barras de scroll usando CSS (`scrollbar-width: none` e `::-webkit-scrollbar`)

### Scroll Horizontal

- ✅ Permitido para carrosséis de conteúdo
- ✅ Usar em seções de capas de música e cards
- ✅ Responsivo: permite scroll horizontal quando o conteúdo não cabe na tela

### Implementação CSS

```css
/* Esconder scrollbar mas manter funcionalidade */
.scroll-container {
  overflow-y: auto;
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE/Edge */
}

.scroll-container::-webkit-scrollbar {
  display: none; /* Chrome/Safari/Opera */
}
```

## Carrosséis de Música

- Todas as seções de capas de música devem ser carrosséis
- Scroll horizontal suave quando necessário
- Adaptável ao tamanho da tela

## Clip Content

- Áreas de scroll devem ter `overflow` configurado corretamente
- Conteúdo não deve "vazar" para fora dos containers
- Body principal: `overflow-y-auto` com `scrollbar-hide`
- Carrosséis: `overflow-x-auto` com `scrollbar-hide`

## Components

- Agora que temos toda tela criada da home você precisa entender os componentes individuais e criar um banco de componentes reaproveitáveis, botões, variantes de botões, search, capas de músicas, player de música ou seja, o nosso sistema é feito em components e sempre que você for criar um novo, deve olhar o banco de components e ver se já existe e reaproveitar ou criar uma variação a partir de um já criado, nunca deve criar um component do zero e esquecer dessa regra.