import fs from 'fs';
import path from 'path';
import { JWKInterface } from 'arweave/node/lib/wallet';
import ArLocal from 'arlocal';
import Arweave from 'arweave';
import {
  PstContract,
  PstState,
  SmartWeave,
  SmartWeaveNodeFactory,
  LoggerFactory,
  InteractionResult,
} from 'redstone-smartweave';
import { addFunds, mineBlock } from '../utils/_helpers';

describe('Testing the Profit Sharing Token', () => {
  // ~~ Declare all variables ~~
  let contractSrc: string;
  let wallet: JWKInterface;
  let walletAddress: string;
  let initialState: PstState;
  let arweave: Arweave;
  let smartweave: SmartWeave;
  let pst: PstContract;
  let arlocal: ArLocal;
  
  beforeAll(async () => {
    // ~~ Set up ArLocal and instantiate Arweave ~~
    arlocal = new ArLocal(1984);
    await arlocal.start();

    arweave = Arweave.init({
      host: 'localhost',
      port: 1984,
      protocol: 'http',
    });

    // ~~ Initialize 'LoggerFactory' ~~
    LoggerFactory.INST.logLevel('error');

    // ~~ Set up SmartWeave ~~
    smartweave = SmartWeaveNodeFactory.memCached(arweave);

    // ~~ Generate wallet and add funds ~~
    wallet = await arweave.wallets.generate();
    walletAddress = await arweave.wallets.jwkToAddress(wallet);
    await addFunds(arweave, wallet);

    // ~~ Read contract source and initial state files ~~
    contractSrc = fs.readFileSync(
      path.join(__dirname, '../dist/contract.js'),
      'utf8'
    );
    const stateFromFile: PstState = JSON.parse(
      fs.readFileSync(
        path.join(__dirname, '../dist/contracts/initial-state.json'),
        'utf8'
      )
    );

    // ~~ Update initial state ~~
    initialState = { // Update the initiate state owner with the newly created wallet address on our arlocal env
      ...stateFromFile,
      ...{
        owner: walletAddress,
      },
    };

    // ~~ Deploy contract ~~
    // contractTxId is the txId of the initial state tx -- which is the one considered as the contract.
    const contractTxId = await smartweave.createContract.deploy({
      wallet,
      initState: JSON.stringify(initialState),
      src: contractSrc,
    });

    // ~~ Connect to the pst contract ~~
    pst = smartweave.pst(contractTxId)
    pst.connect(wallet);

    // ~~ Mine block ~~
    await mineBlock(arweave)
  });

  afterAll(async () => {
    // ~~ Stop ArLocal ~~
    await arlocal.stop();
  });

  it('should read pst state and balance data', async () => {
    expect(await pst.currentState()).toEqual(initialState);
    expect(
      (await pst.currentBalance('ksFTLgrwQGtNrhRz6MWyd3a4lvK1Oh-QF1HYcEeeFVk'))
        .balance
    ).toEqual(1900);
    expect(
      (await pst.currentBalance('SGYcSssM3mC6qQeKf-cfpniinbTwzI1StYJ5OVwDEs4'))
        .balance
    ).toEqual(100);
  });

  it('should properly mint tokens', async () => {
    await pst.writeInteraction({
      function: 'mint',
      qty: 2000,
    });
    
    await mineBlock(arweave); // manually triggering the block mining.
    expect((await pst.currentState()).balances[walletAddress]).toEqual(2000);
    expect((await pst.currentBalance(walletAddress)).balance).toEqual(2000);
  });

  it('should properly transfer tokens', async () => {
    await pst.transfer({
      target: 'GH2IY_3vtE2c0KfQve9_BHoIPjZCS8s5YmSFS_fppKI', // The tutorial redstone.academy expects this wallet to be inside of the initial-state... but here we're adding a new wallet. 
      qty: 555,
    });

    await mineBlock(arweave);

    expect((await pst.currentState()).balances[walletAddress]).toEqual(
      2000 - 555
    );
    expect(
      (await pst.currentState()).balances[
        'GH2IY_3vtE2c0KfQve9_BHoIPjZCS8s5YmSFS_fppKI'
      ]
    ).toEqual(555);
  });

  it('should properly perform dry write with overwritten caller', async () => {
    const newWallet = await arweave.wallets.generate();
    const overwrittenCaller = await arweave.wallets.jwkToAddress(newWallet);
    await pst.transfer({
      target: overwrittenCaller,
      qty: 1000,
    });

    await mineBlock(arweave);

    // Here we're dry writing a transaction to tnrasfer from the overwrittenCaller wallet to the GH2.... wallet.
    const result: InteractionResult<PstState, unknown> = await pst.dryWrite(
      {
        function: 'transfer',
        target: 'GH2IY_3vtE2c0KfQve9_BHoIPjZCS8s5YmSFS_fppKI',
        qty: 333,
      },
      overwrittenCaller
    );

    expect(result.state.balances[walletAddress]).toEqual(
      2000 - 555 - 1000
    );
    expect(
      result.state.balances['GH2IY_3vtE2c0KfQve9_BHoIPjZCS8s5YmSFS_fppKI']
    ).toEqual(555 + 333);
    expect(result.state.balances[overwrittenCaller]).toEqual(1000 - 333);
  });
});
