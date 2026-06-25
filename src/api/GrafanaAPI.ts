import { getBackendSrv, getTemplateSrv, locationService } from '@grafana/runtime';

export class GrafanaAPI {
  static async datasourceRequest<T = unknown>(
    datasourceUid: string,
    body: Record<string, unknown>
  ): Promise<T> {
    const response = await getBackendSrv().post<T>(
      `/api/ds/query`,
      {
        queries: [{ ...body, datasource: { uid: datasourceUid } }],
        from: 'now-5m',
        to: 'now',
      }
    );
    return response;
  }

  static getVariable(name: string): string {
    return getTemplateSrv().replace(`$${name}`);
  }

  static replaceTemplate(str: string): string {
    return getTemplateSrv().replace(str);
  }

  static navigateTo(path: string): void {
    locationService.push(path);
  }
}
