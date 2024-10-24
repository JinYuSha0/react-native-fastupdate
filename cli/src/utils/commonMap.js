const path = require('path');
const fs = require('fs');
const { createDirIfNotExists } = require('./fsUtils');

async function getCommonMap(platform, versionCode) {
  const commonMapFile = path.join(
    __dirname,
    '../../',
    'commonMap',
    `commonMap-${platform}-${versionCode}.json`
  );
  const isExists = fs.existsSync(commonMapFile);
  if (!isExists) return null;
  return JSON.parse(fs.readFileSync(commonMapFile).toString());
}

async function genCommonMap(platform, versionCode, content) {
  const commonMapDir = createDirIfNotExists(
    path.join(__dirname, '../../', 'commonMap')
  );
  fs.writeFileSync(
    path.join(commonMapDir, `commonMap-${platform}-${versionCode}.json`),
    JSON.stringify(content, null, 2)
  );
}

module.exports = {
  getCommonMap,
  genCommonMap,
};
