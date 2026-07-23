const { spawn } = require('child_process');
const path = require('path');

const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';

const frontendProcess = spawn(npmCommand, ['run', 'dev'], {
	cwd: path.join(__dirname, 'vball-app'),
	stdio: 'inherit',
	shell: true
});

const backendProcess = spawn(
	process.platform === 'win32' ? 'nodemon.cmd' : 'nodemon',
	['server.js'],
	{
		cwd: path.join(__dirname, 'backend'),
		stdio: 'inherit',
		shell: true
	}
);

function shutdown(exitCode = 0) {
	frontendProcess.kill();
	backendProcess.kill();

	process.exit(exitCode);
}

frontendProcess.on('exit', (code) => {
	if (code && code !== 0) {
		shutdown(code);
	}
});

backendProcess.on('exit', (code) => {
	if (code && code !== 0) {
		shutdown(code);
	}
});

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));