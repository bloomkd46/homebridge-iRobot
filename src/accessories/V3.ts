import { lookup } from 'dns/promises';
import { CharacteristicValue, PlatformAccessory } from 'homebridge';
import ping from 'ping';

import { getRobotByBlid, Local, LocalV3 } from '@bloomkd46/dorita980';

import { iRobotPlatform } from '../platform';
import { Context, Device } from '../settings';
import Accessory from './Accessory';


export default class V3Roomba extends Accessory {
  public _lastKnownState = (this.accessory.context.lastState as Partial<LocalV3.RobotState> | undefined) ?? {};
  public set lastKnownState(state: Partial<LocalV3.RobotState>) {
    this._lastKnownState = state; this.update();
  }

  public get lastKnownState() {
    return this._lastKnownState;
  }

  public _connected = false;
  public get connected() {
    return this._connected;
  }

  public set connected(value: boolean) {
    this._connected = value; this.update();
  }

  public ip?: string;
  dorita980?: LocalV3.Local;
  public speakerService: Service;
  constructor(
    private readonly platform: iRobotPlatform,
    private readonly accessory: PlatformAccessory<Context>,
    private readonly device: Device,
  ) {
    super(platform, accessory, device, accessory.getService(platform.Service.Television) ||
      accessory.addService(platform.Service.Television));
    this.accessory.getService(platform.Service.AccessoryInformation)!.getCharacteristic(platform.Characteristic.Identify)
      .on('set', async () => {
        await this.find();
        this.log('info', 'Finding Device:', this.lastKnownState);
      });

    // handle on / off events using the Active characteristic
    this.service.getCharacteristic(this.platform.Characteristic.Active)
      .onSet(async value => {
        if (value === 0) {
          this.keepAlive = false;
        } else if (value === 1) {
          this.keepAlive = true;
          await this.connect();
        }
      }).onGet(() => this.connected ? 1 : 0);

    this.service.setCharacteristic(this.platform.Characteristic.ActiveIdentifier, 1);

    // handle input source changes
    this.service.getCharacteristic(this.platform.Characteristic.ActiveIdentifier)
      .onSet((newValue) => {

        // the value will be the value you set for the Identifier Characteristic
        // on the Input Source service that was selected - see input sources below.

        this.log('info', 'Selected region changed to', newValue);
      });
    this.speakerService = this.accessory.getService(this.platform.Service.SmartSpeaker) ||
      this.accessory.addService(this.platform.Service.SmartSpeaker);
    this.service.getCharacteristic(this.platform.Characteristic.CurrentMediaState)
      .onGet(this.getCurrentState.bind(this));
    this.service.getCharacteristic(this.platform.Characteristic.TargetMediaState)
      .onGet(this.getTargetState.bind(this))
      .onSet(this.setTargetState.bind(this));

    /**
     * Create TV Input Source Services
     * These are the inputs the user can select from.
     * When a user selected an input the corresponding Identifier Characteristic
     * is sent to the TV Service ActiveIdentifier Characteristic handler.
     */

    // HDMI 1 Input Source

    // link to tv service
    /*
    // HDMI 2 Input Source
    const hdmi2InputService = this.accessory.addService(this.platform.Service.InputSource, 'hdmi2', 'HDMI 2');
    hdmi2InputService
      .setCharacteristic(this.platform.Characteristic.Identifier, 2)
      .setCharacteristic(this.platform.Characteristic.ConfiguredName, 'HDMI 2')
      .setCharacteristic(this.platform.Characteristic.IsConfigured, this.platform.Characteristic.IsConfigured.CONFIGURED)
      .setCharacteristic(this.platform.Characteristic.InputSourceType, this.platform.Characteristic.InputSourceType.OTHER);
    this.service.addLinkedService(hdmi2InputService); // link to tv service

    // Netflix Input Source
    const netflixInputService = this.accessory.addService(this.platform.Service.InputSource, 'netflix', 'Netflix');
    netflixInputService
      .setCharacteristic(this.platform.Characteristic.Identifier, 3)
      .setCharacteristic(this.platform.Characteristic.ConfiguredName, 'Netflix')
      .setCharacteristic(this.platform.Characteristic.IsConfigured, this.platform.Characteristic.IsConfigured.CONFIGURED)
      .setCharacteristic(this.platform.Characteristic.InputSourceType, this.platform.Characteristic.InputSourceType.OTHER);
    this.service.addLinkedService(netflixInputService); // link to tv service
*/
  }

  update() {
    //TODO: Add all characteristics that need updated
    //this.service.updateCharacteristic();
  }

  private connections = 0;
  private keepAlive = false;
  connect() {
    return new Promise((resolve, reject) => {
      if (this.dorita980) {
        if (this.connected) {
          this.connections++;
          resolve(this.dorita980);
        } else {
          this.connections++;
          this.dorita980.on('connect', () => resolve(this.dorita980));
        }
      } else {
        this.getIp().then(ip => {
          this.connections++;
          this.dorita980 = Local(this.device.blid, this.device.password, ip, 3);
          this.dorita980.on('state', state => Object.assign(this.lastKnownState, state));
          this.dorita980.on('offline', () => {
            this.ip = undefined; this.dorita980 = undefined;
            reject('Roomba Offline');
          });
          this.dorita980.on('connect', () => {
            this.connected = true;
            resolve(this.dorita980);
          });
          this.dorita980.on('close', () => {
            this.connected = false; this.dorita980 = undefined;
          });
        }).catch(() => this.log('warn', 'Offline'));
      }
    });
  }

  disconnect() {
    this.connections--;
    if (this.connections === 0 && !this.keepAlive) {
      this.dorita980?.end() ?? this.log('warn', 'Failed to disconnect');
    }
  }

  async getIp() {
    if (this.ip) {
      return this.ip;
    }
    let ip = '';
    switch (this.device.ipResolution) {
      case 'broadcast':
        ip = await new Promise((resolve, reject) =>
          getRobotByBlid(this.device.blid, (err, data) => reject(err || resolve(data.ip))));
        break;
      case 'lookup':
        ip = await new Promise((resolve, reject) =>
          lookup(this.device.publicInfo.hostname + '.local', 4).then(data => resolve(data.address)).catch(err => reject(err)));
        break;
      default:
        ip = await new Promise((resolve, reject) =>
          ping.promise.probe('ip' in this.device ? this.device.ip : this.device.publicInfo.ip)
            .then(data => resolve(data.numeric_host ?? reject() ?? '')).catch(err => reject(err)));
        break;
    }
    this.log(2, `Updating IP Address To ${ip}`);
    return ip;
  }

  async find() {
    await this.connect();
    this.dorita980?.find() ?? this.log('warn', 'Failed to find');
    this.disconnect();
  }

  getCurrentState(): CurrentState {
    switch (this.lastKnownState.cleanMissionStatus?.phase) {
      case 'cancelled':
      case 'charge':
      case '':
        return CurrentState.Stop;
      case 'new':
      case 'run':
      case 'resume':
        return CurrentState.Play;
      case 'recharge':
      case 'pause':
        return CurrentState.Pause;
      case 'stop':
        switch (this.lastKnownState.cleanMissionStatus?.cycle) {
          case 'none':
            return CurrentState.Stop;
          default:
            return CurrentState.Pause;
        }
      case 'stuck':
        return CurrentState.Interrupted;
      case 'hmMidMsn':
      case 'hmUsrDock':
      case 'dock':
      case 'dockend':
      case 'hmPostMsn':
      case undefined:
        return CurrentState.Loading;
      default:
        this.log('warn', 'Unknown phase:', this.lastKnownState.cleanMissionStatus?.phase);
        return CurrentState.Interrupted;
    }
  }

  getTargetState(): TargetState {
    switch (this.lastKnownState.cleanMissionStatus?.cycle) {
      case 'none':
        switch (this.lastKnownState.cleanMissionStatus?.phase) {
          case 'charge':
          case 'hmUsrDock':
          case 'dockend':
          case 'cancelled':
          case 'stop':
          case 'hmPostMsn':
            return TargetState.Stop;
          default:
            return TargetState.Pause;
        }
      default:
        return TargetState.Play;
    }
  }

  async setTargetState(targetState: CharacteristicValue) {
    const state = targetState as TargetState;
    await this.connect();
    await (() => {
      switch (state) {
        case TargetState.Play:
          switch (this.lastKnownState.cleanMissionStatus?.cycle) {
            case 'none':
              return this.dorita980?.start() ??
                Promise.reject('Failed to start');
            default:
              return this.dorita980?.resume() ??
                Promise.reject('Failed to resume');
          }
        case TargetState.Pause:
          return this.dorita980?.pause() ??
            Promise.reject('Failed to pause');
        case TargetState.Stop:
          return new Promise((resolve, reject) => {
            let docked = false;
            this.dorita980?.on('state', state => {
              if (state.cleanMissionStatus.phase === 'stop' && !docked) {
                docked = true;
                resolve(this.dorita980?.dock() ??
                  reject('Failed to dock'));
              }
            });
            this.dorita980?.pause() ??
              reject('Failed to pause');
          });
      }
    })().catch(err => this.log('warn', err));
    this.disconnect();
  }
}
enum CurrentState {
  Play,
  Pause,
  Stop,
  UNKNOWN,
  Loading,
  Interrupted
}
enum TargetState {
  Play,
  Pause,
  Stop
}