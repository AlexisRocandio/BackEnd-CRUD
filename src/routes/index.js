import express from 'express';
import userRoutes from './users.js';    
import loginRoutes from './login.js';

const router = express.Router();

router.use('/api/users', userRoutes);  
router.use('/', loginRoutes);       

export { router };
