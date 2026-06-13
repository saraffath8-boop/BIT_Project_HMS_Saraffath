export const authorizeRoles = (...allowedRoles) => (req, res, next) => {
    if (!req.user) return res.status(401).json({ success: false, message: 'Authentication is required before role authorization' });
    if (!allowedRoles.includes(req.user.role)) return res.status(403).json({ success: false, message: `Access denied. Required role: ${allowedRoles.join(' or ')}` });
    return next();
};
