export const config = {
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? ['https://your-frontend-domain.vercel.app']
      : ['http://localhost:5173'],
    credentials: true
  },
  // ... other config
}; 