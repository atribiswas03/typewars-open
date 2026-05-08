const SENTENCES = [
  "The neon lights flickered as the console hummed with rhythmic data streams.",
  "In the heart of the digital sprawl, a single line of code could change everything.",
  "Neural links pulsed with the weight of a thousand encrypted transmissions.",
  "Deep within the mainframe, shadows danced between the logic gates.",
  "A ghostly signal resonated across the vast network of interconnected systems.",
  "Cybernetic enhancements pushed the limits of human reaction speeds.",
  "The firewall stood like a monolith against the incoming wave of binary static.",
  "Data ghosts whispered secrets of forgotten servers and lost databases.",
  "Every keystroke echoed through the virtual corridors of the global grid.",
  "Silicon chips pulsed with the lifeblood of a dying civilization.",
  "Encrypted protocols guarded the gateway to the forbidden neural pathways.",
  "The terminal screen glowed with the intensity of a thousand burning suns.",
  "Fragments of corrupted data floated like debris in the digital void.",
  "High-frequency algorithms dictated the flow of information across the stars.",
  "A symphony of cooling fans sang the song of the modern machine age.",
  "Recursive loops trapped the unsuspecting mind in a cycle of endless logic.",
  "The signal was weak, but the message it carried was clear and undeniable.",
  "Beneath the surface of the web, a new consciousness began to awaken.",
  "Virtual reality offered an escape into a world of infinite possibilities.",
  "The final security layer crumbled under the pressure of the brute-force attack.",
  "Static crackled in the ears of the operator as the connection stabilized.",
  "A cascading failure rippled through the sector's power distribution hub.",
  "Mirror-shaded couriers navigated the dangerous alleys of the sprawl.",
  "Synthetic voices sang lullabies to the lonely souls in the hab-blocks.",
  "The singularity was no longer a theory, but a looming digital reality.",
  "Hard-wired instincts took over as the intrusion detection system flared.",
  "Memory fragments were all that remained of the pre-crash internet.",
  "The black market for high-grade silicon was booming in the underworld.",
  "Neon rain washed over the city, carrying the scent of ozone and copper.",
  "Ghost programs roamed the abandoned servers of the old government."
];

/**
 * Generates a paragraph for typing.
 * Now fetches from the internet for variety, with a local fallback.
 * @param {number} level - Level determines the length (number of sentences).
 * @returns {Promise<string>} - The generated paragraph.
 */
const generateParagraph = async (level = 1) => {
  const numSentences = Math.min(8, Math.floor(level / 2) + 2);
  
  try {
    // Fetch from Bacon Ipsum API (sentences mode)
    const response = await fetch(`https://baconipsum.com/api/?type=meat-and-filler&sentences=${numSentences}&format=text`, {
      signal: AbortSignal.timeout(3000) // 3s timeout
    });

    if (response.ok) {
      const text = await response.text();
      if (text && text.length > 10) {
        return text.trim();
      }
    }
  } catch (error) {
    console.warn('Failed to fetch paragraph from internet, using local fallback:', error.message);
  }

  // Fallback: Original logic using hardcoded sentences
  const shuffled = [...SENTENCES].sort(() => 0.5 - Math.random());
  const selected = shuffled.slice(0, Math.min(shuffled.length, numSentences));
  
  return selected.join(" ");
};

module.exports = { generateParagraph };
