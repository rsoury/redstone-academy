import { SmartWeave, LoggerFactory, SmartWeaveNodeFactory, PstContract, PstState } from 'redstone-smartweave'
import Arweave from 'arweave';
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

const contract: PstContract = smartweave.pst(contractTxId)
// contract.connect(wallet);

const state: PstState = await contract.currentState();

// ~~ Log contract id to the console ~~
console.log(state);
})();

// 12:16pm 11/03/2022 -- oHf7eem8xWN5wWh71c_m8PQatV9DdwBRgFNUSOH8Cd0