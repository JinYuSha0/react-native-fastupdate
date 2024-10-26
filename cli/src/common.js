var _parseKeyValueParamArray = _interopRequireDefault(
  require('./utils/bundle/inner/parseKeyValueParamArray')
);
var _saveAssets = _interopRequireDefault(
  require('./utils/bundle/inner/saveAssets')
);
var _cliTools = require('@react-native-community/cli-tools');
var _chalk = _interopRequireDefault(require('chalk'));
var _Server = _interopRequireDefault(require('metro/src/Server'));
var _bundle = _interopRequireDefault(require('metro/src/shared/output/bundle'));
var _RamBundle = _interopRequireDefault(
  require('metro/src/shared/output/RamBundle')
);
var _path = _interopRequireDefault(require('path'));
var _fs = _interopRequireDefault(require('fs'));
var colors = require('colors');
var loadMetroConfig = require('./utils/bundle/inner/loadMetroConfig').default;
var genPathMacthRegExp = require('./utils/genPathMacthRegExp');
var getModuleIdFactory = require('./utils/getModuleId');
var { genHash, genFileHash } = require('./utils/genFileHash');
var {
  isExistsCommonMap,
  genCommonMap,
  getLatestCommonMap,
} = require('./utils/commonMap');
var genPathImportScript = require('./utils/genPathImportScript');
var { delDir, createDirIfNotExists } = require('./utils/fsUtils');
var hbc = require('./hbc');

function _interopRequireDefault(e) {
  return e && e.__esModule ? e : { default: e };
}

const rootPath = process.cwd() + _path.default.sep;
const genPath = (path) => {
  path = path.replace(rootPath, '');
  path = path.replace(_path.default.join(rootPath, '../'), '');
  return path;
};

function generateFileDetector(bundleConfig) {
  const {
    common: { whiteList, blackList },
  } = bundleConfig;
  const whiteSet = [...new Set(whiteList), 'node_modules'].map((path) => {
    const absolutePath = _path.default.join(rootPath, path);
    return {
      pathname: absolutePath,
      isDir: _fs.default.statSync(absolutePath).isDirectory(),
    };
  });
  const blackSet = [...new Set(blackList), '../node_modules'].map((path) => {
    const absolutePath = _path.default.join(rootPath, path);
    return {
      pathname: absolutePath,
      isDir: _fs.default.statSync(absolutePath).isDirectory(),
    };
  });
  const whiteListRegExp = genPathMacthRegExp([
    { pathname: '__prelude__', isDir: false },
    {
      pathname: _path.default.join(__dirname, '../polyfills/require.js'),
      isDir: false,
    },
    {
      pathname: _path.default.join(rootPath, 'app.json'),
      isDir: false,
    },
    {
      pathname: `require-${_path.default.join(rootPath, 'node_modules/react-native/Libraries/Core/InitializeCore.js')}`,
      isDir: false,
    },
    ...whiteSet,
  ]);
  const blackListRegExp = genPathMacthRegExp([
    {
      pathname: _path.default.join(
        rootPath,
        'node_modules/metro-runtime/src/polyfills/require.js'
      ),
      isDir: false,
    },
    ...blackSet,
  ]);
  return (filepath) => {
    try {
      if (blackListRegExp.test(filepath)) return false;
      if (whiteListRegExp.test(filepath)) return true;
    } catch {}
    return false;
  };
}

async function buildBundleWithConfig(
  args,
  ctx,
  bundleImpl = _bundle.default,
  versionCode,
  entryFiles
) {
  args.bundleOutput =
    args.platform === 'ios'
      ? _path.default.join(process.cwd(), './ios/common.jsbundle')
      : _path.default.join(
          process.cwd(),
          './android/app/src/main/assets/common.android.bundle'
        );

  if (
    args.common === false &&
    (await isExistsCommonMap(args.platform, versionCode)) &&
    _fs.default.existsSync(args.bundleOutput) &&
    genFileHash(args.bundleOutput) ===
      (await getLatestCommonMap(args.platform, versionCode))?.common?.hash
  ) {
    return {
      common: true,
      bundleOutput: args.bundleOutput,
      assetsDest: args.assetsDest,
      hash: genFileHash(args.bundleOutput),
    };
  }

  const combineEntryCode = genPathImportScript([
    ...entryFiles,
    _path.default.join(
      rootPath,
      'node_modules/react-native-fast-update/lib/commonjs/bootstrap'
    ),
  ]);
  const afterCallbacks = [];
  const tempDir = createDirIfNotExists(
    _path.default.join(__dirname, '../', `./temp/${Date.now()}`)
  );
  const combineEntryFile = _path.default.join(tempDir, 'combineEntry.js');
  args.entryFile = combineEntryFile;
  _fs.default.writeFileSync(combineEntryFile, combineEntryCode);
  afterCallbacks.push(() => {
    delDir(tempDir);
  });

  const config = await loadMetroConfig(ctx, {
    maxWorkers: args.maxWorkers,
    resetCache: args.resetCache,
    config: args.config,
  });

  const platform = args.platform;

  const customResolverOptions = (0, _parseKeyValueParamArray.default)(
    args.resolverOption ?? []
  );
  if (config.resolver.platforms.indexOf(args.platform) === -1) {
    _cliTools.logger.error(
      `Invalid platform ${
        args.platform ? `"${_chalk.default.bold(args.platform)}" ` : ''
      }selected.`
    );
    _cliTools.logger.info(
      `Available platforms are: ${config.resolver.platforms
        .map((x) => `"${_chalk.default.bold(x)}"`)
        .join(
          ', '
        )}. If you are trying to bundle for an out-of-tree platform, it may not be installed.`
    );
    throw new Error('Bundling failed');
  }

  const moduleIdMap = Object.create({});
  let bundleConfig = {
    common: {
      whiteList: [],
      blackList: [],
    },
  };
  try {
    bundleConfig = require(
      _path.default.join(process.cwd(), 'bundle.config.js')
    );
  } catch {}

  const getModuleId = getModuleIdFactory(0);
  const fileDetector = generateFileDetector(bundleConfig);

  const originGetPolyfills = config.serializer.getPolyfills;
  config.serializer.getPolyfills = function () {
    return [
      _path.default.join(__dirname, '../polyfills/require.js'),
      ...originGetPolyfills(),
    ];
  };

  config.serializer.processModuleFilter = function (module) {
    const { path } = module;
    return fileDetector(path);
  };

  config.serializer.createModuleIdFactory = function () {
    return function (path) {
      if (moduleIdMap[genPath(path)]) {
        return moduleIdMap[genPath(path)].id;
      }
      if (fileDetector(path)) {
        const id = getModuleId(genPath(path));
        moduleIdMap[genPath(path)] = {
          id,
          hash: genFileHash(path),
        };
        return id;
      }
      return null;
    };
  };

  // This is used by a bazillion of npm modules we don't control so we don't
  // have other choice than defining it as an env variable here.
  process.env.NODE_ENV = args.dev ? 'development' : 'production';
  let sourceMapUrl = args.sourcemapOutput;
  if (sourceMapUrl != null && !args.sourcemapUseAbsolutePath) {
    sourceMapUrl = _path.default.basename(sourceMapUrl);
  }

  // $FlowIgnore[prop-missing]
  const requestOpts = {
    entryFile: args.entryFile,
    sourceMapUrl,
    dev: args.dev,
    minify: args.minify !== undefined ? args.minify : !args.dev,
    platform: args.platform,
    unstable_transformProfile: args.unstableTransformProfile,
    customResolverOptions,
  };
  const server = new _Server.default(config);
  try {
    const bundle = await bundleImpl.build(server, requestOpts);

    // $FlowIgnore[class-object-subtyping]
    // $FlowIgnore[incompatible-call]
    // $FlowIgnore[prop-missing]
    // $FlowIgnore[incompatible-exact]
    await bundleImpl.save(bundle, args, _cliTools.logger.info);

    if (args.hbc) {
      await hbc(args.bundleOutput);
    }

    const codeHash = genHash(bundle.code);
    const commonMapExists = await isExistsCommonMap(
      platform,
      versionCode,
      codeHash
    );
    if (!commonMapExists) {
      await genCommonMap(
        platform,
        versionCode,
        codeHash,
        JSON.stringify(
          {
            common: { id: -1, hash: genFileHash(args.bundleOutput) },
            ...moduleIdMap,
          },
          null,
          2
        )
      );
    } else {
      console.log(
        colors.green(
          `The common map whose versionCode is ${versionCode} and the platform is ${platform} already exists`
        )
      );
    }

    // Save the assets of the bundle
    const outputAssets = await server.getAssets({
      ..._Server.default.DEFAULT_BUNDLE_OPTIONS,
      ...requestOpts,
      bundleType: 'todo',
    });

    // When we're done saving bundle output and the assets, we're done.
    await (0, _saveAssets.default)(
      outputAssets,
      args.platform,
      args.assetsDest,
      args.assetCatalogDest
    );

    return {
      common: true,
      bundleOutput: args.bundleOutput,
      assetsDest: args.assetsDest,
      hash: codeHash,
    };
  } finally {
    server.end();
    afterCallbacks.forEach((func) => func());
  }
}

module.exports = buildBundleWithConfig;
