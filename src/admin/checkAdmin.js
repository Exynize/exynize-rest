import logger from '../logger';

// action
export default (req, res, next) => {
    logger.debug('validating admin access for:', req.userInfo);
    if (req.userInfo && req.userInfo.isAdmin) {
        logger.debug('admin access validated for:', req.userInfo);
        return next();
    }

    logger.debug('admin access rejected for:', req.userInfo);
    return next(new Error('Access not allowed!'));
};
