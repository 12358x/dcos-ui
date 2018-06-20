import { makeExecutableSchema, IResolvers } from "graphql-tools";
import { Observable } from "rxjs/Observable";
import {
  fetchJobs,
  fetchJobDetail,
  JobResponse as MetronomeJobResponse,
  JobDetailResponse as MetronomeJobDetailResponse
} from "#SRC/js/events/MetronomeClient";

import Config from "#SRC/js/config/Config";
import JobStates from "#PLUGINS/jobs/src/js/constants/JobStates";
import JobStatus from "#PLUGINS/jobs/src/js/constants/JobStatus";
import {
  JobConnection,
  JobConnectionSchema
} from "#PLUGINS/jobs/src/js/types/JobConnection";
import {
  Job,
  JobTypeResolver,
  JobSchema
} from "#PLUGINS/jobs/src/js/types/Job";

export interface Query {
  jobs: JobConnection | null;
  job: Job | null;
}

export interface ResolverArgs {
  fetchJobs: () => Observable<MetronomeJobResponse[]>;
  fetchJobDetail: (id: string) => Observable<MetronomeJobDetailResponse>;
  pollingInterval: number;
}

export interface GeneralArgs {
  [key: string]: any;
}

export interface JobsQueryArgs {
  namespace?: string | null;
  filter?: string | null;
  sortBy?: SortOption;
  sortDirection?: SortDirection;
}

export interface JobQueryArgs {
  id: string;
  filter?: string | null;
  sortBy?: SortOption | null;
  sortDirection?: SortDirection | null;
}

export type SortOption = "ID" | "STATUS" | "LAST_RUN";

export type SortDirection = "ASC" | "DESC";

export const typeDefs = `
  ${JobSchema}
  ${JobConnectionSchema}

  enum SortOption {
    ID
    STATUS
    LAST_RUN
  }
  enum SortDirection {
    ASC
    DESC
  }
  type Query {
    jobs(
      filter: String
      namespace: String
      sortBy: SortOption
      sortDirection: SortDirection
    ): JobConnection
    job(
      id: ID!
    ): Job
  }
  `;

function isJobQueryArg(arg: any): arg is JobQueryArgs {
  return arg.id !== undefined;
}

// Sort and filtering
function sortJobs(
  jobs: Job[],
  sortBy: SortOption = "ID",
  sortDirection: SortDirection = "ASC"
): Job[] {
  jobs.sort((a, b) => {
    let result;

    switch (sortBy) {
      case "ID":
        result = compareJobById(a, b);
        break;
      case "STATUS":
        result = compareJobByStatus(a, b);
        break;
      case "LAST_RUN":
        result = compareJobByLastRun(a, b);
        break;
      default:
        result = 0;
    }

    const direction = sortDirection === "ASC" ? 1 : -1;
    return result * direction;
  });

  return jobs;
}

function compareJobById(a: Job, b: Job): number {
  return a.id.localeCompare(b.id);
}

function compareJobByStatus(a: Job, b: Job): number {
  return (
    JobStates[a.scheduleStatus].sortOrder -
    JobStates[b.scheduleStatus].sortOrder
  );
}

function compareJobByLastRun(a: Job, b: Job): number {
  const statusA = a.lastRunStatus ? a.lastRunStatus.status : "N/A";
  const statusB = b.lastRunStatus ? b.lastRunStatus.status : "N/A";

  return JobStatus[statusA].sortOrder - JobStatus[statusB].sortOrder;
}

function filterJobsById(
  jobs: MetronomeJobResponse[],
  filter: string | null
): MetronomeJobResponse[] {
  if (filter === null) {
    return jobs;
  }

  return jobs.filter(({ id }) => id.indexOf(filter) !== -1);
}

function filterJobsByNamespace(
  jobs: MetronomeJobResponse[],
  namespace: string | null
): MetronomeJobResponse[] {
  if (namespace === null) {
    return jobs;
  }

  return jobs.filter(({ id }) => id.startsWith(namespace));
}

export const resolvers = ({
  fetchJobs,
  fetchJobDetail,
  pollingInterval
}: ResolverArgs): IResolvers => ({
  Query: {
    jobs(
      _parent = {},
      args: GeneralArgs = {},
      _context = {}
    ): Observable<JobConnection | null> {
      const {
        sortBy = "ID",
        sortDirection = "ASC",
        filter = null,
        namespace = null
      } = args as JobsQueryArgs;

      const pollingInterval$ = Observable.timer(0, pollingInterval);
      const responses$ = pollingInterval$.exhaustMap(fetchJobs);

      const jobsInNamespace$ = responses$.map(jobs =>
        filterJobsByNamespace(jobs, namespace)
      );
      const count$ = jobsInNamespace$.map(jobs => jobs.length);

      return jobsInNamespace$
        .map(jobs => filterJobsById(jobs, filter))
        .map(jobs => jobs.map(JobTypeResolver))
        .map(jobs => sortJobs(jobs, sortBy, sortDirection))
        .combineLatest(count$, (jobs, totalCount) => ({
          filteredCount: jobs.length,
          totalCount,
          nodes: jobs
        }));
    },
    job(_obj = {}, args: GeneralArgs, _context = {}): Observable<Job | null> {
      if (!isJobQueryArg(args)) {
        return Observable.throw("The job resolver expects an id as argument");
      }

      const pollingInterval$ = Observable.timer(0, pollingInterval);
      const responses$ = pollingInterval$.switchMap(() =>
        fetchJobDetail(args.id)
      );

      return responses$.map(response => JobTypeResolver(response));
    }
  }
});

export default makeExecutableSchema({
  typeDefs,
  resolvers: resolvers({
    fetchJobs,
    fetchJobDetail,
    pollingInterval: Config.getRefreshRate()
  })
});
