import { JsonRpcProvider } from "ethers";
import { config } from "./config.js";


export const provider = new JsonRpcProvider(config.l2RpcUrl);
