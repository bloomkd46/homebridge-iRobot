declare module 'dorita980' {
  export class Local {
    /**
     * The library send commands directly over wifi to your robot. You dont need an internet connection.
     * @param username your roomba's blid
     * @param password your roomba's password
     * @param ip your roomba's ip address
     * @param version (optional) your roomba's protocol version (1-3, defaults to 2)
     * @param interval (optional) interval in miliseconds to emith mission event (defaults to 800ms)
     */
    constructor(username: string, password: string, ip: string, version?: 2 | 3, interval?: number)
    /** Emitted on successful Connection. */
    on(event: 'connect', listener: () => void): this
    /** Emitted after a disconnection. */
    on(event: 'close', listener: () => void): this
    /** Emitted when the client goes offline. */
    on(event: 'offline', listener: () => void): this
    /** Emitted every time the Robot publishes a new message to the mqtt bus. */
    on(event: 'update', listener: (data: Data) => void): this
    /** Emitted every emitIntervalTime milliseconds with the mission data. (util for mapping in models with position reporting) */
    on(event: 'mission', listener: (data: cleanMissionStatus) => void): this
    /**
     * Emitted every time the Robot publish a new message to the mqtt bus.
     * Will print the Full robot state!
     */
    on(event: 'state', listener: (data: unknown) => void): this
    /**
     * @param event
     * @private
     */
    removeAllListeners(event?: string | symbol): this

    //--------------------------------------------------------------------------------------------------------------------------------------
    end(): void

    getTime(): Promise<fullRobotState>
    getBbrun(): Promise<fullRobotState>
    getLangs(): Promise<fullRobotState>
    getSys(): Promise<fullRobotState>
    getWirelessLastStatus(): Promise<fullRobotState>
    getWeek(): Promise<fullRobotState>
    getPreferences(waitForFields?: string[]): this
    getRobotState(waitForFields?: string[]): this
    getMission(calwaitForFields?: string[]): this
    getBasicMission(waitForFields?: string[]): this
    getWirelessConfig(): Promise<fullRobotState>
    getWirelessStatus(): Promise<fullRobotState>
    getCloudConfig(): Promise<fullRobotState>
    getSKU(): Promise<fullRobotState>
    start(): Promise<{ 'ok': null }>
    clean(): Promise<{ 'ok': null }>
    cleanRoom(callback?: (args) => Promise<{ 'ok': null }>): this
    pause(): Promise<{ 'ok': null }>
    stop(): Promise<{ 'ok': null }>
    resume(): Promise<{ 'ok': null }>
    dock(): Promise<{ 'ok': null }>
    find(): Promise<{ 'ok': null }>
    evac(): Promise<{ 'ok': null }>
    train(): Promise<{ 'ok': null }>
    setWeek(callback?: (args) => Promise<{ 'ok': null }>): this
    setPreferences(callback?: (args) => Promise<{ 'ok': null }>): this
    setCarpetBoostAuto(): Promise<{ 'ok': null }>
    setCarpetBoostPerformance(): Promise<{ 'ok': null }>
    setCarpetBoostEco(): Promise<{ 'ok': null }>
    setEdgeCleanOn(): Promise<{ 'ok': null }>
    setEdgeCleanOff(): Promise<{ 'ok': null }>
    setCleaningPassesAuto(): Promise<{ 'ok': null }>
    setCleaningPassesOne(): Promise<{ 'ok': null }>
    setCleaningPassesTwo(): Promise<{ 'ok': null }>
    setAlwaysFinishOn(): Promise<{ 'ok': null }>
    setAlwaysFinishOff(): Promise<{ 'ok': null }>
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