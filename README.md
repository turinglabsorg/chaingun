# Chaingun - Transaction Bot

![Doom Chaingun](./chaingun.gif)

To use the bot simply write your configuration file, like the `configs/example.json` inserting all required informations:

- `mnemonic`: a mnemonic phrase
- `provider`: a JSON-RPC provider
- `contract_address`: address of the contract
- `method`: the method you want to call
- `input`: a random input format, now working only with `hash`
- `times`: amount of repeat
- `parallelized`: number of accounts to parallelize
- `abi`: requried ABI for the contract

Of course install all required dependencies first with `yarn`.

Then simply run `npm run bot:interact` followed by the name of the file, in this case is `example`:

```
npm run bot:interact example
```

The script will run and you'll be able to see the results. First address of the mnemonic will be the `funder` so it will send required `gas` * `gasPrice` wei to a brand new address, to create as much interactions as possible.