import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import AdminSidebar from '@/components/admin/AdminSidebar'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()
  if (!session || session.user.role !== 'ADMIN') redirect('/login?error=forbidden')
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <AdminSidebar />
      <main style={{ flex: 1, background: 'var(--cream)', overflowY: 'auto', maxHeight: '100vh' }}>{children}</main>
    </div>
  )
}
