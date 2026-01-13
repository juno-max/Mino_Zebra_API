import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import quoteRoutes from './routes/quotes.js';

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
const PORT = process.env.PORT || 3000;
const MINO_API_KEY = process.env.MINO_API_KEY;

// Validate configuration
if (!MINO_API_KEY) {
  console.error('ERROR: MINO_API_KEY environment variable is not set');
  console.error('Please set it in your .env file or export it:');
  console.error('  export MINO_API_KEY="your-api-key"');
  process.exit(1);
}

// Create Express app
const app = express();

// Serve static files from project root (for HTML files)
const projectRoot = path.join(__dirname, '..');
app.use(express.static(projectRoot));

// Middleware
app.use(express.json());

// CORS middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }

  next();
});

// Request logging
app.use((req: Request, res: Response, next: NextFunction) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'Mino Zebra API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// API info endpoint
app.get('/', (req: Request, res: Response) => {
  res.json({
    name: 'Mino Zebra API',
    description: 'Insurance quote aggregator using Mino.ai agents',
    version: '1.0.0',
    endpoints: {
      health: 'GET /health',
      createQuote: 'POST /api/quotes',
      getQuote: 'GET /api/quotes/:runId',
      streamQuote: 'GET /api/quotes/:runId/stream',
    },
    documentation: {
      createQuote: {
        method: 'POST',
        path: '/api/quotes',
        body: {
          vin: 'string (Vehicle Identification Number)',
          employmentStatus: 'EMPLOYED | UNEMPLOYED | SELF_EMPLOYED | RETIRED | STUDENT',
          educationLevel: 'HIGH_SCHOOL | SOME_COLLEGE | BACHELORS | MASTERS | DOCTORATE',
          phone: 'string (format: XXX-XXX-XXXX)',
          policyStartDate: 'string (format: YYYY-MM-DD)',
          mailingAddress: 'string',
          isMailingSameAsGaraging: 'boolean',
          garagingAddress: 'string (optional)',
        },
        response: {
          runId: 'string',
          status: 'processing',
          streamUrl: 'string',
        },
      },
    },
  });
});

// Sample data endpoint
app.get('/sample-data', (req: Request, res: Response) => {
  const sampleData = {
    driver: {
      firstName: "Crystal",
      lastName: "Mcpherson",
      dateOfBirth: "10/06/1987",
      gender: 1,
      phone: "3372548478",
      email: "xyz_1_tf@thezebra.com",
      maritalStatus: 0,
      education: 1,
      employment: 0,
      licenseNumber: "3726454522",
      licenseState: "TX"
    },
    vehicle: {
      vin: "2C3CDZAG2GH967639",
      year: 2016,
      make: "Dodge",
      model: "Challenger",
      submodel: "SXT 2dr Coupe",
      annualMileage: 10000,
      garagingAddress: "1304 E Copeland Rd"
    },
    address: {
      street: "1304 E Copeland Rd",
      city: "Arlington",
      state: "TX",
      zipcode: "76011",
      county: "Tarrant County"
    },
    policy: {
      startDate: "2025-09-25",
      currentlyInsured: true
    }
  };
  res.json(sampleData);
});

// Mount API routes
app.use('/api', quoteRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not found',
    path: req.path,
  });
});

// Error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message,
  });
});

// Start server
app.listen(PORT, () => {
  console.log('');
  console.log('╔══════════════════════════════════════════╗');
  console.log('║      Mino Zebra API - Quote Aggregator  ║');
  console.log('╚══════════════════════════════════════════╝');
  console.log('');
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`📖 API docs: http://localhost:${PORT}/`);
  console.log('');
  console.log('Ready to aggregate insurance quotes!');
  console.log('');
});
