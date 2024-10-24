const path = require('path');
const fs = require('fs');
const { createDirIfNotExists } = require('./fsUtils');
var { genHash } = require('./genFileHash');

async function isExistsCommonMap(platform, versionCode, content) {
  const commonMapFile = path.join(
    __dirname,
    '../../',
    'commonMap',
    `commonMap-${platform}-${versionCode}-${genHash(content)}.json`
  );
  return fs.existsSync(commonMapFile);
}

async function genCommonMap(platform, versionCode, content) {
  const commonMapDir = createDirIfNotExists(
    path.join(__dirname, '../../', 'commonMap')
  );
  fs.writeFileSync(
    path.join(
      commonMapDir,
      `commonMap-${platform}-${versionCode}-${genHash(content)}.json`
    ),
    content
  );
}

module.exports = {
  isExistsCommonMap,
  genCommonMap,
};
