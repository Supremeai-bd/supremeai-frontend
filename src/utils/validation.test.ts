import { describe, it, expect } from 'vitest';
import { validateWebhookForm } from './validation';

describe('validation utilities', () => {
  it('validates webhook form requires https:// or http:// URL', () => {
    const result = validateWebhookForm({
      name: 'Test Webhook',
      url: 'ftp://example.com',
      events: ['chat.created'],
    });
    expect(result.isValid).toBe(false);
    expect(result.errors.url).toBe('URL must start with https:// or http://');
  });

  it('accepts valid webhook form', () => {
    const result = validateWebhookForm({
      name: 'Test Webhook',
      url: 'https://api.example.com/webhook',
      events: ['chat.created'],
    });
    expect(result.isValid).toBe(true);
    expect(Object.keys(result.errors)).toHaveLength(0);
  });
});
