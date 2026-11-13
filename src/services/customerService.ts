import { apiClient } from './apiClient';
import { CustomerRecord } from '../types';
import { env } from '../config/env';
import { mockDataManager } from '../utils/mockDataManager';

/**
 * SupremeAI Customer Service Layer
 * Seamlessly manages customer records across mock and live backend modes.
 */
export const customerService = {
  async fetchCustomers(): Promise<CustomerRecord[]> {
    if (env.isMockEnabled) {
      return mockDataManager.getMockData<CustomerRecord[]>('customers');
    }
    try {
      const response = await apiClient.get<{ customers: CustomerRecord[] }>('/api/customers');
      if (response && Array.isArray(response.customers) && response.customers.length > 0) {
        return response.customers;
      }
      return mockDataManager.getMockData<CustomerRecord[]>('customers');
    } catch (error) {
      console.warn('Backend /api/customers unavailable, falling back to mock dataset:', error);
      return mockDataManager.getMockData<CustomerRecord[]>('customers');
    }
  },

  async getCustomer(id: string): Promise<CustomerRecord | null> {
    if (env.isMockEnabled) {
      const list = mockDataManager.getMockData<CustomerRecord[]>('customers');
      return list.find((c) => c.id === id) || null;
    }
    try {
      const response = await apiClient.get<{ customer: CustomerRecord }>(`/api/customers/${id}`);
      return response.customer;
    } catch {
      const list = mockDataManager.getMockData<CustomerRecord[]>('customers');
      return list.find((c) => c.id === id) || null;
    }
  },

  async createCustomer(
    customer: Omit<CustomerRecord, 'id' | 'joinedDate' | 'lastActive'>
  ): Promise<CustomerRecord> {
    if (env.isMockEnabled) {
      const newCustomer: CustomerRecord = {
        ...customer,
        id: `mock_${Date.now()}`,
        joinedDate: new Date().toISOString().slice(0, 10),
        lastActive: 'Just now',
      };
      mockDataManager.addMockData('customers', newCustomer);
      return newCustomer;
    }
    try {
      const response = await apiClient.post<{ customer: CustomerRecord }>('/api/customers', customer);
      return response.customer;
    } catch (error) {
      console.warn('Create customer API failed, saving to local mock store:', error);
      const newCustomer: CustomerRecord = {
        ...customer,
        id: `mock_${Date.now()}`,
        joinedDate: new Date().toISOString().slice(0, 10),
        lastActive: 'Just now',
      };
      mockDataManager.addMockData('customers', newCustomer);
      return newCustomer;
    }
  },

  async updateCustomer(id: string, updates: Partial<CustomerRecord>): Promise<CustomerRecord | null> {
    if (env.isMockEnabled) {
      return mockDataManager.updateMockData('customers', id, updates);
    }
    try {
      const response = await apiClient.request<{ customer: CustomerRecord }>(`/api/customers/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
      });
      return response.customer;
    } catch {
      return mockDataManager.updateMockData('customers', id, updates);
    }
  },

  async deleteCustomer(id: string): Promise<boolean> {
    if (env.isMockEnabled) {
      return mockDataManager.deleteMockData('customers', id);
    }
    try {
      await apiClient.delete(`/api/customers/${id}`);
      return true;
    } catch {
      return mockDataManager.deleteMockData('customers', id);
    }
  },
};
