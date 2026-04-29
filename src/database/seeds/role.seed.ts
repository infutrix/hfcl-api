import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { UserRole } from '../../users/entities/user-role.entity';

dotenv.config();

const roles = [
    'Plant Operator',
    'QC Inspector',
    'Plant Supervisor',
    'IT Admin',
    'Central Auditor',
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

    for (const roleName of roles) {
        const exists = await repo.findOne({ where: { role: roleName } });
        if (exists) {
            console.log(`Skipped (already exists): ${roleName}`);
            continue;
        }
        const entity = repo.create({ role: roleName });
        await repo.save(entity);
        console.log(`Seeded: ${roleName}`);
    }

    await dataSource.destroy();
    console.log('Role seeding complete.');
}

seed().catch((err) => {
    console.error('Seeding failed:', err);
    process.exit(1);
});
