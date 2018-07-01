/* eslint-disable eqeqeq */
// @flow
import { GraphQLScalarType, Kind } from 'graphql';
import type { GraphQLScalarTypeConfig } from 'graphql'; // eslint-disable-line

const config: GraphQLScalarTypeConfig<Date, string> = {
  name: 'DateTime',
  description:
    'A date-time string at UTC, such as 2007-12-03T10:15:30Z, ' +
    'compliant with the `date-time` format outlined in section 5.6 of ' +
    'the RFC 3339 profile of the ISO 8601 standard for representation ' +
    'of dates and times using the Gregorian calendar.',
  serialize(value) {
    const date = new Date(value);
    if (date == 'Invalid Date') {
      throw new TypeError(
        `${'DateTime cannot be serialized from a non string, non numeric or non Date type '}${JSON.stringify(
          value,
        )}`,
      );
    }
    return date.toISOString();
  },
  parseValue(value) {
    if (!(typeof value === 'string' || value instanceof String)) {
      throw new TypeError(`DateTime cannot represent non string type ${JSON.stringify(value)}`);
    }

    const date = new Date(value);
    if (date == 'Invalid Date') {
      throw new TypeError(`DateTime cannot represent an invalid date-time-string ${value}.`);
    }
    return date;
  },
  parseLiteral(ast) {
    if (ast.kind !== Kind.STRING) {
      throw new TypeError(`DateTime cannot represent non string type ${String(ast.value != null ? ast.value : null)}`);
    }
    const { value } = ast;
    const date = new Date(value);
    if (date == 'Invalid Date') {
      throw new TypeError(`DateTime cannot represent an invalid date-time-string ${String(value)}.`);
    }
    return date;
  },
};

export default new GraphQLScalarType(config);
