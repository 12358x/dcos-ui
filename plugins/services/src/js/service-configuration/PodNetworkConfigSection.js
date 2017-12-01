import { FormattedMessage, injectIntl } from "react-intl";
import React from "react";

import ConfigurationMapHeading
  from "#SRC/js/components/ConfigurationMapHeading";
import ConfigurationMapLabel from "#SRC/js/components/ConfigurationMapLabel";
import ConfigurationMapRow from "#SRC/js/components/ConfigurationMapRow";
import ConfigurationMapSection
  from "#SRC/js/components/ConfigurationMapSection";

import ConfigurationMapEditAction
  from "../components/ConfigurationMapEditAction";
import ConfigurationMapTable from "../components/ConfigurationMapTable";
import ServiceConfigDisplayUtil from "../utils/ServiceConfigDisplayUtil";
import ServiceConfigUtil from "../utils/ServiceConfigUtil";
import ConfigurationMapValueWithDefault
  from "../components/ConfigurationMapValueWithDefault";

const NETWORK_MODE_NAME = {
  container: "Container",
  host: "Host"
};

function getNetworkTypes(networks) {
  if (!networks || !networks.length) {
    return null;
  }

  return networks.map(({ mode }) => NETWORK_MODE_NAME[mode]).join(", ");
}

class PodNetworkConfigSection extends React.Component {
  getColumns() {
    return [
      {
        heading: this.props.intl.formatMessage({
          id: "S1NzxphXybf",
          defaultMessage: "Name"
        }),
        prop: "name"
      },
      {
        heading: this.props.intl.formatMessage({
          id: "S1rMg6hXkbz",
          defaultMessage: "Protocol"
        }),
        prop: "protocol"
      },
      {
        heading: this.props.intl.formatMessage({
          id: "ryIfga2X1Wz",
          defaultMessage: "Port"
        }),
        prop: "port"
      },
      {
        heading: this.props.intl.formatMessage({
          id: "r1wGxa3m1bz",
          defaultMessage: "Load Balanced Address"
        }),
        prop: "lbAddress",
        placeholder: (
          <em>
            <FormattedMessage id="BJefeTnQ1Wz" defaultMessage={`Not Enabled`} />
          </em>
        )
      },
      {
        heading: this.props.intl.formatMessage({
          id: "SydGxT2mkbf",
          defaultMessage: "Container"
        }),
        prop: "container"
      }
    ];
  }

  render() {
    const { onEditClick } = this.props;
    const appConfig = this.props.appConfig;
    const { containers = [] } = appConfig;
    const endpoints = containers.reduce((memo, container) => {
      const { endpoints = [] } = container;

      return memo.concat(
        endpoints.map(({ containerPort, labels = {}, name, protocol }) => {
          const lbAddress = Object.keys(labels).reduce((memo, label) => {
            if (ServiceConfigUtil.matchVIPLabel(label)) {
              memo.push(
                ServiceConfigUtil.buildHostNameFromVipLabel(labels[label])
              );
            }

            return memo;
          }, []);

          return {
            name,
            protocol,
            port: containerPort,
            lbAddress: lbAddress.join(", "),
            container: ServiceConfigDisplayUtil.getContainerNameWithIcon(
              container
            )
          };
        })
      );
    }, []);

    if (!endpoints.length) {
      return <noscript />;
    }

    return (
      <div>
        <ConfigurationMapHeading level={1}>
          <FormattedMessage id="SJWMxa27kZf" defaultMessage={`Network`} />
        </ConfigurationMapHeading>
        <ConfigurationMapSection key="pod-general-section">

          {/* General section */}
          <ConfigurationMapRow>
            <ConfigurationMapLabel>
              <FormattedMessage
                id="B1zfganm1-G"
                defaultMessage={`Network Type`}
              />
            </ConfigurationMapLabel>
            <ConfigurationMapValueWithDefault
              value={getNetworkTypes(appConfig.networks)}
            />
            <ConfigurationMapEditAction
              onEditClick={onEditClick}
              tabViewID="networking"
            />
          </ConfigurationMapRow>

          {/* Service endpoints */}
          <ConfigurationMapHeading level={3}>
            <FormattedMessage
              id="ByQGean71bM"
              defaultMessage={`Service Endpoints`}
            />
          </ConfigurationMapHeading>
          <ConfigurationMapTable
            columnDefaults={{ hideIfEmpty: true }}
            columns={this.getColumns()}
            data={endpoints}
            onEditClick={onEditClick}
            tabViewID="networking"
          />

        </ConfigurationMapSection>
      </div>
    );
  }
}

PodNetworkConfigSection.defaultProps = {
  appConfig: {}
};

PodNetworkConfigSection.propTypes = {
  appConfig: React.PropTypes.object,
  onEditClick: React.PropTypes.func
};

module.exports = injectIntl(PodNetworkConfigSection);
