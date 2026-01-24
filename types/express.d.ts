declare global {
    namespace Express {
        namespace Multer {
            interface File {
                fieldname: string;
                originalname: string;
                encoding: string;
                mimetype: string;
                size: number;
                destination: string;
                filename: string;
                path: string;
                buffer: Buffer;
            }
        }

        interface Request {
            file?: Express.Multer.File;
            files?: { [fieldname: string]: Express.Multer.File[] };
        }
    }
}

export { };
