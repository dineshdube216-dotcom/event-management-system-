import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';

import authRoutes from './routes/auth.js';
import eventRoutes from './routes/events.js';
import proposalRoutes from './routes/proposals.js';
import documentRoutes from './routes/documents.js';
import analyticsRoutes from './routes/analytics.js';
import notificationRoutes from './routes/notifications.js';
import certificateRoutes from './routes/certificates.js';
import { initRealtime } from './realtime.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

// Initialize WebSocket Real-Time synchronization engine
initRealtime(server);

// Middleware
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

// Static file serving for uploads
app.use('/uploads', express.static(path.resolve(__dirname, '../uploads')));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/proposals', proposalRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/certificates', certificateRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    app: 'CEMS Backend API & Real-Time Engine',
    time: new Date().toISOString(),
    websocketPath: '/ws',
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Application Error:', err);
  res.status(500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

// Start HTTP & WebSocket Server
server.listen(PORT, () => {
  console.log(`\n==================================================`);
  console.log(`🚀 CEMS Live Server running at http://localhost:${PORT}`);
  console.log(`⚡ WebSocket Real-Time Engine active at ws://localhost:${PORT}/ws`);
  console.log(`📂 Uploads directory mounted at /uploads`);
  console.log(`==================================================\n`);
});
