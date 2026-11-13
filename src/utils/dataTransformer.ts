import { CustomerRecord } from '../types';

export class DataTransformer {
  static transformMockToReal(mockData: any): any {
    if (Array.isArray(mockData)) {
      return mockData.map((item) => this.transformSingleItem(item));
    }
    return this.transformSingleItem(mockData);
  }

  private static transformSingleItem(item: any): any {
    if (!item || typeof item !== 'object') return item;
    const transformed: any = { ...item };

    // Generate ID if missing
    if (!transformed.id) {
      transformed.id = this.generateId();
    }

    // Add timestamps
    if (!transformed.createdAt) {
      transformed.createdAt = new Date().toISOString();
    }

    if (!transformed.updatedAt) {
      transformed.updatedAt = new Date().toISOString();
    }

    if (transformed.price && typeof transformed.price === 'number') {
      transformed.price = Number(transformed.price.toFixed(2));
    }

    if (transformed.mrr && typeof transformed.mrr === 'number') {
      transformed.mrr = Number(transformed.mrr.toFixed(2));
    }

    return transformed;
  }

  private static generateId(): string {
    return `id_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  static validateCustomerData(customer: Partial<CustomerRecord>): string[] {
    const errors: string[] = [];

    if (!customer.name || customer.name.trim().length === 0) {
      errors.push('নাম প্রয়োজন');
    }

    if (!customer.email || !this.isValidEmail(customer.email)) {
      errors.push('ভ্যালিড ইমেইল প্রয়োজন');
    }

    if (customer.mrr !== undefined && customer.mrr < 0) {
      errors.push('MRR নেগেটিভ হতে পারবে না');
    }

    return errors;
  }

  public static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}
