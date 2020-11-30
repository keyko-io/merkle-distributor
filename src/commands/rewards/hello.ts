import {Command, flags} from '@oclif/command'
import { BaseCommand } from '../../base'
import { getNodeUrl } from '../../utils/config'

export default class Hello extends BaseCommand {
  static description = 'describe the command here'

  static examples = [
    `$ celocli rewards:hello
hello world from ./src/hello.ts!
`,
  ]

  static flags = {
    ...BaseCommand.flags
  }

  async run() {
    const latestBlock = await this.kit.web3.eth.getBlock('latest')
    console.log(latestBlock)
  }
}
