import { SigningStargateClient } from "@cosmjs/stargate";
import { AccountData } from "@keplr-wallet/types";
import { NOBLE_CHAIN_ID, NOBLE_RPC } from "@/config/constants";

async function suggestNobleChain() {
  if (!window.keplr) {
    throw new Error("Please install Keplr extension");
  }

  try {
    await window.keplr.experimentalSuggestChain({
      chainId: NOBLE_CHAIN_ID,
      chainName: "Noble Testnet",
      rpc: NOBLE_RPC,
      rest: NOBLE_RPC,
      bip44: { coinType: 118 },
      bech32Config: {
        bech32PrefixAccAddr: "noble",
        bech32PrefixAccPub: "noblepub",
        bech32PrefixValAddr: "noblevaloper",
        bech32PrefixValPub: "noblevaloperpub",
        bech32PrefixConsAddr: "noblevalcons",
        bech32PrefixConsPub: "noblevalconspub",
      },
      currencies: [{ coinDenom: "USDC", coinMinimalDenom: "uusdc", coinDecimals: 6 }],
      feeCurrencies: [{ coinDenom: "USDC", coinMinimalDenom: "uusdc", coinDecimals: 6 }],
      stakeCurrency: { coinDenom: "USDC", coinMinimalDenom: "uusdc", coinDecimals: 6 },
    });
    console.log("Chain suggested successfully");
  } catch (error) {
    console.error("Failed to suggest chain:", error);
    throw error;
  }
}


export async function connectKeplr(): Promise<{ accounts: readonly AccountData[]; client: SigningStargateClient }> {
  if (!window.keplr) {
    throw new Error("Please install Keplr extension");
  }
  try {
    await suggestNobleChain();
    await window.keplr.enable(NOBLE_CHAIN_ID);

    const offlineSigner = window.keplr.getOfflineSigner(NOBLE_CHAIN_ID);
    const accounts = await offlineSigner.getAccounts();

    const client = await SigningStargateClient.connectWithSigner(
      NOBLE_RPC,
      offlineSigner
    );

    return { accounts, client };
  } catch (error) {
    console.error("Failed to connect to Keplr:", error);
    throw error;
  }
}

export async function getUSDCBalance(address: string, client: SigningStargateClient): Promise<string> {
  try {
    const balance = await client.getBalance(address, "uusdc");
    return (parseInt(balance.amount) / 1_000_000).toString();
  } catch (error) {
    console.error("Failed to get USDC balance:", error);
    throw error;
  }
}

export async function disconnectWallet(): Promise<boolean> {
  return true;
}
