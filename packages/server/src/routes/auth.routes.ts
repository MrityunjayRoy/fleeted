import { Router } from 'express';

import type { AuthService } from '../services/auth.service.js';
import { AuthController } from '../controllers/auth.controller.js';

export function createAuthRouter(authService: AuthService): Router {
  const controller = new AuthController(authService);
  const router = Router();

  router.post('/login', controller.login);
  router.get('/me', controller.me);

  return router;
}
