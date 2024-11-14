const TonWeb = require('tonweb');
const { getHttpEndpoint } = require("@orbs-network/ton-access");

async function proveBlockState(
    contractAddress,
    blockIdExt,
    shardBlockIdExt,
    shardProof,
    proof,
    state
) {
    try {
        const endpoint = await getHttpEndpoint({
            network: "mainnet", // or "testnet"
        });

        const tonweb = new TonWeb(new TonWeb.HttpProvider(endpoint));

        const cell = new TonWeb.boc.Cell();
        
        cell.bits.writeUint(blockIdExt.workchain, 32);
        cell.bits.writeUint(blockIdExt.shard, 64);
        cell.bits.writeUint(blockIdExt.seqno, 32);
        cell.bits.writeUint(blockIdExt.root_hash, 256);
        cell.bits.writeUint(blockIdExt.file_hash, 256);

        cell.bits.writeUint(shardBlockIdExt.workchain, 32);
        cell.bits.writeUint(shardBlockIdExt.shard, 64);
        cell.bits.writeUint(shardBlockIdExt.seqno, 32);
        cell.bits.writeUint(shardBlockIdExt.root_hash, 256);
        cell.bits.writeUint(shardBlockIdExt.file_hash, 256);

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
            contractAddress: 'EQD7YrjK6en_nISdSSn6jvPI896mZG5ZgUn-GdB1yudAxdLR',
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
