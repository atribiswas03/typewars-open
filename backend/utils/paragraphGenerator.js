const https = require('https');

const PARAGRAPHS = [
  "The neon lights flickered as the console hummed with rhythmic data streams. In the heart of the digital sprawl, a single line of code could change everything. Neural links pulsed with the weight of a thousand encrypted transmissions, while deep within the mainframe, shadows danced between the logic gates. It was a world built on silicon and light, where the boundary between man and machine grew thinner with every passing nanosecond.",
  "Deep within the heart of the ancient forest, the sunlight filtered through the dense canopy, casting long, dancing shadows on the mossy ground. The air was thick with the scent of damp earth and blooming wildflowers, and the only sound was the gentle rustle of leaves in the breeze. It was a place where time seemed to stand still, a sanctuary of peace and tranquility far removed from the bustling noise of the city.",
  "The digital age has transformed the way we communicate, work, and interact with the world around us. In this rapidly evolving landscape, the ability to process and synthesize information quickly is more crucial than ever. From the intricate circuits of a quantum computer to the vast networks of the global internet, every component plays a vital role in the grand symphony of modern technology.",
  "Space exploration has always captured the human imagination, pushing us to venture beyond the confines of our home planet and into the vast unknown of the cosmos. As we gaze upon the distant stars and galaxies, we are reminded of our own small place in the universe and the infinite possibilities that lie ahead. Each new discovery brings us one step closer to understanding the mysteries of existence.",
  "In the quiet moments of the early morning, before the world wakes up to its daily chaos, there is a certain magic in the air. The first light of dawn paints the sky in shades of pink and gold, and the world feels fresh and full of promise. It is a time for reflection, for setting intentions, and for finding the inner strength to face whatever challenges the day may bring.",
  "Artificial intelligence is no longer a futuristic concept found only in science fiction novels; it is a reality that is shaping the present and future of humanity. From autonomous vehicles and smart assistants to advanced medical diagnostics and financial forecasting, the applications of AI are vast and varied. As we continue to innovate, we must also consider the ethical implications of these powerful technologies.",
  "The ocean is a vast and mysterious realm, covering more than seventy percent of our planet's surface and teeming with a diverse array of life. From the shallow coral reefs bursting with color to the dark, crushing depths of the midnight zone, there is so much yet to be explored. Protecting these fragile ecosystems is essential for the health of our planet and the survival of countless species.",
  "History is a complex tapestry of events, personalities, and movements that have shaped the world into what it is today. By studying the past, we gain a deeper understanding of the present and can better navigate the path toward the future. Every victory, every failure, and every struggle provides valuable lessons that can guide us in our quest for a more just and equitable society."
];

const fetchFromAPI = (url) => {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { timeout: 5000 }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve(data);
        } else {
          reject(new Error(`API responded with status ${res.statusCode}`));
        }
      });
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('API request timed out'));
    });

    req.on('error', (err) => {
      reject(err);
    });
  });
};

const generateParagraph = async (level = 1) => {
  // Scaling length: Starts at ~2 sentences at lvl 1, goes up to ~12 at lvl 20+
  const numSentences = Math.min(12, Math.floor(level / 2) + 2);
  
  try {
    // Fetch from Metaphorpsum API (1 paragraph, dynamic sentence count)
    const url = `https://metaphorpsum.com/paragraphs/1/${numSentences}`;
    const text = await fetchFromAPI(url);
    
    if (text && text.length > 20) {
      return text.trim();
    }
  } catch (error) {
    console.warn('Metaphorpsum fetch failed, trying fallback API:', error.message);
    
    // Fallback API: Bacon Ipsum
    try {
      const backupUrl = `https://baconipsum.com/api/?type=all-meat&paras=1&sentences=${numSentences}&format=text`;
      const backupText = await fetchFromAPI(backupUrl);
      if (backupText && backupText.length > 20) {
        return backupText.trim();
      }
    } catch (backupError) {
      console.warn('All paragraph APIs failed, using local fallback:', backupError.message);
    }
  }

  // Final Fallback: Local Paragraphs
  let filtered = PARAGRAPHS;
  if (level <= 5) {
    filtered = PARAGRAPHS.filter(p => p.split('.').length <= 4);
  } else if (level <= 10) {
    filtered = PARAGRAPHS.filter(p => p.split('.').length > 4 && p.split('.').length <= 6);
  } else {
    filtered = PARAGRAPHS.filter(p => p.split('.').length > 6);
  }

  if (filtered.length === 0) filtered = PARAGRAPHS;

  const randomIndex = Math.floor(Math.random() * filtered.length);
  return filtered[randomIndex];
};

module.exports = { generateParagraph };
