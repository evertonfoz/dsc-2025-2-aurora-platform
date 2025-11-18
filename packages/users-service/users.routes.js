const express = require('express');
const { body, param, validationResult } = require('express-validator');

const router = express.Router();

router.get('/:id',
  param('id').isString().notEmpty(),
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { id } = req.params;
    res.json({ id, email: 'user@example.com', name: 'User' });
  }
);

router.post('/',
  body('email').isEmail(),
  body('name').optional().isString(),
  body('password').optional().isString(),
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { email, name } = req.body;
    res.status(201).json({ id: '123', email, name });
  }
);

module.exports = router;
