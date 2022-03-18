import React, { createContext, useEffect, useState } from "react";
import { ethers } from "ethers";
import {
  loanAbi,
  loanContractAddress,
  tokenAbi,
  tokenContractAddress,
} from "../utils/constants";

export const LendAndLoanContext = createContext();

export const LendAndLoanProvider = ({ children }) => {
  const [account, setAccount] = useState();
  const [networkId, setNetworkId] = useState();
  const [contractLiquidity, setContractLiquidity] = useState();
  const provider = new ethers.providers.Web3Provider(window.ethereum);
  const requestAccount = async () => {
    const accounts = await window.ethereum.request({
      method: "eth_requestAccounts",
    });
    setAccount(accounts[0]);
  };
  const getLoanContract = (providerOrSigner) => {
    const loanContract = new ethers.Contract(
      loanContractAddress,
      loanAbi,
      providerOrSigner
    );
    return loanContract;
  };
  const getTokenContract = (providerOrSigner) => {
    const tokenContract = new ethers.Contract(
      tokenContractAddress,
      tokenAbi,
      providerOrSigner
    );
    return tokenContract;
  };
  const getAccBalance = async () => {
    if (account) {
      let balance = await provider.getBalance(account);
      return Number(ethers.utils.formatEther(balance.toString())).toFixed(2);
    }
  };
  const getUserOngoingLend = async () => {
    const contract = getLoanContract(provider.getSigner());
    if (account) {
      const lends = await contract.getUserNotRetrieveLend();
      let arr = [];
      lends.forEach((item) => {
        if (item.lender != "0x0000000000000000000000000000000000000000") {
          arr.push(item);
        }
      });
      return arr;
    }
  };
  const getUserOngoingLoan = async () => {
    const contract = getLoanContract(provider.getSigner());
    if (account) {
      const loans = await contract.getUserOngoingLoans();
      return loans;
    }
  };
  const setContractTotalLiquidity = async () => {
    const contract = getLoanContract(provider);
    const res = await contract.totalLiquidity();
    setContractLiquidity(
      Number(ethers.utils.formatEther(res.toString())).toFixed(3)
    );
  };
  useEffect(async () => {
    const acc = await provider.listAccounts();
    if (acc) {
      setAccount(acc[0]);
    }
    setContractTotalLiquidity();
    setNetworkId(window.ethereum.networkVersion);
    window.ethereum.on("chainChanged", function (networkId) {
      // Time to reload your interface with the new networkId
      setNetworkId(networkId);
    });
    window.ethereum.on("accountsChanged", async function (acc) {
      if (acc) {
        // changed account
        setAccount(acc[0]);
      } else {
        // disconnect
        setAccount([]);
      }
    });
  }, []);
  return (
    <LendAndLoanContext.Provider
      value={{
        requestAccount,
        account,
        provider,
        getLoanContract,
        networkId,
        getTokenContract,
        getAccBalance,
        getUserOngoingLend,
        getUserOngoingLoan,
        contractLiquidity,
        setContractTotalLiquidity,
      }}
    >
      {children}
    </LendAndLoanContext.Provider>
  );
};
