async function fetchBalance(addresses: ReadonlyArray<`0x${string}`>): Promise<bigint[]> {
  const data = addresses.map((address) => ({
    jsonrpc: "2.0",
    method: "eth_getBalance",
    params: [address, "latest"],
    id: address,
  }));

  const response = await fetch("https://mainnet.infura.io/v3/f1b70935143f4b22b3c165d6bdfd3021", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  const result = await response.json();

  return result.map((res: { result: string }) => BigInt(res.result));
}

const addresses = [
  "0xF7B31119c2682c88d88D455dBb9d5932c65Cf1bE",
  "0x3CBdeD43EFdAf0FC77b9C55F6fC9988fCC9b757d",
  "0x53b6936513e738f44FB50d2b9476730C0Ab3Bfc1",
  "0x72a5843cc08275C8171E582972Aa4fDa8C397B2A",
  "0x1da5821544e25c636c1417Ba96Ade4Cf6D2f9B5A",
] as const;

const balances = await fetchBalance(addresses);

balances.forEach((balance, index) => {
  console.log(`Address ${addresses[index]}: Balance = ${balance.toString()} wei`);
});

