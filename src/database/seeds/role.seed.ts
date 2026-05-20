import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { UserRole } from '../../users/entities/user-role.entity';

dotenv.config();

const roles = [
    { role: 'Plant Operator', identifier: 'Plant_Operator' },
    { role: 'QC Inspector', identifier: 'QC_Inspector' },
    { role: 'Plant Supervisor', identifier: 'Plant_Supervisor' },
    { role: 'IT Admin', identifier: 'Admin' },
    { role: 'Central Auditor', identifier: 'Central_Auditor' },
];

async function seed() {
    const dataSource = new DataSource({
        type: 'mysql',
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '3306', 10),
        username: process.env.DB_USERNAME || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'hfcl_db',
        entities: [UserRole],
        synchronize: false,
    });

    await dataSource.initialize();
    const repo = dataSource.getRepository(UserRole);

    for (const roleData of roles) {
        const exists = await repo.findOne({ where: { role: roleData.role } });
        if (exists) {
            console.log(`Skipped (already exists): ${roleData.role}`);
            continue;
        }
        const entity = repo.create(roleData);
        await repo.save(entity);
        console.log(`Seeded: ${roleData.role} (${roleData.identifier})`);
    }

    await dataSource.destroy();
    console.log('Role seeding complete.');
}

seed().catch((err) => {
    console.error('Seeding failed:', err);
    process.exit(1);
});
