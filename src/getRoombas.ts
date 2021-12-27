import child_process from 'child_process';
export function getRoombas(email: string, password: string, key?: string) {
  let robots: [{'name':string;'blid':string;'password':string;'ip':string}];
  if(key){
    robots = JSON.parse(child_process.execFileSync(
      __dirname + '/scripts/getRoombaCredentials.js',
      [email, password, key]).toString());
  }else{
    robots = JSON.parse(child_process.execFileSync(
      __dirname + '/scripts/getRoombaCredentials.js',
      [email, password]).toString());
  }
  robots.forEach(robot => {
    robot.ip = child_process.execFileSync(__dirname + '/scripts/getRoombaIP.js', [robot.blid]).toString().slice(0, -1);
  });
  return robots;
}
