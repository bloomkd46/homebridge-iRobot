#!/usr/bin/env node

'use strict';

const dgram = require('dgram');

if(!process.argv[2]){
    console.log('Error: No blid supplied');
    process.exit(1);
}

const blid = process.argv[2];
const attempt = proccess.argv[3] || 1

if(attempt>5){
console.log('No Roomba Found With Blid:', blid);
    proccess.exit(0);
}
getRobotIP();

function getRobotIP () {
    const server = dgram.createSocket('udp4');

  server.on('error', (err) => {
    console.error(err);
  });

  server.on('message', (msg) => {
    try {
      let parsedMsg = JSON.parse(msg);
      if (parsedMsg.hostname && parsedMsg.ip && ((parsedMsg.hostname.split('-')[0] === 'Roomba') || (parsedMsg.hostname.split('-')[0] === 'iRobot'))) {
        if(parsedMsg.hostname.split('-')[1] === blid){
            server.close();
            console.log(JSON.stringify(parsedMsg));
            process.exit(0);
        }
      }
    } catch (e) {}
  });

  server.on('listening', () => {
    setTimeout(()=>{
      console.log(child_process.execFileSync(__dirname + '/getRoombaIP.js', [blid, attempt+1]).toString());
      process.exit(0);
    }, 5000);
  });

  server.bind(function () {
    const message = new Buffer.from('irobotmcs');
    server.setBroadcast(true);
    server.send(message, 0, message.length, 5678, '255.255.255.255');
  });
}
