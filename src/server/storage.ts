import OSS from "ali-oss";
import { env } from "./env";

type OSSClient = {
  signatureUrl: (
    objectName: string,
    options: {
      method: "PUT";
      expires: number;
      "Content-Type": string;
    },
  ) => string | Promise<string>;
};

type OSSConstructor = new (options: {
  accessKeyId: string;
  accessKeySecret: string;
  endpoint: string;
  bucket: string;
  region: string;
  secure: boolean;
}) => OSSClient;

const OSSClientConstructor = OSS as unknown as OSSConstructor;

export const ossClient = new OSSClientConstructor({
  accessKeyId: env.OSS_ACCESS_KEY_ID,
  accessKeySecret: env.OSS_ACCESS_KEY_SECRET,
  endpoint: env.OSS_ENDPOINT,
  bucket: env.OSS_BUCKET,
  region: env.OSS_REGION,
  secure: true,
});

export function getOSSObjectUrl(objectName: string): string {
  return `https://${env.OSS_BUCKET}.${env.OSS_ENDPOINT}/${objectName}`;
}
