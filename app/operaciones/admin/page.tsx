import {redirect} from 'next/navigation';
import {requireStaff} from '@/lib/auth';
import AdminDashboard from '@/components/admin-dashboard';
import LiveVisitorCounter from '@/components/live-visitor-counter';

export default async function AdminDashboardPage(){
  const {profile}=await requireStaff();
  if(profile.role!=='admin')redirect('/operaciones');
  return <><AdminDashboard/><LiveVisitorCounter/></>;
}
