module.exports = function (startId = 0) {
  let id = startId;
  const targetMap = new Map();
  return (path) => {
    if (targetMap.has(path)) {
      return targetMap.get(path);
    } else {
      targetMap.set(path, id);
      return id++;
    }
  };
};
