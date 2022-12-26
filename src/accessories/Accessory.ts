import fs from 'fs';
//@ts-check
import { Characteristic, HapStatusError, PlatformAccessory, Service } from 'homebridge';
import path from 'path';

import { iRobotPlatform } from '../platform';
import { Context, Device } from '../settings';


export default class Accessory {
  protected name: string;
  protected log: (type: 'info' | 'warn' | 'error' | 'debug' | 1 | 2 | 3 | 4, message: string, ...args: unknown[]) => void;
  protected StatusError: typeof HapStatusError;
  protected projectDir: string;
  protected logPath: string;
  protected cachePath: string;
  protected generalLogPath: string;
  protected updateCache: () => void;

  constructor(
    platform: iRobotPlatform,
    accessory: PlatformAccessory<Context>,
    device: Device,
    protected service: Service,
  ) {
    this.name = device.name;
    this.projectDir = path.join(platform.api.user.storagePath(), 'iRobot');
    this.logPath = path.join(this.projectDir, device.blid + '.log');
    this.cachePath = path.join(this.projectDir, device.blid + '.cache.json');
    this.generalLogPath = path.join(this.projectDir, 'General.log');

    if (!fs.existsSync(this.projectDir)) {
      fs.mkdirSync(this.projectDir);
    }
    this.log = (type: 'info' | 'warn' | 'error' | 'debug' | 1 | 2 | 3 | 4, message: string, ...args: unknown[]) => {
      const parsedArgs = args.map(arg => JSON.stringify(arg, null, 2));
      const date = new Date();
      const time = `${('0' + (date.getMonth() + 1)).slice(-2)}/${('0' + date.getDate()).slice(-2)}/${date.getFullYear()}, ` +
        `${('0' + (date.getHours() % 12)).slice(-2)}:${('0' + (date.getMinutes())).slice(-2)}:${('0' + (date.getSeconds())).slice(-2)} ` +
        `${date.getHours() > 12 ? 'PM' : 'AM'}`;

      //if (typeof type === 'number') {
      if (type < 4 || typeof type === 'string') {
        fs.appendFileSync(this.generalLogPath, `[${time}] ${this.name}: ${message} ${parsedArgs.join(' ')}\n`);
      }
      fs.appendFileSync(this.logPath, `[${time}] ${message} ${parsedArgs.join(' ')}\n`);
      if (typeof type === 'string') {
        platform.log[type](`${this.name}: ${message} `, ...parsedArgs);
      } else if (type <= (platform.config.logLevel ?? 3)) {
        platform.log.info(`${this.name}: ${message} `, ...parsedArgs);
      } else {
        platform.log.debug(`${this.name}: ${message} `, ...parsedArgs);
      }
    };
    this.log(4, 'Server Started');

    if (fs.existsSync(this.cachePath)) {
      this.log(4, 'Restoring data from cache');
      Object.assign(accessory.context, JSON.parse(fs.readFileSync(this.cachePath, 'utf8')));
    }
    this.updateCache = () => fs.writeFileSync(this.cachePath, JSON.stringify(accessory.context, null, 2));
    this.StatusError = platform.api.hap.HapStatusError;

    platform.api.on('shutdown', async () => {
      this.log(4, 'Server Stopped');
      accessory.context.logPath = this.logPath;
      this.updateCache();
      //accessory.context.lastState = await this.get();
      platform.api.updatePlatformAccessories([accessory]);
    });

    // set accessory information
    accessory.getService(platform.Service.AccessoryInformation)!
      .setCharacteristic(platform.Characteristic.Manufacturer, 'iRobot')
      .setCharacteristic(platform.Characteristic.SerialNumber, accessory.UUID)
      .setCharacteristic(platform.Characteristic.Model, device.publicInfo.sku)
      .setCharacteristic(platform.Characteristic.Name, this.name)
      .setCharacteristic(platform.Characteristic.FirmwareRevision, /([\d.]+)/.exec(device.publicInfo.sw)![0]);


    // set the tv name
    this.service.setCharacteristic(platform.Characteristic.ConfiguredName, device.publicInfo.robotname);

    // set sleep discovery characteristic
    this.service.setCharacteristic(platform.Characteristic.SleepDiscoveryMode,
      platform.Characteristic.SleepDiscoveryMode.ALWAYS_DISCOVERABLE);

    // handle remote control input
    this.service.getCharacteristic(platform.Characteristic.RemoteKey) ?
      this.service.removeCharacteristic(platform.Characteristic.RemoteKey as unknown as Characteristic) : undefined;
    accessory.context.overrides = accessory.context.overrides ?? [];

    const stuckName = accessory.context.overrides[ActiveIdentifier.Stuck] || 'Stuck';
    const stuckService = accessory.addService(platform.Service.InputSource, 'Stuck', 'Stuck')
      .setCharacteristic(platform.Characteristic.ConfiguredName, stuckName)
      .setCharacteristic(platform.Characteristic.Name, stuckName)
      .setCharacteristic(platform.Characteristic.InputSourceType, platform.Characteristic.InputSourceType.OTHER)
      .setCharacteristic(platform.Characteristic.IsConfigured, platform.Characteristic.IsConfigured.CONFIGURED)
      .setCharacteristic(platform.Characteristic.CurrentVisibilityState, platform.Characteristic.CurrentVisibilityState.HIDDEN)
      .setCharacteristic(platform.Characteristic.Identifier, ActiveIdentifier.Stuck);
    stuckService.getCharacteristic(platform.Characteristic.ConfiguredName)
      .onSet(value => accessory.context.overrides[ActiveIdentifier.Stuck] = value as string);
    this.service.addLinkedService(stuckService);

    const offName = accessory.context.overrides[ActiveIdentifier.Off] || 'Off';
    const offService = accessory.addService(platform.Service.InputSource, 'Off', 'Off')
      .setCharacteristic(platform.Characteristic.ConfiguredName, offName)
      .setCharacteristic(platform.Characteristic.Name, offName)
      .setCharacteristic(platform.Characteristic.InputSourceType, platform.Characteristic.InputSourceType.OTHER)
      .setCharacteristic(platform.Characteristic.IsConfigured, platform.Characteristic.IsConfigured.CONFIGURED)
      .setCharacteristic(platform.Characteristic.CurrentVisibilityState, platform.Characteristic.CurrentVisibilityState.SHOWN)
      .setCharacteristic(platform.Characteristic.Identifier, ActiveIdentifier.Off);
    offService.getCharacteristic(platform.Characteristic.ConfiguredName)
      .onSet(value => accessory.context.overrides[ActiveIdentifier.Off] = value as string);
    this.service.addLinkedService(offService);

    const dockingName = accessory.context.overrides[ActiveIdentifier.Docking] || 'Docking';
    const dockingService = accessory.addService(platform.Service.InputSource, 'Docking', 'Docking')
      .setCharacteristic(platform.Characteristic.ConfiguredName, dockingName)
      .setCharacteristic(platform.Characteristic.Name, dockingName)
      .setCharacteristic(platform.Characteristic.InputSourceType, platform.Characteristic.InputSourceType.OTHER)
      .setCharacteristic(platform.Characteristic.IsConfigured, platform.Characteristic.IsConfigured.CONFIGURED)
      .setCharacteristic(platform.Characteristic.CurrentVisibilityState, platform.Characteristic.CurrentVisibilityState.HIDDEN)
      .setCharacteristic(platform.Characteristic.Identifier, ActiveIdentifier.Docking);
    dockingService.getCharacteristic(platform.Characteristic.ConfiguredName)
      .onSet(value => accessory.context.overrides[ActiveIdentifier.Docking] = value as string);
    this.service.addLinkedService(dockingService);

    const pauseName = accessory.context.overrides[ActiveIdentifier.Pause] || 'Pause';
    const pauseService = accessory.addService(platform.Service.InputSource, 'Pause', 'Pause')
      .setCharacteristic(platform.Characteristic.ConfiguredName, pauseName)
      .setCharacteristic(platform.Characteristic.Name, pauseName)
      .setCharacteristic(platform.Characteristic.InputSourceType, platform.Characteristic.InputSourceType.OTHER)
      .setCharacteristic(platform.Characteristic.IsConfigured, platform.Characteristic.IsConfigured.CONFIGURED)
      .setCharacteristic(platform.Characteristic.CurrentVisibilityState, platform.Characteristic.CurrentVisibilityState.SHOWN)
      .setCharacteristic(platform.Characteristic.Identifier, ActiveIdentifier.Pause);
    pauseService.getCharacteristic(platform.Characteristic.ConfiguredName)
      .onSet(value => accessory.context.overrides[ActiveIdentifier.Pause] = value as string);
    this.service.addLinkedService(pauseService);

    const pausedName = accessory.context.overrides[ActiveIdentifier.Paused] || 'Paused';
    const pausedService = accessory.addService(platform.Service.InputSource, 'Paused', 'Paused')
      .setCharacteristic(platform.Characteristic.ConfiguredName, pausedName)
      .setCharacteristic(platform.Characteristic.Name, pauseName)
      .setCharacteristic(platform.Characteristic.InputSourceType, platform.Characteristic.InputSourceType.OTHER)
      .setCharacteristic(platform.Characteristic.IsConfigured, platform.Characteristic.IsConfigured.CONFIGURED)
      .setCharacteristic(platform.Characteristic.CurrentVisibilityState, platform.Characteristic.CurrentVisibilityState.HIDDEN)
      .setCharacteristic(platform.Characteristic.Identifier, ActiveIdentifier.Paused);
    pauseService.getCharacteristic(platform.Characteristic.ConfiguredName)
      .onSet(value => accessory.context.overrides[ActiveIdentifier.Paused] = value as string);
    this.service.addLinkedService(pausedService);

    const cleanName = accessory.context.overrides[ActiveIdentifier.Clean_Everywhere] || 'Clean Everywhere';
    const cleanService = accessory.addService(platform.Service.InputSource, 'Clean Everywhere', 'Clean Everywhere')
      .setCharacteristic(platform.Characteristic.ConfiguredName, cleanName)
      .setCharacteristic(platform.Characteristic.Name, cleanName)
      .setCharacteristic(platform.Characteristic.InputSourceType, platform.Characteristic.InputSourceType.OTHER)
      .setCharacteristic(platform.Characteristic.IsConfigured, platform.Characteristic.IsConfigured.CONFIGURED)
      .setCharacteristic(platform.Characteristic.CurrentVisibilityState, platform.Characteristic.CurrentVisibilityState.SHOWN)
      .setCharacteristic(platform.Characteristic.Identifier, ActiveIdentifier.Clean_Everywhere);
    cleanService.getCharacteristic(platform.Characteristic.ConfiguredName)
      .onSet(value => accessory.context.overrides[ActiveIdentifier.Clean_Everywhere] = value as string);
    this.service.addLinkedService(cleanService);

    const cleaningName = accessory.context.overrides[ActiveIdentifier.Cleaning_Everywhere] || 'Cleaning Everywhere';
    const cleaningService = accessory.addService(platform.Service.InputSource, 'Cleaning Everywhere', 'Cleaning Everywhere')
      .setCharacteristic(platform.Characteristic.ConfiguredName, cleaningName)
      .setCharacteristic(platform.Characteristic.Name, cleaningName)
      .setCharacteristic(platform.Characteristic.InputSourceType, platform.Characteristic.InputSourceType.OTHER)
      .setCharacteristic(platform.Characteristic.IsConfigured, platform.Characteristic.IsConfigured.CONFIGURED)
      .setCharacteristic(platform.Characteristic.CurrentVisibilityState, platform.Characteristic.CurrentVisibilityState.HIDDEN)
      .setCharacteristic(platform.Characteristic.Identifier, ActiveIdentifier.Cleaning_Everywhere);
    cleaningService.getCharacteristic(platform.Characteristic.ConfiguredName)
      .onSet(value => accessory.context.overrides[ActiveIdentifier.Cleaning_Everywhere] = value as string);
    this.service.addLinkedService(cleaningService);
  }
}
export const ActiveIdentifierPretty =
  ['', 'Stuck', 'Stopped', 'Docking', undefined, 'Paused', undefined, 'Cleaning Everywhere', undefined, 'Emptying Bin'] as const;
export enum ActiveIdentifier {
  Stuck = 1,
  Off,
  Docking,
  Pause,
  Paused,
  Clean_Everywhere,
  Cleaning_Everywhere,
  Empty_Bin,
  Emptying_Bin,
}