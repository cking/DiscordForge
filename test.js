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

const assert = require('assert');
const fs = require('fs');
const {fork} = require('child_process');
const os = require('os');
const path = require('path');
const dforgeDir = path.join(os.homedir(), '.discordforge');
const checksum = require('checksum');
describe('Files', () => {
	it('should have bootstrap.js', () => {
		if (fs.existsSync('bootstrap.js') === false)
			throw new Error('File missing.');
	});
	it('should have index.js', () => {
		if (fs.existsSync('index.js') === false)
			throw new Error('File missing.');
	});
	it('should have modloader.js', () => {
		if (fs.existsSync('modloader.js') === false)
			throw new Error('File missing.');
	});
	it('should have setup.js', () => {
		if (fs.existsSync('setup.js') === false)
			throw new Error('File missing.');
	});
	it('should have LICENSE', () => {
		if (fs.existsSync('LICENSE') === false)
			throw new Error('File missing.');
	});
});
describe('Setup', () => {
	it('should exit with code 0', () => {
		let setup = fork('setup.js');
		setup.on('close', (code) => {
			if (code !== 0)
				throw new Error(`Setup exited with code ${code}`);
		});
	});
	it('should have made a directory in the home directory', () => {
		if (fs.existsSync(dforgeDir) === false)
			throw new Error('Directory missing.');
	});
	it('should have made a plugins directory', () => {
		if (fs.existsSync(path.join(dforgeDir, 'plugins')) === false)
			throw new Error('Directory missing.');
	});
	it('should have made a modloader directory', () => {
		if (fs.existsSync(path.join(dforgeDir, 'modloader')) === false)
			throw new Error('Directory missing.');
	});
	it('should have made a modloader.js', () => {
		if (fs.existsSync(path.join(dforgeDir, 'modloader', 'modloader.js')) === false)
			throw new Error('File missing.');
	});
	it('should have made an exact copy of the modloader', () => {
		let sumCurrent, sumCopy;
		checksum.file(path.join(dforgeDir, 'modloader', 'modloader.js'), (err, sum) => {
			sumCopy = sum;
		});
		checksum.file('modloader.js', (err, sum) => {
			sumCurrent = sum;
		});
		assert.equal(sumCurrent, sumCopy);
	});
});