/**
 * Form & Input Validation Utilities
 * Type-safe client-side validation rules with descriptive human-friendly error messages.
 */

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

// 1. Validate API Key Generation Input
export interface ApiKeyFormValues {
  name: string;
  rpm: number;
  permissions: string[];
}

export function validateApiKeyForm(values: ApiKeyFormValues): ValidationResult {
  const errors: Record<string, string> = {};

  if (!values.name || !values.name.trim()) {
    errors.name = 'Key identifier name is required.';
  } else if (values.name.trim().length < 3) {
    errors.name = 'Key name must be at least 3 characters.';
  } else if (values.name.trim().length > 60) {
    errors.name = 'Key name cannot exceed 60 characters.';
  }

  if (typeof values.rpm !== 'number' || isNaN(values.rpm)) {
    errors.rpm = 'Rate limit must be a valid number.';
  } else if (values.rpm < 10) {
    errors.rpm = 'Minimum rate limit is 10 requests per minute.';
  } else if (values.rpm > 10000) {
    errors.rpm = 'Maximum rate limit is 10,000 requests per minute.';
  }

  if (!values.permissions || values.permissions.length === 0) {
    errors.permissions = 'Select at least one scoped permission for this key.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

// 2. Validate Webhook Endpoint Input
export interface WebhookFormValues {
  name: string;
  url: string;
  events: string[];
}

export function validateWebhookForm(values: WebhookFormValues): ValidationResult {
  const errors: Record<string, string> = {};

  if (!values.name || !values.name.trim()) {
    errors.name = 'Webhook endpoint name is required.';
  } else if (values.name.trim().length < 3) {
    errors.name = 'Webhook name must be at least 3 characters.';
  }

  if (!values.url || !values.url.trim()) {
    errors.url = 'Destination URL is required.';
  } else {
    const trimmed = values.url.trim();
    try {
      const parsed = new URL(trimmed);
      if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
        errors.url = 'URL must start with https:// or http://';
      }
    } catch {
      errors.url = 'Enter a valid URL (e.g. https://api.mycompany.com/webhooks).';
    }
  }

  if (!values.events || values.events.length === 0) {
    errors.events = 'Select at least one trigger event.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

// 3. Validate Team Member Invite Input
export interface TeamInviteFormValues {
  name: string;
  email: string;
  role: string;
}

export function validateTeamInviteForm(values: TeamInviteFormValues): ValidationResult {
  const errors: Record<string, string> = {};

  if (!values.name || !values.name.trim()) {
    errors.name = 'Full name is required.';
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!values.email || !values.email.trim()) {
    errors.email = 'Email address is required.';
  } else if (!emailRegex.test(values.email.trim())) {
    errors.email = 'Enter a valid corporate email address.';
  }

  if (!values.role) {
    errors.role = 'Role assignment is required.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

// 4. Validate Knowledge Base File Input
export interface FileValidationResult {
  isValid: boolean;
  error?: string;
  fileSizeBytes: number;
  estimatedTokens: number;
  formattedSize: string;
}

export function validateKnowledgeFile(file: File): FileValidationResult {
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  const ALLOWED_EXTENSIONS = ['.md', '.txt', '.json', '.pdf', '.ts', '.js', '.py', '.html', '.css'];

  const extension = '.' + (file.name.split('.').pop() || '').toLowerCase();
  const fileSizeBytes = file.size;

  const formattedSize =
    fileSizeBytes < 1024
      ? `${fileSizeBytes} B`
      : fileSizeBytes < 1024 * 1024
      ? `${(fileSizeBytes / 1024).toFixed(1)} KB`
      : `${(fileSizeBytes / (1024 * 1024)).toFixed(2)} MB`;

  if (!ALLOWED_EXTENSIONS.includes(extension)) {
    return {
      isValid: false,
      error: `Unsupported format (${extension}). Supported types: ${ALLOWED_EXTENSIONS.join(', ')}`,
      fileSizeBytes,
      estimatedTokens: 0,
      formattedSize,
    };
  }

  if (fileSizeBytes > MAX_FILE_SIZE) {
    return {
      isValid: false,
      error: `File exceeds maximum allowed size of 5 MB (current: ${formattedSize}).`,
      fileSizeBytes,
      estimatedTokens: 0,
      formattedSize,
    };
  }

  const estimatedTokens = Math.ceil(fileSizeBytes / 4);

  return {
    isValid: true,
    fileSizeBytes,
    estimatedTokens,
    formattedSize,
  };
}
