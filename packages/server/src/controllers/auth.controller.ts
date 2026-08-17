import type { Request, Response } from 'express';

import { LoginRequestSchema } from '@fleeted/shared';

import type { AuthService } from '../services/auth.service.js';

export class AuthController {
  constructor(private readonly authService: AuthService) {}

  login = async (req: Request, res: Response): Promise<void> => {
    const input = LoginRequestSchema.parse(req.body);
    const result = await this.authService.login(input);
    res.json(result);
  };

  me = async (req: Request, res: Response): Promise<void> => {
    if (!req.auth) {
      res.status(401).json({
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
      return;
    }
    const result = await this.authService.me(req.auth.sub);
    res.json(result);
  };
}
