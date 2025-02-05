import pkg, { LAMPORTS_PER_SOL } from "@solana/web3.js";
import bs58 from "bs58";
import axios from "axios";
import chalk from "chalk";
import { Wallet } from "@project-serum/anchor";
import { jito_engine, JITO_FEES, jito_tipaccounts } from "./config.js";
const { PublicKey, Transaction, SystemProgram } = pkg
export const createTipTransaction = async(wallet, connection) => {
    let keypair = new Wallet(wallet)
    if (!keypair ||
        !keypair.publicKey ||
        typeof keypair.signTransaction !== "function"
    ) {
        throw new Error("Invalid keypair object");
    }

    const tipTx = new Transaction().add(
        SystemProgram.transfer({
            fromPubkey: keypair.publicKey,
            toPubkey: new PublicKey(jito_tipaccounts[0]),
            lamports: JITO_FEES * LAMPORTS_PER_SOL,
        })
    );

    tipTx.feePayer = keypair.publicKey;
    tipTx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

    try {
        await keypair.signTransaction(tipTx);
    } catch (error) {
        console.error(chalk.red("❌ Error signing transaction:"), error);
        throw error;
    }
    return tipTx;
};

export const convertBase64ToBase58 = (base64String) =>
    bs58.encode(Buffer.from(base64String, "base64"));

export const sendBundle = async(transactions) => {
    const url = `${jito_engine}/api/v1/bundles`;
    const data = {
        id: 1,
        jsonrpc: "2.0",
        method: "sendBundle",
        params: [transactions],
    };

    try {
        const response = await axios.post(url, data, {
            headers: { "Content-Type": "application/json" },
        });

        console.log(chalk.green("✅ Response status:"), response.status);
        console.log(chalk.green("✅ Response data:"), response.data);
        if (response.data.result) {
            return console.log(
                chalk.blue(
                    `🔗 https://explorer.jito.wtf/bundle/${response.data.result}`
                )
            );
        } else {
            return console.log(chalk.yellow("⚠️ No result in response data"));
        }
    } catch (error) {
        if (error.response) {
            console.error(chalk.red("❌ Error response data:"), error.response.data);
            console.error(
                chalk.red("❌ Error response status:"),
                error.response.status
            );
            return console.error(
                chalk.red("❌ Error response headers:"),
                error.response.headers
            );
        } else if (error.request) {
            return console.error(chalk.red("❌ No response received:"), error.request);
        } else {
            return console.error(chalk.red("❌ Error setting up request:"), error.message);
        }
    }
};