import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { VernierNo } from '../../batches/entities/vernier-no.entity';

dotenv.config();

const vernierNumbers = ['ABC-123S', 'ABC-456S', 'XYZ-789S'];

async function seed() {
    const dataSource = new DataSource({
        type: 'mysql',
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '3306', 10),
        username: process.env.DB_USERNAME || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'hfcl_db',
        entities: [VernierNo],
        synchronize: false,
    });

    await dataSource.initialize();
    const repo = dataSource.getRepository(VernierNo);

    for (const vernier_no of vernierNumbers) {
        const exists = await repo.findOne({ where: { vernier_no } });
        if (exists) {
            console.log(`Skipped (already exists): ${vernier_no}`);
            continue;
        }
        const entity = repo.create({ vernier_no, status: true });
        await repo.save(entity);
        console.log(`Seeded vernier: ${vernier_no}`);
    }

    await dataSource.destroy();
    console.log('Vernier number seeding complete.');
}

seed().catch((err) => {
    console.error('Seeding failed:', err);
    process.exit(1);
});
