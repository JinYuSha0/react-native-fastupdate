const fs = require('fs');
const path = require('path');

function analyzeEntryFiles(entryFileName) {
  return fs
    .readdirSync(path.join(process.cwd()))
    .filter(
      (filename) => filename === entryFileName || filename.endsWith('.split.js')
    )
    .map((filename) => path.join(process.cwd(), filename));
}

module.exports = analyzeEntryFiles;
