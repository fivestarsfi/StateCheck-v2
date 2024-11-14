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
        code = await compile('Main');

const { data: globalConfig } = await axios.get('https://ton.org/global-config.json');

function intToIP(int: number) {
    var part1 = int & 255;
    var part2 = ((int >> 8) & 255);
    var part3 = ((int >> 16) & 255);
    var part4 = ((int >> 24) & 255);

    return part4 + '.' + part3 + '.' + part2 + '.' + part1;
}

        const liteClient = new LiteClient({
            engine: new LiteRoundRobinEngine(
                globalConfig.liteservers.map((server: any) => new LiteSingleEngine({
                    host: `tcp://${intToIP(server.ip)}:${server.port}`,
                    publicKey: Buffer.from(server.id.key, 'base64')
                }))
            )
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

    });

    it('should check', async () => {
      const accountAddress = Address.parse('EQBlqsm144Dq6SjbPI4jjZvA1hqTIP3CvHovbIfW_t-SCALE');
        const accountState = await liteClient.getAccountState(
            accountAddress,
            {
                workchain: -1,
                shard: (-0x8000000000000000n).toString(10),
                seqno: 40858608,
                rootHash: Buffer.from('9eeed2b60691f0541e557cae78546c4499dd6d7020b94904766d5dc28a4a0da6', 'hex'),
                fileHash: Buffer.from('b805366557a97b74b8d0c0e816e999fe6028189cd134c7d43c78b51374008fe2', 'hex')
            }
        );

Cell.fromBoc(accountState.shardProof) 
Cell.fromBoc(accountState.proof) 
Cell.fromBoc(accountState.raw) // Maybe Account

    });
 })
});
