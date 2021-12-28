import { Service, PlatformAccessory, CharacteristicValue } from 'homebridge';
import { Robot } from './getRoombas';
import dorita980 from 'dorita980';

import { Config, iRobotPlatform } from './platform';

/**
 * Platform Accessory
 * An instance of this class is created for each accessory your platform registers
 * Each accessory may expose multiple services of different service types.
 */
export class iRobotPlatformAccessory {
  private service: Service;
  private roomba;
  private active = 0;
  private lastStatus = '';

  constructor(
    private readonly platform: iRobotPlatform,
    private readonly accessory: PlatformAccessory,
    private readonly device: Robot,
    private readonly config: Config,
  ) {
    this.accessory.context.connected = false;
    this.roomba = new dorita980.Local(this.device.blid, this.device.password, this.device.ip, 2, this.config.interval);
    this.roomba.on('connect', () => {
      this.accessory.context.connected = true;
      this.platform.log.info('Succefully connected to roomba ', device.name);
    }).on('offline', () => {
      this.roomba.end();
      this.roomba = null;
      this.accessory.context.connected = false;
      this.platform.log.warn('Roomba ', device.name, ' went offline, atempting to reconnect');
      this.roomba = new dorita980.Local(this.device.blid, this.device.password, this.device.ip, this.config.interval);
    }).on('mission', (data) => {
      if(data.cleanMissionStatus.cycle !== this.lastStatus) {
        this.platform.log.debug('mission update:', data);
      }
      this.lastStatus = data.cleanMissionStatus.cycle;
      this.service.updateCharacteristic(this.platform.Characteristic.Active, data.cleanMissionStatus.cycle === 'none' ? 0 : 1);
      this.active = data === 'none' ? 0 :1;
    });

    // set accessory information
    this.accessory.getService(this.platform.Service.AccessoryInformation)!
      .setCharacteristic(this.platform.Characteristic.Manufacturer, 'iRobot')
      .setCharacteristic(this.platform.Characteristic.Model, this.device.info.sku || 'N/A')
      .setCharacteristic(this.platform.Characteristic.SerialNumber, this.device.blid || 'N/A')
      .setCharacteristic(this.platform.Characteristic.FirmwareRevision, device.info.ver || 'N/A');


    this.service = this.accessory.getService(this.platform.Service.Fanv2) ||
    this.accessory.addService(this.platform.Service.Fanv2);

    // set the service name, this is what is displayed as the default name on the Home app
    // in this example we are using the name we stored in the `accessory.context` in the `discoverDevices` method.
    this.service.setCharacteristic(this.platform.Characteristic.Name, this.device.name);

    // each service must implement at-minimum the "required characteristics" for the given service type
    // see https://developers.homebridge.io/#/service/Lightbulb

    this.service.getCharacteristic(this.platform.Characteristic.Active)
      .onSet(this.setState.bind(this))                // SET - bind to the `setOn` method below
      .onGet(this.getState.bind(this));               // GET - bind to the `getOn` method below

    /**
     * Creating multiple services of the same type.
     *
     * To avoid "Cannot add a Service with the same UUID another Service without also defining a unique 'subtype' property." error,
     * when creating multiple services of the same type, you need to use the following syntax to specify a name and subtype id:
     * this.accessory.getService('NAME') || this.accessory.addService(this.platform.Service.Lightbulb, 'NAME', 'USER_DEFINED_SUBTYPE_ID');
     *
     * The USER_DEFINED_SUBTYPE must be unique to the platform accessory (if you platform exposes multiple accessories, each accessory
     * can use the same sub type id.)
     */

    // Example: add two "motion sensor" services to the accessory
    /*
    const motionSensorOneService = this.accessory.getService('Motion Sensor One Name') ||
      this.accessory.addService(this.platform.Service.MotionSensor, 'Motion Sensor One Name', 'YourUniqueIdentifier-1');

    const motionSensorTwoService = this.accessory.getService('Motion Sensor Two Name') ||
      this.accessory.addService(this.platform.Service.MotionSensor, 'Motion Sensor Two Name', 'YourUniqueIdentifier-2');
/*
    /**
     * Updating characteristics values asynchronously.
     *
     * Example showing how to update the state of a Characteristic asynchronously instead
     * of using the `on('get')` handlers.
     * Here we change update the motion sensor trigger states on and off every 10 seconds
     * the `updateCharacteristic` method.
     *
     */
    //let motionDetected = false;
  }

  /**
   * Handle the "GET" requests from HomeKit
   * These are sent when HomeKit wants to know the current state of the accessory, for example, checking if a Light bulb is on.
   *
   * GET requests should return as fast as possbile. A long delay here will result in
   * HomeKit being unresponsive and a bad user experience in general.
   *
   * If your device takes time to respond you should update the status of your device
   * asynchronously instead using the `updateCharacteristic` method instead.

   * @example
   * this.service.updateCharacteristic(this.platform.Characteristic.On, true)
   */
  async getState(): Promise<CharacteristicValue> {
    return this.active;
  }

  async getMode(): Promise<CharacteristicValue> {
    return 1;
  }

  async getRunningState(): Promise<CharacteristicValue> {
    return this.active === 0 ? 0 : 2;
  }

  /**
   * Handle "SET" requests from HomeKit
   * These are sent when the user changes the state of an accessory, for example, changing the Brightness
   */
  async setMode(value: CharacteristicValue) {
    if(this.accessory.context.connected){
      this.platform.log.debug('Target State Not Implemented yet, ->', value);
    }
  }

  /**
   * Handle "SET" requests from HomeKit
   * These are sent when the user changes the state of an accessory, for example, turning on a Light bulb.
   */
  async setState(value: CharacteristicValue) {
    if(this.accessory.context.connected){
    // implement your own code to turn your device on/off
      if(value === 1){
        await this.roomba.clean();
      }else{
        await this.roomba.pause();
        setTimeout(async () =>{
          await this.roomba.dock();
        }, 1000);
      }

      this.platform.log.debug('Set Characteristic On ->', value);
    }
  }

}
