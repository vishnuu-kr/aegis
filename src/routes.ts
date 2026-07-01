export const STUB_ROUTES = [
  'case-studies',
  'blog',
  'research',
  'terms',
  'privacy',
  'data-tos',
] as const

export type StubSlug = (typeof STUB_ROUTES)[number]

export const isAppHash = () => window.location.hash.startsWith('#/app')

// Support page (standalone) is reachable at #/support. The #/app/support
// route now falls through to isAppHash() so the Dashboard shell renders the
// redesigned in-app support view instead.
export const isSupportHash = () =>
  window.location.hash === '#/support'

export const readStubSlug = (): StubSlug | null => {
  const slug = window.location.hash.replace(/^#\//, '').trim()
  return (STUB_ROUTES as readonly string[]).includes(slug) ? (slug as StubSlug) : null
}
