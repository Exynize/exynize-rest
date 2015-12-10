import Promise from 'bluebird';
import fs from 'fs';
import {exec} from 'child_process';

// promisify functions
const asyncAccess = Promise.promisify(fs.access);
const asyncExec = Promise.promisify(exec);

// copy config from template if needed
const setupConfig = async () => {
    try {
        await asyncAccess('config.js');
        console.log('[setup]: config exists!');
    } catch (err) {
        console.log('[setup]: no config, copying from example...');
        fs.createReadStream('config.js.example').pipe(fs.createWriteStream('config.js'));
    }
};
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
    console.log('[setup]: generating config and installing packages for components...');
    await* [setupConfig(), setupClientPackages(), setupVmPackages()];
};

// start setup
setup()
.catch(e => console.error('error during setup:', e));
