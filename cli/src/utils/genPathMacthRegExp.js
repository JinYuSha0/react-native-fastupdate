const path = require('path');
const sep = path.sep;

module.exports = function genPathMacthRegExp(pathList) {
  if (!pathList || pathList.length === 0) return /\s/;
  const startsWithRegExp = pathList
    .map(({ pathname, isDir }) => ({
      pathname: path
        .normalize(pathname)
        .replace(new RegExp(`\\${sep}`, 'g'), `\\${sep}`),
      isDir,
    }))
    .map(({ pathname, isDir }) => {
      return `\\${sep}?${pathname}${isDir ? `\\${sep}.*` : ''}`;
    })
    .join('|');
  return new RegExp(`\^(${startsWithRegExp})\\${sep}?([^\\${sep}]*)$`);
};
