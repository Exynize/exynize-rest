import Promise from 'bluebird';
import {exec} from 'child_process';

// promisify functions
const asyncExec = Promise.promisify(exec);

// installs node modules for client components
const setupClientPackages = async () => {
    await asyncExec('cd src/client/ && npm install');
    console.log('[setup]: client modules installed!');
};
// installs node modules for VM components
const setupVmPackages = async () => {
    await asyncExec('cd src/vm/ && npm install');
    console.log('[setup]: vm modules installed!');
};

// execute all setup steps
const setup = async () => {
    console.log('[setup]: installing packages for components...');
    await* [setupClientPackages(), setupVmPackages()];
};

// start setup
setup()
.catch(e => {
    console.error('error during setup:', e);
    process.exit(1);
});
