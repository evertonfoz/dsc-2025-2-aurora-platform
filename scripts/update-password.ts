import 'reflect-metadata';
import bcrypt from 'bcryptjs';
import { config } from 'dotenv';
config();

import { AppDataSource } from '../packages/users-service/src/data-source';
import { User } from '../packages/users-service/src/users/entities/user.entity';

const email = process.env.TARGET_EMAIL || 'test.user@example.com';
const password = process.env.TARGET_PASSWORD || 'StrongP@ssw0rd';
const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS ?? '10', 10);

async function main() {
  console.log(`Connecting to DB and updating password for: ${email}`);
  await AppDataSource.initialize();

  const repo = AppDataSource.getRepository(User);

  const user = await repo.findOne({ where: { email } });
  if (!user) {
    console.error(`User with email ${email} not found.`);
    await AppDataSource.destroy();
    process.exit(2);
  }

  const hashed = await bcrypt.hash(password, saltRounds);
  user.passwordHash = hashed;

  await repo.save(user);
  console.log(`Password updated (bcrypt) for user ${email}`);

  await AppDataSource.destroy();
}

main().catch((err) => {
  console.error('Error updating password:', err);
  process.exit(1);
});
