import { ethers } from "hardhat";
import { expect } from "chai";

describe("ERC20Token", function () {
    let owner: any;
    let addr1: any;
    let addr2: any;
    let token0: any;
    let token1: any;
    let uniswapV3Pool: any;

    beforeEach(async function () {
        // Obtenha a conta do proprietário e outras contas
        [owner, addr1, addr2] = await ethers.getSigners();

        // Deploy ambos os tokens
        token0 = await ethers.deployContract("ERC20Mock", ["Token0", "TK0", ethers.parseUnits("1000000", 18)]);
        token1 = await ethers.deployContract("ERC20Mock", ["Token1", "TK1", ethers.parseUnits("1000000", 18)]);

        const addressToken0 = await token0.getAddress();
        const addressToken1 = await token1.getAddress();

        // Deploy contract e cria os pools
        const uniswapV3Factory = await ethers.deployContract("UniswapV3Factory");
        await uniswapV3Factory.createPool(addressToken0, addressToken1, 500);
        const poolAddress = await uniswapV3Factory.getPool(addressToken0, addressToken1, 500);

        // Pega o pool  
        const UniswapV3Pool = await ethers.getContractFactory("UniswapV3Pool");
        uniswapV3Pool = UniswapV3Pool.attach(poolAddress);

        // Inicializa o pool em tick 0
        const sqrtPriceX96 = "79228162514264337593543950336";
        await uniswapV3Pool.initialize(sqrtPriceX96);

        // Permite transferir tokens para o pool
        const value = ethers.parseUnits("1000000", 18);
        await token0.approve(poolAddress, value);
        await token1.approve(poolAddress, value);

    });

    it("Should address tokens be correct", async function () {

        const addressToken0 = await token0.getAddress();
        const addressToken1 = await token1.getAddress();

        const retornoToken0 = await uniswapV3Pool.token0();
        expect(retornoToken0).to.be.equal(addressToken0);

        const retornoToken1 = await uniswapV3Pool.token1();
        expect(retornoToken1).to.be.equal(addressToken1);

    });

    it("Should allow transfer tokens from the owner to the pool", async function () {

        const addressPool = await uniswapV3Pool.getAddress();
        const value = ethers.parseUnits("1000000", 18);

        const allowance0 = await token0.allowance(owner, addressPool);
        expect(allowance0).to.be.equal(value);

        const allowance1 = await token1.allowance(owner, addressPool);
        expect(allowance1).to.be.equal(value);

    })

    it("Should mint a liquidity", async function () {

        const retorno = await uniswapV3Pool.mint(owner, -10, 10, 1000000000, "0x00")
        const receipt = await retorno.wait();
        const slot0 = await uniswapV3Pool.slot0();
        const liquidity = await uniswapV3Pool.liquidity();

        const addressPool = uniswapV3Pool.getAddress();
        const balance0 = await token0.balanceOf(addressPool);
        const balance1 = await token1.balanceOf(addressPool);

        expect(balance0).to.be.equal(499851);
        expect(balance1).to.be.equal(499851);

        // console.log(slot0);
        // console.log(liquidity);
        // console.log(balance0);
        // console.log(balance1);
        //        console.log(receipt.logs);

    })


    it("Should swap", async function () {

        // mint liquidity            
        await uniswapV3Pool.mint(owner, -10, 10, 1000000000, "0x00")

        const retorno = await uniswapV3Pool.swap(owner, false, 1500000, 79240000000000000000000000000n, "0x00")
        const receipt = await retorno.wait();

        //        console.log(receipt.logs);

        // // check for fees
        // const ownerAddress = await owner.getAddress();
        // const encodedValues = ethers.solidityPacked(
        //     ["address", "int24", "int24"],
        //     [ownerAddress, -10, 10]
        // );
        // const hash = ethers.keccak256(encodedValues);


        // // Get positions before burn
        // const retorno2 = await uniswapV3Pool.positions(hash);
        // console.log(retorno2);

        // // Burn
        // const txBurn = await uniswapV3Pool.burn(-10, 10, 1000000);
        // await txBurn.wait();

        // // Get positions before burn
        // const retorno3 = await uniswapV3Pool.positions(hash);
        // console.log(retorno3);


    })


    it("Should swap with 2 positions", async function () {

        // mint liquidity            
        await uniswapV3Pool.mint(owner, -20, 20, 1000000000, "0x00")
        await uniswapV3Pool.mint(owner, 10, 20, 1000000000, "0x00")

        const retorno = await uniswapV3Pool.swap(owner, false, -1497501, 179240000000000000000000000000n, "0x00")
        const receipt = await retorno.wait();
        const slot0 = await uniswapV3Pool.slot0();

        console.log(receipt.logs);
        // console.log(slot0);


        // // check for fees
        // const ownerAddress = await owner.getAddress();
        // const encodedValues = ethers.solidityPacked(
        //     ["address", "int24", "int24"],
        //     [ownerAddress, -10, 10]
        // );
        // const hash = ethers.keccak256(encodedValues);


        // // Get positions before burn
        // const retorno2 = await uniswapV3Pool.positions(hash);
        // console.log(retorno2);

        // // Burn
        // const txBurn = await uniswapV3Pool.burn(-10, 10, 1000000);
        // await txBurn.wait();

        // // Get positions before burn
        // const retorno3 = await uniswapV3Pool.positions(hash);
        // console.log(retorno3);


    })

});