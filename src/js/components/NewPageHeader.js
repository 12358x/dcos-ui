import classNames from 'classnames/dedupe';
import React from 'react';

import NewPageHeaderActions from './NewPageHeaderActions';
import NewPageHeaderBreadcrumbs from './NewPageHeaderBreadcrumbs';
import NewPageHeaderTabs from './NewPageHeaderTabs';
import SidebarToggle from './SidebarToggle';

class PageHeader extends React.Component {
  render() {
    let {
      props: {
        actions,
        addButton,
        breadcrumbs,
        className,
        innerClassName,
        primaryContentClassName,
        secondaryContentDetail,
        secondaryContentClassName,
        tabs
      }
    } = this;

    let classes = classNames('page-header', className);
    let innerClasses = classNames(
      'page-header-inner pod',
      innerClassName
    );
    let primaryContentClasses = classNames(
      'page-header-content-section page-header-content-section-primary',
      primaryContentClassName
    );
    let secondaryContentClasses = classNames(
      'page-header-content-section page-header-content-section-secondary',
      secondaryContentClassName
    );
    let secondaryContentDetailElement = null;

    if (secondaryContentDetail) {
      secondaryContentDetailElement = (
        <div className="page-header-content-section-secondary-detail">
          {secondaryContentDetail}
        </div>
      );
    }

    return (
      <div className={classes}>
        <div className={innerClasses}>
          <div className={primaryContentClasses}>
            <SidebarToggle />
            {breadcrumbs}
            <NewPageHeaderActions
              actions={actions}
              addButton={addButton} />
          </div>
          <div className={secondaryContentClasses}>
            <NewPageHeaderTabs tabs={tabs} />
            {secondaryContentDetailElement}
          </div>
        </div>
      </div>
    );
  }
}

const classProps = React.PropTypes.oneOfType([
  React.PropTypes.array,
  React.PropTypes.object,
  React.PropTypes.string
]);

PageHeader.defaultProps = {
  actions: [],
  tabs: []
};

PageHeader.propTypes = {
  addButton: React.PropTypes.oneOfType([
    React.PropTypes.arrayOf(React.PropTypes.object),
    React.PropTypes.object
  ]),
  actions: React.PropTypes.array,
  breadcrumbs: React.PropTypes.node.isRequired,
  className: classProps,
  innerClassName: classProps,
  primaryContentClassName: classProps,
  secondaryContentClassName: classProps,
  secondaryContentDetail: React.PropTypes.node,
  tabs: React.PropTypes.array
};

PageHeader.Breadcrumbs = NewPageHeaderBreadcrumbs;
PageHeader.Actions = NewPageHeaderActions;
PageHeader.Tabs = NewPageHeaderTabs;

module.exports = PageHeader;
