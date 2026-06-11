'use client'
import { useEffect, useState, useCallback, useRef, Suspense, useLayoutEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import ProductCard from '@/components/shop/ProductCard'

// ── Types ──────────────────────────────────────────────────────────────────
interface Category {
  id: string
  name: string
  slug: string
  emoji: string | null
  parentId: string | null
  sortOrder: number
  _count: { products: number }
  children?: Category[]
}

interface Product {
  id: string; name: string; slug: string; brand: string; emoji: string
  bgGradient: string | null; price: number; comparePrice: number | null
  unit: string; moq: number; stock: number; badge: string | null
  description: string; details: Record<string, string>
  images?: string[]
  category: { name: string; slug: string }
}

// ── Kategorie-Bilder (gleiche Assets wie Startseiten-Markenkarten) ─────────
const CATEGORY_IMAGES: Record<string, { img: string; bg: string }> = {
  'bubble-tea':  { img: 'https://cdn.shopify.com/s/files/1/0769/8520/5054/files/9690ED77-8273-4F9F-B137-9A7A55D5A6B7.jpg?v=1736538559', bg: '#0c1f3a' },
  'teaballs':    { img: 'https://cdn.shopify.com/s/files/1/0368/6150/9769/files/TEABALLS_Hibiskus_Flasche.png?v=1762428964', bg: '#0e1f0e' },
  'patislove':   { img: 'https://cdn.shopify.com/s/files/1/0763/2302/9259/files/Untitleddesign_49.webp?v=1759780663', bg: '#1e0f00' },
  'the-mallows': { img: 'https://cdn.shopify.com/s/files/1/0763/2302/9259/files/43f6ead8336003ff8d56a822586ec842d1058f18327592c95d20214258a85e9b.jpg?v=1765704974', bg: '#1a0c1a' },
}

// ── Constants ──────────────────────────────────────────────────────────────
const PAGE_SIZE     = 200   // products per page (high for fast browsing)
const PREVIEW_SIZE  = 12    // products shown per subcategory in parent view

const SORT_OPTIONS = [
  { value: 'default',    label: 'Standard' },
  { value: 'price-asc',  label: 'Preis ↑' },
  { value: 'price-desc', label: 'Preis ↓' },
  { value: 'name',       label: 'A–Z' },
]

// ── Helpers ────────────────────────────────────────────────────────────────
function buildCategoryTree(flat: Category[]): Category[] {
  const roots: Category[] = []
  const map = new Map(flat.map(c => [c.id, { ...c, children: [] as Category[] }]))
  for (const c of Array.from(map.values())) {
    if (c.parentId) map.get(c.parentId)?.children?.push(c)
    else roots.push(c)
  }
  return roots.sort((a, b) => a.sortOrder - b.sortOrder)
}

function totalProducts(cat: Category): number {
  return cat._count.products + (cat.children ?? []).reduce((s, c) => s + c._count.products, 0)
}

function findCategory(cats: Category[], slug: string): Category | undefined {
  for (const c of cats) {
    if (c.slug === slug) return c
    const found = findCategory(c.children ?? [], slug)
    if (found) return found
  }
}

function findParentOf(cats: Category[], slug: string): Category | undefined {
  for (const c of cats) {
    if ((c.children ?? []).some(ch => ch.slug === slug)) return c
    const found = findParentOf(c.children ?? [], slug)
    if (found) return found
  }
}

function sortProducts(prods: Product[], sort: string): Product[] {
  if (sort === 'price-asc')  return [...prods].sort((a, b) => a.price - b.price)
  if (sort === 'price-desc') return [...prods].sort((a, b) => b.price - a.price)
  if (sort === 'name')       return [...prods].sort((a, b) => a.name.localeCompare(b.name))
  return prods
}

// ── Main Component ─────────────────────────────────────────────────────────
function ProductsContent() {
  const searchParams      = useSearchParams()
  const router            = useRouter()
  const { data: session } = useSession()
  const approved          = session?.user?.status === 'APPROVED'

  const categorySlug = searchParams.get('category') ?? 'all'

  const [allCategories, setAllCategories] = useState<Category[]>([])
  const [tree, setTree]                   = useState<Category[]>([])

  // Leaf / search view state — paginated
  const [products, setProducts]   = useState<Product[]>([])
  const [total, setTotal]         = useState(0)
  const [page, setPage]           = useState(1)
  const [loadingMore, setLoadingMore] = useState(false)

  // Parent view state — one preview list per subcategory
  const [subPreviews, setSubPreviews] = useState<Record<string, Product[]>>({})

  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [sort, setSort]           = useState('default')

  const sentinelRef = useRef<HTMLDivElement>(null)
  const loadMoreRef = useRef<HTMLDivElement>(null) // kept for compat

  // Load categories once
  useEffect(() => {
    fetch('/api/categories')
      .then(r => r.json())
      .then((cats: Category[]) => {
        setAllCategories(cats)
        setTree(buildCategoryTree(cats))
      })
  }, [])

  // Reset when category changes
  useEffect(() => {
    setSearch('')
    setSearchInput('')
    setProducts([])
    setSubPreviews({})
    setPage(1)
    setTotal(0)
  }, [categorySlug])

  // cash-carry is a virtual category (not in DB tree) — treat as leaf
  const VIRTUAL_CATS: Record<string, { name: string; emoji: string }> = {
    'cash-carry': { name: 'Cash & Carry', emoji: '🇮🇹' },
  }
  const isVirtual   = categorySlug in VIRTUAL_CATS
  const currentCat  = isVirtual
    ? { id: categorySlug, name: VIRTUAL_CATS[categorySlug].name, slug: categorySlug, emoji: VIRTUAL_CATS[categorySlug].emoji, parentId: null, sortOrder: 99, _count: { products: 0 }, children: [] }
    : (categorySlug !== 'all' ? findCategory(tree, categorySlug) : undefined)
  const parentCat  = !isVirtual && categorySlug !== 'all' ? findParentOf(tree, categorySlug) : undefined
  const isParent   = !isVirtual && (currentCat?.children?.length ?? 0) > 0
  const isLeaf     = isVirtual || (!!currentCat && !isParent)
  const isAll      = categorySlug === 'all'

  // ── Fetch a page of products for leaf / search ──────────────────────────
  const fetchPage = useCallback(async (pageNum: number, reset: boolean) => {
    if (isAll && !search) { setLoading(false); return }
    if (isParent && !search) return // handled separately

    if (reset) setLoading(true)
    else       setLoadingMore(true)

    const params = new URLSearchParams()
    // cash-carry is a virtual category — pass supplier filter instead of category
    if (categorySlug === 'cash-carry') {
      params.set('supplier', 'migroweb')
    } else if (categorySlug !== 'all') {
      params.set('category', categorySlug)
    }
    if (search)                 params.set('search', search)
    params.set('limit', String(PAGE_SIZE))
    params.set('page', String(pageNum))

    const res  = await fetch(`/api/products?${params}`)
    const data = await res.json()
    const prods: Product[] = data.products ?? []

    setTotal(data.total ?? 0)
    setProducts(prev => reset ? prods : [...prev, ...prods])

    if (reset) setLoading(false)
    else       setLoadingMore(false)
  }, [categorySlug, search, isAll, isParent])

  // Fetch page 1 whenever category/search changes
  useEffect(() => {
    setPage(1)
    fetchPage(1, true)
  }, [fetchPage])

  // ── Fetch subcategory previews for parent view ──────────────────────────
  useEffect(() => {
    if (!isParent || search) return
    if (!currentCat?.children?.length) return

    setLoading(true)
    setSubPreviews({})

    const subs = currentCat.children

    Promise.all(
      subs.map(async sub => {
        const params = new URLSearchParams({
          category: sub.slug,
          limit:    String(PREVIEW_SIZE),
          page:     '1',
        })
        const res  = await fetch(`/api/products?${params}`)
        const data = await res.json()
        return { slug: sub.slug, prods: (data.products ?? []) as Product[] }
      })
    ).then(results => {
      const map: Record<string, Product[]> = {}
      results.forEach(r => { map[r.slug] = r.prods })
      setSubPreviews(map)
      setLoading(false)
    })
  }, [isParent, currentCat, search])

  // ── Load more (pagination) ──────────────────────────────────────────────
  const loadMore = useCallback(() => {
    const nextPage = page + 1
    setPage(nextPage)
    fetchPage(nextPage, false)
  }, [page, fetchPage])

  const navigate = (slug: string) => {
    router.push(slug === 'all' ? '/products' : `/products?category=${slug}`)
  }

  const hasMore = products.length > 0 && products.length < total
  const loadingMoreRef = useRef(loadingMore)
  const hasMoreRef     = useRef(hasMore)
  useEffect(() => { loadingMoreRef.current = loadingMore }, [loadingMore])
  useEffect(() => { hasMoreRef.current = hasMore }, [hasMore])

  // ── Infinite scroll via IntersectionObserver ────────────────────────────
  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMoreRef.current && !loadingMoreRef.current) {
          setPage(prev => {
            const next = prev + 1
            fetchPage(next, false)
            return next
          })
        }
      },
      { rootMargin: '400px' } // trigger 400px before bottom
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [fetchPage])

  // Apply sort client-side (only affects currently loaded items)
  const sorted = sortProducts(products, sort)

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <>
      <Header />
      <main style={{ minHeight: '80vh', background: 'var(--cream)' }}>

        {/* ── Page header ── */}
        <div className="page-header">
          <div style={{ maxWidth: 1280, margin: '0 auto' }}>
            {/* Breadcrumb */}
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,.6)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <span style={{ cursor: 'pointer', textDecoration: 'underline' }} onClick={() => navigate('all')}>Alle Produkte</span>
              {parentCat && <>
                <span>›</span>
                <span style={{ cursor: 'pointer', textDecoration: 'underline' }} onClick={() => navigate(parentCat.slug)}>
                  {parentCat.emoji} {parentCat.name}
                </span>
              </>}
              {currentCat && <>
                <span>›</span>
                <span>{currentCat.emoji} {currentCat.name}</span>
              </>}
            </div>
            <h1 style={{ margin: 0 }}>
              {isAll ? 'Alle Produkte' : `${currentCat?.emoji ?? ''} ${currentCat?.name ?? ''}`}
            </h1>
            <p style={{ marginTop: 6, opacity: .8, fontSize: 14 }}>
              {isAll
                ? `${tree.reduce((s, c) => s + totalProducts(c), 0).toLocaleString()} Produkte in ${tree.length} Kategorien`
                : currentCat
                  ? `${totalProducts(currentCat).toLocaleString()} Produkte${isParent ? ` · ${currentCat.children?.length} Unterkategorien` : ''}`
                  : ''}
            </p>

            {/* ── Suchleiste im Header (sichtbar auf Übersicht + Parent-Seiten) ── */}
            {(isAll || isParent) && (
              <div style={{ marginTop: 20, display: 'flex', gap: 8, maxWidth: 560, width: '100%', flexWrap: 'wrap' }}>
                <div style={{ position: 'relative', flex: 1, minWidth: 0 }}>
                  <span style={{
                    position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
                    fontSize: 16, opacity: .6,
                  }}>🔍</span>
                  <input
                    value={searchInput}
                    onChange={e => setSearchInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') setSearch(searchInput) }}
                    placeholder={isParent
                      ? `In ${currentCat?.name ?? 'Produkten'} suchen…`
                      : 'Produkt, Marke oder Artikelnr. suchen…'}
                    style={{
                      width: '100%', padding: '12px 14px 12px 40px',
                      borderRadius: 10, border: 'none',
                      fontSize: 15, outline: 'none',
                      background: 'rgba(255,255,255,.15)',
                      color: 'white',
                      backdropFilter: 'blur(4px)',
                    }}
                    onFocus={e => { e.currentTarget.style.background = 'rgba(255,255,255,.25)' }}
                    onBlur={e => { e.currentTarget.style.background = 'rgba(255,255,255,.15)' }}
                  />
                </div>
                <button
                  onClick={() => setSearch(searchInput)}
                  style={{
                    padding: '12px 22px', borderRadius: 10, border: 'none',
                    background: 'var(--accent)', color: 'white',
                    fontWeight: 700, fontSize: 14, cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Suchen
                </button>
                {search && (
                  <button
                    onClick={() => { setSearch(''); setSearchInput('') }}
                    style={{
                      padding: '12px 16px', borderRadius: 10, border: 'none',
                      background: 'rgba(255,255,255,.15)', color: 'white',
                      cursor: 'pointer', fontSize: 14,
                    }}
                  >
                    ✕
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        <div style={{ maxWidth: 1280, margin: '0 auto', padding: 'clamp(24px,3vw,40px) clamp(16px,3vw,32px)' }}>

          {/* ══════════════════════════════════════════════════════════════ */}
          {/* VIEW 1: Alle Produkte — Kategorie-Übersicht                   */}
          {/* ══════════════════════════════════════════════════════════════ */}
          {isAll && !search && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(280px, 100%), 1fr))', gap: 16 }}>
                {tree.filter(c => totalProducts(c) > 0).map(cat => (
                  <div
                    key={cat.slug}
                    onClick={() => navigate(cat.slug)}
                    className="card"
                    style={{ padding: '24px', cursor: 'pointer', transition: 'all .2s' }}
                    onMouseOver={e => (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'}
                    onMouseOut={e => (e.currentTarget as HTMLElement).style.transform = ''}
                  >
                    {CATEGORY_IMAGES[cat.slug] ? (
                      <div style={{
                        height: 150, borderRadius: 10, marginBottom: 16, overflow: 'hidden',
                        background: CATEGORY_IMAGES[cat.slug].bg,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={CATEGORY_IMAGES[cat.slug].img}
                          alt={cat.name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          loading="lazy"
                        />
                      </div>
                    ) : (
                      <div style={{ fontSize: 40, marginBottom: 12 }}>{cat.emoji ?? '📦'}</div>
                    )}
                    <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 4 }}>{cat.name}</div>
                    <div style={{ fontSize: 13, color: 'var(--gray-400)', marginBottom: 16 }}>
                      {totalProducts(cat).toLocaleString()} Produkte
                      {(cat.children?.length ?? 0) > 0 && ` · ${cat.children!.length} Kategorien`}
                    </div>
                    {(cat.children?.length ?? 0) > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
                        {cat.children!.slice(0, 5).map(sub => (
                          <span key={sub.slug} style={{
                            fontSize: 11.5, padding: '3px 10px', borderRadius: 20,
                            background: 'var(--cream)', color: 'var(--gray-600)', fontWeight: 500,
                          }}>
                            {sub.emoji} {sub.name}
                          </span>
                        ))}
                        {(cat.children?.length ?? 0) > 5 && (
                          <span style={{ fontSize: 11.5, color: 'var(--gray-400)' }}>+{cat.children!.length - 5} weitere</span>
                        )}
                      </div>
                    )}
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent)' }}>Ansehen →</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════ */}
          {/* VIEW 2: Parent-Kategorie — Unterkategorien + Previews         */}
          {/* ══════════════════════════════════════════════════════════════ */}
          {!isAll && isParent && !search && (
            <div>
              {/* Subcategory cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(160px, 100%), 1fr))', gap: 12, marginBottom: 40 }}>
                {currentCat!.children!.sort((a, b) => a.sortOrder - b.sortOrder).map(sub => (
                  <div
                    key={sub.slug}
                    onClick={() => navigate(sub.slug)}
                    className="card"
                    style={{ padding: '20px 16px', cursor: 'pointer', textAlign: 'center', transition: 'all .2s' }}
                    onMouseOver={e => (e.currentTarget as HTMLElement).style.background = '#f5f3f0'}
                    onMouseOut={e => (e.currentTarget as HTMLElement).style.background = ''}
                  >
                    <div style={{ fontSize: 30, marginBottom: 10 }}>{sub.emoji ?? '📦'}</div>
                    <div style={{ fontWeight: 600, fontSize: 13.5, marginBottom: 4 }}>{sub.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--gray-400)' }}>
                      {sub._count.products.toLocaleString()} Produkte
                    </div>
                  </div>
                ))}
              </div>

              {/* Products grouped by subcategory */}
              {loading ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(200px, 100%), 1fr))', gap: 16 }}>
                  {Array.from({ length: 8 }).map((_, i) => <div key={i} className="skeleton" style={{ height: 360, borderRadius: 12 }} />)}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
                  {currentCat!.children!
                    .sort((a, b) => a.sortOrder - b.sortOrder)
                    .map(sub => {
                      const subProds = subPreviews[sub.slug] ?? []
                      if (sub._count.products === 0) return null
                      return (
                        <section key={sub.slug}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, paddingBottom: 12, borderBottom: '2px solid var(--gray-100)', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: 22 }}>{sub.emoji}</span>
                            <div>
                              <div style={{ fontWeight: 700, fontSize: 16 }}>{sub.name}</div>
                              <div style={{ fontSize: 12, color: 'var(--gray-400)' }}>
                                {sub._count.products.toLocaleString()} Produkte
                              </div>
                            </div>
                            <button
                              onClick={() => navigate(sub.slug)}
                              className="btn btn-ghost btn-sm"
                              style={{ marginLeft: 'auto' }}
                            >
                              Alle {sub._count.products.toLocaleString()} anzeigen →
                            </button>
                          </div>
                          {subProds.length > 0 ? (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(200px, 100%), 1fr))', gap: 'clamp(12px,2vw,20px)' }}>
                              {subProds.map((p, i) => <ProductCard key={p.id} product={p} priority={i === 0} approved={approved} />)}
                            </div>
                          ) : (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(200px, 100%), 1fr))', gap: 16 }}>
                              {Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton" style={{ height: 320, borderRadius: 12 }} />)}
                            </div>
                          )}
                          {sub._count.products > PREVIEW_SIZE && (
                            <div style={{ marginTop: 16, textAlign: 'center' }}>
                              <button onClick={() => navigate(sub.slug)} className="btn btn-ghost btn-sm">
                                + {(sub._count.products - PREVIEW_SIZE).toLocaleString()} weitere Produkte in {sub.name} →
                              </button>
                            </div>
                          )}
                        </section>
                      )
                    })}
                </div>
              )}
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════ */}
          {/* VIEW 3: Leaf / Parent+Suche / Suche — Paginiertes Grid        */}
          {/* ══════════════════════════════════════════════════════════════ */}
          {(!isAll && (isLeaf || (isParent && !!search) || (!isParent && !!search))) && (
            <div>
              {/* Search + Sort bar */}
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 20, justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)' }}>🔍</span>
                    <input
                      value={searchInput}
                      onChange={e => setSearchInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && setSearch(searchInput)}
                      placeholder={`In ${currentCat?.name ?? 'Produkte'} suchen…`}
                      className="form-input"
                      style={{ paddingLeft: 36, width: 'min(240px, 100%)' }}
                    />
                  </div>
                  {searchInput && <button className="btn btn-sm btn-outline" onClick={() => setSearch(searchInput)}>Suchen</button>}
                  {search && <button className="btn btn-sm btn-ghost" onClick={() => { setSearch(''); setSearchInput('') }}>✕ Reset</button>}
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  {!loading && (
                    <span style={{ fontSize: 13, color: 'var(--gray-400)' }}>
                      {sorted.length.toLocaleString()} / {total.toLocaleString()} Produkte
                    </span>
                  )}
                  <select value={sort} onChange={e => setSort(e.target.value)} className="form-input" style={{ width: 'auto' }}>
                    {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
              </div>

              {parentCat && !search && (
                <button onClick={() => navigate(parentCat.slug)} className="btn btn-ghost btn-sm" style={{ marginBottom: 20 }}>
                  ← {parentCat.emoji} {parentCat.name}
                </button>
              )}

              {loading ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(200px, 100%), 1fr))', gap: 16 }}>
                  {Array.from({ length: 12 }).map((_, i) => <div key={i} className="skeleton" style={{ height: 360, borderRadius: 12 }} />)}
                </div>
              ) : sorted.length === 0 ? (
                <div className="empty-state">
                  <div className="icon">🔍</div>
                  <p style={{ fontWeight: 600, fontSize: 17, marginBottom: 8 }}>Keine Produkte gefunden</p>
                  <p style={{ fontSize: 14 }}>Versuche andere Suchbegriffe oder wähle eine andere Kategorie.</p>
                  <button className="btn btn-black" style={{ marginTop: 20 }} onClick={() => { setSearch(''); setSearchInput(''); navigate('all') }}>
                    Alle Kategorien anzeigen
                  </button>
                </div>
              ) : (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(200px, 100%), 1fr))', gap: 'clamp(12px,2vw,20px)' }}>
                    {sorted.map((p, i) => <ProductCard key={p.id} product={p} priority={i < 4} approved={approved} />)}
                  </div>

                  {/* Infinite scroll sentinel */}
                  <div ref={sentinelRef} style={{ height: 1 }} />

                  {/* Loading indicator */}
                  {loadingMore && (
                    <div style={{ textAlign: 'center', padding: 32 }}>
                      <div style={{ display: 'inline-flex', gap: 6, alignItems: 'center', color: 'var(--gray-400)', fontSize: 13 }}>
                        <span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>⏳</span>
                        Weitere Produkte werden geladen…
                      </div>
                    </div>
                  )}

                  {!hasMore && total > PAGE_SIZE && (
                    <p style={{ textAlign: 'center', marginTop: 32, color: 'var(--gray-400)', fontSize: 13 }}>
                      ✓ Alle {total.toLocaleString()} Produkte geladen
                    </p>
                  )}
                </>
              )}
            </div>
          )}

          {/* ── Suche von Alle Produkte aus ── */}
          {isAll && search && (
            <div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
                <button className="btn btn-ghost btn-sm" onClick={() => { setSearch(''); setSearchInput('') }}>✕ Suche zurücksetzen</button>
                {!loading && <span style={{ fontSize: 13, color: 'var(--gray-400)', lineHeight: '32px' }}>{total.toLocaleString()} Ergebnisse</span>}
              </div>
              {loading ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(200px, 100%), 1fr))', gap: 16 }}>
                  {Array.from({ length: 8 }).map((_, i) => <div key={i} className="skeleton" style={{ height: 360, borderRadius: 12 }} />)}
                </div>
              ) : (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(200px, 100%), 1fr))', gap: 'clamp(12px,2vw,20px)' }}>
                    {sorted.map((p, i) => <ProductCard key={p.id} product={p} priority={i < 4} approved={approved} />)}
                  </div>
                  {/* Infinite scroll sentinel (search view) */}
                  <div ref={sentinelRef} style={{ height: 1 }} />
                  {loadingMore && (
                    <div style={{ textAlign: 'center', padding: 32, color: 'var(--gray-400)', fontSize: 13 }}>
                      ⏳ Weitere Ergebnisse werden geladen…
                    </div>
                  )}
                </>
              )}
            </div>
          )}

        </div>


      </main>
      <Footer />
    </>
  )
}

export default function ProductsPage() {
  return <Suspense><ProductsContent /></Suspense>
}
