import * as crypto from "crypto";

const sha512 = (input: string) =>
  crypto.createHash('sha512').update(input, 'utf-8').digest('hex')

export const HashUtils = {
  sha512
}
