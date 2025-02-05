import { Wallet } from "@project-serum/anchor";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import fs from 'fs';
import bs58 from 'bs58';
import dotenv from "dotenv";

dotenv.config();

export const TOKEN_PROGRAM_ID = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');
export const marketProgramId = new PublicKey("srmqPvymJeFKQ4zGQed1GFppgkRHL9kaELCbyksJtPX");
export const SLIPPAGE = 100;
export const JITO_FEES = 0.0001;
export const PROFIT = process.env.PROFIT;
export const SWAP_AMOUNT = parseFloat(process.env.SWAP_AMOUNT);
export const CG_API_KEY = process.env.CG_API_KEY;
export const wrappedSolTokenAddress =
    "So11111111111111111111111111111111111111112";
export const secretKey = process.env.SECRET_KEY;
export const connection = new Connection(process.env.SOLANA_RPC_URL);
export const minLiquidityUsd = process.env.MIN_LIQUIDITY_USD;
export const minVolumeUsd = process.env.MIN_LIQUIDITY_USD;
export const minTransactions = process.env.MIN_TRANSACTIONS;
export const jito_engine = "https://amsterdam.mainnet.block-engine.jito.wtf:443";
export const jito_tipaccounts = [
    "96gYZGLnJYVFmbjzopPSU6QiEV5fGqZNyN9nmNhvrZU5",
    "HFqU5x63VTqvQss8hp11i4wVV8bD44PvwucfZ2bU7gRe",
    "Cw8CFyM9FkoMi7K7Crf6HNQqf4uEMzpKw6QNghXLvLkY",
    "ADaUMid9yfUytqMBgopwjb2DTLSokTSzL1zt6iGPaS49",
    "DfXygSm4jCyNCybVYYK6DwvWqjKee8pbDmJGcLWNDXjh",
    "ADuUkR4vqLUMWXxW9gh6D6L8pMSawimctcNZ5pGwDcEt",
    "DttWaMuVvTiduZRnguLF7jNxTgiMBZ1hyAumKUiL2KRL",
    "3AVi9Tg9Uo68tJfuvoKvqKNWKkC5wPdSSdeBnizKZ6jT",
];

export const tokens = JSON.parse(fs.readFileSync("token.json", "utf8"));
export const tokenwithDecimals = JSON.parse(fs.readFileSync("tokenwithDecimal.json", "utf8"));
export const wallet = Keypair.fromSecretKey(bs58.decode(secretKey));

export const COINGECKO_API_URL = process.env.COINGECKO_API_URL;
export const DEX_SCREENER_URL = process.env.DEX_SCREENER_URL;