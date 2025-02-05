import dotenv from "dotenv";
import axios from 'axios';
import { wrappedSolTokenAddress } from "./config.js";
import fs from 'fs';
import { getDecimalByMintAddress } from "./decimal.js";

dotenv.config();

function getUniqueTokenIds(poolsData) {
    const tokenIds = poolsData.map(poolData => [
        poolData.relationships.base_token.data.id.replace('solana_', ''),
        poolData.relationships.quote_token.data.id.replace('solana_', '')
    ]).flat();
    // Filter out wSOL mint address and get unique token addresses.
    const uniqueIds = [...new Set(tokenIds)];
    return uniqueIds.filter(id => id !== wrappedSolTokenAddress);
}

function readOriginalTokens(filename) {
    try {
        const data = fs.readFileSync(filename, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading the original tokens file:', error);
        return []; // Return an empty array if the file doesn't exist or is empty
    }
}

function writeToJsonFile(data, filename) {
    fs.writeFileSync(filename, JSON.stringify(data, null, 2), 'utf-8');
}

async function getTopPools() {
    axios.get('https://pro-api.coingecko.com/api/v3/onchain/networks/solana/trending_pools', {
            headers: {
                'accept': 'application/json',
                'x-cg-pro-api-key': 'CG-ww38dvoPhso7kYTyXbLrMQ8h'
            }
        })
        .then(response => {
            const newTokenIds = getUniqueTokenIds(response.data.data);
            const originalTokens = readOriginalTokens('token.json');
            const combinedTokens = [...new Set([...originalTokens, ...newTokenIds])];
            writeToJsonFile(combinedTokens, 'token.json');
            console.log('Data written to token.json');
            getDecimalByMintAddress();
        })
        .catch(error => {
            console.error(error);
        });
}
getTopPools();