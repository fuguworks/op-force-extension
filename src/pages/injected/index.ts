import { Address, Hex, encodeFunctionData } from 'viem';

import { OptimismPortalAbi } from '@root/src/abis/OptimismPortal';
import { OP_STACK_CHAINS } from '@root/src/shared/config/chains';

const originalRequest = window.ethereum.request.bind(window.ethereum);

type MetamaskTransactionRequest = { data: Hex; from: Address; gas: Hex; to: Address; value: Hex };

/**
 * Transactions don't specify a chainId when they come in, so we track them here
 */
let lastSeenChainId: number = parseInt(window.ethereum?.chainId ?? '1');
window.ethereum.on('chainChanged', (hexChainId: string) => {
  console.log('chainChanged', hexChainId);
  lastSeenChainId = parseInt(hexChainId);
});

window.ethereum.request = async request => {
  if (request.method === 'eth_sendTransaction') {
    const signRequest: MetamaskTransactionRequest = request.params[0];
    var event = new CustomEvent('SignRequest', {
      detail: JSON.stringify(signRequest),
    });
    console.log('[injected] intercepted request', JSON.stringify(request));
    window.dispatchEvent(event);
    return;
  }

  return originalRequest(request);
};

window.addEventListener('Confirm', async (message: CustomEvent) => {
  const tx: MetamaskTransactionRequest = JSON.parse(message.detail);
  console.log('[injected]: confirm', tx);

  const config = OP_STACK_CHAINS.find(x => x.l2.id === lastSeenChainId);
  if (!config) {
    console.warn('No config found for this rollup');
    return originalRequest({
      method: 'eth_sendTransaction',
      params: [tx],
    });
  }

  const gasEstimate = await window.ethereum.request({
    method: 'eth_estimateGas',
    params: [tx],
  });

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

window.addEventListener('Reject', async message => {
  console.log('[injected]: reject', message);
});
