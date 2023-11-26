# Escape Hatch

Built for [Backdrop Build](https://backdropbuild.com/), a four week hackathon focusin on AI and crypto projects.


The Escape Hatch is a browser extension that let's you send OP rollup bound transactions as censorship resistant Ethereum transactions. It works by intercepting transactions and rewriting them as `depositTransaction` calls on the relevant networks `OptimismPortal` contract.

The Escape Hatch by default intercepts browser wallet bound transactions, but mobile wallets can also be connected to it. Accordingly, you can also choose to connect to dapps via WalletConnect to the Escape Hatch so requests can be forwarded from them.