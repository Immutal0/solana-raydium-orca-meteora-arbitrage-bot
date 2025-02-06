import { ComputeBudgetProgram, PublicKey } from "@solana/web3.js";
import { connection, SLIPPAGE, wallet } from "../config.js";
import BN from "bn.js";
import DLMM from "@meteora-ag/dlmm";
import { Wallet } from "@project-serum/anchor";
import { convertBase64ToBase58, createTipTransaction, sendBundle } from "../jito.js";
import base58 from "bs58";
import { getTokenBalance } from './getTokenBalance.js'

export const meteoraDlmmSwap = async(poolAddress, amount, isBuy, baseTokenAddress, baseTokenDecimal, quoteTokenAddress, quoteTokenDecimal) => {
    try {

        const dlmmPool = await DLMM.default.create(connection, new PublicKey(poolAddress))
        var swapAmount;
        var swapOpt;
        var swapYtoX;
        var inTokenMint, outTokenMint;
        var decimal, decimal1;
        console.log("Meteora DLMM In ===>", amount);

        if (baseTokenAddress === "So11111111111111111111111111111111111111112") {
            if (isBuy) {
                decimal = baseTokenDecimal
                decimal1 = quoteTokenDecimal
                swapYtoX = false;
                swapAmount = new BN(amount * 10 ** baseTokenDecimal);
                inTokenMint = new PublicKey(baseTokenAddress)
                outTokenMint = new PublicKey(quoteTokenAddress)
            } else {
                decimal = quoteTokenDecimal
                decimal1 = baseTokenDecimal
                swapYtoX = true;
                swapAmount = new BN(await getTokenBalance(wallet.publicKey.toString(), quoteTokenAddress));
                inTokenMint = new PublicKey(quoteTokenAddress)
                outTokenMint = new PublicKey(baseTokenAddress)
            }
        } else {
            if (isBuy) {
                decimal = quoteTokenDecimal
                decimal1 = baseTokenDecimal
                swapYtoX = true;
                swapAmount = new BN(amount * 10 ** quoteTokenDecimal)
                inTokenMint = new PublicKey(quoteTokenAddress)
                outTokenMint = new PublicKey(baseTokenAddress)
            } else {
                decimal = baseTokenDecimal
                decimal1 = quoteTokenDecimal
                swapYtoX = false;
                swapAmount = new BN(await getTokenBalance(wallet.publicKey.toString(), baseTokenAddress))
                inTokenMint = new PublicKey(baseTokenAddress)
                outTokenMint = new PublicKey(quoteTokenAddress)
            }
        }

        // Swap quote
        const binArrays = await dlmmPool.getBinArrayForSwap(swapYtoX);
        // console.log("Amount ===>", swapAmount, "swapYtoX ===>", swapYtoX, "Slippage ===>", SLIPPAGE, "binArrays ===>", binArrays);

        const swapQuote = await dlmmPool.swapQuote(swapAmount, swapYtoX, new BN(SLIPPAGE), binArrays);

        swapAmount = new BN(amount * 10 ** decimal);
        swapOpt = {
            inToken: inTokenMint,
            binArraysPubkey: swapQuote.binArraysPubkey,
            inAmount: swapAmount,
            lbPair: dlmmPool.pubkey,
            user: wallet.publicKey,
            minOutAmount: swapQuote.minOutAmount,
            outToken: outTokenMint,
        }

        // Swap
        const swapTx = await dlmmPool.swap(swapOpt);

        await swapTx.sign(wallet);

        // const signature = await connection.sendTransaction(swapTx, [wallet]);
        // await connection.confirmTransaction(signature, 'confirmed');

        const resultTx = base58.encode(swapTx.serialize())
        const jitoTx = await createTipTransaction(wallet, connection);
        const tipTx = convertBase64ToBase58(jitoTx.serialize().toString('base64'));
        console.log("Meteora DLMM Out ===>", Number(swapQuote.minOutAmount));

        await sendBundle([resultTx, tipTx])

        if (isBuy) {
            while (1) {
                const balance = await getTokenBalance(wallet.publicKey.toString(), swapOpt.outToken.toString())
                if (balance > 0) break;
            }
        }

        // console.log("ilfdhuioawhyfuieydufioyusi ======>", swapTx);
        //https://solana.com/developers/cookbook/transactions/add-priority-fees
        // set the desired priority fee
        return { transaction: swapTx, amountOut: Number(swapQuote.minOutAmount) }
    } catch (err) {
        console.log("meteoraDLMM ===>", err);

    }
}

// meteoraDlmmSwap("28FLTTrMZEpvraqpMk67dfLadCdsVKwpMosgCvh2Ta58", 0.003, true, "7XJiwLDrjzxDYdZipnJXzpr1iDTmK55XixSFAa7JgNEL", 6, "So11111111111111111111111111111111111111112", 9)