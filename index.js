#!/usr/bin/env node

/**
* DiscordForge - a plugin system for Discord.
* Copyright (C) 2017 DiscordForge Development
* 
* This program is free software: you can redistribute it and/or modify
* it under the terms of the GNU General Public License as published by
* the Free Software Foundation, either version 3 of the License, or
* (at your option) any later version.
* 
* This program is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
* GNU General Public License for more details.
* 
* You should have received a copy of the GNU General Public License
* along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

// add a title to make it look nice in cmd (win) and any other process manager (mac/linux)
process.title = "DiscordForge";

// parse commands
var command, argv = null;
try {
    var {command, argv} = require('command-line-commands')([null, 'help', 'inject', 'uninject', 'plugin', 'repo', 'update']);
} catch (err) {
    console.log('error: unknown command - try \'discordforge help\'');
    return;
}
// require deps
const options = require('minimist')(argv);
const readline = require('readline');
const usage = require('command-line-usage');
const ps = require('ps-node');
const asar = require('asar');
const path = require('path');
const fs = require('fs');
const os = require('os');
const {spawn} = require('child_process');
const ora = require('ora');

// constant variables
const dforgeDir = path.join(os.homedir(), '.discordforge');
const temp = path.join(dforgeDir, '_temp');
const toSplice1 = 'mainWindow.webContents.on(\'dom-ready\', function () {});';
const splice1 = 'mainWindow.webContents.on(\'dom-ready\', function () {mainWindow.webContents.executeJavaScript(\'require(require(\\\'path\\\').join(\\\'../../app.asar\\\', \\\'discordforge\\\'))();\');});'; 
const gSpin = ora({
	color: 'cyan',
	stream: process.stdout,
	spinner: {
		"interval": 80,
		"frames": [
			"[    ]",
			"[   =]",
			"[  ==]",
			"[ ===]",
			"[====]",
			"[=== ]",
			"[==  ]",
			"[=   ]"
		]
	}
});

// recursive deletion for directory.
const rmdir = function(dir, cb) {
	var list = fs.readdirSync(dir);
	for(var i = 0; i < list.length; i++) {
		var filename = path.join(dir, list[i]);
		var stat = fs.statSync(filename);
		
		if(filename == "." || filename == "..") {
			// pass these files
		} else if(stat.isDirectory()) {
			// rmdir recursively
			rmdir(filename, () => {});
		} else {
			// rm fiilename
			fs.unlinkSync(filename);
		}
	}
	fs.rmdirSync(dir);
	cb();
};

// help page
const help = [
    {
        header: 'DiscordForge',
        content: 'A toolkit that allows you to create and install your own plugins into the Discord client.'
    },
    {
        header: 'Synopsis',
        content: [
            '$ discordforge [[bold]{command}] [...]'
        ]
    },
    {
        header: 'Commands',
        content: [
            {
                name: 'help',
                summary: 'Display help information about DiscordForge.'
            },
            {
                name: 'inject',
                summary: 'Injects DiscordForge into the running Discord process\'s app.asar.'
            },
            {
                name: 'uninject',
                summary: 'Reverses the operation of inject.'
            },
            {
                name: 'plugin [[bold]{command}] ...',
                summary: 'Plugin management.'
            },
            {
                name: 'repo [[bold]{command}] ...',
                summary: 'Repository management.'
            },
            {
                name: 'update',
                summary: 'Updates DiscordForge.'
            },
        ]
    },
    {
        header: 'Plugin Management',
        content: [
            {
                name: 'These commands allow you to manage plugins.\n'
            },
            {
                name: 'plugin install [[bold]{name}]',
                summary: 'Installs a plugin.'
            },
            {
                name: 'plugin uninstall [[bold]{name}]',
                summary: 'Uninstalls a plugin.'
            },
            {
                name: 'plugin list',
                summary: 'Lists all installed plugins.'
            }
        ]
    },
    {
        header: 'Repository Management',
        content: [
            {
                name: 'These commands allow you to manage repositories.\n'
            },
            {
                name: 'repo add [[bold]{name}]',
                summary: 'Adds a repository to search plugins for.'
            },
            {
                name: 'repo remove [[bold]{name}]',
                summary: 'Removes a repository.'
            },
            {
                name: 'repo list',
                summary: 'Lists all repositories.'
            }
        ]
    }
];
var _ = options._;

// no args specified or command "help"
if (command == null || command == 'help') {
    console.log(usage(help));
} else if (command == 'inject') {
    // find discord application path
    var discordPath = null;
	var discordBin = null;
	var discordPids;
    ps.lookup({}, (err, res) => {
        if (err) throw err;
        else {
            var raw = res.filter(proc => proc.command.includes('Discord'));
            var procs = {};
            raw.forEach(proc => {
                if (!procs[proc.command])
                    procs[proc.command] = {command: proc.command, pid: []};

                procs[proc.command].pid.push(proc.pid);
            });

            if (Object.keys(procs).length == 0) {
                console.log('No processes were found.');
                return;
            } else if (Object.keys(procs).length == 1) {
				let proc = procs[Object.keys(procs)[0]];
                discordPath = proc.command.substr(0, proc.command.lastIndexOf('\\'));
				discordBin = proc.command;
				discordPids = proc.pid;
            } else {
                let k = Object.keys(procs);
                for (let i = 0; i < k.length; i++) {
                    console.log(`${i}: ${k[i]} [${procs[k[i]].pid.join(', ')}]`);
                }
                console.log('Please select your process from above.');
				var rl = readline.createInterface({
					input: process.stdin,
					output: process.stdout
				});
				rl.question('> ', answer => {
					if (typeof parseInt(answer) === 'number') {
						let proc = procs[Object.keys(procs)[answer]];
						discordPath = proc.command.substr(0, proc.command.lastIndexOf('\\'));
						discordBin = proc.command;
						discordPids = proc.pid;
					} else {
						console.log('You didn\'t input a number. Re-run the command and try again.');
					}
					rl.close();
				});
            }
        }
		var spinner = gSpin;
		console.log(`Process found. Using path '${discordPath}'`);
		spinner.start('Extracting...');
		fs.mkdirSync(temp);
		asar.extractAll(path.join(discordPath, 'resources', 'app.asar'), temp);
		if (fs.existsSync(path.join(temp, 'index.js.bak')) != false) {
			spinner.fail('DiscordForge is already injected.');
			rmdir(temp, () => {});
		} else {
			spinner.text = "Splicing...";
			fs.readFile(path.join(temp, 'index.js'), 'utf8', (e, d) => {
				if (e) throw e;
				var inject = d.replace(toSplice1, splice1);
				fs.writeFileSync(path.join(temp, 'index.js.bak'), fs.readFileSync(path.join(temp, 'index.js')));
				fs.writeFile(path.join(temp, 'index.js'), inject, (e1) => {
					if (e1) throw e1;
					fs.writeFileSync(path.join(temp, 'discordforge.js'), fs.readFileSync(path.join(__dirname, 'bootstrap.js')));
					spinner.text = 'Archiving...';
					discordPids.forEach(o => {
						try {
							process.kill(o);
						} catch (e) {
								// ESRCH => killed the main process first, meaning the other processes died. doesn't matter.
						}
					});
					asar.createPackage(temp, path.join(discordPath, 'resources', 'app.asar'), () => {
						spinner.text = 'Cleaning up...';
						rmdir(temp, () => {
							spinner.text = 'Starting Discord...';
							spawn(discordBin, {
								detached: true
							}).unref();
							spinner.succeed('Injected.');
							process.exit(0);
						});
					});
				});
			});
		}
    });
} else if (command == 'uninject') {
    // find discord application path
    var discordPath = null;
	var discordBin = null;
	var discordPids;
    ps.lookup({}, (err, res) => {
        if (err) throw err;
        else {
            var raw = res.filter(proc => proc.command.includes('Discord'));
            var procs = {};
            raw.forEach(proc => {
                if (!procs[proc.command])
                    procs[proc.command] = {command: proc.command, pid: []};

                procs[proc.command].pid.push(proc.pid);
            });

            if (Object.keys(procs).length == 0) {
                console.log('No processes were found.');
                return;
            } else if (Object.keys(procs).length == 1) {
				let proc = procs[Object.keys(procs)[0]];
                discordPath = proc.command.substr(0, proc.command.lastIndexOf('\\'));
				discordBin = proc.command;
				discordPids = proc.pid;
            } else {
                let k = Object.keys(procs);
                for (let i = 0; i < keys.length; i++) {
                    console.log(`${i}: ${k[i]} [${procs[k[i]].pid.join(', ')}]`);
                }
                console.log('Please select your process from above.');
				var rl = readline.createInterface({
					input: process.stdin,
					output: process.stdout
				});
				rl.question('> ', answer => {
					if (typeof parseInt(answer) === 'number') {
						let proc = procs[Object.keys(procs)[answer]];
						discordPath = proc.command.substr(0, proc.command.lastIndexOf('\\'));
						discordBin = proc.command;
						discordPids = proc.pid;
					} else {
						console.log('You didn\'t input a number. Re-run the command and try again.');
					}
					rl.close();
				});
            }
        }
		var spinner = gSpin;
		console.log(`Process found. Using path '${discordPath}'`);
		spinner.start('Extracting...');
		fs.mkdirSync(temp);
		asar.extractAll(path.join(discordPath, 'resources', 'app.asar'), temp);
		if (fs.existsSync(path.join(temp, 'index.js.bak')) == false) {
			spinner.fail('Not injected or corrupt. If you injected DiscordForge and you are getting this message, reinstall Discord.');
			rmdir(temp, () => {});
		} else {
			spinner.text = 'Removing modification...';
			fs.writeFile(path.join(temp, 'index.js'), fs.readFileSync(path.join(temp, 'index.js.bak')), (e) => {
				if (e) throw e;
				fs.unlinkSync(path.join(temp, 'index.js.bak'));
				fs.unlinkSync(path.join(temp, 'discordforge.js'));
				spinner.text = 'Archiving...';
				discordPids.forEach(o => {
					try {
						process.kill(o);
					} catch (e) {
							// ESRCH => killed the main process first, meaning the other processes died. doesn't matter.
					}
				});
				asar.createPackage(temp, path.join(discordPath, 'resources', 'app.asar'), () => {
					spinner.text = 'Cleaning up...';
					rmdir(temp, () => {
						spinner.text = 'Starting Discord...';
						spawn(discordBin, {
							detached: true
						}).unref();
						spinner.succeed('Uninjected.');
						process.exit(0);
					});
				});
			});
		}
	});
}