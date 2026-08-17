import {redirect} from 'next/navigation';
import {requireStaff} from '@/lib/auth';
import AdminReportsRegistry from '@/components/admin-reports-registry';
export default async function AdminReportsPage(){const {profile}=await requireStaff();if(profile.role!=='admin')redirect('/operaciones');return <AdminReportsRegistry/>}
