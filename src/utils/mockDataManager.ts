import { INITIAL_CUSTOMERS } from '../data/customerData';
import { INITIAL_MCP_SERVICES, INITIAL_ADMIN_METRICS } from '../data/mcpTowerData';
import { INITIAL_WORKSPACE_TEMPLATES } from '../data/customerWorkspaceData';
import { INITIAL_PLUGINS } from '../data/userPlugins';
import { SYSTEM_ROLES } from '../data/roles';

export class MockDataManager {
  private static instance: MockDataManager;
  private mockData: Record<string, any> = {};

  private constructor() {
    this.initializeMockData();
  }

  public static getInstance(): MockDataManager {
    if (!MockDataManager.instance) {
      MockDataManager.instance = new MockDataManager();
    }
    return MockDataManager.instance;
  }

  public initializeMockData(): void {
    this.mockData = {
      customers: [...INITIAL_CUSTOMERS],
      mcpServices: [...INITIAL_MCP_SERVICES],
      workspaceTemplates: [...INITIAL_WORKSPACE_TEMPLATES],
      userPlugins: [...INITIAL_PLUGINS],
      roles: [...SYSTEM_ROLES],
      adminMetrics: { ...INITIAL_ADMIN_METRICS },
    };
  }

  public getMockData<T = any>(key: string): T {
    return (this.mockData[key] || []) as T;
  }

  public addMockData(key: string, data: any): void {
    if (!this.mockData[key]) {
      this.mockData[key] = [];
    }
    this.mockData[key].unshift(data);
  }

  public updateMockData(key: string, id: string, updates: any): any {
    if (!this.mockData[key]) return null;

    const index = this.mockData[key].findIndex((item: any) => item.id === id);
    if (index !== -1) {
      this.mockData[key][index] = { ...this.mockData[key][index], ...updates };
      return this.mockData[key][index];
    }
    return null;
  }

  public deleteMockData(key: string, id: string): boolean {
    if (!this.mockData[key]) return false;

    const index = this.mockData[key].findIndex((item: any) => item.id === id);
    if (index !== -1) {
      this.mockData[key].splice(index, 1);
      return true;
    }
    return false;
  }

  public resetMockData(): void {
    this.initializeMockData();
  }
}

export const mockDataManager = MockDataManager.getInstance();
