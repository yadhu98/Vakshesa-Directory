import { Router } from 'express';
import multer from 'multer';
import { authMiddleware, adminMiddleware } from '../middleware/auth';
import { list, create, update, remove } from '../controllers/announcementController';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 8 },
  fileFilter: (_req, file, cb) => {
    if (['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) cb(null, true);
    else cb(new Error('Images must be JPG, PNG, or WEBP'));
  },
});

router.use(authMiddleware);
router.get('/', list);
router.post('/', adminMiddleware, upload.array('images', 8), create);
router.put('/:id', adminMiddleware, upload.array('images', 8), update);
router.delete('/:id', adminMiddleware, remove);

export default router;
