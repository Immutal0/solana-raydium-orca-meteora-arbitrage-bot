import { Connection, PublicKey } from "@solana/web3.js";

import pkg from "@raydium-io/raydium-sdk"

const {
  Liquidity,
  Market,
  SERUM_PROGRAM_ID_V3,
  LIQUIDITY_PROGRAM_ID_V4,
  LiquidityPoolKeys,
  jsonInfo2PoolKeys,
} = pkg

async function fetchPoolKeys(
    connection,
    poolId,
    marketProgramId,
    version = 4
) {

    // const version = 4
    const serumVersion = 3
    const marketVersion = 3

    const programId = LIQUIDITY_PROGRAM_ID_V4
    const serumProgramId = SERUM_PROGRAM_ID_V3

    const account = await connection.getAccountInfo(poolId)

    const { state: LiquidityStateLayout } = Liquidity.getLayouts(version)

    const fields = LiquidityStateLayout.decode(account.data);
    const { status, baseMint, quoteMint, lpMint, openOrders, targetOrders, baseVault, quoteVault, marketId } = fields;

    let withdrawQueue, lpVault;
    if (Liquidity.isV4(fields)) {
        withdrawQueue = fields.withdrawQueue;
        lpVault = fields.lpVault;
    } else {
        withdrawQueue = PublicKey.default;
        lpVault = PublicKey.default;
    }

    // uninitialized
    // if (status.isZero()) {
    //   return ;
    // }
    console.log("FIELDS ======>", fields)
    console.log("market ID ==================>", marketId);
    const associatedPoolKeys = await Liquidity.getAssociatedPoolKeys({
        version,
        baseMint,
        quoteMint,
        marketId,
        programId: new PublicKey(
            "675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8"
        ),
        marketProgramId
    });

    const poolKeys = {
        id: poolId,
        baseMint,
        quoteMint,
        lpMint,
        version,
        programId: new PublicKey(
            "675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8"
        ),

        authority: associatedPoolKeys.authority,
        openOrders,
        targetOrders,
        baseVault,
        quoteVault,
        withdrawQueue,
        lpVault,
        marketVersion: serumVersion,
        marketProgramId,
        marketId,
        marketAuthority: associatedPoolKeys.marketAuthority,
    };
    console.log("MARKET_ID =====>", marketId)
    const marketInfo = await connection.getAccountInfo(marketId);

    const { state: MARKET_STATE_LAYOUT } = Market.getLayouts(marketVersion);

    const market = MARKET_STATE_LAYOUT.decode(marketInfo.data);

    const {
        baseVault: marketBaseVault,
        quoteVault: marketQuoteVault,
        bids: marketBids,
        asks: marketAsks,
        eventQueue: marketEventQueue,
    } = market;

    // const poolKeys: LiquidityPoolKeys;
    return {
        ...poolKeys,
        ...{
            marketBaseVault,
            marketQuoteVault,
            marketBids,
            marketAsks,
            marketEventQueue,
        },
    };
}

async function getRouteRelated(
    connection,
    tokenInMint,
    tokenOutMint,
) {
    if (!tokenInMint || !tokenOutMint) return []
    const tokenInMintString = tokenInMint.toBase58();
    const tokenOutMintString = tokenOutMint.toBase58();
    const allPoolKeys = await fetchAllPoolKeys();

    const routeMiddleMints = ['EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R', 'So11111111111111111111111111111111111111112', 'mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So', 'Ea5SjE2Y6yvCeW5dYTn7PYMuW5ikXkvbGdcmSnXeaLjS', '7dHbWXmci3dT8UFYWYZweBLXgycu7Y3iL6trKn1Y7ARj', 'USDH1SM1ojwWUga67PGrgFWUHibbjqMvuMaDkRJTgkX', 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB']
    const candidateTokenMints = routeMiddleMints.concat([tokenInMintString, tokenOutMintString])
    const onlyRouteMints = routeMiddleMints.filter((routeMint) => ![tokenInMintString, tokenOutMintString].includes(routeMint))
    const routeRelated = allPoolKeys.filter((info) => {
        const isCandidate = candidateTokenMints.includes(info.baseMint.toBase58()) && candidateTokenMints.includes(info.quoteMint.toBase58())
        const onlyInRoute = onlyRouteMints.includes(info.baseMint.toBase58()) && onlyRouteMints.includes(info.quoteMint.toBase58())
        return isCandidate && !onlyInRoute
    })
    return routeRelated
}

// export const fetchAllPoolKeys = Liquidity.fetchAllPoolKeys
const importDynamic = new Function('modulePath', 'return import(modulePath)');
const fetch = async (...args) => {
    const module = await importDynamic('node-fetch');
    return module.default(...args);
};
async function fetchAllPoolKeys(
) {
    const response = await fetch('https://api.raydium.io/v2/sdk/liquidity/mainnet.json');
    if (!(await response).ok) return []
    const json = await response.json();
    const poolsKeysJson = [...(json?.official ?? []), ...(json?.unOfficial ?? [])]
    const poolsKeys = poolsKeysJson.map((item) => {
        const {
            id,
            baseMint,
            quoteMint,
            lpMint,
            baseDecimals,
            quoteDecimals,
            lpDecimals,
            version,
            programId,
            authority,
            openOrders,
            targetOrders,
            baseVault,
            quoteVault,
            withdrawQueue,
            lpVault,
            marketVersion,
            marketProgramId,
            marketId,
            marketAuthority,
            marketBaseVault,
            marketQuoteVault,
            marketBids,
            marketAsks,
            marketEventQueue,
        } = jsonInfo2PoolKeys(item)
        return {
            id,
            baseMint,
            quoteMint,
            lpMint,
            baseDecimals,
            quoteDecimals,
            lpDecimals,
            version,
            programId,
            authority,
            openOrders,
            targetOrders,
            baseVault,
            quoteVault,
            withdrawQueue,
            lpVault,
            marketVersion,
            marketProgramId,
            marketId,
            marketAuthority,
            marketBaseVault,
            marketQuoteVault,
            marketBids,
            marketAsks,
            marketEventQueue,
        };
    })
    return poolsKeys
}

export {
    fetchPoolKeys,
    fetchAllPoolKeys,
    getRouteRelated
}