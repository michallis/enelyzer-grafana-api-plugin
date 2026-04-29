import CopyWebpackPlugin from 'copy-webpack-plugin';
import ForkTsCheckerWebpackPlugin from 'fork-ts-checker-webpack-plugin';
import path from 'path';
import { Configuration, Compiler } from 'webpack';

// replace-in-file-webpack-plugin ships no @types package — use require with an inline type
type ReplaceRule = { search: string | RegExp; replace: string };
type ReplacePluginOpts = { dir: string; files?: string[]; rules: ReplaceRule[] };
// eslint-disable-next-line @typescript-eslint/no-require-imports
const ReplaceInFileWebpackPlugin: new (opts: ReplacePluginOpts[]) => { apply(c: Compiler): void } =
  require('replace-in-file-webpack-plugin');

const SOURCE_DIR = path.resolve(__dirname, '../../src');
const DIST_DIR = path.resolve(__dirname, '../../dist');

interface WebpackEnv {
  production?: boolean;
  development?: boolean;
}

export default async (env: WebpackEnv): Promise<Configuration> => {
  const isProduction = Boolean(env.production);

  return {
    context: path.join(process.cwd(), 'src'),
    devtool: isProduction ? 'source-map' : 'eval-source-map',
    entry: {
      module: path.join(SOURCE_DIR, 'module.ts'),
    },
    externals: [
      'lodash',
      'jquery',
      'moment',
      'slate',
      'emotion',
      '@emotion/react',
      '@emotion/css',
      'prismjs',
      'slate-plain-serializer',
      '@grafana/slate-react',
      'react',
      'react-dom',
      'react-redux',
      'redux',
      'rxjs',
      'react-router',
      'd3',
      'angular',
      '@grafana/ui',
      '@grafana/runtime',
      '@grafana/data',
      /^@grafana\/ui\/.*/,
      /^@grafana\/data\/.*/,
      /^@grafana\/runtime\/.*/,
      /^@grafana\/schema\/.*/,
    ],
    mode: isProduction ? 'production' : 'development',
    module: {
      rules: [
        {
          exclude: /(node_modules)/,
          test: /\.[tj]sx?$/,
          use: {
            loader: 'swc-loader',
            options: {
              jsc: {
                baseUrl: path.resolve(SOURCE_DIR),
                target: 'es2015',
                loose: false,
                parser: {
                  syntax: 'typescript',
                  tsx: true,
                  decorators: false,
                  dynamicImport: true,
                },
              },
            },
          },
        },
        {
          test: /\.css$/,
          use: ['style-loader', 'css-loader'],
        },
        {
          test: /\.(scss|sass)$/,
          use: ['style-loader', 'css-loader', 'sass-loader'],
        },
        {
          test: /\.(png|jpe?g|gif|svg)$/,
          type: 'asset/resource',
          generator: {
            filename: Boolean(env.production)
              ? '[file]'
              : '[path][name].[ext]',
          },
        },
        {
          test: /\.(woff|woff2|eot|ttf|otf)(\?v=\d+\.\d+\.\d+)?$/,
          type: 'asset/resource',
          generator: {
            filename: Boolean(env.production)
              ? '[file]'
              : '[path][name].[ext]',
          },
        },
      ],
    },
    output: {
      clean: {
        keep: new RegExp(`(.*?_(amd64|arm(64)?)(.exe)?|go_plugin_build_manifest)`),
      },
      filename: '[name].js',
      library: {
        type: 'amd',
      },
      path: DIST_DIR,
      publicPath: `public/plugins/enprove-enelyzer-datasource/`,
      uniqueName: 'enprove-enelyzer-datasource',
    },
    plugins: [
      new CopyWebpackPlugin({
        patterns: [
          { from: path.join(SOURCE_DIR, 'img'), to: path.join(DIST_DIR, 'img'), noErrorOnMissing: true },
          { from: path.join(SOURCE_DIR, 'plugin.json'), to: DIST_DIR },
          { from: path.join(process.cwd(), 'README.md'), to: DIST_DIR, noErrorOnMissing: true },
          { from: path.join(process.cwd(), 'LICENSE'), to: DIST_DIR, noErrorOnMissing: true },
        ],
      }),
      new ForkTsCheckerWebpackPlugin({
        async: Boolean(env.development),
        issue: {
          include: [{ file: '**/*.{ts,tsx}' }],
        },
        typescript: { configFile: path.join(process.cwd(), 'tsconfig.json') },
      }),
      new ReplaceInFileWebpackPlugin([
        {
          dir: DIST_DIR,
          files: ['plugin.json'],
          rules: [
            {
              search: '%VERSION%',
              replace: '1.0.0',
            },
          ],
        },
      ]),
    ],
    resolve: {
      extensions: ['.js', '.jsx', '.ts', '.tsx'],
      unsafeCache: true,
      symlinks: false,
      modules: [SOURCE_DIR, 'node_modules'],
    },
  };
};
