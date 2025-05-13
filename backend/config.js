const config = {
    development: {
        PORT: 5000,
        MONGODB_URI: 'mongodb://localhost:27017/EcomerceChatbot',
        NODE_ENV: 'development',
        jwtSecret: 'your-secret-key-development'
    },
    production: {
        PORT: process.env.PORT || 5000,
        MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/EcomerceChatbot',
        NODE_ENV: 'production',
        jwtSecret: process.env.JWT_SECRET || 'your-secret-key-production'
    }
};

const env = process.env.NODE_ENV || 'development';
module.exports = config[env]; 