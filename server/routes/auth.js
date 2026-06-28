const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { demoDb, demoAuth, isMongoConnected } = require('../config/demoDb');

const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!isMongoConnected()) {
      const exists = demoDb.users.find(u => u.email === email || u.username === username);
      if (exists) {
        return res.status(400).json({ error: 'El usuario o email ya existe' });
      }
      const user = {
        _id: `user_${Date.now()}`,
        username,
        email,
        password
      };
      demoDb.users.push(user);
      const token = 'demo_' + Buffer.from(JSON.stringify({ id: user._id })).toString('base64');
      return res.status(201).json({ token, user: { id: user._id, username, email } });
    }

    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ error: 'El usuario o email ya existe' });
    }

    const user = new User({ username, email, password });
    await user.save();

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      token,
      user: { id: user._id, username: user.username, email: user.email }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!isMongoConnected()) {
      const user = demoDb.users.find(u => u.email === email);
      if (!user || user.password !== password) {
        return res.status(400).json({ error: 'Credenciales inválidas' });
      }
      const token = 'demo_' + Buffer.from(JSON.stringify({ id: user._id })).toString('base64');
      return res.json({ token, user: { id: user._id, username: user.username, email: user.email } });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: 'Credenciales inválidas' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Credenciales inválidas' });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.json({
      token,
      user: { id: user._id, username: user.username, email: user.email }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/me', async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'Token requerido' });

    if (!isMongoConnected()) {
      if (token.startsWith('demo_')) {
        const user = { _id: 'demo_user', username: 'DemoUser', email: 'demo@tubeplay.app' };
        return res.json({ user });
      }
      return res.status(401).json({ error: 'Token inválido' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    if (!user) return res.status(401).json({ error: 'Usuario no encontrado' });
    res.json({ user });
  } catch (error) {
    res.status(401).json({ error: 'Token inválido' });
  }
});

module.exports = router;
