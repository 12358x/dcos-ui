import classNames from 'classnames';
import {Dropdown} from 'reactjs-components';
import mixin from 'reactjs-mixin';
import React from 'react';
import {StoreMixin} from 'mesosphere-shared-reactjs';

import {APPEND} from '../../../../../../src/js/constants/SystemLogTypes';
import LogView from '../../components/LogView';
import MesosStateUtil from '../../../../../../src/js/utils/MesosStateUtil';
import SearchLog from '../../components/SearchLog';
import SystemLogStore from '../../../../../../src/js/stores/SystemLogStore';

const METHODS_TO_BIND = [
  'handleAtBottomChange',
  'handleFetchPreviousLog',
  'handleItemSelection'
];

const PAGE_ENTRY_COUNT = 50;

function getLogParameters(task, options) {
  let {framework_id:frameworkID, executor_id:executorID, id} = task;
  if (!executorID) {
    executorID = id;
  }

  return Object.assign({
    containerID: MesosStateUtil.getTaskContainerID(task),
    executorID,
    frameworkID
  }, options);
}

class TaskLogsTab extends mixin(StoreMixin) {
  constructor() {
    super(...arguments);

    this.state = {
      direction: APPEND,
      error: null,
      streams: []
    };

    this.store_listeners = [{
      events: ['success', 'error', 'streamSuccess', 'streamError'],
      name: 'systemLog',
      suppressUpdate: true
    }];

    METHODS_TO_BIND.forEach((method) => {
      this[method] = this[method].bind(this);
    });
  }

  componentWillMount() {
    SystemLogStore.fetchStreamTypes(this.props.task.slave_id);
  }

  componentWillUnmount() {
    SystemLogStore.stopTailing(this.state.subscriptionID);
  }

  onSystemLogStoreError(subscriptionID, error) {
    if (subscriptionID !== this.state.subscriptionID) {

      return;
    }

    this.setState({error});
  }

  onSystemLogStoreSuccess(subscriptionID, direction) {
    if (subscriptionID !== this.state.subscriptionID) {
      return;
    }

    this.setState({direction});
  }

  onSystemLogStoreStreamError(error) {
    this.setState({error});
  }

  onSystemLogStoreStreamSuccess(streams) {
    if (!Array.isArray(streams) || !streams.length) {
      this.setState({error: 'No logs found for this task'});
    }

    const {task} = this.props;
    // See if we can find STDOUT, otherwise take the first entry
    const selectedStream = streams.find((item) => item === 'STDOUT')
      || streams[0];
    // Limit 0 means continuous stream
    // Get a full page of previous log entries
    const params = getLogParameters(task, {
      filter: {STREAM: selectedStream},
      limit: 0,
      skip_prev: PAGE_ENTRY_COUNT
    });
    const subscriptionID = SystemLogStore.startTailing(task.slave_id, params);

    this.setState({streams, selectedStream, subscriptionID});
  }

  handleFetchPreviousLog() {
    const {task} = this.props;
    const {subscriptionID} = this.state;

    // Get a full page of previous log entries
    const params = getLogParameters(task, {
      filter: {STREAM: this.state.selectedStream},
      limit: PAGE_ENTRY_COUNT,
      skip_prev: PAGE_ENTRY_COUNT,
      subscriptionID
    });
    SystemLogStore.fetchLogRange(task.slave_id, params);
  }

  handleAtBottomChange(isAtBottom) {
    const {task} = this.props;
    const {subscriptionID} = this.state;
    if (isAtBottom) {
      // Do not request anymore backwards, but continue stream where we left off
      const params = getLogParameters(task, {
        filter: {STREAM: this.state.selectedStream},
        limit: 0,
        subscriptionID
      });
      SystemLogStore.startTailing(this.props.task.slave_id, params);
    } else {
      SystemLogStore.stopTailing(this.state.subscriptionID);
    }
  }

  handleViewChange(selectedStream) {
    const {task} = this.props;
    // Limit 0 means continuous stream
    // Get a full page of previous log entries
    const params = getLogParameters(task, {
      filter: {STREAM: selectedStream},
      limit: 0,
      skip_prev: PAGE_ENTRY_COUNT
    });
    const subscriptionID = SystemLogStore.startTailing(task.slave_id, params);
    this.setState({selectedStream, subscriptionID});
  }

  getLogSelectionAsButtons() {
    let {streams, selectedStream} = this.state;
    let buttons = streams.map((name, index) => {

      let classes = classNames({
        'button button-stroke': true,
        'active': name === selectedStream
      });

      return (
        <button
          className={classes}
          key={index}
          onClick={this.handleViewChange.bind(this, name)}>
          {name}
        </button>
      );
    });

    return (
      <div className="button-group">
        {buttons}
      </div>
    );
  }

  handleItemSelection(obj) {
    this.handleViewChange.call(this, obj.value);
  }

  getDropdownItems() {
    return this.state.streams.map(function (name) {
      let selectedHtml = <span className="flush dropdown-header">{name}</span>;
      let dropdownHtml = <a>{selectedHtml}</a>;

      return {
        id: name,
        name,
        html: dropdownHtml,
        selectedHtml,
        value: name
      };
    }, this);
  }

  getActions() {
    let {streams, selectedStream} = this.state;
    if (streams.length < 3) {
      return this.getLogSelectionAsButtons();
    }

    return (
      <Dropdown
        buttonClassName="button dropdown-toggle"
        dropdownMenuClassName="dropdown-menu"
        dropdownMenuListClassName="dropdown-menu-list"
        dropdownMenuListItemClassName="clickable"
        initialID={selectedStream}
        items={this.getDropdownItems()}
        onItemSelection={this.handleItemSelection}
        scrollContainer=".gm-scroll-view"
        scrollContainerParentSelector=".gm-prevented"
        transition={true}
        transitionName="dropdown-menu"
        wrapperClassName="dropdown form-group" />
      );
  }

  render() {
    let {direction, selectedStream, subscriptionID} = this.state;

    return (
      <SearchLog actions={this.getActions()}>
        <LogView
          logName={selectedStream}
          direction={direction}
          fullLog={SystemLogStore.getFullLog(subscriptionID)}
          fetchPreviousLogs={this.handleFetchPreviousLog}
          onAtBottomChange={this.handleAtBottomChange}
          hasLoadedTop={SystemLogStore.hasLoadedTop(subscriptionID)} />
      </SearchLog>
    );
  }
}

TaskLogsTab.propTypes = {
  task: React.PropTypes.shape({
    slave_id: React.PropTypes.string
  })
};

module.exports = TaskLogsTab;
