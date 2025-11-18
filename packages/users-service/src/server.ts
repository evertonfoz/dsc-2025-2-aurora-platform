import app from './app';

const PORT = process.env.PORT ? Number(process.env.PORT) : 3003;

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`users-service listening on http://localhost:${PORT}`);
});
