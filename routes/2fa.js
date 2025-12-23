const express = require('express');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const { User } = require('../models');
const { encryptSecret, decryptSecret, verifyPassword } = require('../middleware/auth');
const router = express.Router();

router.get('/setup', async (req, res) => {
  try {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({ error: 'Требуется аутентификация' });
    }

    const user = await User.findByPk(req.session.userId);
    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    if (user.twoFactorEnabled) {
      return res.status(400).json({ error: '2FA уже включена для этого аккаунта' });
    }

    const secret = speakeasy.generateSecret({
      name: `2FA App (${user.email})`,
      issuer: 'Node.js 2FA App',
      length: 32
    });

    const encryptedSecret = encryptSecret(secret.base32);
    req.session.tempTwoFactorSecret = encryptedSecret;
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);

    res.json({
      secret: secret.base32,
      qrCode: qrCodeUrl,
      message: 'Отсканируйте QR-код в приложении Google Authenticator'
    });
  } catch (error) {
    console.error('Ошибка настройки 2FA:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

router.post('/verify', async (req, res) => {
  try {
    const { token } = req.body;

    if (!req.session || !req.session.userId) {
      return res.status(401).json({ error: 'Требуется аутентификация' });
    }

    if (!req.session.tempTwoFactorSecret) {
      return res.status(400).json({ error: 'Сначала настройте 2FA' });
    }

    if (!token) {
      return res.status(400).json({ error: 'Код подтверждения обязателен' });
    }

    const user = await User.findByPk(req.session.userId);
    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    const decryptedSecret = decryptSecret(req.session.tempTwoFactorSecret);
    const verified = speakeasy.totp.verify({
      secret: decryptedSecret,
      encoding: 'base32',
      token: token,
      window: 2
    });

    if (!verified) {
      return res.status(400).json({ error: 'Неверный код подтверждения' });
    }

    await user.update({
      twoFactorSecret: req.session.tempTwoFactorSecret,
      twoFactorEnabled: true
    });

    delete req.session.tempTwoFactorSecret;
    req.session.twoFactorVerified = true;

    res.json({
      message: '2FA успешно включена',
      twoFactorEnabled: true
    });
  } catch (error) {
    console.error('Ошибка подтверждения 2FA:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

router.post('/login/2fa', async (req, res) => {
  try {
    const { email, password, token } = req.body;

    if (!email || !password || !token) {
      return res.status(400).json({ error: 'Email, пароль и код 2FA обязательны' });
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Неверный email или пароль' });
    }

    const isValidPassword = await verifyPassword(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Неверный email или пароль' });
    }

    if (!user.twoFactorEnabled || !user.twoFactorSecret) {
      return res.status(400).json({ error: '2FA не настроена для этого аккаунта' });
    }

    const decryptedSecret = decryptSecret(user.twoFactorSecret);
    const verified = speakeasy.totp.verify({
      secret: decryptedSecret,
      encoding: 'base32',
      token: token,
      window: 2
    });

    if (!verified) {
      return res.status(401).json({ error: 'Неверный код 2FA' });
    }

    req.session.userId = user.id;
    req.session.twoFactorVerified = true;

    res.json({
      message: 'Успешный вход с 2FA',
      user: {
        id: user.id,
        email: user.email,
        twoFactorEnabled: user.twoFactorEnabled
      }
    });
  } catch (error) {
    console.error('Ошибка входа с 2FA:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

router.post('/disable', async (req, res) => {
  try {
    const { password } = req.body;

    if (!req.session || !req.session.userId) {
      return res.status(401).json({ error: 'Требуется аутентификация' });
    }

    if (!password) {
      return res.status(400).json({ error: 'Пароль обязателен для отключения 2FA' });
    }

    const user = await User.findByPk(req.session.userId);
    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    const isValidPassword = await verifyPassword(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Неверный пароль' });
    }

    await user.update({
      twoFactorSecret: null,
      twoFactorEnabled: false
    });

    req.session.twoFactorVerified = true;

    res.json({
      message: '2FA успешно отключена',
      twoFactorEnabled: false
    });
  } catch (error) {
    console.error('Ошибка отключения 2FA:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

module.exports = router;
