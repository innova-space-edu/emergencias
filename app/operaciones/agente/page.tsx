import { requireStaff } from '@/lib/auth';
import AgentInbox from '@/components/agent-inbox';
export default async function AgentPage(){await requireStaff();return <AgentInbox/>}
