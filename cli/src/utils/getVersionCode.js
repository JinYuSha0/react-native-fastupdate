const fs = require('fs');
const path = require('path');

function getVersionCode(platform) {
  if (platform === 'ios') {
    const app = require(path.join(process.cwd(), './app.json'));
    const plistFilePath = path.join(
      process.cwd(),
      'ios',
      app.name,
      'Info.plist'
    );
    const plistContent = fs.readFileSync(plistFilePath, 'utf-8');
    const versionCodeMatch = plistContent.match(
      /<key>CFBundleVersion<\/key>\s*<string>(.*?)<\/string>/
    );
    if (!versionCodeMatch?.[1]) return null;
    if (versionCodeMatch[1].startsWith('$(')) {
      const versionCodePlaceholder = versionCodeMatch[1].slice(2, -1);
      const pbxprojPath = path.join(
        process.cwd(),
        'ios',
        `${app.name}.xcodeproj`,
        'project.pbxproj'
      );
      const pbxprojContent = fs.readFileSync(pbxprojPath, 'utf-8');
      const versionMatches = pbxprojContent.match(
        new RegExp(`${versionCodePlaceholder}\\s*=\\s*(\\d+);`, 'g')
      );
      const versions = versionMatches
        .map((match) => {
          const valueMatch = match.match(
            new RegExp(`${versionCodePlaceholder}\\s*=\\s*(\\d+);`)
          );
          return valueMatch ? valueMatch[1] : null;
        })
        .map((version) => Number(version ?? -1));
      const result = Math.max(...versions, -1);
      return result < 0 ? null : result;
    }
    return versionCodeMatch[1];
  } else {
    const gradleFilePath = path.join(
      process.cwd(),
      './android/app/build.gradle'
    );
    const gradleContent = fs.readFileSync(gradleFilePath, 'utf-8');
    const versionCodeMatch = gradleContent.match(/versionCode\s+(\d+)/);
    return versionCodeMatch?.[1] ?? null;
  }
}

module.exports = getVersionCode;
