export const auth = {
    salt: process.env.EXYNIZE_AUTH_SALT || 'default-auth-salt',
};
export const db = {
    host: process.env.EXYNIZE_DB_HOST || 'docker.dev',
    database: process.env.EXYNIZE_DB_NAME || 'exynizedb',
    user: '',
    password: '',
};

export const requireEmailValidation = process.env.EXYNIZE_MAIL_VALIDATION ?
    process.env.EXYNIZE_MAIL_VALIDATION === '1' : true;

export const email = {
    host: process.env.EXYNIZE_MAIL_HOST || 'mail.server.com',
    port: process.env.EXYNIZE_MAIL_PORT || 465,
    secure: process.env.EXYNIZE_MAIL_SECURE ? true : false,
    auth: {
        user: process.env.EXYNIZE_MAIL_USER || 'user@server.com',
        pass: process.env.EXYNIZE_MAIL_PASS || 'password'
    },
};

export const jwtconf = {
    secret: process.env.EXYNIZE_JWT_SECRET || 'default-jwt-secret',
};

export const rabbit = {
    host: process.env.RABBITMQ_NODENAME || 'docker.dev',
    exchange: 'exynize.components.exchange',
};
