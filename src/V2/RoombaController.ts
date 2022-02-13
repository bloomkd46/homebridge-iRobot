import dorita980 from 'dorita980';


export class RoombaV1 {
  public roomba = new dorita980(this.blid, this.password, this.ip, 1);

  constructor(private readonly blid: string, private readonly password: string, private readonly ip: string) {
    //super(blid, password, ip, 1);
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
      this.roomba.getMission().then(mission => resolve(Object.assign(mission.ok, mission.ok.missionFlags))).catch(err => reject(err));
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
    binFull: boolean;
    binRemoved: boolean;
    beeping: boolean;
    //missionFlags: { idle: boolean; binFull: boolean; binRemoved: boolean; beeping: boolean };
    //notReadyMsg: 'Ready';
  };
  //id: number;

}