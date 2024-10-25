const path = require('path');
const fs = require('fs');
const { createDirIfNotExists } = require('./fsUtils');

async function isExistsCommonMap(platform, versionCode, hash) {
  const tempDir = path.join(__dirname, '../../', 'commonMap');
  if (hash) {
    const commonMapFile = path.join(
      tempDir,
      `commonMap-${platform}-${versionCode}-${hash}.json`
    );
    return fs.existsSync(commonMapFile);
  } else {
    const files = fs.readdirSync(tempDir);
    const file = files.find((file) =>
      file.startsWith(`commonMap-${platform}-${versionCode}`)
    );
    return !!file;
  }
}

async function genCommonMap(platform, versionCode, hash, content) {
  const commonMapDir = createDirIfNotExists(
    path.join(__dirname, '../../', 'commonMap')
  );
  fs.writeFileSync(
    path.join(
      commonMapDir,
      `commonMap-${platform}-${versionCode}-${hash}.json`
    ),
    content
  );
}

async function getLatestCommonMap(platform, versionCode) {
  const prefix = `commonMap-${platform}-${versionCode}`;
  const tempDir = path.join(__dirname, '../../', 'commonMap');
  const files = fs.readdirSync(tempDir);
  const matchingFiles = files
    .filter((file) => file.startsWith(prefix))
    .map((file) => {
      const filePath = path.join(tempDir, file);
      const stats = fs.statSync(filePath);
      return { filePath, ctime: stats.ctime };
    });
  const latestFile = matchingFiles.sort((a, b) => b.ctime - a.ctime);
  if (latestFile.length > 0) {
    return JSON.parse(fs.readFileSync(latestFile[0].filePath));
  }
  return null;
}

module.exports = {
  isExistsCommonMap,
  genCommonMap,
  getLatestCommonMap,
};
