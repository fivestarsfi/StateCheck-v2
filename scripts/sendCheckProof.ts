import { toNano, Address, beginCell } from '@ton/core';
import { ProofChecker } from '../wrappers/Main';
import { compile, NetworkProvider } from '@ton/blueprint';

export async function run(provider: NetworkProvider) {
    const proofChecker = provider.open(ProofChecker.createFromAddress(Address.parse(''))); // replace with actual address

    // Prepare the proof data
    const blockRootHash = BigInt('0x'); // replace with actual block root hash
    const blockProof = beginCell().storeUint(0, 32).endCell(); // replace with actual block proof
    const stateProof = beginCell().storeUint(0, 32).endCell(); // replace with actual state proof
    const accountId = BigInt('0x'); // replace with actual account ID
    const accountStateCell = beginCell().storeUint(1, 1).endCell(); // replace with actual account state

    // Optional shard proof
    const shardProof = {
        mcBlockProof: beginCell().storeUint(0, 32).endCell(), // Replace with actual MC block proof
        mcStateProof: beginCell().storeUint(0, 32).endCell(), // Replace with actual MC state proof
        mcBlockHash: BigInt('0x'), // Replace with actual MC block hash
        shardWc: 0, // Replace with actual shard workchain
    };

    await proofChecker.sendCheckProof(provider.sender(), {
        value: toNano('0.1'),
        blockRootHash,
        blockProof,
        stateProof,
        accountId,
        accountState: accountStateCell,
        shardProof, // Remove this line if you don't want to include shard proof
    });

    console.log('Check proof request sent');

    await new Promise(resolve => setTimeout(resolve, 5000));

    const accountState = await proofChecker.getAccountState();
    console.log('Account is active:', accountState.active);
}
