const eventPayload = require(process.env.GITHUB_EVENT_PATH);
const device = require('../../device.json');
const user = eventPayload.sender.login;
const [roomba_model, supported] = Object.values(device);
var fs = require('fs');
var lineNumber = 36;
var data = fs.readFileSync('README.md').toString().split("\n");
data.splice(lineNumber, 0, ("| " + roomba_model + " | " + supported + " | [" + user + "](https://github.com/" + user + ") |"));
var text = data.join("\n");

fs.writeFile('README.md', text, function (err) {
  if (err) return console.log(err);
});
