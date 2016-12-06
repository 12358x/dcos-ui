import mixin from 'reactjs-mixin';
import React, {PropTypes} from 'react';

import Page from '../../../../../../src/js/components/Page';
import ServiceBreadcrumbs from '../../components/ServiceBreadcrumbs';
import Service from '../../structs/Service';
import ServiceActionItem from '../../constants/ServiceActionItem';
import ServiceConfigurationContainer from '../service-configuration/ServiceConfigurationContainer';
import ServiceDebugContainer from '../service-debug/ServiceDebugContainer';
import ServiceTasksContainer from '../tasks/ServiceTasksContainer';
import TabsMixin from '../../../../../../src/js/mixins/TabsMixin';
import VolumeTable from '../../components/VolumeTable';

const METHODS_TO_BIND = [
  'onActionsItemSelection'
];

class ServiceDetail extends mixin(TabsMixin) {
  constructor() {
    super(...arguments);

    this.tabs_tabs = {
      tasks: 'Instances',
      configuration: 'Configuration',
      debug: 'Debug'
    };

    this.state = {
      currentTab: Object.keys(this.tabs_tabs).shift()
    };

    METHODS_TO_BIND.forEach((method) => {
      this[method] = this[method].bind(this);
    });
  }

  componentDidMount() {
    super.componentDidMount(...arguments);
    this.checkForVolumes();
  }

  componentWillUpdate() {
    super.componentWillUpdate(...arguments);
    this.checkForVolumes();
  }

  onActionsItemSelection(actionItem) {
    const {modalHandlers} = this.context;
    const {service} = this.props;

    switch (actionItem.id) {
      case ServiceActionItem.EDIT:
        modalHandlers.editService({service});
        break;
      case ServiceActionItem.SCALE:
        modalHandlers.scaleService({service});
        break;
      case ServiceActionItem.RESTART:
        modalHandlers.restartService({service});
        break;
      case ServiceActionItem.SUSPEND:
        modalHandlers.suspendService({service});
        break;
      case ServiceActionItem.DESTROY:
        modalHandlers.deleteService({service});
        break;
    };
  }

  hasVolumes() {
    return !!this.props.service &&
        this.props.service.getVolumes().getItems().length > 0;
  }

  checkForVolumes() {
    // Add the Volumes tab if it isn't already there and the service has
    // at least one volume.
    if (this.tabs_tabs.volumes == null && this.hasVolumes()) {
      this.tabs_tabs.volumes = 'Volumes';
      this.forceUpdate();
    }
  }

  renderConfigurationTabView() {
    return (
      <ServiceConfigurationContainer
        actions={this.props.actions}
        service={this.props.service} />
    );
  }

  renderDebugTabView() {
    return (
      <ServiceDebugContainer service={this.props.service}/>
    );
  }

  renderVolumesTabView() {
    return (
      <VolumeTable
        params={this.props.params}
        routes={this.props.routes}
        service={this.props.service}
        volumes={this.props.service.getVolumes().getItems()} />
    );
  }

  renderInstancesTabView() {
    return (
      <ServiceTasksContainer
        params={this.props.params}
        service={this.props.service} />
    );
  }

  getActions() {
    const {service} = this.props;
    const {modalHandlers} = this.context;
    const instanceCount = service.getInstancesCount();

    const actions = [];

    actions.push({
      label: 'Edit',
      onItemSelect: modalHandlers.editService
    });

    if (instanceCount > 0) {
      actions.push({
        label: 'Restart',
        onItemSelect: modalHandlers.restartService
      });
    }

    actions.push({
      label: 'Scale',
      onItemSelect: modalHandlers.scaleService
    });

    if (instanceCount > 0) {
      actions.push({
        label: 'Suspend',
        onItemSelect: modalHandlers.suspendService
      });
    }

    actions.push({
      className: 'text-danger',
      label: 'Destroy',
      onItemSelect: modalHandlers.deleteService
    });

    return actions;
  }

  getTabs() {
    const {service:{id}} = this.props;
    const routePrefix = `/services/overview/${encodeURIComponent(id)}`;

    const tabs = [];

    tabs.push({
      label: 'Instances',
      callback: () => {
        this.setState({currentTab: 'tasks'});
      }
    });

    tabs.push({
      label: 'Configuration',
      callback: () => {
        this.setState({currentTab: 'configuration'});
      }
    });

    tabs.push({
      label: 'Debug',
      callback: () => {
        this.setState({currentTab: 'debug'});
      }
    });

    if (this.hasVolumes()) {
      tabs.push({
        label: 'Volumes', routePath: routePrefix + '/volumes',
        callback: this.tabs_handleTabClick.bind('volumes')
      });
    }

    return tabs;
  }

  render() {
    const {modals, service:{id}} = this.props;
    const breadcrumbs = <ServiceBreadcrumbs serviceID={id} />;

    return (
      <Page>
        <Page.Header actions={this.getActions()}
            tabs={this.getTabs()}
            breadcrumbs={breadcrumbs}
            iconID="services" />
        {this.tabs_getTabView()}
        {modals}
      </Page>
    );
  }
}

ServiceDetail.contextTypes = {
  modalHandlers: PropTypes.shape({
    editService: PropTypes.func,
    scaleService: PropTypes.func,
    restartService: PropTypes.func,
    suspendService: PropTypes.func,
    deleteService: PropTypes.func
  }).isRequired
};

ServiceDetail.propTypes = {
  actions: PropTypes.object.isRequired,
  params: PropTypes.object.isRequired,
  service: PropTypes.instanceOf(Service),
  modals: PropTypes.node
};

module.exports = ServiceDetail;
