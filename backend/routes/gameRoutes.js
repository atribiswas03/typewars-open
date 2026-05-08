const express = require('express');
const router = express.Router();
const { generateParagraph } = require('../utils/paragraphGenerator');

router.get('/paragraph', async (req, res) => {
  const level = parseInt(req.query.level) || 1;
  const quote = await generateParagraph(level);
  
  // Calculate match duration
  const wordCount = quote.split(' ').length;
  const matchDuration = Math.max(30, Math.min(120, Math.ceil((wordCount / 20) * 60) + 15));
  
  res.json({ quote, matchDuration });
});

module.exports = router;
