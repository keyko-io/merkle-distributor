import { BigNumber, utils } from 'ethers'

const combinedHash = (first: Buffer, second: Buffer): Buffer => {
  if (!first) {
    return second
  }
  if (!second) {
    return first
  }

  return Buffer.from(
    utils.solidityKeccak256(['bytes32', 'bytes32'], [first, second].sort(Buffer.compare)).slice(2),
    'hex'
  )
}

const toNode = (index: number | BigNumber, account: string, amount: BigNumber): Buffer => {
  const pairHex = utils.solidityKeccak256(['uint256', 'address', 'uint256'], [index, account, amount])
  return Buffer.from(pairHex.slice(2), 'hex')
}

const verifyProof = (
  index: number | BigNumber,
  account: string,
  amount: BigNumber,
  proof: Buffer[],
  root: Buffer
): boolean => {
  let pair = toNode(index, account, amount)
  for (const item of proof) {
    pair = combinedHash(pair, item)
  }

  return pair.equals(root)
}

const getNextLayer = (elements: Buffer[]): Buffer[] => {
  return elements.reduce<Buffer[]>((layer, el, idx, arr) => {
    if (idx % 2 === 0) {
      // Hash the current element with its pair element
      layer.push(combinedHash(el, arr[idx + 1]))
    }

    return layer
  }, [])
}

const getRoot = (balances: { account: string; amount: BigNumber; index: number }[]): Buffer => {
  let nodes = balances
    .map(({ account, amount, index }) => toNode(index, account, amount))
    // sort by lexicographical order
    .sort(Buffer.compare)

  // deduplicate any eleents
  nodes = nodes.filter((el, idx) => {
    return idx === 0 || !nodes[idx - 1].equals(el)
  })

  const layers = []
  layers.push(nodes)

  // Get next layer until we reach the root
  while (layers[layers.length - 1].length > 1) {
    layers.push(getNextLayer(layers[layers.length - 1]))
  }

  return layers[layers.length - 1][0]
}


export async function verifyMerkleRoot(merkleData: { [k: string]: any} ) {
  if (typeof merkleData !== 'object') throw new Error('Invalid JSON')

  const merkleRootHex = merkleData.merkleRoot
  const merkleRoot = Buffer.from(merkleRootHex.slice(2), 'hex')
  
  let balances: { index: number; account: string; amount: BigNumber }[] = []
  let valid = true
  
  Object.keys(merkleData.claims).forEach((address) => {
    const claim = merkleData.claims[address]
    const proof = claim.proof.map((p: string) => Buffer.from(p.slice(2), 'hex'))
    balances.push({ index: claim.index, account: address, amount: BigNumber.from(claim.amount) })
    if (!verifyProof(claim.index, address, claim.amount, proof, merkleRoot)) {
      console.log('Verification for', address, 'failed')
      valid = false
    }
  })
  
  if (!valid) {
    console.error('Failed validation for 1 or more proofs')
    process.exit(1)
  }
  console.log('Successfully validated all merkle claims')
  
  // Root
  const root = getRoot(balances).toString('hex')
  console.log('Reconstructed merkle root', root)
  console.log('Root matches the one read from the JSON?', root === merkleRootHex.slice(2))
}
