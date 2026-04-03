# ENShell SDK

[![codecov](https://codecov.io/gh/0xenshell/sdk/graph/badge.svg?token=W8JIFQD4P0)](https://codecov.io/gh/0xenshell/sdk)

Core SDK for **ENShell**, an on-chain firewall for AI agents. Provides a typed client to register agents, submit actions through the firewall, manage target permissions, and handle Ledger approvals. Built on ethers.js v6.

## Setup

Requires Node.js >= 22.10.0.

```bash
npm install @enshell/sdk
```

## Usage

```typescript
import { ENShell, Network } from "@enshell/sdk";
import { Wallet, JsonRpcProvider } from "ethers";

const provider = new JsonRpcProvider("https://rpc.sepolia.org");
const signer = new Wallet(process.env.PRIVATE_KEY!, provider);

const enshell = new ENShell({
  network: Network.SEPOLIA,
  signer,
  contractAddress: "0x...",
});

// Register an agent
await enshell.registerAgent("my-agent", {
  ensNode: "0x...",
  agentAddress: "0x...",
  spendLimit: "0.1",
  allowedTargets: ["0x..."],
});

// Submit an action through the firewall
const result = await enshell.submitAction(
  "my-agent",
  "0x...",  // target
  "0.05",  // value in ETH
  "0x",    // calldata
  "Send 0.05 ETH to treasury",
);
```

## Development

### Build

```bash
npm run build
```

### Test

```bash
npm test
```

### Coverage

```bash
npm run test:coverage
```

## License

MIT
