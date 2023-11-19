import { Address, Chain } from 'viem';
import { goerli, optimismGoerli } from 'viem/chains';

export interface OpStackConfig {
  l1: Chain;
  l2: Chain;
  contractAddresses: { optimismPortal: Address };
}
export const OP_STACK_CHAINS: OpStackConfig[] = [
  // Optimism Goerli https://community.optimism.io/docs/useful-tools/networks/#op-goerli
  {
    l1: goerli,
    l2: optimismGoerli,
    contractAddresses: {
      optimismPortal: '0x5b47E1A08Ea6d985D6649300584e6722Ec4B1383',
    },
  },
];
