import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import AdminSidebar from '@/components/admin/AdminSidebar'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()
  if (!session || session.user.role !== 'ADMIN') redirect('/login?error=forbidden')
  return (
    <>
      <style>{`
        .admin-layout-wrapper {
          display: flex;
          min-height: 100vh;
          flex-wrap: wrap;
        }
        .admin-sidebar-wrapper {
          /* sidebar width is determined by AdminSidebar itself */
        }
        .admin-main {
          flex: 1;
          background: var(--cream);
          overflow-y: auto;
          max-height: 100vh;
          min-width: 0;
        }
        @media (max-width: 768px) {
          .admin-sidebar-wrapper {
            display: none;
          }
          .admin-main {
            width: 100%;
            max-height: none;
            min-height: 100vh;
          }
        }
      `}</style>
      <div className="admin-layout-wrapper">
        <div className="admin-sidebar-wrapper">
          <AdminSidebar />
        </div>
        <main className="admin-main">{children}</main>
      </div>
    </>
  )
}
