# run this script to deploy a merkle distributor contract based on the given parameters passed. 
# run from any empty directory or create a "distribution" directory in the root to 
# automatically git ignore your distribution json files!
# example call (all date parameters are mm/dd/yyyy):
# ./cli/deploy-reawrds.sh <fromDate>> <toDate> <celoToUsd rate> <exec address> <exec private key>

# make sure celogive is installed at the latest version
# npm install -g @clabs/celogive

# Log parameters for confirmation. It's advised to use a throwaway private/public key pair.
# Currently, this process takes up less than 4 cents in gas costs.
echo Parameters
echo "\tfromDate:" $1
echo "\ttoDate:" $2
echo "\texchangeRate:" $3
echo "\tfromAddress:" $4
echo "\tprivateKey:" $5

export NODE_OPTIONS="--max-old-space-size=8192"

# get blocks until March. Cache and comment out next 2 lines for faster runtime next session.
echo "\nFetching Rewards until February 1st"
celogive rewards:fetchevents --toDate 02/01/2021 --env mainnet

# last block fetched for date 02/01/2021 is 391825
echo "\nFetching rest of rewards..."
celogive rewards:fetchevents --fromBlock 391826 --toDate $2 --env mainnet

# collect event files in proper order to feed as parameters (replaces \n with a space)
ATTESTATION_EVENTS=$(ls -tr | grep attestation | tr "\n" " ")
TRANFER_EVENTS=$(ls -tr | grep transfer | tr "\n" " ")

# construct merkle tree and output all intermediary data into rewardsCalculationState.json
echo "\nGenerating Merkle Tree..."
celogive rewards:generatemerkle \
  --attestationEvents  $ATTESTATION_EVENTS \
  --transferEvents $TRANFER_EVENTS\
  --balanceFromDate $1 \
  --balanceToDate $2 \
  --celoToUsd $3 \
  --env mainnet

echo "\nDeploying Merkle Distributor contract..."
celogive rewards:deploydistributor \
  --merkleTree merkleTree.json \
  --env mainnet \
  --from $4 \
  --privateKey $5
   