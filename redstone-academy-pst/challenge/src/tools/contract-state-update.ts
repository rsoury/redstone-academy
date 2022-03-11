import fs from 'fs';
import path from 'path';
import { SmartWeave, LoggerFactory, SmartWeaveNodeFactory } from 'redstone-smartweave'
import Arweave from 'arweave';
import { PstState } from '../contracts/types/types';
import wallet from '../../.secrets/arconnect-arweave-keyfile.json';

(async () => {
// ~~ Declare variables ~~
const contractTxId = 'oHf7eem8xWN5wWh71c_m8PQatV9DdwBRgFNUSOH8Cd0';

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

const contract = smartweave.pst(contractTxId)
contract.connect(wallet);

const txId = await contract.transfer({
  target: 'GH2IY_3vtE2c0KfQve9_BHoIPjZCS8s5YmSFS_fppKI', // some random wallet
  qty: 100,
});

// ~~ Log contract id to the console ~~
console.log(txId);
})();

// k7h1vVdLvv65H_4SrlZe9N99rVq8WDbuUdB056kGjIc -- 0.99838901AR -> 0.99838901AR