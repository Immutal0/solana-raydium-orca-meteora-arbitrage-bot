import { PublicKey, Transaction } from "@solana/web3.js";
import { connection, marketProgramId, secretKey, SLIPPAGE, TOKEN_PROGRAM_ID, wallet } from "../config.js";
import { getTokenAccountsByOwner } from "./util.js"
import { fetchPoolKeys } from "./util_mainnet.js"
import { Liquidity, Percent, Token, TokenAmount, TxVersion } from "@raydium-io/raydium-sdk";
import { Wallet } from "@project-serum/anchor";
import { convertBase64ToBase58, createTipTransaction, sendBundle } from "../jito.js";
import base58 from "bs58";
import { getTokenBalance } from "./getTokenBalance.js";
import { BN } from "bn.js";

export const raydiumSwap = async(pairing, amount, isBuy, baseTokenAddress, baseTokenDecimal, quoteTokenAddress, quoteTokenDecimal) => {
    try {

        console.log('Raydium In ===>', amount);

        const fromRaydiumPools = pairing;
        const owner = wallet.publicKey;
        var amountIn
            // // Fetch token accounts for the user
        const tokenAccounts = await getTokenAccountsByOwner(connection, owner);
        // if (!tokenAccounts || tokenAccounts.length === 0) {
        //     throw new Error("No token accounts found for the owner");
        // }

        // Fetch pool keys and info
        const poolKeys = await fetchPoolKeys(connection, new PublicKey(fromRaydiumPools), marketProgramId);
        const poolInfo = await Liquidity.fetchInfo({ connection, poolKeys });

        // Determine input/output tokens based on the side
        let coinIn, coinOut, coinInDecimal, coinOutDecimal;
        // if (!isBuy) {
        //     coinIn = poolKeys.quoteMint;
        //     coinInDecimal = quoteTokenDecimal;
        //     coinOut = poolKeys.baseMint;
        //     coinOutDecimal = baseTokenDecimal;
        // } else {
        //     coinIn = poolKeys.baseMint;
        //     coinInDecimal = baseTokenDecimal;
        //     coinOut = poolKeys.quoteMint;
        //     coinOutDecimal = quoteTokenDecimal;
        // }

        if (baseTokenAddress === Token.WSOL.mint.toBase58()) {
            if (isBuy) {
                coinIn = baseTokenAddress;
                coinOut = quoteTokenAddress;
                coinInDecimal = baseTokenDecimal;
                coinOutDecimal = quoteTokenDecimal;
            } else {
                coinIn = quoteTokenAddress;
                coinOut = baseTokenAddress;
                coinInDecimal = quoteTokenDecimal;
                coinOutDecimal = baseTokenDecimal;
            }
        } else {
            if (isBuy) {
                coinIn = quoteTokenAddress;
                coinOut = baseTokenAddress;
                coinInDecimal = quoteTokenDecimal;
                coinOutDecimal = baseTokenDecimal;
            } else {
                coinIn = baseTokenAddress;
                coinOut = quoteTokenAddress;
                coinInDecimal = baseTokenDecimal;
                coinOutDecimal = quoteTokenDecimal;
            }
        }

        // Parse the input amount and create TokenAmount objects
        const amountParsed = parseInt((amount * 10 ** coinInDecimal).toFixed(0));
        if (!amountParsed) return console.log("error amount");

        if (isBuy) {
            amountIn = new TokenAmount(new Token(TOKEN_PROGRAM_ID, coinIn, coinInDecimal), amountParsed);
        } else {
            amountIn = new TokenAmount(new Token(TOKEN_PROGRAM_ID, coinIn, coinInDecimal), await getTokenBalance(wallet.publicKey.toString()))
        }
        const currencyOut = new Token(TOKEN_PROGRAM_ID, coinOut, coinOutDecimal);
        // Set slippage and calculate output amounts
        const slippage = new Percent(SLIPPAGE, 100); // Use parameter for slippage
        const { amountOut, minAmountOut } = Liquidity.computeAmountOut({
            poolKeys,
            poolInfo,
            amountIn,
            currencyOut,
            slippage,
        });

        if (minAmountOut.raw <= 0 || amountIn.raw <= 0) {
            throw new Error("Invalid transaction amounts");
        }

        const recentBlockhash = await connection.getLatestBlockhash();
        const transaction = new Transaction({
            recentBlockhash: recentBlockhash.blockhash
        });

        const simpleInstruction = await Liquidity.makeSwapInstructionSimple({
            connection,
            poolKeys,
            userKeys: {
                tokenAccounts,
                owner,
            },
            amountIn,
            amountOut: minAmountOut,
            fixedSide: "in",
            makeTxVersion: TxVersion.V0,
        });

        if (simpleInstruction.innerTransactions.length === 0) {
            throw new Error("No inner transactions found");
        }

        // Add instructions to transaction
        const instructions = simpleInstruction.innerTransactions[0].instructions;
        instructions.forEach((instruction) => transaction.add(instruction));

        // Set recent blockhash and fee payer
        const { blockhash } = await connection.getLatestBlockhash();
        var pair = {
            publicKey: new PublicKey(wallet.publicKey),
            secretKey: wallet.secretKey
        }
        transaction.feePayer = pair.publicKey;
        console.log(pair);

        transaction.sign(pair)

        // Send and confirm the transaction
        // const signature = await sendAndConfirmTransaction(connection, transaction, [wallet], { commitment: 'confirmed' });
        const tokenAmount = Number(amountOut.numerator) / Number(amountOut.denominator)
        console.log(transaction, tokenAmount)

        // const signature = await connection.sendTransaction(transaction, [wallet], { skipPreflight: false, preflightCommitment: 'confirmed' });
        // await connection.confirmTransaction(signature, 'confirmed')
        // console.log("https://solscan.io/tx/", signature);

        const resultTx = base58.encode(transaction.serialize())
        const jitoTx = await createTipTransaction(wallet, connection);
        const tipTx = convertBase64ToBase58(jitoTx.serialize().toString('base64'));

        console.log("Raydium Out ===>", tokenAmount);

        await sendBundle([resultTx, tipTx]);

        if (isBuy) {
            while (1) {
                const balance = await getTokenBalance(wallet.publicKey.toString(), coinOut)
                if (balance > 0) break;
            }
        }

        return { transaction: resultTx, amountOut: tokenAmount }

    } catch (err) {
        console.error('Raydium ===>', err);
        throw err;
    }
}

// raydiumSwap("78sBWyimVhLumzZg1bdMD6ogGig8QpmgYZqCXNyMxx4z", 1, true, 6)