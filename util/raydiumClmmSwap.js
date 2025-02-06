import { initSdk, txVersion } from "./config.js"
import { BN } from "bn.js";
import { isValidClmm } from "./utils.js";
import { PoolUtils } from "@raydium-io/raydium-sdk-v2";
import { convertBase64ToBase58, createTipTransaction, sendBundle } from "../jito.js";
import base58 from "bs58";
import { connection, JITO_FEES, wallet } from "../config.js";
import { getTokenBalance } from "./getTokenBalance.js";

export const raydiumClmmSwap = async(poolAddress, amount, isBuy, baseTokenAddress, baseTokenDecimal, quoteTokenAddress, quoteTokenDecimal) => {

    try {
        console.log("Raydium CLMM In ===>", amount);


        const raydium = await initSdk();
        let poolInfo;
        const poolId = poolAddress;
        var inputMint;
        var outputMint;
        var inputAmount;
        let poolKeys;
        let clmmPoolInfo;
        let tickCache;

        if (baseTokenAddress === "So11111111111111111111111111111111111111112") {
            if (isBuy) {
                inputMint = baseTokenAddress;
                outputMint = quoteTokenAddress;
                inputAmount = new BN(amount * 10 ** baseTokenDecimal);
            } else {
                inputMint = quoteTokenAddress;
                outputMint = baseTokenAddress;
                inputAmount = new BN(await getTokenBalance(wallet.publicKey.toString(), inputMint));
            }
        } else {
            if (isBuy) {
                inputMint = quoteTokenAddress;
                outputMint = baseTokenAddress;
                inputAmount = new BN(amount * 10 ** quoteTokenDecimal);
            } else {
                inputMint = baseTokenAddress;
                outputMint = quoteTokenAddress;
                inputAmount = new BN(await getTokenBalance(wallet.publicKey.toString(), inputMint));
            }
        }

        const data = await raydium.api.fetchPoolById({ ids: poolId });
        poolInfo = data[0];
        if (!isValidClmm(poolInfo.programId))
            throw new Error("target pool is not CLMM pool");
        PoolUtils
        clmmPoolInfo = await PoolUtils.fetchComputeClmmInfo({
            connection: connection,
            poolInfo,
        });
        tickCache = await PoolUtils.fetchMultiplePoolTickArrays({
            connection: connection,
            poolKeys: [clmmPoolInfo],
        });
        // console.log("Tick Cache. ==>", tickCache);

        if (
            inputMint !== poolInfo.mintA.address &&
            inputMint !== poolInfo.mintB.address
        )
            throw new Error("input mint does not match pool");

        const baseIn = inputMint === poolInfo.mintA.address;

        const { minAmountOut, remainingAccounts } = PoolUtils.computeAmountOutFormat({
            poolInfo: clmmPoolInfo,
            tickArrayCache: tickCache[poolId],
            amountIn: inputAmount,
            tokenOut: poolInfo[baseIn ? "mintB" : "mintA"],
            slippage: JITO_FEES,
            epochInfo: await raydium.fetchEpochInfo(),
        });
        // console.log('poolInfo ====>', poolInfo, clmmPoolInfo, inputAmount, minAmountOut, clmmPoolInfo, remainingAccounts, txVersion);
        const tx = await raydium.clmm.swap({
            poolInfo,
            poolKeys: [clmmPoolInfo],
            inputMint: poolInfo[baseIn ? "mintA" : "mintB"].address,
            amountIn: inputAmount,
            amountOutMin: minAmountOut.amount.raw,
            observationId: clmmPoolInfo.observationId,
            ownerInfo: {
                useSOLBalance: true, // if wish to use existed wsol token account, pass false
            },
            remainingAccounts,
            txVersion,
        });
        var resultTx = tx.transaction;
        resultTx.sign([wallet])

        const signature = await connection.sendTransaction(resultTx, [wallet]);
        await connection.confirmTransaction(signature, 'confirmed');

        // resultTx = base58.encode(resultTx.serialize());
        // const jitoTx = await createTipTransaction(wallet, connection);
        // const tipTx = convertBase64ToBase58(jitoTx.serialize().toString('base64'));

        // console.log("Raydium CLMM Out ===>", Number(minAmountOut.amount.numerator / minAmountOut.amount.denominator));

        // await sendBundle([resultTx, tipTx])

        const amountOut = Number(minAmountOut.amount.numerator / minAmountOut.amount.denominator)

        if (isBuy) {
            while (1) {
                const balance = await getTokenBalance(wallet.publicKey.toString(), outputMint);
                if (balance > 0) break;
            }
        }

        return { transaction: resultTx, amountOut: amountOut }
    } catch (error) {
        console.log("Raydium CLMM ===>", error);
    }
}

// raydiumClmmSwap("9byT27JF1YcZNbdfYgrhb3ZKQTjidjb9eTd3EFX4muRZ", 0.003, true, "KENJSUYLASHUMfHyy5o4Hp2FdNqZg1AsUPhfH2kYvEP", 6, "So11111111111111111111111111111111111111112", 9)