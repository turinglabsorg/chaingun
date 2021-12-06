const ethJS = require('ethereumjs-wallet')
const bip39 = require('bip39')
const ETH_DERIVATION_PATH = 'm/44\'/60\'/0\'/0'

async function generate() {
    const mnemonic = bip39.generateMnemonic()
    const hdwallet = ethJS.hdkey.fromMasterSeed(await bip39.mnemonicToSeed(mnemonic));
    const derivePath = hdwallet.derivePath(ETH_DERIVATION_PATH).deriveChild(0);
    const privkey = derivePath.getWallet().getPrivateKeyString();
    const wallet = ethJS.default.fromPrivateKey(Buffer.from(privkey.replace('0x', ''), 'hex'));
    const address = wallet.getAddressString()

    console.log('NEW MNEMONIC: ' + mnemonic)
    console.log('--')
    console.log('PRIMARY ADDRESS IS: ' + address)
    console.log('PRIMARY KEY IS: ' + privkey)

    derive(mnemonic, 10)
}

async function derive(mnemonic, amount) {
    const hdwallet = ethJS.hdkey.fromMasterSeed(await bip39.mnemonicToSeed(mnemonic));
    for (let i = 1; i <= amount; i++) {
        const derivePath = hdwallet.derivePath(ETH_DERIVATION_PATH).deriveChild(i);
        const privkey = derivePath.getWallet().getPrivateKeyString();
        const wallet = ethJS.default.fromPrivateKey(Buffer.from(privkey.replace('0x', ''), 'hex'));
        const address = wallet.getAddressString()
        console.log('--')
        console.log('ADDRESS #' + i + ' IS: ' + address)
        console.log('PRIVATE KEY #' + i + ' IS: ' + privkey)
    }
}

generate()