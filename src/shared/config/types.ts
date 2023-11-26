import { Address, Hex } from 'viem';

export type MetamaskTransactionRequest = { data: Hex; from: Address; gas: Hex; to: Address; value: Hex };
