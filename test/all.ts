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
        const txMintA = await uniswapV3Pool.mint(owner, -10, 10, 1_000_000_000, "0x00")
        const receiptMintA = await txMintA.wait();
        // console.log(receiptMintA.logs)

        const retorno = await uniswapV3Pool.swap(owner, false, 200000, 1461446703485210103287273052203988822378723970341n, "0x00")
        await retorno.wait()
        //console.log(receipt.logs);

        const fee1 = await uniswapV3Pool.feeGrowthGlobal1X128();
        console.log("Fee Growth Global", fee1);




        console.log("------- MINTING B ----------");
        const txMintB = await uniswapV3Pool.mint(owner, -20, 20, 3_000_000_000, "0x00")
        const receiptMintB = await txMintB.wait();
        // console.log(receiptMintB.logs);

        // console.log("--- INFO ABOUT TICKS ----");
        // const tickL = await uniswapV3Pool.ticks(-20);
        // console.log("Tick -20");
        // console.log(tickL);
        // const tickR = await uniswapV3Pool.ticks(20);
        // console.log("Tick 20");
        // console.log(tickR);




        // check for fees
        const ownerAddress = await owner.getAddress();

        let encodedValuesA = ethers.solidityPacked(
            ["address", "int24", "int24"],
            [ownerAddress, -10, 10]
        );
        let hashA = ethers.keccak256(encodedValuesA);

        // Get positions before burn
        let positionA = await uniswapV3Pool.positions(hashA);
        console.log(positionA);

        let encodedValuesB = ethers.solidityPacked(
            ["address", "int24", "int24"],
            [ownerAddress, -20, 20]
        );
        let hashB = ethers.keccak256(encodedValuesB);

        // Get positions before burn
        let positionB;
        positionB = await uniswapV3Pool.positions(hashB);
        console.log(positionB);


        console.log("--- BURNING B ---");
        const txBurnB = await uniswapV3Pool.burn(-20, 20, 1);
        await txBurnB.wait();

        // positionB = await uniswapV3Pool.positions(hashB);
        // console.log(positionB);

        // const txBurnA = await uniswapV3Pool.burn(-10, 10, 1);
        // await txBurnA.wait();

        // positionB = await uniswapV3Pool.positions(hashB);
        // console.log(positionB);

        // positionA = await uniswapV3Pool.positions(hashA);
        // console.log(positionA);


        // await uniswapV3Pool.mint(owner, 20, 60, 3000000000, "0x00")
        // const tickL = await uniswapV3Pool.ticks(20);
        // console.log("Tick 20");
        // console.log(tickL);
        // const tickR = await uniswapV3Pool.ticks(60);
        // console.log("Tick 60");
        // console.log(tickR);




        // // mint liquidity            
        // const retorno1 = await uniswapV3Pool.mint(owner, -30, 30, 1000000000, "0x00")
        // // mint liquidity            
        // const retorno2 = await uniswapV3Pool.mint(owner, -20, 60, 2000000000, "0x00")
        // // mint liquidity            
        // const retorno3 = await uniswapV3Pool.mint(owner, 10, 40, 3000000000, "0x00")


        // const retorno = await uniswapV3Pool.swap(owner, false, 11_000_000, 1461446703485210103287273052203988822378723970341n, "0x00")
        // const receipt = await retorno.wait();


        // await uniswapV3Pool.mint(owner, 20, 60, 3000000000, "0x00")
        // const tickL = await uniswapV3Pool.ticks(20);
        // console.log("Tick 20");
        // console.log(tickL);
        // const tickR = await uniswapV3Pool.ticks(60);
        // console.log("Tick 60");
        // console.log(tickR);


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

        // // mint liquidity            
        // await uniswapV3Pool.mint(owner, -10, 10, 1_000_000, "0x00")
        // await uniswapV3Pool.mint(owner, -10, 10, 1000000000, "0x00")


        // // Make a swap, generate fees, price goes to tick 19
        // const swap1 = await uniswapV3Pool.swap(owner, true, -1000000, 69189536546010397094424037896n, "0x00")
        // const receipt1 = await swap1.wait();
        // //        console.log(receipt1.logs);

        //        await uniswapV3Pool.mint(owner, 123450, 123460, 100000000, "0x00")
        //  const retorno = await uniswapV3Pool.getPosition(123450);
        //  console.log(retorno);

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

        // // Ver growth exterior to tick 10 e tick -10
        // const tickTen = await uniswapV3Pool.ticks(10);
        // console.log("ten", tickTen)
        // // Ver growth exterior to tick 10 e tick -10
        // const tickNegTen = await uniswapV3Pool.ticks(-10);
        // console.log("negTen", tickNegTen)

        // const feeGlobal = await uniswapV3Pool.feeGrowthGlobal1X128();
        // console.log("global", feeGlobal);
        // let above = 170311324643929700963418991019599n - 85240732913695085097575339161657n
        // console.log("global minus below", above);
        // let total = 170311324643929700963418991019599n - above;
        // console.log("total", total);


        // const burn1 = await uniswapV3Pool.burn(-10, 10, 1000000000);
        // const receiptBurn1 = await burn1.wait();


        // // Get positions after burn
        // const retorno3 = await uniswapV3Pool.positions(hash);
        // console.log(retorno3);


        // const swap2 = await uniswapV3Pool.swap(owner, true, -1297501, 1240000000000000000000000000n, "0x00")
        // const receipt2 = await swap2.wait();

        // const swap3 = await uniswapV3Pool.swap(owner, false, -1097501, 179240000000000000000000000000n, "0x00")
        // const receipt3 = await swap3.wait();

        // // create a position to check freeoutsidebeforeandafter
        // await uniswapV3Pool.mint(owner, -30, 30, 1000000000, "0x00")

        // const slot0 = await uniswapV3Pool.slot0();

        // const tick30 = await uniswapV3Pool.ticks(30);
        // console.log(tick30);

        // const tickminus30 = await uniswapV3Pool.ticks(-30);
        // console.log(tickminus30);

        // const feeGrowthGlobal1X128 = await uniswapV3Pool.feeGrowthGlobal1X128();
        // console.log(feeGrowthGlobal1X128)

        // const swap4 = await uniswapV3Pool.swap(owner, false, -10975010, 179240000000000000000000000000n, "0x00")
        // const receipt4 = await swap4.wait();


        // console.log(receipt.logs);
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