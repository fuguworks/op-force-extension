import { Address, Chain } from 'viem';
import {
  base,
  baseGoerli,
  baseSepolia,
  goerli,
  mainnet,
  optimism,
  optimismGoerli,
  sepolia,
  zora,
  zoraTestnet,
} from 'viem/chains';

// TODO: replace this file with op-viem/chains when it's
// more complete

export interface OpStackConfig {
  l1: Chain;
  l2: Chain;
  contractAddresses: { optimismPortal: Address };
}
export const OP_STACK_CHAINS: OpStackConfig[] = [
  // Optimism https://community.optimism.io/docs/useful-tools/networks/#op-goerli
  {
    l1: mainnet,
    l2: optimism,
    contractAddresses: {
      optimismPortal: '0xbEb5Fc579115071764c7423A4f12eDde41f106Ed',
    },
  },
  {
    l1: goerli,
    l2: optimismGoerli,
    contractAddresses: {
      optimismPortal: '0x5b47E1A08Ea6d985D6649300584e6722Ec4B1383',
    },
  },
  // Base https://docs.base.org/base-contracts/#ethereum-mainnet
  {
    l1: mainnet,
    l2: base,
    contractAddresses: {
      optimismPortal: '0x49048044D57e1C92A77f79988d21Fa8fAF74E97e',
    },
  },
  {
    l1: goerli,
    l2: baseGoerli,
    contractAddresses: {
      optimismPortal: '0xe93c8cD0D409341205A592f8c4Ac1A5fe5585cfA',
    },
  },
  {
    l1: sepolia,
    l2: baseSepolia,
    contractAddresses: {
      optimismPortal: '0x49f53e41452C74589E85cA1677426Ba426459e85',
    },
  },
  // Zora https://docs.zora.co/docs/zora-network/network#contract-addresses
  {
    l1: mainnet,
    l2: zora,
    contractAddresses: {
      optimismPortal: '0x1a0ad011913A150f69f6A19DF447A0CfD9551054',
    },
  },
  {
    l1: goerli,
    l2: zoraTestnet,
    contractAddresses: {
      optimismPortal: '0xDb9F51790365e7dc196e7D072728df39Be958ACe',
    },
  },
];
