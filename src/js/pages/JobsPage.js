import { injectIntl } from "react-intl";
import React from "react";
import { routerShape } from "react-router";

import Icon from "../components/Icon";
import SidebarActions from "../events/SidebarActions";

class JobsPage extends React.Component {
  render() {
    return this.props.children;
  }
}

JobsPage.contextTypes = {
  router: routerShape
};

JobsPage.routeConfig = {
  label: this.props.intl.formatMessage({ id: "XXXX", defaultMessage: "Jobs" }),
  icon: <Icon id="jobs-inverse" size="small" family="product" />,
  matches: /^\/jobs/
};

JobsPage.willTransitionTo = function() {
  SidebarActions.close();
};

module.exports = injectIntl(JobsPage);
