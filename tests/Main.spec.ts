import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { Cell, toNano, beginCell, Address } from '@ton/core';
import { ProofChecker } from '../wrappers/Main';
import '@ton/test-utils';
import { compile } from '@ton/blueprint';
import { LiteClient, LiteRoundRobinEngine, LiteSingleEngine } from 'ton-lite-client';
import axios from 'axios';

const TON_ACCESS_URL = 'https://toncenter.com/api/v2/jsonRPC';

describe('ProofChecker', () => {
    let code: Cell;
    let blockchain: Blockchain;
    let deployer: SandboxContract<TreasuryContract>;
    let proofChecker: SandboxContract<ProofChecker>;
    let liteClient: LiteClient;

    beforeAll(async () => {
        code = await compile('ProofChecker');

        // Инициализация лайт-клиента с использованием TON Access
        const { data: config } = await axios.post(TON_ACCESS_URL, {
            id: '1',
            jsonrpc: '2.0',
            method: 'getConfig',
            params: [0]
        });

        const engines = config.result.liteservers.map((ls: any) => {
            return new LiteSingleEngine({
                host: `${ls.ip}:${ls.port}`,
                publicKey: Buffer.from(ls.id.key, 'base64'),
            });
        });

        const engine = new LiteRoundRobinEngine(engines);
        liteClient = new LiteClient({ engine });
    });

    beforeEach(async () => {
        blockchain = await Blockchain.create();

        proofChecker = blockchain.openContract(ProofChecker.createFromConfig({}, code));

        deployer = await blockchain.treasury('deployer');

        const deployResult = await proofChecker.sendDeploy(deployer.getSender(), toNano('0.05'));

        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: proofChecker.address,
            deploy: true,
            success: true,
        });
    });

    it('should deploy', async () => {
        // Проверка выполняется внутри beforeEach
    });

    it('should check valid proof', async () => {
        // Получение данных из реальной сети через лайт-клиент
        const { last } = await liteClient.getMasterchainInfo();
        const blockRootHash = last.last.root_hash;
        const accountAddress = Address.parse('EQA...');  // Замените на реальный адрес
        const accountInfo = await liteClient.getAccountState(accountAddress, last);

        // Получение доказательств через лайт-клиент
        const blockProof = await liteClient.getBlock(last.last);
        const { stateProof } = await liteClient.getAccountState(accountAddress, last);

        // Подготовка входных данных для смарт-контракта
        const inputData = beginCell()
            .storeBuffer(blockRootHash)
            .storeRef(Cell.fromBoc(blockProof.proof)[0])
            .storeRef(Cell.fromBoc(stateProof)[0])
            .storeUint(BigInt(accountAddress.hash), 256)
            .storeRef(accountInfo.state ?? beginCell().endCell())
            .storeDict(null)  // shardProof, null для простоты
            .endCell();

        const result = await proofChecker.sendCheckProof(deployer.getSender(), inputData);

        expect(result.transactions).toHaveTransaction({
            from: deployer.address,
            to: proofChecker.address,
            success: true,
        });
    });

    it('should reject invalid proof', async () => {
        // Подготовка неверных входных данных
        const invalidInputData = beginCell()
            .storeBuffer(Buffer.alloc(32))  // Неверный root hash
            .storeRef(beginCell().endCell())  // Пустое доказательство блока
            .storeRef(beginCell().endCell())  // Пустое доказательство состояния
            .storeUint(0, 256)  // Неверный account_id
            .storeRef(beginCell().endCell())  // Пустое состояние аккаунта
            .storeDict(null)
            .endCell();

        const result = await proofChecker.sendCheckProof(deployer.getSender(), invalidInputData);

        expect(result.transactions).toHaveTransaction({
            from: deployer.address,
            to: proofChecker.address,
            success: false,
        });
    });
});
