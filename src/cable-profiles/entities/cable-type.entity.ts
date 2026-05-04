import { User } from 'src/users/entities/user.entity';
import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';

export interface CableAttribute {
    attribute_name: string;
    attribute_color_count: number;
    attribute_markings: boolean;
}

@Entity('cable_types')
export class CableType {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'name', type: 'varchar', length: 150 })
    name: string;

    @Column({ name: 'attributes', type: 'json', nullable: true })
    attributes: CableAttribute[] | null;

    @Column({ name: 'status', type: 'boolean', default: true })
    status: boolean;

    @Column({ name: 'deleted', type: 'boolean', default: false })
    deleted: boolean;

    @Column({ name: 'parent_type_id', type: 'int', nullable: true, default: null })
    parent_type_id: number | null;

    // Self-referencing: parent
    @ManyToOne(() => CableType, (cableType) => cableType.children, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'parent_type_id' })
    parent: CableType | null;

    // Self-referencing: children (sub-types)
    @OneToMany(() => CableType, (cableType) => cableType.parent)
    children: CableType[];

    @CreateDateColumn({ name: 'created_at' })
    created_at: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updated_at: Date;

    @Index()
    @ManyToOne(() => User, (user) => user.id, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'created_by_id' })
    created_by: User;

    @Index()
    @ManyToOne(() => User, (user) => user.id, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'modified_by_id' })
    modified_by: User;
}
