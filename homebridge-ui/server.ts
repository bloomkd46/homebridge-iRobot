/* eslint-disable no-console */

import { lookup } from 'dns/promises';
import { readFileSync } from 'fs';
import { join } from 'path';

import { getPassword, getPasswordCloud, getRobotByBlid, getRobotPublicInfo, PublicInfo } from '@bloomkd46/dorita980';
import { HomebridgePluginUiServer } from '@homebridge/plugin-ui-utils';


class PluginUiServer extends HomebridgePluginUiServer {
  constructor() {
    super();
    const storagePath = join(this.homebridgeStoragePath ?? '', 'iRobot');

    this.onRequest('/getLogs', (blid: string) => {
      try {
        readFileSync(join(storagePath, `${blid}.log`), 'utf-8');
      } catch (err) {
        return `Failed to load logs from ${join(storagePath, `${blid}.log`)}`;
      }
    });

    this.onRequest('/configureDevices',
      async (payload: { email: string; password: string; } | { ip: string; blid?: string; password?: string; }[]) => {
        const devices: Device[] = [];
        if (Array.isArray(payload)) {
          for (const device of payload) {
            if (device.blid && device.password) {
              const networkInfo: ipInfo = await new Promise(resolve =>
                lookup(`iRobot-${device.blid}.local`, 4).then(() => resolve({
                  ipResolution: 'lookup', hostname: `iRobot-${device.blid}.local`,
                })).catch(() => resolve(undefined))) ??
                await new Promise(resolve =>
                  lookup(`Roomba-${device.blid}.local`, 4).then(() => resolve({
                    ipResolution: 'lookup', hostname: `Roomba-${device.blid}.local`,
                  })).catch(() => resolve(undefined))) ??
                await new Promise(resolve =>
                  getRobotByBlid(device.blid, (err) => err ? resolve(undefined) : resolve({ ipResolution: 'broadcast' }))) ??
                { ipResolution: 'manual', ip: device.ip };

              const publicInfo: PublicInfo = await new Promise(resolve =>
                getRobotPublicInfo(device.ip, (err, data) => err ? resolve(undefined) : resolve(data)));
              devices.push({
                name: publicInfo.robotname,
                blid: device.blid,
                password: device.password,
                sw: publicInfo.sw,
                sku: publicInfo.sku,
                ...networkInfo,
              });
            } else {
              const deviceInfo = await getPassword(device.ip);
              const networkInfo: ipInfo = await new Promise(resolve =>
                lookup(`iRobot-${deviceInfo.blid}.local`, 4).then(() => resolve({
                  ipResolution: 'lookup', hostname: `iRobot-${deviceInfo.blid}.local`,
                })).catch(() => resolve(undefined))) ??
                await new Promise(resolve =>
                  lookup(`Roomba-${deviceInfo.blid}.local`, 4).then(() => resolve({
                    ipResolution: 'lookup', hostname: `Roomba-${deviceInfo.blid}.local`,
                  })).catch(() => resolve(undefined))) ??
                await new Promise(resolve =>
                  getRobotByBlid(deviceInfo.blid, (err) => err ? resolve(undefined) : resolve({ ipResolution: 'broadcast' }))) ??
                { ipResolution: 'manual', ip: device.ip };

              devices.push({
                name: deviceInfo.robotname,
                blid: deviceInfo.blid,
                password: deviceInfo.password,
                sw: deviceInfo.sw,
                sku: deviceInfo.sku,
                ...networkInfo,
              });
            }
          }
          payload;
        } else {
          const email = payload.email;
          const password = payload.password;
          for (const device of await getPasswordCloud(email, password)) {
            const networkInfo: ipInfo = await new Promise(resolve =>
              lookup(`iRobot-${device.blid}.local`, 4).then(() => resolve({
                ipResolution: 'lookup', hostname: `iRobot-${device.blid}.local`,
              })).catch(() => resolve(undefined))) ??
              await new Promise(resolve =>
                lookup(`Roomba-${device.blid}.local`, 4).then(() => resolve({
                  ipResolution: 'lookup', hostname: `Roomba-${device.blid}.local`,
                })).catch(() => resolve(undefined))) ??
              await new Promise(resolve =>
                getRobotByBlid(device.blid, (err) => err ? resolve(undefined) : resolve({ ipResolution: 'broadcast' }))) ??
              { ipResolution: 'manual', ip: '' };

            devices.push({
              name: device.name,
              blid: device.blid,
              password: device.password,
              sw: device.softwareVer,
              sku: device.sku,
              ...networkInfo,
            });
          }
        }
        return devices;
      });

    this.ready();
  }
}

(() => new PluginUiServer())();
type Device = {
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