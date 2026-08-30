import { Router } from 'express';

const router = Router();

router.get('/', (req, res) => {
  res.json({ message: 'Recommendation routes - coming soon' });
});

export default router;
