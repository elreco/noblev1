"use client";

import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { connectKeplr, getUSDCBalance } from "@/lib/wallet";
import type { BridgeFormData, TransactionState } from "@/types";
import { SigningStargateClient } from "@cosmjs/stargate";
import { Registry, GeneratedType } from "@cosmjs/proto-signing";
import { MsgDepositForBurn } from "@/lib/tx";
import { NOBLE_CHAIN_ID, NOBLE_RPC } from "@/config/constants";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Wallet, DollarSign } from 'lucide-react';

const cctpTypes: [string, GeneratedType][] = [
  ["/circle.cctp.v1.MsgDepositForBurn", MsgDepositForBurn],
];

function createDefaultRegistry() {
  return new Registry(cctpTypes);
}

export default function Home() {
  const [nobleWallet, setNobleWallet] = useState<{ isConnected: boolean; address: string }>({
    isConnected: false,
    address: "",
  });
  const [txState, setTxState] = useState<TransactionState>({
    loading: false,
    error: "",
    success: false,
  });
  const [client, setClient] = useState<SigningStargateClient | null>(null);
  const [usdcBalance, setUsdcBalance] = useState<string>("0");
  const [txResult, setTxResult] = useState<string>("");

  const handleConnectWallet = async () => {
    try {
      setTxState((prev) => ({ ...prev, loading: true, error: "" }));
      const { accounts } = await connectKeplr();
      setNobleWallet({ isConnected: true, address: accounts[0].address });

      const offlineSigner = window.keplr.getOfflineSigner(NOBLE_CHAIN_ID);
      const registry = createDefaultRegistry();
      const clientWithRegistry = await SigningStargateClient.connectWithSigner(
        NOBLE_RPC,
        offlineSigner,
        { registry }
      );

      setClient(clientWithRegistry);
      const balance = await getUSDCBalance(accounts[0].address, clientWithRegistry);
      setUsdcBalance(balance);
      setTxState((prev) => ({ ...prev, loading: false }));
    } catch {
      setTxState((prev) => ({ ...prev, loading: false, error: "Failed to connect wallet" }));
    }
  };

  const handleBridgeSubmit = async (data: BridgeFormData) => {
    if (!nobleWallet.isConnected || !client) {
      setTxState((prev) => ({ ...prev, error: "Please connect Keplr wallet" }));
      return;
    }

    try {
      setTxState({ loading: true, error: "", success: false });

      const walletAddress = nobleWallet.address;
      const rawMintRecipient = data.recipient;
      const cleanedMintRecipient = rawMintRecipient.replace(/^0x/, '');
      const zeroesNeeded = 64 - cleanedMintRecipient.length;
      const mintRecipient = '0'.repeat(zeroesNeeded) + cleanedMintRecipient;
      const buffer = Buffer.from(mintRecipient, "hex");
      const mintRecipientBytes = new Uint8Array(buffer);

      const msg = {
        typeUrl: "/circle.cctp.v1.MsgDepositForBurn",
        value: {
          from: walletAddress,
          amount: data.amount,
          destinationDomain: 0,
          mintRecipient: mintRecipientBytes,
          burnToken: "uusdc",
        },
      };

      const fee = {
        amount: [{ denom: "uusdc", amount: "0" }],
        gas: "200000",
      };

      const result = await client.signAndBroadcast(walletAddress, [msg], fee, "");

      setTxResult(`Transaction Hash: ${result.transactionHash}`);
      setTxState({ loading: false, error: "", success: true });
    } catch {
      setTxState((prev) => ({ ...prev, loading: false, error: "Transaction failed" }));
    }
  };

  return (
    <main className="container max-w-xl mx-auto p-4">
      <Card className="shadow-md border rounded-lg">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Bridge USDC from Noble to Ethereum</CardTitle>
          <CardDescription className="text-gray-600 text-sm">
            Burn USDC on Noble and receive it on Ethereum.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!nobleWallet.isConnected && (
            <div className="flex w-full">
              <Button
                onClick={handleConnectWallet}
                className="text-sm bg-emerald-500 w-full hover:bg-emerald-600 text-white"
                disabled={txState.loading}
              >
                {txState.loading ? "Connecting..." : "Connect Wallet"}
              </Button>
            </div>
          )}
          <div className="flex justify-between items-center p-2 bg-gray-100 rounded-md">
            <div className="flex items-center space-x-2">
              <Wallet className="h-5 w-5 text-blue-500" />
              <span className="font-medium">Wallet:</span>
              <span className="text-gray-800">{nobleWallet.address || "Disconnected"}</span>
            </div>
          </div>
          <div className="flex items-center space-x-2 p-2 bg-gray-100 rounded-md">
            <DollarSign className="h-5 w-5 text-green-500" />
            <span className="text-sm text-gray-700">
              USDC Balance: <span className="font-bold">{usdcBalance}</span>
            </span>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target as HTMLFormElement);
              handleBridgeSubmit({
                amount: formData.get("amount") as string,
                recipient: formData.get("recipient") as string,
              });
            }}
            className="space-y-3"
          >
            <Input
              name="amount"
              type="text"
              placeholder="Mint amount "
              className="w-full border rounded-md px-3 py-2 text-sm"
              required
            />
            <Input
              name="recipient"
              type="text"
              placeholder="ETH recipient address"
              className="w-full border rounded-md px-3 py-2 text-sm"
              required
            />
            <Button
              type="submit"
              className="w-full bg-blue-500 hover:bg-blue-600 text-white"
              disabled={txState.loading}
            >
              {txState.loading ? "Processing..." : "Bridge"}
            </Button>
          </form>
          {txState.error && (
            <Alert className="bg-red-100 border border-red-400 text-red-700 p-4 rounded">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{txState.error}</AlertDescription>
            </Alert>
          )}
          {txState.success && (
            <Alert className="bg-green-100 border border-green-400 text-green-700 p-4 rounded">
              <AlertTitle>Success</AlertTitle>
              <AlertDescription>Transaction successful!</AlertDescription>
              <div className="flex space-x-2">
                <Button
                  onClick={() => window.open(`https://sepolia.etherscan.io/tx/${txResult}`, '_blank')}
                  className="mt-2 bg-blue-500 hover:bg-blue-600 text-white"
                >
                  View on Sepolia Etherscan
                </Button>
                <Button
                  onClick={() => window.open(`https://testnet.mintscan.io/noble-testnet/txs/${txResult}`, '_blank')}
                  className="mt-2 bg-green-500 hover:bg-green-600 text-white"
                >
                  View on Noble Testnet Mintscan
                </Button>
              </div>
            </Alert>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
