const express = require('express');
const router = express.Router();
const versionCheck = require('../middlewares/versionCheck');
const authController = require('../controllers/authController');
const { authenticate, authorize } = require('../middlewares/authMiddleware');

router.get('/github', authController.redirectToGithub);
router.get('/github/callback', authController.githubAuth);

router.use(versionCheck);

router.post('/refresh', authController.refreshToken);
router.get('/profile', authenticate, authController.getProfile);
router.post('/logout', authenticate, authController.logout);           

module.exports = router;