import child_process from 'child_process';
import { Logger } from 'homebridge';
export function getRoombas(email: string, password: string, log: Logger): Robot[] {
  //child_process.execSync('chmod -R 755 "' + __dirname + '/scripts"');
  let robots: Robot[] = [];

  log.info('Logging into iRobot...');
  const Robots = child_process.execFileSync(__dirname + '/scripts/getRoombaCredentials.js', [email, password]).toString();
  try{
    robots = JSON.parse(Robots);
    log.debug(Robots);
  }catch(e){
    log.error('Faild to login to iRobot, see below for details');
    log.error(Robots);
  }
  robots.forEach(robot => {
    log.info('Getting IP address for roomba:', robot.name);
    const robotIP = child_process.execFileSync(__dirname + '/scripts/getRoombaIP.js', [robot.blid]).toString();
    try{
      const robotInfo = JSON.parse(robotIP);
      log.debug(robotIP);
      robot.ip = robotInfo.ip;
      delete robotInfo.ip;
      robot.model = getModel(robotInfo.sku);
      robot.multiRoom = getMultiRoom(robot.model);
      robot.info = robotInfo;
      if(robotInfo.sku.startsWith('m6')){
        robots.splice(robots.indexOf(robot));
      }
    }catch(e){
      log.error('Failed to fetch ip for roomba:', robot.name, 'see below for details');
      log.error(robotIP);
      robots.splice(robots.indexOf(robot));
    }
  });
  return robots;

}
function getModel(sku: string):string{
  switch(sku.charAt(0)){
    case 'j':
    case 'i':
    case 's':
      return sku.substring(0, 2);
    case 'R':
      return sku.substring(1, 4);
    default:
      return sku;
  }
}
function getMultiRoom(model:string){
  switch(model.charAt(0)){
    case 's':
    case 'j':
    case 'i':
      if(model.charAt(1) as unknown as number > 4){
        return true;
      } else{
        return false;
      }
    default:
      return false;
  }
}
export interface Robot {
  'name': string;
  'blid': string;
  'password': string;
  'ip': string;
  'model': string;
  'multiRoom': boolean;
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
