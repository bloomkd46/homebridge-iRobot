import type { LocalV3, LocalV2, PublicInfo } from '@bloomkd46/dorita980';

/**
 * This is the name of the platform that users will use to register the plugin in the Homebridge config.json
 */
export const PLATFORM_NAME = 'iRobotPlatform';

/**
 * This must match the name of your plugin as defined the package.json
 */
export const PLUGIN_NAME = 'homebridge-irobot';

export type Context = {
  device: Device;
  logPath?: string;
  refreshToken?: string;
} & (V1 | V2 | V3);
type V1 = {
  lastState: Record<string, string | object>;
  version: 1;
};
type V2 = {
  lastState: Partial<LocalV2.RobotState>;
  version: 2;
};
type V3 = {
  lastState: Partial<LocalV3.RobotState>;
  version: 3;
};

export type Config = {
  name: string;
  accessories: Device[];
  logLevel: 0 | 1 | 2 | 3 | 4;
  platform: 'iRobotPlatform';
};
export type Device = {
  name: string;
  version: 1 | 2 | 3;
  blid: string;
  password: string;
  publicInfo: PublicInfo;
} & ipInfo;
type ipInfo = {
  ipResolution: 'manual';
  ip: string;
} | {
  ipResolution: 'lookup' | 'broadcast';
};