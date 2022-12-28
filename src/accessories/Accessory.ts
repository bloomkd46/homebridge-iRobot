import fs from 'fs';
//@ts-check
import { Characteristic, HapStatusError, PlatformAccessory, Service } from 'homebridge';
import path from 'path';

import { LocalV3 } from '@bloomkd46/dorita980';

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
  //protected addEmptyBinService: () => void;
  protected updateVisibility: (activity: ActiveIdentifier) => void;

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

    const emptyName = accessory.context.overrides[ActiveIdentifier.Empty_Bin] || 'Empty Bin';
    const emptyService = accessory.addService(platform.Service.InputSource, 'Empty Bin', 'Empty Bin')
      .setCharacteristic(platform.Characteristic.ConfiguredName, emptyName)
      .setCharacteristic(platform.Characteristic.Name, emptyName)
      .setCharacteristic(platform.Characteristic.InputSourceType, platform.Characteristic.InputSourceType.OTHER)
      //.setCharacteristic(platform.Characteristic.IsConfigured, platform.Characteristic.IsConfigured.NOT_CONFIGURED)
      .setCharacteristic(platform.Characteristic.CurrentVisibilityState, platform.Characteristic.CurrentVisibilityState.SHOWN)
      .setCharacteristic(platform.Characteristic.Identifier, ActiveIdentifier.Empty_Bin);
    emptyService.getCharacteristic(platform.Characteristic.ConfiguredName)
      .onSet(value => accessory.context.overrides[ActiveIdentifier.Empty_Bin] = value as string);
    emptyService.getCharacteristic(platform.Characteristic.IsConfigured)
      .onGet(() => (accessory.context.lastState as Partial<LocalV3.RobotState>)?.evacAllowed ? 1 : 0);
    this.service.addLinkedService(emptyService);

    const emptyingName = accessory.context.overrides[ActiveIdentifier.Emptying_Bin] || 'Emptying Bin';
    const emptyingService = accessory.addService(platform.Service.InputSource, 'Emptying Bin', 'Emptying Bin')
      .setCharacteristic(platform.Characteristic.ConfiguredName, emptyingName)
      .setCharacteristic(platform.Characteristic.Name, emptyingName)
      .setCharacteristic(platform.Characteristic.InputSourceType, platform.Characteristic.InputSourceType.OTHER)
      //.setCharacteristic(platform.Characteristic.IsConfigured, platform.Characteristic.IsConfigured.NOT_CONFIGURED)
      .setCharacteristic(platform.Characteristic.CurrentVisibilityState, platform.Characteristic.CurrentVisibilityState.HIDDEN)
      .setCharacteristic(platform.Characteristic.Identifier, ActiveIdentifier.Emptying_Bin);
    emptyingService.getCharacteristic(platform.Characteristic.ConfiguredName)
      .onSet(value => accessory.context.overrides[ActiveIdentifier.Emptying_Bin] = value as string);
    emptyingService.getCharacteristic(platform.Characteristic.IsConfigured)
      .onGet(() => (accessory.context.lastState as Partial<LocalV3.RobotState>)?.evacAllowed ? 1 : 0);
    this.service.addLinkedService(emptyingService);

    const offName = accessory.context.overrides[ActiveIdentifier.Off] || 'Go Home';
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

    const dockedName = accessory.context.overrides[ActiveIdentifier.Docked] || 'Docked';
    const dockedService = accessory.addService(platform.Service.InputSource, 'Docked', 'Docked')
      .setCharacteristic(platform.Characteristic.ConfiguredName, dockedName)
      .setCharacteristic(platform.Characteristic.Name, dockedName)
      .setCharacteristic(platform.Characteristic.InputSourceType, platform.Characteristic.InputSourceType.OTHER)
      .setCharacteristic(platform.Characteristic.IsConfigured, platform.Characteristic.IsConfigured.CONFIGURED)
      .setCharacteristic(platform.Characteristic.CurrentVisibilityState, platform.Characteristic.CurrentVisibilityState.HIDDEN)
      .setCharacteristic(platform.Characteristic.Identifier, ActiveIdentifier.Docked);
    dockedService.getCharacteristic(platform.Characteristic.ConfiguredName)
      .onSet(value => accessory.context.overrides[ActiveIdentifier.Docked] = value as string);
    this.service.addLinkedService(dockedService);

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

    const resumeName = accessory.context.overrides[ActiveIdentifier.Resume] || 'Resume';
    const resumeService = accessory.addService(platform.Service.InputSource, 'Resume', 'Resume')
      .setCharacteristic(platform.Characteristic.ConfiguredName, resumeName)
      .setCharacteristic(platform.Characteristic.Name, resumeName)
      .setCharacteristic(platform.Characteristic.InputSourceType, platform.Characteristic.InputSourceType.OTHER)
      .setCharacteristic(platform.Characteristic.IsConfigured, platform.Characteristic.IsConfigured.CONFIGURED)
      .setCharacteristic(platform.Characteristic.CurrentVisibilityState, platform.Characteristic.CurrentVisibilityState.SHOWN)
      .setCharacteristic(platform.Characteristic.Identifier, ActiveIdentifier.Resume);
    resumeService.getCharacteristic(platform.Characteristic.ConfiguredName)
      .onSet(value => accessory.context.overrides[ActiveIdentifier.Resume] = value as string);
    this.service.addLinkedService(resumeService);

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

    /*this.addEmptyBinService = () => {
      emptyService.updateCharacteristic(platform.Characteristic.IsConfigured, platform.Characteristic.IsConfigured.CONFIGURED);
      emptyingService.updateCharacteristic(platform.Characteristic.IsConfigured, platform.Characteristic.IsConfigured.CONFIGURED);
      accessory.context.emptyCapable = true;
    };*/
    this.updateVisibility = (activity) => {
      // HIDDEN: 1; SHOWN: 0
      emptyService.updateCharacteristic(platform.Characteristic.CurrentVisibilityState,
        activity === ActiveIdentifier.Docked ? 0 : 1);
      offService.updateCharacteristic(platform.Characteristic.CurrentVisibilityState,
        [ActiveIdentifier.Docked, ActiveIdentifier.Docking].includes(activity) ? 1 : 0);
      pauseService.updateCharacteristic(platform.Characteristic.CurrentVisibilityState,
        [ActiveIdentifier.Paused, ActiveIdentifier.Docked].includes(activity) ? 1 : 0);
      resumeService.updateCharacteristic(platform.Characteristic.CurrentVisibilityState,
        activity === ActiveIdentifier.Paused ? 0 : 1);
      cleanService.updateCharacteristic(platform.Characteristic.CurrentVisibilityState,
        (activity >= ActiveIdentifier.Cleaning_Everywhere || activity === ActiveIdentifier.Paused) ? 1 : 0);
    };
  }
}
export const ActiveIdentifierPretty = [undefined, 'Stuck', undefined, 'Emptying Bin', undefined, 'Docked', 'Docking', undefined, 'Paused',
  undefined, undefined, 'Cleaning Everywhere'] as const;
export enum ActiveIdentifier {
  Stuck = 1,
  Empty_Bin,
  Emptying_Bin,
  Off,
  Docked,
  Docking,
  Pause,
  Paused,
  Resume,
  Clean_Everywhere,
  Cleaning_Everywhere,
}