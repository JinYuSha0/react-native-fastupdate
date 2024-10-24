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
function _interopRequireDefault(e) {
  return e && e.__esModule ? e : { default: e };
}

async function buildBundleWithConfig(
  args,
  config,
  bundleImpl = _bundle.default
) {
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

    // Save the assets of the bundle
    const outputAssets = await server.getAssets({
      ..._Server.default.DEFAULT_BUNDLE_OPTIONS,
      ...requestOpts,
      bundleType: 'todo',
    });

    // When we're done saving bundle output and the assets, we're done.
    return await (0, _saveAssets.default)(
      outputAssets,
      args.platform,
      args.assetsDest,
      args.assetCatalogDest
    );
  } finally {
    server.end();
  }
}

module.exports = buildBundleWithConfig;
