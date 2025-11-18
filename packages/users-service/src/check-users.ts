import 'reflect-metadata';
import { AppDataSource } from './data-source';
import { User } from './users/entities/user.entity';
import * as argon2 from 'argon2';

async function checkUsers() {
  try {
    await AppDataSource.initialize();
    console.log('DataSource initialized');

    const userRepo = AppDataSource.getRepository(User);

    // Seed users
    const adminEmail = 'admin.user@example.com';
    const testEmail = 'test.user@example.com';

    const existingAdmin = await userRepo.findOne({ where: { email: adminEmail } });
    if (!existingAdmin) {
      const passwordHash = await argon2.hash('AdminP@ss1');
      const admin = userRepo.create({ name: 'Admin User', email: adminEmail, passwordHash });
      await userRepo.save(admin);
      console.log('Seeded admin user');
    }

    const existingTest = await userRepo.findOne({ where: { email: testEmail } });
    if (!existingTest) {
      const passwordHash = await argon2.hash('StrongP@ssw0rd');
      const testUser = userRepo.create({ name: 'Test User', email: testEmail, passwordHash });
      await userRepo.save(testUser);
      console.log('Seeded test user');
    }

    const users = await userRepo.find();
    console.log('Users in DB:', users.map(u => ({ id: u.id, email: u.email, name: u.name })));

    await AppDataSource.destroy();
  } catch (error) {
    console.error('Error:', error);
  }
}

checkUsers();