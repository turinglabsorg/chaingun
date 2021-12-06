const HDWalletProvider = require("@truffle/hdwallet-provider");
const Web3 = require("web3");
require('dotenv').config()
const argv = require('minimist')(process.argv.slice(2));
const fs = require('fs')
const utils = require('./libs/derive')
const forge = require("node-forge")
const BigNumber = require('big-number');

async function main(configs, shift) {

    try {
        const provider = new HDWalletProvider(
            configs.mnemonic,
            configs.provider
        );
        const web3Main = new Web3(provider);

        let times = 1
        if (configs.times !== undefined) {
            times = configs.times
        }

        const address = await utils.deriveAddress(configs.mnemonic, shift)
        const private_key = await utils.getPrivateKey(configs.mnemonic, shift)

        for (let i = 1; i <= times; i++) {
            const receiver = await utils.getNewRandomAddress()
            console.log('Created new receiver: ' + receiver.address)
            console.log('Interacting with contract ' + configs.contract_address)

            let input
            let value
            if (configs.input === 'hash') {
                var md = forge.md.sha512.create();
                md.update(new Date().getTime().toString());
                console.log('Created random hash: ' + md.digest().toHex());
                input = md.digest().toHex()
            }
            if (configs.value !== undefined && configs.value !== "") {
                value = configs.value
                console.log('Found value in configs:', value)
            }
            const receiverProvider = new HDWalletProvider(
                receiver.privkey,
                configs.provider
            );
            const web3Receiver = new Web3(receiverProvider);
            const contract = new web3Receiver.eth.Contract(
                configs.abi,
                configs.contract_address
            );
            let estimated
            if (input === undefined) {
                console.log('Estimating gas without input..')
                estimated = await contract.methods[configs.method]().estimateGas({ from: address, value: (value !== undefined) ? web3Main.utils.toWei(value, "ether") : 0 })
            } else {
                estimated = await contract.methods[configs.method](input).estimateGas({ value: (value !== undefined) ? web3Main.utils.toWei(value, "ether") : 0 })
            }
            console.log('Estimated gas is:', estimated)
            const gasPrice = await web3Main.eth.getGasPrice()
            console.log('Gas price is:', gasPrice)
            const mainBalace = await web3Main.eth.getBalance(address)
            console.log('Main balance is:', mainBalace)
            let needed = (estimated * gasPrice * 1.5).toFixed(0)
            if (value !== undefined) {
                const valueWei = web3Main.utils.toWei(value.toString(), 'ether')
                needed = BigNumber(needed).plus(valueWei)
                console.log('Adding value: ' + valueWei + '(' + value + ')')
            }
            const nonce = await web3Main.eth.getTransactionCount(address, 'latest');
            console.log('Sending from main account ' + needed + ' with nonce:', nonce)

            const transaction = {
                'to': receiver.address,
                'value': web3Main.utils.toWei(needed.toString(), 'wei'),
                'gas': 21000,
                'gasPrice': gasPrice,
                'nonce': nonce
            };

            const signedTx = await web3Main.eth.accounts.signTransaction(transaction, private_key);
            await web3Main.eth.sendSignedTransaction(signedTx.rawTransaction).on('transactionHash', pending => {
                console.log('Pending transaction hash is: ' + pending)
            })
            console.log("🎉 Sent " + needed + " wei to " + receiver.address)
            try {
                const addressBalance = await web3Main.eth.getBalance(receiver.address)
                console.log('Interaction address balance is:', addressBalance)
                if (input === undefined) {
                    await contract.methods[configs.method]().send({
                        from: receiver.address,
                        gasPrice: gasPrice,
                        value: (value !== undefined) ? web3Main.utils.toWei(value, "ether") : 0
                    }).on('transactionHash', pending => {
                        console.log('Pending transaction hash is: ' + pending)
                    })
                } else {
                    await contract.methods[configs.method](input).send({
                        from: receiver.address,
                        gasPrice: gasPrice,
                        value: (value !== undefined) ? web3Main.utils.toWei(value, "ether") : 0
                    }).on('transactionHash', pending => {
                        console.log('Pending transaction hash is: ' + pending)
                    })
                }
                console.log("🎉 Interacted correctly with " + configs.contract_address)
            } catch (e) {
                console.log('Contract errored.')
                console.log('--')
                console.log(e)
                console.log('--')
            }
        }
        process.exit()
    } catch (e) {
        console.log(e)
        process.exit()
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