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
  pluginVersion?: 4;
  ip?: string;
  overrides: string[];
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
  emptyCapable?: boolean;
};

export type Config = {
  name: string;
  accessories: Device[];
  logLevel: 0 | 1 | 2 | 3 | 4;
  platform: 'iRobotPlatform';
  autoConnect?: boolean;
};
export type Device = {
  name: string;
  version: 1 | 2 | 3;
  blid: string;
  password: string;
  publicInfo: PublicInfo;
  regionData?: RegionData;
} & ipInfo;
type ipInfo = {
  ipResolution: 'manual';
  ip: string;
} | {
  ipResolution: 'lookup' | 'broadcast';
};
export type RegionData = {
  regions: { name: string; id: string; type: 'room' | 'zone'; }[];
  pmap_id: string;
  user_pmapv_id: string;
};