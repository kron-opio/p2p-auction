# P2P Auction Solution

A simplified peer-to-peer (P2P) auction solution using Hyperswarm and Hypercores. Clients can open, bid on, and close auctions in a distributed network.

## Features

- Open, bid on, and close auctions
- Distributed notifications to all peers

## Technologies Used

- Hyperswarm
- Corestore
- Hyperbee
- Node.js

## Getting Started

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/kron-opio/p2p-auction.git
   cd p2p-auction
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a `.env` file:

   ```env
   TOPIC=your-topic-hex
   TOPIC_SECRET=your-topic-secret-hex
   ```

   ```js
   // Use this code to obtain another key pair
   const { DHT } = require('hyperdht')
   const b4a = require('b4a')

   // Generate a key pair
   const keyPair = DHT.keyPair();

   console.log('hypercore public key:', b4a.toString(keyPair.publicKey, 'hex'))
   console.log('hypercore secret key:', b4a.toString(keyPair.secretKey, 'hex'))
   ```

### Running the Auction Client

Start the auction client:

```bash
node index.js
```

### Using the Auction Client

- **Open an auction:** Enter the item ID and starting bid price.
- **Bid on an auction:** Enter the item ID and your bid price.
- **Close an auction:** Enter the item ID.

## Implementation Details

- **Hyperswarm:** For peer-to-peer networking.
- **Corestore and Hyperbee:** For data storage.
- **Hyperswarm RPC:** For node communication.

## What's Missing

- The interface could be improved with more detailed options. 
- Ideally auctions key's would be a random number instead of a name so peers would be able to create autions with the same name.
- Find a way to let the user input commands while at the same time read the stream of notifications.
- There are some issues with nofication between peer that could be smoother. (json parsing failing, formating of the messages)
- Unit tests.
- Logging for debugging tasks.

## Conclusion

This project provides a basic P2P auction system using the Holepunch stack. It lays a foundation for further development and experimentation with decentralized auction systems.
