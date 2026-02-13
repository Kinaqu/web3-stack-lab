declare module "circomlibjs" {
  export function buildPoseidon(): Promise<any>;
}

declare module "circom_tester" {
  export const wasm: any;
}
