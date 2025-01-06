const fs = require('fs');
const { request } = require('./request');
const {
  getLatestCommonMap,
  genCommonMap,
  isExistsCommonMap,
} = require('./commonMap');

class LocalGetCommonMapAdapter {
  async getCommonMap(options) {
    return await getLatestCommonMap(options);
  }

  async saveCommonMap(options, { codeHash, moduleIdMap }) {
    const { platform, versionCode, dependencies } = options;
    const commonMapFile = await isExistsCommonMap(
      platform,
      versionCode,
      codeHash
    );
    if (commonMapFile) {
      try {
        return JSON.parse(fs.readFileSync(commonMapFile).toString());
      } catch {}
    }
    const commonMap = {
      common: {
        id: -1,
        hash: codeHash,
        dependencies,
      },
      ...moduleIdMap,
    };
    await genCommonMap(
      platform,
      versionCode,
      codeHash,
      JSON.stringify(commonMap, null, 2)
    );
    return commonMap;
  }
}

class RemoteGetCommonMapAdapter {
  async getCommonMap(options) {
    const { commonMap } = await request.get('/publish/getCommonMap', {
      params: {
        versionCode: options.versionCode,
        platform: String(options.platform).toUpperCase(),
        environment: String(options.environment).toUpperCase(),
      },
    });

    return commonMap;
  }

  async saveCommonMap(options, { codeHash, moduleIdMap }) {
    //todo
  }
}

exports.getCommonMapInstance = (offline) =>
  offline ? new LocalGetCommonMapAdapter() : new RemoteGetCommonMapAdapter();
