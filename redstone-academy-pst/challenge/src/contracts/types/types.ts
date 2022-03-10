// ~~ Write types for your contract ~~

export interface PstState {
  ticker: string;
  name: string;
  owner: string;
  balances: {
    [address: string]: number,
  };
}

// Action is passed in with state to the handler function
export interface PstAction {
  input: PstInput;
  caller: string;
}

export interface PstInput {
  function: PstFunction; // fn name
  target: string; // target wallet
  qty: number; // quatity
}

// the result returned where no state is returned.
export interface PstResult {
  target: string;
  ticker: string;
  balance: number;
}
/**
 * Handle function should end by:
returning { state: newState } - when contract state is changing after specific interaction.
returning { result: someResult } - when contract state is not changing after interaction.
throwing ContractError exception.
 */

export type PstFunction = 'transfer' | 'mint' | 'balance';
