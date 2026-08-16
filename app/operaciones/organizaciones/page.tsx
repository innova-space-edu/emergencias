import { requireStaff } from '@/lib/auth';
import OrganizationsAdmin from '@/components/organizations-admin';
export default async function OrganizationsPage() {
  const { profile } = await requireStaff();
  if (profile.role !== 'admin') return <div className="ops-empty"><h2>Acceso restringido</h2></div>;
  return <OrganizationsAdmin />;
}
