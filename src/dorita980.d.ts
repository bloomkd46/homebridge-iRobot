declare module 'dorita980' {
  export class Local {
    constructor(username: string, password: string, ip: string, version?: 1 | number, interval?: number)

    /** Emitted on successful Connection. */
    public on(event: 'connect', listener: () => void): void
    /** Emitted after a disconnection. */
    public on(event: 'close', listener: () => void): void
    /** Emitted when the client goes offline. */
    public on(event: 'offline', listener: () => void): void
    /** Emitted every time the Robot publishes a new message to the mqtt bus. */
    public on(event: 'update', listener: (data: Data) => void): void
    /** Emitted every emitIntervalTime milliseconds with the mission data. (util for mapping in models with position reporting) */
    public on(event: 'mission', listener: (data: cleanMissionStatus) => void): void
    /**
     * Emitted every time the Robot publish a new message to the mqtt bus.
     * Will print the Full robot state!
     */
    public on(event: 'state', listener: (data: unknown) => void): void
    //--------------------------------------------------------------------------------------------------------------------------------------

    /** Close the connection to the robot */
    public end(): void

  }
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  export interface fullRobotState { }

  interface cleanMissionStatus {
    cleanMissionStatus:
    {
      cycle: string;
      phase: string;
      expireM: number;
      rechrgM: number;
      error: number;
      notReady: number;
      mssnM: number;
      sqft: number;
      initiator: string;
      nMssn: number;
    };
    pose: { theta: number; point: { x: number; y: number } };
  }
  interface Data {
    state:
    {
      reported:
      {
        soundVer: string;
        uiSwVer: string;
        navSwVer: string;
        wifiSwVer: string;
        mobilityVer: string;
        bootloaderVer: string;
        umiVer: string;
        softwareVer: string;
      };
    };
  }
}