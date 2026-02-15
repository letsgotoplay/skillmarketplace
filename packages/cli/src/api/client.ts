import { request } from 'undici';
import Conf from 'conf';
import chalk from 'chalk';

export interface SkillHubConfig {
  apiUrl: string;
  token?: string;
  userId?: string;
  email?: string;
}

export interface ApiError {
  error: string;
  message?: string;
}

export interface ApiResponse<T> {
  data?: T;
  error?: ApiError;
  status: number;
}

const config = new Conf<{ config: SkillHubConfig }>({
  projectName: 'skillhub',
  configName: 'config',
  defaults: {
    config: {
      apiUrl: 'http://localhost:3000',
    },
  },
});

export function getConfig(): SkillHubConfig {
  return config.get('config');
}

export function setConfig(newConfig: Partial<SkillHubConfig>): void {
  const currentConfig = config.get('config');
  config.set('config', { ...currentConfig, ...newConfig });
}

export function clearConfig(): void {
  config.clear();
}

export function isAuthenticated(): boolean {
  const cfg = getConfig();
  return !!cfg.token;
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  body?: unknown;
  headers?: Record<string, string>;
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<ApiResponse<T>> {
  const cfg = getConfig();
  const { method = 'GET', body, headers = {} } = options;

  const url = `${cfg.apiUrl}${endpoint}`;

  const requestHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...headers,
  };

  if (cfg.token) {
    requestHeaders['Authorization'] = `Bearer ${cfg.token}`;
  }

  try {
    const response = await request(url, {
      method,
      headers: requestHeaders,
      body: body ? JSON.stringify(body) : undefined,
    });

    const statusCode = response.statusCode;
    let data: T | undefined;
    let error: ApiError | undefined;

    const responseBody = await response.body.text();
    if (responseBody) {
      try {
        const parsed = JSON.parse(responseBody);
        if (statusCode >= 400) {
          error = parsed;
        } else {
          data = parsed;
        }
      } catch {
        if (statusCode >= 400) {
          error = { error: responseBody };
        }
      }
    }

    return { data, error, status: statusCode };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error(chalk.red(`API request failed: ${errorMessage}`));
    return { error: { error: errorMessage }, status: 0 };
  }
}

export async function downloadFile(url: string): Promise<Buffer> {
  const response = await request(url, {
    method: 'GET',
  });

  if (response.statusCode !== 200) {
    throw new Error(`Download failed with status ${response.statusCode}`);
  }

  const chunks: Uint8Array[] = [];
  for await (const chunk of response.body) {
    chunks.push(chunk);
  }

  return Buffer.concat(chunks);
}
