const { spawn } = require('child_process');

const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';

const serverProcess = spawn('nodemon', ['server.js'], {
	shell: true,
	stdio: 'inherit'
});

const clientProcess = spawn(npmCommand, ['run', 'client'], {
	shell: true,
	stdio: 'inherit'
});

function shutdown(exitCode = 0) {
	serverProcess.kill();
	clientProcess.kill();
	process.exit(exitCode);
}

serverProcess.on('exit', (code) => {
	if (code && code !== 0) {
		shutdown(code);
	}
});

clientProcess.on('exit', (code) => {
	if (code && code !== 0) {
		shutdown(code);
	}
});

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));