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
      this.accessory.context.lastMode = this.getActivity();
      this._lastKnownState = state;
      this.update();
    }
  }

  public get lastKnownState() {
    return this._lastKnownState;
  }

  public get connected() {
    this.accessory.context.connected = this.accessory.context.connected ?? false;
    return this.accessory.context.connected;
  }

  public set connected(value: boolean) {
    if (value) {
      this.offline = false;
    }
    this.accessory.context.connected = value;
    this.update();
  }

  private get offline() {
    this.accessory.context.offline = this.accessory.context.offline ?? false;
    return this.accessory.context.offline;
  }

  private set offline(value: boolean) {
    this.accessory.context.offline = value;
  }

  public mode = 0;
  public ip = this.accessory.context.ip;
  private keepAlive = false;
  dorita980?: LocalV3.Local;
  update() {
    !this.offline ? this.service.updateCharacteristic(this.platform.Characteristic.Active, this.offline ? 0 : this.keepAlive ? 1 : 0)
      : undefined;
    this.service.updateCharacteristic(this.platform.Characteristic.ActiveIdentifier, this.getActivity());
    if (this.platform.config.alwaysShowModes !== true) {
      this.updateVisibility(this.getActivity());
    }
    this.batteryService.updateCharacteristic(this.platform.Characteristic.StatusLowBattery, (this.lastKnownState.batPct ?? 0) <= 15);
    this.batteryService.updateCharacteristic(this.platform.Characteristic.BatteryLevel, this.lastKnownState.batPct ?? 0);
    this.batteryService.updateCharacteristic(this.platform.Characteristic.ChargingState,
      ['recharge', 'charge'].includes(this.lastKnownState.cleanMissionStatus?.phase ?? ''));
    this.updateCache();
  }

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
    //ACTIVE: 1; INACTIVE: 0;
    this.service.getCharacteristic(this.platform.Characteristic.Active)
      .onSet(async value => {
        if (value === 0) {
          this.keepAlive = false;
          if (!this.accessory.context.connections) {
            this.connect()
              .catch(() => this.service.updateCharacteristic(this.platform.Characteristic.Active, 0))
              .finally(() => this.disconnect());
          }
        } else if (value === 1) {
          this.keepAlive = true;
          try {
            await this.connect();
          } catch (_err) {
            throw new this.platform.api.hap.HapStatusError(HAPStatus.SERVICE_COMMUNICATION_FAILURE);
          } finally {
            this.disconnect();
          }
        }
      }).onGet(async () => {
        if (this.offline) {
          try {
            await this.connect();
            return this.keepAlive ? 1 : 0;
          } catch (_err) {
            throw new this.platform.api.hap.HapStatusError(HAPStatus.SERVICE_COMMUNICATION_FAILURE);
          } finally {
            this.disconnect();
          }
        } else {
          return this.keepAlive ? 1 : 0;
        }
      });
    if (this.platform.config.autoConnect ?? true) {
      this.connect().then(() => {
        this.service.setCharacteristic(this.platform.Characteristic.Active, 1);
      }).catch(() => { /**/ }).finally(() => this.disconnect());
    }
    //this.service.setCharacteristic(this.platform.Characteristic.ActiveIdentifier, ActiveIdentifier.Docked);
    this.service.getCharacteristic(this.platform.Characteristic.ActiveIdentifier)
      .onSet(this.setActivity.bind(this)).onGet(this.getActivity.bind(this)).on('change', this.notifyActivity.bind(this));
  }

  connect(): Promise<LocalV3.Local> {
    return new Promise((resolve, reject) => {
      if (this.dorita980) {
        if (this.connected) {
          this.accessory.context.connections++;
          resolve(this.dorita980);
        } else {
          this.accessory.context.connections++;
          this.dorita980.on('connect', () => resolve(this.dorita980!));
          this.dorita980.on('offline', () => reject());
        }
      } else {
        this.accessory.context.connections++;
        this.log(3, 'Connecting...');
        this.getIp().then(ip => {
          this.dorita980 = Local(this.device.blid, this.device.password, ip, 3);
          this.dorita980.on('state', state => {
            const oldState = this.lastKnownState;
            this.lastKnownState = Object.assign(oldState, state);
          });
          this.dorita980.on('offline', () => {
            this.offline = true; /*this.ip = undefined;*/
            this.log('warn', 'Unavailable');
            reject();
          });
          this.dorita980.on('connect', () => {
            this.log(3, 'Connected');
            this.connected = true;
            resolve(this.dorita980!);
          });
          this.dorita980.on('close', () => {
            this.offline ? this.log('debug', 'Disconnected') : this.log(3, 'Disconnected');
            this.connected = false; this.dorita980 = undefined;
          });
        }).catch(() => {
          this.log('warn', 'Offline'); reject();
        });
      }
    });
  }

  disconnect() {
    this.accessory.context.connections--;
    if (this.accessory.context.connections === 0 && !this.keepAlive) {
      this.dorita980?.end() ?? this.log('warn', 'Failed to disconnect');
    }
  }

  async getIp(): Promise<string> {
    try {
      if (this.ip) {
        return await new Promise((resolve, reject) =>
          ping.promise.probe(this.ip!)
            .then(data => resolve(data.numeric_host ?? reject() ?? '')).catch(err => reject(err)));
      }
      let ip = '';
      switch (this.device.ipResolution) {
        case 'broadcast':
          ip = await new Promise((resolve, reject) =>
            getRobotByBlid(this.device.blid, (err, data) => reject(err || resolve(data.ip))));
          break;
        case 'lookup':
          ip = await new Promise((resolve, reject) =>
            lookup('hostname' in this.device ? this.device.hostname : '', 4).then(data => resolve(data.address)).catch(err => reject(err)));
          break;
        default:
          ip = await new Promise((resolve, reject) =>
            ping.promise.probe('ip' in this.device ? this.device.ip : '')
              .then(data => resolve(data.numeric_host ?? reject() ?? '')).catch(err => reject(err)));
          break;
      }
      if (ip !== this.ip) {
        this.accessory.context.ip = ip;
        this.log(2, `Updating IP Address To ${ip}`);
      }
      return ip;
    } catch (err) {
      this.log('warn', err as string);
      throw err;
    }
  }

  async find() {
    try {
      await this.connect();
      await this.dorita980?.find() ?? this.log('warn', 'Failed to find');
    } catch (err) {
      this.service.updateCharacteristic(this.platform.Characteristic.Active, 0);
    } finally {
      this.disconnect();
    }
  }

  async setActivity(activeValue: CharacteristicValue) {
    //this.log(4, `setActivity: ${activeValue}`);
    const value = activeValue as ActiveIdentifier;
    try {
      await this.connect();
      this.recentlySet = true;
      switch (value) {
        case ActiveIdentifier.Clean_Everywhere:
          await this.dorita980?.clean() ?? this.log('warn', 'Failed to clean');
          (() => {
            const oldState = this.lastKnownState;
            this.lastKnownState = Object.assign(oldState, { cleanMissionStatus: { cycle: 'clean', phase: 'run' } });
          })();
          break;
        case ActiveIdentifier.Resume:
          await this.dorita980?.resume() ?? this.log('warn', 'Failed to resume');
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
        case ActiveIdentifier.Go_Home:
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
        case ActiveIdentifier.Stop:
          await this.dorita980?.stop() ??
            this.log('warn', 'Failed to stop');
          (() => {
            const oldState = this.lastKnownState;
            this.lastKnownState = Object.assign(oldState, { cleanMissionStatus: { cycle: 'none', phase: 'stop' } });
          })();
          break;
        case ActiveIdentifier.Empty_Bin:
          await this.dorita980?.evac() ?? this.log('warn', 'Failed to Empty Bin');
          (() => {
            const oldState = this.lastKnownState;
            this.lastKnownState = Object.assign(oldState, { cleanMissionStatus: { cycle: 'evac', phase: 'charge' } });
          })();
          break;
        case ActiveIdentifier.Locate:
          await this.dorita980?.find() ?? this.log('warn', 'Failed to locate');
          break;
        default:
          break;
      }
      setTimeout(() => {
        this.recentlySet = false;
      }, 500);
    } catch (e) {
      this.service.updateCharacteristic(this.platform.Characteristic.Active, 0);
    } finally {
      this.disconnect();
    }
  }

  getActivity(): ActiveIdentifier {
    switch (this.lastKnownState.cleanMissionStatus?.phase) {
      case 'recharge':
      case 'cancelled':
      case '':
      case undefined:
        return ActiveIdentifier.Ready;
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
            return ActiveIdentifier.Emptying_Bin;
          default:
            return ActiveIdentifier.Cleaning_Everywhere;
        }
      case 'pause':
        return ActiveIdentifier.Paused;
      case 'stop':
        switch (this.lastKnownState.cleanMissionStatus?.cycle) {
          case 'none':
            return ActiveIdentifier.Stopped;
          case 'evac':
            return ActiveIdentifier.Emptying_Bin;
          default:
            return ActiveIdentifier.Paused;
        }
      case 'charge':
        switch (this.lastKnownState.cleanMissionStatus?.cycle) {
          case 'none':
            return ActiveIdentifier.Ready;
          case 'evac':
            return ActiveIdentifier.Emptying_Bin;
          default:
            return ActiveIdentifier.Recharging;
        }
      case 'stuck':
        //this.log('warn', 'Stuck!');
        return ActiveIdentifier.Stuck;
      case 'evac':
        return ActiveIdentifier.Emptying_Bin;
      default:
        //Add unknown channel?
        this.log('warn', 'Unknown phase:', this.lastKnownState.cleanMissionStatus?.phase);
        return ActiveIdentifier.Ready;
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