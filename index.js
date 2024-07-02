const Hyperswarm = require('hyperswarm')
const Corestore = require('corestore')
const Hyperbee = require('hyperbee')
const b4a = require('b4a')
const { CustomCLI } = require('./cli')
require('dotenv').config()

class Auction {
  constructor() {
    this.swarm = new Hyperswarm

    // Filename could be static, but here is dynamic in order to test many different peers in the same computer
    let filename = 'storage' + Math.random()
    this.corestore = new Corestore(filename)

    // The auctioneers
    this.peers = []

    this.key = b4a.from(process.env.TOPIC, 'hex')
    this.secretKey = b4a.from(process.env.TOPIC_SECRET, 'hex')

    // Get Hypercore
    this.core = this.corestore.get({ key: this.key, keyPair: { publicKey: this.key, secretKey: this.secretKey } })

    this.bee = new Hyperbee(this.core, {
      keyEncoding: 'utf-8',
      valueEncoding: 'json'
    })

    this.setupSwarm()

    process.on('exit', function () {
      this.swarm.destroy()
    })

    this.open = this.open.bind(this)
    this.makeBid = this.makeBid.bind(this)
    this.close = this.close.bind(this)
    this.peersCLI = this.peersCLI.bind(this)
    this.readStream = this.readStream.bind(this)
    this.foundPeers = this.core.findingPeers()

    this.cli = new CustomCLI()
  }

  async setupSwarm() {
    await this.core.ready()
    await this.bee.ready()

    this.foundPeers()

    // Waiting for the topic to be fully announced to the DHT
    const discovery = this.swarm.join(this.core.discoveryKey)
    discovery.flushed().then(async () => {
      await this.readStream()
      await this.peersCLI()
    })

    this.swarm.on('connection', async (conn) => {
      this.corestore.replicate(conn)
      this.peers.push(conn)
      conn.on("data", (data) => {
        try {
          const json = JSON.parse(data.toString())
          console.log(`${JSON.stringify(json)} \n`)
        }
        catch (error) {
          // Handle error if the data is not valid JSON properly
          // Commented so the errors dont bother the connected peer 
          // console.log(`Failed to parse: ${JSON.stringify(error)} \n`)
        }
      })
    })
  }

  async open({ name, price, seller }) {
    // Create auction object
    const auction = { seller, lastBid: price, name, buyer: seller, open: true }

    // Get auction from database and check if it already exists
    // Ideally the key would be a random id and we would let peers to create autions with the same name
    const result = await this.bee.get(name)
    if (result) {
      throw new Error('That auction already exists')
    }

    await this.bee.put(name, auction)

    this.broadcast({ ...auction })
    return { auction }
  }

  async close({ name, peerKey }) {
    const result = await this.bee.get(name)
    if (!result) {
      throw new Error('That auction does not exist')
    }
    let auction = result.value

    if (auction.seller != peerKey) {
      throw new Error(`Unable to close auction`)
    }

    auction.open = false

    // Change to state
    await this.bee.put(name, auction)

    this.broadcast({ ...auction })
    return { auction }
  }

  async makeBid({ name, bid, buyer }) {
    // Get auction from database
    const result = await this.bee.get(name)

    if (!result) {
      throw new Error('That auction does not exist')
    } else if (!result.value.open) {
      throw new Error('That auction is closed already')
    }

    let auction = result.value
    if (Number(bid) <= Number(auction.lastBid)) {
      throw new Error(`You must bid higher. The current value is ${auction.lastBid}`)
    }

    auction.buyer = buyer
    auction.lastBid = bid

    // Update auction
    await this.bee.put(name, auction)

    this.broadcast({ name, bid, buyer })

    return { auction }
  }

  broadcast(message) {
    for (const p of this.peers) {
      p.write(JSON.stringify({ message }))
    }
  }

  async readStream() {
    for await (const { _key, value } of this.bee.createReadStream()) {
      console.log('List of auctions')
      console.log(`${JSON.stringify(value)} \n`)
    }
  }

  async peersCLI() {
    const publicKey = this.swarm.keyPair.publicKey.toString('hex')

    const menu = await this.cli.ask('Menu: \n 1. Open auction. \n 2. Make an offer. \n 3. Close auction. \n');

    let name = ''

    switch (menu) {
      case '1':
        name = await this.cli.ask('Object name: ')
        const price = await this.cli.ask('Price: ')
        try {
          await this.open({ name, price, seller: publicKey })
        } catch (error) {
          console.log(`${error} \n`)
        }
        await this.peersCLI()
        break
      case '2':
        name = await this.cli.ask('Object name: ')
        const bid = await this.cli.ask('Bid: ')
        try {
          await this.makeBid({ name, bid, buyer: publicKey })
        } catch (error) {
          console.log(`${error} \n`)
        }
        await this.peersCLI()
        break
      case '3':
        name = await this.cli.ask('Object name: ')
        try {
          await this.close({ name, peerKey: publicKey })
        } catch (error) {
          console.log(`${error} \n`)
        }
        await this.peersCLI()
      default:
        console.log('Invalid option. \n')
        await this.peersCLI()
    }
  }
}

new Auction()
