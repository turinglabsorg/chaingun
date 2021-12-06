const HDWalletProvider = require("@truffle/hdwallet-provider");
const Web3 = require("web3");
require('dotenv').config()
const argv = require('minimist')(process.argv.slice(2));
const fs = require('fs')
const utils = require('./libs/derive')

async function main(configs, shift) {
    try {
        const provider = new HDWalletProvider(
            configs.mnemonic,
            configs.provider
        );
        const web3 = new Web3(provider);

        let times = 1
        if (configs.times !== undefined) {
            times = configs.times
        }

        console.log('Starting from address #' + shift)
        const address = await utils.deriveAddress(configs.mnemonic, shift)
        const private_key = await utils.getPrivateKey(configs.mnemonic, shift)

        for (let i = 1; i <= times; i++) {
            const receiver = await utils.getNewRandomAddress()
            const nonce = await web3.eth.getTransactionCount(address, 'latest');
            const transaction = {
                'to': receiver.address,
                'value': 100,
                'gas': 21000,
                'nonce': nonce
            };
            const signedTx = await web3.eth.accounts.signTransaction(transaction, private_key);
            await web3.eth.sendSignedTransaction(signedTx.rawTransaction).on('transactionHash', pending => {
                console.log('Pending transaction hash is: ' + pending)
            })
            console.log("🎉 Sent 100 wei to " + receiver.address)
        }
        console.log('Finish process.')
    } catch (e) {
        console.log(e)
    }

}

async function checkFunds(configs, shift) {
    return new Promise(async response => {
        const provider = new HDWalletProvider(
            configs.mnemonic,
            configs.provider
        );
        const web3 = new Web3(provider);
        const address = await utils.deriveAddress(configs.mnemonic, shift)
        console.log('Address is: ' + address)
        const balance = await web3.eth.getBalance(address)
        console.log('Balance is: ' + balance)
        if (balance < parseInt(web3.utils.toWei(configs.min_balance.toString(), 'ether'))) {
            const main = await utils.deriveAddress(configs.mnemonic, 0)
            const private_key = await utils.getPrivateKey(configs.mnemonic, 0)
            const nonce = await web3.eth.getTransactionCount(main, 'latest')
            const transaction = {
                'to': address,
                'value': web3.utils.toWei(configs.min_balance.toString(), 'ether'),
                'gas': 21000,
                'nonce': nonce
            };
            const signedTx = await web3.eth.accounts.signTransaction(transaction, private_key);
            await web3.eth.sendSignedTransaction(signedTx.rawTransaction).on('transactionHash', pending => {
                console.log('Pending transaction hash is: ' + pending)
            })
            console.log('Address #' + shift + ' funded correctly.')
            response(true)
        } else {
            response(true)
        }
    })
}

async function prepare() {
    if (argv._ !== undefined) {
        const configs = JSON.parse(fs.readFileSync('./configs/' + argv._ + '.json').toString())
        if (configs.parallelized !== undefined) {
            for (let i = 0; i < configs.parallelized; i++) {
                const shift = i * configs.times;
                console.log('Checking balance for #' + shift)
                await checkFunds(configs, shift);
            }
            for (let i = 0; i < configs.parallelized; i++) {
                const shift = i * configs.times;
                main(configs, shift);
            }
        } else {
            main(configs, 0);
        }
    } else {
        console.log('Provide a deployed contract first.')
    }
}

prepare();