const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
    app.use(
        '/api',
        createProxyMiddleware({
            target: 'http://127.0.0.1:5001',
            changeOrigin: true,
        })
    );
    app.use(
        '/uploads',
        createProxyMiddleware({
            target: 'http://127.0.0.1:5001',
            changeOrigin: true,
        })
    );
    app.use(
        '/assets',
        createProxyMiddleware({
            target: 'http://127.0.0.1:5001',
            changeOrigin: true,
        })
    );
};
