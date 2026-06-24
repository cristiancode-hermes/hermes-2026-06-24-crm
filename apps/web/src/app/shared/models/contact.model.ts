import { Deal } from './deal.model';
import { Activity } from './activity.model';

export interface Contact {
  id: number;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  role?: string;
  notes?: string;
  organizationId: number;
  dealsCount?: number;
  deals?: Deal[];
  activities?: Activity[];
  createdAt: Date;
}
