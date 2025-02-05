import {
    clusterApiUrl,
    Connection,
    PublicKey,
    Keypair,
    Transaction,
    sendAndConfirmTransaction,
} from "@solana/web3.js";
import {
    AuthorityType,
    createSetAuthorityInstruction,
    setAuthority,
} from "@solana/spl-token";
import bs58 from "bs58";

(async() => {
    // connection
    const connection = new Connection("https://wiser-summer-lake.solana-mainnet.quiknode.pro/33ce97085fd8e112069832f5fd92acac91f2e3c0", "confirmed");

    // 5YNmS1R9nNSCDzb5a7mMJ1dwK9uHeAAF4CmPEwKgVWr8
    const feePayer = Keypair.fromSecretKey(
        bs58.decode(
            "2TCaVsZLvsj3MnhkV2QvM17KShnJZwgfz1P6NX66WfHZmBZ7kUrbtDTDAMXKCoGSMmzhK1GEznwKvBq3uorZG1Up",
        ),
    );

    // G2FAbFQPFa5qKXCetoFZQEvF9BVvCKbvUZvodpVidnoY
    const alice = Keypair.fromSecretKey(
        bs58.decode(
            "3rQVoYGttUhqe2xRZpAXX72qcBaHLDi23agZ8ax85o3ueyC1jqN93DZStDNyVaa2uddhBkPM4vzAzdfdp5gQkxKr",
        ),
    );

    const randomGuy = new PublicKey("5eFEFVkw73HEH6JFYv9JRXhbZgUsQNYMowGVsqyjA7Ff");

    const mintPubkey = new PublicKey(
        "CQY7aJx5BwfP3GmVNCek5WPtUnjbsfZw7m4PL8XwpS7j",
    );

    // authority type

    // 1) for mint account
    // AuthorityType.MintTokens
    // AuthorityType.FreezeAccount

    // 2) for token account
    // AuthorityType.AccountOwner
    // AuthorityType.CloseAccount

    // 1) use build-in function
    {
        let txhash = await setAuthority(
            connection, // connection
            feePayer, // payer
            mintPubkey, // mint account || token account
            alice, // current authority
            AuthorityType.MintTokens, // authority type
            randomGuy, // new authority (you can pass `null` to close it)
        );
        console.log(`txhash: ${txhash}`);
    }

    // or

    // 2) compose by yourself
    {
        let tx = new Transaction().add(
            createSetAuthorityInstruction(
                mintPubkey, // mint account || token account
                alice.publicKey, // current auth
                AuthorityType.MintTokens, // authority type
                feePayer.publicKey, // new auth (you can pass `null` to close it)
            ),
        );
        console.log(
            `txhash: ${await sendAndConfirmTransaction(connection, tx, [
                feePayer,
                alice /* fee payer + origin auth */,
            ])}`,
        );
    }
})();