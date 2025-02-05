# Arbitrage Trading Bot (1% profits)

- This project is an arbitrage trading bot for the Solana blockchain. 
- It fetches Raydium, Orca, Meteora token pools from the CoinGecko API, filters them based on liquidity, and identifies arbitrage opportunities between the highest and lowest price pools. 
- The bot can execute swaps to take advantage of these opportunities.

## Prerequisites

- Node.js
- Yarn or npm
- A Solana wallet with some SOL for gas fees

## Installation

1. Clone the repository:
    ```sh
    git clone https://github.com/yaroslavmatei/ArbitrageTradingBot/
    cd arbitrage-trading-bot
    ```

2. Install dependencies:
    ```sh
    yarn install
    # or
    npm install
    ```

3. Create a `.env` file in the root directory and add your environment variables:
    ```env
    CG_API_KEY=your_coingecko_api_key
    ```

4. Create a `config.js` file in the root directory and add your configuration:
    ```javascript
    export const GAS_FEE = 0.000005;
    export const SLIPPAGE = 0.005;
    export const JITO_FEES = 0.000001;
    export const SWAP_AMOUNT = 1; // Amount in SOL
    export const wrappedSolTokenAddress = "So11111111111111111111111111111111111111112";
    export const secretKey = "your_base58_encoded_secret_key";
    export const minLiquidityUsd = 1000;
    export const connection = new Connection(clusterApiUrl("mainnet-beta"), "confirmed");
    ```

5. Create a `token.json` file in the root directory and add the tokens you want to monitor:
    ```json
    [
      "token_address_1",
      "token_address_2"
    ]
    ```

## Usage

To start the bot, run:
```sh
node index.js
```

The bot will continuously fetch and filter pools, identify arbitrage opportunities, and log them to `opportunities.json` and `profit_opportunities.log`.

## Important Notes

- Ensure your wallet has enough SOL to cover gas fees.
- The bot uses a retry mechanism to handle rate limits from the CoinGecko API.
- The bot logs profitable opportunities and can execute swaps if configured to do so.
- Currently the bot only uses the amount specified in the env file for swaps each time.

## License

This project is licensed under the MIT License.
