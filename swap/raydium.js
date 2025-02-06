import { Liquidity, Token, TokenAmount, Percent, TxVersion } from "@raydium-io/raydium-sdk";
import { fetchPoolKeys } from "./util_mainnet";
import { getTokenAccountsByOwner } from "./util";
import { post } from 'axios';
import bs58 from 'bs58';

const TOKEN_PROGRAM_ID = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');

const jito_engine = "https://frankfurt.mainnet.block-engine.jito.wtf";

const jito_tipaccounts = [
    "96gYZGLnJYVFmbjzopPSU6QiEV5fGqZNyN9nmNhvrZU5",
    "HFqU5x63VTqvQss8hp11i4wVV8bD44PvwucfZ2bU7gRe",
    "Cw8CFyM9FkoMi7K7Crf6HNQqf4uEMzpKw6QNghXLvLkY",
    "ADaUMid9yfUytqMBgopwjb2DTLSokTSzL1zt6iGPaS49",
    "DfXygSm4jCyNCybVYYK6DwvWqjKee8pbDmJGcLWNDXjh",
    "ADuUkR4vqLUMWXxW9gh6D6L8pMSawimctcNZ5pGwDcEt",
    "DttWaMuVvTiduZRnguLF7jNxTgiMBZ1hyAumKUiL2KRL",
    "3AVi9Tg9Uo68tJfuvoKvqKNWKkC5wPdSSdeBnizKZ6jT"
];

const createTipTransaction = async (wallet, connection) => {
    const tipTx = new Transaction().add(
        SystemProgram.transfer({
            fromPubkey: wallet.publicKey,
            toPubkey: new PublicKey(jito_tipaccounts[0]),
            lamports: 0.001 * LAMPORTS_PER_SOL,
        })
    );
    tipTx.feePayer = wallet.publicKey;
    tipTx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
    tipTx.sign(wallet);
    return tipTx;
};

const convertBase64ToBase58 = (base64String) => {
    return bs58.encode(Buffer.from(base64String, 'base64'));
};

const sendBundle = async (transactions) => {
    const url = `${jito_engine}/api/v1/bundles`;

    const data = {
        id: 1,
        jsonrpc: '2.0',
        method: 'sendBundle',
        params: [transactions]
    };
    post(url, data, {
        headers: {
            'Content-Type': 'application/json'
        }
    })
        .then(response => {
            console.log('Response:', response.data);
            console.log(`https://explorer.jito.wtf/bundle/${response.data.result}`);
        })
        .catch(error => {
            console.error('Error:', error);
        });
};

async function raydiumApiSwap(connection, amount, ownerKeypair, pairing, marketProgramId, slippagePercent = 1) {
    try {
        const fromRaydiumPools = pairing;
        const owner = ownerKeypair.publicKey;

        // Fetch token accounts for the user
        const tokenAccounts = await getTokenAccountsByOwner(connection, owner);
        if (!tokenAccounts || tokenAccounts.length === 0) {
            throw new Error("No token accounts found for the owner");
        }

        // Fetch pool keys and info
        const poolKeys = await fetchPoolKeys(connection, new PublicKey(fromRaydiumPools), marketProgramId);
        const poolInfo = await Liquidity.fetchInfo({ connection, poolKeys });
        const baseDecimal = poolInfo.baseDecimals;
        const quoteDecimal = poolInfo.quoteDecimals;

        // Determine input/output tokens based on the side
        let coinIn_1, coinOut_1, coinInDecimal_1, coinOutDecimal_1;
        let coinIn_2, coinOut_2, coinInDecimal_2, coinOutDecimal_2;
        // if (side === 'buy') {
            coinIn_1 = poolKeys.quoteMint;
            coinInDecimal_1 = quoteDecimal;
            coinOut_1 = poolKeys.baseMint;
            coinOutDecimal_1 = baseDecimal;
        // } else {
            coinIn_2 = poolKeys.baseMint;
            coinInDecimal_2 = baseDecimal;
            coinOut_2 = poolKeys.quoteMint;
            coinOutDecimal_2 = quoteDecimal;
        // }

        // BUY Parse the input amount and create TokenAmount objects
        const amountParsed_1 = parseInt((amount * 10 ** coinInDecimal_1).toFixed(0));
        const amountIn_1 = new TokenAmount(new Token(TOKEN_PROGRAM_ID, coinIn_1, coinInDecimal_1), amountParsed_1);
        const currencyOut_1 = new Token(TOKEN_PROGRAM_ID, coinOut_1, coinOutDecimal_1);
        const slippage = new Percent(slippagePercent, 100); // Use parameter for slippage
        var { amountOut, minAmountOut } = Liquidity.computeAmountOut({
            poolKeys,
            poolInfo,
            amountIn: amountIn_1,
            currencyOut: currencyOut_1,
            slippage,
        });

        if (minAmountOut.raw <= 0 || amountIn_1.raw <= 0) {
            throw new Error("Invalid transaction amounts");
        }
        
        const transaction_1 = new Transaction();

        const simpleInstruction_1 = await Liquidity.makeSwapInstructionSimple({
            connection,
            poolKeys,
            userKeys: {
                tokenAccounts,
                owner,
            },
            amountIn: amountIn_1,
            amountOut: minAmountOut,
            fixedSide: "in",
            makeTxVersion: TxVersion.V0,
        });

        if (simpleInstruction_1.innerTransactions.length === 0) {
            throw new Error("No inner transactions found");
        }

        const instructions_1 = simpleInstruction_1.innerTransactions[0].instructions;
        instructions_1.forEach((instruction) => transaction_1.add(instruction));
        amountOut = Number(amountOut.numerator) / Number(amountOut.denominator)

        const amountParsed_2 = parseInt((amountOut * 10 ** coinInDecimal_2).toFixed(0));
        const amountIn_2 = new TokenAmount(new Token(TOKEN_PROGRAM_ID, coinIn_2, coinInDecimal_2), amountParsed_2);
        const currencyOut_2 = new Token(TOKEN_PROGRAM_ID, coinOut_2, coinOutDecimal_2);

        var { amountOut, minAmountOut } = Liquidity.computeAmountOut({
            poolKeys,
            poolInfo,
            amountIn: amountIn_2,
            currencyOut: currencyOut_2,
            slippage,
        });
        
        if (minAmountOut.raw <= 0 || amountIn_2.raw <= 0) {
            throw new Error("Invalid transaction amounts");
        }


        // Create and prepare transaction
        const transaction_2 = new Transaction();
        
        const simpleInstruction_2 = await Liquidity.makeSwapInstructionSimple({
            connection,
            poolKeys,
            userKeys: {
                tokenAccounts,
                owner,
            },
            amountIn: amountIn_2,
            amountOut: minAmountOut,
            fixedSide: "in",
            makeTxVersion: TxVersion.V0,
        });

        if (simpleInstruction_2.innerTransactions.length === 0) {
            throw new Error("No inner transactions found");
        }

        // Add instructions to transaction

        const instructions_2 = simpleInstruction_2.innerTransactions[0].instructions;
        instructions_2.forEach((instruction) => transaction_2.add(instruction));

        // Set recent blockhash and fee payer
        const { blockhash } = await connection.getLatestBlockhash();
        transaction_1.recentBlockhash = blockhash;
        transaction_1.feePayer = ownerKeypair.publicKey;
        transaction_1.sign(ownerKeypair);

        transaction_2.recentBlockhash = blockhash;
        transaction_2.feePayer = ownerKeypair.publicKey;
        transaction_2.sign(ownerKeypair);

        const tipTx = await createTipTransaction(ownerKeypair, connection);
        const b64tipTx = tipTx.serialize().toString('base64');
        const b58tipTx = convertBase64ToBase58(b64tipTx);

        
        const tx_1 = bs58.encode(transaction_1.serialize());
        const tx_2 = bs58.encode(transaction_2.serialize());

        await sendBundle([b58tipTx, tx_2, tx_1]);

        // Send and confirm the transaction
        // const signature = await sendAndConfirmTransaction(connection, transaction, [ownerKeypair], { commitment: 'confirmed' });
        // console.log(signature)

        // Check transaction confirmation status
        // const checkTransactionError = async (startTime, signature) => {
        //     while (Date.now() - startTime <= 30000) {
        //         const status = await connection.getSignatureStatus(signature);
        //         if (status.value?.confirmationStatus === 'confirmed') {
        //             if (status.value?.err) {
        //                 throw new Error("Transaction Failed");
        //             }
        //             return signature;
        //         }
        //         await new Promise((resolve) => setTimeout(resolve, 5000));
        //     }
        //     throw new Error("Transaction not processed");
        // };

        // return await checkTransactionError(Date.now(), signature);
        
        // return signature

    } catch (err) {
        console.error('Swap error:', err);
        throw err;
    }
}

export default { raydiumApiSwap };

    //     const modifyComputeUnits = ComputeBudgetProgram.setComputeUnitLimit({
    //     units: 5000000
    //   });
    //   const addPriorityFee = ComputeBudgetProgram.setComputeUnitPrice({
    //     microLamports: 900000
    //   });
    //   const recentBlockhash = await connection.getLatestBlockhash();
    //   const transaction = new Transaction({
    //     recentBlockhash: recentBlockhash.blockhash,
    //   }).add(modifyComputeUnits).add(addPriorityFee);