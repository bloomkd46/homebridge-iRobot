import { lookup } from 'dns/promises';
import { CharacteristicChange, CharacteristicValue, PlatformAccessory } from 'homebridge';
import ping from 'ping';

import { getRobotByBlid, Local, LocalV3 } from '@bloomkd46/dorita980';

import { iRobotPlatform } from '../platform';
import { Context, Device } from '../settings';
import Accessory from './Accessory';


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
  public ip?: string;
  private connections = 0;
  private offline = false;
  private keepAlive = false;
  dorita980?: LocalV3.Local;
  update() {
    //TODO: Add all characteristics that need updated
    this.service.updateCharacteristic(this.platform.Characteristic.Active, this.offline ? 1 : this.keepAlive ? 1 : 0);
    this.service.updateCharacteristic(this.platform.Characteristic.ActiveIdentifier, this.getActivity());
  }

  constructor(
    private readonly platform: iRobotPlatform,
    private readonly accessory: PlatformAccessory<Context>,
    private readonly device: Device,
  ) {
    super(platform, accessory, device, accessory.getService(platform.Service.Television) ||
      accessory.addService(platform.Service.Television));
    if ((this.accessory.context as { emptyCapable?: boolean; }).emptyCapable) {
      this.addEmptyBinService();
    }
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
          if (!this.connections) {
            await this.connect();
            this.disconnect();
          }
        } else if (value === 1) {
          this.keepAlive = true;
          await this.connect();
          this.disconnect();
        }
      }).onGet(() => this.offline ? 1 : this.keepAlive ? 1 : 0);
    this.service.setCharacteristic(this.platform.Characteristic.Active, (this.platform.config.autoConnect ?? true) ? 1 : 0);

    this.service;

    // handle input source changes
    /*this.service.getCharacteristic(this.platform.Characteristic.ActiveIdentifier)
      .onSet((newValue) => {
        this.mode = newValue as number;
        // the value will be the value you set for the Identifier Characteristic
        // on the Input Source service that was selected - see input sources below.

        this.log('info', 'Selected mode changed to', newValue);
      }).onGet(() => this.mode);*/
    this.service.setCharacteristic(this.platform.Characteristic.ActiveIdentifier, 1);
    this.service.getCharacteristic(this.platform.Characteristic.ActiveIdentifier)
      .onSet(this.setActivity.bind(this)).onGet(this.getActivity.bind(this)).on('change', this.notifyActivity.bind(this));
    /*this.speakerService = this.accessory.getService(this.platform.Service.SmartSpeaker) ||
      this.accessory.addService(this.platform.Service.SmartSpeaker);
    this.service.getCharacteristic(this.platform.Characteristic.CurrentMediaState)
      .onGet(this.getCurrentState.bind(this));
    this.service.getCharacteristic(this.platform.Characteristic.TargetMediaState)
      .onGet(this.getTargetState.bind(this))
      .onSet(this.setTargetState.bind(this));*/

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
            this.offline = true; this.ip = undefined; this.dorita980 = undefined;
            reject('Roomba Offline');
          });
          this.dorita980.on('connect', () => {
            this.connected = true;
            resolve(this.dorita980!);
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
    if (ip !== this.ip) {
      this.log(2, `Updating IP Address To ${ip}`);
    }
    return ip;
  }

  async find() {
    await this.connect();
    this.dorita980?.find() ?? this.log('warn', 'Failed to find');
    this.disconnect();
  }

  async setActivity(activeValue: CharacteristicValue) {
    this.recentlySet = true;
    //this.log(4, `setActivity: ${activeValue}`);
    const value = activeValue as ActiveIdentifier;
    await this.connect();
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
    }
    setTimeout(() => {
      this.recentlySet = false;
    }, 500);
    this.disconnect();
  }

  getActivity(): ActiveIdentifier {
    const lastState = this.service.getCharacteristic(this.platform.Characteristic.ActiveIdentifier).value;
    switch (this.lastKnownState.cleanMissionStatus?.phase) {
      case 'recharge':
      case 'cancelled':
      case '':
      case undefined:
        return ActiveIdentifier.Off;
      case 'hmUsrDock':
      case 'dock':
      case 'dockend':
      case 'hmPostMsn':
      case 'hmMidMsn':
        return ActiveIdentifier.Docking;
      case 'new':
      case 'run':
      case 'resume':
        if (lastState !== ActiveIdentifier.Clean_Everywhere && lastState !== ActiveIdentifier.Cleaning_Everywhere) {
          this.recentlySet = true;
          setTimeout(() => {
            this.recentlySet = false;
          }, 2000);
          return ActiveIdentifier.Clean_Everywhere;
        } else {
          return ActiveIdentifier.Cleaning_Everywhere;
        }
      case 'pause':
        if (lastState !== ActiveIdentifier.Paused && lastState !== ActiveIdentifier.Pause) {
          this.recentlySet = true;
          setTimeout(() => {
            this.recentlySet = false;
          }, 2000);
          return ActiveIdentifier.Pause;
        } else {
          return ActiveIdentifier.Paused;
        }
      case 'stop':
      case 'charge':
        switch (this.lastKnownState.cleanMissionStatus?.cycle) {
          case 'none':
            return ActiveIdentifier.Off;
          default:
            if (lastState !== ActiveIdentifier.Paused && lastState !== ActiveIdentifier.Pause) {
              this.recentlySet = true;
              setTimeout(() => {
                this.recentlySet = false;
              }, 2000);
              return ActiveIdentifier.Pause;
            } else {
              return ActiveIdentifier.Paused;
            }
        }
      case 'stuck':
        //this.log('warn', 'Stuck!');
        return ActiveIdentifier.Stuck;
      case 'evac':
        if (!(this.accessory.context as { emptyCapable?: boolean; }).emptyCapable) {
          this.addEmptyBinService();
        }
        if (lastState !== ActiveIdentifier.Empty_Bin && lastState !== ActiveIdentifier.Emptying_Bin) {
          this.recentlySet = true;
          setTimeout(() => {
            this.recentlySet = false;
          }, 2000);
          return ActiveIdentifier.Empty_Bin;
        } else {
          return ActiveIdentifier.Emptying_Bin;
        }
      default:
        //Add unknown channel?
        this.log('warn', 'Unknown phase:', this.lastKnownState.cleanMissionStatus?.phase);
        return ActiveIdentifier.Off;
    }
  }

  addEmptyBinService() {
    this.log(4, 'Adding Bin Empty Service');
    this.service.addLinkedService((this.accessory.getService('Empty Bin') ||
      this.accessory.addService(this.platform.Service.InputSource, 'Empty Bin', 'Empty Bin'))
      .setCharacteristic(this.platform.Characteristic.ConfiguredName, 'Empty Bin')
      .setCharacteristic(this.platform.Characteristic.InputSourceType, this.platform.Characteristic.InputSourceType.OTHER)
      .setCharacteristic(this.platform.Characteristic.IsConfigured, this.platform.Characteristic.IsConfigured.CONFIGURED)
      //.setCharacteristic(platform.Characteristic.Name, 'Empty Bin')
      .setCharacteristic(this.platform.Characteristic.CurrentVisibilityState,
        this.platform.Characteristic.CurrentVisibilityState.SHOWN)
      .setCharacteristic(this.platform.Characteristic.Identifier, 8),
    );
    this.service.addLinkedService((this.accessory.getService('Emptying Bin') ||
      this.accessory.addService(this.platform.Service.InputSource, 'Emptying Bin', 'Emptying Bin'))
      .setCharacteristic(this.platform.Characteristic.ConfiguredName, 'Emptying Bin')
      .setCharacteristic(this.platform.Characteristic.InputSourceType, this.platform.Characteristic.InputSourceType.OTHER)
      .setCharacteristic(this.platform.Characteristic.IsConfigured, this.platform.Characteristic.IsConfigured.CONFIGURED)
      //.setCharacteristic(platform.Characteristic.Name, 'Emptying Bin')
      .setCharacteristic(this.platform.Characteristic.CurrentVisibilityState,
        this.platform.Characteristic.CurrentVisibilityState.HIDDEN)
      .setCharacteristic(this.platform.Characteristic.Identifier, 9),
    );
    (this.accessory.context as { emptyCapable?: boolean; }).emptyCapable = true;
  }

  //private lastStatus?: LocalV3.RobotState['cleanMissionStatus'];
  notifyActivity(value: CharacteristicChange) {
    /* if (!this.lastStatus && this.lastKnownState.cleanMissionStatus) {
       this.lastStatus = this.lastKnownState.cleanMissionStatus;
       this.log(3, ActiveIdentifierPretty[this.getActivity()]);
     } else if ((JSON.stringify(this.lastStatus) !== JSON.stringify(this.lastKnownState.cleanMissionStatus)) &&
       (value.newValue !== value.oldValue)) {
       this.lastStatus = this.lastKnownState.cleanMissionStatus;
       this.log(3, ActiveIdentifierPretty[this.getActivity()]);
     }*/
    if (value.newValue !== value.oldValue) {
      const status = ActiveIdentifierPretty[value.newValue as number];
      if (status) {
        this.log(3, status);
      }
      this.log(4, `${this.lastKnownState.cleanMissionStatus?.cycle} : ${this.lastKnownState.cleanMissionStatus?.phase}`);
    }
  }
}
const ActiveIdentifierPretty =
  ['', 'Stuck', 'Stopped', 'Docking', 'Pause', 'Paused', undefined, 'Cleaning Everywhere', undefined, 'Emptying Bin'] as const;
enum ActiveIdentifier {
  Stuck = 1,
  Off,
  Docking,
  Pause,
  Paused,
  Clean_Everywhere,
  Cleaning_Everywhere,
  Empty_Bin,
  Emptying_Bin,
}