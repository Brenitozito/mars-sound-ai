import type { Plugin } from 'vite'
import { ROUTE_PATTERNS, ROUTES } from '../src/app/routes/paths'

const PUBLIC_PATHS: readonly string[] = [ROUTES.signIn]

// Rotas autenticadas não têm conteúdo indexável (o crawler só veria o redirecionamento para o login).
const PRIVATE_PATH_PREFIXES: readonly string[] = [
  ...Object.values(ROUTES).filter((route) => route !== ROUTES.home && !PUBLIC_PATHS.includes(route)),
  ROUTE_PATTERNS.publicProfile.split(':')[0],
]

function normalizeSiteUrl(siteUrl: string | undefined): string | null {
  const trimmedUrl = siteUrl?.trim()
  if (!trimmedUrl) return null
  try {
    return new URL(trimmedUrl).origin
  } catch {
    throw new Error(`VITE_SITE_URL inválida: "${trimmedUrl}". Use uma URL absoluta, ex.: https://marssound.ai`)
  }
}

function buildRobotsTxt(siteOrigin: string | null): string {
  const lines = [
    'User-agent: *',
    ...PUBLIC_PATHS.map((publicPath) => `Allow: ${publicPath}`),
    ...PRIVATE_PATH_PREFIXES.map((privatePath) => `Disallow: ${privatePath}`),
  ]
  if (siteOrigin) lines.push('', `Sitemap: ${siteOrigin}/sitemap.xml`)
  return `${lines.join('\n')}\n`
}

function buildSitemapXml(siteOrigin: string): string {
  const urls = PUBLIC_PATHS.map((publicPath) => `  <url><loc>${siteOrigin}${publicPath}</loc></url>`)
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls,
    '</urlset>',
    '',
  ].join('\n')
}

/** Gera `robots.txt` sempre e `sitemap.xml` apenas quando a URL pública do site é conhecida. */
export function seoFiles(siteUrl: string | undefined): Plugin {
  const siteOrigin = normalizeSiteUrl(siteUrl)
  const files = new Map<string, { contentType: string; content: string }>([
    ['/robots.txt', { contentType: 'text/plain; charset=utf-8', content: buildRobotsTxt(siteOrigin) }],
  ])
  if (siteOrigin) {
    files.set('/sitemap.xml', { contentType: 'application/xml; charset=utf-8', content: buildSitemapXml(siteOrigin) })
  }

  return {
    name: 'seo-files',
    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        const file = request.url ? files.get(request.url.split('?')[0]) : undefined
        if (!file) return next()
        response.setHeader('Content-Type', file.contentType)
        response.end(file.content)
      })
    },
    generateBundle() {
      files.forEach(({ content }, filePath) => {
        this.emitFile({ type: 'asset', fileName: filePath.slice(1), source: content })
      })
    },
  }
}
