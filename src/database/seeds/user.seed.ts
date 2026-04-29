import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as bcrypt from 'bcrypt';
import { User, UserStatus } from '../../users/entities/user.entity';
import { UserRole } from '../../users/entities/user-role.entity';

dotenv.config();

async function seed() {
    const dataSource = new DataSource({
        type: 'mysql',
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '3306', 10),
        username: process.env.DB_USERNAME || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'hfcl_db',
        entities: [User, UserRole],
        synchronize: false,
    });

    await dataSource.initialize();

    const roleRepo = dataSource.getRepository(UserRole);
    const userRepo = dataSource.getRepository(User);

    const itAdminRole = await roleRepo.findOne({ where: { role: 'IT Admin' } });
    if (!itAdminRole) {
        console.error('Role "IT Admin" not found. Run role.seed.ts first.');
        await dataSource.destroy();
        process.exit(1);
    }

    const email = 'itadmin@hfcl.com';
    const existing = await userRepo.findOne({ where: { email } });
    if (existing) {
        console.log(`Skipped: user "${email}" already exists.`);
        await dataSource.destroy();
        return;
    }

    const hashedPassword = await bcrypt.hash('Admin@1234', 10);

    const user = userRepo.create({
        first_name: 'IT',
        last_name: 'Admin',
        email,
        password: hashedPassword,
        role_id: itAdminRole.id,
        status: UserStatus.ACTIVE,
        deleted: false,
    });

    await userRepo.save(user);
    console.log(`Seeded IT Admin user: ${email}`);

    await dataSource.destroy();
    console.log('User seeding complete.');
}

seed().catch((err) => {
    console.error('Seeding failed:', err);
    process.exit(1);
});
