const { DEFAULT_OPTIONS: TS_OPTIONS } = require('@gql2ts/language-typescript');
const { pascalize } = require('humps');

const FLOW_WRAP_PARTIAL = partial => `$SHAPE<${partial}>`;
const FLOW_INTERFACE_NAMER = name => `${pascalize(name)}`;
const FLOW_INTERFACE_BUILDER = (name, body) => `export type ${name} = ${body}`;
const FLOW_ENUM_NAME_GENERATOR = name => `${pascalize(name)}`;
const FLOW_TYPE_PRINTER = (type, isNonNull) => (isNonNull ? type : `?${type}`);
const FLOW_POST_PROCESSOR = str => `/* @flow */
${str}
`;
const FLOW_NAMESPACE_GENERATOR = (_, interfaces) => `
// graphql flow definitions
${interfaces}
`;

const DEFAULT_OPTIONS = {
  ...TS_OPTIONS,
  printType: FLOW_TYPE_PRINTER,
  generateInterfaceName: FLOW_INTERFACE_NAMER,
  generateEnumName: FLOW_ENUM_NAME_GENERATOR,
  interfaceBuilder: FLOW_INTERFACE_BUILDER,
  generateNamespace: FLOW_NAMESPACE_GENERATOR,
  wrapPartial: FLOW_WRAP_PARTIAL,
  postProcessor: FLOW_POST_PROCESSOR,
};

module.exports = DEFAULT_OPTIONS;
