import { requireStaff } from '@/lib/auth';
import AccessRequestsAdmin from '@/components/access-requests-admin';
export default async function AccessRequestsPage() {
  const { profile } = await requireStaff();
  if (profile.role !== 'admin') return <div className="ops-empty"><h2>Acceso restringido</h2></div>;
  return <AccessRequestsAdmin />;
}
