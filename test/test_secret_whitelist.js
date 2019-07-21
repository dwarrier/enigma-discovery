const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");
const { Enigma, utils, eeConstants } = require("enigma-js/node");

var EnigmaContract;
if (
  typeof process.env.SGX_MODE === "undefined" ||
  (process.env.SGX_MODE != "SW" && process.env.SGX_MODE != "HW")
) {
  console.log(`Error reading ".env" file, aborting....`);
  process.exit();
} else if (process.env.SGX_MODE == "SW") {
  EnigmaContract = require("../build/enigma_contracts/EnigmaSimulation.json");
} else {
  EnigmaContract = require("../build/enigma_contracts/Enigma.json");
}
const EnigmaTokenContract = require("../build/enigma_contracts/EnigmaToken.json");

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

let enigma = null;
let contractAddr;

contract("SecretWhitelist", accounts => {
  before(function() {
    enigma = new Enigma(
      web3,
      EnigmaContract.networks["4447"].address,
      EnigmaTokenContract.networks["4447"].address,
      "http://localhost:3346",
      {
        gas: 4712388,
        gasPrice: 100000000000,
        from: accounts[0]
      }
    );
    enigma.admin();

    contractAddr = fs.readFileSync("test/secret_whitelist.txt", "utf-8");
  });

  let task;

  // ADDING FIRST SECRET
  it("should execute compute task to add the first secret", async () => {
    let taskFn = "add_secret_for_testator(address,string,string)";
    let taskArgs = [
      [accounts[1], "address"],
      ["first_secret_name", "string"],
      ["first_secret_content", "string"]
    ];
    let taskGasLimit = 500000;
    let taskGasPx = utils.toGrains(1);
    task = await new Promise((resolve, reject) => {
      enigma
        .computeTask(
          taskFn,
          taskArgs,
          taskGasLimit,
          taskGasPx,
          accounts[0],
          contractAddr
        )
        .on(eeConstants.SEND_TASK_INPUT_RESULT, result => resolve(result))
        .on(eeConstants.ERROR, error => reject(error));
    });
  });

  it("should get the pending task", async () => {
    task = await enigma.getTaskRecordStatus(task);
    expect(task.ethStatus).to.equal(1);
  });

  it("should get the confirmed task", async () => {
    do {
      await sleep(1000);
      task = await enigma.getTaskRecordStatus(task);
      process.stdout.write(
        "Waiting. Current Task Status is " + task.ethStatus + "\r"
      );
    } while (task.ethStatus !== 2);
    expect(task.ethStatus).to.equal(2);
    process.stdout.write(
      "Completed. Final Task Status is " + task.ethStatus + "\n"
    );
  }, 10000);

  // ADDING SECOND SECRET
  it("should execute compute task to add the second secret", async () => {
    let taskFn = "add_secret_for_testator(address,string,string)";
    let taskArgs = [
      [accounts[1], "address"],
      ["second_secret_name", "string"],
      ["second_secret_content", "string"]
    ];
    let taskGasLimit = 500000;
    let taskGasPx = utils.toGrains(1);
    task = await new Promise((resolve, reject) => {
      enigma
        .computeTask(
          taskFn,
          taskArgs,
          taskGasLimit,
          taskGasPx,
          accounts[0],
          contractAddr
        )
        .on(eeConstants.SEND_TASK_INPUT_RESULT, result => resolve(result))
        .on(eeConstants.ERROR, error => reject(error));
    });
  });

  it("should get the pending task", async () => {
    task = await enigma.getTaskRecordStatus(task);
    expect(task.ethStatus).to.equal(1);
  });

  it("should get the confirmed task", async () => {
    do {
      await sleep(1000);
      task = await enigma.getTaskRecordStatus(task);
      process.stdout.write(
        "Waiting. Current Task Status is " + task.ethStatus + "\r"
      );
    } while (task.ethStatus !== 2);
    expect(task.ethStatus).to.equal(2);
    process.stdout.write(
      "Completed. Final Task Status is " + task.ethStatus + "\n"
    );
  }, 10000);

  // GET ID FOR BOTH SECRETS
  it("should execute compute task to get secret IDs", async () => {
    let taskFn = "get_current_secret_ids_for_testator(address)";
    let taskArgs = [[accounts[1], "address"]];
    let taskGasLimit = 500000;
    let taskGasPx = utils.toGrains(1);
    task = await new Promise((resolve, reject) => {
      enigma
        .computeTask(
          taskFn,
          taskArgs,
          taskGasLimit,
          taskGasPx,
          accounts[0],
          contractAddr
        )
        .on(eeConstants.SEND_TASK_INPUT_RESULT, result => resolve(result))
        .on(eeConstants.ERROR, error => reject(error));
    });
  });

  it("should get the pending task", async () => {
    task = await enigma.getTaskRecordStatus(task);
    expect(task.ethStatus).to.equal(1);
  });

  it("should get the confirmed task", async () => {
    do {
      await sleep(1000);
      task = await enigma.getTaskRecordStatus(task);
      process.stdout.write(
        "Waiting. Current Task Status is " + task.ethStatus + "\r"
      );
    } while (task.ethStatus !== 2);
    expect(task.ethStatus).to.equal(2);
    process.stdout.write(
      "Completed. Final Task Status is " + task.ethStatus + "\n"
    );
  }, 10000);

  it("should get the result and verify the computation is correct", async () => {
    task = await new Promise((resolve, reject) => {
      enigma
        .getTaskResult(task)
        .on(eeConstants.GET_TASK_RESULT_RESULT, result => resolve(result))
        .on(eeConstants.ERROR, error => reject(error));
    });
    expect(task.engStatus).to.equal("SUCCESS");
    task = await enigma.decryptTaskResult(task);
    console.log(task);
    // TODO: Not sure how to decode a returned Vec.
    /*
    expect(
      web3.eth.abi.decodeParameters(
        [
          {
            type: "address",
            name: "richestMillionaire"
          }
        ],
        task.decryptedOutput
      ).richestMillionaire
    ).to.equal(accounts[2]);

       */
  });

  // REMOVING FIRST SECRET
  // TODO
});
