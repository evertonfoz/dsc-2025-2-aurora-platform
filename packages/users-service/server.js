const path = require('path');
const express = require('express');
const OpenApiValidator = require('express-openapi-validator');

const usersRouter = require('./users.routes');

const app = express();
app.use(express.json());

app.use(
  OpenApiValidator.middleware({
    apiSpec: path.join(__dirname, 'openapi.yaml'),
    validateRequests: true,
    validateResponses: false,
  })
);

app.use('/users', usersRouter);

app.get('/health', (req, res) => res.json({ status: 'ok' }));

const port = process.env.PORT || 3010;
app.listen(port, () => console.log(`users-service listening on http://localhost:${port}`));
