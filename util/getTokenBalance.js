import axios from 'axios'

export const getTokenBalance = async (walletAddress, tokenMintAddress) => {
    const response = await axios({
        url: `https://wiser-summer-lake.solana-mainnet.quiknode.pro/33ce97085fd8e112069832f5fd92acac91f2e3c0`,
        method: "post",
        headers: { "Content-Type": "application/json" },
        data: {
            jsonrpc: "2.0",
            id: 1,
            method: "getTokenAccountsByOwner",
            params: [
                walletAddress,
                {
                    mint: tokenMintAddress,
                },
                {
                    encoding: "jsonParsed",
                },
            ],
        },
    });
    if (
        Array.isArray(response?.data?.result?.value) &&
        response?.data?.result?.value?.length > 0 &&
        response?.data?.result?.value[0]?.account?.data?.parsed?.info?.tokenAmount
            ?.amount > 0
    ) {
        console.log('Token Balance ===>', Number(
                response?.data?.result?.value[0]?.account?.data?.parsed?.info
                    ?.tokenAmount?.amount
            ))
        return (
            Number(
                response?.data?.result?.value[0]?.account?.data?.parsed?.info
                    ?.tokenAmount?.amount
            )
        );
    } else {
        return 0;
    }
};