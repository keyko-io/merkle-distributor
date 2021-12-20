import { program } from 'commander'
import fs from 'fs'
import { parseBalanceMap } from '../src/parse-balance-map'

program
  .version('0.0.0')
  .requiredOption(
    '-i, --input <path>',
    'input JSON file location containing a map of account addresses to string balances'
  )

program.parse(process.argv)

const rewardsJson = JSON.parse(fs.readFileSync(program.input, { encoding: 'utf8' }))

if (typeof rewardsJson !== 'object') throw new Error('Invalid JSON')

const merkleFile = 'merkleTree.json'
const merkleData = parseBalanceMap(rewardsJson)
console.log(`merkelRoot: ${merkleData.merkleRoot}`)

fs.writeFile(merkleFile, JSON.stringify(merkleData, null, 2), (err) => {
  if (err) console.error(err)
})
console.log(`Merkle Tree data saved to file: ${merkleFile}`)
