import fs from 'fs';
import path from 'path';
import { PstContract, SmartWeave, LoggerFactory, SmartWeaveNodeFactory } from 'redstone-smartweave'
import Arweave from 'arweave';
import { JWKInterface } from 'arweave/node/lib/wallet';
import { PstState } from '../contracts/types/types';
import { addFunds } from '../../utils/_helpers';

(async () => {
  // ~~ Declare variables ~~
  let contractSrc: string;

  let wallet: JWKInterface;
  let walletAddress: string;

  let initialState: PstState;

  let arweave: Arweave;
  let smartweave: SmartWeave;
  let pst: PstContract;

  // ~~ Initialize Arweave ~~
  arweave = Arweave.init({
    host: 'testnet.redstone.tools',
    port: 443,
    protocol: 'https',
  });

  // ~~ Initialize `LoggerFactory` ~~
  LoggerFactory.INST.logLevel('error');

  // ~~ Initialize SmartWeave ~~
  smartweave = SmartWeaveNodeFactory.memCached(arweave)

  // ~~ Generate wallet and add some funds ~~
  wallet = await arweave.wallets.generate()
  walletAddress = await arweave.wallets.jwkToAddress(wallet)
  await addFunds(arweave, wallet);

  // ~~ Read contract source and initial state files ~~
  contractSrc = fs.readFileSync(
    path.join(__dirname, '../../dist/contract.js'),
    'utf8'
  );
  const stateFromFile: PstState = JSON.parse(
    fs.readFileSync(
      path.join(__dirname, '../../dist/contracts/initial-state.json'),
      'utf8'
    )
  );

  // ~~ Override contract's owner address with the generated wallet address ~~
  initialState = {
    ...stateFromFile,
    ...{
      owner: walletAddress,
    },
  };

  // ~~ Deploy contract ~~
  const contractTxId = await smartweave.createContract.deploy({
    wallet,
    initState: JSON.stringify(initialState),
    src: contractSrc
  })

  // ~~ Log contract id to the console ~~
  console.log(contractTxId);
})();
