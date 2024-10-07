import { toNano } from '@ton/core';
import { ProofChecker } from '../wrappers/Main';
import { compile, NetworkProvider } from '@ton/blueprint';

export async function run(provider: NetworkProvider) {
    const proofChecker = provider.open(ProofChecker.createFromConfig({
    
  }, await compile('Main')));

    await proofChecker.sendDeploy(provider.sender(), toNano('0.05'));

    await provider.waitForDeploy(proofChecker.address);

    console.log('ProofChecker deployed at', proofChecker.address);
}
