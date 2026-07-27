require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const connectDB = require('./src/config/db');
const { notFound, errorHandler } = require('./src/middleware/errorHandler');

// Route imports
const authRoutes = require('./src/routes/authRoutes');
const opdRoutes = require('./src/routes/opdRoutes');
const ipdRoutes = require('./src/routes/ipdRoutes');
const pharmacyRoutes = require('./src/routes/pharmacyRoutes');
const userManagementRoutes = require('./src/routes/userManagementRoutes');
const dashboardRoutes = require('./src/routes/dashboardRoutes');
const billingRoutes = require('./src/routes/billingRoutes');
const settingsRoutes = require('./src/routes/settingsRoutes');
const reportsRoutes = require('./src/routes/reportsRoutes');
const searchRoutes = require('./src/routes/searchRoutes');

connectDB();

const app = express();

// Core middleware
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
if (process.env.NODE_ENV !== 'production') app.use(morgan('dev'));

// Health check
app.get('/api/health', (req, res) => res.json({ success: true, message: 'HMS API is running' }));

// Mount routes - each prefix mirrors an admin UI module
app.use('/api/auth', authRoutes);
app.use('/api/opd', opdRoutes);
app.use('/api/ipd', ipdRoutes);
app.use('/api/pharmacy', pharmacyRoutes);
app.use('/api/users', userManagementRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/search', searchRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`HMS backend running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
});
