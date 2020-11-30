import { Command, flags } from '@oclif/command'
import Web3 from 'web3'
import { ParserOutput } from '@oclif/parser/lib/parse'
import { CeloContract, ContractKit, newKitFromWeb3 } from '@celo/contractkit'
import { getGasCurrency, getNodeUrl, GasOptions } from './utils/config'
import net from 'net'
import { stopProvider } from '@celo/contractkit/lib/utils/provider-utils'


// This should be extracted out from the `cli` package in the monorepo
export abstract class BaseCommand extends Command {
    static flags = {
        node: flags.string({
          char: 'n',
          description: "URL of the node to run commands against (defaults to 'http://localhost:8545')",
          hidden: true,
        }),
    }

    public requireSynced: boolean = true

  private _web3: Web3 | null = null
  private _kit: ContractKit | null = null

  get web3() {
    if (!this._web3) {
      const res: ParserOutput<any, any> = this.parse()
      const nodeUrl = (res.flags && res.flags.node) || getNodeUrl(this.config.configDir)
      this._web3 =
        nodeUrl && nodeUrl.endsWith('.ipc')
          ? new Web3(new Web3.providers.IpcProvider(nodeUrl, net))
          : new Web3(nodeUrl)
    }
    return this._web3
  }

  async newWeb3() {
    const res: ParserOutput<any, any> = this.parse()
    const nodeUrl = (res.flags && res.flags.node) || getNodeUrl(this.config.configDir)
    return nodeUrl && nodeUrl.endsWith('.ipc')
      ? new Web3(new Web3.providers.IpcProvider(nodeUrl, net))
      : new Web3(nodeUrl)
  }

  get kit() {
    if (!this._kit) {
      this._kit = newKitFromWeb3(this.web3)
    }

    const res: ParserOutput<any, any> = this.parse()
    if (res.flags && res.flags.privateKey && !res.flags.useLedger && !res.flags.useAKV) {
      this._kit.addAccount(res.flags.privateKey)
    }
    return this._kit
  }

  async init() {
    const res: ParserOutput<any, any> = this.parse()

    if (res.flags.from) {
      this.kit.defaultAccount = res.flags.from
    }

    const gasCurrencyConfig = res.flags.gasCurrency
      ? GasOptions[res.flags.gasCurrency as keyof typeof GasOptions]
      : getGasCurrency(this.config.configDir)

    const setUsdGas = () => this.kit.setFeeCurrency(CeloContract.StableToken)
    if (gasCurrencyConfig === GasOptions.cUSD) {
      await setUsdGas()
    } else if (gasCurrencyConfig === GasOptions.auto && this.kit.defaultAccount) {
      const balances = await this.kit.getTotalBalance(this.kit.defaultAccount)
      if (balances.CELO.isZero()) {
        await setUsdGas()
      }
    }
  }

  finally(arg: Error | undefined): Promise<any> {
    try {
      stopProvider(this.web3.currentProvider)
    } catch (error) {
      this.log(`Failed to close the connection: ${error}`)
    }

    return super.finally(arg)
  }
}