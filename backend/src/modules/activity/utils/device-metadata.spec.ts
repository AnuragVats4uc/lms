import { ActivityDeviceType } from '@prisma/client';

import { parseDeviceMetadata } from './device-metadata';

describe('device metadata parser', () => {
  it('recognizes a desktop Chrome user agent', () => {
    expect(
      parseDeviceMetadata(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/128.0 Safari/537.36',
      ),
    ).toEqual({
      deviceType: ActivityDeviceType.DESKTOP,
      browser: 'Chrome',
      operatingSystem: 'Windows',
    });
  });

  it('recognizes an iPhone as mobile Safari', () => {
    expect(
      parseDeviceMetadata(
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1 Version/17.5 Mobile/15E148 Safari/604.1',
      ),
    ).toEqual({
      deviceType: ActivityDeviceType.MOBILE,
      browser: 'Safari',
      operatingSystem: 'iOS',
    });
  });

  it('recognizes automated clients before desktop markers', () => {
    expect(
      parseDeviceMetadata(
        'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
      ).deviceType,
    ).toBe(ActivityDeviceType.BOT);
  });

  it('distinguishes an Android tablet from an Android phone', () => {
    expect(
      parseDeviceMetadata(
        'Mozilla/5.0 (Linux; Android 14; Pixel Tablet) AppleWebKit/537.36 Chrome/128.0 Safari/537.36',
      ).deviceType,
    ).toBe(ActivityDeviceType.TABLET);
  });

  it('returns unknown metadata when no user agent is supplied', () => {
    expect(parseDeviceMetadata(null)).toEqual({
      deviceType: ActivityDeviceType.UNKNOWN,
      browser: null,
      operatingSystem: null,
    });
  });
});
