const ethJS = require('ethereumjs-wallet')
const bip39 = require('bip39')
const ETH_DERIVATION_PATH = 'm/44\'/60\'/0\'/0'

exports.deriveAddress = (mnemonic, child) => {
    return new Promise(async res => {
        const hdwallet = ethJS.hdkey.fromMasterSeed(await bip39.mnemonicToSeed(mnemonic));
        const derivePath = hdwallet.derivePath(ETH_DERIVATION_PATH).deriveChild(child);
        const privkey = derivePath.getWallet().getPrivateKeyString();
        const wallet = ethJS.default.fromPrivateKey(Buffer.from(privkey.replace('0x', ''), 'hex'));
        const address = wallet.getAddressString()
        res(address)
    })
}

exports.getNewRandomAddress = (child = 0) => {
    return new Promise(async res => {
        const mnemonic = bip39.generateMnemonic()
        const hdwallet = ethJS.hdkey.fromMasterSeed(await bip39.mnemonicToSeed(mnemonic));
        const derivePath = hdwallet.derivePath(ETH_DERIVATION_PATH).deriveChild(child);
        const privkey = derivePath.getWallet().getPrivateKeyString();
        const wallet = ethJS.default.fromPrivateKey(Buffer.from(privkey.replace('0x', ''), 'hex'));
        const address = wallet.getAddressString()
        res({ address, privkey })
    })
}

exports.getPrivateKey = (mnemonic, child) => {
    return new Promise(async res => {
        const hdwallet = ethJS.hdkey.fromMasterSeed(await bip39.mnemonicToSeed(mnemonic));
        const derivePath = hdwallet.derivePath(ETH_DERIVATION_PATH).deriveChild(child);
        const privkey = derivePath.getWallet().getPrivateKeyString();
        const wallet = ethJS.default.fromPrivateKey(Buffer.from(privkey.replace('0x', ''), 'hex'));
        const address = wallet.getAddressString()
        res(privkey)
    })
}