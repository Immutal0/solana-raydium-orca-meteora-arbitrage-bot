import { Keypair, PublicKey, VersionedTransaction } from "@solana/web3.js";
import { connection, JITO_FEES, secretKey, SLIPPAGE } from "../config.js";
import { buildWhirlpoolClient, IGNORE_CACHE, ORCA_WHIRLPOOL_PROGRAM_ID, swapQuoteByInputToken, WhirlpoolContext } from "@orca-so/whirlpools-sdk";
import Decimal from "decimal.js";
import { Wallet } from "@coral-xyz/anchor";
import { DecimalUtil, isVersionedTransaction, Percentage } from "@orca-so/common-sdk";
import { convertBase64ToBase58, createTipTransaction, sendBundle } from "../jito.js";
import base58 from "bs58";
import { getTokenBalance } from "./getTokenBalance.js";
import { BN } from "bn.js";
import { bs58 } from "@coral-xyz/anchor/dist/cjs/utils/bytes/index.js";

export const orcaSwap = async(poolAddress, amount, isBuy, baseTokenAddress, baseTokenDecimal, quoteTokenAddress, quoteTokenDecimal) => {
    try {

        const wallet = new Wallet(Keypair.fromSecretKey(bs58.decode(secretKey)))
        console.log("Orca In ===>", amount);
        var TokenA, TokenB, swapAmount
        if (baseTokenAddress === "So11111111111111111111111111111111111111112") {
            if (isBuy) {
                TokenA = {
                    mint: baseTokenAddress,
                    decimals: baseTokenDecimal
                }
                TokenB = {
                    mint: quoteTokenAddress,
                    decimals: quoteTokenDecimal
                }
            } else {
                TokenA = {
                    mint: quoteTokenAddress,
                    decimals: quoteTokenDecimal
                }
                TokenB = {
                    mint: baseTokenAddress,
                    decimals: baseTokenDecimal
                }
            }
        } else {
            if (isBuy) {
                TokenA = {
                    mint: quoteTokenAddress,
                    decimals: quoteTokenDecimal
                }
                TokenB = {
                    mint: baseTokenAddress,
                    decimals: baseTokenDecimal
                }
            } else {
                TokenA = {
                    mint: baseTokenAddress,
                    decimals: baseTokenDecimal
                }
                TokenB = {
                    mint: quoteTokenAddress,
                    decimals: quoteTokenDecimal
                }
            }
        }

        const ctx = WhirlpoolContext.from(
            connection,
            wallet,
            ORCA_WHIRLPOOL_PROGRAM_ID,
        )

        const whirlpoolClient = buildWhirlpoolClient(ctx);
        const whirlpool = await whirlpoolClient.getPool(new PublicKey(poolAddress));

        const amountIn = new Decimal(amount /* Token */ );
        // console.log(amountIn);
        if (isBuy) {
            swapAmount = DecimalUtil.toBN(amountIn, TokenA.decimals)
        } else {
            swapAmount = new BN(await getTokenBalance(wallet.publicKey.toString(), TokenA.mint))
        }
        const quote = await swapQuoteByInputToken(
            whirlpool,
            // Input token and amount
            TokenA.mint,
            swapAmount,
            // Acceptable slippage (10/1000 = 1%)
            Percentage.fromFraction(SLIPPAGE, 100),
            ctx.program.programId,
            ctx.fetcher,
            IGNORE_CACHE,
        );

        // console.log("estimatedAmountIn:", DecimalUtil.fromBN(quote.estimatedAmountIn, TokenA.decimals).toString(), "TokenA");
        // console.log("estimatedAmountOut:", DecimalUtil.fromBN(quote.estimatedAmountOut, TokenB.decimals).toString(), "Token");
        // console.log("otherAmountThreshold:", DecimalUtil.fromBN(quote.otherAmountThreshold, TokenB.decimals).toString(), "Token");

        // Send the transaction
        const tx = await whirlpool.swap(quote);
        const result = await tx.buildAndExecute({ computeBudgetOption: { jitoTipLamports: JITO_FEES * 10 ** 9 } })
            // const txs = result.transaction

        // console.log('txs ====>', txs);


        // const resultTx = base58.encode(txs.serialize())
        // const jitoTx = await createTipTransaction(wallet, connection);
        // const tipTx = convertBase64ToBase58(jitoTx.serialize().toString('base64'));

        // console.log("Orca Out ===>", Number(quote.estimatedAmountOut) / (10 ** TokenB.decimals));



        // await sendBundle([resultTx, tipTx])

        if (isBuy) {
            while (1) {
                const balance = await getTokenBalance(wallet.publicKey.toString(), TokenB.mint.toString())
                if (balance > 0) break;
            }
        }

        return {
            transaction: result,
            amountOut: Number(quote.estimatedAmountOut) / (10 ** TokenB.decimals)
        };
    } catch (err) {
        console.log("orca ====>", err);

    }
}

// orcaSwap("D6NdKrKNQPmRZCCnG1GqXtF7MMoHB7qR6GU5TkG59Qz1", 0.003, true, "EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm", 6, "So11111111111111111111111111111111111111112", 9)