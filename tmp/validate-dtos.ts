import 'reflect-metadata';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { LoginDto } from '../src/auth/dtos/login.dto';
import { RefreshDto } from '../src/auth/dtos/refresh.dto';
import { LogoutDto } from '../src/auth/dtos/logout.dto';

async function run() {
  const badLogin = plainToInstance(LoginDto, { email: 'not-an-email', password: '123' });
  const badRefresh = plainToInstance(RefreshDto, { refreshToken: 'short' });
  const badLogout = plainToInstance(LogoutDto, { refreshToken: '' });

  console.log('Validating badLogin...');
  console.log(await validate(badLogin));

  console.log('Validating badRefresh...');
  console.log(await validate(badRefresh));

  console.log('Validating badLogout...');
  console.log(await validate(badLogout));
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
