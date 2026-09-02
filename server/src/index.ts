import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import analyzeRouter from './routes/analyze.js';
import quizRouter from './routes/quiz.js';

const app = express();
const PORT = Number(process.env.PORT) || 8787;

app.use(cors());
app.use(express.json({ limit: '2mb' }));

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, hasApiKey: Boolean(process.env.ANTHROPIC_API_KEY) });
});

app.use('/api/analyze', analyzeRouter);
app.use('/api/quiz', quizRouter);

app.listen(PORT, () => {
  console.log(`Knowledge Graph Quiz API listening on http://localhost:${PORT}`);
});
