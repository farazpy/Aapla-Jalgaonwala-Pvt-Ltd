import path from 'path';
import { SettingsRepository } from '../repositories/SettingsRepository';

export interface TeleCloudConfig {
  endpoint: string;
  apiKey: string;
  workspaceId?: string | number;
  caption?: string;
}

export interface TeleCloudUploadResult {
  url: string;
  directLink: string;
  fileUrl: string;
  filename: string;
  originalName: string;
  size: number;
  mimeType: string;
  messageId?: number;
  workspaceId?: number | string;
  workspaceName?: string;
  telegramLink?: string;
  checksumSha256?: string;
}

export async function getTeleCloudConfig(): Promise<TeleCloudConfig> {
  let endpoint = '';
  let apiKey = '';
  let workspaceId = '';
  let caption = 'Uploaded via Aapla Jalgaonwala Admin';

  try {
    const settings = await SettingsRepository.get();
    if ((settings as any).teleCloudEndpoint) endpoint = String((settings as any).teleCloudEndpoint).trim();
    if ((settings as any).teleCloudApiKey) apiKey = String((settings as any).teleCloudApiKey).trim();
    if ((settings as any).teleCloudWorkspaceId !== undefined && (settings as any).teleCloudWorkspaceId !== null) {
      workspaceId = String((settings as any).teleCloudWorkspaceId).trim();
    }
    if ((settings as any).teleCloudCaption) caption = String((settings as any).teleCloudCaption).trim();
  } catch (err) {
    console.warn('[TeleCloud] Error reading admin settings:', err);
  }

  if (!endpoint) {
    endpoint = process.env.TELECLOUD_ENDPOINT_URL || process.env.VITE_TELECLOUD_ENDPOINT_URL || 'https://s3.htknetwork.in/api/v1/upload';
  }
  if (!apiKey) {
    apiKey = process.env.TELECLOUD_API_KEY || process.env.VITE_TELECLOUD_API_KEY || '';
  }
  if (!workspaceId) {
    workspaceId = process.env.TELECLOUD_WORKSPACE_ID || process.env.VITE_TELECLOUD_WORKSPACE_ID || '';
  }

  return {
    endpoint: endpoint || 'https://s3.htknetwork.in/api/v1/upload',
    apiKey,
    workspaceId,
    caption
  };
}

export async function isTeleCloudConfiguredAsync(): Promise<boolean> {
  const config = await getTeleCloudConfig();
  return Boolean(config.apiKey && config.apiKey.length > 0);
}

export async function uploadToTeleCloud(
  buffer: Buffer | Uint8Array,
  originalName: string,
  options?: {
    endpoint?: string;
    apiKey?: string;
    workspaceId?: string | number;
    caption?: string;
    fileName?: string;
    mimeType?: string;
  }
): Promise<TeleCloudUploadResult> {
  const config = await getTeleCloudConfig();
  const endpoint = options?.endpoint || config.endpoint || 'https://s3.htknetwork.in/api/v1/upload';
  const apiKey = options?.apiKey || config.apiKey;
  const workspaceId = options?.workspaceId !== undefined && options?.workspaceId !== '' ? options.workspaceId : config.workspaceId;
  const caption = options?.caption || config.caption || 'Uploaded via Aapla Jalgaonwala Admin';
  const fileName = options?.fileName || originalName || 'asset.png';

  if (!apiKey) {
    throw new Error('TeleCloud Storage API Key is missing. Please configure your TeleCloud API Key in Store Admin Settings -> Storage Engine.');
  }

  // Derive mime type
  const ext = path.extname(originalName).toLowerCase();
  let mimeType = options?.mimeType || 'application/octet-stream';
  if (['.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg', '.ico'].includes(ext)) {
    mimeType = ext === '.jpg' ? 'image/jpeg' : `image/${ext.replace('.', '')}`;
  } else if (ext === '.pdf') {
    mimeType = 'application/pdf';
  } else if (['.mp4', '.webm', '.mov'].includes(ext)) {
    mimeType = `video/${ext.replace('.', '')}`;
  }

  const formData = new FormData();
  const blob = new Blob([buffer], { type: mimeType });
  formData.append('file', blob, fileName);
  formData.append('file_name', fileName);
  if (caption) formData.append('caption', caption);
  if (workspaceId !== undefined && workspaceId !== null && String(workspaceId).trim() !== '') {
    formData.append('workspace_id', String(workspaceId).trim());
  }

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'Authorization': `Bearer ${apiKey}`
    },
    body: formData
  });

  const rawText = await res.text();
  let json: any = null;
  try {
    json = JSON.parse(rawText);
  } catch (_) {
    throw new Error(`TeleCloud Storage server returned non-JSON response (${res.status}): ${rawText.slice(0, 150)}`);
  }

  if (!res.ok || !json.success) {
    const errMsg = json?.message || json?.error || `Upload failed with status code ${res.status}`;
    throw new Error(errMsg);
  }

  const fileUrl = json.direct_link || json.file_url || json.url || '';
  if (!fileUrl) {
    throw new Error('TeleCloud Storage did not return a valid public CDN file URL.');
  }

  return {
    url: fileUrl,
    directLink: json.direct_link || fileUrl,
    fileUrl: json.file_url || fileUrl,
    filename: json.file_name || fileName,
    originalName: json.original_name || originalName,
    size: Number(json.file_size) || buffer.length,
    mimeType: json.mime_type || mimeType,
    messageId: json.message_id,
    workspaceId: json.workspace_id,
    workspaceName: json.workspace_name,
    telegramLink: json.telegram_link,
    checksumSha256: json.checksum_sha256
  };
}

export async function testTeleCloudConnection(override?: {
  endpoint?: string;
  apiKey?: string;
  workspaceId?: string | number;
}): Promise<{
  success: boolean;
  message: string;
  fileUrl?: string;
  workspaceName?: string;
  workspaceId?: string | number;
  details?: any;
}> {
  const config = await getTeleCloudConfig();
  const endpoint = override?.endpoint || config.endpoint || 'https://s3.htknetwork.in/api/v1/upload';
  const apiKey = override?.apiKey || config.apiKey;
  const workspaceId = override?.workspaceId !== undefined ? override.workspaceId : config.workspaceId;

  if (!apiKey) {
    return {
      success: false,
      message: 'API Key is required to test TeleCloud Storage connection.'
    };
  }

  // 1x1 transparent PNG test probe buffer
  const testBuffer = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
    'base64'
  );

  try {
    const result = await uploadToTeleCloud(testBuffer, 'connection_test_probe.png', {
      endpoint,
      apiKey,
      workspaceId,
      caption: 'Aapla Jalgaonwala Admin Storage Connection Probe'
    });

    return {
      success: true,
      message: `Connection successful! Connected to TeleCloud Storage${result.workspaceName ? ` (Workspace: ${result.workspaceName})` : ''}.`,
      fileUrl: result.url,
      workspaceName: result.workspaceName,
      workspaceId: result.workspaceId,
      details: result
    };
  } catch (err: any) {
    return {
      success: false,
      message: err.message || 'Failed to connect to TeleCloud Storage.'
    };
  }
}
