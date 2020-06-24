export type AbiInput = {
    internalType: string,
    name: string,
    type: string,
}

export type AbiOutput = {

}

export type AbiMember = {
    constant: boolean,
    inputs: AbiInput[],
    name: string,
    outputs: AbiOutput[],
    payable: boolean,
    stateMutability: string,
    type: string,
}

export type ContractAbi = AbiMember[]