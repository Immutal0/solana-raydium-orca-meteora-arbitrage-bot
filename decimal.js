import axios from "axios";
import { CG_API_KEY, tokens } from "./config.js";
import fs from "fs";

const globalDataArray = [];

const chunkArray = (array, size) => {
    const result = [];
    for (let i = 0; i < array.length; i += size) {
        result.push(array.slice(i, i + size));
    }
    return result;
};

export const getDecimalByMintAddress = async() => {
    const tokenChunks = chunkArray(tokens, 30);

    for (const chunk of tokenChunks) {
        const tokenArray = chunk.join("%2C");
        const options = {
            method: "GET",
            url: `https://pro-api.coingecko.com/api/v3/onchain/networks/solana/tokens/multi/${tokenArray}`,
            headers: {
                accept: "application/json",
                "x-cg-pro-api-key": CG_API_KEY,
            },
        };

        try {
            const response = await axios.request(options);
            const data = response.data.data;
            globalDataArray.push(
                data.map(({ attributes }) => ({
                    address: attributes.address,
                    decimals: attributes.decimals,
                }))
            );
        } catch (error) {
            console.error(error);
        }
    }
    fs.writeFile(
        "tokenwithDecimal.json",
        JSON.stringify(globalDataArray.flat(), null, 2),
        (err) => {
            if (err) {
                console.error("Error writing to file", err);
            } else {
                console.log("Successfully wrote to globalDataArray.json");
            }
        }
    );
};