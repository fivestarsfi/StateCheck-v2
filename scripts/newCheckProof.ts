import { LiteClient, LiteRoundRobinEngine, LiteSingleEngine } from 'ton-lite-client';
import { toNano, Address, beginCell, Cell } from '@ton/core';
import { ProofChecker } from '../wrappers/Main';
import { compile, NetworkProvider } from '@ton/blueprint';
import axios from 'axios';

export async function run(provider: NetworkProvider) {
const proofChecker = provider.open(ProofChecker.createFromAddress(Address.parse('0QCPrJ6fUuso80sbv7WKN6uFhl8AUKZ3fpT7-74SEkGeLvBQ'))); // replace with actual address

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

        const accountAddress = Address.parse('kQBFot7L_lSA1ZpRMDqu9zmvgLFbEGWuNvAvxion9APsm93D');
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

        await proofChecker.sendCheckProof(provider.sender(), {
    });



Cell.fromBoc(accountState.shardProof) // пруф того что акк в блоке
Cell.fromBoc(accountState.proof) // пруф что шард блок в мастере
Cell.fromBoc(accountState.raw) // Maybe Account
console.log('Account is active:', liteClient.getAccountState);
}
