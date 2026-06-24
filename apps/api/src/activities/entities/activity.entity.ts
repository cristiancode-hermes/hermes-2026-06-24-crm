import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Organization } from '../../organizations/entities/organization.entity';
import { Contact } from '../../contacts/entities/contact.entity';
import { Deal } from '../../deals/entities/deal.entity';

@Entity('activities')
export class Activity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text' })
  type: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'text' })
  date: string;

  @Column({ type: 'int', nullable: true, name: 'contactId' })
  contactId: number | null;

  @ManyToOne(() => Contact, (contact) => contact.activities, { nullable: true })
  @JoinColumn({ name: 'contactId' })
  contact: Contact | null;

  @Column({ type: 'int', nullable: true, name: 'dealId' })
  dealId: number | null;

  @ManyToOne(() => Deal, (deal) => deal.activities, { nullable: true })
  @JoinColumn({ name: 'dealId' })
  deal: Deal | null;

  @Column({ type: 'int', name: 'organizationId' })
  organizationId: number;

  @ManyToOne(() => Organization, (organization) => organization.activities)
  @JoinColumn({ name: 'organizationId' })
  organization: Organization;

  @CreateDateColumn({ type: 'datetime' })
  createdAt: Date;
}
