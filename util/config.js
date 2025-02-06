import {
    Raydium,
    TxVersion,
    parseTokenAccountResp,
} from "@raydium-io/raydium-sdk-v2";
import { Connection, Keypair, clusterApiUrl } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID } from "@solana/spl-token";
import bs58 from "bs58";
import { wallet, connection } from "../config.js";
import { createClient as dexClient } from 'redis';

export const owner = wallet;
// export const connection = new Connection("<YOUR_RPC_URL>"); //<YOUR_RPC_URL>
// export const connection = connection; //<YOUR_RPC_URL>
export const txVersion = TxVersion.V0; // or TxVersion.LEGACY
// const cluster = "mainnet"; // 'mainnet' | 'devnet'
const cluster = "mainnet"; // 'mainnet' | 'devnet'

let raydium;
export const initSdk = async (params) => {
    console.log("initSdk");
    if (raydium) return raydium;
    console.log(`connect to rpc ${connection.rpcEndpoint} in ${cluster}`);
    raydium = await Raydium.load({
        owner,
        connection,
        cluster,
        disableFeatureCheck: true,
        disableLoadToken: !params?.loadToken,
        blockhashCommitment: "finalized",
        // urlConfigs: {
        //   BASE_HOST: '<API_HOST>', // api url configs, currently api doesn't support devnet
        // },
    });

    /**
     * By default: sdk will automatically fetch token account data when need it or any sol balace changed.
     * if you want to handle token account by yourself, set token account data after init sdk
     * code below shows how to do it.
     * note: after call raydium.account.updateTokenAccount, raydium will not automatically fetch token account
     */

    /*  
    raydium.account.updateTokenAccount(await fetchTokenAccountData())
    connection.onAccountChange(owner.publicKey, async () => {
      raydium!.account.updateTokenAccount(await fetchTokenAccountData())
    })
    */

    return raydium;
};

export const dexSwap = dexClient({
    username: 'default',
    password: "CskQ8r2ulTQoK1MHC6ikvVngqbWOujJE",
    socket: {
        host: 'redis-17325.c9.us-east-1-4.ec2.redns.redis-cloud.com',
        port: 17325
    }
})

export const fetchTokenAccountData = async () => {
    const solAccountResp = await connection.getAccountInfo(owner.publicKey);
    const tokenAccountResp = await connection.getTokenAccountsByOwner(
        owner.publicKey,
        { programId: TOKEN_PROGRAM_ID }
    );
    const token2022Req = await connection.getTokenAccountsByOwner(
        owner.publicKey,
        { programId: TOKEN_2022_PROGRAM_ID }
    );
    const tokenAccountData = parseTokenAccountResp({
        owner: owner.publicKey,
        solAccountResp,
        tokenAccountResp: {
            context: tokenAccountResp.context,
            value: [...tokenAccountResp.value, ...token2022Req.value],
        },
    });
    return tokenAccountData;
};