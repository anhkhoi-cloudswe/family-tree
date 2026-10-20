import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config();

export interface IStorageService {
  saveFile(file: Express.Multer.File): Promise<string>;
  deleteFile(fileUrl: string): Promise<void>;
}

export class LocalStorageService implements IStorageService {
  private uploadDir: string;

  constructor() {
    this.uploadDir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async saveFile(file: Express.Multer.File): Promise<string> {
    // File already saved by multer diskStorage
    return `/uploads/${file.filename}`;
  }

  async deleteFile(fileUrl: string): Promise<void> {
    try {
      const filename = path.basename(fileUrl);
      const filePath = path.join(this.uploadDir, filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (err) {
      console.error('Error deleting local file:', err);
    }
  }
}

export class S3StorageService implements IStorageService {
  private bucket: string;
  private region: string;

  constructor() {
    this.bucket = process.env.AWS_S3_BUCKET || '';
    this.region = process.env.AWS_REGION || 'ap-southeast-1';
  }

  async saveFile(file: Express.Multer.File): Promise<string> {
    // Khi triển khai AWS S3 trên production:
    // const s3 = new S3Client({ region: this.region, credentials: { ... } });
    // await s3.send(new PutObjectCommand({ Bucket: this.bucket, Key: file.filename, Body: fs.createReadStream(file.path) }));
    // return `https://${this.bucket}.s3.${this.region}.amazonaws.com/${file.filename}`;
    console.log(`[S3StorageService] Ready for AWS S3 upload: ${file.filename} -> Bucket: ${this.bucket}`);
    return `/uploads/${file.filename}`;
  }

  async deleteFile(fileUrl: string): Promise<void> {
    console.log(`[S3StorageService] Ready for AWS S3 delete: ${fileUrl}`);
  }
}

const storageType = process.env.STORAGE_TYPE || 'local';
export const storageService: IStorageService =
  storageType === 's3' && process.env.AWS_S3_BUCKET
    ? new S3StorageService()
    : new LocalStorageService();
