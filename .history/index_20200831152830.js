#!/usr/bin/env node

var chalk = require('chalk');
var ora = require('ora');
var semver = require('semver');
var validatePkgName = require('validate-npm-package-name');

var spinner = ora();

var currentNodeVersion = process.versions.node;

if (semver.lt(currentNodeVersion, '12.6.3')) {
    spinner.fail(
        '你当前node版本为 ' +
            chalk.red(currentNodeVersion) +
            '。\n' +
            '  该项目要求node版本必须 ' +
            chalk.cyan('>= 12.6.3') +
            ' 。\n' +
            '  请升级你的node！'
    );

    process.exit(1);
}

var commander = require('commander');
var inquirer = require('inquirer');
var fs = require('fs-extra');
var path = require('path');
var execSync = require('child_process').execSync;
var spawn = require('cross-spawn');
var appUpgrade = require('./upgrade');
var ownPkg = require('./package.json');

var ownPath = __dirname; // 本执行文件的绝对路径
var oldPath = process.cwd();
var projectName;
var projectCustom = {};

var program = commander
    .version(require('./package.json').version)
    .arguments('<project-directory>')
    .usage(chalk.green('<project-directory>') + ' [options]')
    .option('-u, --upgrade', '升级项目到rcu-cli最新构建版本')
    .action(function(name) {
        projectName = name;
    })
    .parse(process.argv);

if (typeof projectName === 'undefined') {
    spinner.fail('请指定要' + (program.upgrade ? '升级' : '创建') + '的项目目录名:');
    console.log('  ' + chalk.cyan(program.name()) + chalk.green(' <项目目录>'));
    console.log();
    console.log('例如:');
    console.log('  ' + chalk.cyan(program.name()) + chalk.green(' my-vue-project'));
    console.log();
    process.exit(1);
}

if (program.upgrade) {
    appUpgrade(projectName);
} else if (!isSafeToCreateProjectIn(path.resolve(projectName))) {
    spinner.fail('该文件夹（' + chalk.green(projectName) + '）已经存在，且存在导致冲突的文件.');
    console.log('  请使用一个新的文件夹名，或者使用升级命令将项目构建方式升级到最新版本：');
    console.log();
    console.log('   ' + chalk.cyan(program.name()) + ' ' + chalk.green(projectName) + chalk.cyan(' --upgrade'));
    console.log();
    process.exit(1);
} else {
    inquirer
        .prompt([
            {
                name: 'type',
                type: 'list',
                choices: [
                    { name: '若依前端(package)', value: 'ruoyi-ui' },
                    { name: 'pigx前端(package)', value: 'pigx-ui' },
                    { name: 'pc端H5页面', value:'h5-pc'},
                    { name: '移动端H5', value:'h5-mobile'},
                    { name: '小程序', value:'mp'},
                    { name: '微信公众号', value:'weChat'}
                ],
                message: '请选择基础项目？',
                default: 'ruoyi-ui'
                
            },
            {
                name: 'version',
                type: 'input',
                message: '请输入项目版本号(version):',
                default: '1.0.0',
                validate: function(input) {
                    return semver.valid(input) ? true : chalk.cyan(input) + ' 不是一个有效的版本号';
                }
            },
            {
                name: 'name',
                type: 'input',
                message: '请输入项目名称(name):',
                default: path.basename(path.resolve(projectName)),
                validate: function(input) {
                    const result = validatePkgName(input);

                    if (result.validForNewPackages) {
                        return true;
                    } else {
                        return (
                            chalk.cyan(input) +
                            ' 不是一个有效的package名称：\n' +
                            chalk.red((result.errors || result.warnings).map(text => '* ' + text).join('\n'))
                        );
                    }
                }
            },
            {
                name: 'description',
                type: 'input',
                message: '请输入项目描述(description):'
            },
            {
                name: 'author',
                type: 'input',
                message: '请输入项目所属者（组织）的名字或邮箱:',
                validate: function(input) {
                    return !!input || '该字段不能为空';
                }
            }
        ])
        .then(function(answers) {
            console.log(answers)
            Object.assign(projectCustom, answers);
            console.log(projectCustom.type)
            if(projectCustom.type === 'ruoyi-ui') {
                createLibrary(projectName);
            } else if(projectCustom.type === 'pigx-ui') {
                createLibrary(projectName);
            } else {
                spinner.fail(
                    '完善中~'
                );
            }
            
        });
}

function createLibrary(name) {
    var root = path.resolve(name);
    var appName = projectCustom.name;

    fs.ensureDirSync(name);

    console.log();
    console.log('即将在 ' + chalk.green(root) + ' 下创建新的开发项目');
    console.log();

    process.chdir(root);
    console.log('即将安装package依赖，这将花费几分钟时间...');
    console.log();
    run(root, appName, function() {
        console.log();
        spinner.succeed('项目 ' + chalk.green(appName) + ' 已创建成功，路径：' + chalk.green(root));
        console.log();
        console.log('在该项目，你可以运行以下几个命令：');
        console.log();
        console.log(chalk.cyan('  npm run build:lint'));
        console.log('    进行lint检查');
        console.log();
        console.log(chalk.cyan('  npm run build:prod'));
        console.log('    生成发布包');
        console.log();
        console.log('运行下面的命令切换到项目目录开始工作:');
        console.log(chalk.green('  cd ' + path.relative(oldPath, root)));
    });
}

// 检查是否安装cnpm 
function shouldUseCnpm() {
    try {
        // 创建同步任务
        execSync('cnpm --version', {
            stdio: 'ignore'
        });
        return true;
    } catch (e) {
        return false;
    }
}

function install(packageToInstall, saveDev, callback) {
    var command;
    var args;

    if (shouldUseCnpm()) {
        command = 'cnpm';
    } else {
        command = 'npm';
    }

    args = ['install', saveDev ? '--save-dev' : '--save', '--save-exact'].concat(packageToInstall);

    var child = spawn(command, args, {
        stdio: 'inherit'
    });

    child.on('close', function(code) {
        callback(code, command, args);
    });

    process.on('exit', function() {
        child.kill();
    });
}

function getGitRepoUrl() {
    let result = execSync('git ls-remote --get-url')
        .toString()
        .trim();

    if (/^(git|http)/.test(result)) {
        return result;
    }
}

function run(appPath, appName, onSuccess) {
    var templatePath = path.join(ownPath, 'template', projectCustom.type);

    if (fs.existsSync(templatePath)) {
        fs.copySync(templatePath, appPath);
    } else {
        throw new Error(chalk.cyan(templatePath) + ' 模板不存在了~0.0');
    }

    var templateDependenciesPath = path.join(appPath, 'package.json');
    var appPackage = require(path.join(appPath, 'package.json'));
    var pkgTemp = {} // 预留

    Object.assign(appPackage, pkgTemp);

    if (fs.existsSync(path.join(appPath, '.git'))) {
        var repoUrl = getGitRepoUrl();

        if (repoUrl) {
            appPackage.repository = {
                type: 'git',
                url: repoUrl
            };
        }
    }
    appPackage.name = projectCustom.name || appPackage.name
    appPackage.version = projectCustom.version || appPackage.version
    appPackage.description = projectCustom.description || appPackage.description
    appPackage.author = projectCustom.author || appPackage.author
    console.log(appPackage)

    fs.writeFileSync(path.join(appPath, 'package.json'), JSON.stringify(appPackage, null, 2));

    if (fs.existsSync(templateDependenciesPath)) {
        var templateDependencies = require(templateDependenciesPath).devDependencies;

        install(
            Object.keys(templateDependencies).map(function(key) {
                return key + '@' + templateDependencies[key];
            }),
            true,
            function(code, command, args) {
                if (code !== 0) {
                    console.error('`' + command + ' ' + args.join(' ') + '` 运行失败');

                    return;
                }

                var templateDependencies = require(templateDependenciesPath).dependencies;

                if (templateDependencies) {
                    install(
                        Object.keys(templateDependencies).map(function(key) {
                            return key + '@' + templateDependencies[key].replace(/^[\^~]/, '');
                        }),
                        false,
                        function(code, command, args) {
                            if (code !== 0) {
                                console.error('`' + command + ' ' + args.join(' ') + '` 运行失败');

                                return;
                            }

                            onSuccess();
                        }
                    );
                } else {
                    onSuccess();
                }
            }
        );
    }
}

// 判断项目是否已经存在
function isSafeToCreateProjectIn(root) {
    var validFiles = ['.DS_Store', 'Thumbs.db', '.git', '.gitignore', '.idea', 'README.md', 'LICENSE'];

    return (
        !fs.existsSync(root) ||
        fs.readdirSync(root).every(function(file) {
            return validFiles.indexOf(file) >= 0;
        })
    );
}
