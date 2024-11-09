async function proveState(params) {
    const {
        id,              
        shardblk,        
        shard_proof,     
        proof,          
        state           
    } = params;

    const messageBody = beginCell()
        .storeUint(0x706f7665, 32)  
        .storeRef(beginCell()        
            .storeInt(id.workchain, 32)
            .storeUint(id.shard, 64)
            .storeUint(id.seqno, 32)
            .storeBuffer(Buffer.from(id.root_hash, 'base64'), 32)
            .storeBuffer(Buffer.from(id.file_hash, 'base64'), 32)
            .endCell())
        .storeRef(beginCell()        
            .storeInt(shardblk.workchain, 32)
            .storeUint(shardblk.shard, 64)
            .storeUint(shardblk.seqno, 32)
            .storeBuffer(Buffer.from(shardblk.root_hash, 'base64'), 32)
            .storeBuffer(Buffer.from(shardblk.file_hash, 'base64'), 32)
            .endCell())
        .storeRef(beginCell()        
            .storeBuffer(Buffer.from(shard_proof, 'base64'))
            .storeBuffer(Buffer.from(proof, 'base64'))
            .endCell())
        .storeRef(beginCell()        
            .storeBuffer(Buffer.from(state, 'base64'))
            .endCell())
        .endCell();

    const provider = await TonClient.create({
        endpoint: 'https://toncenter.com/api/v2/jsonRPC'
    });

    try {
        const sender = provider.open(await WalletContract.create(
            provider,
            YOUR_WALLET_CONFIG
        ));

        const tx = await sender.send({
            to: CONTRACT_ADDRESS,
            value: toNano('0.1'),
            body: messageBody,
            bounce: true
        });

        const receipt = await provider.getTransaction({
            hash: tx.hash,
            timeout: 60000
        });

        if (receipt.exitCode === 0) {
            return { success: true, message: "State proved successfully" };
        } else {
            return { success: false, message: Proof rejected with exit code ${receipt.exitCode} }; // Исправлено здесь
        }

    } catch (error) {
        return { success: false, message: error.message };
    }
}

const params = {
    id: {
        workchain: -1,
        shard: '8000000000000000',  
        seqno: 1234567,
        root_hash: 'base64_encoded_string',
        file_hash: 'base64_encoded_string'
    },
    shardblk: {
        workchain: -1,
        shard: '8000000000000000',
        seqno: 1234567,
        root_hash: 'base64_encoded_string',
        file_hash: 'base64_encoded_string'
    },
    shard_proof: 'base64_encoded_string',
    proof: 'base64_encoded_string',
    state: 'base64_encoded_string'
};

proveState(params).then(console.log);
