export type IncidentStatus = 'pending_sync'|'received'|'reviewing'|'verified'|'critical'|'notified'|'responding'|'resolved'|'discarded';

export type PublicIncident = {
  id: string;
  public_code: string;
  category: string;
  title: string | null;
  public_summary: string | null;
  severity: number;
  status: IncidentStatus;
  latitude: number;
  longitude: number;
  region: string | null;
  commune: string | null;
  locality: string | null;
  address_approx: string | null;
  reports_count: number;
  first_reported_at: string;
  last_reported_at: string;
  resolved_at: string | null;
  notifications: Array<{
    organization: string;
    channel: string;
    status: string;
    sent_at?: string | null;
    delivered_at?: string | null;
    confirmed_at?: string | null;
  }>;
};

export type EvidenceDraft = {
  id: string;
  name: string;
  type: string;
  size: number;
  blob: Blob;
  mediaType: 'image'|'video';
  durationSeconds?: number;
  uploaded?: boolean;
  storagePath?: string;
};

export type OfflineReport = {
  id: string;
  secret: string;
  category: string;
  description: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
  capturedAt: string;
  occurredAt?: string;
  region?: string;
  commune?: string;
  locality?: string;
  addressApprox?: string;
  dangerFire: boolean;
  dangerInjured: boolean;
  dangerTrapped: boolean;
  dangerElectric: boolean;
  roadBlocked: boolean;
  createdOffline: boolean;
  state: 'pending'|'syncing'|'failed';
  lastError?: string;
  attempts: number;
  evidence: EvidenceDraft[];
};
