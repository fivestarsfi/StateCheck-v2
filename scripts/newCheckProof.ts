import { LiteClient, LiteRoundRobinEngine, LiteSingleEngine } from 'ton-lite-client';
import { toNano, Address, beginCell, Cell } from '@ton/core';
import { ProofChecker } from '../wrappers/Main';
import { compile, NetworkProvider } from '@ton/blueprint';
import axios from 'axios';
import { Account } from 'ton-core';
// mainnet version
export async function run(provider: NetworkProvider) {
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

const stateProofer = accountState.state
const shardProofer = Cell.fromBoc(accountState.shardProof) // пруф того что акк в блоке
const blockProofer = Cell.fromBoc(accountState.proof) // пруф что шард блок в мастере
const accRawer = Cell.fromBoc(accountState.raw) // Maybe Account
const accID = Buffer.from('0:65aac9b5e380eae928db3c8e238d9bc0d61a9320fdc2bc7a2f6c87d6fedf9208', 'hex')
console.log(blockProofer)
const shardProof = {
        mcBlockProof: blockProofer, // Replace with actual MC block proof
        mcStateProof: stateProofer, // Replace with actual MC state proof
        mcBlockHash: Buffer.from('9eeed2b60691f0541e557cae78546c4499dd6d7020b94904766d5dc28a4a0da6', 'hex'), // Replace with actual MC block hash
        shardWc: 0, // Replace with actual shard workchain
    };

const proofChecker = provider.open(ProofChecker.createFromAddress(Address.parse('EQCiu_FPv51ZQI3ZlYMHIxVuFSa3uWvDuk_o4oLzPBj_N3RG')));

await proofChecker.sendCheckProof(provider.sender(), toNano('0.05'), {
        /* rootHash,
        blockProofer,
        stateProofer,
        accID,
        accountState, 
        shardProofer: shardProof, */ 
    });

console.log('Account state:', accountState) 
}
