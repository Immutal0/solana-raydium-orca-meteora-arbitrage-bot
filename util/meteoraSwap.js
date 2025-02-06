import { PublicKey, VersionedTransaction } from "@solana/web3.js";
import BN from "bn.js";
import { Wallet, AnchorProvider, Program } from '@coral-xyz/anchor';
import AmmImpl from '@mercurial-finance/dynamic-amm-sdk';
import { IDL as AmmIDL } from './idl.js';
import { connection, jito_tipaccounts, connection as mainnetConnection, wallet as mockWallet, SLIPPAGE, wallet } from "../config.js";
import { meteoraDlmmSwap } from "./meteoraDlmmSwap.js";
import { convertBase64ToBase58, createTipTransaction, sendBundle } from "../jito.js";
import base58 from "bs58";
import { getTokenBalance } from "./getTokenBalance.js";
export const PROGRAM_ID = 'Eo7WjKq67rjJQSZxS6z3YkapzY3eMj6Xy8X5EQVn5UaB';

const provider = new AnchorProvider(mainnetConnection, mockWallet, {
    commitment: 'confirmed',
});

export const meteoraSwap = async(poolAddress, amount, isBuy, baseTokenAddress, baseTokenDecimal, quoteTokenAddress, quoteTokenDecimal) => {

    console.log("Meteora In ===>", amount);

    var inTokenMint, decimal, swapAmount

    try {
        var decimal;
        if (baseTokenAddress === "So11111111111111111111111111111111111111112") {
            if (isBuy) {
                decimal = baseTokenDecimal;
                inTokenMint = new PublicKey(baseTokenAddress);
            } else {
                decimal = quoteTokenDecimal;
                inTokenMint = new PublicKey(quoteTokenAddress);
            }
        } else {
            if (isBuy) {
                decimal = quoteTokenDecimal;
                inTokenMint = new PublicKey(quoteTokenAddress);
            } else {
                decimal = baseTokenDecimal;
                inTokenMint = new PublicKey(baseTokenAddress);
            }
        }

        const outTokenMint = inTokenMint == new PublicKey(baseTokenAddress) ? quoteTokenAddress : baseTokenAddress;

        // console.log(amount);
        if (isBuy) {
            swapAmount = new BN(amount * 10 ** decimal)
        } else {
            swapAmount = new BN(await getTokenBalance(wallet.publicKey.toString(), inTokenMint.toString()))
        }
        // const swapAtoB = isBuy
        const ammProgram = new Program(AmmIDL, PROGRAM_ID, provider);
        const poolAddr = new PublicKey(poolAddress)
        try {
            var poolState = await ammProgram.account.pool.fetch(poolAddr);
        } catch {
            return await meteoraDlmmSwap(poolAddress, amount, isBuy, baseTokenAddress, baseTokenDecimal, quoteTokenAddress, quoteTokenDecimal)
        }
        const pool = await AmmImpl.default.create(provider.connection, poolAddr);
        // let inTokenMint = swapAtoB ? poolState.tokenAMint : poolState.tokenBMint;
        // console.log("inTokenMint ===>", inTokenMint, "swapAmount ===>", swapAmount, "SLIPPAGE ===>", SLIPPAGE);

        let swapQuote = await pool.getSwapQuote(inTokenMint, swapAmount, SLIPPAGE);

        const swapToken = await pool.swap(mockWallet.publicKey, inTokenMint, swapQuote.swapInAmount, swapQuote.swapOutAmount)

        await swapToken.sign(wallet)
            // const signature = await mainnetConnection.sendTransaction(swapToken, [wallet]);
            // await mainnetConnection.confirmTransaction(signature, 'confirmed');

        const resultTx = base58.encode(swapToken.serialize());
        const jitoTx = await createTipTransaction(wallet, connection);
        const tipTx = convertBase64ToBase58(jitoTx.serialize().toString('base64'));
        await sendBundle([resultTx, tipTx])

        console.log("Meteora Out ===>", swapQuote.swapOutAmount);

        if (isBuy) {
            while (1) {
                const balance = await getTokenBalance(wallet.publicKey.toString(), outTokenMint)
                if (balance >= Number(swapQuote.swapOutAmount) / 2) break;
            }
        }

        return {
            transaction: swapToken,
            amountOut: Number(swapQuote.swapOutAmount)
        }
    } catch (err) {
        return console.log("meteora.", err);
    }
}

// meteoraSwap(new PublicKey("6AJcP7wuLwmRYLBNbi825wgguaPsWzPBEHcHndpRpump"), new BN(10000000000), true)