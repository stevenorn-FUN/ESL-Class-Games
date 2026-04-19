const fs   = require('fs');
const path = require('path');

const IMAGE_EXT   = /\.(jpg|jpeg|png|gif|webp)$/i;
const difficulties = ['easy', 'medium', 'hard', 'impossible'];

for (const diff of difficulties) {
  const dir     = path.join(__dirname, '..', 'What-Am-I', 'images', diff);
  const outFile = path.join(dir, 'cards.json');

  const files = fs.existsSync(dir)
    ? fs.readdirSync(dir).filter(f => IMAGE_EXT.test(f))
    : [];

  fs.writeFileSync(outFile, JSON.stringify(files));
  console.log(`${diff}: ${files.length} image(s)`);
}
