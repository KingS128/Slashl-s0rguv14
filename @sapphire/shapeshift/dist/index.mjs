import { inspect } from 'node:util';
import fastDeepEqual from 'fast-deep-equal/es6/index.js';
import uniqWith from 'lodash.uniqwith';

var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// src/lib/configs.ts
var validationEnabled = true;
function setGlobalValidationEnabled(enabled) {
  validationEnabled = enabled;
}
__name(setGlobalValidationEnabled, "setGlobalValidationEnabled");
function getGlobalValidationEnabled() {
  return validationEnabled;
}
__name(getGlobalValidationEnabled, "getGlobalValidationEnabled");

// src/lib/Result.ts
var Result = class {
  constructor(success, value, error) {
    this.success = success;
    if (success) {
      this.value = value;
    } else {
      this.error = error;
    }
  }
  isOk() {
    return this.success;
  }
  isErr() {
    return !this.success;
  }
  unwrap() {
    if (this.isOk())
      return this.value;
    throw this.error;
  }
  static ok(value) {
    return new Result(true, value);
  }
  static err(error) {
    return new Result(false, void 0, error);
  }
};
__name(Result, "Result");

// src/validators/util/getValue.ts
function getValue(valueOrFn) {
  return typeof valueOrFn === "function" ? valueOrFn() : valueOrFn;
}
__name(getValue, "getValue");

// src/validators/BaseValidator.ts
var BaseValidator = class {
  constructor(constraints = []) {
    this.constraints = [];
    this.isValidationEnabled = null;
    this.constraints = constraints;
  }
  get optional() {
    return new UnionValidator([new LiteralValidator(void 0), this.clone()]);
  }
  get nullable() {
    return new UnionValidator([new LiteralValidator(null), this.clone()]);
  }
  get nullish() {
    return new UnionValidator([new NullishValidator(), this.clone()]);
  }
  get array() {
    return new ArrayValidator(this.clone());
  }
  get set() {
    return new SetValidator(this.clone());
  }
  or(...predicates) {
    return new UnionValidator([this.clone(), ...predicates]);
  }
  transform(cb) {
    return this.addConstraint({ run: (input) => Result.ok(cb(input)) });
  }
  reshape(cb) {
    return this.addConstraint({ run: cb });
  }
  default(value) {
    return new DefaultValidator(this.clone(), value);
  }
  run(value) {
    let result = this.handle(value);
    if (result.isErr())
      return result;
    for (const constraint of this.constraints) {
      result = constraint.run(result.value);
      if (result.isErr())
        break;
    }
    return result;
  }
  parse(value) {
    if (!this.shouldRunConstraints) {
      return this.handle(value).unwrap();
    }
    return this.constraints.reduce((v, constraint) => constraint.run(v).unwrap(), this.handle(value).unwrap());
  }
  is(value) {
    return this.run(value).isOk();
  }
  setValidationEnabled(isValidationEnabled) {
    const clone = this.clone();
    clone.isValidationEnabled = isValidationEnabled;
    return clone;
  }
  getValidationEnabled() {
    return getValue(this.isValidationEnabled);
  }
  get shouldRunConstraints() {
    return getValue(this.isValidationEnabled) ?? getGlobalValidationEnabled();
  }
  clone() {
    const clone = Reflect.construct(this.constructor, [this.constraints]);
    clone.isValidationEnabled = this.isValidationEnabled;
    return clone;
  }
  addConstraint(constraint) {
    const clone = this.clone();
    clone.constraints = clone.constraints.concat(constraint);
    return clone;
  }
};
__name(BaseValidator, "BaseValidator");

// src/lib/errors/BaseError.ts
var customInspectSymbol = Symbol.for("nodejs.util.inspect.custom");
var customInspectSymbolStackLess = Symbol.for("nodejs.util.inspect.custom.stack-less");
var BaseError = class extends Error {
  [customInspectSymbol](depth, options) {
    return `${this[customInspectSymbolStackLess](depth, options)}
${this.stack.slice(this.stack.indexOf("\n"))}`;
  }
};
__name(BaseError, "BaseError");

// src/lib/errors/BaseConstraintError.ts
var BaseConstraintError = class extends BaseError {
  constructor(constraint, message, given) {
    super(message);
    this.constraint = constraint;
    this.given = given;
  }
};
__name(BaseConstraintError, "BaseConstraintError");

// src/lib/errors/ExpectedConstraintError.ts
var ExpectedConstraintError = class extends BaseConstraintError {
  constructor(constraint, message, given, expected) {
    super(constraint, message, given);
    this.expected = expected;
  }
  toJSON() {
    return {
      name: this.name,
      constraint: this.constraint,
      given: this.given,
      expected: this.expected
    };
  }
  [customInspectSymbolStackLess](depth, options) {
    const constraint = options.stylize(this.constraint, "string");
    if (depth < 0) {
      return options.stylize(`[ExpectedConstraintError: ${constraint}]`, "special");
    }
    const newOptions = { ...options, depth: options.depth === null ? null : options.depth - 1 };
    const padding = `
  ${options.stylize("|", "undefined")} `;
    const given = inspect(this.given, newOptions).replace(/\n/g, padding);
    const header = `${options.stylize("ExpectedConstraintError", "special")} > ${constraint}`;
    const message = options.stylize(this.message, "regexp");
    const expectedBlock = `
  ${options.stylize("Expected: ", "string")}${options.stylize(this.expected, "boolean")}`;
    const givenBlock = `
  ${options.stylize("Received:", "regexp")}${padding}${given}`;
    return `${header}
  ${message}
${expectedBlock}
${givenBlock}`;
  }
};
__name(ExpectedConstraintError, "ExpectedConstraintError");
function isUnique(input) {
  if (input.length < 2)
    return true;
  const uniqueArray2 = uniqWith(input, fastDeepEqual);
  return uniqueArray2.length === input.length;
}
__name(isUnique, "isUnique");

// src/constraints/util/operators.ts
function lessThan(a, b) {
  return a < b;
}
__name(lessThan, "lessThan");
function lessThanOrEqual(a, b) {
  return a <= b;
}
__name(lessThanOrEqual, "lessThanOrEqual");
function greaterThan(a, b) {
  return a > b;
}
__name(greaterThan, "greaterThan");
function greaterThanOrEqual(a, b) {
  return a >= b;
}
__name(greaterThanOrEqual, "greaterThanOrEqual");
function equal(a, b) {
  return a === b;
}
__name(equal, "equal");
function notEqual(a, b) {
  return a !== b;
}
__name(notEqual, "notEqual");

// src/constraints/ArrayConstraints.ts
function arrayLengthComparator(comparator, name, expected, length) {
  return {
    run(input) {
      return comparator(input.length, length) ? Result.ok(input) : Result.err(new ExpectedConstraintError(name, "Invalid Array length", input, expected));
    }
  };
}
__name(arrayLengthComparator, "arrayLengthComparator");
function arrayLengthLessThan(value) {
  const expected = `expected.length < ${value}`;
  return arrayLengthComparator(lessThan, "s.array(T).lengthLessThan", expected, value);
}
__name(arrayLengthLessThan, "arrayLengthLessThan");
function arrayLengthLessThanOrEqual(value) {
  const expected = `expected.length <= ${value}`;
  return arrayLengthComparator(lessThanOrEqual, "s.array(T).lengthLessThanOrEqual", expected, value);
}
__name(arrayLengthLessThanOrEqual, "arrayLengthLessThanOrEqual");
function arrayLengthGreaterThan(value) {
  const expected = `expected.length > ${value}`;
  return arrayLengthComparator(greaterThan, "s.array(T).lengthGreaterThan", expected, value);
}
__name(arrayLengthGreaterThan, "arrayLengthGreaterThan");
function arrayLengthGreaterThanOrEqual(value) {
  const expected = `expected.length >= ${value}`;
  return arrayLengthComparator(greaterThanOrEqual, "s.array(T).lengthGreaterThanOrEqual", expected, value);
}
__name(arrayLengthGreaterThanOrEqual, "arrayLengthGreaterThanOrEqual");
function arrayLengthEqual(value) {
  const expected = `expected.length === ${value}`;
  return arrayLengthComparator(equal, "s.array(T).lengthEqual", expected, value);
}
__name(arrayLengthEqual, "arrayLengthEqual");
function arrayLengthNotEqual(value) {
  const expected = `expected.length !== ${value}`;
  return arrayLengthComparator(notEqual, "s.array(T).lengthNotEqual", expected, value);
}
__name(arrayLengthNotEqual, "arrayLengthNotEqual");
function arrayLengthRange(start, endBefore) {
  const expected = `expected.length >= ${start} && expected.length < ${endBefore}`;
  return {
    run(input) {
      return input.length >= start && input.length < endBefore ? Result.ok(input) : Result.err(new ExpectedConstraintError("s.array(T).lengthRange", "Invalid Array length", input, expected));
    }
  };
}
__name(arrayLengthRange, "arrayLengthRange");
function arrayLengthRangeInclusive(start, end) {
  const expected = `expected.length >= ${start} && expected.length <= ${end}`;
  return {
    run(input) {
      return input.length >= start && input.length <= end ? Result.ok(input) : Result.err(new ExpectedConstraintError("s.array(T).lengthRangeInclusive", "Invalid Array length", input, expected));
    }
  };
}
__name(arrayLengthRangeInclusive, "arrayLengthRangeInclusive");
function arrayLengthRangeExclusive(startAfter, endBefore) {
  const expected = `expected.length > ${startAfter} && expected.length < ${endBefore}`;
  return {
    run(input) {
      return input.length > startAfter && input.length < endBefore ? Result.ok(input) : Result.err(new ExpectedConstraintError("s.array(T).lengthRangeExclusive", "Invalid Array length", input, expected));
    }
  };
}
__name(arrayLengthRangeExclusive, "arrayLengthRangeExclusive");
var uniqueArray = {
  run(input) {
    return isUnique(input) ? Result.ok(input) : Result.err(new ExpectedConstraintError("s.array(T).unique", "Array values are not unique", input, "Expected all values to be unique"));
  }
};

// src/lib/errors/CombinedPropertyError.ts
var CombinedPropertyError = class extends BaseError {
  constructor(errors) {
    super("Received one or more errors");
    this.errors = errors;
  }
  [customInspectSymbolStackLess](depth, options) {
    if (depth < 0) {
      return options.stylize("[CombinedPropertyError]", "special");
    }
    const newOptions = { ...options, depth: options.depth === null ? null : options.depth - 1, compact: true };
    const padding = `
  ${options.stylize("|", "undefined")} `;
    const header = `${options.stylize("CombinedPropertyError", "special")} (${options.stylize(this.errors.length.toString(), "number")})`;
    const message = options.stylize(this.message, "regexp");
    const errors = this.errors.map(([key, error]) => {
      const property = CombinedPropertyError.formatProperty(key, options);
      const body = error[customInspectSymbolStackLess](depth - 1, newOptions).replace(/\n/g, padding);
      return `  input${property}${padding}${body}`;
    }).join("\n\n");
    return `${header}
  ${message}

${errors}`;
  }
  static formatProperty(key, options) {
    if (typeof key === "string")
      return options.stylize(`.${key}`, "symbol");
    if (typeof key === "number")
      return `[${options.stylize(key.toString(), "number")}]`;
    return `[${options.stylize("Symbol", "symbol")}(${key.description})]`;
  }
};
__name(CombinedPropertyError, "CombinedPropertyError");
var ValidationError = class extends BaseError {
  constructor(validator, message, given) {
    super(message);
    this.validator = validator;
    this.given = given;
  }
  toJSON() {
    return {
      name: this.name,
      validator: this.validator,
      given: this.given
    };
  }
  [customInspectSymbolStackLess](depth, options) {
    const validator = options.stylize(this.validator, "string");
    if (depth < 0) {
      return options.stylize(`[ValidationError: ${validator}]`, "special");
    }
    const newOptions = { ...options, depth: options.depth === null ? null : options.depth - 1, compact: true };
    const padding = `
  ${options.stylize("|", "undefined")} `;
    const given = inspect(this.given, newOptions).replace(/\n/g, padding);
    const header = `${options.stylize("ValidationError", "special")} > ${validator}`;
    const message = options.stylize(this.message, "regexp");
    const givenBlock = `
  ${options.stylize("Received:", "regexp")}${padding}${given}`;
    return `${header}
  ${message}
${givenBlock}`;
  }
};
__name(ValidationError, "ValidationError");

// src/validators/ArrayValidator.ts
var ArrayValidator = class extends BaseValidator {
  constructor(validator, constraints = []) {
    super(constraints);
    this.validator = validator;
  }
  lengthLessThan(length) {
    return this.addConstraint(arrayLengthLessThan(length));
  }
  lengthLessThanOrEqual(length) {
    return this.addConstraint(arrayLengthLessThanOrEqual(length));
  }
  lengthGreaterThan(length) {
    return this.addConstraint(arrayLengthGreaterThan(length));
  }
  lengthGreaterThanOrEqual(length) {
    return this.addConstraint(arrayLengthGreaterThanOrEqual(length));
  }
  lengthEqual(length) {
    return this.addConstraint(arrayLengthEqual(length));
  }
  lengthNotEqual(length) {
    return this.addConstraint(arrayLengthNotEqual(length));
  }
  lengthRange(start, endBefore) {
    return this.addConstraint(arrayLengthRange(start, endBefore));
  }
  lengthRangeInclusive(startAt, endAt) {
    return this.addConstraint(arrayLengthRangeInclusive(startAt, endAt));
  }
  lengthRangeExclusive(startAfter, endBefore) {
    return this.addConstraint(arrayLengthRangeExclusive(startAfter, endBefore));
  }
  get unique() {
    return this.addConstraint(uniqueArray);
  }
  clone() {
    return Reflect.construct(this.constructor, [this.validator, this.constraints]);
  }
  handle(values) {
    if (!Array.isArray(values)) {
      return Result.err(new ValidationError("s.array(T)", "Expected an array", values));
    }
    if (!this.shouldRunConstraints) {
      return Result.ok(values);
    }
    const errors = [];
    const transformed = [];
    for (let i = 0; i < values.length; i++) {
      const result = this.validator.run(values[i]);
      if (result.isOk())
        transformed.push(result.value);
      else
        errors.push([i, result.error]);
    }
    return errors.length === 0 ? Result.ok(transformed) : Result.err(new CombinedPropertyError(errors));
  }
};
__name(ArrayValidator, "ArrayValidator");

// src/constraints/BigIntConstraints.ts
function bigintComparator(comparator, name, expected, number) {
  return {
    run(input) {
      return comparator(input, number) ? Result.ok(input) : Result.err(new ExpectedConstraintError(name, "Invalid bigint value", input, expected));
    }
  };
}
__name(bigintComparator, "bigintComparator");
function bigintLessThan(value) {
  const expected = `expected < ${value}n`;
  return bigintComparator(lessThan, "s.bigint.lessThan", expected, value);
}
__name(bigintLessThan, "bigintLessThan");
function bigintLessThanOrEqual(value) {
  const expected = `expected <= ${value}n`;
  return bigintComparator(lessThanOrEqual, "s.bigint.lessThanOrEqual", expected, value);
}
__name(bigintLessThanOrEqual, "bigintLessThanOrEqual");
function bigintGreaterThan(value) {
  const expected = `expected > ${value}n`;
  return bigintComparator(greaterThan, "s.bigint.greaterThan", expected, value);
}
__name(bigintGreaterThan, "bigintGreaterThan");
function bigintGreaterThanOrEqual(value) {
  const expected = `expected >= ${value}n`;
  return bigintComparator(greaterThanOrEqual, "s.bigint.greaterThanOrEqual", expected, value);
}
__name(bigintGreaterThanOrEqual, "bigintGreaterThanOrEqual");
function bigintEqual(value) {
  const expected = `expected === ${value}n`;
  return bigintComparator(equal, "s.bigint.equal", expected, value);
}
__name(bigintEqual, "bigintEqual");
function bigintNotEqual(value) {
  const expected = `expected !== ${value}n`;
  return bigintComparator(notEqual, "s.bigint.notEqual", expected, value);
}
__name(bigintNotEqual, "bigintNotEqual");
function bigintDivisibleBy(divider) {
  const expected = `expected % ${divider}n === 0n`;
  return {
    run(input) {
      return input % divider === 0n ? Result.ok(input) : Result.err(new ExpectedConstraintError("s.bigint.divisibleBy", "BigInt is not divisible", input, expected));
    }
  };
}
__name(bigintDivisibleBy, "bigintDivisibleBy");

// src/validators/BigIntValidator.ts
var BigIntValidator = class extends BaseValidator {
  lessThan(number) {
    return this.addConstraint(bigintLessThan(number));
  }
  lessThanOrEqual(number) {
    return this.addConstraint(bigintLessThanOrEqual(number));
  }
  greaterThan(number) {
    return this.addConstraint(bigintGreaterThan(number));
  }
  greaterThanOrEqual(number) {
    return this.addConstraint(bigintGreaterThanOrEqual(number));
  }
  equal(number) {
    return this.addConstraint(bigintEqual(number));
  }
  notEqual(number) {
    return this.addConstraint(bigintNotEqual(number));
  }
  get positive() {
    return this.greaterThanOrEqual(0n);
  }
  get negative() {
    return this.lessThan(0n);
  }
  divisibleBy(number) {
    return this.addConstraint(bigintDivisibleBy(number));
  }
  get abs() {
    return this.transform((value) => value < 0 ? -value : value);
  }
  intN(bits) {
    return this.transform((value) => BigInt.asIntN(bits, value));
  }
  uintN(bits) {
    return this.transform((value) => BigInt.asUintN(bits, value));
  }
  handle(value) {
    return typeof value === "bigint" ? Result.ok(value) : Result.err(new ValidationError("s.bigint", "Expected a bigint primitive", value));
  }
};
__name(BigIntValidator, "BigIntValidator");

// src/constraints/BooleanConstraints.ts
var booleanTrue = {
  run(input) {
    return input ? Result.ok(input) : Result.err(new ExpectedConstraintError("s.boolean.true", "Invalid boolean value", input, "true"));
  }
};
var booleanFalse = {
  run(input) {
    return input ? Result.err(new ExpectedConstraintError("s.boolean.false", "Invalid boolean value", input, "false")) : Result.ok(input);
  }
};

// src/validators/BooleanValidator.ts
var BooleanValidator = class extends BaseValidator {
  get true() {
    return this.addConstraint(booleanTrue);
  }
  get false() {
    return this.addConstraint(booleanFalse);
  }
  equal(value) {
    return value ? this.true : this.false;
  }
  notEqual(value) {
    return value ? this.false : this.true;
  }
  handle(value) {
    return typeof value === "boolean" ? Result.ok(value) : Result.err(new ValidationError("s.boolean", "Expected a boolean primitive", value));
  }
};
__name(BooleanValidator, "BooleanValidator");

// src/constraints/DateConstraints.ts
function dateComparator(comparator, name, expected, number) {
  return {
    run(input) {
      return comparator(input.getTime(), number) ? Result.ok(input) : Result.err(new ExpectedConstraintError(name, "Invalid Date value", input, expected));
    }
  };
}
__name(dateComparator, "dateComparator");
function dateLessThan(value) {
  const expected = `expected < ${value.toISOString()}`;
  return dateComparator(lessThan, "s.date.lessThan", expected, value.getTime());
}
__name(dateLessThan, "dateLessThan");
function dateLessThanOrEqual(value) {
  const expected = `expected <= ${value.toISOString()}`;
  return dateComparator(lessThanOrEqual, "s.date.lessThanOrEqual", expected, value.getTime());
}
__name(dateLessThanOrEqual, "dateLessThanOrEqual");
function dateGreaterThan(value) {
  const expected = `expected > ${value.toISOString()}`;
  return dateComparator(greaterThan, "s.date.greaterThan", expected, value.getTime());
}
__name(dateGreaterThan, "dateGreaterThan");
function dateGreaterThanOrEqual(value) {
  const expected = `expected >= ${value.toISOString()}`;
  return dateComparator(greaterThanOrEqual, "s.date.greaterThanOrEqual", expected, value.getTime());
}
__name(dateGreaterThanOrEqual, "dateGreaterThanOrEqual");
function dateEqual(value) {
  const expected = `expected === ${value.toISOString()}`;
  return dateComparator(equal, "s.date.equal", expected, value.getTime());
}
__name(dateEqual, "dateEqual");
function dateNotEqual(value) {
  const expected = `expected !== ${value.toISOString()}`;
  return dateComparator(notEqual, "s.date.notEqual", expected, value.getTime());
}
__name(dateNotEqual, "dateNotEqual");
var dateInvalid = {
  run(input) {
    return Number.isNaN(input.getTime()) ? Result.ok(input) : Result.err(new ExpectedConstraintError("s.date.invalid", "Invalid Date value", input, "expected === NaN"));
  }
};
var dateValid = {
  run(input) {
    return Number.isNaN(input.getTime()) ? Result.err(new ExpectedConstraintError("s.date.valid", "Invalid Date value", input, "expected !== NaN")) : Result.ok(input);
  }
};

// src/validators/DateValidator.ts
var DateValidator = class extends BaseValidator {
  lessThan(date) {
    return this.addConstraint(dateLessThan(new Date(date)));
  }
  lessThanOrEqual(date) {
    return this.addConstraint(dateLessThanOrEqual(new Date(date)));
  }
  greaterThan(date) {
    return this.addConstraint(dateGreaterThan(new Date(date)));
  }
  greaterThanOrEqual(date) {
    return this.addConstraint(dateGreaterThanOrEqual(new Date(date)));
  }
  equal(date) {
    const resolved = new Date(date);
    return Number.isNaN(resolved.getTime()) ? this.invalid : this.addConstraint(dateEqual(resolved));
  }
  notEqual(date) {
    const resolved = new Date(date);
    return Number.isNaN(resolved.getTime()) ? this.valid : this.addConstraint(dateNotEqual(resolved));
  }
  get valid() {
    return this.addConstraint(dateValid);
  }
  get invalid() {
    return this.addConstraint(dateInvalid);
  }
  handle(value) {
    return value instanceof Date ? Result.ok(value) : Result.err(new ValidationError("s.date", "Expected a Date", value));
  }
};
__name(DateValidator, "DateValidator");
var ExpectedValidationError = class extends ValidationError {
  constructor(validator, message, given, expected) {
    super(validator, message, given);
    this.expected = expected;
  }
  toJSON() {
    return {
      name: this.name,
      validator: this.validator,
      given: this.given,
      expected: this.expected
    };
  }
  [customInspectSymbolStackLess](depth, options) {
    const validator = options.stylize(this.validator, "string");
    if (depth < 0) {
      return options.stylize(`[ExpectedValidationError: ${validator}]`, "special");
    }
    const newOptions = { ...options, depth: options.depth === null ? null : options.depth - 1 };
    const padding = `
  ${options.stylize("|", "undefined")} `;
    const expected = inspect(this.expected, newOptions).replace(/\n/g, padding);
    const given = inspect(this.given, newOptions).replace(/\n/g, padding);
    const header = `${options.stylize("ExpectedValidationError", "special")} > ${validator}`;
    const message = options.stylize(this.message, "regexp");
    const expectedBlock = `
  ${options.stylize("Expected:", "string")}${padding}${expected}`;
    const givenBlock = `
  ${options.stylize("Received:", "regexp")}${padding}${given}`;
    return `${header}
  ${message}
${expectedBlock}
${givenBlock}`;
  }
};
__name(ExpectedValidationError, "ExpectedValidationError");

// src/validators/InstanceValidator.ts
var InstanceValidator = class extends BaseValidator {
  constructor(expected, constraints = []) {
    super(constraints);
    this.expected = expected;
  }
  handle(value) {
    return value instanceof this.expected ? Result.ok(value) : Result.err(new ExpectedValidationError("s.instance(V)", "Expected", value, this.expected));
  }
  clone() {
    return Reflect.construct(this.constructor, [this.expected, this.constraints]);
  }
};
__name(InstanceValidator, "InstanceValidator");

// src/validators/LiteralValidator.ts
var LiteralValidator = class extends BaseValidator {
  constructor(literal, constraints = []) {
    super(constraints);
    this.expected = literal;
  }
  handle(value) {
    return Object.is(value, this.expected) ? Result.ok(value) : Result.err(new ExpectedValidationError("s.literal(V)", "Expected values to be equals", value, this.expected));
  }
  clone() {
    return Reflect.construct(this.constructor, [this.expected, this.constraints]);
  }
};
__name(LiteralValidator, "LiteralValidator");

// src/validators/NeverValidator.ts
var NeverValidator = class extends BaseValidator {
  handle(value) {
    return Result.err(new ValidationError("s.never", "Expected a value to not be passed", value));
  }
};
__name(NeverValidator, "NeverValidator");

// src/validators/NullishValidator.ts
var NullishValidator = class extends BaseValidator {
  handle(value) {
    return value === void 0 || value === null ? Result.ok(value) : Result.err(new ValidationError("s.nullish", "Expected undefined or null", value));
  }
};
__name(NullishValidator, "NullishValidator");

// src/constraints/NumberConstraints.ts
function numberComparator(comparator, name, expected, number) {
  return {
    run(input) {
      return comparator(input, number) ? Result.ok(input) : Result.err(new ExpectedConstraintError(name, "Invalid number value", input, expected));
    }
  };
}
__name(numberComparator, "numberComparator");
function numberLessThan(value) {
  const expected = `expected < ${value}`;
  return numberComparator(lessThan, "s.number.lessThan", expected, value);
}
__name(numberLessThan, "numberLessThan");
function numberLessThanOrEqual(value) {
  const expected = `expected <= ${value}`;
  return numberComparator(lessThanOrEqual, "s.number.lessThanOrEqual", expected, value);
}
__name(numberLessThanOrEqual, "numberLessThanOrEqual");
function numberGreaterThan(value) {
  const expected = `expected > ${value}`;
  return numberComparator(greaterThan, "s.number.greaterThan", expected, value);
}
__name(numberGreaterThan, "numberGreaterThan");
function numberGreaterThanOrEqual(value) {
  const expected = `expected >= ${value}`;
  return numberComparator(greaterThanOrEqual, "s.number.greaterThanOrEqual", expected, value);
}
__name(numberGreaterThanOrEqual, "numberGreaterThanOrEqual");
function numberEqual(value) {
  const expected = `expected === ${value}`;
  return numberComparator(equal, "s.number.equal", expected, value);
}
__name(numberEqual, "numberEqual");
function numberNotEqual(value) {
  const expected = `expected !== ${value}`;
  return numberComparator(notEqual, "s.number.notEqual", expected, value);
}
__name(numberNotEqual, "numberNotEqual");
var numberInt = {
  run(input) {
    return Number.isInteger(input) ? Result.ok(input) : Result.err(
      new ExpectedConstraintError("s.number.int", "Given value is not an integer", input, "Number.isInteger(expected) to be true")
    );
  }
};
var numberSafeInt = {
  run(input) {
    return Number.isSafeInteger(input) ? Result.ok(input) : Result.err(
      new ExpectedConstraintError(
        "s.number.safeInt",
        "Given value is not a safe integer",
        input,
        "Number.isSafeInteger(expected) to be true"
      )
    );
  }
};
var numberFinite = {
  run(input) {
    return Number.isFinite(input) ? Result.ok(input) : Result.err(new ExpectedConstraintError("s.number.finite", "Given value is not finite", input, "Number.isFinite(expected) to be true"));
  }
};
var numberNaN = {
  run(input) {
    return Number.isNaN(input) ? Result.ok(input) : Result.err(new ExpectedConstraintError("s.number.equal(NaN)", "Invalid number value", input, "expected === NaN"));
  }
};
var numberNotNaN = {
  run(input) {
    return Number.isNaN(input) ? Result.err(new ExpectedConstraintError("s.number.notEqual(NaN)", "Invalid number value", input, "expected !== NaN")) : Result.ok(input);
  }
};
function numberDivisibleBy(divider) {
  const expected = `expected % ${divider} === 0`;
  return {
    run(input) {
      return input % divider === 0 ? Result.ok(input) : Result.err(new ExpectedConstraintError("s.number.divisibleBy", "Number is not divisible", input, expected));
    }
  };
}
__name(numberDivisibleBy, "numberDivisibleBy");

// src/validators/NumberValidator.ts
var NumberValidator = class extends BaseValidator {
  lessThan(number) {
    return this.addConstraint(numberLessThan(number));
  }
  lessThanOrEqual(number) {
    return this.addConstraint(numberLessThanOrEqual(number));
  }
  greaterThan(number) {
    return this.addConstraint(numberGreaterThan(number));
  }
  greaterThanOrEqual(number) {
    return this.addConstraint(numberGreaterThanOrEqual(number));
  }
  equal(number) {
    return Number.isNaN(number) ? this.addConstraint(numberNaN) : this.addConstraint(numberEqual(number));
  }
  notEqual(number) {
    return Number.isNaN(number) ? this.addConstraint(numberNotNaN) : this.addConstraint(numberNotEqual(number));
  }
  get int() {
    return this.addConstraint(numberInt);
  }
  get safeInt() {
    return this.addConstraint(numberSafeInt);
  }
  get finite() {
    return this.addConstraint(numberFinite);
  }
  get positive() {
    return this.greaterThanOrEqual(0);
  }
  get negative() {
    return this.lessThan(0);
  }
  divisibleBy(divider) {
    return this.addConstraint(numberDivisibleBy(divider));
  }
  get abs() {
    return this.transform(Math.abs);
  }
  get sign() {
    return this.transform(Math.sign);
  }
  get trunc() {
    return this.transform(Math.trunc);
  }
  get floor() {
    return this.transform(Math.floor);
  }
  get fround() {
    return this.transform(Math.fround);
  }
  get round() {
    return this.transform(Math.round);
  }
  get ceil() {
    return this.transform(Math.ceil);
  }
  handle(value) {
    return typeof value === "number" ? Result.ok(value) : Result.err(new ValidationError("s.number", "Expected a number primitive", value));
  }
};
__name(NumberValidator, "NumberValidator");

// src/lib/errors/MissingPropertyError.ts
var MissingPropertyError = class extends BaseError {
  constructor(property) {
    super("A required property is missing");
    this.property = property;
  }
  toJSON() {
    return {
      name: this.name,
      property: this.property
    };
  }
  [customInspectSymbolStackLess](depth, options) {
    const property = options.stylize(this.property.toString(), "string");
    if (depth < 0) {
      return options.stylize(`[MissingPropertyError: ${property}]`, "special");
    }
    const header = `${options.stylize("MissingPropertyError", "special")} > ${property}`;
    const message = options.stylize(this.message, "regexp");
    return `${header}
  ${message}`;
  }
};
__name(MissingPropertyError, "MissingPropertyError");
var UnknownPropertyError = class extends BaseError {
  constructor(property, value) {
    super("Received unexpected property");
    this.property = property;
    this.value = value;
  }
  toJSON() {
    return {
      name: this.name,
      property: this.property,
      value: this.value
    };
  }
  [customInspectSymbolStackLess](depth, options) {
    const property = options.stylize(this.property.toString(), "string");
    if (depth < 0) {
      return options.stylize(`[UnknownPropertyError: ${property}]`, "special");
    }
    const newOptions = { ...options, depth: options.depth === null ? null : options.depth - 1, compact: true };
    const padding = `
  ${options.stylize("|", "undefined")} `;
    const given = inspect(this.value, newOptions).replace(/\n/g, padding);
    const header = `${options.stylize("UnknownPropertyError", "special")} > ${property}`;
    const message = options.stylize(this.message, "regexp");
    const givenBlock = `
  ${options.stylize("Received:", "regexp")}${padding}${given}`;
    return `${header}
  ${message}
${givenBlock}`;
  }
};
__name(UnknownPropertyError, "UnknownPropertyError");

// src/validators/DefaultValidator.ts
var DefaultValidator = class extends BaseValidator {
  constructor(validator, value, constraints = []) {
    super(constraints);
    this.validator = validator;
    this.defaultValue = value;
  }
  default(value) {
    const clone = this.clone();
    clone.defaultValue = value;
    return clone;
  }
  handle(value) {
    return typeof value === "undefined" ? Result.ok(getValue(this.defaultValue)) : this.validator["handle"](value);
  }
  clone() {
    return Reflect.construct(this.constructor, [this.validator, this.defaultValue, this.constraints]);
  }
};
__name(DefaultValidator, "DefaultValidator");

// src/lib/errors/CombinedError.ts
var CombinedError = class extends BaseError {
  constructor(errors) {
    super("Received one or more errors");
    this.errors = errors;
  }
  [customInspectSymbolStackLess](depth, options) {
    if (depth < 0) {
      return options.stylize("[CombinedError]", "special");
    }
    const newOptions = { ...options, depth: options.depth === null ? null : options.depth - 1, compact: true };
    const padding = `
  ${options.stylize("|", "undefined")} `;
    const header = `${options.stylize("CombinedError", "special")} (${options.stylize(this.errors.length.toString(), "number")})`;
    const message = options.stylize(this.message, "regexp");
    const errors = this.errors.map((error, i) => {
      const index = options.stylize((i + 1).toString(), "number");
      const body = error[customInspectSymbolStackLess](depth - 1, newOptions).replace(/\n/g, padding);
      return `  ${index} ${body}`;
    }).join("\n\n");
    return `${header}
  ${message}

${errors}`;
  }
};
__name(CombinedError, "CombinedError");

// src/validators/UnionValidator.ts
var UnionValidator = class extends BaseValidator {
  constructor(validators, constraints = []) {
    super(constraints);
    this.validators = validators;
  }
  get optional() {
    if (this.validators.length === 0)
      return new UnionValidator([new LiteralValidator(void 0)], this.constraints);
    const [validator] = this.validators;
    if (validator instanceof LiteralValidator) {
      if (validator.expected === void 0)
        return this.clone();
      if (validator.expected === null) {
        return new UnionValidator(
          [new NullishValidator(), ...this.validators.slice(1)],
          this.constraints
        );
      }
    } else if (validator instanceof NullishValidator) {
      return this.clone();
    }
    return new UnionValidator([new LiteralValidator(void 0), ...this.validators]);
  }
  get required() {
    if (this.validators.length === 0)
      return this.clone();
    const [validator] = this.validators;
    if (validator instanceof LiteralValidator) {
      if (validator.expected === void 0)
        return new UnionValidator(this.validators.slice(1), this.constraints);
    } else if (validator instanceof NullishValidator) {
      return new UnionValidator([new LiteralValidator(null), ...this.validators.slice(1)], this.constraints);
    }
    return this.clone();
  }
  get nullable() {
    if (this.validators.length === 0)
      return new UnionValidator([new LiteralValidator(null)], this.constraints);
    const [validator] = this.validators;
    if (validator instanceof LiteralValidator) {
      if (validator.expected === null)
        return this.clone();
      if (validator.expected === void 0) {
        return new UnionValidator(
          [new NullishValidator(), ...this.validators.slice(1)],
          this.constraints
        );
      }
    } else if (validator instanceof NullishValidator) {
      return this.clone();
    }
    return new UnionValidator([new LiteralValidator(null), ...this.validators]);
  }
  get nullish() {
    if (this.validators.length === 0)
      return new UnionValidator([new NullishValidator()], this.constraints);
    const [validator] = this.validators;
    if (validator instanceof LiteralValidator) {
      if (validator.expected === null || validator.expected === void 0) {
        return new UnionValidator([new NullishValidator(), ...this.validators.slice(1)], this.constraints);
      }
    } else if (validator instanceof NullishValidator) {
      return this.clone();
    }
    return new UnionValidator([new NullishValidator(), ...this.validators]);
  }
  or(...predicates) {
    return new UnionValidator([...this.validators, ...predicates]);
  }
  clone() {
    return Reflect.construct(this.constructor, [this.validators, this.constraints]);
  }
  handle(value) {
    const errors = [];
    for (const validator of this.validators) {
      const result = validator.run(value);
      if (result.isOk())
        return result;
      errors.push(result.error);
    }
    return Result.err(new CombinedError(errors));
  }
};
__name(UnionValidator, "UnionValidator");

// src/validators/ObjectValidator.ts
var ObjectValidator = class extends BaseValidator {
  constructor(shape, strategy = ObjectValidatorStrategy.Ignore, constraints = []) {
    super(constraints);
    this.keys = [];
    this.requiredKeys = /* @__PURE__ */ new Map();
    this.possiblyUndefinedKeys = /* @__PURE__ */ new Map();
    this.possiblyUndefinedKeysWithDefaults = /* @__PURE__ */ new Map();
    this.shape = shape;
    this.strategy = strategy;
    switch (this.strategy) {
      case ObjectValidatorStrategy.Ignore:
        this.handleStrategy = (value) => this.handleIgnoreStrategy(value);
        break;
      case ObjectValidatorStrategy.Strict: {
        this.handleStrategy = (value) => this.handleStrictStrategy(value);
        break;
      }
      case ObjectValidatorStrategy.Passthrough:
        this.handleStrategy = (value) => this.handlePassthroughStrategy(value);
        break;
    }
    const shapeEntries = Object.entries(shape);
    this.keys = shapeEntries.map(([key]) => key);
    for (const [key, validator] of shapeEntries) {
      if (validator instanceof UnionValidator) {
        const [possiblyLiteralOrNullishPredicate] = validator["validators"];
        if (possiblyLiteralOrNullishPredicate instanceof NullishValidator) {
          this.possiblyUndefinedKeys.set(key, validator);
        } else if (possiblyLiteralOrNullishPredicate instanceof LiteralValidator) {
          if (possiblyLiteralOrNullishPredicate.expected === void 0) {
            this.possiblyUndefinedKeys.set(key, validator);
          } else {
            this.requiredKeys.set(key, validator);
          }
        } else if (validator instanceof DefaultValidator) {
          this.possiblyUndefinedKeysWithDefaults.set(key, validator);
        } else {
          this.requiredKeys.set(key, validator);
        }
      } else if (validator instanceof NullishValidator) {
        this.possiblyUndefinedKeys.set(key, validator);
      } else if (validator instanceof LiteralValidator) {
        if (validator.expected === void 0) {
          this.possiblyUndefinedKeys.set(key, validator);
        } else {
          this.requiredKeys.set(key, validator);
        }
      } else if (validator instanceof DefaultValidator) {
        this.possiblyUndefinedKeysWithDefaults.set(key, validator);
      } else {
        this.requiredKeys.set(key, validator);
      }
    }
  }
  get strict() {
    return Reflect.construct(this.constructor, [this.shape, ObjectValidatorStrategy.Strict, this.constraints]);
  }
  get ignore() {
    return Reflect.construct(this.constructor, [this.shape, ObjectValidatorStrategy.Ignore, this.constraints]);
  }
  get passthrough() {
    return Reflect.construct(this.constructor, [this.shape, ObjectValidatorStrategy.Passthrough, this.constraints]);
  }
  get partial() {
    const shape = Object.fromEntries(this.keys.map((key) => [key, this.shape[key].optional]));
    return Reflect.construct(this.constructor, [shape, this.strategy, this.constraints]);
  }
  get required() {
    const shape = Object.fromEntries(
      this.keys.map((key) => {
        let validator = this.shape[key];
        if (validator instanceof UnionValidator)
          validator = validator.required;
        return [key, validator];
      })
    );
    return Reflect.construct(this.constructor, [shape, this.strategy, this.constraints]);
  }
  extend(schema) {
    const shape = { ...this.shape, ...schema instanceof ObjectValidator ? schema.shape : schema };
    return Reflect.construct(this.constructor, [shape, this.strategy, this.constraints]);
  }
  pick(keys) {
    const shape = Object.fromEntries(
      keys.filter((key) => this.keys.includes(key)).map((key) => [key, this.shape[key]])
    );
    return Reflect.construct(this.constructor, [shape, this.strategy, this.constraints]);
  }
  omit(keys) {
    const shape = Object.fromEntries(
      this.keys.filter((key) => !keys.includes(key)).map((key) => [key, this.shape[key]])
    );
    return Reflect.construct(this.constructor, [shape, this.strategy, this.constraints]);
  }
  handle(value) {
    const typeOfValue = typeof value;
    if (typeOfValue !== "object") {
      return Result.err(new ValidationError("s.object(T)", `Expected the value to be an object, but received ${typeOfValue} instead`, value));
    }
    if (value === null) {
      return Result.err(new ValidationError("s.object(T)", "Expected the value to not be null", value));
    }
    if (Array.isArray(value)) {
      return Result.err(new ValidationError("s.object(T)", "Expected the value to not be an array", value));
    }
    if (!this.shouldRunConstraints) {
      return Result.ok(value);
    }
    return this.handleStrategy(value);
  }
  clone() {
    return Reflect.construct(this.constructor, [this.shape, this.strategy, this.constraints]);
  }
  handleIgnoreStrategy(value) {
    const errors = [];
    const finalObject = {};
    const inputEntries = new Map(Object.entries(value));
    const runPredicate = /* @__PURE__ */ __name((key, predicate) => {
      const result = predicate.run(value[key]);
      if (result.isOk()) {
        finalObject[key] = result.value;
      } else {
        const error = result.error;
        errors.push([key, error]);
      }
    }, "runPredicate");
    for (const [key, predicate] of this.requiredKeys) {
      if (inputEntries.delete(key)) {
        runPredicate(key, predicate);
      } else {
        errors.push([key, new MissingPropertyError(key)]);
      }
    }
    for (const [key, validator] of this.possiblyUndefinedKeysWithDefaults) {
      inputEntries.delete(key);
      runPredicate(key, validator);
    }
    if (inputEntries.size === 0) {
      return errors.length === 0 ? Result.ok(finalObject) : Result.err(new CombinedPropertyError(errors));
    }
    const checkInputEntriesInsteadOfSchemaKeys = this.possiblyUndefinedKeys.size > inputEntries.size;
    if (checkInputEntriesInsteadOfSchemaKeys) {
      for (const [key] of inputEntries) {
        const predicate = this.possiblyUndefinedKeys.get(key);
        if (predicate) {
          runPredicate(key, predicate);
        }
      }
    } else {
      for (const [key, predicate] of this.possiblyUndefinedKeys) {
        if (inputEntries.delete(key)) {
          runPredicate(key, predicate);
        }
      }
    }
    return errors.length === 0 ? Result.ok(finalObject) : Result.err(new CombinedPropertyError(errors));
  }
  handleStrictStrategy(value) {
    const errors = [];
    const finalResult = {};
    const inputEntries = new Map(Object.entries(value));
    const runPredicate = /* @__PURE__ */ __name((key, predicate) => {
      const result = predicate.run(value[key]);
      if (result.isOk()) {
        finalResult[key] = result.value;
      } else {
        const error = result.error;
        errors.push([key, error]);
      }
    }, "runPredicate");
    for (const [key, predicate] of this.requiredKeys) {
      if (inputEntries.delete(key)) {
        runPredicate(key, predicate);
      } else {
        errors.push([key, new MissingPropertyError(key)]);
      }
    }
    for (const [key, validator] of this.possiblyUndefinedKeysWithDefaults) {
      inputEntries.delete(key);
      runPredicate(key, validator);
    }
    for (const [key, predicate] of this.possiblyUndefinedKeys) {
      if (inputEntries.size === 0) {
        break;
      }
      if (inputEntries.delete(key)) {
        runPredicate(key, predicate);
      }
    }
    if (inputEntries.size !== 0) {
      for (const [key, value2] of inputEntries.entries()) {
        errors.push([key, new UnknownPropertyError(key, value2)]);
      }
    }
    return errors.length === 0 ? Result.ok(finalResult) : Result.err(new CombinedPropertyError(errors));
  }
  handlePassthroughStrategy(value) {
    const result = this.handleIgnoreStrategy(value);
    return result.isErr() ? result : Result.ok({ ...value, ...result.value });
  }
};
__name(ObjectValidator, "ObjectValidator");
var ObjectValidatorStrategy = /* @__PURE__ */ ((ObjectValidatorStrategy2) => {
  ObjectValidatorStrategy2[ObjectValidatorStrategy2["Ignore"] = 0] = "Ignore";
  ObjectValidatorStrategy2[ObjectValidatorStrategy2["Strict"] = 1] = "Strict";
  ObjectValidatorStrategy2[ObjectValidatorStrategy2["Passthrough"] = 2] = "Passthrough";
  return ObjectValidatorStrategy2;
})(ObjectValidatorStrategy || {});

// src/validators/PassthroughValidator.ts
var PassthroughValidator = class extends BaseValidator {
  handle(value) {
    return Result.ok(value);
  }
};
__name(PassthroughValidator, "PassthroughValidator");

// src/validators/RecordValidator.ts
var RecordValidator = class extends BaseValidator {
  constructor(validator, constraints = []) {
    super(constraints);
    this.validator = validator;
  }
  clone() {
    return Reflect.construct(this.constructor, [this.validator, this.constraints]);
  }
  handle(value) {
    if (typeof value !== "object") {
      return Result.err(new ValidationError("s.record(T)", "Expected an object", value));
    }
    if (value === null) {
      return Result.err(new ValidationError("s.record(T)", "Expected the value to not be null", value));
    }
    if (Array.isArray(value)) {
      return Result.err(new ValidationError("s.record(T)", "Expected the value to not be an array", value));
    }
    if (!this.shouldRunConstraints) {
      return Result.ok(value);
    }
    const errors = [];
    const transformed = {};
    for (const [key, val] of Object.entries(value)) {
      const result = this.validator.run(val);
      if (result.isOk())
        transformed[key] = result.value;
      else
        errors.push([key, result.error]);
    }
    return errors.length === 0 ? Result.ok(transformed) : Result.err(new CombinedPropertyError(errors));
  }
};
__name(RecordValidator, "RecordValidator");

// src/validators/SetValidator.ts
var SetValidator = class extends BaseValidator {
  constructor(validator, constraints = []) {
    super(constraints);
    this.validator = validator;
  }
  clone() {
    return Reflect.construct(this.constructor, [this.validator, this.constraints]);
  }
  handle(values) {
    if (!(values instanceof Set)) {
      return Result.err(new ValidationError("s.set(T)", "Expected a set", values));
    }
    if (!this.shouldRunConstraints) {
      return Result.ok(values);
    }
    const errors = [];
    const transformed = /* @__PURE__ */ new Set();
    for (const value of values) {
      const result = this.validator.run(value);
      if (result.isOk())
        transformed.add(result.value);
      else
        errors.push(result.error);
    }
    return errors.length === 0 ? Result.ok(transformed) : Result.err(new CombinedError(errors));
  }
};
__name(SetValidator, "SetValidator");

// src/constraints/util/emailValidator.ts
var accountRegex = /^(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")$/;
function validateEmail(email) {
  if (!email)
    return false;
  const atIndex = email.indexOf("@");
  if (atIndex === -1)
    return false;
  if (atIndex > 64)
    return false;
  const domainIndex = atIndex + 1;
  if (email.includes("@", domainIndex))
    return false;
  if (email.length - domainIndex > 255)
    return false;
  let dotIndex = email.indexOf(".", domainIndex);
  if (dotIndex === -1)
    return false;
  let lastDotIndex = domainIndex;
  do {
    if (dotIndex - lastDotIndex > 63)
      return false;
    lastDotIndex = dotIndex + 1;
  } while ((dotIndex = email.indexOf(".", lastDotIndex)) !== -1);
  if (email.length - lastDotIndex > 63)
    return false;
  return accountRegex.test(email.slice(0, atIndex)) && validateEmailDomain(email.slice(domainIndex));
}
__name(validateEmail, "validateEmail");
function validateEmailDomain(domain) {
  try {
    return new URL(`http://${domain}`).hostname === domain;
  } catch {
    return false;
  }
}
__name(validateEmailDomain, "validateEmailDomain");

// src/constraints/util/net.ts
var v4Seg = "(?:[0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])";
var v4Str = `(${v4Seg}[.]){3}${v4Seg}`;
var IPv4Reg = new RegExp(`^${v4Str}$`);
var v6Seg = "(?:[0-9a-fA-F]{1,4})";
var IPv6Reg = new RegExp(
  `^((?:${v6Seg}:){7}(?:${v6Seg}|:)|(?:${v6Seg}:){6}(?:${v4Str}|:${v6Seg}|:)|(?:${v6Seg}:){5}(?::${v4Str}|(:${v6Seg}){1,2}|:)|(?:${v6Seg}:){4}(?:(:${v6Seg}){0,1}:${v4Str}|(:${v6Seg}){1,3}|:)|(?:${v6Seg}:){3}(?:(:${v6Seg}){0,2}:${v4Str}|(:${v6Seg}){1,4}|:)|(?:${v6Seg}:){2}(?:(:${v6Seg}){0,3}:${v4Str}|(:${v6Seg}){1,5}|:)|(?:${v6Seg}:){1}(?:(:${v6Seg}){0,4}:${v4Str}|(:${v6Seg}){1,6}|:)|(?::((?::${v6Seg}){0,5}:${v4Str}|(?::${v6Seg}){1,7}|:)))(%[0-9a-zA-Z-.:]{1,})?$`
);
function isIPv4(s2) {
  return IPv4Reg.test(s2);
}
__name(isIPv4, "isIPv4");
function isIPv6(s2) {
  return IPv6Reg.test(s2);
}
__name(isIPv6, "isIPv6");
function isIP(s2) {
  if (isIPv4(s2))
    return 4;
  if (isIPv6(s2))
    return 6;
  return 0;
}
__name(isIP, "isIP");

// src/constraints/util/phoneValidator.ts
var phoneNumberRegex = /^((?:\+|0{0,2})\d{1,2}\s?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}$/;
function validatePhoneNumber(input) {
  return phoneNumberRegex.test(input);
}
__name(validatePhoneNumber, "validatePhoneNumber");
var MultiplePossibilitiesConstraintError = class extends BaseConstraintError {
  constructor(constraint, message, given, expected) {
    super(constraint, message, given);
    this.expected = expected;
  }
  toJSON() {
    return {
      name: this.name,
      constraint: this.constraint,
      given: this.given,
      expected: this.expected
    };
  }
  [customInspectSymbolStackLess](depth, options) {
    const constraint = options.stylize(this.constraint, "string");
    if (depth < 0) {
      return options.stylize(`[MultiplePossibilitiesConstraintError: ${constraint}]`, "special");
    }
    const newOptions = { ...options, depth: options.depth === null ? null : options.depth - 1 };
    const verticalLine = options.stylize("|", "undefined");
    const padding = `
  ${verticalLine} `;
    const given = inspect(this.given, newOptions).replace(/\n/g, padding);
    const header = `${options.stylize("MultiplePossibilitiesConstraintError", "special")} > ${constraint}`;
    const message = options.stylize(this.message, "regexp");
    const expectedPadding = `
  ${verticalLine} - `;
    const expectedBlock = `
  ${options.stylize("Expected any of the following:", "string")}${expectedPadding}${this.expected.map((possible) => options.stylize(possible, "boolean")).join(expectedPadding)}`;
    const givenBlock = `
  ${options.stylize("Received:", "regexp")}${padding}${given}`;
    return `${header}
  ${message}
${expectedBlock}
${givenBlock}`;
  }
};
__name(MultiplePossibilitiesConstraintError, "MultiplePossibilitiesConstraintError");

// src/constraints/util/common/combinedResultFn.ts
function combinedErrorFn(...fns) {
  switch (fns.length) {
    case 0:
      return () => null;
    case 1:
      return fns[0];
    case 2: {
      const [fn0, fn1] = fns;
      return (...params) => fn0(...params) || fn1(...params);
    }
    default: {
      return (...params) => {
        for (const fn of fns) {
          const result = fn(...params);
          if (result)
            return result;
        }
        return null;
      };
    }
  }
}
__name(combinedErrorFn, "combinedErrorFn");

// src/constraints/util/urlValidators.ts
function createUrlValidators(options) {
  const fns = [];
  if (options?.allowedProtocols?.length)
    fns.push(allowedProtocolsFn(options.allowedProtocols));
  if (options?.allowedDomains?.length)
    fns.push(allowedDomainsFn(options.allowedDomains));
  return combinedErrorFn(...fns);
}
__name(createUrlValidators, "createUrlValidators");
function allowedProtocolsFn(allowedProtocols) {
  return (input, url) => allowedProtocols.includes(url.protocol) ? null : new MultiplePossibilitiesConstraintError("s.string.url", "Invalid URL protocol", input, allowedProtocols);
}
__name(allowedProtocolsFn, "allowedProtocolsFn");
function allowedDomainsFn(allowedDomains) {
  return (input, url) => allowedDomains.includes(url.hostname) ? null : new MultiplePossibilitiesConstraintError("s.string.url", "Invalid URL domain", input, allowedDomains);
}
__name(allowedDomainsFn, "allowedDomainsFn");

// src/constraints/StringConstraints.ts
function stringLengthComparator(comparator, name, expected, length) {
  return {
    run(input) {
      return comparator(input.length, length) ? Result.ok(input) : Result.err(new ExpectedConstraintError(name, "Invalid string length", input, expected));
    }
  };
}
__name(stringLengthComparator, "stringLengthComparator");
function stringLengthLessThan(length) {
  const expected = `expected.length < ${length}`;
  return stringLengthComparator(lessThan, "s.string.lengthLessThan", expected, length);
}
__name(stringLengthLessThan, "stringLengthLessThan");
function stringLengthLessThanOrEqual(length) {
  const expected = `expected.length <= ${length}`;
  return stringLengthComparator(lessThanOrEqual, "s.string.lengthLessThanOrEqual", expected, length);
}
__name(stringLengthLessThanOrEqual, "stringLengthLessThanOrEqual");
function stringLengthGreaterThan(length) {
  const expected = `expected.length > ${length}`;
  return stringLengthComparator(greaterThan, "s.string.lengthGreaterThan", expected, length);
}
__name(stringLengthGreaterThan, "stringLengthGreaterThan");
function stringLengthGreaterThanOrEqual(length) {
  const expected = `expected.length >= ${length}`;
  return stringLengthComparator(greaterThanOrEqual, "s.string.lengthGreaterThanOrEqual", expected, length);
}
__name(stringLengthGreaterThanOrEqual, "stringLengthGreaterThanOrEqual");
function stringLengthEqual(length) {
  const expected = `expected.length === ${length}`;
  return stringLengthComparator(equal, "s.string.lengthEqual", expected, length);
}
__name(stringLengthEqual, "stringLengthEqual");
function stringLengthNotEqual(length) {
  const expected = `expected.length !== ${length}`;
  return stringLengthComparator(notEqual, "s.string.lengthNotEqual", expected, length);
}
__name(stringLengthNotEqual, "stringLengthNotEqual");
function stringEmail() {
  return {
    run(input) {
      return validateEmail(input) ? Result.ok(input) : Result.err(new ExpectedConstraintError("s.string.email", "Invalid email address", input, "expected to be an email address"));
    }
  };
}
__name(stringEmail, "stringEmail");
function stringRegexValidator(type, expected, regex) {
  return {
    run(input) {
      return regex.test(input) ? Result.ok(input) : Result.err(new ExpectedConstraintError(type, "Invalid string format", input, expected));
    }
  };
}
__name(stringRegexValidator, "stringRegexValidator");
function stringUrl(options) {
  const validatorFn = createUrlValidators(options);
  return {
    run(input) {
      let url;
      try {
        url = new URL(input);
      } catch {
        return Result.err(new ExpectedConstraintError("s.string.url", "Invalid URL", input, "expected to match an URL"));
      }
      const validatorFnResult = validatorFn(input, url);
      if (validatorFnResult === null)
        return Result.ok(input);
      return Result.err(validatorFnResult);
    }
  };
}
__name(stringUrl, "stringUrl");
function stringIp(version) {
  const ipVersion = version ? `v${version}` : "";
  const validatorFn = version === 4 ? isIPv4 : version === 6 ? isIPv6 : isIP;
  const name = `s.string.ip${ipVersion}`;
  const message = `Invalid IP${ipVersion} address`;
  const expected = `expected to be an IP${ipVersion} address`;
  return {
    run(input) {
      return validatorFn(input) ? Result.ok(input) : Result.err(new ExpectedConstraintError(name, message, input, expected));
    }
  };
}
__name(stringIp, "stringIp");
function stringRegex(regex) {
  return stringRegexValidator("s.string.regex", `expected ${regex}.test(expected) to be true`, regex);
}
__name(stringRegex, "stringRegex");
function stringUuid({ version = 4, nullable = false } = {}) {
  version ?? (version = "1-5");
  const regex = new RegExp(
    `^(?:[0-9A-F]{8}-[0-9A-F]{4}-[${version}][0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}${nullable ? "|00000000-0000-0000-0000-000000000000" : ""})$`,
    "i"
  );
  const expected = `expected to match UUID${typeof version === "number" ? `v${version}` : ` in range of ${version}`}`;
  return stringRegexValidator("s.string.uuid", expected, regex);
}
__name(stringUuid, "stringUuid");
function stringDate() {
  return {
    run(input) {
      const time = Date.parse(input);
      return Number.isNaN(time) ? Result.err(
        new ExpectedConstraintError(
          "s.string.date",
          "Invalid date string",
          input,
          "expected to be a valid date string (in the ISO 8601 or ECMA-262 format)"
        )
      ) : Result.ok(input);
    }
  };
}
__name(stringDate, "stringDate");
function stringPhone() {
  return {
    run(input) {
      return validatePhoneNumber(input) ? Result.ok(input) : Result.err(new ExpectedConstraintError("s.string.phone", "Invalid phone number", input, "expected to be a phone number"));
    }
  };
}
__name(stringPhone, "stringPhone");

// src/validators/StringValidator.ts
var StringValidator = class extends BaseValidator {
  lengthLessThan(length) {
    return this.addConstraint(stringLengthLessThan(length));
  }
  lengthLessThanOrEqual(length) {
    return this.addConstraint(stringLengthLessThanOrEqual(length));
  }
  lengthGreaterThan(length) {
    return this.addConstraint(stringLengthGreaterThan(length));
  }
  lengthGreaterThanOrEqual(length) {
    return this.addConstraint(stringLengthGreaterThanOrEqual(length));
  }
  lengthEqual(length) {
    return this.addConstraint(stringLengthEqual(length));
  }
  lengthNotEqual(length) {
    return this.addConstraint(stringLengthNotEqual(length));
  }
  get email() {
    return this.addConstraint(stringEmail());
  }
  url(options) {
    return this.addConstraint(stringUrl(options));
  }
  uuid(options) {
    return this.addConstraint(stringUuid(options));
  }
  regex(regex) {
    return this.addConstraint(stringRegex(regex));
  }
  get date() {
    return this.addConstraint(stringDate());
  }
  get ipv4() {
    return this.ip(4);
  }
  get ipv6() {
    return this.ip(6);
  }
  ip(version) {
    return this.addConstraint(stringIp(version));
  }
  phone() {
    return this.addConstraint(stringPhone());
  }
  handle(value) {
    return typeof value === "string" ? Result.ok(value) : Result.err(new ValidationError("s.string", "Expected a string primitive", value));
  }
};
__name(StringValidator, "StringValidator");

// src/validators/TupleValidator.ts
var TupleValidator = class extends BaseValidator {
  constructor(validators, constraints = []) {
    super(constraints);
    this.validators = [];
    this.validators = validators;
  }
  clone() {
    return Reflect.construct(this.constructor, [this.validators, this.constraints]);
  }
  handle(values) {
    if (!Array.isArray(values)) {
      return Result.err(new ValidationError("s.tuple(T)", "Expected an array", values));
    }
    if (values.length !== this.validators.length) {
      return Result.err(new ValidationError("s.tuple(T)", `Expected an array of length ${this.validators.length}`, values));
    }
    if (!this.shouldRunConstraints) {
      return Result.ok(values);
    }
    const errors = [];
    const transformed = [];
    for (let i = 0; i < values.length; i++) {
      const result = this.validators[i].run(values[i]);
      if (result.isOk())
        transformed.push(result.value);
      else
        errors.push([i, result.error]);
    }
    return errors.length === 0 ? Result.ok(transformed) : Result.err(new CombinedPropertyError(errors));
  }
};
__name(TupleValidator, "TupleValidator");

// src/validators/MapValidator.ts
var MapValidator = class extends BaseValidator {
  constructor(keyValidator, valueValidator, constraints = []) {
    super(constraints);
    this.keyValidator = keyValidator;
    this.valueValidator = valueValidator;
  }
  clone() {
    return Reflect.construct(this.constructor, [this.keyValidator, this.valueValidator, this.constraints]);
  }
  handle(value) {
    if (!(value instanceof Map)) {
      return Result.err(new ValidationError("s.map(K, V)", "Expected a map", value));
    }
    if (!this.shouldRunConstraints) {
      return Result.ok(value);
    }
    const errors = [];
    const transformed = /* @__PURE__ */ new Map();
    for (const [key, val] of value.entries()) {
      const keyResult = this.keyValidator.run(key);
      const valueResult = this.valueValidator.run(val);
      const { length } = errors;
      if (keyResult.isErr())
        errors.push([key, keyResult.error]);
      if (valueResult.isErr())
        errors.push([key, valueResult.error]);
      if (errors.length === length)
        transformed.set(keyResult.value, valueResult.value);
    }
    return errors.length === 0 ? Result.ok(transformed) : Result.err(new CombinedPropertyError(errors));
  }
};
__name(MapValidator, "MapValidator");

// src/validators/LazyValidator.ts
var LazyValidator = class extends BaseValidator {
  constructor(validator, constraints = []) {
    super(constraints);
    this.validator = validator;
  }
  clone() {
    return Reflect.construct(this.constructor, [this.validator, this.constraints]);
  }
  handle(values) {
    return this.validator(values).run(values);
  }
};
__name(LazyValidator, "LazyValidator");

// src/lib/errors/UnknownEnumValueError.ts
var UnknownEnumValueError = class extends BaseError {
  constructor(value, keys, enumMappings) {
    super("Expected the value to be one of the following enum values:");
    this.value = value;
    this.enumKeys = keys;
    this.enumMappings = enumMappings;
  }
  toJSON() {
    return {
      name: this.name,
      value: this.value,
      enumKeys: this.enumKeys,
      enumMappings: [...this.enumMappings.entries()]
    };
  }
  [customInspectSymbolStackLess](depth, options) {
    const value = options.stylize(this.value.toString(), "string");
    if (depth < 0) {
      return options.stylize(`[UnknownEnumValueError: ${value}]`, "special");
    }
    const padding = `
  ${options.stylize("|", "undefined")} `;
    const pairs = this.enumKeys.map((key) => {
      const enumValue = this.enumMappings.get(key);
      return `${options.stylize(key, "string")} or ${options.stylize(
        enumValue.toString(),
        typeof enumValue === "number" ? "number" : "string"
      )}`;
    }).join(padding);
    const header = `${options.stylize("UnknownEnumValueError", "special")} > ${value}`;
    const message = options.stylize(this.message, "regexp");
    const pairsBlock = `${padding}${pairs}`;
    return `${header}
  ${message}
${pairsBlock}`;
  }
};
__name(UnknownEnumValueError, "UnknownEnumValueError");

// src/validators/NativeEnumValidator.ts
var NativeEnumValidator = class extends BaseValidator {
  constructor(enumShape) {
    super();
    this.hasNumericElements = false;
    this.enumMapping = /* @__PURE__ */ new Map();
    this.enumShape = enumShape;
    this.enumKeys = Object.keys(enumShape).filter((key) => {
      return typeof enumShape[enumShape[key]] !== "number";
    });
    for (const key of this.enumKeys) {
      const enumValue = enumShape[key];
      this.enumMapping.set(key, enumValue);
      this.enumMapping.set(enumValue, enumValue);
      if (typeof enumValue === "number") {
        this.hasNumericElements = true;
        this.enumMapping.set(`${enumValue}`, enumValue);
      }
    }
  }
  handle(value) {
    const typeOfValue = typeof value;
    if (typeOfValue === "number") {
      if (!this.hasNumericElements) {
        return Result.err(new ValidationError("s.nativeEnum(T)", "Expected the value to be a string", value));
      }
    } else if (typeOfValue !== "string") {
      return Result.err(new ValidationError("s.nativeEnum(T)", "Expected the value to be a string or number", value));
    }
    const casted = value;
    const possibleEnumValue = this.enumMapping.get(casted);
    return typeof possibleEnumValue === "undefined" ? Result.err(new UnknownEnumValueError(casted, this.enumKeys, this.enumMapping)) : Result.ok(possibleEnumValue);
  }
  clone() {
    return Reflect.construct(this.constructor, [this.enumShape]);
  }
};
__name(NativeEnumValidator, "NativeEnumValidator");

// src/constraints/TypedArrayLengthConstraints.ts
function typedArrayByteLengthComparator(comparator, name, expected, length) {
  return {
    run(input) {
      return comparator(input.byteLength, length) ? Result.ok(input) : Result.err(new ExpectedConstraintError(name, "Invalid Typed Array byte length", input, expected));
    }
  };
}
__name(typedArrayByteLengthComparator, "typedArrayByteLengthComparator");
function typedArrayByteLengthLessThan(value) {
  const expected = `expected.byteLength < ${value}`;
  return typedArrayByteLengthComparator(lessThan, "s.typedArray(T).byteLengthLessThan", expected, value);
}
__name(typedArrayByteLengthLessThan, "typedArrayByteLengthLessThan");
function typedArrayByteLengthLessThanOrEqual(value) {
  const expected = `expected.byteLength <= ${value}`;
  return typedArrayByteLengthComparator(lessThanOrEqual, "s.typedArray(T).byteLengthLessThanOrEqual", expected, value);
}
__name(typedArrayByteLengthLessThanOrEqual, "typedArrayByteLengthLessThanOrEqual");
function typedArrayByteLengthGreaterThan(value) {
  const expected = `expected.byteLength > ${value}`;
  return typedArrayByteLengthComparator(greaterThan, "s.typedArray(T).byteLengthGreaterThan", expected, value);
}
__name(typedArrayByteLengthGreaterThan, "typedArrayByteLengthGreaterThan");
function typedArrayByteLengthGreaterThanOrEqual(value) {
  const expected = `expected.byteLength >= ${value}`;
  return typedArrayByteLengthComparator(greaterThanOrEqual, "s.typedArray(T).byteLengthGreaterThanOrEqual", expected, value);
}
__name(typedArrayByteLengthGreaterThanOrEqual, "typedArrayByteLengthGreaterThanOrEqual");
function typedArrayByteLengthEqual(value) {
  const expected = `expected.byteLength === ${value}`;
  return typedArrayByteLengthComparator(equal, "s.typedArray(T).byteLengthEqual", expected, value);
}
__name(typedArrayByteLengthEqual, "typedArrayByteLengthEqual");
function typedArrayByteLengthNotEqual(value) {
  const expected = `expected.byteLength !== ${value}`;
  return typedArrayByteLengthComparator(notEqual, "s.typedArray(T).byteLengthNotEqual", expected, value);
}
__name(typedArrayByteLengthNotEqual, "typedArrayByteLengthNotEqual");
function typedArrayByteLengthRange(start, endBefore) {
  const expected = `expected.byteLength >= ${start} && expected.byteLength < ${endBefore}`;
  return {
    run(input) {
      return input.byteLength >= start && input.byteLength < endBefore ? Result.ok(input) : Result.err(new ExpectedConstraintError("s.typedArray(T).byteLengthRange", "Invalid Typed Array byte length", input, expected));
    }
  };
}
__name(typedArrayByteLengthRange, "typedArrayByteLengthRange");
function typedArrayByteLengthRangeInclusive(start, end) {
  const expected = `expected.byteLength >= ${start} && expected.byteLength <= ${end}`;
  return {
    run(input) {
      return input.byteLength >= start && input.byteLength <= end ? Result.ok(input) : Result.err(
        new ExpectedConstraintError("s.typedArray(T).byteLengthRangeInclusive", "Invalid Typed Array byte length", input, expected)
      );
    }
  };
}
__name(typedArrayByteLengthRangeInclusive, "typedArrayByteLengthRangeInclusive");
function typedArrayByteLengthRangeExclusive(startAfter, endBefore) {
  const expected = `expected.byteLength > ${startAfter} && expected.byteLength < ${endBefore}`;
  return {
    run(input) {
      return input.byteLength > startAfter && input.byteLength < endBefore ? Result.ok(input) : Result.err(
        new ExpectedConstraintError("s.typedArray(T).byteLengthRangeExclusive", "Invalid Typed Array byte length", input, expected)
      );
    }
  };
}
__name(typedArrayByteLengthRangeExclusive, "typedArrayByteLengthRangeExclusive");
function typedArrayLengthComparator(comparator, name, expected, length) {
  return {
    run(input) {
      return comparator(input.length, length) ? Result.ok(input) : Result.err(new ExpectedConstraintError(name, "Invalid Typed Array length", input, expected));
    }
  };
}
__name(typedArrayLengthComparator, "typedArrayLengthComparator");
function typedArrayLengthLessThan(value) {
  const expected = `expected.length < ${value}`;
  return typedArrayLengthComparator(lessThan, "s.typedArray(T).lengthLessThan", expected, value);
}
__name(typedArrayLengthLessThan, "typedArrayLengthLessThan");
function typedArrayLengthLessThanOrEqual(value) {
  const expected = `expected.length <= ${value}`;
  return typedArrayLengthComparator(lessThanOrEqual, "s.typedArray(T).lengthLessThanOrEqual", expected, value);
}
__name(typedArrayLengthLessThanOrEqual, "typedArrayLengthLessThanOrEqual");
function typedArrayLengthGreaterThan(value) {
  const expected = `expected.length > ${value}`;
  return typedArrayLengthComparator(greaterThan, "s.typedArray(T).lengthGreaterThan", expected, value);
}
__name(typedArrayLengthGreaterThan, "typedArrayLengthGreaterThan");
function typedArrayLengthGreaterThanOrEqual(value) {
  const expected = `expected.length >= ${value}`;
  return typedArrayLengthComparator(greaterThanOrEqual, "s.typedArray(T).lengthGreaterThanOrEqual", expected, value);
}
__name(typedArrayLengthGreaterThanOrEqual, "typedArrayLengthGreaterThanOrEqual");
function typedArrayLengthEqual(value) {
  const expected = `expected.length === ${value}`;
  return typedArrayLengthComparator(equal, "s.typedArray(T).lengthEqual", expected, value);
}
__name(typedArrayLengthEqual, "typedArrayLengthEqual");
function typedArrayLengthNotEqual(value) {
  const expected = `expected.length !== ${value}`;
  return typedArrayLengthComparator(notEqual, "s.typedArray(T).lengthNotEqual", expected, value);
}
__name(typedArrayLengthNotEqual, "typedArrayLengthNotEqual");
function typedArrayLengthRange(start, endBefore) {
  const expected = `expected.length >= ${start} && expected.length < ${endBefore}`;
  return {
    run(input) {
      return input.length >= start && input.length < endBefore ? Result.ok(input) : Result.err(new ExpectedConstraintError("s.typedArray(T).lengthRange", "Invalid Typed Array length", input, expected));
    }
  };
}
__name(typedArrayLengthRange, "typedArrayLengthRange");
function typedArrayLengthRangeInclusive(start, end) {
  const expected = `expected.length >= ${start} && expected.length <= ${end}`;
  return {
    run(input) {
      return input.length >= start && input.length <= end ? Result.ok(input) : Result.err(new ExpectedConstraintError("s.typedArray(T).lengthRangeInclusive", "Invalid Typed Array length", input, expected));
    }
  };
}
__name(typedArrayLengthRangeInclusive, "typedArrayLengthRangeInclusive");
function typedArrayLengthRangeExclusive(startAfter, endBefore) {
  const expected = `expected.length > ${startAfter} && expected.length < ${endBefore}`;
  return {
    run(input) {
      return input.length > startAfter && input.length < endBefore ? Result.ok(input) : Result.err(new ExpectedConstraintError("s.typedArray(T).lengthRangeExclusive", "Invalid Typed Array length", input, expected));
    }
  };
}
__name(typedArrayLengthRangeExclusive, "typedArrayLengthRangeExclusive");

// src/constraints/util/common/vowels.ts
var vowels = ["a", "e", "i", "o", "u"];
var aOrAn = /* @__PURE__ */ __name((word) => {
  return `${vowels.includes(word[0].toLowerCase()) ? "an" : "a"} ${word}`;
}, "aOrAn");

// src/constraints/util/typedArray.ts
var TypedArrays = {
  Int8Array: (x) => x instanceof Int8Array,
  Uint8Array: (x) => x instanceof Uint8Array,
  Uint8ClampedArray: (x) => x instanceof Uint8ClampedArray,
  Int16Array: (x) => x instanceof Int16Array,
  Uint16Array: (x) => x instanceof Uint16Array,
  Int32Array: (x) => x instanceof Int32Array,
  Uint32Array: (x) => x instanceof Uint32Array,
  Float32Array: (x) => x instanceof Float32Array,
  Float64Array: (x) => x instanceof Float64Array,
  BigInt64Array: (x) => x instanceof BigInt64Array,
  BigUint64Array: (x) => x instanceof BigUint64Array,
  TypedArray: (x) => ArrayBuffer.isView(x) && !(x instanceof DataView)
};

// src/validators/TypedArrayValidator.ts
var TypedArrayValidator = class extends BaseValidator {
  constructor(type, constraints = []) {
    super(constraints);
    this.type = type;
  }
  byteLengthLessThan(length) {
    return this.addConstraint(typedArrayByteLengthLessThan(length));
  }
  byteLengthLessThanOrEqual(length) {
    return this.addConstraint(typedArrayByteLengthLessThanOrEqual(length));
  }
  byteLengthGreaterThan(length) {
    return this.addConstraint(typedArrayByteLengthGreaterThan(length));
  }
  byteLengthGreaterThanOrEqual(length) {
    return this.addConstraint(typedArrayByteLengthGreaterThanOrEqual(length));
  }
  byteLengthEqual(length) {
    return this.addConstraint(typedArrayByteLengthEqual(length));
  }
  byteLengthNotEqual(length) {
    return this.addConstraint(typedArrayByteLengthNotEqual(length));
  }
  byteLengthRange(start, endBefore) {
    return this.addConstraint(typedArrayByteLengthRange(start, endBefore));
  }
  byteLengthRangeInclusive(startAt, endAt) {
    return this.addConstraint(typedArrayByteLengthRangeInclusive(startAt, endAt));
  }
  byteLengthRangeExclusive(startAfter, endBefore) {
    return this.addConstraint(typedArrayByteLengthRangeExclusive(startAfter, endBefore));
  }
  lengthLessThan(length) {
    return this.addConstraint(typedArrayLengthLessThan(length));
  }
  lengthLessThanOrEqual(length) {
    return this.addConstraint(typedArrayLengthLessThanOrEqual(length));
  }
  lengthGreaterThan(length) {
    return this.addConstraint(typedArrayLengthGreaterThan(length));
  }
  lengthGreaterThanOrEqual(length) {
    return this.addConstraint(typedArrayLengthGreaterThanOrEqual(length));
  }
  lengthEqual(length) {
    return this.addConstraint(typedArrayLengthEqual(length));
  }
  lengthNotEqual(length) {
    return this.addConstraint(typedArrayLengthNotEqual(length));
  }
  lengthRange(start, endBefore) {
    return this.addConstraint(typedArrayLengthRange(start, endBefore));
  }
  lengthRangeInclusive(startAt, endAt) {
    return this.addConstraint(typedArrayLengthRangeInclusive(startAt, endAt));
  }
  lengthRangeExclusive(startAfter, endBefore) {
    return this.addConstraint(typedArrayLengthRangeExclusive(startAfter, endBefore));
  }
  clone() {
    return Reflect.construct(this.constructor, [this.type, this.constraints]);
  }
  handle(value) {
    return TypedArrays[this.type](value) ? Result.ok(value) : Result.err(new ValidationError("s.typedArray", `Expected ${aOrAn(this.type)}`, value));
  }
};
__name(TypedArrayValidator, "TypedArrayValidator");

// src/lib/Shapes.ts
var Shapes = class {
  get string() {
    return new StringValidator();
  }
  get number() {
    return new NumberValidator();
  }
  get bigint() {
    return new BigIntValidator();
  }
  get boolean() {
    return new BooleanValidator();
  }
  get date() {
    return new DateValidator();
  }
  object(shape) {
    return new ObjectValidator(shape);
  }
  get undefined() {
    return this.literal(void 0);
  }
  get null() {
    return this.literal(null);
  }
  get nullish() {
    return new NullishValidator();
  }
  get any() {
    return new PassthroughValidator();
  }
  get unknown() {
    return new PassthroughValidator();
  }
  get never() {
    return new NeverValidator();
  }
  enum(...values) {
    return this.union(...values.map((value) => this.literal(value)));
  }
  nativeEnum(enumShape) {
    return new NativeEnumValidator(enumShape);
  }
  literal(value) {
    if (value instanceof Date)
      return this.date.equal(value);
    return new LiteralValidator(value);
  }
  instance(expected) {
    return new InstanceValidator(expected);
  }
  union(...validators) {
    return new UnionValidator(validators);
  }
  array(validator) {
    return new ArrayValidator(validator);
  }
  typedArray(type = "TypedArray") {
    return new TypedArrayValidator(type);
  }
  get int8Array() {
    return this.typedArray("Int8Array");
  }
  get uint8Array() {
    return this.typedArray("Uint8Array");
  }
  get uint8ClampedArray() {
    return this.typedArray("Uint8ClampedArray");
  }
  get int16Array() {
    return this.typedArray("Int16Array");
  }
  get uint16Array() {
    return this.typedArray("Uint16Array");
  }
  get int32Array() {
    return this.typedArray("Int32Array");
  }
  get uint32Array() {
    return this.typedArray("Uint32Array");
  }
  get float32Array() {
    return this.typedArray("Float32Array");
  }
  get float64Array() {
    return this.typedArray("Float64Array");
  }
  get bigInt64Array() {
    return this.typedArray("BigInt64Array");
  }
  get bigUint64Array() {
    return this.typedArray("BigUint64Array");
  }
  tuple(validators) {
    return new TupleValidator(validators);
  }
  set(validator) {
    return new SetValidator(validator);
  }
  record(validator) {
    return new RecordValidator(validator);
  }
  map(keyValidator, valueValidator) {
    return new MapValidator(keyValidator, valueValidator);
  }
  lazy(validator) {
    return new LazyValidator(validator);
  }
};
__name(Shapes, "Shapes");

// src/index.ts
var s = new Shapes();

export { BaseError, CombinedError, CombinedPropertyError, ExpectedConstraintError, ExpectedValidationError, MissingPropertyError, MultiplePossibilitiesConstraintError, Result, UnknownEnumValueError, UnknownPropertyError, ValidationError, customInspectSymbol, customInspectSymbolStackLess, getGlobalValidationEnabled, s, setGlobalValidationEnabled };
//# sourceMappingURL=out.js.map
//# sourceMappingURL=index.mjs.map