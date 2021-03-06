'use strict';

const SchemaType = require('../schematype');
const util = require('../util');
const ValidationError = require('../error/validation');

const isArray = Array.isArray;

/**
 * Array schema type.
 *
 * @class
 * @param {String} name
 * @param {Object} [options]
 *   @param {Boolean} [options.required=false]
 *   @param {Array|Function} [options.default=[]]
 *   @param {SchemaType} [options.child]
 * @extends {SchemaType}
 */
function SchemaTypeArray(name, options) {
  SchemaType.call(this, name, Object.assign({
    default: []
  }, options));

  this.child = this.options.child || new SchemaType(name);
}

util.inherits(SchemaTypeArray, SchemaType);

/**
 * Casts an array and its child elements.
 *
 * @param {*} value
 * @param {Object} data
 * @return {Array}
 */
SchemaTypeArray.prototype.cast = function(value_, data) {
  let value = SchemaType.prototype.cast.call(this, value_, data);
  if (value == null) return value;

  if (!isArray(value)) value = [value];
  if (!value.length) return value;

  const child = this.child;

  for (let i = 0, len = value.length; i < len; i++) {
    value[i] = child.cast(value[i], data);
  }

  return value;
};

/**
 * Validates an array and its child elements.
 *
 * @param {*} value
 * @param {Object} data
 * @return {Array|Error}
 */
SchemaTypeArray.prototype.validate = function(value_, data) {
  const value = SchemaType.prototype.validate.call(this, value_, data);

  if (!isArray(value)) {
    throw new ValidationError(`\`${value}\` is not an array!`);
  }

  if (!value.length) return value;

  const child = this.child;

  for (let i = 0, len = value.length; i < len; i++) {
    value[i] = child.validate(value[i], data);
  }

  return value;
};

/**
 * Compares an array by its child elements and the size of the array.
 *
 * @param {Array} a
 * @param {Array} b
 * @return {Number}
 */
SchemaTypeArray.prototype.compare = function(a, b) {
  if (a) {
    if (!b) return 1;
  } else {
    return b ? -1 : 0;
  }

  const lenA = a.length;
  const lenB = b.length;
  const child = this.child;

  for (let i = 0, len = Math.min(lenA, lenB); i < len; i++) {
    const result = child.compare(a[i], b[i]);
    if (result !== 0) return result;
  }

  // Compare by length
  return lenA - lenB;
};

/**
 * Parses data.
 *
 * @param {Array} value
 * @param {Object} data
 * @return {Array}
 */
SchemaTypeArray.prototype.parse = function(value, data) {
  if (!value) return value;

  const len = value.length;
  if (!len) return [];

  const result = new Array(len);
  const child = this.child;

  for (let i = 0; i < len; i++) {
    result[i] = child.parse(value[i], data);
  }

  return result;
};

/**
 * Transforms data.
 *
 * @param {Array} value
 * @param {Object} data
 * @return {Array}
 */
SchemaTypeArray.prototype.value = function(value, data) {
  if (!value) return value;

  const len = value.length;
  if (!len) return [];

  const result = new Array(len);
  const child = this.child;

  for (let i = 0; i < len; i++) {
    result[i] = child.value(value[i], data);
  }

  return result;
};

/**
 * Checks the equality of an array.
 *
 * @param {Array} value
 * @param {Array} query
 * @param {Object} data
 * @return {Boolean}
 */
SchemaTypeArray.prototype.match = function(value, query, data) {
  if (!value || !query) {
    return value === query;
  }

  const lenA = value.length;
  const lenB = query.length;

  if (lenA !== lenB) return false;

  const child = this.child;

  for (let i = 0; i < lenA; i++) {
    if (!child.match(value[i], query[i], data)) return false;
  }

  return true;
};

/**
 * Checks whether the number of elements in an array is equal to `query`.
 *
 * @param {Array} value
 * @param {Number} query
 * @param {Object} data
 * @return {Boolean}
 */
SchemaTypeArray.prototype.q$size = (value, query, data) => (value ? value.length : 0) === query;

SchemaTypeArray.prototype.q$length = SchemaTypeArray.prototype.q$size;

/**
 * Checks whether an array contains one of elements in `query`.
 *
 * @param {Array} value
 * @param {Array} query
 * @param {Object} data
 * @return {Boolean}
 */
SchemaTypeArray.prototype.q$in = (value, query, data) => {
  if (!value) return false;

  for (let i = 0, len = query.length; i < len; i++) {
    if (value.includes(query[i])) return true;
  }

  return false;
};

/**
 * Checks whether an array does not contain in any elements in `query`.
 *
 * @param {Array} value
 * @param {Array} query
 * @param {Object} data
 * @return {Boolean}
 */
SchemaTypeArray.prototype.q$nin = (value, query, data) => {
  if (!value) return true;

  for (let i = 0, len = query.length; i < len; i++) {
    if (value.includes(query[i])) return false;
  }

  return true;
};

/**
 * Checks whether an array contains all elements in `query`.
 *
 * @param {Array} value
 * @param {Array} query
 * @param {Object} data
 * @return {Boolean}
 */
SchemaTypeArray.prototype.q$all = (value, query, data) => {
  if (!value) return false;

  for (let i = 0, len = query.length; i < len; i++) {
    if (!value.includes(query[i])) return false;
  }

  return true;
};

/**
 * Add elements to an array.
 *
 * @param {Array} value
 * @param {*} update
 * @param {Object} data
 * @return {Array}
 */
SchemaTypeArray.prototype.u$push = (value, update, data) => {
  if (isArray(update)) {
    return value ? value.concat(update) : update;
  }

  if (value) {
    value.push(update);
    return value;
  }

  return [update];
};

SchemaTypeArray.prototype.u$append = SchemaTypeArray.prototype.u$push;

/**
 * Add elements in front of an array.
 *
 * @param {Array} value
 * @param {*} update
 * @param {Object} data
 * @return {Array}
 */
SchemaTypeArray.prototype.u$unshift = (value, update, data) => {
  if (isArray(update)) {
    return value ? update.concat(value) : update;
  }

  if (value) {
    value.unshift(update);
    return value;
  }

  return [update];
};

SchemaTypeArray.prototype.u$prepend = SchemaTypeArray.prototype.u$unshift;

/**
 * Removes elements from an array.
 *
 * @param {Array} value
 * @param {*} update
 * @param {Object} data
 * @return {Array}
 */
SchemaTypeArray.prototype.u$pull = (value, update, data) => {
  if (!value) return value;

  if (isArray(update)) {
    return value.filter(item => !update.includes(item));
  }

  return value.filter(item => item !== update);
};

/**
 * Removes the first element from an array.
 *
 * @param {Array} value
 * @param {Number|Boolean} update
 * @param {Object} data
 * @return {Array}
 */
SchemaTypeArray.prototype.u$shift = (value, update, data) => {
  if (!value || !update) return value;

  if (update === true) {
    return value.slice(1);
  } else if (update > 0) {
    return value.slice(update);
  }

  return value.slice(0, value.length + update);
};

/**
 * Removes the last element from an array.
 *
 * @param {Array} value
 * @param {Number|Boolean} update
 * @param {Object} data
 * @return {Array}
 */
SchemaTypeArray.prototype.u$pop = (value, update, data) => {
  if (!value || !update) return value;

  const length = value.length;

  if (update === true) {
    return value.slice(0, length - 1);
  } else if (update > 0) {
    return value.slice(0, length - update);
  }

  return value.slice(-update, length);
};

/**
 * Add elements to an array only if the value is not already in the array.
 *
 * @param {Array} value
 * @param {*} update
 * @param {Object} data
 * @return {Array}
 */
SchemaTypeArray.prototype.u$addToSet = (value, update, data) => {
  if (isArray(update)) {
    if (!value) return update;

    for (let i = 0, len = update.length; i < len; i++) {
      const item = update[i];
      if (!value.includes(item)) value.push(item);
    }

    return value;
  }

  if (!value) return [update];

  if (!value.includes(update)) {
    value.push(update);
  }

  return value;
};

module.exports = SchemaTypeArray;
