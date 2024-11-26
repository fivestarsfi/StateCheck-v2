const TonWeb = require('tonweb');
const { getHttpEndpoint } = require("@orbs-network/ton-access");

function hexToBytes(hex) {
    if (typeof hex !== 'string') {
        throw new Error('Input must be a string');
    }
    hex = hex.replace('0x', '');
    if (hex.length % 2 !== 0) {
        throw new Error('Hex string must have an even number of characters');
    }
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
        bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
    }
    return bytes;
}

async function proveBlockState(
    contractAddress,
    blockIdExt,
    shardBlockIdExt,
    shardProof,
    proof,
    state
) {
    try {
        if (!blockIdExt || !shardBlockIdExt) {
            throw new Error('Missing required parameters');
        }

        const endpoint = await getHttpEndpoint({
            network: "mainnet", // or "testnet"
        });

        const tonweb = new TonWeb(new TonWeb.HttpProvider(endpoint));

        const cell = new TonWeb.boc.Cell();

        cell.bits.writeInt(blockIdExt.workchain, 32);
        cell.bits.writeInt(blockIdExt.shard, 64);
        cell.bits.writeInt(blockIdExt.seqno, 32);
        cell.bits.writeBytes(hexToBytes(blockIdExt.root_hash));
        cell.bits.writeBytes(hexToBytes(blockIdExt.file_hash));

        cell.bits.writeInt(shardBlockIdExt.workchain, 32);
        cell.bits.writeInt(shardBlockIdExt.shard, 64);
        cell.bits.writeInt(shardBlockIdExt.seqno, 32);
        cell.bits.writeBytes(blockIdExt.root_hash, 256);
        cell.bits.writeBytes(blockIdExt.file_hash, 256);

        cell.bits.writeBytes(shardProof);
        cell.bits.writeBytes(proof);
        cell.bits.writeBytes(state);

      const payload = {
            to: contractAddress,
            value: TonWeb.utils.toNano('0.1'),
            body: cell.toBoc(),
            sendMode: 3
        };

        const result = await tonweb.sendBoc(payload);
        
        const transaction = await tonweb.provider.getTransaction(result.hash);
        
        if (transaction.exitCode === 0) {
            return {
                success: true,
                message: "State proof verified successfully",
                transactionHash: result.hash
            };
        } else {
            return {
                success: false,
                message: "State proof verification failed",
                exitCode: transaction.exitCode,
                transactionHash: result.hash
            };
        }
    } catch (error) {
        return {
            success: false,
            message: "Transaction failed",
            error: error.message
        };
    }
}

async function main() {
    try {
        const endpoint = await getHttpEndpoint();
        const tonweb = new TonWeb(new TonWeb.HttpProvider(endpoint));
        
        const masterchainInfo = await tonweb.provider.getMasterchainInfo();
        
        const blockInfo = await tonweb.provider.getBlockHeader(
            masterchainInfo.last.workchain,
            masterchainInfo.last.shard,
            masterchainInfo.last.seqno
        );
        
        const exampleData = {
            contractAddress: 'EQBKbWV8GeUYm-Xs8d4OkjTbTP6wLbkuPfJYbAHFI5HUzvJZ',
            blockIdExt: {
                workchain: masterchainInfo.last.workchain,
                shard: masterchainInfo.last.shard,
                seqno: masterchainInfo.last.seqno,
                root_hash: masterchainInfo.last.root_hash,
                file_hash: masterchainInfo.last.file_hash
            },
            shardBlockIdExt: {
                workchain: masterchainInfo.last.workchain,
                shard: masterchainInfo.last.shard,
                seqno: masterchainInfo.last.seqno,
                root_hash: masterchainInfo.last.root_hash,
                file_hash: masterchainInfo.last.file_hash
            },
            shardProof: masterchainInfo.last.shard_proof, 
            proof: masterchainInfo.last.proof,     
            state: masterchainInfo.last.state       
        };

        const result = await proveBlockState(
            exampleData.contractAddress,
            exampleData.blockIdExt,
            exampleData.shardBlockIdExt,
            exampleData.shardProof,
            exampleData.proof,
            exampleData.state
        );
        console.log('Result:', result);
    } catch (error) {

        console.error('Error:', error);
    }
}

main();
