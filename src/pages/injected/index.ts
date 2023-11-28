const log = (...args: any[]) => console.log('[escape-hatch] injected:', ...args);

log('loaded');

import { Hex, encodeFunctionData } from 'viem';

import { OptimismPortalAbi } from '@root/src/abis/OptimismPortal';
import { initializeMessenger } from '@root/src/messengers';
import { OP_STACK_CHAINS } from '@root/src/shared/config/chains';
import { MetamaskTransactionRequest } from '@root/src/shared/config/types';

const messenger = initializeMessenger({ connect: 'contentScript' });

const originalRequest = window.ethereum.request.bind(window.ethereum);

let results: { [id: string]: Hex | Error | undefined } = {};

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
      log('no config found for this rollup');
      return originalRequest(request);
    }

    const id = Math.random().toString();
    log('dispatching', id);

    const signRequest: MetamaskTransactionRequest = { id, tx: { ...request.params[0] } };
    await messenger.send('sign-request', signRequest);

    return new Promise(async (resolve, reject) => {
      while (!results[id]) {
        await new Promise(res => setTimeout(res, 1000));
      }

      const result = results[id];
      console.log('Got a result', result);
      if (result instanceof Error) reject(result);
      else resolve(result as any);
    });
  }

  return originalRequest(request);
};

messenger.reply('confirm', async ({ tx, id }: MetamaskTransactionRequest) => {
  log('confirm', id);

  try {
    const gasEstimate = await originalRequest({
      method: 'eth_estimateGas',
      params: [tx],
    });

    const config = OP_STACK_CHAINS.find(x => x.l2.id === lastSeenChainId);
    if (!config) {
      log('no config found for this rollup');
      results[id] = await originalRequest({ method: 'eth_sendTransaction', params: [tx] });
    }

    await originalRequest({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: `0x${config.l1.id.toString(16)}` }],
    });

    const gasLimit = BigInt(parseInt(gasEstimate as string) + 50_000);

    results[id] = await originalRequest({
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
  } catch (e) {
    console.log(e);
    results[id] = e;
  }
});

messenger.reply('reject', async ({ tx, id }: MetamaskTransactionRequest) => {
  log('reject', id);
  results[id] = new Error('User rejected');
});
