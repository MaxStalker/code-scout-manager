## Account
Account have:
- `address`
- `[Contract]` - zero or many deployed contracts

## Contract
- `name`
- `currentCode?` - current `ContractCode` - might be zero
- `history` - History of changes via zero or many contract Codes`[ContractCode]`
- `contractLocation` - where it's currently located

## ContractCode
- `id` - unique id
- `cadence` - Cadence code
- `imports` - list of `ContractLocation` imported by this `ContractCode`