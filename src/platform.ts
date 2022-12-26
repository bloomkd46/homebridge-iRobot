import EventEmitter from 'events';
import fs from 'fs';
import { API, APIEvent, Characteristic, DynamicPlatformPlugin, Logger, PlatformAccessory, PlatformConfig, Service } from 'homebridge';
import path from 'path';

import V3Roomba from './accessories/V3';
import CustomCharacteristics from './CustomCharacteristics';
import { Config, Context, PLATFORM_NAME, PLUGIN_NAME } from './settings';


/**
 * HomebridgePlatform
 * This class is the main constructor for your plugin, this is where you should
 * parse the user config and discover/register accessories with Homebridge.
 */
export class iRobotPlatform implements DynamicPlatformPlugin {
  public readonly Service: typeof Service = this.api.hap.Service;
  public readonly Characteristic: typeof Characteristic = this.api.hap.Characteristic;
  public readonly CustomCharacteristic = CustomCharacteristics(this.api.hap);



  /** this is used to track restored cached accessories */
  private readonly cachedAccessories: PlatformAccessory<Context>[] = [];
  /** this is used to track which accessories have been restored from the cache */
  private readonly restoredAccessories: PlatformAccessory<Context>[] = [];
  /** this is used to track which accessories have been added */
  private readonly addedAccessories: PlatformAccessory<Context>[] = [];

  public config: PlatformConfig & Config;
  constructor(
    public readonly log: Logger,
    config: PlatformConfig,
    public readonly api: API,
  ) {
    this.config = config as unknown as PlatformConfig & Config;
    (this.api as unknown as EventEmitter).setMaxListeners(0);
    this.log.debug('Finished initializing platform:', this.config.name);

    // When this event is fired it means Homebridge has restored all cached accessories from disk.
    // Dynamic Platform plugins should only register new accessories after this event was fired,
    // in order to ensure they weren't added to homebridge already. This event can also be used
    // to start discovery of new accessories.
    this.api.on('didFinishLaunching', () => {
      log.debug('Executed didFinishLaunching callback');

      const projectDir = path.join(api.user.storagePath(), 'iRobot');
      const generalLogPath = path.join(projectDir, 'General.log');
      if (!fs.existsSync(projectDir)) {
        fs.mkdirSync(projectDir);
      }
      const date = new Date();
      const time = `${('0' + (date.getMonth() + 1)).slice(-2)}/${('0' + date.getDate()).slice(-2)}/${date.getFullYear()}, ` +
        `${('0' + (date.getHours() % 12)).slice(-2)}:${('0' + (date.getMinutes())).slice(-2)}:${('0' + (date.getSeconds())).slice(-2)} ` +
        `${date.getHours() > 12 ? 'PM' : 'AM'}`;
      fs.appendFileSync(generalLogPath, `[${time}] Server Started\n`);
      // run the method to discover / register your devices as accessories
      this.discoverDevices();
    });
    this.api.on(APIEvent.SHUTDOWN, () => {
      const projectDir = path.join(api.user.storagePath(), 'iRobot');
      const generalLogPath = path.join(projectDir, 'General.log');
      if (!fs.existsSync(projectDir)) {
        fs.mkdirSync(projectDir);
      }
      const date = new Date();
      const time = `${('0' + (date.getMonth() + 1)).slice(-2)}/${('0' + date.getDate()).slice(-2)}/${date.getFullYear()}, ` +
        `${('0' + (date.getHours() % 12)).slice(-2)}:${('0' + (date.getMinutes())).slice(-2)}:${('0' + (date.getSeconds())).slice(-2)} ` +
        `${date.getHours() > 12 ? 'PM' : 'AM'}`;
      fs.appendFileSync(generalLogPath, `[${time}] Server Stopped\n`);

    });
  }

  /**
   * This function is invoked when homebridge restores cached accessories from disk at startup.
   * It should be used to setup event handlers for characteristics and update respective values.
   */
  configureAccessory(accessory: PlatformAccessory<Context>) {
    this.log.info('Loading accessory from cache:', accessory.displayName);

    // add the restored accessory to the accessories cache so we can track if it has already been registered
    if (accessory.context.pluginVersion === 4) {
      this.cachedAccessories.push(accessory);
    }
  }

  /**
   * This is an example method showing how to register discovered accessories.
   * Accessories must only be registered once, previously created accessories
   * must not be registered again to prevent "duplicate UUID" errors.
   */
  discoverDevices() {
    this.log.info(
      `Loaded ${this.cachedAccessories.length} ${this.cachedAccessories.length === 1 ? 'Accessory' : 'Accessories'} From Cache`,
    );
    // loop over the discovered devices and register each one if it has not already been registered
    for (const device of this.config.accessories) {
      //this.log.debug('Configuring device: \n', JSON.stringify(device));
      // generate a unique id for the accessory this should be generated from
      // something globally unique, but constant, for example, the device serial
      // number or MAC address
      const uuid = this.api.hap.uuid.generate(device.blid);
      // see if an accessory with the same uuid has already been registered and restored from
      // the cached devices we stored in the `configureAccessory` method above
      const existingAccessory = this.cachedAccessories.find(accessory => accessory.UUID === uuid);

      if (existingAccessory) {
        // the accessory already exists
        this.log.info('Restoring existing accessory from cache:', existingAccessory.displayName);

        // if you need to update the accessory.context then you should run `api.updatePlatformAccessories`. eg.:
        // existingAccessory.context.device = device;
        // this.api.updatePlatformAccessories([existingAccessory]);

        // create the accessory handler for the restored accessory
        // this is imported from `platformAccessory.ts`
        //new iRobotPlatformAccessory(this, existingAccessory, device);
        //new platformAccessory[accessoryType](this, existingAccessory);
        switch (JSON.parse(/([\d.]+)/.exec(device.publicInfo.sw)![0].split('.').shift()!)) {
          /*case 1:
            new V1Roomba(this, existingAccessory, device);
            break;
          case 2:
            new V2Roomba(this, existingAccessory, device);
            break;*/
          case 3:
          case 22:
            new V3Roomba(this, existingAccessory, device);
            break;
        }
        // it is possible to remove platform accessories at any time using `api.unregisterPlatformAccessories`, eg.:
        // remove platform accessories when no longer present
        // this.api.unregisterPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [existingAccessory]);
        // this.log.info('Removing existing accessory from cache:', existingAccessory.displayName);
      } else {
        // the accessory does not yet exist, so we need to create it
        this.log.info('Adding new accessory:', device.name);

        // create a new accessory
        const accessory: PlatformAccessory<Context> = new this.api.platformAccessory(device.name, uuid);
        this.addedAccessories.push(accessory);

        // store a copy of the device object in the `accessory.context`
        // the `context` property can be used to store any data about the accessory you may need
        accessory.context.device = device;
        accessory.context.pluginVersion = 4;
        // create the accessory handler for the newly create accessory
        // this is imported from `platformAccessory.ts`
        //new iRobotPlatformAccessory(this, accessory, device);
        //new platformAccessory[accessoryType](this, accessory);
        switch (JSON.parse(/([\d.]+)/.exec(device.publicInfo.sw)![0].split('.').shift()!)) {
          /*case 1:
            new V1Roomba(this, accessory, device);
            break;
          case 2:
            new V2Roomba(this, accessory, device);
            break;*/
          case 3:
          case 22:
            new V3Roomba(this, accessory, device);
            break;
        }
      }
    }
    const accessoriesToRemove = this.cachedAccessories.filter(cachedAccessory =>
      !this.restoredAccessories.find(restoredAccessory => restoredAccessory.UUID === cachedAccessory.UUID));
    for (const accessory of accessoriesToRemove) {
      this.log.warn('Removing Accessory: ', accessory.displayName);
      this.api.unregisterPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
    }
    // link the accessories to your platform
    this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [...this.addedAccessories]);
    this.api.publishExternalAccessories(PLUGIN_NAME, [...this.addedAccessories]);
    this.log.info(
      `Restored ${this.restoredAccessories.length} ${this.restoredAccessories.length === 1 ? 'Accessory' : 'Accessories'}`,
    );
    this.log.info(
      `Added ${this.addedAccessories.length} ${this.addedAccessories.length === 1 ? 'Accessory' : 'Accessories'}`,
    );
    this.log.info(
      `Removed ${accessoriesToRemove.length} ${accessoriesToRemove.length === 1 ? 'Accessory' : 'Accessories'}`,
    );
  }
}