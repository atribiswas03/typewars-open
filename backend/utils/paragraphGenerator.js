const https = require('https');
const http = require('http');

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

const fetchFromAPI = (url, redirectCount = 0) => {
  if (redirectCount > 3) {
    return Promise.reject(new Error('Too many redirects'));
  }

  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    const options = {
      timeout: 5000,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36'
      },
      // Some APIs have expired certificates but still work. We'll allow it as a fallback.
      rejectUnauthorized: false 
    };

    const req = protocol.get(url, options, (res) => {
      // Handle Redirects (301, 302, 303, 307, 308)
      if ([301, 302, 303, 307, 308].includes(res.statusCode)) {
        const location = res.headers.location;
        if (location) {
          // Handle relative vs absolute URLs
          const nextUrl = location.startsWith('http') ? location : new URL(location, url).href;
          return fetchFromAPI(nextUrl, redirectCount + 1).then(resolve).catch(reject);
        }
      }

      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
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
  try {
    // Primary: Wikipedia (Proper English, Meaningful)
    const url = `https://en.wikipedia.org/api/rest_v1/page/random/summary`;
    const response = await fetchFromAPI(url);
    const data = JSON.parse(response);
    
    if (data && data.extract && data.extract.length > 50) {
      return data.extract.trim();
    }
  } catch (error) {
    console.warn('Wikipedia failed:', error.message);
    
    // Fallback 1: Quotable API
    try {
      const quoteResponse = await fetchFromAPI('https://api.quotable.io/random?minLength=100');
      const quoteData = JSON.parse(quoteResponse);
      if (quoteData && quoteData.content) {
        return `${quoteData.content} — ${quoteData.author}`;
      }
    } catch (quoteError) {
      console.warn('Quotable failed:', quoteError.message);
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
