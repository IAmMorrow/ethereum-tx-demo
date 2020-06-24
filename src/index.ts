import axios from "axios";
import {AbiMember, ContractAbi} from "./types/ContractAbi";
import Web3Abi, { AbiCoder } from 'web3-eth-abi'

// little trick necessary because web3 1.x types are broken
const abi = (Web3Abi as unknown) as AbiCoder

const abiService = axios.create({
    baseURL: "http://api.etherscan.io",
    timeout: 3000,
});

async function getAbiForContract(address: string) {
    try {
        const { data } = await abiService.get(`api?module=contract&action=getabi&address=${address}&format=raw`)
        return data;
    } catch (error) {
        console.log("ERROR: ", error);
    }
}

function generateMethodSignature(functionAbi: AbiMember) {
    const paramList = functionAbi.inputs.map(input => input.type);

    return `${functionAbi.name}(${paramList.join(",")})`
}

function encodeParameters(functionAbi: AbiMember, params: any) {
    const encodedParameters = functionAbi.inputs.map(input => {
        const value = params[input.name];

        if (value === undefined) {
            throw new Error(`missing parameter "${input.name}" of type "${input.type}"`);
        }
        const encodedParameter = abi.encodeParameter(input.type, value);
        return Buffer.from(encodedParameter.slice(2), "hex");
    })


    return Buffer.concat(encodedParameters);
}

function serializeTx(contractAbi: ContractAbi, functionName: string, params: any) {
    const functionAbi = contractAbi.find(member => member.type === "function" && member.name === functionName);

    if (!functionAbi) {
        throw new Error(`no such function ${functionName} in the provided contract ABI`);
    }

    const functionSignature = generateMethodSignature(functionAbi);
    const encodedFunctionSignature = Buffer.from(abi.encodeFunctionSignature(functionSignature).slice(2), "hex");
    const encodedFunctionParameters = encodeParameters(functionAbi, params);

    return Buffer.concat([encodedFunctionSignature, encodedFunctionParameters]);
}

async function test() {
    // getting the contract ABI from etherscan
    const contractAbi = await getAbiForContract("0x6b175474e89094c44da98b954eedeac495271d0f");

    // building and serializing the transaction with the parameters
    const serializedTx = serializeTx(
        contractAbi,
        "transfer",
        {
            dst: "0x6b175474e89094c44da98b954eedeac495271d0f",
            wad: 255,
        }
    );

    console.log(serializedTx);
}

test().then(() => console.log("DONE"))