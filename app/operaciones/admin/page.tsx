import {redirect} from 'next/navigation';
import {requireStaff} from '@/lib/auth';
import AdminDashboard from '@/components/admin-dashboard';
export default async function AdminDashboardPage(){const {profile}=await requireStaff();if(profile.role!=='admin')redirect('/operaciones');return <AdminDashboard/>}
