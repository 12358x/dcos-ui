import React from 'react';
import {Table} from 'reactjs-components';

import ValidatorUtil from '../../../../../src/js/utils/ValidatorUtil.js';

/**
 * Optimised method to check if all row props are empty for a given column
 *
 * @param {Array} data - The array of rows top rocess
 * @param {String} prop - The property name of the column
 * @returns {Boolean} Returns `true` if all rows have empty value in this prop
 */
function isColumnEmpty(data, prop) {
  for (let i=0, length=data.length; i<length; ++i) {
    if (!ValidatorUtil.isEmpty(data[i][prop])) {
      return false;
    }
  }

  return true;
}

/**
 * Custom rendering function that takes care of replacing with default value
 * if the field is empty.
 *
 * @param {String} prop - The property of the cell
 * @param {Object} row - The current row
 * @returns {Node} Returns a rendered React node
 */
function columnRenderFunction(prop, row) {
  if (ValidatorUtil.isEmpty(row[prop])) {
    return this.placeholder;
  }

  return this.render(prop, row);
}

/**
 * Default render function if the user has not specified a custom renderer
 *
 * @param {String} prop - The property of the cell
 * @param {Object} row - The current row
 * @returns {Node} Returns a rendered React node
 */
function defaultRenderFunction(prop, row) {
  let value = row[prop];
  if (React.isValidElement(value)) {
    return value;
  }

  return <span>{value.toString()}</span>;
}

/**
 * This stateless table component provides some additional functionality
 * to the underlaying <Table /> component, trying to be as least intrusive
 * as possible.
 *
 * @example <caption>Eample of ConfigurationMapTable</caption>
 * <ConfigurationMapTable
 *   className='table table-simple table-break-word flush-bottom'
 *   columnDefaults={{
 *      hideIfEmpty: true,
 *      className: 'configuration-map-table-value'
 *   }}
 *   columns={[
 *      {
 *        heading: 'Heading 1',
 *        prop: 'prop1',
 *      },
 *      {
 *        heading: 'Heading 2',
 *        prop: 'prop2',
 *      }
 *   ]}
 *   data={tableData} />
 *
 * @param {Object} props - The component properties
 * @returns {Node} Returns the rendered table component
 */
class ConfigurationMapTable extends React.Component {
  render() {
    let {columns=[], columnDefaults={}, data=[]} = this.props;

    columns = Array.prototype.concat.apply([], columns.map((column) => {
      column = Object.assign({}, columnDefaults, column);
      let {hideIfEmpty=false, placeholder=(<span>&mdash;</span>), prop,
        render=defaultRenderFunction} = column;

      // Don't include columns that have an `hideIfEmpty` flag and are empty
      if (hideIfEmpty && isColumnEmpty(data, prop)) {
        return [];
      }

      // Compile render function
      column.render = columnRenderFunction.bind({placeholder, render});

      return column;
    }));

    return <Table {...Object.assign({}, this.props, {columns})} />;
  }
};

module.exports = ConfigurationMapTable;
