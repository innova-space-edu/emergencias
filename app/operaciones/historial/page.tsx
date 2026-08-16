import { requireStaff } from '@/lib/auth';
import IncidentHistory from '@/components/incident-history';

export default async function HistoryPage(){
  await requireStaff();
  return <IncidentHistory/>;
}
