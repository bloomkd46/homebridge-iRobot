import { Logger } from 'homebridge';
import { EventEmitter } from 'stream';

import { Local } from '@bloomkd46/dorita980';


export class RoombaV1 {
  public roomba = Local(this.blid, this.password, this.ip, 1);

  constructor(private readonly blid: string, private readonly password: string, private readonly ip: string) {
    process.env.ROBOT_CIPHERS = 'AES128-SHA256';
  }

  async start() {
    await this.roomba.start();
  }

  async pause() {
    await this.roomba.pause();
  }

  async stop() {
    await this.roomba.stop();
  }

  async resume() {
    await this.roomba.resume();
  }

  async dock() {
    await this.roomba.dock();
  }

  async getMission(): Promise<MissionV1> {
    return new Promise((resolve, reject) => {
      this.roomba.getMission().then(mission => {
        mission.ok.missionFlags.full = !mission.ok.missionFlags.binRemoved;
        mission.ok.missionFlags.present = mission.ok.missionFlags.binPresent;
        resolve(Object.assign(mission.ok, mission.ok.missionFlags));
      }).catch(err => reject(err));
    });
  }
}
export interface MissionV1 {
  ok: {
    //flags: number;
    cycle: 'none' | 'clean';
    phase: 'charge' | 'stuck' | 'run';
    batPct: number;
    idle: boolean;
    full: boolean;
    //binRemoved: boolean;
    present: boolean;
    //beeping: boolean;
    //missionFlags: { idle: boolean; binFull: boolean; binRemoved: boolean; beeping: boolean };
    //notReadyMsg: 'Ready';
  };
  //id: number;

}

//------------------------------------------------------------------------------------------------------------------------------------------

export class RoombaV2 extends EventEmitter {
  public roomba?: Local;
  private timeout?: NodeJS.Timeout;
  private keepAlive = this.refreshInterval === -1;

  constructor(private readonly blid: string, private readonly password: string, private readonly ip: string,
    private readonly refreshInterval: number, private readonly log: Logger, private readonly logPrefix: string) {
    super();
    process.env.ROBOT_CIPHERS = 'AES128-SHA256';
  }

  connect(): Promise<Local> {
    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = undefined;
    }
    return new Promise((resolve, reject) => {
      if (this.roomba) {
        resolve(this.roomba);
      } else {
        this.log.debug(this.logPrefix, 'Connecting...');
        this.roomba = new Local(this.blid, this.password, this.ip, 2);
        this.roomba.on('offline', () => {
          this.log.debug(this.logPrefix, 'Offline');
          this.roomba.end();
          reject('Roomba Offline');
        }).on('close', () => {
          this.log.debug(this.logPrefix, 'Disconnected');
          this.roomba = undefined;
        }).on('connect', () => {
          this.log.debug(this.logPrefix, 'Connected');
          resolve(this.roomba);
        }).on('state', (state) => {
          this.emit('update', Object.assign(state, state.cleanMissionStatus, state.bin));
        });
      }
    });
  }

  disconnect(roomba: Local) {
    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = undefined;
    }
    if (!this.keepAlive) {
      this.timeout = setTimeout(() => {
        this.log.debug(this.logPrefix, 'Disconnecting...');
        roomba.end();
      }, this.refreshInterval || 5000);

    }
  }

  end() {
    this.connect().then((roomba) => {
      roomba.end();
    });
  }

  clean() {
    this.connect().then(async (roomba) => {
      await roomba.clean();
      this.disconnect(roomba);
    });
  }

  pause() {
    this.connect().then(async (roomba) => {
      await roomba.pause();
      this.disconnect(roomba);
    });
  }

  stop() {
    this.connect().then(async (roomba) => {
      await roomba.stop();
      this.disconnect(roomba);
    });
  }

  resume() {
    this.connect().then(async (roomba) => {
      await roomba.resume();
      this.disconnect(roomba);
    });
  }

  dock() {
    this.connect().then(async (roomba) => {
      await roomba.dock();
      this.disconnect(roomba);
    });
  }

  find() {
    this.connect().then(async (roomba) => {
      await roomba.find();
      this.disconnect(roomba);
    });
  }

  async getMission(): Promise<MissionV2> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        reject('Operation Timed out');
      }, 3000);
      this.connect().then(async (roomba) => {
        roomba.getRobotState(['cleanMissionStatus', 'bin', 'batPct'])
          .then(state => resolve(Object.assign(state, state.cleanMissionStatus, state.bin)))
          .catch(err => reject(err));
        this.disconnect(roomba);
      }).catch(err => reject(err));
    });
  }
}
export interface MissionV2 {
  cycle: 'none' | 'clean';
  phase: 'charge' | 'stuck' | 'run' | 'hmUsrDock';
  batPct: number;
  binPresent: boolean;
  binFull: boolean;
}
export class RoombaV3 extends EventEmitter {
  public roomba?: Local;
  private timeout?: NodeJS.Timeout;
  private keepAlive = this.refreshInterval === -1;

  constructor(private readonly blid: string, private readonly password: string, private readonly ip: string, private readonly sku: string,
    private readonly refreshInterval: number, private readonly log: Logger, private readonly logPrefix: string) {
    super();
    process.env.ROBOT_CIPHERS = this.sku.startsWith('j') ? 'TLS_AES_256_GCM_SHA384' : 'AES128-SHA256';
  }

  connect(): Promise<Local> {
    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = undefined;
    }
    return new Promise((resolve, reject) => {
      if (this.roomba) {
        resolve(this.roomba);
      } else {
        this.log.debug('Connecting...');
        this.roomba = new Local(this.blid, this.password, this.ip, 2);
        this.roomba.on('offline', () => {
          this.log.debug(this.logPrefix, 'Offline');
          this.roomba.end();
          reject('Roomba Offline');
        }).on('close', () => {
          this.log.debug(this.logPrefix, 'Disconnected');
          this.roomba = undefined;
        }).on('connect', () => {
          this.log.debug(this.logPrefix, 'Connected');
          resolve(this.roomba);
        }).on('update', (state) => {
          this.emit('state', Object.assign(state, state.cleanMissionStatus, state.bin));
        });
      }
    });
  }

  disconnect(roomba: Local) {
    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = undefined;
    }
    if (!this.keepAlive) {
      this.timeout = setTimeout(() => {
        this.log.debug(this.logPrefix, 'Disconnecting...');
        roomba.end();
      }, this.refreshInterval || 5000);
    }
  }

  end() {
    this.connect().then((roomba) => {
      roomba.end();
    });
  }

  clean() {
    this.connect().then(async (roomba) => {
      await roomba.clean();
      this.disconnect(roomba);
    });
  }

  cleanRoom(map) {
    map.ordered = 1;
    this.connect().then(async (roomba) => {
      await roomba.cleanRoom(map);
      this.disconnect(roomba);
    });
  }

  pause() {
    this.connect().then(async (roomba) => {
      await roomba.pause();
      this.disconnect(roomba);
    });
  }

  stop() {
    this.connect().then(async (roomba) => {
      await roomba.stop();
      this.disconnect(roomba);
    });
  }

  resume() {
    this.connect().then(async (roomba) => {
      await roomba.resume();
      this.disconnect(roomba);
    });
  }

  dock() {
    this.connect().then(async (roomba) => {
      await roomba.dock();
      this.disconnect(roomba);
    });
  }

  find() {
    this.connect().then(async (roomba) => {
      await roomba.find();
      this.disconnect(roomba);
    });
  }

  async getMission(): Promise<MissionV3> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        reject('Operation Timed out');
      }, 3000);
      this.connect().then(async (roomba) => {
        roomba.getRobotState(['cleanMissionStatus', 'bin', 'batPct'])
          .then(state => resolve(Object.assign(state, state.cleanMissionStatus, state.bin)))
          .catch(err => reject(err));
        this.disconnect(roomba);
      }).catch(err => reject(err));
    });
  }
}
export interface MissionV3 {
  cycle: 'none' | 'clean';
  phase: 'charge' | 'stuck' | 'run' | 'hmUsrDock';
  batPct: number;
  binPresent: boolean;
  binFull: boolean;
  lastCommand?: {
    pmap_id: string | null;
    regions: [{
      region_id: string; type: 'rid' | 'zid';
    },
    ] | null;
    user_pmapv_id: string | null;
  } | null;
}
export interface Map {
  ordered: 1;
  pmap_id: string;
  regions: [
    { region_id: string; type: 'rid' | 'zid'; },
  ];
  user_pmapv_id: string;
}