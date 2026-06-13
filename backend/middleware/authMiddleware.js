import authService from '../services/authService.js';

const getTokenFromHeader = (authorizationHeader) => {
    if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
        return null;
    }

    return authorizationHeader.split(' ')[1];
};

export const protect = async (req, res, next) => {
    try {
        const token = getTokenFromHeader(req.headers.authorization);

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Authentication token is required',
            });
        }

        const user = await authService.verifyTokenAndGetUser(token);

        if (!user.isActive) {
            return res.status(403).json({
                success: false,
                message: 'This account is inactive. Please contact an administrator.',
            });
        }

        req.user = {
            id: user._id.toString(),
            email: user.email,
            role: user.role,
        };

        return next();
    } catch (error) {
        const statusCode = error.message === 'JWT_SECRET is not configured' ? 500 : 401;

        return res.status(statusCode).json({
            success: false,
            message: statusCode === 500 ? error.message : 'Invalid or expired authentication token',
        });
    }
};
