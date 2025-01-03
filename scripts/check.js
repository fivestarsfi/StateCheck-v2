import TonWeb from "tonweb";
import { getHttpEndpoint } from "@orbs-network/ton-access";
import { LiteClient, LiteRoundRobinEngine, LiteSingleEngine } from 'ton-lite-client';

async function proveBlockState(
    contractAddress,
    blockIdExt,
    shardBlockIdExt,
    shardProof,
    proof,
    state
) {
    try {
        if (!blockIdExt || !shardBlockIdExt || !contractAddress) {
            throw new Error('Missing required parameters');
        }

       // const endpoint = await getHttpEndpoint({
        //    network: "testnet"
       // });

        const tonweb = new TonWeb(new TonWeb.HttpProvider('https://testnet.toncenter.com/api/v2/jsonRPC', {apiKey: ''}));

        const cell = new TonWeb.boc.Cell();

        const address = new TonWeb.utils.Address(contractAddress);
        cell.bits.writeAddress(address);

        cell.bits.writeUint(blockIdExt.workchain, 32);
        cell.bits.writeUint(blockIdExt.shard, 64);
        cell.bits.writeUint(blockIdExt.seqno, 32);
        cell.bits.writeBytes(TonWeb.utils.base64ToBytes(blockIdExt.root_hash));
        cell.bits.writeBytes(TonWeb.utils.base64ToBytes(blockIdExt.file_hash));

        cell.bits.writeUint(shardBlockIdExt.workchain, 32);
        cell.bits.writeUint(shardBlockIdExt.shard, 64);
        cell.bits.writeUint(shardBlockIdExt.seqno, 32);
        cell.bits.writeBytes(TonWeb.utils.base64ToBytes(shardBlockIdExt.root_hash));
        cell.bits.writeBytes(TonWeb.utils.base64ToBytes(shardBlockIdExt.file_hash));

        if (shardProof) {
            const shardProofCell = new TonWeb.boc.Cell();
            shardProofCell.bits.writeBytes(TonWeb.utils.base64ToBytes(shardProof));
            cell.refs.push(shardProofCell);
        }

        if (proof) {
            const proofCell = new TonWeb.boc.Cell();
            proofCell.bits.writeBytes(TonWeb.utils.base64ToBytes(proof));
            cell.refs.push(proofCell);
        }

        if (state) {
            const stateCell = new TonWeb.boc.Cell();
            stateCell.bits.writeBytes(TonWeb.utils.base64ToBytes(state));
            cell.refs.push(stateCell);
        }

        const bocBytes = await cell.toBoc();
        
        const result = await tonweb.provider.sendBoc(bocBytes);
        
        if (!result || !result.hash) {
            throw new Error('Failed to send BOC');
        }

        let attempts = 10;
        while (attempts > 0) {
            const transaction = await tonweb.provider.getTransactions(result.hash);
            if (transaction) {
                return {
                    success: transaction.exitCode === 0,
                    message: transaction.exitCode === 0 
                        ? "State proof verified successfully" 
                        : "State proof verification failed",
                    exitCode: transaction.exitCode,
                    transactionHash: result.hash
                };
            }
            await new Promise(resolve => setTimeout(resolve, 1500));
            attempts--;
        }

        throw new Error('Transaction confirmation timeout');

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
       
        //const endpoint = await getHttpEndpoint({
        //    network: "testnet" 
        //});
        
       // if (!endpoint) {
       //     throw new Error('Failed to get HTTP endpoint');
       // }
        
        const tonweb = new TonWeb(new TonWeb.HttpProvider('https://testnet.toncenter.com/api/v2/jsonRPC', {apiKey: ''}));

        const masterchainInfo = await tonweb.provider.getMasterchainInfo();
        if (!masterchainInfo || !masterchainInfo.last) {
        throw new Error('Failed to get masterchain info');
        }

        const transactions = await tonweb.provider.getBlockTransactions(
        masterchainInfo.last.workchain,
        masterchainInfo.last.shard,
        masterchainInfo.last.seqno,
        masterchainInfo.last.addressHash,
        1  
        );

        if (!transactions) {
        throw new Error('Failed to get transactions');
        }


        console.log('Transactions:', transactions);

     //   const blockHeader = await tonweb.provider.getBlockHeader(
     //       masterchainInfo.last.seqno,
     //       masterchainInfo.last.shard,
     //       masterchainInfo.last.workchain
     //   );
        
     //   if (!blockHeader) {
     //       throw new Error('Failed to get block header');
     //  }

        const contractAddress = 'EQBKbWV8GeUYm-Xs8d4OkjTbTP6wLbkuPfJYbAHFI5HUzvJZ';

        const accountState = await tonweb.provider.getAddressInfo(contractAddress);
        if (!accountState) {
        throw new Error('Failed to get account state');
        }

        const data = {
            contractAddress: contractAddress,
            blockIdExt: {
                workchain: masterchainInfo.last.workchain,
                shard: masterchainInfo.last.shard,
                seqno: masterchainInfo.last.seqno,
                root_hash: masterchainInfo.last.root_hash,
                file_hash: masterchainInfo.last.file_hash
            },
            shardBlockIdExt: {
                workchain: accountState.block.workchain,
                shard: accountState.block.shard,
                seqno: accountState.block.seqno,
                root_hash: accountState.block.rootHash,
                file_hash: accountState.block.fileHash
            },
            shardProof: accountState.shardProof,
            proof: accountState.proof,
            state: accountState.state
        };   
       
        validateBlockData(data);
        
        const result = await proveBlockState(
            data.contractAddress,
            data.blockIdExt,
            data.shardBlockIdExt,
            data.shardProof,
            data.proof,
            data.state
        );
        if (!result || !result.success) {
            throw new Error(result?.message || 'Proof verification failed');
        }

        console.log('Proof verification successful:', {
            transactionHash: result.transactionHash,
            exitCode: result.exitCode,
            message: result.message
        });

        return result;

    } catch (error) {
        console.error('Error during proof verification:', {
            message: error.message,
            stack: error.stack,
        });
        throw error;
    }
}

function validateBlockData(data) {
    const requiredFields = [
        'contractAddress',
        'blockIdExt',
        'shardBlockIdExt',
        'shardProof',
        'proof',
        'state'
    ];

    for (const field of requiredFields) {
        if (!data[field]) {
            throw new Error(`Missing required field: ${field}`);
        }
    }

    const blockFields = ['workchain', 'shard', 'seqno', 'root_hash', 'file_hash'];
    
    for (const blockType of ['blockIdExt', 'shardBlockIdExt']) {
        for (const field of blockFields) {
            if (data[blockType][field] === undefined) {
                throw new Error(`Missing required field: ${blockType}.${field}`);
            }
        }
   }
}

main().catch(error => {   
    console.error('Fatal error:', error);
    process.exit(1);
});
