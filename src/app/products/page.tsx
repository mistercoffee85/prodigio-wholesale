'use client'
import { useEffect, useState, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import ProductCard from '@/components/shop/ProductCard'
import { Suspense } from 'react'

interface Product {
  id: string; name: string; slug: string; brand: string; emoji: string
  bgGradient: string | null; price: number; comparePrice: number | null
  unit: string; moq: number; stock: number; badge: string | null
  description: string; details: Record<string, string>
  images?: string[]
  category: { name: string; slug: string }
}

// Top-level nav pills
const TOP_CATS = [
  { slug: 'all',         label: 'Alle Produkte', icon: '🏪' },
  { slug: 'bubble-tea',  label: 'Bubble Tea',    icon: '🧋' },
  { slug: 'teaballs',    label: 'TEABALLS',      icon: '🍵' },
  { slug: 'patislove',   label: 'Patislove',     icon: '🍫' },
  { slug: 'the-mallows',        label: 'The Mallows',       icon: '☁️' },
  { slug: 'gastro-reinigung',   label: 'Gastro/Reinigung',  icon: '🧹' },
]

// Subcategory pills per parent
const SUB_CATS: Record<string, { slug: string; label: string; icon: string }[]> = {
  'bubble-tea': [
    { slug: 'bubble-tea-rtd',              label: 'Ready to Drink',  icon: '🥤' },
    { slug: 'bubble-tea-sets',             label: 'Sets',            icon: '🧋' },
    { slug: 'bubble-tea-fruchtperlen-240g',  label: 'Fruchtperlen 240g', icon: '🫧' },
    { slug: 'bubble-tea-1-5kg',              label: 'Fruchtperlen 1.5kg', icon: '🫐' },
    { slug: 'bubble-tea-tapioka',          label: 'Tapioka',         icon: '⚫' },
    { slug: 'bubble-tea-zubehoer',         label: 'Zubehör',         icon: '🥤' },
  ],
  'teaballs': [
    { slug: 'teaballs-glasflaschen',     label: 'Glasflaschen',     icon: '🍶' },
    { slug: 'teaballs-glasflaschen-bio', label: 'Glasflaschen Bio', icon: '🌿' },
    { slug: 'teaballs-vorratsglas-100g', label: 'Vorratsglas 100g', icon: '🫙' },
    { slug: 'teaballs-vorratsglas-500g', label: 'Vorratsglas 500g', icon: '🫙' },
  ],
  'patislove': [
    { slug: 'patislove-bars',    label: 'Bars',    icon: '🍫' },
    { slug: 'patislove-dragees', label: 'Dragées', icon: '🫐' },
    { slug: 'patislove-cookies', label: 'Cookies', icon: '🍪' },
    { slug: 'patislove-sticks',  label: 'Sticks',  icon: '🍬' },
  ],
}

// Find which parent a slug belongs to
function findParent(slug: string): string {
  if (slug === 'all') return 'all'
  for (const [parent, subs] of Object.entries(SUB_CATS)) {
    if (slug === parent || subs.some(s => s.slug === slug)) return parent
  }
  return slug
}

const SORT_OPTIONS = [
  { value: 'default',    label: 'Standard' },
  { value: 'price-asc',  label: 'Preis ↑' },
  { value: 'price-desc', label: 'Preis ↓' },
  { value: 'name',       label: 'Name A–Z' },
]

function ProductsContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const urlCategory = searchParams.get('category') ?? 'all'
  const initBadge   = searchParams.get('badge') ?? ''

  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading]   = useState(true)
  const [category, setCategory] = useState(urlCategory)
  const [search, setSearch]     = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [sort, setSort]         = useState('default')
  const [total, setTotal]       = useState(0)

  // Sync category when URL changes (nav links, browser back/forward)
  useEffect(() => { setCategory(urlCategory) }, [urlCategory])

  const activeParent = findParent(category)
  const subCats = SUB_CATS[activeParent] ?? []

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (category !== 'all') params.set('category', category)
    if (search) params.set('search', search)
    if (initBadge) params.set('badge', initBadge)
    params.set('limit', '100')
    const res = await fetch(`/api/products?${params}`)
    const data = await res.json()
    let prods: Product[] = data.products ?? []

    if (sort === 'price-asc')  prods = [...prods].sort((a, b) => a.price - b.price)
    if (sort === 'price-desc') prods = [...prods].sort((a, b) => b.price - a.price)
    if (sort === 'name')       prods = [...prods].sort((a, b) => a.name.localeCompare(b.name))

    // Patislove: sort by product type when showing all patislove
    if (sort === 'default' && (category === 'patislove' || activeParent === 'patislove')) {
      prods = [...prods].sort((a, b) => {
        const sa = Number(a.details?._sort) || 99
        const sb = Number(b.details?._sort) || 99
        return sa !== sb ? sa - sb : a.name.localeCompare(b.name)
      })
    }

    setProducts(prods)
    setTotal(data.total ?? 0)
    setLoading(false)
  }, [category, search, sort, initBadge])

  useEffect(() => { fetchProducts() }, [fetchProducts])

  const navigate = (slug: string) => {
    router.push(slug === 'all' ? '/products' : `/products?category=${slug}`)
  }

  // Label for active category filter chip
  const activeCatLabel = [...TOP_CATS, ...Object.values(SUB_CATS).flat()].find(c => c.slug === category)?.label
    ?? category

  return (
    <>
      <Header />
      <main style={{ minHeight: '80vh', background: 'var(--cream)' }}>
        {/* Page Header */}
        <div className="page-header">
          <div style={{ maxWidth: 1280, margin: '0 auto' }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, color: 'var(--accent)', marginBottom: 12, textTransform: 'uppercase' }}>
              Grosshandel Sortiment
            </div>
            <h1>Unsere Produkte</h1>
            <p style={{ marginTop: 8 }} suppressHydrationWarning>
              {loading ? '...' : total} {!loading && total === 1 ? 'Produkt' : 'Produkte'} zu exklusiven Grosshandelspreisen
            </p>
          </div>
        </div>

        <div style={{ maxWidth: 1280, margin: '0 auto', padding: 'clamp(24px,3vw,40px) clamp(16px,3vw,32px)' }}>

          {/* ── Top-level category pills ─────────────────────────── */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: subCats.length ? 12 : 24 }}>
            {TOP_CATS.map(cat => (
              <button
                key={cat.slug}
                onClick={() => navigate(cat.slug)}
                className={`filter-pill${activeParent === cat.slug || (cat.slug === 'all' && category === 'all') ? ' active' : ''}`}
              >
                {cat.icon} {cat.label}
              </button>
            ))}
          </div>

          {/* ── Subcategory pills (shown when parent is selected) ─── */}
          {subCats.length > 0 && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 24, paddingLeft: 4 }}>
              {/* "Alle [Parent]" pill */}
              <button
                onClick={() => navigate(activeParent)}
                style={{
                  padding: '5px 14px', fontSize: 12.5, fontWeight: 500,
                  borderRadius: 20, border: '1.5px solid var(--gray-200)',
                  background: category === activeParent ? 'var(--forest)' : 'white',
                  color: category === activeParent ? 'white' : 'var(--gray-600)',
                  cursor: 'pointer', transition: 'all .15s',
                }}
              >
                Alle
              </button>
              {subCats.map(sub => (
                <button
                  key={sub.slug}
                  onClick={() => navigate(sub.slug)}
                  style={{
                    padding: '5px 14px', fontSize: 12.5, fontWeight: 500,
                    borderRadius: 20, border: '1.5px solid var(--gray-200)',
                    background: category === sub.slug ? 'var(--forest)' : 'white',
                    color: category === sub.slug ? 'white' : 'var(--gray-600)',
                    cursor: 'pointer', transition: 'all .15s',
                  }}
                >
                  {sub.icon} {sub.label}
                </button>
              ))}
            </div>
          )}

          {/* ── Search + Sort ────────────────────────────────────── */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 24, justifyContent: 'flex-end' }}>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 14, color: 'var(--gray-400)' }}>🔍</span>
              <input
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && setSearch(searchInput)}
                placeholder="Produkt suchen..."
                className="form-input"
                style={{ paddingLeft: 36, width: 220 }}
              />
            </div>
            {searchInput && (
              <button className="btn btn-sm btn-outline" onClick={() => { setSearch(searchInput); setSearchInput('') }}>Suchen</button>
            )}
            {search && (
              <button className="btn btn-sm btn-ghost" onClick={() => { setSearch(''); setSearchInput('') }}>✕ Reset</button>
            )}
            <select value={sort} onChange={e => setSort(e.target.value)} className="form-input" style={{ width: 'auto', paddingRight: 36 }}>
              {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>

          {/* Active Filter Tags */}
          {(search || (category !== 'all' && category !== activeParent)) && (
            <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ fontSize: 13, color: 'var(--gray-400)' }}>Filter:</span>
              {category !== 'all' && category !== activeParent && (
                <span className="chip">
                  {activeCatLabel}
                  <button onClick={() => navigate(activeParent)} style={{ cursor: 'pointer', color: 'var(--gray-400)', fontSize: 12 }}>✕</button>
                </span>
              )}
              {search && (
                <span className="chip">
                  „{search}"
                  <button onClick={() => { setSearch(''); setSearchInput('') }} style={{ cursor: 'pointer', color: 'var(--gray-400)', fontSize: 12 }}>✕</button>
                </span>
              )}
            </div>
          )}

          {/* Product Grid */}
          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 'clamp(12px,2vw,20px)' }}>
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="skeleton" style={{ height: 360, borderRadius: 'var(--radius-lg)' }} />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="empty-state">
              <div className="icon">🔍</div>
              <p style={{ fontWeight: 600, fontSize: 17, marginBottom: 8 }}>Keine Produkte gefunden</p>
              <p style={{ fontSize: 14 }}>Versuchen Sie andere Suchbegriffe oder Filter.</p>
              <button className="btn btn-black" style={{ marginTop: 20 }} onClick={() => { setSearch(''); setSearchInput(''); router.push('/products') }}>
                Alle Produkte anzeigen
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 'clamp(12px,2vw,20px)' }}>
              {products.map((p, i) => <ProductCard key={p.id} product={p} priority={i === 0} />)}
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
