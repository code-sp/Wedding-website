import { User } from '../models.js';

export const scopeTenant = (req, _res, next) => {
  if (req.auth?.role !== 'admin') {
    const clientId = req.auth?.clientId;
    if (clientId) {
      req.query.clientId = clientId;
      if (req.body && typeof req.body === 'object' && !Array.isArray(req.body)) {
        req.body.clientId = clientId;
      }
    }
  }
  next();
};

export const requireTargetUserInTenant = async (req, res, next) => {
  if (req.auth?.role === 'admin') return next();

  const target = await User.findById(req.params.id).select('_id clientId');
  if (!target) return res.status(404).json({ error: 'User not found' });
  if (target.clientId !== req.auth?.clientId) {
    return res.status(403).json({ error: 'User belongs to another wedding' });
  }
  next();
};

export const forceSelfUserId = (req, _res, next) => {
  if (req.auth?.role !== 'admin' && req.auth?.userId) {
    req.body.userId = req.auth.userId;
  }
  next();
};
