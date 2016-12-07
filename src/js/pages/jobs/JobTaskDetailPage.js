import React from 'react';

import TaskDetail from '../../../../plugins/services/src/js/pages/task-details/TaskDetail';

import MesosStateStore from '../../stores/MesosStateStore';
import JobsBreadcrumbs from '../../components/breadcrumbs/JobsBreadcrumbs';
import Page from '../../components/Page';

class JobTaskDetailPage extends React.Component {
  render() {
    const {params, routes} = this.props;
    const {id, taskID} = params;

    let routePrefix = `/jobs/${encodeURIComponent(id)}/tasks/${encodeURIComponent(taskID)}`;
    const tabs = [
      {label: 'Details', routePath: routePrefix + '/details'},
      {label: 'Files', routePath: routePrefix + '/files'},
      {label: 'Logs', routePath: routePrefix + '/view'}
    ];

    let task = MesosStateStore.getTaskFromTaskID(taskID);

    let breadcrumbs;
    if (task != null) {
      breadcrumbs = (
        <JobsBreadcrumbs
          jobID={id}
          taskID={task.getId()}
          taskName={task.getName()} />
      );
    } else {
      breadcrumbs = <JobsBreadcrumbs />;
    }

    return (
      <Page dontScroll={true}>
        <Page.Header
          breadcrumbs={breadcrumbs}
          tabs={tabs}
          iconID="jobs"/>
        <TaskDetail params={params} routes={routes}>
          {this.props.children}
        </TaskDetail>
      </Page>
    );
  }
}

TaskDetail.propTypes = {
  params: React.PropTypes.object,
  routes: React.PropTypes.array
};

module.exports = JobTaskDetailPage;

