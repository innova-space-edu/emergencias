import {redirect} from 'next/navigation';
import {requireStaff} from '@/lib/auth';
import EmailNotificationsAdmin from '@/components/email-notifications-admin';
export default async function EmailNotificationsPage(){const {profile}=await requireStaff();if(profile.role!=='admin')redirect('/operaciones');return <EmailNotificationsAdmin/>}
