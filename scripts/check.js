const TonWeb = require('tonweb');

async function proveBlockState(
    provider,
    contractAddress,
    blockIdExt,
    shardBlockIdExt,
    shardProof,
    proof,
    state
) {
    const tonweb = new TonWeb(provider);

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

    try {
       
        const result = await tonweb.sendBoc(payload);
        
        const transaction = await tonweb.provider.getTransaction(result.hash);
        
        if (transaction.exitCode === 0) {
            return {
                success: true,
                message: "State proof verified successfully"
            };
        } else {
            return {
                success: false,
                message: "State proof verification failed",
                exitCode: transaction.exitCode
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

const provider = new TonWeb.HttpProvider('https://toncenter.com/api/v2/jsonRPC');

const blockIdExt = {
    workchain: 0,
    shard: BigInt("0x8000000000000000"),
    seqno: 1234567,
    root_hash: Buffer.from('...', 'hex'),
    file_hash: Buffer.from('...', 'hex')
};

const shardBlockIdExt = {
    workchain: 0,
    shard: BigInt("0x8000000000000000"),
    seqno: 1234567,
    root_hash: Buffer.from('...', 'hex'),
    file_hash: Buffer.from('...', 'hex')
};

const contractAddress = 'EQD...'; // Адрес смарт-контракта
const shardProof = Buffer.from('...', 'hex');
const proof = Buffer.from('...', 'hex');
const state = Buffer.from('...', 'hex');

proveBlockState(
    provider,
    contractAddress,
    blockIdExt,
    shardBlockIdExt,
    shardProof,
    proof,
    state
).then(console.log).catch(console.error);
