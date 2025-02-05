import { wrappedSolTokenAddress } from "./config.js";
import { meteoraSwap } from "./util/meteoraSwap.js";
import { orcaSwap } from "./util/orcaSwap.js";
import { raydiumClmmSwap } from "./util/raydiumClmmSwap.js";
import { raydiumSwap } from "./util/raydiumSwap.js";
// export const buyToken = async(poolData, amount) => {
//     if (poolData.base.address === wrappedSolTokenAddress) {
//         const poolAddress = poolData.address;
//         const quoteDecimal = poolData.quote.decimal;
//         const tokenAddress = poolData.tokenAddress;
//         const dex = poolData.dex;
//         if (dex == "raydium") return await raydiumSwap(poolAddress, amount, true, quoteDecimal);
//         else if (dex == "orca") return await orcaSwap(poolAddress, amount, true, quoteDecimal, tokenAddress);
//         else if (dex == "meteora") return await meteoraSwap(poolAddress, amount, true, quoteDecimal);
//     } else {
//         const poolAddress = poolData.address;
//         const baseDecimal = poolData.base.decimal;
//         const tokenAddress = poolData.tokenAddress;
//         const dex = poolData.dex;
//         if (dex == "raydium") return await raydiumSwap(poolAddress, amount, true, baseDecimal);
//         else if (dex == "orca") return await orcaSwap(poolAddress, amount, true, baseDecimal, tokenAddress);
//         else if (dex == "meteora") return await meteoraSwap(poolAddress, amount, true, baseDecimal);
//     }
// }

export const buyToken = async(poolData, amount, highestPoolData) => {
    const poolAddress = poolData.address;
    var baseTokenAddress = poolData.base.mint.split('_')[1];
    var baseTokenDecimal = poolData.base.decimal;
    var quoteTokenAddress = poolData.quote.mint.split('_')[1];
    var quoteTokenDecimal = poolData.quote.decimal;

    if (baseTokenAddress !== "So11111111111111111111111111111111111111112" && quoteTokenAddress !== "So11111111111111111111111111111111111111112")
        return console.log("Not WSOL POOL!");


    const dex = poolData.dex;
    console.log("poolData ===>", poolData);

    const dexFunctions = {
        raydium: raydiumSwap,
        orca: orcaSwap,
        meteora: meteoraSwap,
        // "raydium-clmm": raydiumClmmSwap
    };

    const swapFunction = dexFunctions[dex];

    if (!['raydium', 'orca', 'meteora'].includes(dex) || !['raydium', 'orca', 'meteora'].includes(highestPoolData.dex) || highestPoolData.dex === "raydium-clmm" || poolData.dex === "raydium-clmm") {
        return console.log("Unsupported dex in poolData or highestPoolData");
    }

    if (swapFunction) {
        const buyTx = await swapFunction(poolAddress, amount, true, baseTokenAddress, baseTokenDecimal, quoteTokenAddress, quoteTokenDecimal);
        if (!buyTx.transaction || !buyTx.amountOut) return console.log("Error While Buying");
        return await sellToken(highestPoolData, buyTx.amountOut)
    } else {
        throw new Error(`Unsupported dex: ${dex}`);
    }
};


export const sellToken = async(poolData, amount) => {
    const poolAddress = poolData.address;
    var baseTokenAddress = poolData.base.mint.split('_')[1];
    var baseTokenDecimal = poolData.base.decimal;
    var quoteTokenAddress = poolData.quote.mint.split('_')[1];
    var quoteTokenDecimal = poolData.quote.decimal;
    const dex = poolData.dex;
    console.log("poolData ===>", poolData);
    const dexFunctions = {
        raydium: raydiumSwap,
        orca: orcaSwap,
        meteora: meteoraSwap,
        "raydium-clmm": raydiumClmmSwap
    };

    const swapFunction = dexFunctions[dex];

    if (swapFunction) {
        return await swapFunction(poolAddress, amount, false, baseTokenAddress, baseTokenDecimal, quoteTokenAddress, quoteTokenDecimal);
    } else {
        throw new Error(`Unsupported dex: ${dex}`);
    }
}