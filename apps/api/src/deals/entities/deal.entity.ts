import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Organization } from '../../organizations/entities/organization.entity';
import { Contact } from '../../contacts/entities/contact.entity';
import { Activity } from '../../activities/entities/activity.entity';

@Entity('deals')
export class Deal {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text' })
  name: string;

  @Column({ type: 'real', default: 0 })
  value: number;

  @Column({ type: 'text', default: 'Nuevo' })
  stage: string;

  @Column({ type: 'int', default: 0 })
  position: number;

  @Column({ type: 'text', nullable: true, name: 'expectedCloseDate' })
  expectedCloseDate: string | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ type: 'int', name: 'contactId' })
  contactId: number;

  @ManyToOne(() => Contact, (contact) => contact.deals)
  @JoinColumn({ name: 'contactId' })
  contact: Contact;

  @Column({ type: 'int', name: 'organizationId' })
  organizationId: number;

  @ManyToOne(() => Organization, (organization) => organization.deals)
  @JoinColumn({ name: 'organizationId' })
  organization: Organization;

  @OneToMany(() => Activity, (activity) => activity.deal)
  activities: Activity[];

  @CreateDateColumn({ type: 'datetime' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'datetime' })
  updatedAt: Date;
}
