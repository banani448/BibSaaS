import { Router } from 'express';

const router = Router();

router.get('/', (req, res) => {
  res.json({ message: 'Face analysis routes - coming soon' });
});

export default router;
