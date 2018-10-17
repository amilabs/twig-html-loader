/* eslint prefer-arrow-callback: 0 */
/* eslint no-shadow: 0 */

const Twig = require('twig');
const utils = require('loader-utils');

const registry = [];

module.exports = function loader(source) {
  try {
    const query = utils.getOptions(this) || {};
    const data = query.data || {};
    const templateFile = require.resolve(this.resource);
    const options = {
      path: templateFile,
      data: source,
      async: false,
      debug: Boolean(query.debug || false),
      trace: Boolean(query.trace || false),
      allowInlineIncludes: true,
      rethrow: true,
    };

    if (query.cache !== true) {
      Twig.cache(false);
    }

    Twig.extend((Twig) => {
      const defaultSave = Object.assign(Twig.Templates.save);
      // eslint-disable-next-line no-param-reassign
      Twig.Templates.save = function customSave(template) {
        registry.push(template.path);
        return defaultSave.call(this, template);
      };
    });

    const template = Twig.twig(options);
    const output = template.render(data);

    registry.forEach(this.addDependency);

    Twig.extend((Twig) => {
      Twig.Templates.registry = {};
    });
    return output;
  } catch (e) {
    this.callback(e);
    return '';
  }
};
