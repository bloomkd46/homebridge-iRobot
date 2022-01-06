import { Service, PlatformAccessory, CharacteristicValue } from 'homebridge';
import { iRobotPlatform } from './platform';
import events from 'events';
const eventEmitter = new events.EventEmitter();

import { Robot } from './getRoombas';
import dorita980 from 'dorita980';


/**
 * Platform Accessory
 * An instance of this class is created for each accessory your platform registers
 * Each accessory may expose multiple services of different service types.
 */
export class iRobotPlatformAccessory {
  private service: Service;
  private battery: Service;
  private stuck!: Service;
  private binFilter!: Service;
  private binContact!: Service;
  private binMotion!: Service;
  private shutdown = false;


  private binConfig: string[] = this.device.multiRoom && this.platform.config.ignoreMultiRoomBin ? [] : this.platform.config.bin.split(':');
  private roomba;
  private active = false;
  private lastStatus = { cycle: '', phase: '' };
  private lastCommandStatus = { pmap_id: null };
  private state = 0;
  private binfull = 0;
  private batteryStatus = { 'low': false, 'percent': 50, 'charging': true };
  private stuckStatus = false;
  private roomByRoom = false;

  constructor(
    private readonly platform: iRobotPlatform,
    private readonly accessory: PlatformAccessory,
    private readonly device: Robot,
  ) {
    this.platform.api.on('shutdown', () => {
      this.platform.log.info('Disconnecting From Roomba:', device.name);
      this.shutdown = true;
      if (this.accessory.context.connected) {
        this.roomba.end();
      }
    });
    this.configureRoomba();

    // set accessory information
    this.accessory.getService(this.platform.Service.AccessoryInformation)!
      .setCharacteristic(this.platform.Characteristic.Manufacturer, 'iRobot')
      .setCharacteristic(this.platform.Characteristic.Model, this.device.model || 'N/A')
      .setCharacteristic(this.platform.Characteristic.SerialNumber, 'N/A')
      .setCharacteristic(this.platform.Characteristic.FirmwareRevision, this.device.info.sw || this.device.info.ver || 'N/A')
      .getCharacteristic(this.platform.Characteristic.Identify).on('set', this.identify.bind(this));


    this.service = this.accessory.getService(this.device.name) ||
      this.accessory.addService(this.platform.Service.Fanv2, this.device.name, 'Main-Service');

    this.service.setPrimaryService(true);
    if (this.device.multiRoom && this.accessory.context.maps !== undefined) {
      this.updateRooms();
    }

    if (this.binConfig.includes('filter')) {
      this.binFilter = this.accessory.getService(this.device.name + '\'s Bin Filter') ||
        this.accessory.addService(this.platform.Service.FilterMaintenance, this.device.name + '\'s Bin Filter', 'Filter-Bin');
    }
    if (this.binConfig.includes('contact')) {
      this.binContact = this.accessory.getService(this.device.name + '\'s Bin Contact Sensor') ||
        this.accessory.addService(this.platform.Service.ContactSensor, this.device.name + '\'s Bin Contact Sensor', 'Contact-Bin');
    }
    if (this.binConfig.includes('motion')) {
      this.binMotion = this.accessory.getService(this.device.name + '\'s Bin Motion Sensor') ||
        this.accessory.addService(this.platform.Service.MotionSensor, this.device.name + '\'s Bin Motion Sensor', 'Motion-Bin');
    }


    this.battery = this.accessory.getService(this.device.name + '\'s Battery') ||
      this.accessory.addService(this.platform.Service.Battery, this.device.name + '\'s Battery', 'Battery-Service');

    if (!this.platform.config.hideStuckSensor) {
      this.stuck = this.accessory.getService(this.device.name + ' Stuck') ||
        this.accessory.addService(this.platform.Service.MotionSensor, this.device.name + ' Stuck', 'Stuck-MotionSensor');
    }
    // set the service name, this is what is displayed as the default name on the Home app
    // in this example we are using the name we stored in the `accessory.context` in the `discoverDevices` method.
    /*this.service.setCharacteristic(this.platform.Characteristic.Name, this.device.name);

    if(this.binConfig.includes('filter')){
      this.binFilter.setCharacteristic(this.platform.Characteristic.Name, this.device.name + '\'s Bin');
    }
    if(this.binConfig.includes('contact')){
      this.binContact.setCharacteristic(this.platform.Characteristic.Name, this.device.name + '\'s Bin');
    }
    if(this.binConfig.includes('motion')){
      this.binMotion.setCharacteristic(this.platform.Characteristic.Name, this.device.name + '\'s Bin');
    }

    this.battery.setCharacteristic(this.platform.Characteristic.Name, this.device.name + '\'s Battery');
    this.stuck.setCharacteristic(this.platform.Characteristic.Name, this.device.name + ' Stuck');
*/


    // each service must implement at-minimum the "required characteristics" for the given service type
    // see https://developers.homebridge.io/#/service/Lightbulb

    this.service.getCharacteristic(this.platform.Characteristic.Active)
      .onSet(this.set.bind(this))                // SET - bind to the `setOn` method below
      .onGet(this.get.bind(this));               // GET - bind to the `getOn` method below
    this.service.getCharacteristic(this.platform.Characteristic.CurrentFanState)
      .onGet(this.getState.bind(this)); // GET - bind to the
    if (this.device.multiRoom) {
      this.service.getCharacteristic(this.platform.Characteristic.TargetFanState)
        .onGet(this.getMode.bind(this)) // GET
        .onSet(this.setMode.bind(this));
    }

    if (this.binConfig.includes('filter')) {
      this.binFilter.getCharacteristic(this.platform.Characteristic.FilterChangeIndication)
        .onGet(this.getBinfull.bind(this));
    }
    if (this.binConfig.includes('contact')) {
      this.binContact.getCharacteristic(this.platform.Characteristic.ContactSensorState)
        .onGet(this.getBinfull.bind(this));
    }
    if (this.binConfig.includes('motion')) {
      this.binMotion.getCharacteristic(this.platform.Characteristic.MotionDetected)
        .onGet(this.getBinfullBoolean.bind(this));
    }


    this.battery.getCharacteristic(this.platform.Characteristic.StatusLowBattery)
      .onGet(this.getBatteryStatus.bind(this));
    this.battery.getCharacteristic(this.platform.Characteristic.BatteryLevel)
      .onGet(this.getBatteryLevel.bind(this));
    this.battery.getCharacteristic(this.platform.Characteristic.ChargingState)
      .onGet(this.getChargeState.bind(this));


    if (!this.platform.config.hideStuckSensor) {
      this.stuck.getCharacteristic(this.platform.Characteristic.MotionDetected)
        .onGet(this.getStuck.bind(this));
    }
    /*this.battery.getCharacteristic(this.platform.Characteristic.StatusLowBattery)
      .onSet(this.get)
      */
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

  async configureRoomba() {
    this.roomba = null;
    this.accessory.context.connected = false;
    this.roomba = new dorita980.Local(this.device.blid, this.device.password, this.device.ip/*, 2, this.config.interval*/);
    this.roomba.on('connect', () => {
      this.accessory.context.connected = true;
      this.platform.log.info('Succefully connected to roomba', this.device.name);
    }).on('offline', () => {
      this.accessory.context.connected = false;
      this.platform.log.warn('Roomba', this.device.name, ' went offline, disconnecting...');
      this.roomba.end();
      throw new this.platform.api.hap.HapStatusError(this.platform.api.hap.HAPStatus.SERVICE_COMMUNICATION_FAILURE);
    }).on('close', () => {
      this.accessory.context.connected = false;
      this.roomba.removeAllListeners();
      if (this.shutdown) {
        this.platform.log.info('Roomba', this.device.name, 'connection closed');
      } else {
        this.platform.log.warn('Roomba', this.device.name, ' connection closed, reconnecting in 5 seconds');
        setTimeout(() =>{
          this.platform.log.warn('Attempting To Reconnect To Roomba', this.device.name);
          this.configureRoomba();
        }, 5000);
        throw new this.platform.api.hap.HapStatusError(this.platform.api.hap.HAPStatus.SERVICE_COMMUNICATION_FAILURE);
      }
    }).on('state', this.updateRoombaState.bind(this));
  }

  updateRoombaState(data) {
    if (data.cleanMissionStatus.cycle !== this.lastStatus.cycle || data.cleanMissionStatus.phase !== this.lastStatus.phase) {
      eventEmitter.emit('state');
      this.platform.log.debug(this.device.name + '\'s mission update:',
        '\n cleeanMissionStatus:', JSON.stringify(data.cleanMissionStatus, null, 2),
        '\n batPct:', data.batPct,
        '\n bin:', JSON.stringify(data.bin),
        '\n lastCommand:', JSON.stringify(data.lastCommand));
      if(data.cleanMissionStatus.phase === 'stuck' && this.lastStatus.phase !== 'stuck'){
        this.platform.log.warn('Roomba', this.device.name, 'Is Stuck!');
      } else if(this.lastStatus.phase === 'stuck' && data.cleanMissionStatus.phase !== 'stuck'){
        this.platform.log.info('Roomba', this.device.name, 'Says "Thank You For Freeing Me"');
      }
    }
    this.lastStatus = data.cleanMissionStatus;
    if ((this.device.multiRoom && (data.lastCommand.pmap_id !== null && data.lastCommand.pmap_id !== undefined))
      && data.lastCommand.pmap_id !== this.lastCommandStatus.pmap_id) {
      this.updateMap(data.lastCommand);
    }
    this.lastCommandStatus = data.lastCommand;

    /*------------------------------------------------------------------------------------------------------------------------------------*/

    this.active = this.getHomekitActive(data.cleanMissionStatus);

    this.state = this.active ? 2 : this.getEveInactive(data.cleanMissionStatus) ? 0 : 1;

    this.binfull = data.bin.full ? 1 : 0;

    this.stuckStatus = data.cleanMissionStatus.phase === 'stuck';

    this.batteryStatus.charging = data.cleanMissionStatus.phase === 'charge';
    this.batteryStatus.low = this.batteryStatus.charging && data.batPct < (this.platform.config.lowBattery || 20);
    this.batteryStatus.percent = data.batPct;
    /*------------------------------------------------------------------------------------------------------------------------------------*/
    this.service.updateCharacteristic(this.platform.Characteristic.Active, this.active ? 1 : 0);

    this.service.updateCharacteristic(this.platform.Characteristic.CurrentFanState, this.state);

    if (this.binConfig.includes('filter')) {
      this.binFilter.updateCharacteristic(this.platform.Characteristic.FilterChangeIndication, this.binfull);
    }
    if (this.binConfig.includes('contact')) {
      this.binContact.updateCharacteristic(this.platform.Characteristic.ContactSensorState, this.binfull);
    }
    if (this.binConfig.includes('motion')) {
      this.binMotion.updateCharacteristic(this.platform.Characteristic.MotionDetected, this.binfull === 1);
    }

    this.stuck.updateCharacteristic(this.platform.Characteristic.MotionDetected, this.stuckStatus);

    this.battery.updateCharacteristic(this.platform.Characteristic.BatteryLevel, this.batteryStatus.percent);
    this.battery.updateCharacteristic(this.platform.Characteristic.StatusLowBattery, this.batteryStatus.low);
    this.battery.updateCharacteristic(this.platform.Characteristic.ChargingState, this.batteryStatus.charging);
  }

  updateMap(lastCommand) {
    if (this.accessory.context.maps !== undefined) {
      let index = -1;
      for (const map of this.accessory.context.maps) {
        if (map.pmap_id === lastCommand.pmap_id) {
          index = this.accessory.context.maps.indexOf(map);
        }
      }
      if (index !== -1) {
        //const oldRegions = this.accessory.context.maps[index].regions;
        for (const region of lastCommand.regions) {
          let exists = false;
          for (const region_ of this.accessory.context.maps[index].regions){
            if(region_.region_id === region.region_id){
              exists = true;
            }
          }
          if (!exists) {
            this.platform.log.info('Adding new region for roomba:', this.device.name, '\n', region);
            this.accessory.context.maps[index].regions.push(region);
          }
        }
        //if (oldRegions !== this.accessory.context.maps[index].regions) {
        this.platform.log.debug(this.device.name + '\'s map update:',
          '\n map:', JSON.stringify(this.accessory.context.maps));
        this.platform.log.debug('Updating Homekit Rooms for Roomba:', this.device.name);
        this.updateRooms();
        //}
      } else {
        this.platform.log.info('Creating new map for roomba:', this.device.name);
        this.accessory.context.maps.push({
          'pmap_id': lastCommand.pmap_id,
          'regions': lastCommand.regions,
          'user_pmapv_id': lastCommand.user_pmapv_id,
        });
        this.platform.log.debug(this.device.name + '\'s map update:',
          '\n map:', JSON.stringify(this.accessory.context.maps));
        this.platform.log.debug('Updating Homekit Rooms for Roomba:', this.device.name);
        this.updateRooms();
      }
    } else {
      this.platform.log.info('Creating new map for roomba:', this.device.name);
      this.accessory.context.maps = [{
        'pmap_id': lastCommand.pmap_id,
        'regions': lastCommand.regions,
        'user_pmapv_id': lastCommand.user_pmapv_id,
      }];
      this.platform.log.debug(this.device.name + '\'s map update:',
        '\n map:', JSON.stringify(this.accessory.context.maps));
      this.platform.log.debug('Updating Homekit Rooms for Roomba:', this.device.name);
      this.updateRooms();
    }
  }

  updateRooms() {
    this.accessory.context.activeRooms = [];
    //if (this.accessory.context.maps !== undefined) {
    for (const map of this.accessory.context.maps) {
      const index = this.accessory.context.maps.indexOf(map);
      for (const region of map.regions) {
        ((this.accessory.getService('Map ' + index + ' Room ' + region.region_id) ||
          this.accessory.addService(this.platform.Service.Switch,
            'Map ' + index + ' Room ' + region.region_id,
            index + ':' + region.region_id))
          .getCharacteristic(this.platform.Characteristic.On))
          .removeAllListeners()
          .onSet((activate) => {
            if (activate) {
              this.accessory.context.activeMap = index;
              if (!this.accessory.context.activeRooms.includes(region.region_id)) {
                this.accessory.context.activeRooms.push(region.region_id);
              }
            } else {
              this.accessory.context.activeRooms.splice(this.accessory.context.activeRooms.indexOf(region.region_id));
            }
            this.platform.log.info(activate ? 'enabling' : 'disabling',
              'room ' + region.region_id + ' of map ' + index + ' on roomba ' + this.device.name);
          })
          .onGet(() => {
            return this.accessory.context.activeMap === index ? this.accessory.context.activeRooms.includes(region.region_id) : false;
          });
      }
    }
  }
  //}



  getHomekitActive(cleanMissionStatus): boolean {
    const configStatus: string[] | boolean[] = this.platform.config.status.split(':');
    switch (configStatus[0]) {
      case true:
        return true;
      case false:
        return false;
      case 'inverted':
        return cleanMissionStatus[configStatus[1] as string] !== configStatus[2];
      default:
        return cleanMissionStatus[configStatus[0] as string] === configStatus[1];
    }
  }

  getEveInactive(cleanMissionStatus): boolean {
    const configStatus: string[] | boolean[] = this.platform.config.eveStatus.split(':');
    switch (configStatus[0]) {
      case true:
        return true;
      case false:
        return false;
      case 'inverted':
        return cleanMissionStatus[configStatus[1] as string] !== configStatus[2];
      default:
        return cleanMissionStatus[configStatus[0] as string] === configStatus[1];
    }
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
  async get(): Promise<CharacteristicValue> {
    if (this.accessory.context.connected){
      this.platform.log.debug('Updating', this.device.name, 'To', this.active ? 'On' : 'Off');
      return this.active ? 1 : 0;
    } else {
      throw new this.platform.api.hap.HapStatusError(this.platform.api.hap.HAPStatus.SERVICE_COMMUNICATION_FAILURE);
    }
  }

  async getState(): Promise<CharacteristicValue> {
    if (this.accessory.context.connected){
      this.platform.log.debug('Updating', this.device.name, 'Mode To', this.state === 0 ? 'Off' : this.state === 1 ? 'Idle' : 'On');
      return this.state;
    } else {
      throw new this.platform.api.hap.HapStatusError(this.platform.api.hap.HAPStatus.SERVICE_COMMUNICATION_FAILURE);
    }
  }

  async getBinfull(): Promise<CharacteristicValue> {
    if (this.accessory.context.connected){
      this.platform.log.debug('Updating', this.device.name, 'Binfull To', this.binfull === 0 ? 'OK' : 'FULL');
      return this.binfull;
    } else {
      throw new this.platform.api.hap.HapStatusError(this.platform.api.hap.HAPStatus.SERVICE_COMMUNICATION_FAILURE);
    }
  }

  async getBinfullBoolean(): Promise<CharacteristicValue> {
    if (this.accessory.context.connected){
      this.platform.log.debug('Updating', this.device.name, 'Binfull To', this.binfull === 0 ? 'OK' : 'FULL');
      return this.binfull === 1;
    } else {
      throw new this.platform.api.hap.HapStatusError(this.platform.api.hap.HAPStatus.SERVICE_COMMUNICATION_FAILURE);
    }
  }

  async getBatteryLevel(): Promise<CharacteristicValue> {
    if (this.accessory.context.connected){
      this.platform.log.debug('Updating', this.device.name, 'Battery Level To', this.batteryStatus.percent);
      return this.batteryStatus.percent;
    } else {
      throw new this.platform.api.hap.HapStatusError(this.platform.api.hap.HAPStatus.SERVICE_COMMUNICATION_FAILURE);
    }
  }

  async getBatteryStatus(): Promise<CharacteristicValue> {
    if (this.accessory.context.connected){
      this.platform.log.debug('Updating', this.device.name, 'Battery Status To', this.batteryStatus.low ? 'Low' : 'Normal');
      return this.batteryStatus.low ? 1 : 0;
    } else {
      throw new this.platform.api.hap.HapStatusError(this.platform.api.hap.HAPStatus.SERVICE_COMMUNICATION_FAILURE);
    }
  }

  async getChargeState(): Promise<CharacteristicValue> {
    if (this.accessory.context.connected){
      this.platform.log.debug('Updating', this.device.name, 'Charge Status To', this.batteryStatus.charging ? 'Charging' : 'Not Charging');
      return this.batteryStatus.charging ? 1 : 0;
    } else {
      throw new this.platform.api.hap.HapStatusError(this.platform.api.hap.HAPStatus.SERVICE_COMMUNICATION_FAILURE);
    }
  }

  async getMode(): Promise<CharacteristicValue> {
    if (this.accessory.context.connected){
      this.platform.log.debug('Updating', this.device.name, 'Mode To', this.roomByRoom ? 'Room-By-Room' : 'Everywhere');
      return this.roomByRoom ? 0 : 1;
    } else {
      throw new this.platform.api.hap.HapStatusError(this.platform.api.hap.HAPStatus.SERVICE_COMMUNICATION_FAILURE);
    }
  }

  async getStuck(): Promise<CharacteristicValue> {
    if (this.accessory.context.connected){
      this.platform.log.debug('Updating', this.device.name, 'Stuck To', this.stuckStatus);
      return this.stuckStatus;
    } else {
      throw new this.platform.api.hap.HapStatusError(this.platform.api.hap.HAPStatus.SERVICE_COMMUNICATION_FAILURE);
    }
  }



  async identify() {
    if (this.accessory.context.connected) {
      await this.roomba.find();
      this.platform.log.info('Identifying', this.device.name, '(Note: Some Models Won\'t Beep If Docked');
    }
  }



  /**
   * Handle "SET" requests from HomeKit
   * These are sent when the user changes the state of an accessory, for example, changing the Brightness
   */
  async set(value: CharacteristicValue) {
    if (this.accessory.context.connected) {
      const configOffAction: string[] = this.platform.config.offAction.split(':');
      let args;
      try {
        if (value === 1) {
          //give scenes a chance to run
          setTimeout(async () => {
            if (this.roomByRoom) {
              if (this.accessory.context.activeRooms !== undefined) {
                args = {
                  'ordered': 1,
                  'pmap_id': this.accessory.context.maps[this.accessory.context.activeMap].pmap_id,
                  'user_pmapv_id': this.accessory.context.maps[this.accessory.context.activeMap].user_pmapv_id,
                  'regions': [{}],
                };
                args.regions.splice(0);
                for (const room of this.accessory.context.activeRooms) {
                  for (const region of this.accessory.context.maps[this.accessory.context.activeMap].regions) {
                    if (region.region_id === room) {
                      args.regions.push(region);
                    }
                  }
                }
                this.platform.log.debug('Clean Room Args:\n', JSON.stringify(args));
                this.roomba.cleanRoom(args);
              }
            } else {
              await this.roomba.clean();
            }
          }, this.device.multiRoom ? 1000 : 0);
        } else {
          await this.roomba[configOffAction[0]]();
          setTimeout(async () => {
            eventEmitter.emit('state');
          }, 5000);
          eventEmitter.on('state', async () => {
            if (configOffAction[1] !== 'none') {
              await this.roomba[configOffAction[1]]();
            }
            eventEmitter.removeAllListeners();
          });
        }
        this.platform.log.debug('Set', this.device.name, 'To',
          value === 0 ? configOffAction[0] + (configOffAction[1] !== 'none' ? ' and ' + configOffAction[1] : '') : 'Clean',
          this.roomByRoom ? 'With args:' + JSON.stringify(args) : '');
      } catch (err) {
        this.platform.log.debug('Error Seting', this.device.name, 'To',
          value === 0 ? configOffAction[0] + (configOffAction[1] !== 'none' ? ' and ' + configOffAction[1] : '') : 'Clean',
          this.roomByRoom ? 'With args:' + JSON.stringify(args) : '');
        this.platform.log.error(err as string);

      }
    }
  }



  async setMode(value: CharacteristicValue) {
    if (this.accessory.context.connected) {
      this.platform.log.info('Set', this.device.name, 'To', value === 0 ? 'Room-By-Room' : 'Everywhere');
      this.roomByRoom = value === 0;
    }
  }

}
