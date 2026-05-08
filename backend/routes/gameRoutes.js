const express = require('express');
const router = express.Router();
const { generateParagraph } = require('../utils/paragraphGenerator');

router.get('/paragraph', async (req, res) => {
  const level = parseInt(req.query.level) || 1;
  const quote = await generateParagraph(level);
  
  // Calculate match duration with scaling difficulty
  // Base WPM requirement increases with level (20 + level * 1.5)
  const targetWpm = 20 + (level * 1.5);
  const wordCount = quote.split(' ').length;
  const matchDuration = Math.max(30, Math.min(150, Math.ceil((wordCount / targetWpm) * 60) + 10));
  
  res.json({ quote, matchDuration });
});

module.exports = router;
