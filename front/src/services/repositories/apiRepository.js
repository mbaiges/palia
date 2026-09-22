import { api as httpApi } from '../apiClient.js';

function unwrap(response) {
  return response && Object.prototype.hasOwnProperty.call(response, 'data')
    ? response.data
    : response;
}

/**
 * Port used by the application services to access the remote Medice domain.
 * Implementations must return domain DTOs and must not expose transport details.
 */
export class ApiRepository {
  // This class documents the runtime contract. Concrete adapters implement it.
}

export function isAccessDeniedError(error) {
  return error?.status === 403 || error?.code === 'permission-denied' || error?.code === 'FORBIDDEN';
}

/** HTTP adapter for the current Express API. */
export class DefaultHttpApiRepository extends ApiRepository {
  constructor(client = httpApi) {
    super();
    this.client = client;
  }

  auth = {
    me: async () => unwrap(await this.client.auth.me()),
    google: async (authCode) => unwrap(await this.client.auth.google(authCode)),
    devBypass: async (email, name) => unwrap(await this.client.auth.devBypass(email, name)),
    signOut: () => this.client.auth.signOut(),
  };

  bootstrap = async () => unwrap(await this.client.bootstrap());

  patients = {
    list: async (params = {}) => unwrap(await this.client.patients.list(params)),
    get: async (id) => unwrap(await this.client.patients.get(id)),
    create: async (body) => unwrap(await this.client.patients.create(body)),
    update: async (id, body) => unwrap(await this.client.patients.update(id, body)),
    archive: async (id) => unwrap(await this.client.patients.archive(id)),
    restore: async (id) => unwrap(await this.client.patients.restore(id)),
    assign: async (id, volunteerIds) => unwrap(await this.client.patients.assign(id, volunteerIds)),
    followUps: async (id) => unwrap(await this.client.patients.followUps(id)),
    createFollowUp: async (id, body) => unwrap(await this.client.patients.createFollowUp(id, body)),
    createAlert: async (id, body) => unwrap(await this.client.patients.createAlert(id, body)),
  };

  alerts = {
    list: async (params = {}) => unwrap(await this.client.alerts.list(params)),
    resolve: async (id, note) => unwrap(await this.client.alerts.resolve(id, note)),
  };

  hospitals = {
    list: async (includeArchived = false) => unwrap(await this.client.hospitals.list(includeArchived)),
    create: async (body) => unwrap(await this.client.hospitals.create(body)),
    update: async (id, body) => unwrap(await this.client.hospitals.update(id, body)),
    archive: async (id) => unwrap(await this.client.hospitals.archive(id)),
    restore: async (id) => unwrap(await this.client.hospitals.restore(id)),
  };

  volunteers = {
    list: async (query = '') => unwrap(await this.client.volunteers.list(query)),
    updateProfile: async (body) => unwrap(await this.client.volunteers.updateProfile(body)),
  };

  access = {
    list: async () => unwrap(await this.client.access.list()),
    addVolunteer: async (email) => unwrap(await this.client.access.addVolunteer(email)),
    remove: async (email) => unwrap(await this.client.access.remove(email)),
  };

  stats = {
    mine: async (params = {}) => unwrap(await this.client.stats.mine(params)),
    global: async (params = {}) => unwrap(await this.client.stats.global(params)),
  };

  push = {
    vapidPublicKey: async () => unwrap(await this.client.push.vapidPublicKey()),
    subscribe: async (subscription) => unwrap(await this.client.push.subscribe(subscription)),
    unsubscribe: async (endpoint) => unwrap(await this.client.push.unsubscribe(endpoint)),
  };
}

export const HttpApiRepository = DefaultHttpApiRepository;
export const defaultApiRepository = new DefaultHttpApiRepository();
