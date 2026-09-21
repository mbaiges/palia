import fs from 'fs';
import yaml from 'js-yaml';
import path from 'path';

export interface AppConfig {
  users: {
    allowed_emails: string[];
  };
  jwtSecret: string;
  googleClientId: string;
  googleClientSecret: string;
  encryptionKey: string;
}

class ConfigService {
  private static instance: ConfigService;
  public readonly config: AppConfig;

  private constructor() {
    let ymlConfig: Partial<AppConfig> = {};
    try {
      const configPath = path.join(__dirname, '..', '..', 'config.yml');
      const configFile = fs.readFileSync(configPath, 'utf8');
      ymlConfig = yaml.load(configFile) as Partial<AppConfig>;
    } catch (error) {
      console.warn('Warning: config.yml not found or failed to load. Using environment variables only.');
    }

    // Combine YAML config with environment variables (env vars take precedence)
    this.config = {
      users: {
        allowed_emails:
          process.env.ALLOWED_EMAILS?.split(',').map((e) => e.trim()) ||
          ymlConfig.users?.allowed_emails ||
          [],
      },
      jwtSecret: process.env.JWT_SECRET || ymlConfig.jwtSecret || '',
      googleClientId: process.env.GOOGLE_CLIENT_ID || ymlConfig.googleClientId || '',
      googleClientSecret: process.env.GOOGLE_CLIENT_SECRET || ymlConfig.googleClientSecret || '',
      encryptionKey: process.env.ENCRYPTION_KEY || ymlConfig.encryptionKey || '',
    };
  }

  public static getInstance(): ConfigService {
    if (!ConfigService.instance) {
      ConfigService.instance = new ConfigService();
    }
    return ConfigService.instance;
  }

  public getAllowedEmails(): string[] {
    const configured = this.config.users?.allowed_emails || [];
    return [...new Set([...configured, ...this.getInitialAdminEmails()].map((email) => email.trim().toLowerCase()).filter(Boolean))];
  }

  public getInitialAdminEmails(): string[] {
    return (process.env.INITIAL_ADMIN_EMAILS ?? '').split(',').map((email) => email.trim().toLowerCase()).filter(Boolean);
  }
}

export const configService = ConfigService.getInstance();
