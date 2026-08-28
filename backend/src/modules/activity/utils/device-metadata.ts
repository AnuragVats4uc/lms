import { ActivityDeviceType } from '@prisma/client';

export type ParsedDeviceMetadata = {
  deviceType: ActivityDeviceType;
  browser: string | null;
  operatingSystem: string | null;
};

export function parseDeviceMetadata(
  userAgent?: string | null,
): ParsedDeviceMetadata {
  if (!userAgent) {
    return {
      deviceType: ActivityDeviceType.UNKNOWN,
      browser: null,
      operatingSystem: null,
    };
  }

  const normalized = userAgent.toLowerCase();
  const deviceType = detectDeviceType(normalized);

  return {
    deviceType,
    browser: detectBrowser(normalized),
    operatingSystem: detectOperatingSystem(normalized),
  };
}

function detectDeviceType(userAgent: string): ActivityDeviceType {
  if (/bot|crawler|spider|slurp|headless/.test(userAgent)) {
    return ActivityDeviceType.BOT;
  }
  if (
    /ipad|tablet|kindle|silk/.test(userAgent) ||
    (/android/.test(userAgent) && !/mobile/.test(userAgent))
  ) {
    return ActivityDeviceType.TABLET;
  }
  if (/mobile|iphone|ipod|android/.test(userAgent)) {
    return ActivityDeviceType.MOBILE;
  }
  if (/windows|macintosh|linux|cros/.test(userAgent)) {
    return ActivityDeviceType.DESKTOP;
  }
  return ActivityDeviceType.UNKNOWN;
}

function detectBrowser(userAgent: string): string | null {
  if (/edg\//.test(userAgent)) return 'Edge';
  if (/opr\/|opera/.test(userAgent)) return 'Opera';
  if (/firefox\//.test(userAgent)) return 'Firefox';
  if (/chrome\/|crios\//.test(userAgent)) return 'Chrome';
  if (/safari\//.test(userAgent)) return 'Safari';
  return null;
}

function detectOperatingSystem(userAgent: string): string | null {
  if (/windows nt/.test(userAgent)) return 'Windows';
  if (/iphone|ipad|ipod/.test(userAgent)) return 'iOS';
  if (/android/.test(userAgent)) return 'Android';
  if (/mac os x|macintosh/.test(userAgent)) return 'macOS';
  if (/cros/.test(userAgent)) return 'ChromeOS';
  if (/linux/.test(userAgent)) return 'Linux';
  return null;
}
