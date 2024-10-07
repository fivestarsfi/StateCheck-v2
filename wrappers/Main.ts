import {
    Address,
    beginCell,
    Cell,
    Contract,
    contractAddress,
    ContractProvider,
    Sender,
    SendMode,
    Dictionary
} from '@ton/core';

export type ProofCheckerConfig = {
};

export function proofCheckerConfigToCell(config: ProofCheckerConfig): Cell {
    return beginCell().endCell();
}

export class ProofChecker implements Contract {
    constructor(
        readonly address: Address,
        readonly init?: { code: Cell; data: Cell }
    ) {}

    static createFromAddress(address: Address) {
        return new ProofChecker(address);
    }

    static createFromConfig(config: ProofCheckerConfig, code: Cell, workchain = 0) {
        const data = proofCheckerConfigToCell(config);
        const init = { code, data };
        return new ProofChecker(contractAddress(workchain, init), init);
    }

    async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().endCell(),
        });
    }

    async sendCheckProof(
        provider: ContractProvider,
        via: Sender,
        opts: {
            value: bigint;
            blockRootHash: bigint;
            blockProof: Cell;
            stateProof: Cell;
            accountId: bigint;
            accountState: Cell;
            shardProof?: {
                mcBlockProof: Cell;
                mcStateProof: Cell;
                mcBlockHash: bigint;
                shardWc: number;
            };
        }
    ) {
        
        let shardProofDict: Dictionary<number, Cell> | null = null;
        
        if (opts.shardProof) {
            const shardProofCell = beginCell()
                .storeRef(opts.shardProof.mcBlockProof)
                .storeRef(opts.shardProof.mcStateProof)
                .storeUint(opts.shardProof.mcBlockHash, 256)
                .storeUint(opts.shardProof.shardWc, 32)
                .endCell();

            shardProofDict = Dictionary.empty(Dictionary.Keys.Uint(32), Dictionary.Values.Cell());
            shardProofDict.set(0, shardProofCell);
        }

        const body = beginCell()
            .storeUint(opts.blockRootHash, 256)
            .storeRef(opts.blockProof)
            .storeRef(opts.stateProof)
            .storeUint(opts.accountId, 256)
            .storeRef(opts.accountState)
            .storeDict(shardProofDict)
            .endCell();

        await provider.internal(via, {
            value: opts.value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: body,
        });
    }

    async getAccountState(provider: ContractProvider): Promise<{active: boolean}> {
        const result = await provider.get('get_account_state', []);
        return {
            active: result.stack.readBoolean()
        };
    }
}
