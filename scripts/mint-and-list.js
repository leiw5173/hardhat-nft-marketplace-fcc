const { ethers, network } = require("hardhat")
const { moveBlocks } = require("../utils/move-blocks")

async function mintAndList() {
    const nftMarketplace = await ethers.getContract("NftMarketplace")
    const basicNft = await ethers.getContract("BasicNft")
    const price = ethers.utils.parseEther("0.1")
    console.log("Minting...")
    const mintTx = await basicNft.mintNft()
    const mintReceipt = await mintTx.wait(1)
    const tokenId = mintReceipt.events[0].args.tokenId
    console.log("Approving Nft...")
    const approveTx = await basicNft.approve(nftMarketplace.address, tokenId)
    await approveTx.wait(1)
    console.log("Listing Nft...")
    const tx = await nftMarketplace.listItem(basicNft.address, tokenId, price)
    await tx.wait(1)
    console.log("Listed!")

    if (network.config.chainId == "31337") {
        await moveBlocks(1, (sleepAmount = 1000))
    }
}

mintAndList()
    .then(() => process.exit(0))
    .catch((e) => {
        console.log(e)
        process.exit(1)
    })
