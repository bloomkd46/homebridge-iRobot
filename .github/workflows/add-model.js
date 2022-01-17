/*
const fs = require('fs');
const eventPayload = require(process.env.GITHUB_EVENT_PATH);
const order = require('./order.json');

const user = eventPayload.sender.login;
const [flavour, size, toppings, count] = Object.values(order);

const amount = parseInt(count.slice(0,3), 10) || 1;

const content = `1. [@${user}](https://github.com/${user}) orders ${amount} ${size} ${flavour} pizza with ${toppings}\n`;

fs.appendFileSync('README.md', content);
*/
const eventPayload = require('../../'+process.env.GITHUB_EVENT_PATH);
const device = require('./device.json');
const [roomba_model, supported] = Object.values(device);
var fs = require('fs');
var lineNumber = 36;
var data = fs.readFileSync('README.md').toString().split("\n");
data.splice(lineNumber, 0, ("| " + roomba_model + " | " + supported + " | " + user + " |"));
var text = data.join("\n");

fs.writeFile('README.md', text, function (err) {
  if (err) return console.log(err);
});
