import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import authRoutes from './routes/auth.route.js';
import donorRoutes from './routes/donor.route.js';
import tagRoutes from './routes/tag.route.js';
import donationRoutes from './routes/donation.route.js';
import interestDomainRoutes from './routes/interestDomain.route.js';
import communicationRoutes from './routes/communication.route.js';

// ES Modules 中需要使用这种方式获取 __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();

app.use(express.json());

// API 路由
app.use('/api/auth', authRoutes);
app.use('/api/donors', donorRoutes);
app.use('/api/tags', tagRoutes);
app.use('/api/donations', donationRoutes);
app.use('/api/interest-domains', interestDomainRoutes);
app.use('/api/communications', communicationRoutes);

// 生产环境下提供静态文件
if (process.env.NODE_ENV === 'production') {
  // 提供静态文件
  app.use(express.static(path.join(__dirname, '../client/dist')));

  // 所有未匹配的路由都返回前端应用
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist', 'index.html'));
  });
}

// 开发环境下为了测试API
app.get('/', (req, res) => {
  res.json({ message: 'API is running' });
});

// 错误处理中间件
app.use((err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';
    return res.status(statusCode).json({ 
        success: false,
        statusCode,
        message,
     });
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
