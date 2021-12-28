import child_process from 'child_process';
import { Logger } from 'homebridge';
export function getRoombas(email: string, password: string, log: Logger): Robot[] {
  child_process.execSync('chmod -R 755 "' + __dirname + '/scripts"');
  let robots: Robot[] = [];
  try{
    robots = JSON.parse(child_process.execFileSync(
      __dirname + '/scripts/getRoombaCredentials.js',
      [email, password]).toString());
  }catch(e){
    log.error('Faild to login to iRobot\n', e);
  }
  robots.forEach(robot => {
    try{
      const robotInfo = JSON.parse(child_process.execFileSync(__dirname + '/scripts/getRoombaIP.js', [robot.blid]).toString());
      robot.ip = robotInfo.ip;
      delete robotInfo.ip;
      robot.info = robotInfo;
    }catch(e){
      log.error('Failed to fetch ip for roomba:', robot.name, '\n', e);
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
