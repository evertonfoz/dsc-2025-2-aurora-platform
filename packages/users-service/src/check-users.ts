import 'reflect-metadata';
import { AppDataSource } from './data-source';
import { User } from './users/entities/user.entity';
import * as bcrypt from 'bcryptjs';

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
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash('AdminP@ss1', salt);
      const admin = userRepo.create({ name: 'Admin User', email: adminEmail, passwordHash });
      await userRepo.save(admin);
      console.log('Seeded admin user');
    }

    const existingTest = await userRepo.findOne({ where: { email: testEmail } });
    if (!existingTest) {
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash('StrongP@ssw0rd', salt);
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