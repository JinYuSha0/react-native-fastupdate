const crypto = require('crypto');
const fs = require('fs');

function genHash(content) {
  const fsHash = crypto.createHash('md5');
  fsHash.update(content);
  return fsHash.digest('hex');
}

function genFileHash(path) {
  if (!fs.existsSync(path)) return '';
  const buffer = fs.readFileSync(path);
  return genHash(buffer);
}

module.exports = {
  genHash,
  genFileHash,
};
