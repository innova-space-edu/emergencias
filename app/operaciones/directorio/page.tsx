import { requireStaff } from '@/lib/auth';
import TerritorialDirectory from '@/components/territorial-directory';
export default async function DirectoryPage(){
  const {profile}=await requireStaff();
  return <TerritorialDirectory canEdit={profile.role==='admin'}/>;
}
