import { encodeFunctionData } from 'viem';

import { OptimismPortalAbi } from '@root/src/abis/OptimismPortal';
import { initializeMessenger } from '@root/src/messengers';
import { OP_STACK_CHAINS } from '@root/src/shared/config/chains';
import { MetamaskTransactionRequest } from '@root/src/shared/config/types';

console.log('hier');

const messenger = initializeMessenger({ connect: 'background' });

const originalRequest = window.ethereum.request.bind(window.ethereum);

const log = (...args: any[]) => console.log('[escape-hatch] injected:', ...args);

/**
 * MetaMask transactions don't specify a chainId when they come in, so we track them here
 */
let lastSeenChainId: number = parseInt(window.ethereum?.chainId ?? '1');
window.ethereum.on('chainChanged', (hexChainId: string) => {
  log('chainChanged', hexChainId);
  lastSeenChainId = parseInt(hexChainId);
});

window.ethereum.request = async request => {
  if (request.method === 'eth_sendTransaction') {
    const config = OP_STACK_CHAINS.find(x => x.l2.id === lastSeenChainId);
    if (!config) {
      log('No config found for this rollup');
      return originalRequest(request);
    }

    const signRequest: MetamaskTransactionRequest = request.params[0];
    messenger.send('sign-request', { ...signRequest, chainId: lastSeenChainId });
  }

  return originalRequest(request);
};

messenger.reply('confirm', async (tx: MetamaskTransactionRequest) => {
  log('[injected]: confirm', tx);

  const gasEstimate = await window.ethereum.request({
    method: 'eth_estimateGas',
    params: [tx],
  });

  const config = OP_STACK_CHAINS.find(x => x.l2.id === lastSeenChainId);
  if (!config) {
    log('No config found for this rollup');
    return originalRequest({ method: 'eth_sendTransaction', params: [tx] });
  }

  await originalRequest({
    method: 'wallet_switchEthereumChain',
    params: [{ chainId: `0x${config.l1.id.toString(16)}` }],
  });

  const gasLimit = BigInt(parseInt(gasEstimate as string) + 50_000);

  return await originalRequest({
    method: 'eth_sendTransaction',
    params: [
      {
        to: config.contractAddresses.optimismPortal,
        from: tx.from,
        data: encodeFunctionData({
          abi: OptimismPortalAbi,
          functionName: 'depositTransaction',
          args: [
            tx.to, // _to
            tx.value ? BigInt(parseInt(tx.value)) : BigInt('0'), // _value
            gasLimit,
            false, // _isCreation, not supported for now
            tx.data, // _data
          ],
        }),
      },
    ],
  });
});
