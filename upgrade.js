var inquirer = require('inquirer');
var fs = require('fs-extra');
var path = require('path');
var chalk = require('chalk');
var _ = require('lodash');
var ora = require('ora');
var execSync = require('child_process').execSync;
var spawn = require('cross-spawn');
var ownPkg = require('./package.json');

var spinner = ora();

var ownPath = __dirname;

function appUpgrade(projectName) {
    var root = path.resolve(projectName);
    upgradePackageProject(root);
    
}
function upgradePackageProject () {
    spinner.fail(
        '我擦，暂不支持~~'
    );

    process.exit(1);
}
module.exports = appUpgrade;
