import { verifyAccessToken, tokenBlacklist } from '../utils/jwt.js';

export const protect = (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];

      // Check if blacklisted
      if (tokenBlacklist.has(token)) {
        return res.status(401).json({ message: 'Not authorized, token revoked' });
      }

      const decoded = verifyAccessToken(token);
      
      req.user = { userId: decoded.userId };
      next();
    } catch (error) {
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  } else {
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};
