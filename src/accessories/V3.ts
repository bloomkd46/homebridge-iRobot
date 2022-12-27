import { lookup } from 'dns/promises';
import { CharacteristicChange, CharacteristicValue, HAPStatus, PlatformAccessory } from 'homebridge';
import ping from 'ping';

import { getRobotByBlid, Local, LocalV3 } from '@bloomkd46/dorita980';

import { iRobotPlatform } from '../platform';
import { Context, Device } from '../settings';
import Accessory, { ActiveIdentifier, ActiveIdentifierPretty } from './Accessory';


export default class V3Roomba extends Accessory {
  public _lastKnownState = (this.accessory.context.lastState as Partial<LocalV3.RobotState> | undefined) ?? {};
  private recentlySet = false;
  public set lastKnownState(state: Partial<LocalV3.RobotState>) {
    this.accessory.context.lastState = state;
    if (!this.recentlySet) {
      this._lastKnownState = state;
      this.update();
    }
  }

  public get lastKnownState() {
    return this._lastKnownState;
  }

  public _connected = false;
  public get connected() {
    return this._connected;
  }

  public set connected(value: boolean) {
    if (value) {
      this.offline = false;
    }
    this._connected = value; this.update();
  }

  public mode = 0;
  public ip?: string = this.accessory.context.ip;
  private connections = 0;
  private offline = false;
  private keepAlive = false;
  dorita980?: LocalV3.Local;
  update() {
    !this.offline ? this.service.updateCharacteristic(this.platform.Characteristic.Active, this.offline ? 0 : this.keepAlive ? 1 : 0)
      : undefined;
    this.service.updateCharacteristic(this.platform.Characteristic.ActiveIdentifier, this.getActivity());
    if (this.platform.config.alwaysShowModes !== true) {
      this.updateVisibility(this.getActivity());
    }
  }

  constructor(
    private readonly platform: iRobotPlatform,
    private readonly accessory: PlatformAccessory<Context>,
    private readonly device: Device,
  ) {
    super(platform, accessory, device, accessory.getService(platform.Service.Television) ||
      accessory.addService(platform.Service.Television));
    if (this.accessory.context.emptyCapable) {
      this.addEmptyBinService();
    }
    this.accessory.getService(platform.Service.AccessoryInformation)!.getCharacteristic(platform.Characteristic.Identify)
      .on('set', async () => {
        await this.find();
        this.log('info', 'Finding Device:', this.lastKnownState);
      });

    // handle on / off events using the Active characteristic
    //ACTIVE: 1; INACTIVE: 0;
    this.service.getCharacteristic(this.platform.Characteristic.Active)
      .onSet(async value => {
        if (value === 0) {
          this.keepAlive = false;
          if (!this.connections) {
            this.connect().then(() => this.disconnect())
              .catch(() => this.service.updateCharacteristic(this.platform.Characteristic.Active, 0));
          }
        } else if (value === 1) {
          this.keepAlive = true;
          try {
            await this.connect().then(() => this.disconnect());
          } catch (_err) {
            throw new this.platform.api.hap.HapStatusError(HAPStatus.SERVICE_COMMUNICATION_FAILURE);
          }
        }
      }).onGet(async () => {
        if (this.offline) {
          try {
            await this.connect().then(() => this.disconnect());
            return this.keepAlive ? 1 : 0;
          } catch (_err) {
            throw new this.platform.api.hap.HapStatusError(HAPStatus.SERVICE_COMMUNICATION_FAILURE);
          }
        } else {
          return this.keepAlive ? 1 : 0;
        }
      });
    if (this.platform.config.autoConnect ?? true) {
      this.connect().then(() => {
        this.service.setCharacteristic(this.platform.Characteristic.Active, 1);
        this.disconnect();
      }).catch(() => { /**/ });
    }
    //this.service.setCharacteristic(this.platform.Characteristic.ActiveIdentifier, ActiveIdentifier.Docked);
    this.service.getCharacteristic(this.platform.Characteristic.ActiveIdentifier)
      .onSet(this.setActivity.bind(this)).onGet(this.getActivity.bind(this)).on('change', this.notifyActivity.bind(this));
  }

  connect(): Promise<LocalV3.Local> {
    return new Promise((resolve, reject) => {
      if (this.dorita980) {
        if (this.connected) {
          this.connections++;
          resolve(this.dorita980);
        } else {
          this.connections++;
          this.dorita980.on('connect', () => resolve(this.dorita980!));
        }
      } else {
        this.getIp().then(ip => {
          this.connections++;
          this.dorita980 = Local(this.device.blid, this.device.password, ip, 3);
          this.dorita980.on('state', state => {
            const oldState = this.lastKnownState;
            this.lastKnownState = Object.assign(oldState, state);
          });
          this.dorita980.on('offline', () => {
            this.offline = true; /*this.ip = undefined;*/ this.dorita980 = undefined;
            this.log('warn', 'Unavailable');
            reject();
          });
          this.dorita980.on('connect', () => {
            this.connected = true;
            resolve(this.dorita980!);
          });
          this.dorita980.on('close', () => {
            this.connected = false; this.dorita980 = undefined;
          });
        }).catch(() => {
          this.log('warn', 'Offline'); reject();
        });
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
    if (ip !== this.ip) {
      this.accessory.context.ip = ip;
      this.log(2, `Updating IP Address To ${ip}`);
    }
    return ip;
  }

  async find() {
    await this.connect().catch(() => this.service.updateCharacteristic(this.platform.Characteristic.Active, 0));
    this.dorita980?.find() ?? this.log('warn', 'Failed to find');
    this.disconnect();
  }

  async setActivity(activeValue: CharacteristicValue) {
    this.recentlySet = true;
    //this.log(4, `setActivity: ${activeValue}`);
    const value = activeValue as ActiveIdentifier;
    await this.connect().catch(() => this.service.updateCharacteristic(this.platform.Characteristic.Active, 0));
    switch (value) {
      case ActiveIdentifier.Clean_Everywhere:
        await this.dorita980?.clean() ?? this.log('warn', 'Failed to clean');
        (() => {
          const oldState = this.lastKnownState;
          this.lastKnownState = Object.assign(oldState, { cleanMissionStatus: { cycle: 'clean', phase: 'run' } });
        })();
        break;
      case ActiveIdentifier.Pause:
        await this.dorita980?.pause() ??
          this.log('warn', 'Failed to pause');
        (() => {
          const oldState = this.lastKnownState;
          this.lastKnownState = Object.assign(oldState, { cleanMissionStatus: { cycle: 'clean', phase: 'stop' } });
        })();
        break;
      case ActiveIdentifier.Off:
        if (this.lastKnownState.cleanMissionStatus?.phase !== 'charge') {
          await new Promise(resolve => {
            let docked = false;
            this.dorita980?.on('state', async state => {
              if (state.cleanMissionStatus.phase === 'stop' && !docked) {
                docked = true;
                resolve(await this.dorita980?.dock() ??
                  this.log('warn', 'Failed to dock'));
                (() => {
                  const oldState = this.lastKnownState;
                  this.lastKnownState = Object.assign(oldState, { cleanMissionStatus: { cycle: 'clean', phase: 'hmUsrDock' } });
                })();
              }
            });
            this.dorita980?.pause() ??
              this.log('warn', 'Failed to pause');
            (() => {
              const oldState = this.lastKnownState;
              this.lastKnownState = Object.assign(oldState, { cleanMissionStatus: { cycle: 'clean', phase: 'stop' } });
            })();
          });
        }
        break;
      case ActiveIdentifier.Empty_Bin:
        this.dorita980?.evac() ?? this.log('warn', 'Failed to Empty Bin');
        break;
      default:
        break;
    }
    setTimeout(() => {
      this.recentlySet = false;
    }, 500);
    this.disconnect();
  }

  getActivity(): ActiveIdentifier {
    switch (this.lastKnownState.cleanMissionStatus?.phase) {
      case 'recharge':
      case 'cancelled':
      case '':
      case undefined:
        return ActiveIdentifier.Docked;
      case 'hmUsrDock':
      case 'dock':
      case 'dockend':
      case 'hmPostMsn':
      case 'hmMidMsn':
        return ActiveIdentifier.Docking;
      case 'new':
      case 'run':
      case 'resume':
        switch (this.lastKnownState.cleanMissionStatus?.cycle) {
          case 'evac':
            if (!this.accessory.context.emptyCapable) {
              this.log(4, 'Adding Bin Empty Service');
              this.addEmptyBinService();
            }
            return ActiveIdentifier.Emptying_Bin;
          default:
            return ActiveIdentifier.Cleaning_Everywhere;
        }
      case 'pause':
        return ActiveIdentifier.Paused;
      case 'stop':
      case 'charge':
        switch (this.lastKnownState.cleanMissionStatus?.cycle) {
          case 'none':
            return ActiveIdentifier.Docked;
          case 'evac':
            return ActiveIdentifier.Emptying_Bin;
          default:
            return ActiveIdentifier.Paused;
        }
      case 'stuck':
        //this.log('warn', 'Stuck!');
        return ActiveIdentifier.Stuck;
      case 'evac':
        if (!this.accessory.context.emptyCapable) {
          this.log(4, 'Adding Bin Empty Service');
          this.addEmptyBinService();
        }
        return ActiveIdentifier.Emptying_Bin;
      default:
        //Add unknown channel?
        this.log('warn', 'Unknown phase:', this.lastKnownState.cleanMissionStatus?.phase);
        return ActiveIdentifier.Docked;
    }
  }

  async notifyActivity(value: CharacteristicChange) {
    if (value.newValue !== value.oldValue) {
      const status = ActiveIdentifierPretty[value.newValue as number];
      if (status) {
        this.log(status === 'Stuck' ? 'warn' : 3, this.accessory.context.overrides[value.newValue as number] || status);
      }
      //this.log(4, `${this.lastKnownState.cleanMissionStatus?.cycle} : ${this.lastKnownState.cleanMissionStatus?.phase}`);
    }
  }
}