require('@babel/register')({
  ignore: [/\/build\//],
  presets: ['@babel/env', 'react-app'],
  plugins: [
    '@babel/plugin-syntax-dynamic-import',
    'dynamic-import-node-babel-7',
    '@babel/plugin-proposal-do-expressions',
    '@babel/plugin-proposal-optional-chaining',
    'lodash',
    'transform-decorators-legacy',
    [
      'flow-runtime',
      {
        warn: true,
      },
    ],
  ],
});

// Now that the nonsense is over... load up the server entry point
require('./server');
