import asyncio
import typing
from pytoniq import LiteBalancer, Contract, WalletV4R2, LiteClient
from pytoniq_core import StateInit, begin_cell, HashMap, Cell, Address
from secret import mnemo

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
    client = MyLiteClient.from_mainnet_config(5, 2)
    await client.connect()
    addr = Address('Uf_BvG8IeNYQFsOQ8Z5WqhcFLAcjZP_rvx-5_y32IyIYkJWz')
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

    code = Cell.one_from_boc('b5ee9c724101080100de000114ff00f4a413f4bcf2c80b0102012002070202ce03060201200405001bd3618906380489870780569002dc0047f6b9ccce983986000f97227b6c70a690000cfea00f80380ea18780390b74898f0187071400efb5a7ffa863a863a7fe63a803a003e8086040dd1c5860431c4bdb45dbf7f0680040df10e126a603731c20a640df02de2649752abe08ffb663c149d0be08e1b060631c68d825a1a863a863a7fe60411c4bdb45dbf7f0680040df10e126a603731c20a640df02de2649752abe08ffb663c149d0be08e1b0b7c50020f26c3120c7009130e0f00af800d2005b19a1e4f7')
    si = StateInit(code=code, data=Cell.empty())
    contract = await Contract.from_state_init(client, 0, si)
    print(contract)
    # await contract.send_external(body=proof)
    wallet = await get_wallet(client)
    # print(proof)
    await wallet.transfer(contract.address, 3 * 10 ** 7, body=proof)

    await client.close()


asyncio.run(main())
