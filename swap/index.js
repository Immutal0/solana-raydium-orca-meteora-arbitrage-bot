import { connection } from "../config";

export async function raydiumApiSwap(
  amount,
  wallet,
  poolAddress,
  slippage
) {
  try {
    const fromRaydiumPools = poolAddress;
    const owner = wallet.publicKey;
    const ownerKeypair = wallet;

    // fetch pool keys and info
    const poolKeys = await fetchPoolKeys(connection, fromRaydiumPools);    

  } catch (error) {
    console.error(error);
  }
}
