import {
    Column,
    CreateDateColumn,
    Entity,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';

@Entity('vernier_nos')
export class VernierNo {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'vernier_no', type: 'varchar', length: 100, unique: true })
    vernier_no: string;

    @Column({ name: 'status', type: 'boolean', default: true })
    status: boolean;

    @CreateDateColumn({ name: 'created_at' })
    created_at: Date;

    @UpdateDateColumn({ name: 'modified_at' })
    modified_at: Date;
}
