import asyncio
import typing
from pytoniq import LiteBalancer, Contract, WalletV4R2, LiteClient
from pytoniq_core import StateInit, begin_cell, HashMap, Cell, Address

mnemo = ''

class MyLiteClient(LiteClient):
    async def get_account_proof(self, address: typing.Union[str, Address]):
        if isinstance(address, str):
            address = Address(address)
        block = self.last_mc_block
        account = address.to_tl_account_id()
        data = {'id': block.to_dict(), 'account': account}
        result = await self.liteserver_request('getAccountState', data)
        account_state_root = Cell.one_from_boc(result['state'])
        return *Cell.from_boc(result['proof']), account_state_root, block  # need also return shard_proof cells for account not in master


async def get_wallet(client):
    return await WalletV4R2.from_mnemonic(client, mnemo, 0)


async def main():
    client = MyLiteClient.from_testnet_config(5, 2) # change to from_mainnet_config if you want check proof in mainnet
    await client.connect()
    addr = Address('0QAZWpJf_wKa71UQJ49e2exbTbvHaz67f4Ip8NIyXquH-Kdc')
    block_proof, state_proof, account_state, block = await client.get_account_proof(addr)
    print(account_state)

    proof = (begin_cell()
             .store_bytes(block.root_hash)
             .store_ref(block_proof)
             .store_ref(state_proof)
             .store_bytes(addr.hash_part)
             .store_ref(account_state)
             .store_maybe_ref(None)  # shard_proof
             .end_cell())

    code = Cell.one_from_boc('b5ee9c7241020f01000268000114ff00f4a413f4bcf2c80b01020120020e0202ce03060201200405001bd3618906380489870780569002dc0047f6b9ccce983986000f97227b6c70a690000cfea00f80380ea18780390b74898f0187071402ebb5a7ffa9a9a7ffa803a003e8086040dd1c5660491c4bdb45dbf7f0680040df10e126a603731c20a640df02de2649752abe08ffb663c149d0be08e1b0611d67a1a9a9a7ffa63e60431c4bdb45dbf7f0680040df10e126a603731c20a640df02de2649752abe08ffb663c149d0be08e1b06051c4aa6049070802c850427fdb3c02d739544114db3cf2e44d01d430d0d431d431d431d430d0d430128020f40c6fa1f2e3edc801cf16c9d73999d30730c001f2e44f6d8e14d200019fd401f00701d430f007216e9131e030e0e2206eb3f2e3ee8100c0d721d3ff3001baf2e3ea090b038450347fdb3c01d739544113db3cf2e44dd430d0d431d430d0f40430206ef2d3eb21c8cbffc9d0830722028ad83031598020f40e6fa131f2e3ebf90101f901baf2e3ec090b0c024402d739544113db3cf2e44d018e91d430d0d431d431d430d739db3c20f2e44ee030700b0a0028923070e1d30701c004923070e18307d721d3ff30003001925b70e101d30701c003925b70e1d3ff3001ba9170e17f01feeda2edfb22d09322c2008e6e2201d300018e11d3000195d60002b603e001b60366d718029fd761d300315213bbf2e3f266d71802e25144a120c0008e1e313320d430d05034f40a20c0fff2e2c39622c705f2e2c49130e2017fdb31e05232c709975f056d6d70db31e15023d721d30002d4d4300291309131e2d0e85f046d6d0d0002700020f26c3120c7009130e0f00af800d2005b1a49d30b') # boc from blueprint build
    si = StateInit(code=code, data=Cell.empty())
    contract = await Contract.from_state_init(client, 0, si)
    print(contract)
    await contract.send_external(body=proof)
    wallet = await get_wallet(client)
    print(proof)
    await wallet.transfer(contract.address, 3 * 10 ** 7, body=proof)

    await client.close()


asyncio.run(main())
