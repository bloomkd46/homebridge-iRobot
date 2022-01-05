const core = require('@actions/core');
const issue = core.getMultiLineInput('issue', {"required": true});
const model = issue.split('\n')[3];
const supported = issue.split('\n')[7];
if (supported === "Yes" || supported === "No") {
    const tableRow = "| " + model + " | " + supported + " |";
    const readme = fs.readFileSync('Readme.md').split('\n');
    readme.splice(36, 0, tableRow);
}