import { lookup } from 'dns/promises';
import { CharacteristicChange, CharacteristicValue, PlatformAccessory } from 'homebridge';
import ping from 'ping';

import { getRobotByBlid, Local, LocalV1 } from '@bloomkd46/dorita980';

import { iRobotPlatform } from '../platform';
import { Context, Device, V1Mission } from '../settings';
import Accessory, { ActiveIdentifier, ActiveIdentifierPretty } from './Accessory';


export default class V1Roomba extends Accessory {
  public _lastKnownState = (this.accessory.context.lastState as Partial<V1Mission> | undefined) ?? {};
  private recentlySet = false;
  public set lastKnownState(state: Partial<V1Mission>) {
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

  private get offline() {
    this.accessory.context.offline = this.accessory.context.offline ?? false;
    return this.accessory.context.offline;
  }

  private set offline(value: boolean) {
    this.accessory.context.offline = value;
  }

  public mode = 0;
  public ip?: string = this.accessory.context.ip;
  private keepAlive = false;
  dorita980?: LocalV1.Local;
  update() {
    this.service.updateCharacteristic(this.platform.Characteristic.Active, this.offline ? 1 : this.keepAlive ? 1 : 0);
    this.service.updateCharacteristic(this.platform.Characteristic.ActiveIdentifier, this.getActivity());
    if (this.platform.config.alwaysShowModes !== true) {
      this.updateVisibility(this.getActivity());
    }
    this.batteryService.updateCharacteristic(this.platform.Characteristic.StatusLowBattery, (this.lastKnownState.batPct ?? 0) <= 15);
    this.batteryService.updateCharacteristic(this.platform.Characteristic.BatteryLevel, this.lastKnownState.batPct ?? 0);
    this.batteryService.updateCharacteristic(this.platform.Characteristic.ChargingState,
      ['recharge', 'charge'].includes(this.lastKnownState.phase ?? ''));
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
        this.log('info', 'Finding Device:', this.lastKnownState);
      });

    // handle on / off events using the Active characteristic
    //ACTIVE: 1; INACTIVE: 0;
    this.service.getCharacteristic(this.platform.Characteristic.Active)
      .onSet(async value => {
        if (value === 0) {
          this.keepAlive = false;
        } else if (value === 1) {
          this.keepAlive = true;
          await this.connect();
        }
      }).onGet(() => this.offline ? 0 : this.keepAlive ? 1 : 0);
    this.service.setCharacteristic(this.platform.Characteristic.Active, (this.platform.config.autoConnect ?? true) ? 1 : 0);
    this.service.setCharacteristic(this.platform.Characteristic.ActiveIdentifier, ActiveIdentifier.Ready);
    this.service.getCharacteristic(this.platform.Characteristic.ActiveIdentifier)
      .onSet(this.setActivity.bind(this)).onGet(this.getActivity.bind(this)).on('change', this.notifyActivity.bind(this));
  }

  private interval?: NodeJS.Timer;
  connect(): Promise<LocalV1.Local> {
    return new Promise((resolve, reject) => {
      if (this.dorita980) {
        resolve(this.dorita980);
      } else {
        this.getIp().then(ip => {
          this.dorita980 = Local(this.device.blid, this.device.password, ip, 1);
          this.interval = setInterval(async () => {
            if (this.keepAlive) {
              const state = (await this.dorita980?.getMission().catch(() => {
                this.offline = true; /*this.ip = undefined;*/ this.dorita980 = undefined;
              }))?.ok ?? this.log('warn', 'Failed to fetch state');
              if (state) {
                const oldState = this.lastKnownState;
                this.lastKnownState = Object.assign(oldState, state);
              }
            } else {
              if (this.interval) {
                clearInterval(this.interval); this.interval = undefined;
              }
            }
          }, 500);
          resolve(this.dorita980);
        }).catch(() => {
          this.log('warn', 'Offline'); reject();
        });
      }
    });
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

  async setActivity(activeValue: CharacteristicValue) {
    this.recentlySet = true;
    //this.log(4, `setActivity: ${activeValue}`);
    const value = activeValue as ActiveIdentifier;
    await this.connect();
    switch (value) {
      case ActiveIdentifier.Clean_Everywhere:
        await this.dorita980?.start() ?? this.log('warn', 'Failed to clean');
        (() => {
          const oldState = this.lastKnownState;
          this.lastKnownState = Object.assign(oldState, { cycle: 'clean', phase: 'run' });
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
          this.lastKnownState = Object.assign(oldState, { cycle: 'clean', phase: 'stop' });
        })();
        break;
      case ActiveIdentifier.Go_Home:
        if (this.lastKnownState.phase !== 'charge') {
          await new Promise(resolve => {
            let docked = false;
            setInterval(async () => {
              if (this.lastKnownState.phase === 'stop' && !docked) {
                docked = true;
                resolve(await this.dorita980?.dock() ??
                  this.log('warn', 'Failed to dock'));
                (() => {
                  const oldState = this.lastKnownState;
                  this.lastKnownState = Object.assign(oldState, { cycle: 'clean', phase: 'hmUsrDock' });
                })();
              }
            }, 500);
            this.dorita980?.pause() ??
              this.log('warn', 'Failed to pause');
            (() => {
              const oldState = this.lastKnownState;
              this.lastKnownState = Object.assign(oldState, { cycle: 'clean', phase: 'stop' });
            })();
          });
        }
        break;
      case ActiveIdentifier.Stop:
        await this.dorita980?.stop() ??
          this.log('warn', 'Failed to stop');
        (() => {
          const oldState = this.lastKnownState;
          this.lastKnownState = Object.assign(oldState, { cycle: 'none', phase: 'stop' });
        })();
        break;
      default:
        break;
    }
    setTimeout(() => {
      this.recentlySet = false;
    }, 500);
  }

  getActivity(): ActiveIdentifier {
    switch (this.lastKnownState.phase) {
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
        switch (this.lastKnownState.cycle) {
          case 'evac':
            return ActiveIdentifier.Emptying_Bin;
          default:
            return ActiveIdentifier.Cleaning_Everywhere;
        }
      case 'pause':
        return ActiveIdentifier.Paused;
      case 'stop':
        switch (this.lastKnownState.cycle) {
          case 'none':
            return ActiveIdentifier.Stopped;
          case 'evac':
            return ActiveIdentifier.Emptying_Bin;
          default:
            return ActiveIdentifier.Paused;
        }
      case 'charge':
        switch (this.lastKnownState.cycle) {
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
        this.log('warn', 'Unknown phase:', this.lastKnownState.phase);
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