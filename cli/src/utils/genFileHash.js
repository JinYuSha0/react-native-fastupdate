const crypto = require('crypto');
const fs = require('fs');

module.exports = function (path) {
  if (!fs.existsSync(path)) return '';
  const buffer = fs.readFileSync(path);
  const fsHash = crypto.createHash('md5');
  fsHash.update(buffer);
  return fsHash.digest('hex');
};
