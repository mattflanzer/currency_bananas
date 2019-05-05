import express from 'express';
import { buy, sell, status, dump } from '../controllers/bananasController.js';

const router = express.Router();

router.post('/buy', buy);
router.post('/sell', sell);
router.get('/status/:date', status);
router.get('/dump', dump);

export default router;

