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
var loadMetroConfig = require('./utils/loadMetroConfig').default;
var genPathMacthRegExp = require('./utils/genPathMacthRegExp');
var getModuleIdFactory = require('./utils/getModuleId');
var { genHash, genFileHash } = require('./utils/genFileHash');

function _interopRequireDefault(e) {
  return e && e.__esModule ? e : { default: e };
}

function generateFileDetector(rootPath, moduleIdMap) {
  const genPath = (path) => path.replace(rootPath, '');
  const blackListRegExp = genPathMacthRegExp([
    { pathname: '__prelude__', isDir: false },
    {
      pathname: _path.default.join(rootPath, 'app.json'),
      isDir: false,
    },
    {
      pathname: `require-${_path.default.join(rootPath, 'node_modules/react-native/Libraries/Core/InitializeCore.js')}`,
      isDir: false,
    },
    {
      pathname: _path.default.join(
        rootPath,
        'node_modules/metro-runtime/src/polyfills/require.js'
      ),
      isDir: false,
    },
    {
      pathname: _path.default.join(
        rootPath,
        '../',
        'node_modules/metro-runtime/src/polyfills/require.js'
      ),
      isDir: false,
    },
  ]);

  return (filepath) => {
    try {
      if (blackListRegExp.test(filepath)) return false;
      const moduleInfo = moduleIdMap[genPath(filepath)];
      if (moduleInfo && moduleInfo.hash === genFileHash(filepath)) {
        return false;
      }
      console.log(filepath, blackListRegExp.test(filepath));
      return true;
    } catch {}
    return true;
  };
}

async function buildBundleWithConfig(
  args,
  ctx,
  bundleImpl = _bundle.default,
  versionCode,
  entryFile,
  componentName,
  moduleIdMap,
  startId
) {
  args.entryFile = entryFile;
  args.bundleOutput =
    args.platform === 'ios'
      ? _path.default.join(process.cwd(), `./ios/${componentName}.jsbundle`)
      : _path.default.join(
          process.cwd(),
          `./android/app/src/main/assets/${componentName}.android.bundle`
        );

  const config = await loadMetroConfig(ctx, {
    maxWorkers: args.maxWorkers,
    resetCache: args.resetCache,
    config: args.config,
  });

  const rootPath = process.cwd();
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

  const fileDetector = generateFileDetector(rootPath, moduleIdMap);
  const genPath = (path) => path.replace(rootPath, '');
  const getModuleId = getModuleIdFactory(startId);

  config.serializer.getPolyfills = function () {
    return [];
  };

  config.serializer.processModuleFilter = function (module) {
    const { path } = module;
    return fileDetector(path);
  };

  config.serializer.createModuleIdFactory = function () {
    return (path) => {
      path = genPath(path);
      const commonModule = moduleIdMap[path];
      if (commonModule) {
        return commonModule.id;
      }
      return getModuleId(path);
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

    const codeHash = genHash(bundle.code);

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
      common: false,
      componentName,
      bundleOutput: args.bundleOutput,
      assetsDest: args.assetsDest,
      hash: codeHash,
    };
  } finally {
    server.end();
  }
}

module.exports = buildBundleWithConfig;
