require('@babel/register')({
  ignore: [/\/(build|node_modules)\//],
  presets: ['@babel/env', 'react-app'],
  plugins: [
    '@babel/plugin-syntax-dynamic-import',
    'dynamic-import-node-babel-7',
    '@babel/plugin-proposal-do-expressions',
    '@babel/plugin-proposal-optional-chaining',
    'transform-decorators-legacy',
    [
      'flow-runtime',
      {
        assert: true,
        annotate: true,
        warn: true,
      },
    ],
  ],
});

require('./server');