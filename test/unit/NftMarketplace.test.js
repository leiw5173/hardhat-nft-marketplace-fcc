const { assert, expect } = require("chai")
const { ethers, network, deployments, getNamedAccounts } = require("hardhat")
const { developmentChains } = require("../../helper-hardhat-config")

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("NFT Marketplace", function () {
          let nftMarketplace, basicNft, deployer, player
          const PRICE = ethers.utils.parseEther("0.1")
          const TOKEN_ID = 0

          beforeEach(async function () {
              deployer = (await getNamedAccounts()).deployer
              const accounts = await ethers.getSigners()
              player = accounts[1]
              await deployments.fixture(["all"])
              nftMarketplace = await ethers.getContract("NftMarketplace")
              basicNft = await ethers.getContract("BasicNft")
              await basicNft.mintNft()
              await basicNft.approve(nftMarketplace.address, TOKEN_ID)
              await nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)
          })

          it("lists and can be bought", async function () {
              const playerConnectedNftMarketplace = await nftMarketplace.connect(player)
              await playerConnectedNftMarketplace.buyItem(basicNft.address, TOKEN_ID, {
                  value: PRICE,
              })
              const newOwner = await basicNft.ownerOf(TOKEN_ID)
              const deployerProceeds = await nftMarketplace.getProceeds(deployer)
              assert.equal(newOwner.toString(), player.address)
              assert.equal(deployerProceeds.toString(), PRICE.toString())
          })

          it("can be canceled", async function () {
              await nftMarketplace.cancelItem(basicNft.address, TOKEN_ID)
              await expect(nftMarketplace.getListing(basicNft.address, TOKEN_ID) == null)
          })

          it("can be updated", async function () {
              const newPrice = ethers.utils.parseEther("0.2")
              await nftMarketplace.updateListing(basicNft.address, TOKEN_ID, newPrice)
              await expect(nftMarketplace.getListing(basicNft.address, TOKEN_ID)[0] == newPrice)
          })

          it("can withdraw proceeds", async function () {
              const playerConnectedNftMarketplace = await nftMarketplace.connect(player)
              await playerConnectedNftMarketplace.buyItem(basicNft.address, TOKEN_ID, {
                  value: PRICE,
              })
              const startingProceeds = await nftMarketplace.getProceeds(deployer)
              const startDeployerBalance = await nftMarketplace.provider.getBalance(deployer)
              const txResponse = await nftMarketplace.withdrawProceeds()
              const txReceipt = await txResponse.wait(1)
              const { gasUsed, effectiveGasPrice } = txReceipt
              const gasCost = gasUsed.mul(effectiveGasPrice)
              const endingDeployerBalance = await nftMarketplace.provider.getBalance(deployer)
              const endingProceeds = await nftMarketplace.getProceeds(deployer)
              assert.equal(endingProceeds, 0)
              assert.equal(
                  startDeployerBalance.sub(gasCost).toString(),
                  endingDeployerBalance.sub(startingProceeds).toString()
              )
          })
      })
