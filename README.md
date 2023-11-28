# Escape Hatch

Built for [Backdrop Build](https://backdropbuild.com/), a four week hackathon focusin on AI and crypto projects.


The Escape Hatch is a browser extension that let's you send OP rollup bound transactions as censorship resistant Ethereum transactions. It works by intercepting transactions and rewriting them as `depositTransaction` calls on the relevant networks `OptimismPortal` contract.

The Escape Hatch by default intercepts browser wallet bound transactions, but mobile wallets can also be connected to it. Accordingly, you can also choose to connect to dapps via WalletConnect to the Escape Hatch so requests can be forwarded from them.


## Next steps

#### WalletConnect support

Right now the extension is limited to browser wallets, like MetaMask and Rabby, but it works best with MetaMask. Enabling users to connect their mobile wallets to the extension via WalletConnect would further increase the accessibility of censorship resistant transactions.

#### Deposit transaction decoding

Blindly signing deposit transactions can be a scary experience for users. Building tooling that highlights what a deposit transaction will do on the destination chain will help users feel safe when approving these transactions.

#### L2 transaction hash computing

Once WalletConnect support is live (specifically V2, where dapps and wallets maintain a mapping of networks supported), the extension will be able to precompute the L2 transaction hash and return that to the dapp so the dapp can wait for execution of the transaction.