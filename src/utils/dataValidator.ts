import { CustomerRecord, McpTowerService } from '../types';

export class DataValidator {
  static validateCustomer(customer: Partial<CustomerRecord>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!customer.name || customer.name.trim().length === 0) {
      errors.push('নাম প্রয়োজন');
    }

    if (!customer.email) {
      errors.push('ইমেইল প্রয়োজন');
    } else if (!this.isValidEmail(customer.email)) {
      errors.push('ভ্যালিড ইমেইল এড্রেস দিন');
    }

    if (customer.mrr !== undefined && customer.mrr < 0) {
      errors.push('MRR নেগেটিভ হতে পারবে না');
    }

    if (customer.tokensUsed !== undefined && customer.tokensUsed < 0) {
      errors.push('টোকেন ব্যবহার নেগেটিভ হতে পারবে না');
    }

    if (customer.tokenLimit !== undefined && customer.tokenLimit <= 0) {
      errors.push('টোকেন লিমিট পজিটিভ হতে হবে');
    }

    const validTiers = ['Free', 'Pro', 'Enterprise'];
    if (customer.tier && !validTiers.includes(customer.tier)) {
      errors.push(`টিয়ার হতে হবে: ${validTiers.join(', ')}`);
    }

    const validStatuses = ['active', 'past_due', 'suspended'];
    if (customer.status && !validStatuses.includes(customer.status)) {
      errors.push(`স্ট্যাটাস হতে হবে: ${validStatuses.join(', ')}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  private static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static validateMcpService(service: Partial<McpTowerService>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!service.id) {
      errors.push('সার্ভিস আইডি প্রয়োজন');
    }

    if (!service.name && !service.displayName) {
      errors.push('সার্ভিস নাম প্রয়োজন');
    }

    const validStatuses = ['healthy', 'degraded', 'unhealthy', 'starting', 'stopped', 'rebooting'];
    if (service.status && !validStatuses.includes(service.status)) {
      errors.push(`স্ট্যাটাস হতে হবে: ${validStatuses.join(', ')}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}
