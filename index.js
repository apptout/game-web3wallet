import "regenerator-runtime/runtime";
import { ethers } from "ethers";
import { parseUnits, hexlify } from "ethers/lib/utils";

let provider;
let signer;

document.addEventListener("DOMContentLoaded", loadApp());

async function loadApp() {
  provider = new ethers.providers.Web3Provider(window.ethereum, "any");
  signer = provider.getSigner();
  if (!signer) window.location.reload();
  await provider.send("eth_requestAccounts", []);
  processAction();
}

function processAction() {
  const urlParams = new URLSearchParams(window.location.search);
  const action = urlParams.get("action");
  const message = urlParams.get("message");
  const chainId = urlParams.get("chainId") || 1;
  const to = urlParams.get("to");
  const value = urlParams.get("value");
  const data = urlParams.get("data") || "";
  const gasLimit = urlParams.get("gasLimit") || undefined;
  const gasPrice = urlParams.get("gasPrice") || undefined;

  if (action === "sign" && message) {
    return signMessage(message);
  }

  if (action === "send" && to && value) {
    return sendTransaction(chainId, to, value, gasLimit, gasPrice, data);
  }

  displayResponse("Invalid URL");
}

async function sendTransaction(chainId, to, value, gasLimit, gasPrice, data) {
  try {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const network = await provider.getNetwork();
    if (network.chainId !== chainId) {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: `0x${parseInt(chainId, 10).toString(16)}` }], // chainId must be in hexadecimal numbers
      });
    }
    const from = await signer.getAddress();
    const tx = await signer.sendTransaction({
      from,
      to,
      value: parseUnits(value, "wei"),
      gasLimit: gasLimit ? hexlify(Number(gasLimit)) : gasLimit,
      gasPrice: gasPrice ? hexlify(Number(gasPrice)) : gasPrice,
      data: data ? data : "0x",
    });
    console.log({ tx });
    displayResponse("Transaction sent.<br><br><b>You MUST tap the button below to copy to clipboard.<br>Then, return to the WenBid app.</b>", tx.hash);
  } catch (error) {
    copyToClipboard("error");
    displayResponse("Transaction Failed.<br>Please make sure you have sufficient funds.");
  }
}

async function signMessage(message) {
  try {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const signature = await signer.signMessage(message);
    console.log({ signature });
    displayResponse("Signature complete.<br><br><b>You MUST tap the button below to copy to clipboard.<br>Then, return to the WenBid app.</b>", signature);
  } catch (error) {
    copyToClipboard("error");
    displayResponse("Signature Denied");
  }
}

async function copyToClipboard(response) {
  try {
    // focus from metamask back to browser
    window.focus();
    // wait to finish focus
    await new Promise((resolve) => setTimeout(resolve, 500));
    // copy tx hash to clipboard
    await navigator.clipboard.writeText(response);
    document.getElementById("response-button").innerHTML = "Copied.<br>Please return to WenBid.";
  } catch {
    // for metamask mobile android
    const input = document.createElement("input");
    input.type = "text";
    input.value = response;
    document.body.appendChild(input);
    input.select();
    document.execCommand("Tap here to copy to clipbboard (required)");
    input.style = "visibility: hidden";
    document.getElementById("response-button").innerHTML = "Copied. Please return to WenBid.";
  }
}

function displayResponse(text, response) {
  // display error or response
  const responseText = document.getElementById("response-text");
  responseText.innerHTML = text;
  responseText.className = "active";

  if (response) {
    // display button to copy tx.hash or signature
    const responseButton = document.getElementById("response-button");
    responseButton.className = "active";
    responseButton.innerHTML = "Tap Here To Copy";
    responseButton.onclick = () => copyToClipboard(response);
  }
}
