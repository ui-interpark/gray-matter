/**
 * gray-matter <https://github.com/assemble/gray-matter>
 *
 * Copyright (c) 2014 Jon Schlinkert, Brian Woodward, contributors.
 * Licensed under the MIT license.
 */

const YAML = require('js-yaml');
const delims = require('delims');
const file = require('fs-utils');
const _ = require('lodash');
const parsers = require('./lib/parsers');
const utils = require('./lib/utils');


/**
 * Parse the given string
 *
 * @param   {String} the string to parse
 * @param   {Object} object of options
 *
 * @return  {Object}
 */

function matter(str, options) {
  var opts = _.defaults({}, options, {
    delims: ['---', '---'],
    delimsOpts: {},
    lang: 'yaml'
  });

  var metadata = {};
  var content = str;
  var delimiters = delims(opts.delims, opts.delimsOpts).evaluate;

  // If true, will attempt to detect and register
  // the correct parser based on the returned string
  if(opts.autodetect) {
    opts.lang = utils.detectLang(opts.delims[0], content);
    content = content.replace(new RegExp('^---\s*' + opts.lang), '---');
  }

  // File object
  var fileObject = content.match(delimiters);
  if (fileObject && fileObject.length === 3) {
    try {
      metadata = parsers[opts.lang](fileObject[1]);
    } catch(e) {
      e.origin = __filename;
      console.warn('Front-matter language not detected by gray-matter', e);
    }
    content = fileObject[2];
  }

  return {
    context: metadata,
    content: content,
    original: str
  };
};

// Read the file, then parse
matter.read = function(src, options) {
  return matter(file.readFileSync(src, options), options);
};

// Does YAML front matter exist?
matter.exists = function(str, options) {
  var obj = matter(str, options).context;
  return _.keys(obj).length > 0;
};

// Extend and stringify YAML.
matter.extend = function(str, obj) {
  if(matter.exists(str)) {
    var context = _.extend({}, matter(str).context, obj);
    var yaml = matter.stringifyYAML(context);
    return '---\n' + yaml + '---';
  } else {
    return '';
  }
};

// Extend YAML, then put the file back together
matter.reconstruct = function(str, obj) {
  var front = matter.extend(str, obj);
  var content = matter(str).content;
  return front + content;
};

// Stringify to jSON
matter.stringify = function(str, options) {
  return matter(str, options).context;
};

// Stringify to YAML
matter.stringifyYAML = function(obj) {
  return YAML.dump(obj);
};

module.exports = matter;