import { requireStaff } from '@/lib/auth';
import StaffDashboard from '@/components/staff-dashboard';
export default async function OperationsPage() {
  const { profile } = await requireStaff();
  return <StaffDashboard profile={profile} />;
}
