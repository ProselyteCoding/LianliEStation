module.exports = {
  babel: {
    plugins: [
      [
        'import',
        {
          libraryName: 'antd',
          libraryDirectory: 'es',
          style: false, // Antd 5.x 使用 CSS-in-JS，不需要手动导入样式
        },
      ],
    ],
  },
  webpack: {
    configure: (webpackConfig) => {
      // 优化 chunk 分割
      if (!webpackConfig.optimization) {
        webpackConfig.optimization = {};
      }
      if (!webpackConfig.optimization.splitChunks) {
        webpackConfig.optimization.splitChunks = {};
      }
      if (!webpackConfig.optimization.splitChunks.cacheGroups) {
        webpackConfig.optimization.splitChunks.cacheGroups = {};
      }

      // Antd 单独打包
      webpackConfig.optimization.splitChunks.cacheGroups.antd = {
        test: /[\\/]node_modules[\\/]antd[\\/]/,
        name: 'antd',
        priority: 20,
        reuseExistingChunk: true,
      };

      // Chart.js 单独打包
      webpackConfig.optimization.splitChunks.cacheGroups.charts = {
        test: /[\\/]node_modules[\\/](chart\.js|react-chartjs-2)[\\/]/,
        name: 'charts',
        priority: 15,
        reuseExistingChunk: true,
      };

      // emoji-picker 单独打包
      webpackConfig.optimization.splitChunks.cacheGroups.emoji = {
        test: /[\\/]node_modules[\\/]emoji-picker-react[\\/]/,
        name: 'emoji-picker',
        priority: 15,
        reuseExistingChunk: true,
      };

      return webpackConfig;
    },
  },
};
