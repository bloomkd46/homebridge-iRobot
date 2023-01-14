import type { LocalV3, LocalV2, LocalV1 } from '@bloomkd46/dorita980';
import { ActiveIdentifier } from './accessories/Accessory';


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
  connected?: boolean;
  offline?: boolean;
  logPath?: string;
  refreshToken?: string;
  pluginVersion?: 4;
  ip?: string;
  overrides: string[];
  //emptyCapable?: boolean;
  regions?: {
    name: string;
    id: string;
    type: 'rid' | 'zid';
    pmap_id: string;
    user_pmapv_id: string;
  }[];
  lastMode: ActiveIdentifier;
  connections: number;
} & (V1 | V2 | V3);
export type V1Mission = Awaited<ReturnType<LocalV1.Local['getMission']>>['ok'];
type V1 = {
  lastState: Partial<V1Mission>;
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
  autoConnect?: boolean;
  alwaysShowModes?: boolean;
};
export type Device = {
  name: string;
  blid: string;
  password: string;
  sw: string;
  sku: string;
  //publicInfo: PublicInfo;
} & ipInfo;
type ipInfo = {
  ipResolution: 'manual';
  ip: string;
} | {
  ipResolution: 'lookup';
  hostname: string;
} | {
  ipResolution: 'broadcast';
};