import fs from 'fs';
import path from 'path';
import { SmartWeave, LoggerFactory, SmartWeaveNodeFactory } from 'redstone-smartweave'
import Arweave from 'arweave';
import { PstState } from '../contracts/types/types';
import wallet from '../../.secrets/arconnect-arweave-keyfile.json';

(async () => {
// ~~ Declare variables ~~
let contractSrc: string;

let initialState: PstState;

let arweave: Arweave;
let smartweave: SmartWeave;

// ~~ Initialize Arweave ~~
arweave = Arweave.init({
  host: 'arweave.net',
  port: 443,
  protocol: 'https',
});

// ~~ Initialize `LoggerFactory` ~~
LoggerFactory.INST.logLevel('error');

// ~~ Initialize SmartWeave ~~
smartweave = SmartWeaveNodeFactory.memCached(arweave)

// ~~ Read contract source and initial state files ~~
contractSrc = fs.readFileSync(
  path.join(__dirname, '../../dist/contract.js'),
  'utf8'
);
initialState = JSON.parse(
  fs.readFileSync(
    path.join(__dirname, '../../dist/contracts/initial-state.json'),
    'utf8'
  )
);

// ~~ Deploy contract ~~
const contractTxId = await smartweave.createContract.deploy({
  wallet,
  initState: JSON.stringify(initialState),
  src: contractSrc
})

// ~~ Log contract id to the console ~~
console.log(contractTxId);
})();

// 12:16pm 11/03/2022 -- oHf7eem8xWN5wWh71c_m8PQatV9DdwBRgFNUSOH8Cd0