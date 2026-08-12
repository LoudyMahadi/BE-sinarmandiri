import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import testRoutes from './routes/test';
import productRoutes from './routes/products';
import transactionRoutes from './routes/transactions';
import pinAuthRoutes from './routes/pinAuth';
import stockRequestRoutes from './routes/stockRequests';
import stockMovementRoutes from './routes/stockMovements';
import ticketRoutes from './routes/tickets';
import financialRecordRoutes from './routes/financialRecords';

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/test', testRoutes);

app.get('/', (_req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
app.use('/api/products', productRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/pin-auth', pinAuthRoutes);
app.use('/api/stock-requests', stockRequestRoutes);
app.use('/api/stock-movements', stockMovementRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/financial-records', financialRecordRoutes);