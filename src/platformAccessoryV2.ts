/*
import { Service, PlatformAccessory, CharacteristicValue } from 'homebridge';
import dorita980 from 'dorita980';
import { iRobotPlatform } from './platform';
import { Robot } from './getRoombas';

export class iRobotPlatformAccessoryProto1 {
  private service: Service;
  private battery: Service;
  private stuck!: Service;
  private binFilter!: Service;
  private binContact!: Service;
  private binMotion!: Service;

  private device: Robot = this.accessory.context.device;
  constructor(
    private readonly platform: iRobotPlatform,
    private readonly accessory: PlatformAccessory,
  ) {
    // set accessory information
    this.accessory.getService(this.platform.Service.AccessoryInformation)!
      .setCharacteristic(this.platform.Characteristic.Manufacturer, 'iRobot')
      .setCharacteristic(this.platform.Characteristic.Model, this.device.model || this.device.info.sku || 'N/A')
      .setCharacteristic(this.platform.Characteristic.SerialNumber, this.device.info.serialNum || this.accessory.UUID || 'N/A')
      .setCharacteristic(this.platform.Characteristic.FirmwareRevision, this.device.info.sw || this.device.info.ver || 'N/A')
      .getCharacteristic(this.platform.Characteristic.Identify).on('set', this.identify.bind(this));
  }
}
export class iRobotPlatformAccessoryProto2 {
  private service: Service;
  private battery: Service;
  private stuck!: Service;
  private binFilter!: Service;
  private binContact!: Service;
  private binMotion!: Service;

  private device: Robot = this.accessory.context.device;

  constructor(
    private readonly platform: iRobotPlatform,
    private readonly accessory: PlatformAccessory,
  ) {
    // set accessory information
    this.accessory.getService(this.platform.Service.AccessoryInformation)!
      .setCharacteristic(this.platform.Characteristic.Manufacturer, 'iRobot')
      .setCharacteristic(this.platform.Characteristic.Model, this.device.model || this.device.info.sku || 'N/A')
      .setCharacteristic(this.platform.Characteristic.SerialNumber, this.device.info.serialNum || this.accessory.UUID || 'N/A')
      .setCharacteristic(this.platform.Characteristic.FirmwareRevision, this.device.info.sw || this.device.info.ver || 'N/A')
      .getCharacteristic(this.platform.Characteristic.Identify).on('set', this.identify.bind(this));
  }
}
export class iRobotPlatformAccessoryProto3 {
  private service: Service;
  private battery: Service;
  private stuck!: Service;
  private binFilter!: Service;
  private binContact!: Service;
  private binMotion!: Service;

  private device: Robot = this.accessory.context.device;

  constructor(
    private readonly platform: iRobotPlatform,
    private readonly accessory: PlatformAccessory,
  ) {
    // set accessory information
    this.accessory.getService(this.platform.Service.AccessoryInformation)!
      .setCharacteristic(this.platform.Characteristic.Manufacturer, 'iRobot')
      .setCharacteristic(this.platform.Characteristic.Model, this.device.model || this.device.info.sku || 'N/A')
      .setCharacteristic(this.platform.Characteristic.SerialNumber, this.device.info.serialNum || this.accessory.UUID || 'N/A')
      .setCharacteristic(this.platform.Characteristic.FirmwareRevision, this.device.info.sw || this.device.info.ver || 'N/A')
      .getCharacteristic(this.platform.Characteristic.Identify).on('set', this.identify.bind(this));
  }
}
*/
