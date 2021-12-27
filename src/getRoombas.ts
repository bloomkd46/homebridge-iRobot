import child_process from 'child_process';
import { Logger } from 'homebridge';
export function getRoombas(email: string, password: string, key: string | boolean, log: Logger): Robot[] {
  child_process.execSync('chmod -R 755 "' + __dirname + '/scripts"');
  let robots: Robot[] = [];
  try{
    if (key !== false) {
      robots = JSON.parse(child_process.execFileSync(
        __dirname + '/scripts/getRoombaCredentials.js',
        [email, password, key as string]).toString());
    }else {
      robots = JSON.parse(child_process.execFileSync(
        __dirname + '/scripts/getRoombaCredentials.js',
        [email, password]).toString());
    }
  }catch{
    log.error('Faild to login to iRobot');
  }
  robots.forEach(robot => {
    try{
      const robotInfo = JSON.parse(child_process.execFileSync(__dirname + '/scripts/getRoombaIP.js', [robot.blid]).toString());
      robot.ip = robotInfo.ip;
      delete robotInfo.ip;
      robot.info = robotInfo;
    }catch{
      log.error('Failed to fetch ip for roomba', robot.name);
    }
  });
  return robots;

}
export interface Robot {
  'name': string;
  'blid': string;
  'password': string;
  'ip': string;
  'info': {
    'ver': string;
    'hostname': string;
    'robotname': string;
    'robotid'?: string;
    'mac': string;
    'sw': string;
    'sku': string;
    'nc': number;
    'proto': string;
    'cap': unknown;
  };
}
