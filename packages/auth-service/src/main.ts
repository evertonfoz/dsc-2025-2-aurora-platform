import { createApp } from './app';

const port = process.env.PORT ? Number(process.env.PORT) : 3010;
const app = createApp();

if (require.main === module) {
  app.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`auth-service listening on port ${port}`);
  });
}

export default app;
