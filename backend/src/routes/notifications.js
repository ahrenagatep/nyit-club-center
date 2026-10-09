// /notifications: the signed-in user's own notifications (any role, own rows only)

const express = require('express');
const { listNotifications, markRead, markAllRead } = require('../controllers/notificationsController');
const { requireAuth } = require('../middleware/auth');
const { requireProfile } = require('../middleware/requireProfile');

const router = express.Router();

router.use(requireAuth, requireProfile);

router.get('/', listNotifications);          // ?unread=true&limit=&offset= → { notifications, unread_count, limit, offset, has_more }
router.post('/read-all', markAllRead);       // → { updated, unread_count: 0 }
router.post('/:id/read', markRead);          // → { notification_id, unread_count }

module.exports = router;
