const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors({
  origin: ['https://your-frontend-domain.vercel.app'],
  credentials: true
})); 