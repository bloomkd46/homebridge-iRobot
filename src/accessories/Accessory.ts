import fs from 'fs';
//@ts-check
import { HapStatusError, PlatformAccessory, Service } from 'homebridge';
import path from 'path';

import { iRobotPlatform } from '../platform';
import { Context, Device } from '../settings';


export default class Accessory {
  protected name: string;
  protected log: (type: 'info' | 'warn' | 'error' | 'debug' | 1 | 2 | 3 | 4, message: string, ...args: unknown[]) => void;
  protected StatusError: typeof HapStatusError;
  protected projectDir: string;
  protected logPath: string;
  protected generalLogPath: string;

  constructor(
    platform: iRobotPlatform,
    accessory: PlatformAccessory<Context>,
    device: Device,
    protected service: Service,
  ) {
    this.name = device.name;
    this.projectDir = path.join(platform.api.user.storagePath(), 'iRobot');
    this.logPath = path.join(this.projectDir, this.name + '.log');
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
    this.StatusError = platform.api.hap.HapStatusError;

    platform.api.on('shutdown', async () => {
      this.log(4, 'Server Stopped');
      accessory.context.logPath = this.logPath;
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
    this.service.getCharacteristic(platform.Characteristic.RemoteKey)
      .onSet((newValue) => {
        this.log('warn', 'Remote Control Currently Unsupported');
        newValue;
        /*switch (newValue) {
          case this.platform.Characteristic.RemoteKey.REWIND: {
            this.log.info('set Remote Key Pressed: REWIND');
            break;
          }
          case this.platform.Characteristic.RemoteKey.FAST_FORWARD: {
            this.log.info('set Remote Key Pressed: FAST_FORWARD');
            break;
          }
          case this.platform.Characteristic.RemoteKey.NEXT_TRACK: {
            this.log.info('set Remote Key Pressed: NEXT_TRACK');
            break;
          }
          case this.platform.Characteristic.RemoteKey.PREVIOUS_TRACK: {
            this.log.info('set Remote Key Pressed: PREVIOUS_TRACK');
            break;
          }
          case this.platform.Characteristic.RemoteKey.ARROW_UP: {
            this.log.info('set Remote Key Pressed: ARROW_UP');
            break;
          }
          case this.platform.Characteristic.RemoteKey.ARROW_DOWN: {
            this.log.info('set Remote Key Pressed: ARROW_DOWN');
            break;
          }
          case this.platform.Characteristic.RemoteKey.ARROW_LEFT: {
            this.log.info('set Remote Key Pressed: ARROW_LEFT');
            break;
          }
          case this.platform.Characteristic.RemoteKey.ARROW_RIGHT: {
            this.log.info('set Remote Key Pressed: ARROW_RIGHT');
            break;
          }
          case this.platform.Characteristic.RemoteKey.SELECT: {
            this.log.info('set Remote Key Pressed: SELECT');
            break;
          }
          case this.platform.Characteristic.RemoteKey.BACK: {
            this.log.info('set Remote Key Pressed: BACK');
            break;
          }
          case this.platform.Characteristic.RemoteKey.EXIT: {
            this.log.info('set Remote Key Pressed: EXIT');
            break;
          }
          case this.platform.Characteristic.RemoteKey.PLAY_PAUSE: {
            this.log.info('set Remote Key Pressed: PLAY_PAUSE');
            break;
          }
          case this.platform.Characteristic.RemoteKey.INFORMATION: {
            this.log.info('set Remote Key Pressed: INFORMATION');
            break;
          }
        }*/
      });


    this.service.addLinkedService(accessory.addService(platform.Service.InputSource, 'off', 'Off')
      .setCharacteristic(platform.Characteristic.ConfiguredName, 'Off')
      .setCharacteristic(platform.Characteristic.InputSourceType, platform.Characteristic.InputSourceType.OTHER)
      .setCharacteristic(platform.Characteristic.IsConfigured, platform.Characteristic.IsConfigured.CONFIGURED)
      .setCharacteristic(platform.Characteristic.Name, 'Off')
      .setCharacteristic(platform.Characteristic.CurrentVisibilityState, platform.Characteristic.CurrentVisibilityState.SHOWN)
      .setCharacteristic(platform.Characteristic.Identifier, 1),
    );
    this.service.addLinkedService(accessory.addService(platform.Service.InputSource, 'pause', 'Pause')
      .setCharacteristic(platform.Characteristic.ConfiguredName, 'Pause')
      .setCharacteristic(platform.Characteristic.InputSourceType, platform.Characteristic.InputSourceType.OTHER)
      .setCharacteristic(platform.Characteristic.IsConfigured, platform.Characteristic.IsConfigured.CONFIGURED)
      .setCharacteristic(platform.Characteristic.Name, 'Pause')
      .setCharacteristic(platform.Characteristic.CurrentVisibilityState, platform.Characteristic.CurrentVisibilityState.SHOWN)
      .setCharacteristic(platform.Characteristic.Identifier, 2),
    );
    this.service.addLinkedService(accessory.addService(platform.Service.InputSource, 'everywhere', 'Everywhere')
      .setCharacteristic(platform.Characteristic.ConfiguredName, 'Clean Everywhere')
      .setCharacteristic(platform.Characteristic.InputSourceType, platform.Characteristic.InputSourceType.OTHER)
      .setCharacteristic(platform.Characteristic.IsConfigured, platform.Characteristic.IsConfigured.CONFIGURED)
      .setCharacteristic(platform.Characteristic.Name, 'Clean Everywhere')
      .setCharacteristic(platform.Characteristic.CurrentVisibilityState, platform.Characteristic.CurrentVisibilityState.SHOWN)
      .setCharacteristic(platform.Characteristic.Identifier, 3),
    );
    this.service.addLinkedService(accessory.addService(platform.Service.InputSource, 'dock', 'Dock')
      .setCharacteristic(platform.Characteristic.ConfiguredName, 'Docking')
      .setCharacteristic(platform.Characteristic.InputSourceType, platform.Characteristic.InputSourceType.OTHER)
      .setCharacteristic(platform.Characteristic.IsConfigured, platform.Characteristic.IsConfigured.NOT_CONFIGURED)
      .setCharacteristic(platform.Characteristic.Name, 'Docking')
      .setCharacteristic(platform.Characteristic.CurrentVisibilityState, platform.Characteristic.CurrentVisibilityState.SHOWN)
      .setCharacteristic(platform.Characteristic.Identifier, 4),
    );
  }
}
