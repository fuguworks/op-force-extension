import { Address, Hex } from 'viem';

export type MetamaskTransactionRequest = {
  id: string;
  tx: { data: Hex; from: Address; gas: Hex; to: Address; value: Hex };
};
